# LLM Council Transcript — VypusTo
**Datum:** 4. června 2026

---

## Původní otázka (uživatel)

> Použitelnost a vzhled aplikace. Na trhu je spousta aplikací na organizaci času - je tahle dostatečně krásná a uživatelsky přívětivá, aby ji uživatelé skutečně používali? Oproti jiným aplikacím nabízí lepší sledování svátků, narozenin a výročí... Je něco, co by uživatelům v aplikaci mohlo chybět, nebo by se mělo zlepšit?

---

## Rámovaná otázka (pro poradce)

VypusTo je česká family PWA (aktuálně single-file HTML prototype, localStorage, žádný backend) zaměřená primárně na ženy — matky a manželky — jako hlavní uživatelky. Cílový uživatel: česká rodina, kde žena nese mental load.

**Funkce:** Dnes (denní view + časová linka), Měsíc (full calendar grid), Úkoly (kategorie + vlastní barvy), Poznámky, Narozeniny (narozeniny + svátky + výročí — napojeno na českou databázi jmenin), Opakující se (mental load tracker s "naposledy splněno" + push do hlavního kalendáře).

**Design:** Doodle art, Caveat handwritten font, raspberry #b93066, Syne 800, IBM Plex Mono. Mobile-first PWA.

**Klíčová diferenciace:** (1) Propojení uživatele s přáteli/rodinou přes narozeniny, svátky a výročí — připomíná důležité momenty. (2) Mental load tracking — opakující se úkony domácnosti, děti, manžel, termíny.

**Otázka:** Je VypusTo dostatečně krásná a uživatelsky přívětivá, aby ji ženy skutečně používaly každý den? Co chybí nebo by se mělo zlepšit, aby obstála v saturovaném trhu aplikací na organizaci času?

---

## Odpovědi poradců

### The Contrarian

The core problem: VypusTo is a to-do list wearing a costume. The "doodle aesthetic" and Czech namedays don't change the fact that the underlying product is a glorified checklist. Women in the target demographic already have Google Calendar, Apple Reminders, and Todoist. What VypusTo is describing as differentiation — social connection and mental load tracking — are features, not a product identity. Features get copied in a sprint.

The mental load angle is the most promising, and it's buried. If the app's real job is to make invisible labor visible, then the entire architecture should express that. Instead, it's organized like every other productivity app — tasks, notes, calendar, birthdays. The mental load tracker is one tab among six. That's backwards.

Specific failure points:

The target user already uses WhatsApp to coordinate family logistics. Why would she open a separate app to track that her husband's annual dermatology appointment is overdue? The friction of switching to a dedicated app for something she currently handles informally is underestimated.

The "push to main calendar" toggle on recurring tasks suggests integration is an afterthought. Women who manage family schedules live in their phone's native calendar. If VypusTo doesn't sync natively with Google Calendar or iCloud, it's asking users to maintain two calendars. They won't.

Single-file HTML with localStorage means zero backup, zero multi-device sync, zero sharing with the husband or children. The social connection claim collapses entirely because there is no social layer — it's a solo app pretending to be a family tool.

The beauty question is a distraction. An ugly app people need beats a beautiful app they don't. The question should be: what does VypusTo do that she cannot do anywhere else? The current answer is nothing.

---

### The First Principles Thinker

The real question isn't "is it beautiful enough?" Beauty is table stakes. The actual question is: **does this app reduce mental load, or just digitize it?**

Here's the failure mode to examine: most productivity apps for women recreate the problem they claim to solve. They ask the woman to do more work — entering data, maintaining lists, tagging tasks — in order to eventually do less work. The friction of setup exceeds the relief of use. The app becomes another thing to manage.

First principles: why does mental load exist? Because one person holds all the context about a household in their head. The calendar, the recurrences, the relationships, the deadlines. VypusTo addresses the *symptoms* (forgetting, overwhelm) but doesn't attack the *source* (unequal context ownership).

So the real gap isn't UI polish. It's **delegation infrastructure**. The app has no mechanism for distributing context to other family members. A husband cannot be assigned tasks with accountability. A child cannot check off their own recurrence. The mental load stays with the woman — now she just has a prettier dashboard for it.

The "social connection" differentiator (birthdays, namedays) is real but dangerously passive. It reminds you to celebrate others. That's still labor.

What would actually stand out: make the invisible visible *to others*. A household context layer that others can see and interact with — not just a woman's personal organizer.

The aesthetic question is secondary. Women will use an ugly app that genuinely shares their burden. They will abandon a beautiful app that is still, structurally, just theirs to maintain.

The current design solves: "help one woman hold everything." The unsolved problem is: "stop one woman from having to hold everything."

---

### The Expansionist

The mental load angle is undersold. This isn't a productivity app — it's the first app that could make invisible labor visible to the entire household. The real opportunity: shared family view. Right now VypusTo is a solo tool for one woman carrying everything alone. Flip that. Let her husband and kids see the board. Suddenly "Mom, what's for dinner?" becomes a question the app answers for the whole family. That's a fundamentally different product category — family operating system, not personal planner.

Czech namedays are a massive underutilized asset. Czech culture treats namedays nearly as seriously as birthdays. No mainstream productivity app handles this properly. VypusTo already has it. That's a genuine moat — build on it. Extend to Slovak namedays, expand to Polish, Hungarian markets. Central European family culture is underserved by English-language productivity tools. This is a regional beachhead nobody else is taking seriously.

The recurring mental load tracker is the sleeper feature. "Last done: chimney inspection 14 months ago" is anxiety-inducing in exactly the right way. That friction is valuable. Gamify it subtly — not badges and points, but a quiet green/amber/red health score for your household. "Your home is 73% on top of things." Women will share that. It becomes social currency among friends.

Monetization hiding in plain sight: partnerships with Czech service providers. Chimney sweeps, pediatricians, appliance repair — the app knows when users are overdue. That's a referral business. The app that reminds you also books it for you.

The biggest miss: VypusTo is thinking app when it should be thinking platform. The data on what Czech families worry about, track, and forget is extraordinarily valuable if aggregated anonymously. That's a research asset.

---

### The Outsider

The name "VypusTo" means nothing to me. I don't know if it's a verb, a noun, or a made-up word. If I landed on this app as a fresh user, that name gives me zero signal about what the app does. The creator knows it means something clever in Czech — I don't, and neither will a new user in the first three seconds.

The feature list reads like a settings menu, not a value proposition. "Dnes, Měsíc, Úkoly, Poznámky, Narozeniny, Opakující se" — these are generic productivity tabs that exist in every calendar app. Nothing here tells me why *this* app was made for *me*, a Czech mother carrying mental load. There is no emotional hook visible from the outside.

The "mental load" framing is the strongest differentiator, but it's buried in the Recurring tab. A completely fresh user would never find it first. They'd open the app, see a calendar, think "I have Google Calendar," and close it. The mental load concept needs to be front and center — it should be the first thing users experience, not tab five.

The doodle aesthetic risks reading as "hobby project" rather than "trustworthy daily tool." Women managing real household logistics — chimney inspections, medical appointments — need to feel the app is reliable. Handwritten fonts and doodles can signal warmth, but they can also signal fragility. The tension between cute and competent is unresolved.

One concrete gap: there is no indication of what happens to data. A woman putting her family's medical appointments and birthdays into an app with no backend explanation and no privacy signal — that is a silent trust barrier that will kill daily retention before it starts.

---

### The Executor

Real daily usage lives or dies on the first 30 seconds. That's the only metric that matters right now.

**What ships first — in this order:**

1. **Onboarding in under 60 seconds.** Ask for 3 names (herself + family members) and 2 birthdates. Done. No tutorial, no feature tour. She sees personalized data immediately or she leaves.

2. **One killer notification.** Push a single daily morning summary: "Today: pick up Tomáš from school 15:30 — Mama's nameday in 3 days." That single notification is the habit hook. Without it, the app is opened once and forgotten. This requires moving off localStorage to at least a service worker with scheduled notifications — do it now, not later.

3. **Recurring tasks need a "done" button on the home screen.** Right now the mental load tracker is a separate tab. That's wrong. The 2-3 most overdue recurring tasks should surface on the Dnes screen with a single tap to mark done. That's the daily engagement loop.

4. **The calendar is not the product.** Every women's app leads with calendar. The differentiator is the social layer — namedays, birthdays, anniversaries. That tab should be called "Oslavy" (Celebrations) and be second in the nav, not buried.

**What does NOT ship yet:** custom colors, notes categories, month grid polish. Nobody is leaving because the month grid is ugly. They're leaving because there's nothing pulling them back tomorrow.

**Monday morning task:** Add `Notification.requestPermission()` on first open. Wire up one scheduled daily push via service worker. Ship that to one real user — a mother, not a developer — and watch what she actually taps.

---

## Anonymizace (peer review fáze)

- Response A = The Executor
- Response B = The Contrarian
- Response C = The First Principles Thinker
- Response D = The Outsider
- Response E = The Expansionist

---

## Peer Reviews

### Recenzent 1

**1. Nejsilnější: A (Executor)**
Dává nejpragmatičtější radu. Ostatní poradci dobře diagnostikují, ale neřeknou ti, co dělat v pondělí ráno. A ano.

**2. Největší slepé místo: E (Expansionist)**
Navrhuje platformovou strategii pro localStorage prototyp. Škála ambice je zcela odpojena od aktuálního stádia produktu.

**3. Co všichni přehlédli**
Moment instalace PWA. Nejdůležitější retentní událost pro jakoukoli PWA je chvíle, kdy uživatel přidá aplikaci na domovskou obrazovku. Žádná odpověď neadresovala, jak VypusTo záměrně spustit a zpracovat tuto install výzvu.

---

### Recenzent 2

**1. Nejsilnější: A (Executor)**
Jasné, prioritizované, bez uhýbání. Říká, co stavět v jakém pořadí a proč.

**2. Největší slepé místo: E (Expansionist)**
Platformová vize pro produkt bez uživatelů a bez backendu. Roadmap převlečený za produktový insight.

**3. Co všichni přehlédli**
PWA install prompt a manifest. Bez manifest.json, offline podpory a záměrné install výzvy VypusTo není PWA — je to webová stránka. Slovo "PWA" se v briefu vyskytuje, ale žádný poradce neadresoval, co to technicky ani zážitkově vyžaduje.

---

### Recenzent 3

**1. Nejsilnější: C (First Principles)**
Identifikuje strukturální rozpor — aplikace optimalizuje pro jednu osobu držící veškerý kontext, což je přesně to, co mental load je.

**2. Největší slepé místo: E (Expansionist)**
Vize "rodinného OS" předpokládá manžela, který participuje. Žádná odpověď se nezeptala: jaká je motivace manžela? Asymetrie motivace je strukturální problém, ne UX problém.

**3. Co všichni přehlédli**
Manžela nemůže žena rekrutovat. Každá sociální produktivní aplikace, která tento model zkusila, s tím bojovala.

---

### Recenzent 4

**1. Nejsilnější: C (First Principles)**
Identifikuje strukturální rozpor v jádru produktu. Jde o úroveň hlouběji k skutečnému problému, na kterém závisí přežití produktu.

**2. Největší slepé místo: E (Expansionist)**
Romanticizuje příležitost bez konfrontace s chladnou realitou. E je tříletý roadmap převlečený za produktový insight.

**3. Co všichni přehlédli**
Cílová uživatelka (česká matka, ~30-45) již má funkční systém — fragmentovaný přes WhatsApp, papírový kalendář a vlastní hlavu, ale funguje. Rada přistupovala k rozhodnutí jako by šlo o prázdnou tabuli, přitom jde o problém nahrazení (displacement problem).

---

### Recenzent 5

**1. Nejsilnější: C (First Principles)**
Identifikuje strukturální problém, který ostatní považují za mezeru ve funkci. Mental load není UI problém — je to problém distribuce kontextu.

**2. Největší slepé místo: A (Executor)**
Navrhuje taktický roadmap bez zpochybnění premisy. Optimalizuje retenci uživatele, který se možná nikdy nevrátí.

**3. Co všichni přehlédli**
Manžel/partner není nepřítomný — je zároveň překážkou i příležitostí. Produkt potřebuje read-only nebo lehký companion mode — jedno URL, bez registrace, poslatelné přes WhatsApp. Skutečný odemykač je frictionless family pull, ne push.

---

## Verdikt předsedy rady

### Kde se rada shoduje

- **Mental load tracker je skutečný produkt — a je pohřben.** Každý poradce nezávisle identifikoval, že nejsilnější diferenciátor je skryt v záložce číslo pět. Aplikace je strukturována jako každá jiná. To je obráceně.
- **Krása není problém.** Rada jednomyslně přeformulovala otázku. Problém retence je strukturální, ne estetický.
- **Tvrzení o sociálním propojení nemá oporu v architektuře.** Single-file localStorage = žádná synchronizace, žádné sdílení, žádná záloha.
- **České svátky jsou skutečný a nevyužitý příkop.** Jediná funkce, kterou Google nebo Apple nemohou triviálně zkopírovat.

### Kde se rada neshoduje

**Executor vs. First Principles.** Executor říká: oprav onboarding, přidej notifikace — udělej to v pondělí. First Principles říká: nic z toho nezáleží, pokud aplikace strukturálně reprodukuje problém, který tvrdí, že řeší. Oba mají pravdu na různých časových horizontech. Executor vyhrává příštích 14 dní. First Principles vyhrává příštích 2 let.

**Expansionist vs. všichni ostatní.** Expansionist navrhuje rodinný OS a regionální platformu. Předčasné pro localStorage prototyp bez uživatelů. Instinkty jsou directionally správné, ale operačně nepoužitelné v tuto chvíli.

### Slepá místa odhalená radou

1. **VypusTo technicky zatím není PWA.** Žádný manifest.json, žádný service worker, žádná install výzva. Moment přidání na domovskou obrazovku je nejsilnější páka pro retenci.

2. **Problém motivace manžela zabíjí vizi sdílené nástěnky.** Asymetrie motivace je strukturální problém, ne UX problém.

3. **Jde o problém nahrazení, ne rozhodnutí na zelené louce.** Cílová uživatelka již má funkční systém. Rada nikdy nepoložila otázku: jaký je minimální klín, který učiní jednu část jejího stávajícího systému zjevně horší než VypusTo?

### Doporučení

Přestaň přemýšlet o aplikaci jako o kalendáři s záložkou pro mental load. Přebuduj hierarchii kolem jedné věci, kterou aplikace dělá, co nic jiného neumí: zná opakující se odpovědnosti domácnosti a zobrazuje je vedle lidí, na kterých ti záleží.

**Okamžitá strukturální oprava:** Udělej "Dnes" unifikovaný povrch s (1) časově citlivými událostmi, (2) 2-3 nejvíce opožděnými opakujícími se úkoly s jedním klepnutím "hotovo" a (3) nadcházející oslavou do 7 dnů.

**Pro problém manžela:** Nebuduj sdílenou nástěnku vyžadující jeho buy-in. Vybuduj read-only sdílecí odkaz — jedno URL, bez registrace, poslatelné přes WhatsApp. Frictionless pull, ne push.

### Jedna věc, kterou udělat jako první

Přidej skutečný PWA manifest, service worker a jednu naplánovanou ranní push notifikaci: "Dnes: [jedna událost] — [jedna nadcházející oslava]." Pošli to jedné skutečné uživatelce — matce, ne vývojáři — a sleduj, zda otevře aplikaci, když notifikace dorazí.

---

*LLM Council · VypusTo · 4. června 2026 · 5 poradců · 5 recenzentů · 1 předseda*
