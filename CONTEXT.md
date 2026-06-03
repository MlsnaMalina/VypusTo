# VypusTo — Session Context

> Tento soubor je handoff dokument pro pokračování práce v nové Claude session.
> Přečíst před zahájením jakékoliv práce na projektu.

---

## Co je VypusTo

Česká rodinná PWA pro správu úkolů — **single-file HTML prototype** bez build stepu.
Cílová skupina: česká rodina, primárně žena/máma jako hlavní uživatelka.
Styl: doodle art, handwritten prvky (Caveat font), raspberry primary color `#b93066`.

**Soubor:** `C:\Users\merit\OneDrive\Desktop\AI\Ostatní\ToDov2\prototype\index.html`
**Preview server:** `.claude/launch.json` → `npx serve -p 3001 prototype` (worktree `beautiful-bardeen-e9e575`, port 3001)
**Git branch:** `master`
**Poslední commit:** `3050eef` — "Tabulka kontaktů: čitelný font + auto-svátky + editovatelné svátek pole"

### Git worktree
- Aktivní worktree: `claude/beautiful-bardeen-e9e575`
- Pracovní soubor: `.claude/worktrees/beautiful-bardeen-e9e575/prototype/index.html`
- Workflow: editovat hlavní soubor → `cp` do worktree → commit v worktree → commit v main

```bash
# sync main → worktree
cp "C:/Users/merit/OneDrive/Desktop/AI/Ostatní/ToDov2/prototype/index.html" \
   "C:/Users/merit/OneDrive/Desktop/AI/Ostatní/ToDov2/.claude/worktrees/beautiful-bardeen-e9e575/prototype/index.html"

# commit v obou
cd ".claude/worktrees/beautiful-bardeen-e9e575" && git add prototype/index.html && git commit -m "..."
cd "C:/Users/merit/OneDrive/Desktop/AI/Ostatní/ToDov2" && git add prototype/index.html && git commit -m "..."
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

### Fonty
- `--f-display`: **Syne 800** — hlavní nadpisy
- `--f-hand`:    **Caveat 700** — handwritten labels, sekce, kategorie, tile jména
- `--f-mono`:    **IBM Plex Mono** — časy, počty, timestamps, datum v tabulce
- `--f-body`:    **Space Grotesk** — tělo textu, jména v tabulce kontaktů

---

## Architektura

- `< 720px` → mobile (bottom nav)
- `≥ 720px` → desktop (sidebar 232px)

### Views
| View | ID | Stav |
|------|-----|------|
| Dnes | `v-dnes` | ✅ plně implementován |
| Měsíc | `v-mesic` | ✅ focus strip + mini grid |
| Úkoly | `v-ukoly` | ✅ mobile groups + desktop columns |
| Poznámky | `v-poznamky` | ✅ implementován |
| Narozeniny | `v-narozeniny` | ✅ tiles + inline tabulka + výročí |

---

## Data model

### Úkoly
```js
tasks = [{
  id, title,
  tag: 'prace' | 'rodina' | 'domacnost' | 'ostatni',
  done: bool,
  date: 'today' | 'tomorrow' | null,
  rec: 'none' | 'daily' | 'weekly' | 'monthly' | 'quarterly',
  completedAt: Date | undefined
}]
```

### Narozeniny (NOVÝ formát)
```js
birthdays = [{
  id: number,                     // normalizován na číslo (loadBdays migruje staré string IDs)
  firstName: string,
  lastName: string,               // může být ''
  day: number, month: number,     // datum narozenin
  yearBorn: number | null,        // rok je nepovinný
  anniversaries: [{               // výročí — může být []
    title: string,                // popis (např. 'Potkali jsme se poprvé')
    day: number, month: number,   // datum výročí
    year: number | null,          // rok pro výpočet 'X let'
  }],
  namedayOverride: null | false | { day, month }
  // null/undefined = auto z NAMEDAYS
  // false = uživatel smazal
  // {day,month} = manuálně nastaveno
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

### localStorage
| Klíč | Obsah |
|------|-------|
| `vypusto-tasks-v1` | tasks, `completedAt` jako ISO string |
| `vypusto-bdays-v1` | birthdays v novém formátu |
| `vypusto-notes-v1` | notes |

---

## Narozeniny view — architektura

### Tile grid
- Ilustrace jsou **type-based** (ne hash-based):
  - 🎁 **gift** → narozeniny (`type:'birthday'`)
  - 🌸 **flower** → svátek (`type:'nameday'`)
  - 🎈 **balloon** → výročí (`type:'anniversary'`)
- Každý kontakt generuje **více tiles** — birthday tile + nameday tile (pokud nalezen) + tile pro každé výročí
- Sekce: "🎉 Dnes slaví" / "Nadcházející (30 dní)" / "Všechny"

### Pomocné globální funkce
```js
lookupNamedayGlobal(firstName)   // reverse NAMEDAYS lookup; regex /[\s,()]+/ + filter 'a'
getEffectiveNameday(b)           // respektuje namedayOverride
formatNdStr(nd)                  // {day,month} → 'dd.mm.'
parseNdStr(str)                  // 'dd.mm.' → {day,month} | null
formatBdayInput(b)               // b → 'dd.mm.rrrr' nebo 'dd.mm.'
parseBdayInput(str)              // 'dd.mm.rrrr' → {day,month,year} | null
_czMonthShortGlobal(m)           // 1-12 → 'led','úno',...
```

### Inline tabulka kontaktů
- Sloupce: **Jméno** / **Příjmení** / **Svátek** / **Narozeniny** / (edit ✎ + del ✕)
- Fonty: Space Grotesk pro jméno/příjmení, IBM Plex Mono pro data
- Svátek = editovatelný input; auto-hodnota jako placeholder; lze přepsat nebo smazat
- Uložení: `change` event (po blur se změnou) → `saveBdays()` + debounced `renderNarozeniny()`
- Edit (✎) → otevře modal s daty kontaktu + sekcí výročí

### Modal (add/edit kontaktu)
- **Nový kontakt**: Jméno + Příjmení + Datum narození (den/měsíc/rok)
- **Editace**: + sekce Výročí (seznam + inline přidávání)
  - Výročí: Popis + datum `dd.mm.rrrr` + tlačítko +
  - Enter v Popisu → přeskočí na datum; Enter v datu → přidá
  - ✕ u položky → smaže z `editingAnniversaries`
- State: `editingBdayId` (null = nový), `editingAnniversaries` (kopie při otevření)

---

## Poznámky view — architektura

- Filtry: Vše / Práce / Rodina / Domácnost / Ostatní
- **Připnuté poznámky** (`.is-pinned`): zobrazují se vždy nahoře, mají 3-stranný doodle SVG rámeček (top/right/bottom — bez levé strany kvůli left-border)
- Doodle SVG u pinnedů: 3 cesty, stroke barva = kategorie, width 0.55, opacity .4; `position:absolute; inset:0`
- Note karta má `border-left: 3px solid [kategorie-barva]`
- `.note-card-top`, `.note-body`, `.note-foot` mají `position:relative; z-index:1` (nad SVG)
- Akce na note: klik → action overlay (pin/unpin, smazat)

---

## Měsíc view — focus strip

- **3 karty** v gridu `1.65fr 1fr 1fr`, gap 12px
- Zvýraznění: CSS border + background tint (bez doodle SVG):
  ```css
  .focus-card.fc-today { border-color: rgba(185,48,102,.35); background: rgba(185,48,102,.04); }
  .focus-card { border: 1px solid rgba(0,0,0,.09); border-radius: 10px; }
  ```
- Padding: fc-today `16px 16px 52px`; fc-side `10px 12px 32px`
- `doodleFrame()` funkce byla **smazána** (focus cards ji nepoužívají)

---

## Doodle SVG pravidla

Doodle rámečky v aplikaci (note cards, bday tiles today):
- viewBox `0 0 100 100`, `preserveAspectRatio="none"`, `position:absolute; inset:0`
- 4 kubické křivky, kontrolní body ~1–2 jednotky od hrany
- Today / primární: stroke `#b93066`, width `0.5–0.6`, opacity `.5–.55`
- Ostatní: stroke `#bbb`, width `0.75`, opacity `.28`
- Poznámkové karty: **pouze 3 strany** (top/right/bottom), začínají na x=8 (ne x=5) — levá strana je solid border kategorie

---

## Klíčové funkce

| Funkce | Popis |
|--------|-------|
| `setView(v)` | Přepíná view, spouští render |
| `renderDnes(animate)` | Dnes view |
| `renderMesic()` | Focus strip + mini grid |
| `renderUkoly(animate)` | Dispatcher mobile/desktop |
| `renderNarozeniny()` | Tile grid + inline tabulka |
| `renderPoznamky()` | Poznámky view |
| `openBdayModal()` | Nový kontakt (prázdný modal) |
| `openBdayEdit(id)` | Editace kontaktu (prefill + výročí) |
| `saveBday()` | Uloží kontakt včetně `editingAnniversaries` |
| `deleteBday(id)` | Smaže kontakt |
| `addAnniversaryToModal()` | Přidá výročí do `editingAnniversaries` |
| `renderAnniversaryList()` | Aktualizuje seznam výročí v modalu |
| `loadBdays()` | Načte + migruje (string ID → number, name → firstName/lastName) |
| `toggleDone(id)` | Completion + scratch animace + undo toast |
| `openDaySheet(dateStr)` | Overlay detail dne |
| `staggerIn(container)` | Entrance animace |

---

## Implementováno (chronologicky)

1. staggerIn re-run bug fix
2. Undo toast (4.2s) + scratch SVG animace
3. Kalendář day-click sheet
4. Empty states s CTA
5. Completion timestamps
6. Měsíc redesign: focus strip + smart mini grid
7. Desktop Úkoly: 4 category columns (asymetrický layout 1.6fr/1fr)
8. localStorage persistence (tasks + birthdays + notes)
9. Narozeniny tile grid (sekce, ilustrace, věk, datum badge)
10. Birthday add/edit modal
11. Poznámky view (pinned first, filtry, doodle u pinnedů, action overlay)
12. Note doodle: 3-stranný (bez levé cesty), z-index fix na content divech
13. Focus cards: doodle SVG nahrazen CSS border+tint
14. Narozeniny Phase 2:
    - Nový data model: firstName/lastName/anniversaries/namedayOverride
    - Type-based ilustrace: gift/flower/balloon
    - Event-based tiles (birthday + nameday + anniversary per contact)
    - Inline-editable tabulka kontaktů
    - Modal s výročími (přidat/smazat)
    - Edit (✎) tlačítko v tabulce
    - Auto-svátky z NAMEDAYS (oprava regex bugu)
    - Editovatelné svátek pole s namedayOverride
    - Space Grotesk font pro jméno/příjmení v tabulce

---

## Měsíc view — architektura (upd.)

### Redesign gridu (session 2026-06-03)
- Mini grid (`d-mini-cell`) nahrazen full-size gridem (`.cal-fc` buňky)
- Buňky: min-height 80px mobile / 116px desktop; `var(--border)` ohraničení
- Event řádek: barevná pomlčka (`cal-fc-ev-dash`) + zkrácený název
- Task řádek: barevný puntík (`cal-fc-task-dot`) + název (proškrtnutý když done)
- Narozeniny: gift SVG ikona z Narozeniny view + jméno kontaktu (rodina barva)
- Svátky: flower SVG ikona + jméno, **pouze pro kontakty v seznamu** (ne všechny české svátky)
- Přetékající položky: `+N` indikátor (MAX=3 na buňku)
- Aktuální týden: 2.5px raspberry proužek na spodní hraně buněk
- DOW hlavička: Caveat font, víkendy v raspberry barvě
- Oprava bugu: focus karta používala `meta.bday.name` → opraveno na `firstName+lastName`

### Pomocné SVG konstanty v renderMesic()
- `giftSVG` — dárek (stroke #C4614A, viewBox 0 0 44 44)
- `flowerSVG` — květ (stroke #b93066, viewBox 0 0 44 44)

---

## Co chybí / další kroky

- Swipe gestures pro přepínání měsíců (mobile)
- PWA manifest + service worker
- Dark mode
- Editace/smazání úkolu
- Repeated tasks logic (rec field existuje, ale není plně implementován)
- Přidání výročí ke kontaktu přímo z inline tabulky (teď jen přes modal ✎)
- Kliknutí na den ve focus stripu → day sheet (zatím funguje, ale focus strip nereflektuje nový grid styl)
