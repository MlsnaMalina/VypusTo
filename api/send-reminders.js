/* ─── VypusTo — Server-side Push Notification Scheduler ─────────────────
   Two modes, both triggered by the same endpoint:

   1. DAILY BRIEFING (Vercel cron, once per day at 07:00 UTC)
      Sends one notification per event for events happening TODAY or TOMORROW.
      Briefing key: `${id}-briefing-${utcDate}` — naturally resets each day
      so the same event gets a fresh briefing the next morning.
      Notification body example: "📅 Dnes · 14:00 · Praha"

   2. PRECISE REMINDERS (optional external hourly cron via cron-job.org)
      Fires the per-event reminders (1d / 1h / 15m / 1m) within ±5 min of
      their target time. Works alongside the daily briefing — both share
      the same fired-reminders doc so there are no double-sends.
      Notification body example: "⏰ Za hodinu · 14:00"

   Required env vars (Vercel dashboard → Settings → Environment Variables):
     FIREBASE_SERVICE_ACCOUNT  — base64-encoded service account JSON
     CRON_SECRET               — arbitrary secret (sent by Vercel cron
                                 automatically; add as Authorization header
                                 on cron-job.org for external cron)
   ─────────────────────────────────────────────────────────────────────── */

const admin = require('firebase-admin');

let initialised = false;
function ensureAdmin() {
  if (initialised) return;
  const sa = JSON.parse(
    Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT, 'base64').toString('utf8')
  );
  admin.initializeApp({ credential: admin.credential.cert(sa) });
  initialised = true;
}

/* Seconds before the event each reminder fires */
const OFFSETS_S = { '1d': 86400, '1h': 3600, '15m': 900, '1m': 60 };

const LABELS = {
  '1d':  '📅 Událost zítra',
  '1h':  '⏰ Za hodinu',
  '15m': '⚡ Za 15 minut',
  '1m':  '🔔 Začíná za minutu!',
};

/* Precise-reminder window: fire if cron lands within ±5 min of target.
   Requires the external cron (cron-job.org) to call this endpoint every
   5 minutes — the daily Vercel cron alone cannot hit these windows. */
const PRECISE_EARLY_S = 300;
const PRECISE_LATE_S  = 300;

/* ── Europe/Prague timezone helpers ──────────────────────────────────────
   Vercel functions run in UTC, but event dates/times in Firestore are
   Prague local time. Without conversion every reminder fires 1–2 h late. */
function pragueOffsetMs(utcMs) {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Prague', hour12: false,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
  const p = Object.fromEntries(
    dtf.formatToParts(new Date(utcMs)).map(x => [x.type, x.value])
  );
  const asUtc = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour % 24, +p.minute, +p.second);
  return asUtc - utcMs;
}

/* Event date+time (Prague local) → true UTC epoch ms */
function pragueEpochMs(dateStr, timeStr) {
  const [y, m, d]  = dateStr.split('-').map(Number);
  const [hh, mm]   = (timeStr || '09:00').split(':').map(Number);
  if ([y, m, d, hh, mm].some(isNaN)) return NaN;
  const utcGuess = Date.UTC(y, m - 1, d, hh, mm);
  return utcGuess - pragueOffsetMs(utcGuess);
}

/* Current date string (YYYY-MM-DD) in Prague */
function pragueDateStr(ms) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Prague' })
    .format(new Date(ms));
}

const APP_URL  = 'https://vypus-to.vercel.app';
const ICON_URL = `${APP_URL}/icon-192.png`;

module.exports = async (req, res) => {
  const authHeader = req.headers['authorization'] || '';
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    ensureAdmin();
    const db        = admin.firestore();
    const messaging = admin.messaging();
    const nowMs     = Date.now();
    const nowS      = Math.floor(nowMs / 1000);

    /* Prague-local date strings — event dates are stored in Prague time */
    const todayStr    = pragueDateStr(nowMs);
    const tomorrowStr = pragueDateStr(nowMs + 86400000);

    const userDocs = await db.collection('users').listDocuments();
    let sent = 0, skipped = 0, errors = 0;

    await Promise.all(userDocs.map(async userRef => {
      try {
        /* Read FCM token */
        const tokenSnap = await userRef.collection('data').doc('fcm-token').get();
        if (!tokenSnap.exists) { skipped++; return; }
        const { token } = tokenSnap.data();
        if (!token) { skipped++; return; }

        /* Read calendar events */
        const evSnap = await userRef.collection('data').doc('calEvents').get();
        if (!evSnap.exists) { skipped++; return; }
        const events = evSnap.data()?.items || [];

        /* Read already-fired reminders */
        const firedSnap = await userRef.collection('data').doc('fired-reminders').get();
        const fired     = firedSnap.exists ? (firedSnap.data()?.items || {}) : {};
        const newFired  = { ...fired };
        let firedChanged = false;

        for (const ev of events) {
          if (!ev.date) continue;

          /* Parse event datetime (Prague local) → Unix seconds */
          const evMs = pragueEpochMs(ev.date, ev.time);
          if (isNaN(evMs)) continue;
          const evS = evMs / 1000;

          const timeStr = ev.time     ? ev.time          : '';
          const locStr  = ev.location ? ` · ${ev.location}` : '';

          /* ── MODE 1: DAILY BRIEFING ──────────────────────────────────
             One notification per event for today's and tomorrow's events.
             The briefing key includes the UTC date so each day starts fresh.
             Skip events that already passed more than 15 minutes ago.     */
          const isToday    = ev.date === todayStr;
          const isTomorrow = ev.date === tomorrowStr;

          if ((isToday && evS > nowS - 900) || isTomorrow) {
            const briefKey = `${ev.id}-briefing-${todayStr}`;

            if (!newFired[briefKey]) {
              const when   = isTomorrow ? 'Zítra' : 'Dnes';
              const atTime = timeStr ? ` · ${timeStr}` : '';
              const body   = `📅 ${when}${atTime}${locStr}`;

              try {
                await messaging.send({
                  token,
                  notification: { title: `VypusTo — ${ev.title}`, body },
                  webpush: {
                    notification: {
                      icon:  ICON_URL,
                      badge: `${APP_URL}/favicon-32.png`,
                      tag:   `vypusto-brief-${ev.id}`,
                    },
                    fcmOptions: { link: APP_URL },
                    data: { tag: `vypusto-brief-${ev.id}`, url: APP_URL },
                  },
                });
                newFired[briefKey] = todayStr;
                firedChanged = true;
                sent++;
              } catch (e) {
                console.error(`[send-reminders] briefing uid=${userRef.id} ev=${ev.id}:`, e.message);
                errors++;
              }
            }
          }

          /* ── MODE 2: PRECISE REMINDERS (external hourly cron) ────────
             Fires per-event reminders within ±5 min of their target time.
             Useful when cron-job.org calls this endpoint every hour.
             Key `${id}-${rtype}` is permanent — fires once per event.    */
          const rtypes = ev.reminders?.length
            ? [...new Set([...ev.reminders, '1m'])]
            : ['1m'];

          for (const rtype of rtypes) {
            const key = `${ev.id}-${rtype}`;
            if (newFired[key]) continue;

            const targetS = evS - (OFFSETS_S[rtype] || 0);
            const diff    = nowS - targetS;   // positive = past the target

            if (diff >= -PRECISE_EARLY_S && diff < PRECISE_LATE_S) {
              const body = (LABELS[rtype] || '') + (timeStr ? ` · ${timeStr}` : '') + locStr;

              try {
                await messaging.send({
                  token,
                  notification: { title: `VypusTo — ${ev.title}`, body },
                  webpush: {
                    notification: {
                      icon:               ICON_URL,
                      badge:              `${APP_URL}/favicon-32.png`,
                      tag:                `vypusto-${ev.id}-${rtype}`,
                      requireInteraction: rtype === '1m',
                    },
                    fcmOptions: { link: APP_URL },
                    data: {
                      tag:                `vypusto-${ev.id}-${rtype}`,
                      url:                APP_URL,
                      requireInteraction: String(rtype === '1m'),
                    },
                  },
                });
                newFired[key] = todayStr;
                firedChanged = true;
                sent++;
              } catch (e) {
                console.error(`[send-reminders] precise uid=${userRef.id} ev=${ev.id} rtype=${rtype}:`, e.message);
                errors++;
              }
            }
          }
        }

        if (firedChanged) {
          await userRef.collection('data').doc('fired-reminders')
            .set({ items: newFired }, { merge: true });
        }
      } catch (err) {
        console.error(`[send-reminders] user uid=${userRef.id}:`, err.message);
        errors++;
      }
    }));

    return res.status(200).json({
      ok: true, sent, skipped, errors,
      ts: new Date().toISOString(),
    });

  } catch (err) {
    console.error('[send-reminders] fatal:', err);
    return res.status(500).json({ error: err.message });
  }
};
