# VypusTo — Session Context

> Tento soubor je handoff dokument pro pokračování práce v nové Claude session.
> Přečíst před zahájením jakékoliv práce na projektu.

---

## Co je VypusTo

Česká rodinná PWA pro správu úkolů — **single-file HTML prototype** bez build stepu.
Cílová skupina: česká rodina, primárně žena/máma jako hlavní uživatelka.
Styl: doodle art, handwritten prvky, raspberry primary color.

**Soubor:** `C:\Users\merit\OneDrive\Desktop\AI\Ostatní\ToDov2\prototype\index.html`
**Preview server:** `npx serve -p 3000 prototype` (konfig v `.claude/launch.json`)
**Git:** inicializován v `C:\Users\merit\OneDrive\Desktop\AI\Ostatní\ToDov2\.git`

---

## Design systém

### Barvy (CSS custom properties)
```css
--primary:     #b93066;   /* raspberry — hlavní akcent */
--primary-lt:  #fef0f6;   /* světlé pozadí pro primary */
--bg:          #ffffff;
--bg-off:      #f7f7f7;
--border:      #EBEBEB;
--border-faint:rgba(0,0,0,.055);
--ink:         #111111;
--ink-2:       #555555;
--ink-3:       #999999;

/* Kategorie */
--c-prace:     #1C3557;  --c-prace-bg:  #EDF1F6;   /* Práce — navy */
--c-rodina:    #C4614A;  --c-rodina-bg: #F9EDE9;   /* Rodina — terracotta */
--c-dom:       #4A7C59;  --c-dom-bg:    #EBF3EE;   /* Domácnost — green */
--c-ost:       #7A6E8A;  --c-ost-bg:    #F0EEF3;   /* Ostatní — purple-grey */
```

### Fonty (4 typy, Google Fonts)
- `--f-display`: **Syne 800** — hlavní nadpisy (datum, view tituly)
- `--f-hand`:    **Caveat 700** — handwritten labels, sekce, kategorie
- `--f-mono`:    **IBM Plex Mono** — časy, počty, kódy, timestamps
- `--f-body`:    **Space Grotesk** — tělo textu, popisy

---

## Architektura prototypu

### Breakpoint
- `< 720px` → mobile layout (bottom nav)
- `≥ 720px` → desktop layout (sidebar `232px`)

### Views (5 tabů)
1. **Dnes** (`v-dnes`) — dnešní události + dnešní úkoly, 2-column grid na desktopu
2. **Měsíc** (`v-mesic`) — kalendář, doodle journaling styl
3. **Úkoly** (`v-ukoly`) — mobile: time groups; desktop: 4 category columns
4. **Poznámky** (`v-poznamky`) — placeholder
5. **Narozeniny** (`v-narozeniny`) — placeholder

### Data model
```js
tasks = [
  { id, title, tag: 'prace'|'rodina'|'domacnost'|'ostatni',
    done: bool, date: 'today'|'tomorrow'|null, rec: 'none'|'daily'|'weekly'|'monthly'|'quarterly',
    completedAt: Date|undefined }
]
events = [{ title, time, tag }]  // dnešní události (hardcoded)
calExtra = { 'YYYY-MM-DD': [events] }  // extra události v kalendáři
birthdays = [{ name, today: bool }]
```

### CAT objekt
```js
const CAT = {
  prace:     { label:'Práce',     color:'#1C3557' },
  rodina:    { label:'Rodina',    color:'#C4614A' },
  domacnost: { label:'Domácnost', color:'#4A7C59' },
  ostatni:   { label:'Ostatní',   color:'#7A6E8A' },
};
```

---

## Klíčové funkce

| Funkce | Popis |
|--------|-------|
| `setView(v)` | Přepíná view, spouští render |
| `renderDnes(animate)` | Renders Dnes view |
| `renderMesic()` | Renders měsíční kalendář |
| `renderUkoly(animate)` | Dispatcher: mobile → `renderUkolyMobile`, desktop → `renderUkolyDesktop` |
| `renderUkolyMobile(animate)` | Mobile: time groups (Dnes/Zítra/Bez data) |
| `renderUkolyDesktop(animate)` | Desktop: 4 category columns s doodle prvky |
| `toggleDone(id)` | Completion s scratch animací, ukládá `completedAt` |
| `openDaySheet(dateStr)` | Otevře overlay s detailem dne (události + úkoly) |
| `openModal(presetDate)` | Add task sheet |
| `showUndo()` / `hideUndo()` | 4.2s undo toast po splnění |
| `getDayItems(dateStr)` | Vrátí `{evs, taskList}` pro daný den |
| `formatCompletedAt(date)` | "dnes 09:15" / "včera 14:30" / "5. 6. 10:00" |
| `staggerIn(container)` | Entrance animace task items (jen při prvním zobrazení view) |
| `applyScratch(el, instant)` | SVG strikethrough animace na dokončeném úkolu |

---

## Kalendář — implementace (po posledních úpravách)

### Dot systém (mobile)
- **Horní řada** (`.cal-ev-r`): plné barevné tečky = události (`.cal-ev`)
- **Spodní řada** (`.cal-tk-r`): outlined kroužky = úkoly (`.cal-tdot[data-t="..."]`)
- Max 3 event dots + 3 task ring dots + `+N` overflow
- `.cal-evs` je flex-column kontejner pro obě řady

### Chip systém (desktop ≥720px)
- Events: solid chip s barevným pozadím (`.cal-chip[data-tag="..."]`)
- Tasks: outlined chip bez výplně (`.cal-chip.task-chip`)
- Balancing: když jsou ≥3 eventy A existují tasky → 2 event chipy + 1 task chip, jinak slice(0,3)

### Doodle prvky
- DOW header: Caveat font
- Oddělovač: SVG hand-drawn wavy path
- Dot-grid paper background (`.cal-body`)
- Today: ring glow (`box-shadow: 0 0 0 3px rgba(185,48,102,.18)`)
- Sparkle ✦ vedle měsíce (SVG star v `.cal-title-wrap`)
- Weekend buňky: lehký tint `rgba(185,48,102,.028)`

---

## Úkoly desktop — implementace (po posledních úpravách)

Každý sloupec (Práce / Rodina / Domácnost / Ostatní) obsahuje:
- **Icon** (SVG 14×14) v barvě kategorie
- **Label** (Caveat font, barva kategorie)
- **Wavy SVG underline** pod labelem (`col-wave`, unikátní path per category)
- **Done/total ratio** (např. "1/4" v mono fontu)
- **Date sub-groups**: Dnes / Zítra / Bez data (jen pokud >1 skupina)
- **Today-task highlight**: task-item.today-task má lehký tint
- **Empty state**: unikátní SVG ilustrace per kategorie + "Vše splněno ✓"

---

## Co bylo vyřešeno (chronologicky)

1. **staggerIn re-run bug** — animate=false parametr, true jen při setView()
2. **Undo toast** — 4.2s, "Vrátit zpět" button, `lastCompletedId`
3. **Kalendář day-click sheet** — openDaySheet(dateStr), re-attach event listeners
4. **Standardizace** — "úloha" → "úkol" throughout
5. **Empty states** s actionable CTA
6. **Completion timestamps** — `completedAt: new Date()`, `formatCompletedAt()`, zobrazeno v archivu
7. **Kalendář redesign** — equal-height cells, borders, paper bg, doodle elements
8. **Desktop Úkoly columns by category** — user explicitně opravil 2x: chce sloupce dle druhu, NE dle času
9. **Task dots v kalendáři** — dual-row dot systém, balanced desktop chips
10. **Doodle personality v Úkolech** — wave underlines, icons, ratios, empty illustrations

---

## Data model — narozeniny (po refaktoru)

```js
birthdays = [
  { id, name, month: 1-12, day: 1-31, yearBorn: number|null }
]
```
- Uloženo v `localStorage` pod klíčem `vypusto-bdays-v1`
- `renderDnes` detekuje narozeniny přes `b.month === now.getMonth()+1 && b.day === now.getDate()`

## localStorage schéma

| Klíč | Obsah |
|------|-------|
| `vypusto-tasks-v1` | JSON array úkolů, `completedAt` jako ISO string |
| `vypusto-bdays-v1` | JSON array narozenin |

---

## Aktuální stav

- **Critique score**: 17/40 (z `.impeccable/critique/2026-05-30T19-59-55Z__prototype-index-html.md`) — všechny P0-P3 opraveny, score stale
- **Poslední commit**: `34f8822` — "Add localStorage persistence + Narozeniny view"
- **Git**: branch `master`, 2 commity, žádný remote

---

## Co bylo implementováno v session 2026-06-01

11. **localStorage persistence** — úkoly + narozeniny přežívají reload (`vypusto-tasks-v1`, `vypusto-bdays-v1`)
12. **Narozeniny view** — seznam seřazený dle blízkosti, sekce "Dnes slaví" / "Nadcházející" / "Všechny", barevné avatary s iniciálami, věková pill, datum badge
13. **Birthday add modal** — jméno + den/měsíc/rok, validace, save do localStorage
14. **Nový birthday data model** — `{ id, name, month, day, yearBorn }` místo `{ name, today }`

---

## Potenciální další kroky (nebyly explicitně zadány)

- Animace přechodu mezi měsíci v kalendáři
- Swipe gesture pro přepínání měsíců (mobile)
- Poznámky view implementace
- PWA manifest + service worker
- Dark mode
- Smazání úkolu (swipe-to-delete nebo long-press)
- Editace úkolu
- Repeated tasks logic (rec !== 'none' úkoly se neautomaticky replikují)

---

## Jak spustit preview

```bash
# V terminálu v C:\Users\merit\OneDrive\Desktop\AI\Ostatní\ToDov2
npx serve -p 3000 prototype
# Otevři http://localhost:3000
```

Nebo použij `.claude/launch.json` konfiguraci přes Claude Code preview server.
