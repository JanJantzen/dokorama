# Dokorama – Roadmap

> **Roadmap-Regel:** Ein Punkt wird erst als ✅ markiert, wenn Jan explizit „done" sagt – nicht schon, wenn Code dazu gebaut wurde.

> **Wie diese Roadmap gelesen wird (wichtig!):**
> Diese Roadmap ist in **thematische Blöcke (A–H)** gegliedert. **Die Buchstaben sind Etiketten, keine Rangfolge.** Dass ein Block „A" heißt, bedeutet *nicht*, dass er vor „B" gebaut wird.
> Es gibt zwei Ebenen von Reihenfolge:
> 1. **Innerhalb** jedes Blocks sind die Punkte fachlich von oben nach unten geordnet (was zuerst kommt, was darauf aufbaut).
> 2. Die **blockübergreifende zeitliche Priorisierung** – also „woran arbeiten wir als Nächstes über alle Blöcke hinweg" – steht bewusst **nicht** in den Blöcken selbst, sondern allein im Schlusskapitel **„Was als Nächstes"**. Alles andere ergibt sich später und verändert sich ohnehin laufend.
>
> Diese Struktur ist das Ergebnis einer gemeinsamen Sortier-Session (28. Juni 2026), in der die alte, nach Bauphasen sortierte Roadmap thematisch neu aufgesetzt wurde.

---

## A — Erfassung

Alles, was die Eingabe selbst betrifft, jetzt wo die Tisch-Ansicht steht und stabil läuft.

> Die ersten beiden Punkte sind echte Lücken; die unteren vier sind bewusst weiter hinten, weil sie selten gebraucht werden oder reiner Komfort sind. Konkret: Runden-Zusammensetzung mitten in einer Partie ändern kam in fünf Jahren genau **einmal** vor, parallele Tische bisher **nie** – das sind sehr theoretische Optionen.

1. **Block-Ansicht** – die alternative Erfassungs-UI im nüchternen Schreibblock-Stil: alle Infos auf einer Seite, ohne Bottom Sheets. Teilt denselben `GameContext` wie die Tisch-Ansicht, der Zustand bleibt beim Umschalten erhalten. Die Architektur ist bereits vorbereitet (Platzhalter `BlockView` existiert, View-Switcher im Header ist da) – es fehlt nur der Inhalt hinter dem Platzhalter.
2. **Ansichtspräferenz pro Schreiber:in speichern** – merkt sich je eingeloggtem Schreiber, ob er/sie lieber in der Tisch- oder der Block-Ansicht erfasst, und öffnet beim nächsten Mal die bevorzugte. Setzt voraus, dass es überhaupt zwei Ansichten gibt (Punkt 1) und dass es eingeloggte Schreiber:innen mit Profil gibt.
3. **Diktat-Ansicht** – eine weitere alternative Erfassungs-UI, bei der ein Spiel gesprochen statt getippt erfasst wird. Komfort-Feature, weiter hinten.
4. **Runden-Zusammensetzung mitten in der Partie ändern** – jemand kommt später dazu oder geht früher; das wird auf Runden-Ebene getrackt. In der Praxis extrem selten (einmal in fünf Jahren), daher trotz realer Relevanz weiter unten.
5. **Parallele Tische** – mehrere gleichzeitig laufende Partien innerhalb einer Gruppe (z. B. bei 8 Spieler:innen zwei Tische). Das Datenmodell unterstützt mehrere Sessions pro Datum bereits. Bisher nie vorgekommen – sehr theoretisch.
6. **Individuelle Tischdrehung** – jede:r sieht sich selbst unten links statt fester Position 1 unten links. Reine Darstellungs-Verbesserung.

---

## B — Mehrere Schreiber:innen & Zugang

Wer darf eine laufende Partie sehen, und wer darf gerade hineinschreiben? Das Leitbild ist das **Büchlein**:

> Robert hat den Kugelschreiber in der Hand und schreibt ins Buch. Alle anderen können jederzeit über die Schulter gucken und sehen, was gerade drinsteht – aber niemand greift sich einfach den Stift, ohne dass es klar ist, dass er das darf.

Übersetzt in die App heißt das: **Eine Partie hat zu jedem Zeitpunkt genau einen aktiven Schreiber.** Alle anderen – eingeloggt oder nicht – sehen live mit. Wer eingeloggt ist *und in der Partie mitspielt*, kann den „Kugelschreiber" aktiv an sich nehmen, muss das aber bewusst bestätigen. Der aktive Schreiber hängt **nicht** daran, wer die Partie ursprünglich angelegt hat, sondern daran, wer den Stift gerade hält.

> **Wichtig:** Echtes paralleles Schreiben (zwei Menschen kritzeln gleichzeitig im selben Spiel) soll es ausdrücklich **nicht** geben. Es ist immer genau eine:r am Stift – nur eben übergebbar. Das entspricht der Realität am Tisch und ist technisch deutlich einfacher.

1. **Ist-Zustand schärfen** – erst verstehen, was tatsächlich gebaut wurde, bevor wir es ändern. Offene Fragen: Wer darf aktuell wirklich schreiben – die Person, die die Partie angelegt hat, oder wer sich zuerst zum Weiterschreiben einklinkt? Und: Sieht eine nicht eingeloggte Person eine laufende Partie überhaupt live mit? (Der lesende Gruppen-Zugang gilt als „läuft faktisch", wurde aber nie bewusst als Feature abgenommen – hier einmal sauber prüfen.)
2. **Live-Mitsehen einer laufenden Partie (Realtime)** – jede:r, der reinschaut, sieht in Echtzeit, was der aktuelle Schreiber einträgt, ohne neu zu laden. Das ist das digitale „über die Schulter gucken" und die **technische Grundlage** für den nächsten Punkt: Wer übernehmen will, muss zwingend den aktuellen Stand sehen, sonst überschreibt er womöglich die letzte Zeile des Vorgängers.
3. **Kugelschreiber-Modell: ein aktiver Schreiber + Übernahme** – der Kern des Blocks. Der aktive Schreiber ist „wer den Stift gerade hält", nicht „wer angelegt hat". Wer eine Partie verlässt und später wieder einsteigt und „Partie weiterschreiben" wählt, wird zum aktuellen Schreiber. Ein anderer eingeloggter Mitspieler kann das Schreiben aktiv übernehmen – mit klarem Hinweis („Schreiber dieser Partie ist Robert. Willst Du das Schreiben übernehmen?") und einseitiger Bestätigung. Einseitig deshalb, weil Robert in den realen Fällen (Raucherpause, Handy-Akku leer, Handy kaputt) gar nicht mehr zustimmen kann. Das ist unter Freunden unkritisch: übernehmen kann ohnehin nur, wer in der Partie mitspielt und sich am echten Tisch den Stift auch greifen könnte.
   - *Notiz für die Detailphase (kein eigener Punkt):* Wenn zwei Personen fast gleichzeitig „übernehmen" tippen, bekommen beide den Hinweis; eine:r ist Sekundenbruchteile früher dran. Es entsteht **nie** die Gefahr zweier gleichzeitiger Schreiber – höchstens kann jemand kurz verwirrt sein, dass ihm der Stift „unterm Hintern weggezogen" wurde. Hier ggf. einen kleinen Hinweis ergänzen.

---

## C — Statistiken

Das große Wertversprechen des ganzen Projekts – der ursprüngliche Grund, warum Dokorama existiert („alle wollen die Statistiken zurück, niemand will den Aufwand"). Der Erfassungs-Aufwand ist gelöst, der Wert steht noch aus.

> **Das vollständige Statistik-Konzept ist fertig ausgearbeitet und lebt in [STATISTIK_KONZEPT.md](STATISTIK_KONZEPT.md)** – dem eigenständigen, maßgeblichen Referenzdokument (analog KONSISTENZREGELN.md und ROBERT_IMPORT.md) für alle Details: kompletter, nummerierter Kennzahlen-Vorrat, die Querschnitts-Achsen (Ebenen, Zeitraum, Normierung, Datenqualität, Stichprobe, Personen-Filter), die Navigationsstruktur mit sechs Einstiegen und drei Steckbrief-Typen sowie die Priorisierung. Die eigene, gründliche Ausarbeitungs-Session dazu ist abgeschlossen. Block C hier bleibt – wie alle Blöcke – bewusst schlank und gibt nur die Bau-Reihenfolge wieder; für das „Warum" und „Wie genau" jeder Kennzahl gilt STATISTIK_KONZEPT.md.

Die Reihenfolge folgt den vier Tiers aus STATISTIK_KONZEPT.md (Schritt 4). Leitprinzip: **Die Navigation wächst mit dem tatsächlich Fertigen – kein „Coming Soon" für Ungebautes.** Ob die Werte live aus den Rohdaten oder aus einer aggregierten Tabelle berechnet werden, ist eine spätere Backend-/Performance-Frage, keine Konzeptfrage (bei dieser Gruppengröße reicht Live-Berechnung mit hoher Wahrscheinlichkeit).

1. **Tier 1 – sofort:** Gesamtscore-Startbildschirm und die Ranglisten-Basis (Blöcke Leistung + Ausdauer). Dazu die Infrastruktur, die ab hier zwingend stehen muss: der P6-Mindest-Stichprobe-Filter (schon für Siegquoten nötig), der Zeitraum-Filter (Total / Kalenderjahr) und der Nerd-Modus-Schalter (schon für die Streuungs-Kennzahl L8 nötig).
2. **Tier 2 – direkt danach:** Personen-Verzeichnis + Spieler-Steckbrief (der Konvergenzpunkt, der die Ranglisten erst richtig nutzbar macht); die restlichen Ranglisten-Blöcke (Risiko, Solo, Sonderspiele, Sonderpunkte); der Partie-Steckbrief-Kern (Verlaufskurve inkl. Endstand, bester/schlechtester Einzelspielwert, Streak des Abends, Solo-/Sonderpunkte-Zahlen mit Benchmark, HOF/KUR-Ereignisse des Abends – hoher Gameflow-Wert direkt nach Partie-Abschluss, günstig zu bauen, weil reines Filtern vorhandener Daten). Neue Infrastruktur: der Personen-Filter (Achse 5).
3. **Tier 3 – später:** Orte + Ort-Steckbrief; Hall of Fame; Kuriositätenkabinett (strukturell ein Ranglisten-Block, aber mit Vitrinen-/Fun-Charakter statt ernster Leistungsmessung).
4. **Tier 4 – deutlich später:** das komplette Teamplay (Team-Chemie, Übermut, Partner-Glück/Gegner-Pech, Karlchen-/Fuchs-Battle, Gegner-Bilanz) sowie das rechnerisch teure Partie-Steckbrief-Feature „Neue Rekorde/Ranking-Veränderungen durch diese Partie".

### Tier 1 – Bauplan (abgeschlossen; 7.1-Rest → Tier 2)

> Detail-Checkliste zum Abarbeiten (überlebt `/clear`). Fachliche Grundlage: STATISTIK_KONZEPT.md – die Kennzahl-Nummern (L…/A…/G1) sind dort erklärt. Reihenfolge-Kniff: erst die **punkt-basierten** Kennzahlen (brauchen nur `zaehlpunkte`-Summen, auf jeder Datenqualität verfügbar), dann die **gewinner-basierten** (L1/L5/L9), weil der Gewinner ≠ „Punkte > 0" ist.
>
> **Getroffene Entscheidungen (20.07.2026):** (1) Rechenweg = **JS live** (wie `lib/standings.js`; SQL-Views erst später für einzelne teure Kennzahlen, z. B. G2). (2) Zeitraum-Default = **laufendes Kalenderjahr**. (3) P6-Schwelle = **in Phase 4 festlegen**. (4) Gewinner-Bestimmung (L1/L5/L9) = **Winner-Flag in der DB** (Umsetzung in Phase 5, inkl. Backfill der Bestandsspiele).

**Phase 0 – Fundament (unsichtbar, trägt alles)**
- [x] 0.1 Stats-Datenschicht `lib/stats.js`: Ladefunktion analog `standings.js`, aber über die ganze Gruppe (nur abgeschlossene Partien). Liefert Rohzeilen + abgeleitete Grundgrößen: Saldo je Spieler:in pro Spiel/Runde/Partie, Zähler gespielte Spiele/Runden/Partien (Basis für „pro 4 Runden"). — *erledigt 20.07.2026; `loadStatsData()` + `playerTotals()` + `playedRoundsByPlayer()`. Per-Runde/Partie-Salden folgen mit Phase 3.*
- [x] 0.2 StatsPage-Grundgerüst: Platzhalter durch zwei wachsende Bereiche ersetzen (Gesamtscore + Ranglisten) – minimaler Behälter, wächst mit. — *erledigt 21.07.2026; `StatsPage.jsx` lädt via `loadStatsData()`, Bereich „Gesamtscore".*

**Phase 1 – Gesamtscore (G1)**
- [x] 1.1 Gesamtscore-Rangliste absolut (Summe `zaehlpunkte`, absteigend). — *erledigt 21.07.2026; rendert via wiederverwendeter `StandingsList`.*
- [x] 1.2 Normierung „pro 4 Runden" (Summe ÷ eigene gespielte Runden × 4) – als **zweite, sortierbare Spalte** neben „Gesamt" (beide Werte immer sichtbar, Default-Sortierung absolut), über die neue generische Komponente `StatsRankingList`. (Entscheidung 21.07.2026: zweispaltig statt Umschalter.) — *erledigt 21.07.2026; Spalte heißt „Schnitt"; Erklärung per ⓘ-Button in `SectionTitle` (wiederverwendbares `info`-Prop).*
- [x] 1.3 Kumulierte Verlaufskurve (Recharts) als Default-Ansicht + Umschalter Liste/Kurve. Tier 1: fester Top-5/6-Default; die interaktive Linien-Auswahl (Personen-Filter) und „Klick auf Person → Spieler-Steckbrief" kommen erst in Tier 2. — *erledigt 22.07.2026; `ScoreCurve.jsx` (nur absolut, pro Partie), Umschalter Verlauf|Tabelle (Default Verlauf). Statt Legende: rechte Rang-Liste (Rang·Name·Punkte in Linienfarbe) + Tooltip in Rangfolge. Eigene distinkte Linien-Palette statt Avatarfarben (die kollidierten). Recharts ^3.10.0.*

**Phase 2 – Infrastruktur: Zeitraum-Filter**
- [x] 2.1 Globaler, persistenter Zustand (React Context), in die Datenschicht eingehängt (Filter auf `sessions.date`). **Default = laufendes Kalenderjahr.** — *erledigt & abgenommen 22.07.2026.* Vier Modi (Jan-Entscheidung): **Total / laufendes Jahr / bestimmtes Jahr / freier Zeitraum von–bis** (Halbjahre/Quartale/Monate bewusst später). `contexts/StatsFilterContext.jsx` speichert den **Modus** (nicht die Jahreszahl) in localStorage → „laufendes Jahr" folgt automatisch dem Jahreswechsel. `lib/stats.js`: `filterByPeriod(data, {from,to})` (schneidet im Speicher zu, kein neuer DB-Zugriff) + `availableYears(data)`. `components/stats/PeriodFilter.jsx`: Chip-Leiste `[Total][2026][2025]…[Zeitraum…]` + native von/bis-Datumsfelder + Kontextzeile in Worten („Zeitraum: 2026 (laufendes Jahr)" – dort steht der laufend-Hinweis). Rangliste UND Kurve ziehen mit; leerer Zeitraum zeigt Hinweis. „Alle Filter zurücksetzen" erst wenn es mehr als Zeit-Filter gibt (Tier 2).

**Phase 3 – Leistung, punkt-basierte Kennzahlen (kein Gewinner-Flag nötig)** — *erledigt, abgenommen & DEPLOYED 22.07.2026 (Commit 2ed6043)*
- [x] 3.1 L6 Durchschnittsscore — *drei sortierbare Spalten Ø Spiel / Ø Runde / Ø Partie (Summe ÷ eigene gespielte Einheiten). Nenner `playedGamesByPlayer` (überspringt Ausgesetzt), `playedRoundsByPlayer`, `playedSessionsByPlayer`.*
- [x] 3.2 L7 Bester/schlechtester Wert — *Ebenen-Umschalter Spiel/Runde/Partie; Spalten „Höchster/Tiefster", „Tiefster" sortiert per Start-Klick aufsteigend (negativster oben). Unter jedem Rekord das Datum (dd.mm.yy). Ort (`venues.name`) ist mitgeladen, aber bewusst NICHT im engen Ranking angezeigt → kommt später im HOF-Rekord-Screen (Jan-Entscheidung B).*
- [x] 3.3 L2/L3/L4 Erster / Letzter / Netto — *ein gemeinsamer Umschalter Runde/Partie steuert drei Unter-Ranglisten. Erster/Letzter = höchster/tiefster Saldo der Einheit (Gleichstand zählt für alle; bei Null-Abstand niemand), je Anzahl + Quote. Netto = pos/neutral/neg-Anzahl, Quote als kleine Zusatzzeile darunter. Grundgröße `placementStats` (ein Durchgang).*

> **Querschnitts-Verbesserungen an `StatsRankingList` (Phase 3):** beliebig viele Spalten; spaltenspezifische Start-Sortierrichtung (`sortDir`); Farbtönung pro Spalte (`tone`: sign/plain/good/bad/muted – Zähler/Quoten färben nicht mehr nach Vorzeichen); optionale kleine Zusatzzeile pro Wert (`meta.sublabel`, z. B. Datum/Quote); **Top-3-Ansicht mit „Alle anzeigen (N)"** (Standard `topN=3`, gilt für ALLE Listen; sichtbar sind die Top N der aktiven Sortierspalte). Offen/optional: falls sich das wechselnde Top-3 beim Sortieren unruhig anfühlt → Alternative „erster Sortier-Klick klappt auf alle auf" (Einzeiler).

**Phase 4 – Infrastruktur: P6 + Nerd-Modus**
- [x] 4.1 P6-Mindeststichprobe-Filter für Quoten UND Durchschnitte. — *erledigt, abgenommen & DEPLOYED 24.07.2026.* **Schwelle = 8 Einheiten, EINE globale Grenze** (Jan-Entscheidung: uniform, keine Ebenen-Ausnahme – „wenn 8 bei Soli gilt, dann auch bei Partien"). **Dämpfen statt verstecken:** dünne Quote/Durchschnitt (< 8 zugrunde liegende Einheiten) wird grau + kursiv gezeigt und beim Sortieren nach hinten gerückt, aber NIE ausgeblendet (die absolute Anzahl daneben bleibt der Ehrlichkeits-Anker). Absolute Zahlen (Summen, Zähler) und Extremwerte (L7) sind immun. Umsetzung: `lib/stats.js` → `P6_MIN_SAMPLE = 8` + `isWeakSample(n)` (die EINE Stelle, perspektivisch pro Gruppe konfigurierbar). `StatsRankingList.jsx` → per-Zelle `weak`-Flag (grau+kursiv + Sortier-Rang solide<dünn<fehlend) und `meta.weak` (kursive Unterzeile für Netto-Quoten). `StatsPage.jsx` → Bau-Funktionen füttern `isWeakSample(nenner)` je Spalte mit dem eigenen Nenner (Schnitt→Runden, Ø Spiel/Runde/Partie→je eigene, Erster/Letzter-Quote→Einheiten, Netto-Quoten→Einheiten). Default-Sortierung bleibt überall auf einer immunen Spalte → Ranglisten springen beim Öffnen nicht. *Statistischer Hinweis: 8 ist eine Rausch-Schwelle, kein Gütesiegel – bei ~50 Runden/Jahr wird keine Quote je „richtig" belastbar; Shrinkage gegen den Gruppenschnitt wäre der sauberere Weg, bewusst als späteres Nerd-/Tier-3-Feature vorgemerkt.*
- [x] 4.2 Nerd-Modus-Schalter (global) – erste Nutzlast: σ neben dem Box-Plot (L8). Zurückgestellt bis L8 (Jan, 24.07.2026), dann gemeinsam gebaut. — *erledigt 26.07.2026.* **Konzepttreu: nur σ hängt hinter dem Schalter, der Box-Plot selbst bleibt für alle sichtbar** (der Schalter ergänzt Tiefe, sperrt keinen Grundwert weg). Umsetzung: `StatsFilterContext` hält `nerdMode` (eigener localStorage-Schlüssel `dokorama.statsNerd`, Default aus); `NerdToggle`-Pille oben bei den Filtern. **Perspektive (nicht gebaut, Jan-Idee 26.07.):** Schalter am Spieler statt global + Login-/Rollen-Gate (Anonyme sehen die Tiefe nicht) – das Konzept sieht ein Zugriffs-/Pricing-Gate an genau diesem Schalter schon als späteren Nebeneffekt vor.

**Phase 5 – Leistung, restliche Kennzahlen (Winner-Flag + Nerd-Modus)**
- [x] 5.1 Gewinner-Bestimmung – **geänderte Umsetzung:** KEIN DB-Flag/Backfill, sondern Gewinner live in `stats.js` aus den Zählpunkten abgeleitet (`deriveWinner`, robuster gegen Altimporte). — *erledigt & deployed 26.07.2026 (Commit 51a5a8a).*
- [x] 5.2 L1 Sieg/Niederlage (absolut + Quote, P6). — *erledigt & deployed 26.07.2026 (Commit 51a5a8a); im Block „Sieg · Platz · Saldo", Umschalter Spiel|Runde|Partie.*
- [x] 5.3 L5 Streaks (aktueller + längster). Umfang Sieg/Niederlage + Erster/Letzter (keine netto-Serien); Abbruch = „jedes Nicht-Erreichen bricht"; immun gegen P6. Eigene Sektion „Serien" (Default Partie), Rekord-Datumsspanne + „aktuell". — *erledigt 26.07.2026.*
- [x] 5.4 L9 Deutlichkeit der Siege (Verteilung über die erreichten Stufen). Gestapelter Balken, zwei Fässer (normal=grau vs. deutlich=Hitze-Rampe, deutlichste links), Sortierung nach Anteil deutlicher Siege, Tap-Detailzeile fürs Handy. Setzte die 25.03.-Augen-Reparatur voraus (erledigt). — *erledigt 26.07.2026.*
- [x] 5.5 L8 Streuung/Konstanz (Box-Plot; σ im Nerd-Modus) – punkt-basiert. — *erledigt 26.07.2026.* Waagerechter Box-Plot je Spieler:in auf EINER gemeinsamen Skala (min/Q1/Median/Q3/max), Whisker auf echtes Min/Max (keine Ausreißer-Punkte), feine 0-Linie, Tap-Detailzeile fürs Handy. **Entscheidungen (Jan):** Default-Ebene **Spiel** (meiste Datenpunkte), Sortierung nach **Median**, P6-Dämpfung bei < 8 Werten (grau + ans Ende). σ nur im Nerd-Modus. `lib/stats.js` → `spreadStats(data,level)` + `quantile`-Helfer (lineare Interpolation „Typ 7"); σ = Populations-Standardabweichung. NEU `components/stats/BoxPlot.jsx` (theme-fähig über Design-Tokens).

**Phase 6 – Ausdauer-Block (A1–A7)**
- [x] 6.1 A1 Mengen (Spiele/Runden/Partien), A2 Dichte, A3 Teilnahmequote – voll verfügbar. — *erledigt 27.07.2026.* Alle drei P6-immun (Mengen/Dichte absolut, A3 = Gruppen-Nenner) → keine Dämpfung. A2 = Ø Runden/Partie + Ø Spiele/Runde (Master-Tabellen-Variante, eigene Einheiten). **Zusammen mit der Navigations-Ebene 0/1 gebaut (Vorziehen aus Phase 7):** Dashboard mit Gesamtscore-Held + Rubrik-Kacheln (Leistung/Ausdauer, mit Highlight-Zeile) → Tap öffnet Rubrik-Seite mit Zurück; `activeBlock`-State in StatsPage, kein Router. Neue Bau-Fns in StatsPage (buildMengen/buildDichte/buildTeilnahme, reuse der vorhandenen playedGames/Rounds/SessionsByPlayer); NEU `RubrikCard`/`RubrikGrid`/`BackBar`.
- [x] 6.2 A4 Anwesenheits-Timeline. — *erledigt & abgenommen 28.07.2026.* Präsenz-**Streifen** (nicht Kurve): pro Person EIN durchgehender Balken (Segment je Abend, direkt aneinander), grün = dabei / grau = gefehlt; füllt volle Breite (`flex-1`), kein Scrollen – Segmente werden bei vielen Abenden schmaler. Oben nur jeder k-te Abend ein festes Datumslabel (Ziel ~6). **Zwei Interaktionen:** Tap auf eine Zeile → Detailzeile (N von M Abenden, von–bis); Wischen/Maus über die Balken → senkrechter Fadenkreuz-Strich + genaues Datum oben (am Balken-Rand festgeklemmt, Strich sitzt am Rand am Label-Ende). Wisch (> 8 px) schaltet KEIN Detail um. `stats.js` → `attendanceTimeline(data)` (chronologische Abende + Präsenz-Reihen aus `round_participations`, P6-immun, alle Zeilen sichtbar). NEU `components/stats/AttendanceGrid.jsx`. Als 4. Sektion in der Ausdauer-Rubrik.
- [x] 6.3 A5 Gebeversuche + A6/A7 Spielzeit. — *erledigt & abgenommen 29.07.2026.* **A5 Gebeversuche:** Ranking mit „Gaben" (absolut, P6-immun) + „Mehrlast %" (Gaben ÷ eigene Runden − 1, P6-gedämpft wie jede Quote, Default-Sort). Gaben = Rotation (1×/Runde) + Solo-Neugabe (nach angesagtem Solo gibt derselbe nochmal) + jedes Neugeben aus `round_redeals` (alle 4 Ursachen), gezählt nach `dealer_id`. Verifiziert: Σ Gaben = 240 = 238 Spiele + 2 Redeals (alle 49 Runden lückenlose Sitzfolge 1..n). `stats.js` → `dealingStats(data)`; `loadStatsData` lädt jetzt `seat_position`, `created_at` und `round_redeals(dealer_id)`. **A6/A7 Spielzeit:** nur aus App-erfassten Abenden (augen_re gesetzt = echte Uhrzeit; Importe ~0,1 min Import-Sekunde → raus) mit sichtbarem **P2-Lückenhinweis** (`GapNote`) statt falscher 0. A6 = Spielstunden je Person (Ranking), A7 = Ø Partie/Runde/Spiel als Gruppen-Kacheln (`DurationTiles`, Spiel-Ebene mit „mit Vorsicht"-Fußnote). `stats.js` → `playtimeStats(data)`. **Ursachen/Verursacher der Neugeben gehören bewusst NICHT hierher, sondern nach KUR4 (Tier 3):** A5 zählt nach `dealer_id` (Mischarbeit), KUR4 nach `culprit_id` (Schuldfrage) – „Vergeben" = Tollpatsch-Orden.

**Phase 7 – Feinschliff Navigation**
- [~] 7.1 Ranglisten-Zwischenebene. **Ebene 0/1 (Rubrik-Kacheln Leistung/Ausdauer → Rubrik-Seite mit Zurück) bereits mit 6.1 vorgezogen & erledigt (27.07.2026).** OFFEN bleibt der Rest, bewusst zusammen mit dem Spieler-Steckbrief in **Tier 2**: Kennzahl-Kacheln (Top 3 je Kennzahl) → Klick = Vollliste einer einzelnen Kennzahl → Klick auf Person = Spieler-Steckbrief. (Grund fürs Verschieben: der Absprung-Sinn der Kennzahl-Kachel ist der Steckbrief; ohne ihn wäre „Kachel → Vollliste" = das heutige inline-„Alle anzeigen".) **→ Der offene Rest ist jetzt Phase 10.3 im Tier-2-Bauplan.**

### Tier 2 – Bauplan (in Arbeit)

> Fachliche Grundlage weiterhin STATISTIK_KONZEPT.md (Kennzahl-Nummern R…/S…/H…/AM…/K…/DK…/F…, die Steckbrief-Abschnitte A–F, das Darreichungs-Muster Kompakt→Vollliste→Steckbrief und die Navigations-Ebenen). Phasen-Nummerierung setzt den Tier-1-Bauplan fort (dort Phase 0–7). Reihenfolge-Entscheidung (Jan, 29.07.2026): **Partie-Steckbrief zuerst vorgezogen** (unabhängig, reines Filtern vorhandener Daten, sofort im laufenden Betrieb nach Partie-Abschluss sichtbar), danach die Steckbrief-Infrastruktur, dann die restlichen Ranglisten-Blöcke, die den Spieler-Steckbrief nach und nach anreichern.

**Phase 8 – Partie-Steckbrief („Stats of the Party") — vorgezogen** — *erledigt & abgenommen 01.08.2026.*
> Sitzt auf dem Endstand-Screen (`SessionResultPage`) DIREKT unter der Rangliste (Jan-Entscheidung: prominenteste Variante, nur bei beendeten Partien; Gruppendaten via `loadStatsData` nur dann geladen). NEU `components/stats/PartieSteckbrief.jsx`. Kein neuer Datentopf – bestehende Kennzahlen, auf genau eine Partie gefiltert.
- [x] 8.1 Verlaufskurve über die Spiele DIESER Partie – `ScoreCurve` per optionalem `meta`-Prop wiederverwendet (x-Achse = Spielnummer INNERHALB der Runde, durchgezogene Rundentrenner + „Runde X"-Label im Diagramm in Muted-Grau, Tooltip „Runde X · Spiel Y", y-Achse mit Luft nach unten für die Labels). Rechter Rand trägt den Endstand. `stats.js` → `buildSessionCurve(data, sessionId)` (liefert points + players + meta). — *erledigt 29.07.2026.*
- [x] 8.2 Bester/schlechtester Einzelspielwert des Abends (`sessionSingleGameExtremes`, L7-Logik auf die Partie) + Streak des Abends (`sessionStreaks`, L5-Logik nur innerhalb des Abends, Aussetzen unterbricht nicht, ab Länge 2). Anzeige: Kacheln mit ALLEN Inhaber:innen, je Zeile ein Name + Kurzort in Muted-Klammer (Rekord `(R4S2)`, mehrfach `Dani (R2S3 + R4S1)`, Streak-Spanne `(R3S2–R4S2)`). — *erledigt 29.07.2026.*
- [x] 8.3 Anzahl Soli / Sonderspiele / Sonderpunkte des Abends mit **längenbereinigtem Erwartungswert** statt simplem Ø (Jan-Klemmer: simpler Ø/Partie ist durch die Abendlänge verzerrt). Erwartung = Gruppen-Rate PRO RUNDE (Gesamtzahl ÷ alle Runden) × Runden dieses Abends. `stats.js` → `sessionCounts(data, sessionId)` (count + expected + byPlayer). Darstellung: **Bullet-Bar** (Füllung bis Ist, Marker am Erwartungswert; Ist-Zahl über dem Füll-Ende, Erwartungszahl unter dem Marker), Pro-Person-Zeile („Dani 2 · Jan 1", Soli nach Solist:in, Sonderspiele nach Hauptrolle, Sonderpunkte nach Erzieler:in), ⓘ-Erklärsatz. **Dreistufige Lesart** im Text über den symmetrischen Faktor max(ist,erw)÷min(ist,erw): ≤1,15× Norm · bis 1,5× etwas · bis 2× deutlich · >2× außergewöhnlich (mehr/weniger). Loader-Ergänzung: `specialPointPlayers` je Spiel. — *erledigt & abgenommen 01.08.2026.*
- **Bewusst NICHT in Phase 8 (bleibt offen):** HOF/KUR-Ereignisse des Abends (HOF/KUR existieren als Blöcke erst in Tier 3 → Nachzügler) und „Neue Rekorde/Ranking-Veränderungen durch diese Partie" (rechnerisch teuer, Vorher-Nachher-Vergleich → Tier 4). *Offene Idee für später (nicht gebaut):* Typ-Aufschlüsselung der Zahlen (was für Soli/Sonderpunkte, z. B. „2× Buben, 1× Damen").

**Phase 9 – Infrastruktur: Personen-Filter (Achse 5)** — *erledigt & abgenommen 02.08.2026.*
- [x] 9.1 Universeller Personen-Filter analog zum Zeitraum-Filter. `StatsFilterContext` hält `personIds` (+ `togglePerson`/`clearPersons`) und den Modus `personMode`, alles in localStorage gemerkt (eigene Schlüssel). `filterByPersons(data, personIds)` in `lib/stats.js` (Schnittmenge auf Spiel-Ebene, räumt leere Runden/Partien weg). NEU `components/stats/PersonFilter.jsx` – **ausklappbar** (schlanke Auslöser-Zeile → umbrechendes Avatar-Raster, Stammspieler:innen zuerst), damit es bei 10–15 Personen nicht überfrachtet.
  - **Kern-Entscheidung (Jan):** Angezeigt werden IMMER nur die gewählten Personen – nie unbeteiligte Dritte mit Teil-Ausschnitt. Die Berechnung läuft weiter über alle vier am Tisch (relative Kennzahlen wie „Erster" bleiben korrekt), erst die ANZEIGE wird eingedampft (`selectRows` in `StatsPage`).
  - **Zwei Modi bei 2+ Personen** (Umschalter, Default = *Gemeinsame Spiele*): **Gemeinsame Spiele** = nur Spiele, in denen ALLE dabei waren (Head-to-Head, `filterByPersons` greift); **Ganze Historie** = jede Person über ihr volles Konto (keine Spiel-Einschränkung, nur Anzeige gefiltert). Bei 1 Person identisch → Umschalter unsichtbar.
  - **Wirkungsbereich (Jan):** wirkt auf **Gesamtscore + Leistung**; der **Ausdauer-Block bleibt außen vor** (rechnet auf `periodFiltered`) und wird bei aktivem Personen-Filter **ausgegraut** (Rubrik-Kachel) bzw. mit Hinweis versehen (Rubrik-Seite). Als Nebeneffekt fällt die Konzept-Verfeinerung „Gesamtscore-Kurve zeigt nur die gewählten Linien" gratis mit ab.
  - **„Alle Filter zurücksetzen"** aktiviert (Zeitraum + Personen + Modus), sichtbar sobald ein Filter vom Standard abweicht (`filtersActive`). Personen-Reset heißt konsequent **„Alle Personen"** (Pendant zum „Total"-Chip beim Zeitraum).
  - **Offen → Phase 10:** das automatische Setzen des Filters beim Betreten eines Spieler-Steckbriefs (und Zurücksetzen beim Verlassen) – die Infrastruktur (`setPersonIds`/`resetFilters`) trägt es bereits, die Verdrahtung passiert mit dem Steckbrief selbst.

**Phase 10 – Personen-Verzeichnis + Spieler-Steckbrief-Gerüst + 7.1 Kennzahl-Kacheln**
> Das Herzstück / der Konvergenzpunkt: macht die Ranglisten erst richtig nutzbar. Startet bewusst schlank und füllt sich, sobald die Blöcke aus Phase 11–14 landen.
- [ ] 10.1 Personen-Verzeichnis (neuer Top-Level-Einstieg): Liste aller Spieler:innen, Default-Sortierung nach A1 (Anzahl Partien), Sortierwert direkt neben dem Namen („Robert – 87 Partien").
- [ ] 10.2 Spieler-Steckbrief-Gerüst mit den Abschnitten: A Kopf (Name/Avatar), B Gesamtscore + Wasserfall G2 (G2 wegen ⚙️ ggf. nachziehen), C Highlights (Kennzahlen, bei denen die Person in einer Top-3 auftaucht), D Spielstil (Reizhöhe/Lieblings-Solo/Mut-vs-Können – füllt sich mit R/S), E Teamplay (später, Tier 4), F Hall of Fame (Rekordhalter). Statt eigenem „Alle Werte"-Bereich ein Link → bestehende Ranglisten, via Personen-Filter (Phase 9) auf diese Person vorgefiltert.
  - **Offene Design-Frage (aus Phase 9 mitgenommen):** Der Personen-Filter zeigt bewusst NUR die gewählten Personen an (`selectRows`). Setzt der „Alle Werte"-Absprung ihn auf EINE Person, zeigt jede Rangliste dann nur DEREN eine Zeile – der „wo stehe ich unter allen?"-Kontext geht verloren. In Phase 10 entscheiden: reicht das so (Steckbrief = die eigenen Werte pro Kennzahl), oder soll der Absprung stattdessen „alle anzeigen, diese Person hervorheben"? Ggf. braucht der Personen-Filter für den Einzel-Fall einen „Hervorheben statt Filtern"-Modus.
- [ ] 10.3 **7.1-Rest: Kennzahl-Kacheln (Navi-Ebene 2).** Je Kennzahl eine Kompakt-Kachel mit Top 3 (Name + Wert, ohne Datum/Ort). Zwei Klickziele je Kachel: Klick auf Kachel/Kennzahl → Vollliste dieser einen Kennzahl; Klick auf einen Top-3-Namen → Spieler-Steckbrief dieser Person. Erst mit den vorhandenen Blöcken (Leistung/Ausdauer), erweitert sich mit Phase 11–14.

**Phase 11 – Risiko-Block (R1–R5)**
> Gleiches Bau-Pattern wie Leistung/Ausdauer. Speist zusätzlich Steckbrief-Abschnitt D (Reizhöhe/„Spielstil").
- [ ] 11.1 R1 Ansage-Pyramide (Häufigkeit + Erfolgsquote, Grundansage + Absagen K90/K60/K30/Schwarz, je Re/Kontra/Solo, Drilldown-Ebenen), R2 Re- vs. Kontra-Profil.
- [ ] 11.2 R3 Ansage-Bilanz (deskriptiv, netto Punkte), R5 Überreizt-Quote (total + je Absage-Stufe).
- [ ] 11.3 R4 Mut-Ertrag (theoretisch/modellhaft; ⚙️ rechnerisch teuer – realer Ertrag minus Ertrag derselben Spiele ohne meine Ansagen).

**Phase 12 – Solo-Block (S1–S4)**
> Speist Steckbrief-Abschnitt D (Lieblings-Solo, Mut-vs-Können-Quadrant).
- [ ] 12.1 S1 Solo-Häufigkeit, S2 Solo-Quote (Erfolg).
- [ ] 12.2 S3 Aufschlüsselung nach Typ (Häufigkeit + Quote je Typ; Farb-Solo konsolidiert, Farb-Drilldown P2), S4 Solo-Punkteertrag (Saldo + Box-Plot – `BoxPlot` wiederverwenden).

**Phase 13 – Sonderspiele-Block (H1–H2, AM1–AM2)**
- [ ] 13.1 H1/H2 Hochzeit (Häufigkeit + Quote, je als Hochzeiter:in / als Eingeheiratete:r), AM1/AM2 Armut (Häufigkeit + Quote, je als arm / als reich). Gegenrollen H2/AM2 mit P2-Datenqualitätshinweis (2024 fehlt).

**Phase 14 – Sonderpunkte-Block (K / DK / F)**
- [ ] 14.1 Karlchen: K1 gemacht, K2 gefangen, K3 verloren (P2), K4 Erfolgsbilanz, K5 Jagdbilanz, K6 Doppel-Karlchen (Trophäe).
- [ ] 14.2 Doppelkopf: DK1 Häufigkeit, DK2 Vitrinen-Doppelköpfe (2er/3er/4er). Fuchs: F1 gefangen, F2 verloren, F3 Jagdbilanz, F4 Vitrinen-Füchse (alle Fuchs-Kennzahlen P2 – 2024 nicht erfasst).

---

## D — Historische Daten

Die alten Spielabende in die App holen, damit die Statistiken von Anfang an Substanz haben.

> Reihenfolge bewusst **nicht** chronologisch, sondern nach Aufwand und Fortschritt: 2026 zuerst, weil der Import dort bereits läuft.

1. **2026er Buchmitschriften importieren** – die handgeschriebenen Spielabende aus Roberts Büchlein über den Foto-/JSON-Workflow (transkribieren → strukturieren → als Import-JSON über Claude Code einspielen). Läuft bereits, Jan ist gut dabei. Wissensbasis und Gedächtnis dafür ist die **ROBERT_IMPORT.md**, die nach jedem Abend um neue Kürzel, Sanity-Checks und Eigenheiten von Roberts Handschrift ergänzt wird.
2. **Jahr 2024 importieren** – aus Jans vollständig erfasster Excel-Datei. Füllt die Statistiken (Block C) sofort mit einem ganzen Jahr Substanz.
3. **In-App-Erfassung historischer Spiele** – ein Feature in der App, mit dem sich handschriftliche Notizen nachträglich erfassen lassen. Das ist im Kern die **In-App-Automatisierung des heutigen Foto-Workflows**: Was Jan jetzt manuell mit Claude Code macht und in ROBERT_IMPORT.md dokumentiert, wird zum Werkzeug. Genau dieses gesammelte Wissen ist die spätere Spezifikation. Der Hebel dahinter: Damit können **mehrere aus der Runde** mithelfen und der nächste Brocken (2025) lässt sich auf viele Schultern verteilen.
4. **Jahr 2025 importieren** – der große, noch nicht aufbereitete Brocken. Offen, ob das überhaupt jemals gemacht wird und mit welchem Aufwand. Wird durch Punkt 3 (In-App-Erfassung) realistisch, weil dann nicht eine Person alles allein über den JSON-Weg machen muss.

> **Begriffs-Notiz:** Der reale Import-Weg ist **JSON**, nicht CSV – eine Doko-Partie ist zu verschachtelt für eine flache Tabelle. Die alten Roadmap-Begriffe „CSV-Import in der App" und „Foto-Workflow" gehen in den obigen Punkten auf bzw. entfallen; die CSV-Terminologie nicht wieder einführen.

---

## E — Gruppen-Selbstverwaltung

Der Schritt von „alles hartcodiert in der Datenbank" zu „die Runde pflegt sich selbst" – aber zunächst **innerhalb unserer einen Gruppe Dokorama**, noch nicht für fremde Gruppen (das ist Block G).

> **Leitprinzip über dem gesamten Block:** Alles, was ein:e Spieler:in für sich selbst tun kann, muss ein Admin auch **stellvertretend** für sie tun können. **Kein Feature darf einen eigenen Login erzwingen.** Viele in der Runde wollen gar keinen Account – ihnen reicht der lesende Zugang, und Robert oder Jan erledigen den Rest für sie. Ein:e Spieler:in ohne Login muss trotzdem Avatar, Lieblingsort usw. haben können – eben von Admin-Hand gepflegt.

> **Architektur-Entscheidung (28. Juni 2026):** E wird von Anfang an mit **Owner-Rolle und Einladungs-Mechanismus** gebaut, **nicht** mit freier Selbst-Registrierung. Das passt zur DNA des Projekts (Konzept „Gruppe" laut CLAUDE.md von Anfang an im Schema, auch wenn V1 nur eine Gruppe hat) und vermeidet späteres Re-Engineering: Für weitere Gruppen (Block G) muss dann an der Verwaltung nichts umgebaut werden, man legt einfach eine zweite Gruppe an.

1. **Admin-Bereich** – der geschützte Ort, in dem Owner/Admins die Gruppe pflegen: Spieler:innen anlegen und bearbeiten (inkl. Avatar), Austragungsorte anlegen und bearbeiten (inkl. Hintergrundbilder, technisch in der CLAUDE.md bereits spezifiziert: Supabase Storage, Bucket `venue-images`), Gruppen-Stammdaten bearbeiten. **Sofort baubar**, weil Jan und Robert bereits Accounts haben. Deckt von Anfang an **alle** Verwaltungsfunktionen ab – ist damit der mächtigste und zugleich erste sinnvolle Schritt.
2. **Rechte- & Rollenmodell mit Owner-Rolle** – eine Gruppe hat einen **Owner** als oberste Rolle, darunter Admins. Owner/Admins vergeben und entziehen Rechte. Von Anfang an so gebaut, dass es später für mehrere Gruppen trägt.
   - *Offene Denkfrage (Detailphase):* Ist „Schreiben dürfen" automatisch an jeden Login geknüpft, oder ist es ein eigenes Recht, das ein Admin erst vergeben muss? Eng verbunden mit Block B – dort zusammen betrachten.
3. **Registrierung per Einladung (Invite-Link)** – keine freie Selbst-Registrierung; man kommt nur über einen Invite-Link in eine Gruppe (so kann sich niemand Fremdes einfach in die Dokorama-Gruppe einklinken). Dazu die Account-Verwaltung für alle, die einen eigenen Login *wollen*: Passwort vergessen, Passwort neu setzen, Account löschen.
4. **Selbst-Pflege durch eingeloggte Spieler:innen** – was man ohne Admin-Rechte für sich selbst tun darf: eigenen Avatar ändern, eigene Orte anlegen/ownen. Bewusst eine **Teilmenge** dessen, was der Admin (Punkt 1) ohnehin schon kann – niemals der einzige Weg zu einer Funktion (siehe Leitprinzip).

> **Abgrenzung zu G:** Owner/Admin/Invite *innerhalb* einer Gruppe gehören nach E. Der **Super-Admin**, der über *mehreren* Gruppen steht, gehört nach G – er ergibt erst mit der zweiten Gruppe Sinn.

> **Begriffs-Notiz:** „Avatare" sind kein eigener Punkt mehr – Avatar ändern steckt in Punkt 4 (Selbst-Pflege), Avatar für andere anlegen in Punkt 1 (Admin-Bereich).

---

## F — Technik & Betrieb

Querschnitts-Themen, die zu keinem Feature-Block gehören.

1. **Volle Offline-Erfassung mit Sync** – am Spieltisch ohne Internet erfassen und später synchronisieren. Das gewichtigste Thema dieses Blocks.
   - *Notiz:* Kollidiert konzeptionell mit dem Kugelschreiber-Modell aus Block B – wenn eine Person offline weiterschreibt und eine andere online, muss der Sync entscheiden, wer den Stift hatte. Beim Ausarbeiten zwingend mit B zusammen denken.
2. **JSON-Export** – Partien/Daten als JSON herausziehen. Nur JSON, kein CSV (eine Partie mit Ansagen, Sonderpunkten und Rollen ist zu verschachtelt für eine flache Tabelle). Komfort, da vieles davon auch direkt über die Datenbank machbar ist.
3. **JSON-Import (Datensicherung & -wiederherstellung)** – exportierte Partien wieder einspielen, z. B. nach manuellen Korrekturen (exportieren → anpassen → alte Partie löschen → reimportieren). **Abzugrenzen von Block D:** Das hier ist Sicherung/Wiederherstellung *bestehender* App-Daten, nicht der historische Erst-Import von außen.

> *(PWA-Setup ist erledigt und steht im Erledigt-Bereich, nicht hier.)*

---

## G — Öffnung für weitere Gruppen

Der Schritt von „unsere eine Runde" zu „beliebig viele Doppelkopf-Gruppen". Echte Zukunft – kein aktueller Scope, aber im Design schon berücksichtigt.

> Natürliche Reihenfolge vom Fundament zum Glanz. Strategie „erst hartcoden, dann konfigurierbar" ist dieselbe, die schon in V1 trägt (Jans Zählweise ist hartcodiert, das Datenmodell aber flexibel).

1. **Mehrere Gruppen technisch ermöglichen** – die App von „eine Gruppe" auf „viele" heben. Dazu der **Super-Admin**, der über Gruppen hinweg zugreifen kann, und eine Spieler-/Rechte-/Admin-Verwaltung, die überall sauber beantwortet, zu welcher Gruppe jemand gehört und wer Admin welcher Gruppe ist. Das Datenmodell ist laut CLAUDE.md darauf vorbereitet – hier wird es aktiviert. (Das in E gebaute Owner-/Invite-Modell trägt hier weiter.)
2. **Befreundete Gruppen mit hartcodierten Zählweisen** – die ersten ca. 10 Gruppen manuell dazuholen, ihre Zählregeln fest verdrahten, ihnen Namen geben und schon für andere auswählbar machen. Der pragmatische Zwischenschritt **vor** echter Konfigurierbarkeit.
3. **Konfigurierbare Zählweisen (Regel-Engine + Konfigurations-UI)** – Gruppen stellen ihre eigene Zählweise selbst ein (welche Ansagen/Absagen, Sonderpunkte, Spieltypen; wie der Spielwert berechnet wird). Der große Brocken, den Schritt 2 bewusst noch umgeht. Beinhaltet echtes User-Management für alle Spieler:innen.
4. **Gruppenübergreifende Features** – Doko-Dating (neue Runden kennenlernen), offene Partien / fehlende Spieler:innen ausschreiben, gruppenübergreifende Statistiken. **Hier passen Notifications hinein**, weil man jetzt Menschen erreichen will, die *nicht* am selben Tisch sitzen (push-getriebene Stupser nach außen – für den heutigen Tisch-Use-Case unnötig, hier sinnvoll). Ebenfalls hier: Sichtbarkeitslogik für Austragungsorte (öffentlich/privat), die erst mit mehreren Gruppen Sinn ergibt.
5. **Turniere** – eigene Entität mit Turniermodus, vorgegebenen Tisch-Konstellationen, Teilnehmer:innen aus ggf. verschiedenen Gruppen und Turnierauswertung. Tische innerhalb eines Turniers funktionieren ähnlich wie Partien, gehören aber zum Turnier und werden vom Turniermodus vorgegeben (so in der CLAUDE.md skizziert).

---

## H — Monetarisierung *(tbd)*

Reine Zukunft. Übernommen aus der CLAUDE.md-Skizze; hier bewusst nicht weiter vertieft.

Angedachtes Tarif-Modell:

1. **Standard** – kostenlos, lesender Zugriff via Gruppenlink
2. **Pro** – Login, Partien erfassen als Schreiber:in
3. **Group Master** – Gruppen anlegen, administrieren, Zählregeln konfigurieren
4. **Tournament Master** – Turniere anlegen, Teilnehmer:innen einladen

**Offene Pricing-Frage:** Einmalzahlung ist sympathisch, aber recurring revenue ist nötig (laufende Kosten + endliche Zielgruppe). Details tbd.

> Die technische Umsetzung (Stripe o. Ä.) hängt an den Features in Block G – ohne mehrere Gruppen, Konfigurierbarkeit und Turniere gibt es nichts zu monetarisieren.

---

# Was als Nächstes

> Dies ist die **einzige** blockübergreifende Priorisierung in diesem Dokument – bewusst kurz gehalten auf die nächsten Brocken, statt alle Punkte aller Blöcke in eine Gesamtreihenfolge zu pressen (die sich ohnehin laufend ändert). Reihenfolge:

1. **Block C – Statistiken bauen (Tier 2).**
   Der eigentliche Wert des Projekts und der Grund, warum Dokorama existiert. **Tier 1 ist abgeschlossen** (Gesamtscore-Startbildschirm, Ranglisten Leistung + Ausdauer, P6-/Zeitraum-/Nerd-Modus-Infrastruktur). Als Nächstes wird Tier 2 gebaut (Detail-Bauplan Phase 8–14 oben): Partie-Steckbrief vorgezogen, dann Personen-Filter + Personen-Verzeichnis/Spieler-Steckbrief (inkl. 7.1-Kacheln), dann die restlichen Ranglisten-Blöcke Risiko/Solo/Sonderspiele/Sonderpunkte.

2. **Block D, Punkt 1 – 2026er Import.**
   Läuft bereits parallel und wird weitergeführt (Foto-/JSON-Workflow, ROBERT_IMPORT.md). Stand 29.06.2026: alle 12 Spielabende 2026 (Januar–Juni) importiert, DB ist aktuell.

3. **Block D, Punkt 2 – Jahr 2024 aus der Excel.**
   Füllt die Statistiken (Block C) mit einem ganzen Jahr Substanz.

---

# Erledigt

> Abgeschlossene Arbeit, zur Bewahrung der Historie aus den Arbeitsblöcken herausgehalten, damit A–H nur Offenes zeigen.

## ✅ Phase 1: Fundament – 1. Juni 2026
Entwicklungsumgebung (Node.js, React/Vite, Tailwind + shadcn/ui, GitHub); Cloud-Dienste (Supabase EU/Frankfurt, Vercel, Auto-Deploy); Datenbank-Schema (11 Tabellen, RLS); Design-Grundlagen (Waldgrün); Basis-Frontend (Routing, Tab-Bar, Erfassungsscreen); Seed-Daten (Gruppe „Dokorama" + 11 Spieler:innen). App live unter `dokorama.vercel.app`.

## ✅ Phase 2: Erfassung – 22. Juni 2026
Architektur-Fundament (`SessionContext`/`GameContext`, `TableView`, View-Switcher); Partie starten; Runden-Logik (Rotation, Aussetzer, Solo-Verlängerung); Tisch-Ansicht Einzelspiel erfassen inkl. vollständiger Konsistenz-Engine (Invarianten I1–I15, Dialog-Infrastruktur, Fallback + Logging in `consistency_logs`) nach KONSISTENZREGELN.md; automatische Spielwert-Berechnung (`scoreCalculation.js`, gegen 15 Testfälle validiert); Auswertungs-Screen & Bestätigung; Korrektur/Löschen von Spielen; Spielstandanzeige; Runden-Übergang; Hamburger-Menü; Partie abschließen; laufende & fertige Partien auf der Startseite.

## ✅ Auth-Phase: Login – 25. Juni 2026
`AuthContext`, `LoginPage` (`/login`); Schreib-Aktionen geschützt; laufende Partie über Spielstand-Screen zugänglich; `sessions.created_by` und `consistency_logs.writer_id` befüllt; DB-Migration 005; Jan + Robert in `players.auth_user_id` verknüpft. (Der lesende Gruppen-Zugang funktioniert faktisch, ist aber in Block B, Punkt 1 noch einmal zur bewussten Abnahme vermerkt.)

## ✅ PWA-Setup – 27. Juni 2026
`manifest.json`, App-Icons 192/512 + maskable (Safe-Zone-Padding auf Waldgrün-Canvas), Service Worker via `vite-plugin-pwa` (Workbox), `OfflineBanner`, Datenverlust-Schutz durch `draft.js`.

## ✅ Block B: Live-Mitsehen & Kugelschreiber-Modell – 28.–29. Juni 2026
Supabase Realtime: Watcher spiegeln Tischzustand live via Postgres Changes (`live_draft`); Broadcast-Events für `writer-changed`, `game-saved`, `round-complete`, `next-round`. Kugelschreiber-Modell: `current_writer_id` in `sessions`, DB-Migration 008; genau ein aktiver Schreiber zu jedem Zeitpunkt; Übernahme-Dialog für eingeloggte Mitspieler:innen. Watcher-Banner (gelb) auf Tisch-, Auswertungs- und Rundenende-Screen; Buttons sehen für Schreiber:in und Zuschauer:in identisch aus – Klick als Zuschauer:in öffnet Übergabe-Dialog statt direkt zu handeln. iOS-Fix: `generateId()`-Polyfill für `crypto.randomUUID` (crash auf http-Kontext). Wake Lock (Handy bleibt beim Schreiben wach).

## ✅ Neugeben-Feature – 1.–2. Juli 2026
Neue Tabelle `round_redeals` (DB-Migrationen 009 + 010): vier Typen (`fuenf_neunen`, `armut_abgelehnt`, `trumpfschwach`, `vergeben`), `game_id` als FK mit Cascade-Delete. UI: Dealer-Chip-Tap öffnet `RedealSheet` (Typ auswählen → Avatar-Picker für Verursacher; „Vergeben" braucht keinen Picker). Gebeversuch-Badge zählt ab dem 2. Versuch hoch; Tap auf Badge öffnet Übersicht mit Löschen. Redeals leben im `GameContext` (`addRedeal`/`removeRedeal`) und fließen über `live_draft` zu Zuschauern; Persistenz in DB beim Bestätigen des Spiels mit der dann bekannten `game_id`. Statistik-Kategorie 7 (Neugeben & Schmeißer) in CLAUDE.md spezifiziert.
