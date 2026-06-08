/* ─── VypusTo — Server-side Push Notification Scheduler ─────────────────
   Triggered every 5 minutes by Vercel Cron.
   Reads calEvents from Firestore, finds due reminders, sends FCM pushes.

   Required environment variables (set in Vercel dashboard):
     FIREBASE_SERVICE_ACCOUNT  — base64-encoded service account JSON
     CRON_SECRET               — arbitrary secret string (also set in vercel.json)
   ─────────────────────────────────────────────────────────────────────── */

const admin = require('firebase-admin');

/* Singleton: initialise Admin SDK once per cold-start */
let initialised = false;
function ensureAdmin() {
  if (initialised) return;
  const sa = JSON.parse(
    Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT, 'base64').toString('utf8')
  );
  admin.initializeApp({ credential: admin.credential.cert(sa) });
  initialised = true;
}

/* How many seconds before the event each reminder should fire */
const OFFSETS_S = { '1d': 86400, '1h': 3600, '15m': 900, '1m': 60 };

/* Labels sent as notification body prefix */
const LABELS = {
  '1d':  '📅 Událost zítra',
  '1h':  '⏰ Za hodinu',
  '15m': '⚡ Za 15 minut',
  '1m':  '🔔 Začíná za minutu!',
};

/* Fire window: [-30 s … +270 s] around the target moment.
   Cron fires every 5 min (300 s); window covers one full interval with margin. */
const WINDOW_EARLY_S = 30;
const WINDOW_LATE_S  = 270;

const APP_URL  = 'https://vypus-to.vercel.app';
const ICON_URL = `${APP_URL}/icon-192.png`;

module.exports = async (req, res) => {
  /* ── Security: verify Vercel cron secret ── */
  const authHeader = req.headers['authorization'] || '';
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    ensureAdmin();
    const db        = admin.firestore();
    const messaging = admin.messaging();
    const nowS      = Math.floor(Date.now() / 1000);

    /* ── Iterate over every user ── */
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
        const evSnap = await userRef.collection('data').doc('events').get();
        if (!evSnap.exists) { skipped++; return; }
        const events = evSnap.data()?.items || [];

        /* Read already-fired reminders */
        const firedSnap = await userRef.collection('data').doc('fired-reminders').get();
        const fired     = firedSnap.exists ? (firedSnap.data()?.items || {}) : {};
        const newFired  = { ...fired };
        let firedChanged = false;

        for (const ev of events) {
          if (!ev.reminders?.length || !ev.date) continue;

          /* Parse event datetime → Unix seconds */
          const [ey, em, ed] = ev.date.split('-').map(Number);
          const [eh, emin]   = (ev.time || '09:00').split(':').map(Number);
          const evMs = new Date(ey, em - 1, ed, eh, emin, 0, 0).getTime();
          if (isNaN(evMs)) continue;
          const evS = evMs / 1000;

          /* '1m' is always auto-added when any reminder exists */
          const rtypes = [...new Set([...ev.reminders, '1m'])];

          for (const rtype of rtypes) {
            const key = `${ev.id}-${rtype}`;
            if (newFired[key]) continue;           // already sent

            const targetS = evS - (OFFSETS_S[rtype] || 0);
            const diff    = nowS - targetS;        // seconds past target

            if (diff >= -WINDOW_EARLY_S && diff < WINDOW_LATE_S) {
              const timeStr = ev.time     ? ` · ${ev.time}`     : '';
              const locStr  = ev.location ? ` · ${ev.location}` : '';
              const body    = (LABELS[rtype] || '') + timeStr + locStr;

              await messaging.send({
                token,
                notification: {
                  title: `VypusTo — ${ev.title}`,
                  body,
                },
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

              newFired[key] = new Date().toISOString().split('T')[0];
              firedChanged = true;
              sent++;
            }
          }
        }

        if (firedChanged) {
          await userRef.collection('data').doc('fired-reminders')
            .set({ items: newFired }, { merge: true });
        }
      } catch (err) {
        console.error(`[send-reminders] uid=${userRef.id}`, err.message);
        errors++;
      }
    }));

    return res.status(200).json({
      ok: true, sent, skipped, errors,
      ts: new Date().toISOString(),
    });

  } catch (err) {
    console.error('[send-reminders] fatal', err);
    return res.status(500).json({ error: err.message });
  }
};
