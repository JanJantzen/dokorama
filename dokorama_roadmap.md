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

> **Dieser Block bekommt eine eigene, gründliche Session** und wird hier bewusst nur grob umrissen. Er ist zu groß und zu wichtig für ein Nebenbei.

Grobe, noch nicht final sortierte Bestandteile (aus der bisherigen Roadmap):

- **Basis:** Gesamtscore / Rangliste; Leistung (Siegquoten, Durchschnitte, Streaks – auf allen drei Ebenen Spiel/Runde/Partie); Ausdauer & Engagement (Teilnahme, Anwesenheitsquote); Zeitraum-Filter (Total, Kalenderjahr).
- **Verlauf:** Zwischenstand je Rundenende + Verlaufskurve pro Spieler:in (Charts via Recharts).
- **Erweitert:** Risikofreude (Ansagen-Statistiken); Einzelkämpfer (Solo-Statistiken); Sonderpunkte & Sonderspiele; Normierung auf „pro 4 Runden".
- **Weiter hinten:** Head-to-Head-Statistiken; Ortsstatistik; Fun Stats / Rekorde.

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

1. **Block B – Live-Mitsehen & Schreiber-Übergabe (Kugelschreiber-Modell).**
   Steht aus gutem Grund vorne: Der erste Schritt darin – das Live-Mitsehen – ist die digitale Entsprechung dessen, was das Büchlein selbstverständlich konnte (jeder am Tisch sieht den aktuellen Stand). Solange das fehlt, ist die App beim gemeinsamen Erleben sogar schlechter als das Buch. Darauf baut die Schreiber-Übergabe für die realen Fälle auf (Robert geht rauchen, Handy leer → Jan übernimmt am eigenen Gerät).

2. **Block C – Statistiken (eigene Session).**
   Der eigentliche Wert des Projekts und der Grund, warum Dokorama existiert. Bekommt eine eigene, gründliche Ausarbeitungs-Session.

3. **Block D, Punkt 1 – 2026er Import.**
   Läuft bereits parallel und wird weitergeführt (Foto-/JSON-Workflow, ROBERT_IMPORT.md).

4. **Block D, Punkt 2 – Jahr 2024 aus der Excel.**
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
