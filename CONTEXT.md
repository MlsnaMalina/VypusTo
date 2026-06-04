# VypusTo — Session Context

> Tento soubor je handoff dokument pro pokračování práce v nové Claude session.
> Přečíst před zahájením jakékoliv práce na projektu.

---

## Co je VypusTo

Česká rodinná PWA pro správu úkolů — **single-file HTML prototype** bez build stepu.
Cílová skupina: česká rodina, primárně žena/máma jako hlavní uživatelka.
Styl: doodle art, handwritten prvky (Caveat font), raspberry primary color `#b93066`.

**Soubor:** `C:\Users\merit\OneDrive\Desktop\AI\Ostatní\ToDov2\prototype\index.html`
**Live URL:** https://vypus-to.vercel.app
**GitHub:** https://github.com/MlsnaMalina/VypusTo
**Git branch:** `master`
**Poslední commit:** `59e0bd6` — "Fix crash in noteHTML: normalize unknown tags from old Firestore data"

### Preview server
`.claude/launch.json` → `npx serve -p 3000 prototype` (worktree `cranky-elbakyan-f0d134`, port 3002)

⚠️ **DŮLEŽITÉ:** Preview server běží z worktree `.claude/worktrees/cranky-elbakyan-f0d134/prototype/`.
Po každé editaci hlavního souboru je nutné ho synchronizovat:
```bash
cp "C:/Users/merit/OneDrive/Desktop/AI/Ostatní/ToDov2/prototype/index.html" \
   "C:/Users/merit/OneDrive/Desktop/AI/Ostatní/ToDov2/.claude/worktrees/cranky-elbakyan-f0d134/prototype/index.html"
```

---

## Design systém

### Barvy
```css
--primary:     #b93066;   /* raspberry */
--primary-lt:  #fef0f6;
--bg:          #ffffff;
--bg-off:      #f7f7f7;
--border:      #EBEBEB;
--ink:         #111111;
--ink-2:       #555555;
--ink-3:       #999999;
--c-prace:     #1C3557;  --c-prace-bg:  #EDF1F6;
--c-rodina:    #C4614A;  --c-rodina-bg: #F9EDE9;
--c-dom:       #4A7C59;  --c-dom-bg:    #EBF3EE;
--c-ost:       #7A6E8A;  --c-ost-bg:    #F0EEF3;
```
Barvy kategorií jsou uživatelsky konfigurovatelné přes Nastavení → localStorage `vypusto-settings-v2`.

### Fonty
- `--f-display`: **Syne 800** — hlavní nadpisy
- `--f-hand`:    **Caveat 700** — handwritten labels
- `--f-mono`:    **IBM Plex Mono** — časy, počty, timestamps
- `--f-body`:    **Space Grotesk** — tělo textu

---

## Architektura

- `< 720px` → mobile (bottom nav)
- `≥ 720px` → desktop (sidebar 232px, bottom nav skryt)

⚠️ **CSS cascade trap:** Pravidla, která mají přepsat base styly na desktopu, musí být ve **DESKTOP OVERRIDES bloku na konci stylesheetu** (kolem řádku 1628). Pravidla na začátku souboru (řádky 91–124) jsou přepísána base styly s vyšší source-order prioritou.

### Views
| View ID | Název | Stav |
|---------|-------|------|
| `v-dnes` | Dnes | ✅ plně implementován |
| `v-mesic` | Měsíc | ✅ focus strip + full grid |
| `v-ukoly` | Úkoly | ✅ mobile groups + desktop columns |
| `v-poznamky` | Poznámky | ✅ implementován |
| `v-narozeniny` | Narozeniny | ✅ tiles + inline tabulka + výročí |
| `v-opak` | Opakující se | ✅ implementován |
| `v-nastav` | Nastavení | ✅ barvy kategorií |

---

## Data model

### localStorage klíče (aktuální)
| Klíč | Obsah |
|------|-------|
| `vypusto-tasks-v2` | tasks |
| `vypusto-bdays-v2` | birthdays |
| `vypusto-notes-v2` | notes |
| `vypusto-rec-v2` | recurringEvents |
| `vypusto-events-v2` | calEvents |
| `vypusto-settings-v2` | settings (category colors) |
| `vypusto-remember-v2` | dismissed remember-popup IDs |

### Narozeniny (aktuální formát)
```js
birthdays = [{
  id: number,
  firstName: string,
  lastName: string,
  day: number, month: number,
  yearBorn: number | null,
  anniversaries: [{ title, day, month, year }],
  namedayOverride: null | false | { day, month }
}]
```

### Poznámky
```js
notes = [{
  id, title, body,
  tag: 'prace' | 'rodina' | 'domacnost' | 'ostatni',
  pinned: bool,
  createdAt: 'YYYY-MM-DD'
}]
```
⚠️ Staré poznámky z Firestore mohou mít jiný tag — `noteHTML()` normalizuje neznámé tagy na 'ostatni'.

### Nastavení
```js
settings = {
  colors: { prace: '#hex', rodina: '#hex', domacnost: '#hex', ostatni: '#hex' }
}
```

---

## Firebase / Firestore

- Firebase project ID: `vypusto`
- Auth: email/password (compat SDK v10.12.0)
- Struktura: `users/{uid}/data/{docName}` — dokumenty: `tasks`, `birthdays`, `notes`, `recurring`, `calEvents`
- Uložení: `.set({ items: [...] })` (fire-and-forget, `.catch(console.warn)`)
- Načítání: one-time `.get()` (ne onSnapshot), `merge()` funkce — Firestore > localStorage fallback

---

## Klíčové funkce

| Funkce | Popis |
|--------|-------|
| `setView(v)` | Přepíná view, spouští render + skrývá/zobrazuje FAB |
| `renderDnes(animate)` | Dnes view |
| `renderMesic()` | Focus strip + full grid |
| `renderUkoly(animate)` | Dispatcher mobile/desktop |
| `renderNarozeniny()` | Tile grid + inline tabulka |
| `renderPoznamky()` | Poznámky view |
| `renderSettings()` | Nastavení view |
| `saveNote()` | Uloží novou poznámku, volá `setView('poznamky')` |
| `noteHTML(n)` | Generuje HTML pro poznámkovou kartu (normalizuje tag) |
| `openBdayEdit(id)` | Editace kontaktu (prefill + výročí) |
| `checkEndedEvents()` | Zkontroluje skončené dnešní události → remember popup |
| `openRememberPopup(eventId)` | Popup "Mám si zapamatovat?" |
| `saveRememberAnniversary()` | Uloží skončenou událost jako výročí ke kontaktu |
| `applySettingsColors()` | Aplikuje barvy z settings na CSS vars + CAT objekt |
| `heartStr(year)` | Vrátí ❤️×min(roky,5) pro výročí |
| `loadAllData()` | Načte data z Firestore / localStorage |
| `initAppUI()` | Inicializuje UI po přihlášení |

---

## Implementováno (aktuální stav)

1. Základní task management (CRUD, done/undo, filtery)
2. Kalendář (Měsíc view — focus strip + full grid s eventos, úkoly, narozky, svátky)
3. Day sheet (klik na den → overlay s detailem)
4. Narozeniny — tiles, inline tabulka, výročí, srdíčka (❤️×roky)
5. Poznámky — karty, filtry, pin, doodle u pinned, action overlay
6. Opakující se události
7. Nastavení — barvy kategorií (color pickers, CSS vars, localStorage)
8. "Mám si zapamatovat?" popup — po skončení dnešní události → uložit jako výročí
9. Service Worker (v4) — network-first pro HTML, cache-first pro assets
10. Firebase Auth + Firestore sync
11. PWA manifest

---

## Opravené bugy (tato session)

1. **Bottom nav viditelný na desktopu** — CSS cascade bug: base `.bottom-nav { display: flex }` (řádek ~792) přepisoval media query `.bottom-nav { display: none }` (řádek ~111) protože přišel NÍŽE v souboru. Fix: přidat pravidlo do DESKTOP OVERRIDES bloku na konci (řádek ~1633).

2. **FAB tlačítko (note-add-fab) překryté bottom navem** — důsledek bugu výše. Po fixu nav zmizí na desktopu a FAB je na `bottom: 32px` volně viditelný.

3. **Poznámky se nezobrazovaly po uložení** — `noteHTML()` crashoval s `TypeError: Cannot read properties of undefined (reading 'label')` když `n.tag` nebyl v CAT objektu (staré Firestore data). Fix: normalizovat neznámý tag na 'ostatni'.

4. **`saveNote()` volá `setView('poznamky')`** místo bare `renderPoznamky()` — robustnější, garantuje aktivaci view.

---

## Co chybí / další kroky

- Swipe gestures pro přepínání měsíců (mobile)
- Dark mode
- PWA manifest ikony (favicon.ico 404)
- Napravit `<meta name="apple-mobile-web-app-capable">` deprecation warning → změnit na `mobile-web-app-capable`
- Editace/smazání kalendářních událostí přes day sheet
- Sdílení úkolů s rodinou (multi-user)
