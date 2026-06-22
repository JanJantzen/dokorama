# KONSISTENZREGELN.md – Konsistenzlogik der Spielerfassung (Dokorama)

> **Was dieses Dokument ist**
> Die verbindliche Ergänzung zur CLAUDE.md für die **Konsistenzlogik der Spiel-Erfassung**
> (CLAUDE.md, Phase 2, Punkt 9: „kein inkonsistenter Zustand erlaubt – erklärende Warnungen statt
> stiller Auto-Auflösung"). Es legt fest, welche Eingaben am Erfassungs-Screen zueinander passen
> müssen, was bei Widersprüchen geschieht und wie Konflikte aufgelöst werden. Es wird Claude Code
> zusätzlich zur CLAUDE.md übergeben.

---

## 0. Aufbau

- **Teil A – Grundlagen:** Die Prinzipien, auf denen alle Einzelregeln beruhen.
- **Teil B – Regeln:** Die konkreten Konsistenzregeln, nach Eingabe-Clustern.
- **Teil C – Meldungs-Katalog:** Alle Konflikte mit Optionen und Texten an einem Ort. Blöcke tragen die Nummer ihrer Regel aus Teil B mit C-Präfix (Regel B.x.y ↔ Wording C.x.y).
- **Anhang – Entstehung:** Kurzes Protokoll der Arbeitssitzungen.

---

# TEIL A – GRUNDLAGEN

## A.1 Die zwei genutzten Reaktionsmuster

Auf Eingaben, die dem bereits Erfassten widersprechen (also zu einem inkonsistenten Zustand führen
würden), reagiert die App mit einem von zwei Mustern:

- **Umschalten (ohne Dialog):** Zulässig nur, wenn (1) die beiden Zustände sich gegenseitig
  ausschließende Alternativen **derselben** Eigenschaft sind (Umschalten, kein Hinzufügen) UND (2) die
  Änderung **im selben Blickfeld sofort sichtbar** ist. Dann braucht es keinen Dialog, weil die
  Intention eindeutig ist. Einziges Beispiel: Re/Kontra-Umschalten beim selben Spieler (B.2.1).
- **Auflösungs-Dialog (das Arbeitspferd):** Jeder andere Konflikt. Die App hält an, **benennt alle
  Ursachen** (P2) und bietet eine Abbruch-Option sowie fallabhängige Auflösungs-Optionen (Korrigieren,
  Tauschen oder die Ursache annullieren/zurückziehen). Die genauen Texte stehen im Katalog (Teil C);
  die operative Umsetzung regelt P5.

(Echtes Hart-Blockieren – nicht klickbar, kein Dialog – ist im ersten Wurf nicht vorgesehen; alles
läuft über P5.)

---

## A.2 Grundprinzipien

### P1 – Eine Zuordnung kann durch Ursachen gebunden sein
Ob sich eine Partei-Zugehörigkeit (oder ein anderer Zustand) ändern lässt, hängt davon ab, **welche
Ursachen aktuell an der Person anliegen** – nicht davon, „woher" die Zuordnung kam. Mögliche bindende
Ursachen: eine Re/Kontra-Ansage (B.2.2), ein Sonderspiel (B.4.3), eine Kaskaden-Zwangslage (B.5.4).
- Liegt **keine** Ursache an → die Zuordnung lässt sich direkt ändern (Tausch, B.5.6).
- Liegt **eine** Ursache an → sie muss zuerst aufgelöst werden (Ansage zurückziehen B.5.9 / Sonderspiel
  annullieren B.5.7).
- Liegen **mehrere** an → alle benennen und gemeinsam auflösen (P2).
Der Auflösungsaufwand richtet sich also nach Art und Zahl der anliegenden Ursachen, nicht nach einem
gespeicherten „Herkunfts"-Stempel.

### P2 – Mehrere Ursachen möglich – ALLE benennen
Ein Konflikt kann mehrere Ursachen zugleich haben (z.B. jemand hat Re angesagt UND ist
eingeheiratet). Die Meldung nennt **alle**; eine einzelne zu entfernen genügt nicht, solange weitere
bestehen → gebündelte Auflösung (B.5.7).

### P3 – Auflösung beseitigt den Konflikt, repariert aber nicht die Welt
Eine Auflösung stellt einen klaren, widerspruchsfreien Zustand her. Sie errät **nicht** im selben
Schritt eine neue gültige Konstellation (keine „cleveren" Teilreparaturen). Beispiel: „Hochzeit
entfernen" entfernt die ganze Hochzeit; dass danach evtl. gar keine Hochzeit erfasst ist, sieht der
Nutzer und kümmert sich. **Arbeitsteilung: App hält Konsistenz, Mensch hält Korrektheit.**

### P4 – Konsistenz als Invariante; Prüfung nach jeder (Folge-)Setzung
Konsistenzregeln werden als **zustandsbezogene Invarianten** gedacht (»im fertigen Zustand darf X nie
gelten«), nicht als »Reaktion auf einen bestimmten Klick«. Daraus folgt:
- Derselbe Widerspruch kann von **verschiedenen Eingaben** ausgelöst werden (z.B. ein
  Doppel-Ansage-Konflikt vom Ansage-Klick ODER von einer Partei-Zuordnung). Jede zustandsändernde
  Eingabe triggert die Auswertung aller betroffenen Invarianten.
- Eine **Auflösung ist selbst eine Aktion** und läuft wieder durch die Prüfung – sonst repariert man
  an einer Stelle und reißt an anderer ein Loch.

### P5 – Einheitliches Konflikt-Muster: „optisch ausgegraut, aber klickbar → Auflösungs-Dialog"
Gilt für ALLE Cluster und ist die operative Umsetzung des Auflösungs-Dialogs (A.1). Jeder Klick, der
zu einer inkonsistenten Situation führen würde, erzeugt **immer dasselbe**: einen erklärenden
**Auflösungs-Dialog** (Optionen fallabhängig).
- **Visuelle Voreinstellung (erster Wurf):** kritische Buttons sind **optisch ausgegraut, bleiben
  aber klickbar.** Begründung: Ausgrauen senkt die Rate **versehentlicher** Klicks (sonst sieht alles
  gleich klickbar aus, man klickt rein und wird vom Dialog genervt). Mit Ausgrauen klickt nur, wer
  bewusst denkt „das muss doch gehen" – für den ist der Dialog hilfreich. Vorfilter: filtert
  versehentliche Klicks weg, lässt absichtsvolle durch.
- **Logik unabhängig vom Aussehen:** Konflikt erkennen, Ursachen benennen, Dialog zeigen ist
  identisch, egal ob grau oder nicht. Das Aussehen ist **ein einziger Schalter** (`disabled-looking`
  an/aus), am Ende am Screen umlegbar, ohne die Logik anzufassen.
- **Permanente Vorausschau-Prüfung (zentrale Bauvorgabe):** Die Prüfung läuft **fortlaufend im
  Hintergrund**, nicht erst beim Klick. Für **jeden** anklickbaren Zustand (Toggle, Avatar in einer
  Auswahlliste …) berechnet die App ständig „würde *diese* Aktion einen Konflikt auslösen?". Dasselbe
  Ergebnis steuert (1) die Darstellung vorher (grau = würde Konflikt auslösen) und (2) den Dialog
  nachher (bei trotzdem erfolgtem Klick). Also Vorausschau: nicht „ist der Zustand konsistent",
  sondern „welche nächsten Aktionen würden ihn inkonsistent machen".
- **Ausnahme:** Bei gesetztem Sonderspiel sind die Rollen der nicht auslösenden Spieler **feste
  Labels** (B.4.4), gar keine Buttons – also kein P5-Klickziel. Aufgelöst wird nur an der auslösenden
  Person (B.4.5).

### P6 – Ursachen zur Laufzeit erkennen, NICHT mitschreiben
Es wird **nicht** gespeichert, *warum* eine Zugehörigkeit (oder ein anderer abgeleiteter Zustand)
gesetzt ist. Stattdessen werden die anliegenden Ursachen (P1) im Konfliktmoment **frisch aus dem
aktuellen Gesamtzustand erkannt**.
- Grund: Eine mitgeführte Herkunfts-Buchhaltung wäre eine zweite Datenebene, die synchron gehalten
  werden müsste (Beispiel: jemand zieht seine Re-Ansage zurück, bleibt aber eingeheiratet) – solche
  Ebenen laufen auseinander und führen zu falschen/veralteten Meldungen. Aus dem aktuellen Zustand
  frisch erkannte Ursachen können nicht veralten.
- Konkret: Die Prüfung schaut, ob an der Person eine Ansage, ein Sonderspiel oder eine
  Kaskaden-Zwangslage anliegt – findet sie nichts, ist die Zuordnung frei änderbar (B.5.6); findet sie
  etwas, läuft die Auflösung über die Ursache(n) (B.5.7/B.5.9, bei mehreren kombiniert per P2).

### P7 – Konsistenzlogik liegt ZENTRAL beim Zustand, nicht in einer Ansicht
Die App hat mehrere Erfassungs-Sichten auf **denselben** Zustand: aktuell die Tisch-Ansicht
(`TableView`) mit den Player-Sheets, geplant die Block-Ansicht (`BlockView`). Man wechselt zwischen
ihnen und sieht überall dieselben Daten (geteilter `GameContext`).
- **Konsequenz:** Die Konsistenzlogik (Invarianten, Konflikterkennung, Auflösungsoptionen,
  Vorausschau) muss **zentral beim geteilten Zustand** liegen (`GameContext`-Ebene), nicht in einer
  Sicht. Sonst bräuchte jede Sicht eigene Logik und sie würden auseinanderdriften.
- **Trennung:** Zentral = *welche* Invarianten gelten, *was* ein Konflikt ist, *welche* Optionen es
  gibt, die Vorausschau. In der Sicht = diese Logik nur **abfragen** und das Ergebnis **darstellen**
  (grau/nicht grau, Dialog). Das Player-Sheet löst die Prüfung aus und zeigt das Ergebnis, enthält
  die Prüflogik aber nicht.

### P8 – Geschlossenheit & sicherer Default (es darf NIE ein inkonsistenter Zustand entstehen)
Das Regelwerk soll **garantieren**, dass zu keinem Zeitpunkt – auch nicht für einen Sekundenbruchteil –
ein inkonsistenter Zustand existiert. Dafür ist die zentrale Invariantenprüfung (A.4) die **letzte
Instanz** mit drei ineinandergreifenden Wirkungsweisen auf dieselbe Prüfung:
1. **Präventiv (P5):** Würde ein Bedienelement eine Invariante verletzen, wird es **ausgegraut** (aber
   klickbar). Das Ausgrauen ist nichts anderes als das Ergebnis der Invariantenprüfung „dieser Klick
   wäre nicht konsistent".
2. **Reaktiv:** Der Klick auf ein ausgegrautes Element wirft den **spezifischen Auflösungs-Dialog**
   (die in Teil B/C definierten Fälle).
3. **Sicherer Default (Fallback):** Führte eine Aktion trotzdem zu einem invarianten-verletzenden
   Zustand, für den **kein** spezifischer Dialog definiert ist (eine vom Regelwerk nicht vorhergesehene
   Kombination), wird die Aktion **nicht ausgeführt** – der letzte konsistente Zustand bleibt erhalten.
   Es erscheint eine **generische Meldung** (Teil C, „Fallback") und der Vorgang wird zur Auswertung
   **geloggt** (welche Invariante, welche Aktion, welcher Zustand). So ist „inkonsistent" selbst bei
   einer Lücke im Regelwerk **kein erreichbarer Zustand**, sondern wird strukturell verhindert.
- **Konsequenz:** Die Behauptung „ein inkonsistenter Zustand kann nicht entstehen" (B.6.1) ruht damit
  nicht auf der Hoffnung, alle Fälle erfasst zu haben, sondern auf dem Default „im Zweifel blocken".
  Der Fallback **sollte nie sichtbar werden** – tut er es doch, ist das ein Hinweis auf eine echte
  Regel-Lücke, die nachgezogen werden muss (das Log macht sie auffindbar).

---

## A.3 Einordnungsraster für jeden Einzelfall

1. **WO?** Spielerintern (innerhalb eines Spielers) vs. spielerübergreifend (mehrere Spieler).
2. **WELCHE Ursachen liegen an?** (P1) Keine (frei änderbar) / eine bzw. mehrere
   (Ansage / Sonderspiel / Kaskade – ggf. mehrere zugleich, P2).
3. **WIE reagiert die App?** Umschalten (A.1) oder Auflösungs-Dialog (P5).

Randbedingung für ALLES: Geprüft wird immer innerhalb **eines Spiels** mit genau **vier aktiven
Spielern** (zwei pro Team). Aussetzer sind auf Spielebene irrelevant.

---

## A.4 Invarianten-Checkliste (die zentrale Prüfung)

> Die **eine** Liste der Bedingungen, die der Zustand **immer** erfüllen muss. Sie ist die operative
> Grundlage für alle drei Wirkungsweisen aus P8 (Ausgrauen / Dialog / Fallback) und liegt zentral beim
> `GameContext` (P7). Jede Eingabe triggert die Prüfung der betroffenen Invarianten (P4). Eine Aktion,
> die eine dieser Bedingungen verletzen würde, wird entweder über einen spezifischen Dialog aufgelöst
> oder – wenn keiner definiert ist – über den sicheren Default (P8) geblockt.
> Jede Invariante verweist auf ihre Herkunftsregel; die Liste fügt **nichts Neues** hinzu, sondern
> sammelt das Verstreute implementierbar.

| # | Invariante (muss IMMER gelten) | Herkunft |
|---|--------------------------------|----------|
| I1 | Jede aktive Person ist **genau eine** Partei: Re, Kontra **oder** neutral – nie mehrdeutig. | B.5.1 |
| I2 | Team-Größen: Normalspiel, Hochzeit und Armut **2 Re + 2 Kontra**; **Solo 1 Re (Solist) + 3 Kontra**. Sobald die Re-Seite voll ist (2 bzw. beim Solo 1), fallen die übrigen zwingend auf Kontra (Kaskade). | B.5.4 |
| I3 | **Vollständig zugeordnet** = alle vier aktiven Personen haben eine Partei (Normalspiel/Hochzeit/Armut 2+2, Solo 1+3); „neutral" ist nur Durchgangszustand, beim Bestätigen nicht mehr erlaubt. | B.5.5, B.6.1 |
| I4 | Re und Kontra schließen sich **bei derselben Person** aus (eine Ansage-Eigenschaft). | B.2.1 |
| I5 | Re-Ansage nur vom Re-Team, Kontra-Ansage nur vom Kontra-Team; daraus folgt **tischweit höchstens eine Re-Ansage und höchstens eine Kontra-Ansage**, je Team höchstens eine. | B.2.2, B.2.3 |
| I6 | Jede Absage-Stufe (K90/K60/K30/Schwarz) pro Team **höchstens einmal**. | B.2.5 |
| I7 | Eine Re/Kontra-**Ansage** erzwingt die passende Partei-Zugehörigkeit (Ansage und Partei dürfen nicht widersprechen). | B.2.2 |
| I8 | Pro Spiel **höchstens ein** Sonderspiel. | B.4.1 |
| I9 | Ein Sonderspiel ist **unteilbar**: seine Rollen existieren vollständig oder gar nicht. | B.4.5 |
| I10 | Die durch ein Sonderspiel erzwungene Partei-Zuordnung (Solist/Hochzeit/Armut = Re, Gegner = Kontra) darf nicht überschrieben werden, ohne das Sonderspiel aufzulösen. | B.4.3, B.5.7 |
| I11 | Sonderpunkt-Kontingente pro Spiel: Fuchs ≤ 2, Karlchen gemacht ≤ 1, Karlchen gefangen ≤ 2, Doppelkopf ≤ 4 (tischweit, nicht pro Person). Zusätzliches kombiniertes Limit: Karlchen gemacht + Karlchen gefangen ≤ 2. | B.3.1 |
| I12 | „gefangen"-Sonderpunkte (Fuchs/Karlchen) nur gültig, wenn Fänger und Bestohlene/r in **verschiedenen** Teams sind. | B.3.4, B.5.8 |
| I13 | Augen der Re-Partei (bzw. Min/Max-Range) liegen im Bereich **0–240**. | B.6.2 |

> **Hinweis Claude Code:** Diese Liste ist sowohl der Pre-Check fürs Ausgrauen (würde ein Klick eine
> Invariante verletzen?) als auch der finale Gate-Check vor dem Speichern. Verletzt eine Aktion eine
> Invariante und greift kein spezifischer Auflösungs-Dialog (Teil B/C), dann sicherer Default (P8):
> blocken + Fallback-Meldung (Teil C) + Log.

---

# TEIL B – REGELN

Cluster: **B.2** An-/Absagen · **B.3** Sonderpunkte · **B.4** Sonderspiele · **B.5**
Partei-Zugehörigkeit (der große Knoten) · **B.6** Augen / Bestätigung.

> Die Cluster beginnen historisch bei B.2; ein B.1 ist nicht vergeben (Grundlagen stehen in Teil A).

---

## B.2 An-/Absagen

### B.2.1 Re/Kontra: gegenseitiger Ausschluss beim selben Spieler
Re und Kontra sind wechselseitig ausschließende Zustände **derselben** Ansage-Eigenschaft eines
Spielers. Klick auf den aktiven Zustand schaltet ihn aus; Klick auf den anderen schaltet um (alter
aus, neuer an). Das ist **Umschalten ohne Dialog** (A.1) – die definierte Ausnahme von P5, weil die
Intention eindeutig ist. Bereits so umgesetzt.

### B.2.2 Re/Kontra-Ansage zieht Parteizuordnung nach sich
Beim Klick auf Re/Kontra wird zusätzlich die Partei geprüft/gesetzt:
- **Noch keine Partei:** kein Konflikt; die Ansage setzt automatisch die passende Partei
  (Re→Re-Partei, Kontra→Kontra-Partei).
- **Bereits gegnerische Partei:** Konflikt → läuft über den Partei-Block B.5.
- **Bereits passende Partei:** kein Partei-Konflikt, aber weiter prüfen → B.2.3.

### B.2.3 Pro Team kann nur EINE Person Re (bzw. Kontra) ansagen
Die Ansage hängt an **einer konkreten Person** (statistisch wird ausgewertet, *wer* ansagt –
CLAUDE.md 7.4). Beim Klick wird tischweit geprüft, ob im selben Team schon jemand diese Ansage hat.
Wenn ja → Auflösungs-Dialog (P5):
- **Abbrechen:** Ansage bleibt beim bestehenden Ansager.
- **Korrektur:** Ansage wandert von ihm zur klickenden Person.

### B.2.4 Absagen (Keine 90 / 60 / 30 / Schwarz): Toggle pro Person, kein Ausschluss untereinander
- Jede Absage ist ein einfacher Toggle für die eigene Person (klicken/wegklicken).
- Innerhalb einer Person schließen sich Absagen **nicht** aus – mehrere Stufen gleichzeitig möglich.
- **Keine Eskalationsleiter-Erzwingung (ausdrücklich gewollt):** An-/Absagen müssen NICHT lückenlos
  sein (K90 darf übersprungen und direkt K60 gesagt werden; auch Re weglassen und nur absagen).
  Übersprungene Stufen sind **kein Konsistenzfall** – Lücken werden nur in der Auswertung
  (`scoreCalculation.js`) anders gewertet. (Beleg: CLAUDE.md Abschnitt 4.)

### B.2.5 Jede Absage-Stufe pro Partei nur EINMAL
Analog B.2.3: Eine Absage (z.B. „Keine 90") kann pro Spiel mehrfach, aber **pro Partei nur einmal**
vorkommen; sie hängt an einer konkreten Person. Prüfung beim Absage-Klick: Partei → Partner → hat der
dieselbe Absage? Wenn ja → Auflösungs-Dialog (P5) mit Optionen wie B.2.3 (Abbrechen / Korrektur).

### B.2.6 Verspäteter Konflikt: ein Widerspruch kann von mehreren Eingaben her entstehen
Der Doppel-Ansage/Absage-Konflikt (B.2.3/B.2.5) ist **nicht an den Ansage-/Absage-Klick gebunden**.
Wer eine Ansage ohne zugeordnete Partei macht, erzeugt zunächst keinen Konflikt; er entsteht ggf.
**später**, wenn eine Partei-Zuordnung zeigt, dass die Person mit jemandem zusammenspielt, der
dieselbe An-/Absage schon hat. Konsequenz (P4): Dieselbe Regel wird an **beiden** Eingabepunkten
ausgewertet (An-/Absage-Klick UND Partei-Zuordnung). Fließt in den Partei-Block ein (B.5-Übersicht).
Wird der Konflikt durch eine **Partei-Zuordnung** ausgelöst, sind beide Ansagen gleich alt (keine
„klickende" Ansagerin) → der Dialog bietet **beide Richtungen** zum Behalten an. Wording siehe Katalog
(Teil C, **C.2.6**).

---

## B.3 Sonderpunkte (Fuchs, Karlchen gemacht/gefangen, Doppelkopf)

### B.3.1 Obergrenzen pro Spiel – TISCHWEITES Kontingent (nicht pro Spieler!)
| Sonderpunkt | Max. pro Spiel | Grund |
|-------------|----------------|-------|
| Fuchs gefangen | **2** | Nur zwei Füchse (Karo-Asse) im Spiel |
| Karlchen gemacht | **1** | Nur ein letzter Stich |
| Karlchen gefangen | **2** | Beide Kreuz-Buben können im letzten Stich gespielt und gefangen werden |
| Doppelkopf | **4** | Max. vier 40+-Stiche (braucht 16 hohe Karten: 8 Asse + 8 Zehnen). Sehr theoretisch, aber reale Grenze; in der App eingebaut. |

Die Grenzen sind Kontingente des **ganzen Spiels**, nicht einer Person. (CLAUDE.md Abschnitt 4 nennt
Doppelkopf ungenau als „mehrere/ohne Grenze"; korrekt ist 4 – dort bei Gelegenheit nachziehen.)

**Kombiniertes Karlchen-Limit:** Zusätzlich gilt Karlchen gemacht + Karlchen gefangen ≤ 2, da es nur zwei Kreuz-Buben im Spiel gibt. Beispiel: 1× gemacht + 1× gefangen = 2 → Limit erschöpft. 2× gefangen = 2 → Limit erschöpft. 1× gemacht + 2× gefangen wäre 3 → nie möglich.

### B.3.2 Obergrenze erreicht → einheitliches Muster P5, spielerübergreifend
Sobald das Kontingent des ganzen Spiels erschöpft ist (egal bei wem), wird der Sonderpunkt **bei allen
Spielern** nach P5 behandelt: optisch ausgegraut, aber klickbar; Klick → Auflösungs-Dialog.
- **Auflösung = Tausch:** „Es gibt nur zwei Füchse, beide gefangen (Robert von Jan, Kathrin von
  Sophia). Nicht Robert hat gefangen, sondern ich." Optionen: Abbrechen · je eine „Statt"-Option pro
  bestehendem Fang. Bei gefangenen Sonderpunkten (Fuchs, Karlchen gefangen) wird der alte Fang
  (Fänger + Bestohlene/r) gelöscht und danach der/die neue Bestohlene erfragt (wie Ersterfassung).
- **Erklärtext genügt** (z.B. „Es gibt nur zwei Füchse – beide bereits gefangen"); wer sie hat, ist
  am Tisch ohnehin sichtbar.
- Gilt für Fuchs (ab 2), Karlchen gemacht (ab 1), Karlchen gefangen (ab 2 bzw. bei kombiniertem Limit ab 1+1), Doppelkopf (ab 4).
  „Karlchen gemacht" hat keine/n Bestohlene/n, „gefangen" schon – Wording je Fall siehe Katalog
  (Teil C, C.3.2).(Teil C, C.3.2).

### B.3.3 Karlchen-Kombinationen (Nicht-Ausschluss-Regel + Zwei-Fang-Szenario)
Alles rund um Karlchen passiert nur im **letzten Stich**.
- **Normalfall:** „Karlchen gemacht" ODER Gegenseite fängt → „Karlchen gefangen" (Fänger) + „Karlchen verloren" (anderer). Gesamt: 1 Ereignis.
- **Sonderfall A (1× gemacht + 1× gefangen):** Beide Kreuz-Buben im letzten Stich, der zuerst gelegte gewinnt → **eine Person hat gleichzeitig „Karlchen gemacht" UND „Karlchen gefangen"**, der andere „Karlchen verloren". Gesamt: 2 Ereignisse = kombiniertes Limit.
- **Sonderfall B (2× gefangen, validiert mit Robert 22.6.2026):** Beide gegnerischen Kreuz-Buben werden im letzten Stich gespielt und von **einer Person** überstochen → 2× „Karlchen gefangen" für dieselbe Person (mit zwei verschiedenen Bestohlenen), 2× „Karlchen verloren". Möglich und korrekt. Gesamt: 2 Ereignisse = kombiniertes Limit.
- **Nicht-Regel:** „Karlchen gemacht" und „Karlchen gefangen" dürfen **nicht** als gegenseitig ausschließend behandelt werden – beides bei derselben Person ist erlaubt. (Claude Code: keine Ausschlussregel einbauen.)
### B.3.4 Partei-Voraussetzung der „gefangen"-Sonderpunkte
„Fuchs gefangen" und „Karlchen gefangen" setzen voraus, dass Fänger und Bestohlene/r in
**gegnerischen** Parteien sind (Invariante I12). Der Widerspruch kann aus zwei Richtungen entstehen:
- **Bei der Erfassung (Bestohlenen-Auswahl):** Im „von wem?"-Picker sind Personen aus dem **eigenen
  Team** des Fängers optisch ausgegraut, aber klickbar (P5) – aus dem eigenen Team kann man niemandem
  etwas abnehmen. Klickt man eine/n trotzdem an, erscheint ein kurzer Hinweis-Dialog mit **nur
  „Abbrechen"** (kein Auflösungsweg, weil die einzige Korrektur „jemand anderen wählen" ist); nach dem
  Schließen steht der Picker wieder offen. Solange die Teams beim Fangen noch **neutral** sind, ist
  niemand ausgegraut – jede Auswahl ist erlaubt (B.5.8, „Teams beim Fangen noch unbekannt"). Wording
  siehe Katalog (Teil C, **C.3.4**).
- **Durch eine spätere Partei-Änderung:** Geraten ein bereits erfasster Fänger und seine Bestohlene/r
  nachträglich ins selbe Team, werden die Einträge ungültig → Detailbehandlung im Partei-Block
  (B.5.8); umgesetzt als automatischer Drop in jeder partei-ändernden Aktion (C.5.8).

---

## B.4 Sonderspiele (Solo, Hochzeit, Armut)

### B.4.1 Pro Spiel genau EIN Sonderspiel
Solo, Hochzeit oder Armut – **nur eines pro Spiel**, nie zwei/drei zugleich. Normalspiel = kein
Sonderspiel gesetzt.

### B.4.2 Eine auslösende Person je Sonderspiel; der Partner wird dazugematcht
Auslösende Person (dort wird es eingetragen): **Solo** = der Solist; **Hochzeit** = die Person mit
beiden Kreuzdamen; **Armut** = die arme Person. Bei **Hochzeit** und **Armut** wird zusätzlich eine
zweite Re-Person dazugematcht (Hochzeit → eingeheiratet, Armut → reich). Das **Solo** hat keine zweite
Re-Person – der Solist spielt allein, die anderen drei sind Kontra.

### B.4.3 Setzen fixiert die GESAMTE Partei- und Rollenverteilung
- **Solo:** Solist = Re; die drei anderen = Kontra.
- **Hochzeit:** Hochzeit + eingeheiratet = Re; andere beide = Kontra.
- **Armut:** arm + reich = Re; andere beide = Kontra.

### B.4.4 Rollen werden bei ALLEN Spielern sichtbar angezeigt
An **jedem** Spieler steht klar, welche Rolle er hat und warum.
- Bei allen außer der auslösenden Person verschwindet die Sonderspiel-Auswahl und wird durch ein
  **festes, sprechendes Rollen-Label** ersetzt; dort ist nichts auswählbar.
- Das Label benennt Rolle UND Ursache → erkennbar, dass/warum hier nichts änderbar ist und an welcher
  Person aufgelöst werden müsste.

### B.4.5 Löschen/Auflösen nur an der auslösenden Person; ein Sonderspiel ist unteilbar
- Löschbar nur an der auslösenden Person (Solist / Hochzeit / arm). Bei der Partner-Rolle
  (eingeheiratet / reich) und bei allen Gegnern ist nichts wegklickbar.
- **Unteilbarkeit:** Es darf keinen halben Zustand geben (keine Hochzeit ohne eingeheiratet, keine
  Armut ohne reich, kein Solo ohne Solist + drei Gegner). Eine Auflösung entfernt daher **immer das
  komplette Sonderspiel bei allen beteiligten Spielern** (alle Rollen werden neutralisiert).

### B.4.6 Rollen-Anzeige (Labels)
Es gibt zwei Anzeige-Kontexte: die knappe **Tisch**-Anzeige und die ausführlichere, kontextuelle
**Sheet**-Anzeige. Die Sheet-Anzeige nennt die jeweils andere beteiligte Person – das ist der
**Wegweiser zur Auflösung** (man sieht, an welcher Person das Sonderspiel aufzulösen ist).

**Sonderrollen** (DB-Wert in `specialRole`):

| DB-Wert | Tisch | Sheet (kontextuell) | Löschbar hier? |
|---------|-------|---------------------|----------------|
| `solist` | je nach `soloType` (s.u.) | je nach `soloType` | Ja (Quelle) |
| `hochzeit` | Hochzeit | Hochzeit (mit [NAME]) | Ja (Quelle) |
| `eingeheiratet` | Eingeheiratet | Eingeheiratet (bei [NAME]) | Nein |
| `arm` | Armut (arm) | Armut (arm) – [NAME] ist reich | Ja (Quelle) |
| `reich` | Armut (reich) | Armut (reich) – [NAME] ist arm | Nein |

**Solo-Typen** (DB-Wert in `soloType`, nur bei `specialRole = solist`):

| DB-Wert | Anzeige |
|---------|---------|
| `fleischlos` | Fleischlos |
| `buben_solo` | Buben-Solo |
| `damen_solo` | Damen-Solo |
| `farb_solo` | Farb-Solo ♦/♥/♠/♣ (mit Farb-Emoji) |
| `stilles_solo` | Stilles Solo |

**Gegner-Labels (reine Anzeige, KEINE DB-Rolle):** Die Gegner eines Sonderspiels haben in der DB
keine Sonderrolle – sie sind einfach Kontra. Ihre Anzeige wird **abgeleitet** (P6) und nennt die
auslösende Person, z.B. „gegen Hochzeit ([NAME])", „gegen Armut ([NAME])", „gegen Buben-Solo
([NAME])". Da rein abgeleitet, verschwindet das Label automatisch, sobald das Sonderspiel aufgelöst
ist.

### B.4.7 Sonderspiel-Setzen ist eine Eintrittstür in den Partei-Block (B.5)
Ein Sonderspiel ist ein **massiver Partei-Setzakt** (B.4.3) und erbt **alle** Konflikte eines solchen.
Diese werden nicht hier dupliziert, sondern laufen über B.5 (mögliche Konflikte: widersprechende
Ansagen; doppelte An-/Absagen in der neuen Partei; ungültig werdende Sonderpunkte). Kein Konflikt mit
*anderen* Sonderspielen (B.4.1). Architektur: Manueller Partei-Toggle, Re/Kontra-Ansage UND
Sonderspiel-Setzen sind nur verschiedene **Eintrittstüren** in denselben zentralen Partei-Prüfblock.

---

## B.5 Partei-Zugehörigkeit (Re/Kontra) – der große Knoten

**Übersicht – was beim Setzen/Ändern einer Partei geprüft wird** (alle Punkte unten ausgearbeitet):
- Widersprechende Re/Kontra-**Ansage** der Person → B.5.9.
- Verspäteter **Doppel-Ansage/Absage**-Konflikt durch die Zuordnung → Muster wie B.2.5.
- **Kaskaden-Folge** (automatisch zugeordnete Gegenseite kollidiert mit deren Zustand): kein eigener
  Fall – tritt immer als fester-Teams-Tausch (B.5.6) oder widersprechende Ansage (B.5.9) auf.
- **Sonderpunkt-Ungültigkeit** (Fuchs/Karlchen, Fänger & Bestohlener im selben Team) → B.5.8.

Zwei mögliche Auflösungswege je nach Lage: **einfaches Umhängen bzw. Tausch** (B.5.6), wenn keine
bindende Ursache anliegt; **Ursache annullieren/zurückziehen** (B.5.7 Sonderspiel / B.5.9 Ansage), wenn
eine anliegt.
Beide bewahren bestehende Ansagen (P6). Ein darüber hinausgehendes Leeren der gesamten Tafel inkl.
Ansagen ist kein Konfliktfall, sondern ein bewusstes Komfort-Werkzeug (Reset, Hamburger-Menü).

### B.5.1 Parteizugehörigkeit ≠ An-/Absage
Die Parteizugehörigkeit ist ein **eigener Toggle im Player-Sheet** (Re / neutral / Kontra), getrennt
von der An-/Absage. Eine Person kann zur Re-Partei gehören, ohne Re angesagt zu haben, und umgekehrt.
Eine Ansage zieht die passende Zugehörigkeit automatisch nach sich (B.2.2); die Zugehörigkeit kann
aber auch direkt gesetzt werden, ganz ohne Ansage. (Der frühere Tisch-Toggle wurde ausgebaut; eine
neue Tisch-Geste kommt in B.5.10.)

### B.5.2 Woraus eine Zugehörigkeit entsteht; Änderbarkeit hängt an den anliegenden Ursachen
„Re"/„Kontra" kann entstehen durch: (1) **direktes Setzen** (Toggle/Wisch), (2) **Re/Kontra-Ansage**
(B.2.2), (3) **Sonderspiel** (B.4.3), (4) **Kaskade** (B.5.4). Wie frei die Zugehörigkeit änderbar ist,
hängt nicht davon ab, „woher" sie kam, sondern davon, **welche Ursachen aktuell anliegen** (P1): liegt
keine an, ist sie frei änderbar (Tausch, B.5.6); liegt eine an (Ansage/Sonderspiel/Kaskade), läuft die
Änderung über deren Auflösung (B.5.7/B.5.9). Das wird zur Laufzeit erkannt (P6), nicht gespeichert.

### B.5.3 Der Partei-Toggle löst sofort die volle Logik aus
Wie jeder Schalter: Sobald ein Zustand gesetzt wird, passiert sofort alles, was daran hängt – kein
„Sammeln und später auswerten". Jeder Schritt löst unmittelbar aus: Kaskade (B.5.4), alle
Konsistenzprüfungen (B.5-Übersicht), nötige Folge-Setzungen/Rücknahmen. Der Toggle ist nur eine
weitere Eintrittstür in den Partei-Block (vgl. B.4.7).

### B.5.4 Die Kaskade (automatische Gegenseiten-Zuordnung)
Sobald **eine Seite ihre Soll-Größe erreicht** (Re oder Kontra), fallen die übrigen Personen
**automatisch** auf die andere Seite (bei vier Aktiven geht es logisch nicht anders). Soll-Größen je
Spieltyp: Normalspiel/Hochzeit/Armut **2 + 2**, Solo **1 Re (Solist) + 3 Kontra**. Jede so abgeleitete
Zuordnung wird anschließend gegen den sonstigen Zustand der betroffenen Person geprüft (P4): Verträgt
sich das erzwungene Kontra mit dem, was dort schon steht? Solche Folgekonflikte treten immer als
B.5.6 (feste Teams) oder B.5.9 (widersprechende Ansage) auf – kein eigener Fall.

### B.5.5 „neutral" ist nur ein Durchgangszustand
- **Unvollständige Zuordnung:** neutral ist ein legitimer „noch offen"-Zustand; Zurücknehmen auf
  neutral muss möglich sein.
- **Vollständige Zuordnung** (Normalspiel/Hochzeit/Armut 2 Re + 2 Kontra, Solo 1 Re + 3 Kontra):
  neutral ergibt keinen Sinn mehr → wird **gar nicht als Toggle-Option angeboten**; der Toggle bietet
  nur noch den Wechsel Re↔Kontra (über B.5.6). Damit entfällt der Fall „Einzelnen auf neutral setzen,
  obwohl alles zugeordnet ist".
- **Echte Neuverteilung** (alles auf null) ist ein eigener, bewusster Vorgang (Reset im Hamburger-Menü,
  Hamburger-Menü), nicht ein versehentliches Neutral-Toggeln.

### B.5.6 Zugehörigkeit ohne bindende Ursache: lautloses Umhängen bzw. Voll-Team-Dialog
- **Ziel-Team hat noch Platz → lautlos erlaubt, kein Konflikt.** Gibt es keinen ableitbaren Grund für
  die aktuelle Partei (keine Ansage, kein Sonderspiel, keine Kaskaden-Zwangslage) und ist noch nicht
  alles zugeordnet, wird einfach umgehängt – kein Dialog.
- **Ziel-Team ist voll → Auflösungs-Dialog (P5).** Da bei vier Aktiven mit zwei pro Team die Kaskade
  (B.5.4) den Tisch sofort komplett zuordnet, sobald ein Team steht, gibt es nie „drei zugeordnet,
  einer offen": Entweder ist noch Platz (Fall oben, lautlos) **oder** der Tisch ist voll und jeder
  weitere Gegen-Klick verdrängt. **Der „Team voll überfüllt"-Fall und der Re↔Kontra-Umschalt-Fall bei
  vollem Tisch (B.5.5) sind damit dieselbe Situation** und teilen einen Dialog (Meldung + Optionen
  siehe Teil C, C.5.6): Abbrechen plus zwei „Statt"-Optionen (Tausch mit je einer der beiden
  Gegenüber); der jeweils Verdrängte rutscht per Kaskade auf die Gegenseite.
- **Direkt gesetzte Zuordnung wird respektiert.** Eine vollständige, vom Schreiber direkt gesetzte
  Teamzuordnung ist eine bewusste Aussage („so saßen die Teams") – sie wird **nicht beiläufig
  aufgelöst**, nur weil kein Sonderspiel/keine Ansage dahintersteht. Die App geht davon aus, dass sie
  stimmt. Will man trotzdem eine Person auf die feste Gegenseite setzen, ist das derselbe
  Voll-Team-Dialog (Tausch mit einer der beiden Gegenüber), nicht ein stilles Umhängen. Die Meldung
  benennt darum die feste Zuordnung explizit („Die Teams stehen schon fest …").
- **Folgekonsequenz Fuchs/Karlchen:** Bringt der Tausch Fänger und Bestohlene/n ins selbe Team, nimmt
  die ausführende Option die C.5.8-Zeile als letzte Konsequenz mit auf.

### B.5.7 Abgeleitete Zugehörigkeit: Annullieren der Ursache (gewünschte Aktion wird ausgeführt)
Ist die im Weg stehende Zugehörigkeit durch eine Ursache **gebunden** (P6), wird statt umzuhängen die
**Ursache annulliert** – und die vom Schreiber gewünschte Partei-Aktion danach **ausgeführt** (nicht nur der
Weg freigeräumt). (Ob eine bindende Ursache anliegt, ergibt die Laufzeit-Prüfung P6.)
- **Beispiel (Hochzeit):** Kathrin und Robert spielen zusammen Hochzeit (beide Re). Klick „Robert →
  Kontra" → „Robert kann nicht Kontra sein. Robert ist in der Re-Partei, weil Robert mit Kathrin
  zusammen Hochzeit spielt." Optionen: Abbrechen · Hochzeit annullieren.
- **Beide Richtungen, alle drei Spieltypen:** Der Konflikt kann aus zwei Richtungen kommen – eine
  Person der Sonderspiel-Seite (Re) soll auf Kontra, **oder** ein Gegner (Kontra) soll auf Re. Das gilt
  für Hochzeit, Armut **und** Solo gleichermaßen (das Sonderspiel fixiert beide Seiten zugleich; es zu
  annullieren ist in beiden Richtungen die Lösung). Die genauen Meldungstexte je Spieltyp/Richtung
  stehen im Katalog (Teil C, C.5.7).
- **Unteilbarkeit (B.4.5):** „annullieren" löscht **immer das komplette Sonderspiel bei allen
  Spielern**, nie nur einen Teil.
- **Ablauf:** Sonderspiel weg → alle Zuordnungen aufgehoben → bestehende An-/Absagen bleiben und ziehen
  ihre Zuordnung wieder nach (B.2.2; nicht mitgelöscht, P6) → gewünschte Aktion ausgeführt → Kaskade
  füllt den Rest (B.5.4); Offenes bleibt neutral (B.5.5). Vollständiges Wording + Subtitle-Logik im
  Katalog (Teil C, C.5.7).
- **Mehrere Ursachen (P2) → gebündelte Auflösung:** Ist die Zugehörigkeit aus mehreren Quellen
  festgelegt (z.B. jemand ist Re sowohl per Ansage als auch als eingeheiratet), nennt der Dialog
  **alle** Ursachen, bietet aber **eine einzige Option, die alle auf einmal entfernt** (plus
  Abbrechen). Grund: Solange eine Ursache bestehen bleibt, ist die Blockade nicht gelöst – halbes
  Auflösen wäre nutzlos. Wording im Katalog (Teil C, C.5.7 mehrere Ursachen).

### B.5.8 Sonderpunkt-Ungültigkeit durch Partei-Änderung (Fuchs / Karlchen gefangen)
„Fuchs/Karlchen gefangen" setzt gegnerische Teams voraus (B.3.4). Geraten Fänger und Bestohlener ins
selbe Team:
- **Teams beim Fangen noch unbekannt:** **stillschweigend wegsortieren**, sobald sich herausstellt,
  dass es der Partner war (kein Dialog). Bild aus der Tischrealität: Man legt das gefangene Karo-Ass
  neben die Stiche; war es der Partner, steckt man es in den Stapel. **Weggesteckt = vergessen:** die
  App merkt sich das nicht (P6); werden die Teams später wieder gegnerisch, lebt der Fuchs nicht
  automatisch auf – Wiedereintragen ist Sache des Schreibers (P3). Unkritisch, weil Füchse in der
  Praxis ohnehin erst notiert werden, wenn die Teams feststehen.
- **Teams beim Ändern schon zugeordnet:** Es gibt ohnehin den Konflikt-Dialog (B.5.6/B.5.7); dessen
  ausführende Option nimmt die Konsequenz als letzte Subtitle-Zeile mit auf: „Robert hat Kathrins Fuchs
  damit nicht gefangen (und Kathrin ihn nicht verloren)." Wording siehe Katalog (Teil C, C.5.8).

### B.5.9 Aktion scheitert an bestehender Ansage (= dieselbe Auflösung wie B.5.7)
Eine bestehende Re/Kontra-Ansage, die der neuen Partei widerspricht, ist eine **auflösbare Ursache**
wie eine abgeleitete Zugehörigkeit.
- **Beispiel:** Robert hat Kontra gesagt; für Kathrin wird eine Hochzeit mit Robert als Partner
  eingetragen → Robert würde Re. „Robert kann nicht bei Kathrin einheiraten. Robert hat Kontra gesagt
  …" Optionen: Abbrechen · Kontra zurückziehen. Wording siehe Katalog (Teil C, C.5.9).
- **P5 gilt auch in Auswahllisten:** Schon bei der Partner-Auswahl der Hochzeit ist Roberts Avatar
  optisch ausgegraut, aber klickbar; Klick → obiger Dialog. (P5 greift überall, wo eine **Auswahl** zu
  einem Konflikt führen würde, nicht nur bei Schaltern.)
- **Folgekonflikte aus der Kaskade in denselben Dialog (P5-Vorausschau):** Löst eine Aktion eine
  automatische Gegenseiten-Zuordnung aus (B.5.4) und kollidiert die mit dem Zustand der betroffenen
  Person, gehört dieser Folgekonflikt in **denselben** Dialog der auslösenden Aktion – nicht in einen
  zweiten, nachgelagerten. Inhaltlich ist es immer einer der schon erfassten Fälle (feste Teams →
  B.5.6, widersprechende Ansage → B.5.9), nur eben *vorausschauend* gezeigt. Gilt für **alle**
  Eintrittstüren (B.4.7), auch Sonderspiel-Setzen (Solist setzen → drei andere automatisch Kontra; hat
  einer Re gesagt, greift B.5.9 vorausschauend).

> **Hinweis (Notbremse-Erkenntnis):** Es gibt keine „beliebig tiefen Konfliktketten", vor denen man mit
> einer Notbremse abschneiden müsste. Die Zahl der aufzulösenden Bindungen ist **fest begrenzt**: pro
> Spiel gibt es nur ein Sonderspiel und pro Partei nur eine Ansage (also tischweit höchstens zwei
> Ansagen). Selbst die aufwändigste Auflösung (eine Wisch-Geste, die zwei Personen gleichzeitig bewegt)
> entfernt daher höchstens ein Sonderspiel plus zwei Ansagen – jeder Konflikt ist mit Tausch (B.5.6),
> Annullieren (B.5.7) und/oder Zurückziehen (B.5.9) vollständig lösbar, jeweils unter Bewahrung der
> nicht betroffenen Ansagen. Ein darüber hinausgehendes komplettes Leeren der Tafel (inkl. aller
> Ansagen) ist kein Konflikt-Mechanismus, sondern ein bewusstes Komfort-Werkzeug (Reset,
> Hamburger-Menü).

### B.5.10 Wisch-Geste auf dem Tisch: zwei Spieler zu einer Partei verbinden (Roadmap)
Neue Eingabe-Methode (wird mit-implementiert): per Wisch-Geste von einem Spieler zu einem anderen
ziehen, um beide **zu einer Partei** zu verbinden. (Trigger-Area und Gesten-Details später mit Jan /
in Claude Code festzulegen.) **Neue Geste, bekannte Logik:** nur eine weitere Eintrittstür in den
Partei-Block; sie nutzt B.5.6/B.5.7/B.5.9. **Neu ist nur**, dass die Geste die **Richtung offenlässt**
(„die zwei zusammen", ohne zu sagen, welche Partei). **Kernprinzip:** die Zuordnung von zweien ist
immer die Zuordnung von vieren (Kaskade) – darum darf die Auflösung auch An-/Absagen dritter Personen
zurückziehen, wenn die Kaskade sie sonst auf eine volle/widersprechende Seite drückt.
- **Ungültige/unvollständige Geste** (auf sich selbst, im Leeren endend, nicht sauber von A nach B)
  → ignorieren, nichts passiert.
- **Beide schon korrekt in derselben Partei** → No-op, kein Dialog (konsistent dazu, dass auch bei
  „einer schon zugeordnet, einer neutral" keine Bestätigung kommt). Ggf. dezente visuelle Quittung.
- **Eine Seite schon festgelegt, andere neutral:** der andere wird derselben Partei zugeordnet;
  **kein Dialog nötig**, Tisch ist danach sortiert.
- **Beide neutral:** Richtungs-Dialog „Re oder Kontra?" (Abbrechen unten, da kein Konflikt). Nach
  Antwort ist per Kaskade sofort der ganze Tisch sortiert.
- **Widerspruch / feste Verankerung:** Richtungs-Dialog mit vollständigen Konsequenz-Listen je
  Richtung (Abbrechen zuerst, da Konflikt). Beide Richtungen sind dank Annullieren (B.5.7) /
  Zurückziehen (B.5.9) / Tausch (B.5.6) **immer** möglich, nur zu unterschiedlichem Preis; die
  asymmetrischen Listen zeigen implizit, welche Richtung „mit dem Strom" geht. Vollständiges Wording
  und das Tiefen-Beispiel im Katalog (Teil C, C.5.10).

---

## B.6 Augen / Bestätigung

### B.6.1 Mindestanforderung zum Abschluss eines Spiels
Der „Auswerten"/„Bestätigen"-Button wird erst aktiv, wenn:
- **alle Parteien zugeordnet** sind (jede:r aktive Spieler:in ist Re oder Kontra),
- die **Augenzahl** eingegeben und im gültigen Bereich **0–240** ist,
- **angegeben** ist, für welche Partei die Augenzahl gilt (die andere = 240 minus Wert; gespeichert
  wird immer Re).
Ein darüber hinaus inkonsistenter Zustand kann nicht entstehen: Die zentrale Invariantenprüfung (A.4)
mit ihrem sicheren Default (P8) blockt jede Aktion, die einen Widerspruch erzeugen würde – auch einen
vom Regelwerk nicht vorhergesehenen. Daher hier kein separater Extra-Check.

### B.6.2 Augen-Konsistenz nur Wertebereich – Rest ist Auswertung
Geprüft wird bei den Augen **nur** „0–240 + welche Partei". **Nicht** geprüft wird, ob die Augenzahl
zum erfassten Spiel „passt" (z.B. ob eine angesagte „Keine 90" erreicht wurde). Grund: Ob Ansagen
erreicht wurden, rechnet die App aus den Augen aus; eine **gescheiterte Absage ist ein gültiges
Spielergebnis** (Re verliert dann), kein Eingabefehler. Trennung: Konsistenzprüfung = „Eingabe
wohlgeformt und widerspruchsfrei"; Auswertung (`scoreCalculation.js`) = „was bedeutet das Ergebnis".

---

# TEIL C – MELDUNGS-KATALOG

> Alle Konflikte mit ihren Optionen an einem Ort – **ein Block pro Konflikt**.
>
> **Nummerierung:** Jeder Block trägt die Nummer seiner Regel aus Teil B, mit **C-Präfix** statt B.
> Regel **B.x.y** (Teil B) ↔ zugehöriges Wording **C.x.y** (hier). Beispiel: Regel B.5.6 ↔ Dialog
> C.5.6. So ist die Zuordnung eindeutig und am Präfix sofort erkennbar, ob man die Regel oder ihr
> Wording vor sich hat.
>
> **Format jedes Blocks:** Meldung (zwei Teile: *Was geht nicht?* / *Warum nicht?*) + Optionen
> (Button-Kurzform + Subtitle). Beispielnamen dienen nur der Anschauung; die App setzt die echten
> Namen ein.

### C.Konventionen — Wording-Konventionen (gelten für ALLE Blöcke)

- **Dritte-Person-Perspektive, immer ausgeschriebene Namen.** Der Schreiber ist nicht zwingend die
  betroffene Person → nie „Du", sondern „Kathrin …". Kein „ihr/sein" (Geschlecht ist aus dem Namen
  nicht ableitbar) → stattdessen „Kathrins Partner Robert".
- **Meldung = zwei Teile** (durch Zeilenumbruch getrennt): erst *Was geht nicht?*, dann *Warum nicht?*.
  Der Warum-Teil nennt die konkrete Kollision; bei mehreren Ursachen werden sie dort zusammengefasst
  (mit „und" bzw. Gedankenstrich) und dürfen mehrere Sätze umfassen, statt auf weitere Teile verteilt
  zu werden. Keine Erklärung von Doppelkopf-Grundregeln – nur die konkrete Kollision benennen (weniger
  Text = schnelleres Erfassen).
- **Erste Option ist immer „Abbrechen"** mit Subtitle „Ohne Änderung zurück." (bricht die auslösende
  Aktion folgenlos ab) — **Ausnahme: Richtungswahl-Dialoge, dort steht Abbrechen zuletzt (s.u.).**
- **Subtitle = Konsequenz des Klicks.** Einzeilig, sobald es nur **eine** Folge gibt; **Liste**, sobald
  es **mehrere** Einzeländerungen sind (jede Änderung eine Zeile).
- **Die zweite (und ggf. dritte) Option heißt nach ihrer Wirkung** – das Wort erklärt nichts, die
  Konsequenz steht im Subtitle. Die etablierten Button-Namen:
  - **Korrektur** – eine Eingabe wird von einer Person zur anderen umgetragen (C.2.3, C.2.5, C.3.2
    Karlchen).
  - **Statt [Beschreibung]** – eine Person/ein Eintrag verdrängt einen anderen (Tausch); bei mehreren
    Möglichen je eine Option, Reihenfolge nach Tischposition (C.3.2 Fuchs/Doppelkopf, C.5.6, C.5.8).
  - **[Sonderspiel] annullieren** / **Ursachen annullieren** – ein Sonderspiel bzw. mehrere Ursachen
    werden aufgelöst (C.5.7).
  - **[Ansage] zurückziehen** – eine Ansage wird zurückgenommen (C.5.9).
  - **Re / Kontra** bzw. **Beide Re / Beide Kontra** – Richtungswahl (C.5.10).
  - **Zurück** – Fallback, blockt folgenlos (C.Fallback).
- **Partei-Zugehörigkeit „ist", nicht „wird".** Die App erfasst ein bereits gespieltes Spiel, sie
  ändert keinen Spielzustand. Re/Kontra ist ein Fakt des Spiels → „Robert ist Kontra" (es war nur
  falsch notiert), nie „Robert wird Kontra". Ausnahme: echte Erfassungs-*Handlungen* dürfen „wird"
  sein („Roberts Ansage wird zurückgezogen" – das tut der Schreiber wirklich gerade).
- **Richtungswahl-Dialoge: Abbrechen zuletzt.** Geht es nicht um einen Konflikt (kein „falsch →
  Korrektur"), sondern um eine echte, offene Wahl zwischen gleichwertigen Wegen (z.B. „Re oder
  Kontra?"), stehen die inhaltlichen Optionen oben und **Abbrechen unten**. Nur in dieser Sorte Dialog;
  überall sonst gilt „Abbrechen zuerst".
- **„Was geht nicht?" richtet sich nach der auslösenden Aktion, die Auflösung nach der Ursache.**
  Dieselbe bindende Ursache (volle Teams / Sonderspiel / bestehende Ansage) kann durch verschiedene
  Aktionen ausgelöst werden. Zwei Sorten Aktion:
  - **Aktion mit eigener Bedeutung** (Sonderspiel-Rolle anpinnen, Sonderspiel-Partner anpinnen,
    Re/Kontra sagen): „Was geht nicht?" benennt **die Aktion** – „Robert kann nicht bei Kathrin
    einheiraten", „Robert kann nicht Re sagen". Die Partei-Folge wird nicht erwähnt, nur die Aktion.
  - **Reine Partei-Wechsel-Aktion** (Toggle im Sheet, Wisch-Geste): „Was geht nicht?" benennt **die
    Zielpartei** – „Robert kann nicht Re sein, weil …".
  Beispiel-Spannweite einer einzigen Ursache („Robert gehört zur Kontra-Partei"): ausgelöst per Toggle
  → „Robert kann nicht Re sein"; per Hochzeits-Anpinnen → „Robert kann nicht bei Kathrin einheiraten";
  per Ansage → „Robert kann nicht Re sagen". Die jeweilige Auflösung (Sonderspiel annullieren / Voll-
  Team-Tausch / Ansage zurückziehen) richtet sich allein nach der Ursache, nicht nach der Aktion.

---

### C.2.2 — Ansage trifft auf gegnerische/feste Partei (Verweis)

> Kein eigener Dialog. Sagt jemand Re/Kontra, dessen Partei schon anderweitig feststeht (Gegenpartei
> durch Ansage, Sonderspiel oder volle Teams), läuft der Konflikt über den Partei-Cluster: Ursache
> Sonderspiel → C.5.7, Ursache bestehende Ansage → C.5.9, volle/feste Teams → C.5.6. Die Meldung ist
> dabei **aktionsnah** formuliert („… kann nicht Re sagen"), siehe Aktions-Achse in C.Konventionen.
> (Regel-Pendant: B.2.2.)

---

### C.2.3 — Zweite Person im Team will dieselbe Ansage machen (Re/Kontra)

**Meldung:**
> Kathrin kann nicht Re sagen.
> Kathrins Partner Robert hat bereits Re gesagt.

**Option 1 — Abbrechen**
- Ohne Änderung zurück.

**Option 2 — Korrektur**
- Kathrin sagt Re
- Roberts Re-Ansage wird zurückgezogen

---

### C.2.5 — Zweite Person im Team will dieselbe Absage machen

> Gleiches Muster wie B.2.3, mit der Absage-Stufe statt Re/Kontra. Die Absage steht in
> Anführungszeichen, „Ansage" als eigenes Wort dahinter („… „Keine 90" Ansage …"). Beispiel mit
> „Keine 90"; analog für „Keine 60" / „Keine 30" / „Schwarz".

**Meldung:**
> Kathrin kann nicht „Keine 90" sagen.
> Kathrins Partner Robert hat bereits „Keine 90" gesagt.

**Option 1 — Abbrechen**
- Ohne Änderung zurück.

**Option 2 — Korrektur**
- Kathrin sagt „Keine 90"
- Roberts „Keine 90" Ansage wird zurückgezogen

---

### C.2.6 — Verspätete An-/Absage-Doppelung durch Partei-Zuordnung (B.2.6)

> Der verspätete Fall aus B.2.6: Zwei Spieler hatten – neutral und damit erlaubt – dieselbe An-/Absage
> gesagt (z.B. beide „Keine 90"); eine **Partei-Zuordnung** vereint sie nun im selben Team, wodurch die
> Absage doppelt wäre (I6; bei Re/Kontra I5). Anders als C.2.5 (Ansage-Klick, klare neue Ansagerin →
> eine „Korrektur") sind hier **beide Ansagen gleich alt** – es gibt keine „klickende" Ansagerin.
> Darum bietet der Dialog **beide Richtungen** an: jede:r der beiden kann sie behalten (Jan-Entscheid,
> Session 9). Die Partei-Zuordnung selbst wird in jeder Option mit ausgeführt.
>
> Praktisch betrifft das nur **Absagen**: Eine Re/Kontra-**Ansage** zieht ihre Partei sofort nach
> (B.2.2), zwei gleiche Ansager wären also schon beim Ansage-Klick im selben Team (C.2.3) – eine
> Partei-Zuordnung kann eine Re/Kontra-Doppelung nicht erst nachträglich erzeugen.

**Meldung** (Beispiel: Kathrin wird Re, Robert ist schon Re, beide haben „Keine 90"):
> Kathrin und Robert können nicht beide „Keine 90" sagen.
> Kathrin und Robert sind beide Re – „Keine 90" gilt pro Team nur einmal.

**Option 1 — Abbrechen**
- Ohne Änderung zurück.

**Option 2 — Kathrin behält „Keine 90"**
- Roberts „Keine 90" Ansage wird zurückgezogen
- Kathrin ist Re

**Option 3 — Robert behält „Keine 90"**
- Kathrins „Keine 90" Ansage wird zurückgezogen
- Kathrin ist Re

> **Claude Code:** Ausgelöst aus dem `setParty`-Resolver, wenn der Zug I6 (oder I5) erzeugt und keine
> vorrangige Ursache (Sonderspiel/eigene Ansage/Team-voll) greift. Implementiert in
> `buildLateDoublingDialog`. Wording-Konvention wie C.2.5: Re/Kontra als „…-Ansage", Absagen in
> Anführungszeichen mit „Ansage" dahinter.

---

### C.3.2 — Sonderpunkt-Obergrenze erreicht (Spiel-Kontingent erschöpft)

> Vier Sonderpunkt-Typen, dasselbe Grundmuster (Kontingent voll → Abbrechen + „Statt"-Optionen), aber
> unterschiedlich in Optionenzahl und Identifikation (siehe B.3.1: Fuchs max. 2, Karlchen gemacht
> max. 1, Karlchen gefangen max. 2, kombiniertes Karlchen-Limit 2, Doppelkopf max. 4). Reihenfolge
> mehrerer „Statt"-Optionen: Tischreihenfolge der betroffenen Person.

**Fall A — Fuchs (max. 2 erschöpft):**

> Optionen werden über den **konkreten Fang** (Fänger + Bestohlene/r) identifiziert, nicht über die
> Person – so funktioniert es auch, wenn **eine** Person beide Füchse gefangen hat.

**Meldung:**
> Dani kann keinen Fuchs fangen.
> Beide Füchse sind schon gefangen (Robert von Jan, Kathrin von Sophia).

**Option 1 — Abbrechen**
- Ohne Änderung zurück.

**Option 2 — Statt Roberts Fuchs von Jan**
- Robert hat den Fuchs von Jan nicht gefangen
- Dani hat einen Fuchs gefangen (von wem, wird gleich ausgewählt)

**Option 3 — Statt Kathrins Fuchs von Sophia**
- Kathrin hat den Fuchs von Sophia nicht gefangen
- Dani hat einen Fuchs gefangen (von wem, wird gleich ausgewählt)

> **Claude Code:** Pro bereits gefangenem Fuchs eine „Statt"-Option, identifiziert über Fänger +
> Bestohlene/n (hat eine Person beide gefangen, entstehen zwei unterscheidbare Optionen für dieselbe
> Person, und die Meldung lautet entsprechend „… (Robert von Jan, Robert von Sophia)"). Die gewählte
> Option **löscht den alten Fang (Fänger + Bestohlene/n) komplett** und legt Dani als neue/n Fänger/in
> an; danach wird – wie bei der Ersterfassung – die **Bestohlenen-Auswahl** ausgelöst.

**Fall B — Karlchen gemacht (max. 1):**

**Meldung:**
> Dani kann kein Karlchen machen.
> Robert hat das Karlchen bereits gemacht.

**Option 1 — Abbrechen**
- Ohne Änderung zurück.

**Option 2 — Korrektur**
- Robert hat kein Karlchen gemacht
- Dani hat das Karlchen gemacht

**Fall C — Karlchen gefangen (max. 2, kombiniertes Limit ≤ 2):**

> Drei mögliche Auslöser – je nach Situation unterschiedliche Dialoge:

**Unterfall C1 — Einzelkap erschöpft (2× gefangen bereits eingetragen):**

**Meldung:**
> Dani kann kein Karlchen fangen.
> Beide Karlchen sind schon gefangen (Robert von Jan, Kathrin von Sophia).

**Option 1 — Abbrechen**
- Ohne Änderung zurück.

**Option 2 — Statt Roberts Karlchen von Jan**
- Robert hat das Karlchen von Jan nicht gefangen
- Dani hat das Karlchen gefangen (von wem, wird gleich ausgewählt)

**Option 3 — Statt Kathrins Karlchen von Sophia**
- Kathrin hat das Karlchen von Sophia nicht gefangen
- Dani hat das Karlchen gefangen (von wem, wird gleich ausgewählt)

> **Claude Code:** Pro bestehendem Fang eine „Statt"-Option (wie Fuchs). Die gewählte Option löscht den alten Fang und löst die Bestohlenen-Auswahl aus.

**Unterfall C2 — Kombiniertes Limit (1× gemacht + 1× gefangen = 2 total):**

**Meldung:**
> Dani kann kein Karlchen fangen.
> Das Karlchen-Limit ist erreicht: Robert hat das Karlchen gemacht, Kathrin hat es gefangen (von Jan). Mehr als 2 Karlchen-Ereignisse sind nicht möglich.

**Option 1 — Abbrechen**
- Ohne Änderung zurück.

**Option 2 — Korrektur: Nicht Kathrin, sondern Dani**
- Kathrin hat das Karlchen nicht gefangen
- Dani hat das Karlchen gefangen (von wem, wird gleich ausgewählt)

> **Claude Code:** Nur die bestehende „gefangen"-Eintragung ist tauschbar (das „gemacht" bleibt). Option löscht den alten Fang und löst die Bestohlenen-Auswahl aus.

**Fall D — Doppelkopf (max. 4 erschöpft; verteilt auf 1–3 Spieler):**

**Meldung:**
> Dani kann keinen Doppelkopf eintragen.
> Es sind schon vier Doppelköpfe eingetragen: Robert (2), Sophia (2).

> *Die Meldung listet alle Spieler mit mindestens einem Doppelkopf, jeweils mit Anzahl.*

**Option 1 — Abbrechen**
- Ohne Änderung zurück.

**Option 2 — Statt Robert**
- Dani macht einen Doppelkopf
- Robert hat dann einen Doppelkopf (statt 2)

**Option 3 — Statt Sophia**
- Dani macht einen Doppelkopf
- Sophia hat dann einen Doppelkopf (statt 2)

> **Claude Code — Mengen-Fallunterscheidung (Fall D):** zweiter Subtitle je nach aktueller Anzahl der
> verdrängten Person: mehr als einer (N > 1) → „… hat dann einen Doppelkopf (statt N)"; genau einer
> (N = 1) → „… hat dann keinen Doppelkopf mehr". Je Spieler mit ≥1 Doppelkopf eine „Statt"-Option (real
> max. 4, praktisch selten > 2). Doppelköpfe einer Person sind ununterscheidbar (kein Bestohlener),
> daher Identifikation über Person + Anzahl, nicht über einen einzelnen Fang.

---

### C.3.4 — Gefangener Sonderpunkt im eigenen Team (Bestohlenen-Auswahl, B.3.4 / I12)

> Reiner **Hinweis-Dialog**, kein Auflösungsweg. Greift, wenn im „von wem?"-Picker eines gefangenen
> Fuchses/Karlchens eine Person aus dem **eigenen Team** des Fängers angetippt wird (beide bereits einer
> Partei zugeordnet, gleiches Team → I12). Da die einzig sinnvolle „Korrektur" das Wählen einer anderen
> Person ist, gibt es **nur „Abbrechen"** – nach dem Schließen steht der Picker wieder offen. Sind die
> Teams beim Fangen noch neutral, erscheint dieser Dialog nicht (jede Auswahl erlaubt, B.5.8).
> Beispiel mit Fuchs; analog für „Karlchen" (… kein Karlchen fangen).

**Meldung:**
> Dani kann von Robert keinen Fuchs fangen.
> Robert ist im selben Team wie Dani.

**Option 1 — Abbrechen**
- Ohne Änderung zurück.

---

### C.5.6 — Partei-Zuordnung: Tisch voll / Teams stehen fest

> Tritt nur bei vollständig zugeordnetem Tisch auf (die Kaskade B.5.4 lässt keinen Zwischenzustand
> „drei zugeordnet, einer offen" zu). Ein und derselbe Dialog deckt drei Blickwinkel ab: „dritte
> Person drängt in ein volles Team", Re↔Kontra-Umschalten bei vollem Tisch (B.5.5) und „eine feste,
> direkt gesetzte Zuordnung umwerfen". Die Meldung benennt die feste Zuordnung explizit (sie wird
> respektiert, nicht beiläufig aufgelöst). Reihenfolge der „Statt"-Optionen: Tischreihenfolge der zu
> verdrängenden Person. Bringt der Tausch Fänger und Bestohlene/n ins selbe Team, hängt zusätzlich die
> C.5.8-Zeile an die ausführende Option.

**Meldung:**
> Jan kann nicht einfach Kontra sein.
> Die Teams stehen schon fest – Robert und Sophia sind Kontra.

**Option 1 — Abbrechen**
- Ohne Änderung zurück.

**Option 2 — Statt Robert**
- Jan ist Kontra
- Robert ist Re

**Option 3 — Statt Sophia**
- Jan ist Kontra
- Sophia ist Re

---

### C.5.7 — Partei-Wechsel gegen abgeleitete Zugehörigkeit (Sonderspiel)

> Eine Person gehört wegen eines Sonderspiels zu einer Partei und soll auf die Gegenseite. Aufgelöst
> wird nicht die Zuordnung, sondern die **Ursache** (das Sonderspiel) – und zwar komplett
> (Unteilbarkeit, B.4.5). Die vom Schreiber gewünschte Aktion wird danach **ausgeführt**, nicht nur
> der Weg freigeräumt. Alle drei Sonderspiele (Hochzeit/Armut/Solo) können den Konflikt aus zwei
> Richtungen auslösen (Sonderspiel-Seite → Kontra / Gegner → Re).

> **Claude Code — interner Ablauf von „annullieren" (gilt für alle Fälle):**
> 1. Sonderspiel annullieren (alle Rollen neutralisieren, B.4.5).
> 2. Alle Partei-Zuordnungen aufheben.
> 3. Bestehende An-/Absagen bleiben erhalten und ziehen ihre Zuordnung wieder nach (B.2.2) – sie
>    werden NICHT mitgelöscht (P6: eigenständige Eingaben).
> 4. Die ausdrücklich gewünschte Aktion ausführen (z.B. „Robert ist Kontra").
> 5. Kaskade füllt den Rest (B.5.4). Was dann noch offen ist, bleibt neutral (erlaubt, B.5.5).
> Deshalb ist die dritte Subtitle-Zeile bewusst „soweit möglich" formuliert: Mit Ansagen sortiert sich
> der Tisch (teils/ganz), ohne Ansagen bleiben die Übrigen neutral.

**Der Konflikt kann aus beiden Richtungen kommen** – eine Person der Sonderspiel-Seite (Re) soll auf
Kontra, **oder** ein Gegner (Kontra) soll auf Re. In beiden Fällen ist das Sonderspiel der Grund, warum
*beide* Seiten gerade fest sind; es zu annullieren ist die Lösung.

**Meldungsschema:** „[Person] kann nicht [Zielpartei] sein." + Warum-Satz (je nach Spieltyp und
Richtung):

| Spieltyp | Person ist auf Sonderspiel-Seite (→ soll Kontra) | Person ist Gegner (→ soll Re) |
|---|---|---|
| Hochzeit | „Robert ist in der Re-Partei, weil Robert mit Kathrin zusammen Hochzeit spielt." | „Robert ist in der Kontra-Partei, weil Robert gegen die Hochzeit von Kathrin und Sophia spielt." |
| Armut | „Robert ist in der Re-Partei, weil Robert mit Kathrin zusammen die Armut spielt." | „Robert ist in der Kontra-Partei, weil Robert gegen die Armut von Kathrin und Sophia spielt." |
| Solo | „Robert spielt ein Buben-Solo und ist deshalb die Re-Partei." | „Robert ist in der Kontra-Partei, weil Robert gegen Sophias Buben-Solo spielt." |

Solo-Typ immer konkret nennen (Buben-Solo, Damen-Solo …).

**Optionen (für alle Spieltypen und beide Richtungen gleich):**

**Option 1 — Abbrechen**
- Ohne Änderung zurück.

**Option 2 — [Sonderspiel] annullieren** (Label je Spieltyp: „Hochzeit annullieren" / „Armut
annullieren" / „Solo annullieren")
- Annullieren-Zeile je Spieltyp:
  - Hochzeit: „Die Hochzeit zwischen [A] und [B] wird annulliert"
  - Armut: „Die Armut von [A] und [B] wird annulliert"
  - Solo: „[Solist]s [Solo-Typ] wird annulliert" (Solo-Typ konkret, z.B. „Roberts Buben-Solo wird
    annulliert")
- Robert ist Kontra *(bzw. Re, je nach gewünschter Aktion)*
- Die übrigen Partei-Zuordnungen werden, soweit möglich, neu bestimmt

---

### C.5.7 (mehrere Ursachen) — Zugehörigkeit aus mehreren Quellen

> Eine Person kann aus **maximal zwei** Quellen zu einer Partei gezwungen sein: einem Sonderspiel
> (max. eins, B.4.1) und einer eigenen An-/Absage (max. eine). Mehr partei-erzwingende Gründe gibt es
> nicht (die Kaskade B.5.4 ist keine eigene Ursache, sie folgt aus der Belegung). Solange eine Ursache
> bleibt, ist die Blockade nicht gelöst (P2) → **eine** Option entfernt alle auf einmal. Reihenfolge
> der Subtitle: erst die entfernten Ursachen, dann das Ergebnis.

**Meldung:**
> Robert kann nicht Kontra sein.
> Robert hat Re gesagt und spielt mit Kathrin zusammen Hochzeit.

**Option 1 — Abbrechen**
- Ohne Änderung zurück.

**Option 2 — Ursachen annullieren**
- Roberts Re-Ansage wird zurückgezogen
- Die Hochzeit zwischen Kathrin und Robert wird annulliert
- Robert ist Kontra
- Die übrigen Partei-Zuordnungen werden, soweit möglich, neu bestimmt

---

### C.5.8 (Teams schon zugeordnet) — Partei-Änderung macht gefangenen Fuchs/Karlchen ungültig

> **Kein eigener Dialog.** Diese Zeile wird als zusätzliche Konsequenz in die *ausführende* Option
> des ohnehin erscheinenden Dialogs (C.5.6 oder C.5.7) eingefügt – als **letzte** Subtitle-Zeile, nach
> dem eigentlichen Ergebnis. Greift, wenn eine Partei-Änderung Fänger und Bestohlene/n ins **selbe
> Team** bringt: Einen Fuchs/ein Karlchen vom eigenen Teamkollegen zu fangen ist unmöglich, der
> Sonderpunkt wird damit ungültig (verschwindet auf beiden Seiten aus der Wertung).

**Einzufügende Zeile (Fuchs):**
> Robert hat Kathrins Fuchs damit nicht gefangen (und Kathrin ihn nicht verloren)

**Einzufügende Zeile (Karlchen):**
> Robert hat Kathrins Karlchen damit nicht gefangen (und Kathrin es nicht verloren)

> **Claude Code:** Bedingung = Fänger und Bestohlene/r landen durch die Partei-Änderung im selben Team.
> Pro betroffenem Sonderpunkt eine Zeile. Der Sonderpunkt wird beim Bestätigen der Option gelöscht
> (Fang-Plus beim Fänger UND Verlust-Notiz bei der bestohlenen Person).
>
> **Umsetzung (Teil 2c):** Das Löschen ist als **automatischer Drop in jeder partei-ändernden Aktion**
> realisiert (`dropInvalidCaughtPoints` in `consistency.js`, angewandt in `setParty`/`setSolo`/
> `setHochzeit`/`setArmut`/`clearSpecialGame`). Dadurch gilt es einheitlich für **beide** B.5.8-Fälle:
> beim **lautlosen** Umhängen (Teams beim Fangen noch unbekannt → Zug ist konfliktfrei, der Punkt
> verschwindet ohne Dialog) **und** beim Dialog-Fall (C.5.6/C.5.7 → die ausführende Option zeigt die
> obige Zeile, weil sie den Drop antizipiert). „Weggesteckt = vergessen": der Punkt lebt nicht
> automatisch wieder auf, wenn die Teams später erneut gegnerisch werden (P6).

---

### C.5.9 — Aktion scheitert an bestehender Ansage

> Eine Person hat eine Ansage gemacht und gehört damit zu einer Partei; eine neue Aktion würde sie auf
> die Gegenseite bringen. Aufgelöst wird die **Ansage** (Button „zurückziehen" – Ansage-Pendant zu
> „annullieren"; es wird nichts umgetragen, die Ansage verschwindet). Die Meldung ist **aktionsnah**
> (siehe Aktions-Achse, C.Konventionen): Der „Was geht nicht?"-Satz benennt die auslösende Aktion, der
> „Warum nicht?"-Satz die bestehende Ansage. Der Warum-Satz ist immer gleich, der Was-Satz variiert:

| Auslösende Aktion | „Was geht nicht?" |
|---|---|
| Hochzeitspartner anpinnen | „Robert kann nicht bei Kathrin einheiraten." |
| Armuts-Retter anpinnen | „Robert kann nicht Kathrins Armut übernehmen." |
| Solist setzen | „Robert kann nicht das Solo spielen." |
| Re/Kontra sagen | „Robert kann nicht Re sagen." |
| Toggle / Wisch (reine Partei-Aktion) | „Robert kann nicht Re sein." |

**Meldung** (Beispiel Hochzeitspartner-Wahl):
> Robert kann nicht bei Kathrin einheiraten.
> Robert hat Kontra gesagt und gehört damit zur Kontra-Partei.

**Option 1 — Abbrechen**
- Ohne Änderung zurück.

**Option 2 — Kontra zurückziehen**
- Roberts Kontra-Ansage wird zurückgezogen
- Robert heiratet bei Kathrin ein (Re) *(bzw. die jeweils auslösende Aktion wird ausgeführt)*
- Die übrigen Partei-Zuordnungen werden, soweit möglich, neu bestimmt

> **Claude Code — P5 gilt auch in Auswahllisten:** Der Dialog erscheint nicht nur an einem
> Partei-Toggle, sondern auch aus einer **Auswahl** heraus (z.B. Hochzeit-Partner-Wahl). Roberts
> Avatar ist dort optisch ausgegraut, aber klickbar; der Klick wirft genau diesen Dialog. P5 greift
> überall, wo eine Auswahl zu einem Konflikt führen würde, nicht nur bei Schaltern. Der zweite Subtitle
> beschreibt die jeweils auslösende Aktion (einheiraten / Armut übernehmen / Solo spielen / Ansage /
> Partei).

**Ergebnis-Zeile (zweite Subtitle) je Aktion** – beschreibt, was nach dem Rückzug ausgeführt wird:

| Auslösende Aktion | Ergebnis-Zeile |
|---|---|
| Hochzeitspartner anpinnen | „Robert heiratet bei Kathrin ein (Re)" |
| Armuts-Retter anpinnen | „Robert übernimmt Kathrins Armut (Re)" |
| Solist setzen | „Robert spielt das [Solo-Typ] (Re)" |
| Re/Kontra sagen · Toggle | „Robert ist Re" |

### C.5.9 (Sonderspiel-Tür) — benannte Person vs. dritter Gegner; bis zu zwei Ansagen

> Ein Sonderspiel-Setzen ist ein Partei-Setzakt für **alle vier** (B.4.7) und kann darum eine Ansage
> verletzen, die **nicht** der direkt benannten Person gehört, sondern einem per Kaskade auf die
> Gegenseite gedrückten **dritten** Gegner (B.5.9 „vorausschauend": der Folgekonflikt gehört in
> **denselben** Dialog, nicht in einen zweiten). Tischweit können höchstens **zwei** solche Ansagen
> zugleich anliegen (I5: je eine Re- und eine Kontra-Ansage). Alle werden in **einer** Option
> zurückgezogen.

**„Was geht nicht?" je Spieltyp und Konflikt-Lage:**

| Spieltyp | nur die benannte Person (Partner/Solist) kollidiert | ein dritter Gegner (ggf. zusätzlich) kollidiert |
|---|---|---|
| Solo | „Robert kann nicht das [Solo-Typ] spielen." | „Robert kann nicht das [Solo-Typ] spielen." |
| Hochzeit | „Robert kann nicht bei Kathrin einheiraten." (Katalogform) | „Kathrin und Robert können nicht zusammen Hochzeit spielen." |
| Armut | „Robert kann nicht Kathrins Armut übernehmen." (Katalogform) | „Kathrin und Robert können nicht zusammen die Armut spielen." |

> Solo nutzt **immer** die Solist-Form (das Solo ist die Aktion, egal wer blockiert). Bei Hochzeit/
> Armut bleibt die Katalogform nur, wenn **ausschließlich** der angepinnte Partner kollidiert; sobald
> ein Dritter beteiligt ist, gilt die **hergeleitete** Team-Form („… können nicht zusammen … spielen").

**„Warum nicht?"**
- Eine Ansage: „Sophia hat Re gesagt und gehört damit zur Re-Partei." (wie Hauptblock)
- Zwei Ansagen: „Robert hat Kontra gesagt und Sophia hat Re gesagt."

**Optionen:**

**Option 1 — Abbrechen** · Ohne Änderung zurück.

**Option 2 — [Ansage] zurückziehen** (eine Ansage) bzw. **Ansagen zurückziehen** (zwei)
- je zurückgezogener Ansage eine Zeile: „Sophias Re-Ansage wird zurückgezogen"
- Ergebnis-Zeile je Spieltyp:
  - Solo: „Robert spielt das [Solo-Typ] (Re)"
  - Hochzeit (Partnerform): „Robert heiratet bei Kathrin ein (Re)"; (Teamform): „Kathrin und Robert
    spielen zusammen Hochzeit (Re)"
  - Armut (Partnerform): „Robert übernimmt Kathrins Armut (Re)"; (Teamform): „Kathrin und Robert
    spielen zusammen die Armut (Re)"
- „Die übrigen Partei-Zuordnungen werden, soweit möglich, neu bestimmt"
- ggf. C.5.8-Zeile(n), falls das Setzen einen gefangenen Fuchs/Karlchen ins selbe Team bringt

> **Claude Code:** Implementiert in `buildSpecialGameSetConflictDialog` – sammelt alle I7-Verletzer im
> gedachten Endzustand, zieht ihre Ansagen zurück, prüft per `resolvesCleanly`. Bleibt danach ein
> Rest-Konflikt (vom Regelwerk nicht erfasst), → `null` → sicherer Fallback (P8).

---

### C.5.10 — Wisch-Geste: zwei Spieler zu einem Team verbinden

> **Claude Code:** Die Wisch-Geste wird mit-implementiert. Sie ist nur eine weitere **Eintrittstür**
> in den Partei-Block – neue Geste, bekannte Logik. **Neu ist allein, dass die Geste die Richtung
> offenlässt** („die zwei zusammen", ohne zu sagen, ob Re oder Kontra). Detailfragen zur Geste
> (Trigger-Area, Animation, Abbruch-Verhalten beim Ziehen) bitte mit Jan klären, bevor du sie baust.
>
> **Kernprinzip (Jan, Session 8):** *Die Zuordnung von zweien ist immer die Zuordnung von vieren.*
> Sobald die zwei gewischten Personen eine Partei haben, steht per Kaskade (B.5.4) der ganze Tisch.
> Deshalb darf die Auflösung auch An-/Absagen **dritter, nicht gewischter** Personen zurückziehen,
> wenn die Kaskade sie sonst auf eine volle/widersprechende Seite drücken würde.

> **Gesten-Bedienung (mit Jan festgelegt, 14.6.2026):**
> - **Fläche – Start UND Ziel:** der gesamte Player-Backdrop der **vier aktiven Eck-Spieler**. Aussetzer
>   (Rand-Avatare) sind weder Start noch Ziel. Das Ziel wird am `touchend` per `elementFromPoint()`
>   bestimmt (jeder aktive Backdrop trägt eine `data-player-id`).
> - **Tap vs. Wisch:** Ein kurzer Tap (Finger <20px bewegt, <0,4s) irgendwo auf dem Backdrop öffnet
>   das Player-Sheet (bisher nur am Avatar – jetzt die ganze Zone). Ein Wisch wird ausgelöst, sobald
>   **entweder ~0,4s gehalten ODER >20px bewegt** wurde (was zuerst kommt).
> - **Während des Ziehens:** eine Verbindungslinie vom **Avatar** des Start-Spielers zum Finger; die
>   drei anderen aktiven Backdrops werden als gültige Ziele hervorgehoben, das gerade überfahrene
>   stärker.
> - **Loslassen** über einem gültigen aktiven Mitspieler → die Geste greift (Verhaltensweisen a–e).
>   Im Leeren, auf sich selbst oder auf einem Aussetzer → folgenlos abbrechen (Fall a).
> - **Technik:** auf der Gesten-Fläche `-webkit-touch-callout: none`, `user-select: none`,
>   `touch-action: none`, damit iOS-Bildmenü, Textauswahl und Scroll nicht dazwischenfunken.

**Fünf Verhaltensweisen – nur drei brauchen einen Dialog:**

**(a) Ungültige/unvollständige Geste** (auf sich selbst, im Leeren endend, nicht sauber von A nach B)
→ **kein Dialog, nichts passiert** (ignorieren).

**(b) Beide schon korrekt im selben Team** → **kein Dialog** (No-op, ggf. dezente visuelle Quittung).
Konsistent dazu, dass auch „eine Seite schon gesetzt, andere neutral" ohne Bestätigung läuft (→ c).

**(c) Eine Seite festgelegt, die andere neutral** → der neutrale Spieler wird **dialoglos** derselben
Partei zugeordnet; Tisch ist danach per Kaskade sortiert. **Kein Dialog.**

**(d) Beide neutral → Richtungswahl-Dialog** (kein Konflikt → Abbrechen unten):

**Meldung:**
> Robert und Kathrin bilden ein Team.
> Sind die beiden Re oder Kontra?

**Option 1 — Re**
- Robert und Kathrin sind Re
- Jan und Sophia sind Kontra

**Option 2 — Kontra**
- Robert und Kathrin sind Kontra
- Jan und Sophia sind Re

**Option 3 — Abbrechen**
- Ohne Änderung zurück.

**(e) Widerspruch (die beiden sind aktuell verschiedene Parteien oder fest verankert) →
Richtungswahl-Dialog mit Konsequenzen** (Konflikt → Abbrechen zuerst):

> **Ein und derselbe Dialog-Typ** für alle Konstellationen – zwei Richtungen („Beide Re" / „Beide
> Kontra"), jede mit ihrer **vollständigen** Konsequenz-Liste. Was variiert, ist allein die **Länge der
> Liste**, je nachdem wie viele Ursachen der gewählten Richtung im Weg stehen. Die Listen sind oft
> **asymmetrisch** (eine Richtung „mit dem Strom", billiger). Beide Richtungen sind dank Annullieren/
> Zurückziehen **immer** möglich, nur zu unterschiedlichem Preis.

Möglichkeitsraum (alles derselbe Dialog, nur unterschiedlich lange Konsequenz-Listen):

| Aufzulösen | Mechanik (Auflösung) | eigener Wortlaut nötig? |
|---|---|---|
| nur Zuordnung(en), keine echte Ursache | Voll-Team-Tausch → C.5.6 | nein (Verweis) |
| 1 Ansage | Ansage zurückziehen → C.5.9 | nein (Verweis) |
| 1 Sonderspiel | Sonderspiel annullieren → C.5.7 | nein (Verweis) |
| Sonderspiel + 1 Ansage | C.5.7 + C.5.9 kombiniert | nein (zwischen den Eckfällen) |
| **2 Ansagen** (auch dritte Person) | 2× C.5.9 | **ja – unten ausformuliert** |
| **Sonderspiel + 2 Ansagen** | C.5.7 + 2× C.5.9 | **ja – unten ausformuliert** |

> **Claude Code — Bildungsregel der Konsequenz-Liste:** Für jede Richtung sammelt die App **alle**
> Ursachen ein, die dieser Richtung im Weg stehen (Sonderspiele, eigene und fremde Ansagen), und listet
> sie in dieser Reihenfolge: erst die entfernten Ursachen (Annullierungen, Rückzüge), dann das Ergebnis
> (wer ist Re/Kontra), dann die Kaskade. Die **Mechanik je Ursache** ist die der Einzelblöcke (C.5.6 /
> C.5.7 / C.5.9) – der Wisch erfindet keine neue Auflösung. **Neu am Wisch ist allein, dass mehrere
> unabhängige Ursachen gleichzeitig** aufgelöst werden können (z.B. ein Sonderspiel und zusätzlich die
> davon unabhängige Ansage einer dritten, nicht gewischten Person, die nur durch die Kaskade ins
> Schleudern kommt). Liste bis zu fünf Zeilen (max. ein Sonderspiel + zwei Ansagen + Ergebnis +
> Kaskade). Die kürzere Liste signalisiert implizit die Richtung „mit dem Strom" – kein Extra-Hinweis.

Die einfachen Konstellationen (eine Zuordnung / eine Ansage / ein Sonderspiel / Sonderspiel + eine
Ansage) folgen exakt diesem Schema mit kürzerer Liste; ihre Auflösungs-Mechanik steht in den
verwiesenen Blöcken. Ausformuliert werden hier nur die beiden Fälle, die der Wisch als Einziger
erzeugt – mehrere unabhängige Ursachen auf einmal:

**Fall „zwei Ansagen" (ohne Sonderspiel):** Robert hat Re gesagt, Kathrin hat Kontra gesagt – sie sind
dadurch **verschiedene Parteien**; niemand spielt ein Sonderspiel. Wisch Robert↔Kathrin.

> **Wichtig (Jan-Klarstellung, 15.6.2026):** Ein echter Konflikt liegt nur vor, wenn die **beiden
> gewischten** Personen sich widersprechen (verschiedene Parteien / feste Verankerung). Ist dagegen
> **eine der beiden bereits zugeordnet und die andere neutral**, ist die Sache immer eindeutig → sie
> wird **dialoglos der zugeordneten Partei** zugeschlagen (Fall c), egal welche Ansagen sonst noch am
> Tisch stehen. Darum ist im folgenden Beispiel Kathrin nicht neutral, sondern selbst Kontra angesagt.

**Meldung:**
> Robert und Kathrin können aktuell kein Team bilden.
> Robert hat Re gesagt, Kathrin hat Kontra gesagt. Wie soll die Situation aufgelöst werden?

**Option 1 — Abbrechen**
- Ohne Änderung zurück.

**Option 2 — Beide Re**
- Kathrins Kontra-Ansage wird zurückgezogen
- Robert und Kathrin sind Re
- Jan und Sophia sind Kontra

**Option 3 — Beide Kontra**
- Roberts Re-Ansage wird zurückgezogen
- Robert und Kathrin sind Kontra
- Jan und Sophia sind Re

> Hier sind beide Listen gleich lang: jede Richtung zieht genau die eine widersprechende Ansage des
> gewischten Paares zurück, die andere bleibt. Die **Asymmetrie** „mit dem Strom" wird im nächsten Fall
> sichtbar, wo zusätzlich ein Sonderspiel aufzulösen ist.

**Fall „Sonderspiel + zwei Ansagen" (volle Tiefe, fünf Zeilen):** Kathrin+Sophia spielen Hochzeit (Re),
Jan+Robert dadurch Kontra, Robert hat Kontra gesagt, Sophia hat Re gesagt. Wisch Robert↔Kathrin.

**Meldung:**
> Robert und Kathrin können aktuell kein Team bilden.
> Kathrin spielt mit Sophia Hochzeit (Re), Robert spielt dagegen und hat Kontra gesagt. Wie soll die
> Situation aufgelöst werden?

**Option 1 — Abbrechen**
- Ohne Änderung zurück.

**Option 2 — Beide Re**
- Sophias und Kathrins Hochzeit wird annulliert
- Roberts Kontra-Ansage wird zurückgezogen
- Sophias Re-Ansage wird zurückgezogen
- Robert und Kathrin sind Re
- Jan und Sophia sind Kontra

**Option 3 — Beide Kontra**
- Sophias und Kathrins Hochzeit wird annulliert
- Sophias Re-Ansage wird zurückgezogen
- Robert und Kathrin sind Kontra
- Jan und Sophia sind Re

> Die „Beide Kontra"-Liste ist kürzer (Roberts Kontra-Ansage passt zur Zielrichtung und bleibt) –
> Richtung „mit dem Strom".

> **Absage-Doppelung als Folge des Wischs (Jan-Entscheid, 15.6.2026):** Bringt eine Vereinigung zwei
> Personen mit **derselben Absage** (z.B. beide „Keine 90") ins selbe Team, ist das die verspätete
> Absage-Doppelung aus B.2.6 → sie wird über den **C.2.6-Dialog als Folge-Schritt** gelöst („wer behält
> die Absage?", beide Richtungen). Ablauf: Der Wisch setzt zuerst seine Richtung (Fall c dialoglos bzw.
> d/e per Dialog); entstünde dabei eine Doppelung, erscheint **direkt danach** der C.2.6-Dialog. Die
> ausführende Option committet Team-Setzung **und** Absage-Rückzug **atomar zusammen** – der
> inkonsistente Zwischenstand wird nie committet (P8). Mehrere gleichzeitige Doppelungen sind vom
> Regelwerk nicht erfasst → sicherer Fallback.

---

### C.Fallback — unerwarteter Konflikt ohne spezifischen Dialog (P8)

> Sicherheitsnetz, das **nie sichtbar werden sollte.** Greift nur, wenn eine Aktion eine Invariante
> (A.4) verletzen würde und kein spezifischer Auflösungs-Dialog (Teil B/C) den Fall abdeckt. Die Aktion
> wird geblockt (letzter konsistenter Zustand bleibt), und der Vorgang wird geloggt. Bewusst neutral
> und knapp – der Schreiber hat nichts falsch gemacht, das Regelwerk hat eine Lücke.

**Meldung:**
> Das geht gerade nicht.
> Diese Eingabe würde zu einem widersprüchlichen Stand führen und wurde nicht übernommen. Ein Hinweis
> an die Entwickler wurde gespeichert. Bitte merke dir, was du gerade gemacht hast, und gib uns
> Bescheid.

**Option 1 — Zurück**
- Ohne Änderung zurück (der letzte stimmige Stand bleibt).

> **Claude Code:** Beim Auslösen **persistent in der Datenbank** loggen (nicht nur Konsole), damit der
> Fall rekonstruierbar ist: verletzte Invariante (A.4-Nummer), versuchte Aktion, betroffene Spieler,
> Zustand davor, ID des eingeloggten Schreibers und Zeitstempel (so ist nachvollziehbar, wen man
> ansprechen kann). Dieses Log ist der Hinweis auf eine zu schließende Regel-Lücke. Bewusst **keine
> Freitexteingabe** für den Schreiber – das strukturierte Log plus die bekannte Schreiber-Identität
> genügen; die Person wird nur gebeten, Bescheid zu geben. Kein „Trotzdem speichern"-Ausweg – der
> sichere Default blockt immer.
# ANHANG – ENTSTEHUNG (Sessionprotokoll)

*Nur zur Nachvollziehbarkeit der Entscheidungen; für die Umsetzung nicht erforderlich.*

- **Session 1 – Grundlagen:** Reaktionsmuster, Grundprinzipien P1–P4, Einordnungsraster; Reihenfolge
  simpel → komplex, Partei-Knoten zuletzt.
- **Session 2 – An-/Absagen & Sonderspiele:** Re/Kontra-Ausschluss, eine Ansage/Absage pro Team,
  Absagen-Toggles ohne Ausschluss (Lücken erlaubt), verspäteter Konflikt; Sonderspiele (eines pro
  Spiel, eine auslösende Person, fixiert die Verteilung, Rollen sichtbar, Löschen nur an der Quelle).
- **Session 3 – Sonderpunkte & P5:** max. zwei gleiche An-/Absagen (frühere Regel — **in
  Session 7 verworfen, siehe dort**); Sonderpunkt-Obergrenzen tischweit; Karlchen gemacht/gefangen
  kein Ausschluss; **P5** (einheitliches Konflikt-Muster) eingeführt.
- **Session 4 – Augen & Einstieg Partei-Knoten:** B.6 (Mindestanforderung; Augen nur Wertebereich);
  Partei-Knoten begonnen (Zugehörigkeit ≠ Ansage, vier Quellen, Toggle, Kaskade, neutral,
  Überfüll-Konflikt).
- **Session 5 – Partei-Knoten abgeschlossen & Architektur:** abgeleitete vs. manuelle Auflösung,
  Unteilbarkeit der Sonderspiele, Sonderpunkt-Ungültigkeit, widersprechende Ansage,
  Kaskaden-Folgekonflikte, Ketten → Reset, Wisch-Geste; **P6** (Laufzeit-Ableitung) und **P7**
  (zentrale Logik); Mehrursachen → gebündelte Auflösung; Meldungs-Katalog angelegt.
- **Session 6 – Gegenlesen & Rework:** Vorwort auf „Ergänzung zur CLAUDE.md" umgestellt; Teil-Buchstaben
  eindeutig (Meldungen = Teil C, Offene Punkte = D, Protokoll = Anhang); Reaktionsmuster auf die zwei
  real genutzten eingedampft (Typ-Nummern entfernt); P1 mit Brücke zu P6 entschärft; B.4.6 auf
  Tisch/Sheet-Anzeige mit DB-Werten umgestellt (Gegner = reine Anzeige-Labels); B.5-Übersicht als
  Landkarte an den Anfang; Button-Texte im Katalog ergänzt.
- **Session 7 – Wording-Arbeitspaket (Teil C) & erste Streichung:** Meldungs-Katalog von Tabelle auf
  Block-Format umgestellt (Subtitle-Listen brauchen mehr Platz als eine Tabellenzelle); verbindliche
  Wording-Konventionen festgelegt (Dritte-Person-Perspektive mit ausgeschriebenen Namen, da der
  Schreiber nicht die betroffene Person ist; Meldung in zwei Sätzen *Was geht nicht? / Warum nicht?*;
  keine Erklärung von Doko-Grundregeln; Standard-Buttons „Abbrechen" / „Korrektur" mit
  konsequenz-erklärendem Subtitle, Liste sobald mehrere Einzeländerungen). Die ersten beiden
  Ansage-Konfliktblöcke (zweite gleiche Ansage / zweite gleiche Absage im Team) ausformuliert.
  **Streichung der früheren „Max-zwei-gleiche-An/Absagen"-Regel:** Sie war schlicht falsch. Ihre
  Annahme „bei drei gleichen Ansagen sind mindestens zwei zwangsläufig Teamkollegen" gilt nur bei
  *vollständiger* Parteizuordnung. Solange Parteien noch offen sind (niemand Re/Kontra gesagt, keine
  Teams gesetzt), sind drei neutrale Personen mit derselben Absage („Keine 90") völlig widerspruchsfrei
  — die dritte könnte zur Gegenpartei gehören (dort ist „Keine 90" erneut zulässig, eine pro Team). Der
  Konflikt entsteht nicht am dritten Ansage-Klick, sondern erst, wenn eine *Parteizuordnung* zwei
  gleiche Sager ins selbe Team zwingt — und dieser verspätete Fall ist bereits durch die
  „verspäteter-Konflikt"-Regel abgedeckt und wird wie der Zweite-gleiche-Absage-Fall aufgelöst (eine:r
  der Teamkollegen behält die Absage, die Ansage der Gegenpartei bleibt unberührt). Also kein eigener
  Konfliktfall. Bewusst **komplett gelöscht** (nicht als „Nicht-Regel" dokumentiert): Eine Nicht-Regel
  aufzuführen würde die Tür für beliebig viele weitere öffnen; die Erkenntnis steht hier im Protokoll.
  **Streichung der früheren „Kaskaden-Folgekonflikt"-Regel:** Beim Ausformulieren stellte sich heraus,
  dass kein Beispiel konstruierbar ist, das sie vom „feste-Teams-Tausch"- bzw. vom
  „widersprechende-Ansage"-Fall unterscheidet. Jeder Versuch, einen Kaskaden-Folgekonflikt zu bauen,
  landet entweder bei „Teams stehen fest, eine Person soll auf die volle Gegenseite" oder bei
  „bestehende Ansage widerspricht der erzwungenen Partei". Der einzige eigenständige Gehalt war das
  *Prinzip*, solche Folgekonflikte **vorausschauend im selben Dialog** zu zeigen (P5) statt in einem
  zweiten, nachgelagerten – plus die Verallgemeinerung auf alle Eintrittstüren (auch Sonderspiel-
  Setzen). Dieser Kern wurde in den Fließtext des „widersprechende-Ansage"-Falls gerettet, der
  Scheinfall komplett gestrichen (Fließtext + Katalog), die Verweise umgebogen.
  **Erweiterung des Voll-Team-Falls:** Dabei kam Jans Grundsatz auf, dass eine **manuell gesetzte,
  vollständige Teamzuordnung eine bewusste Aussage des Schreibers** ist und nicht beiläufig aufgelöst
  wird (die App geht davon aus, dass sie stimmt). Der Voll-Team-Dialog deckt damit drei Blickwinkel ab
  (volles Team / Umschalten bei vollem Tisch / feste Teams umwerfen); die Meldung benennt die feste
  Zuordnung explizit („Die Teams stehen schon fest …"). Grundsatz im Fließtext festgehalten (nicht als
  neues P-Prinzip – zu spezifisch).
  **Streichung der früheren „Umhängen-mit-Folgekonsequenzen"-Regel (Rückzieher/Reset-Notbremse):**
  Dieselbe Erkenntnis, eine Stufe weiter. Sie wollte „beliebig tiefe Konfliktketten" mit einer
  Notbremse abschneiden. Solche Ketten kann es aber gar nicht geben: Eine Person hat **maximal zwei**
  partei-erzwingende Bindungen (ein Sonderspiel + eine Ansage). Jeder Umhäng-Konflikt ist damit
  vollständig durch Tausch, Sonderspiel-Annullieren oder Ansage-Zurückziehen lösbar – alle drei unter
  Bewahrung der Ansagen. Der einzige eigenständige Gehalt war der **harte Reset** (auch Ansagen löschen
  → leere Tafel). Der ist nie *erzwungen nötig*, höchstens *bequem*. Deshalb als Konflikt-Fall
  **komplett gestrichen** (Fließtext + Katalog), die Kern-Erkenntnis als Hinweis im
  „widersprechende-Ansage"-Fall gesichert.
  **Reset neu verortet:** Der „Tisch komplett leeren"-Reset wird ein **bewusstes Komfort-Werkzeug im
  Hamburger-Menü** (oben rechts), kein konflikt-getriggerter Ausweg. Er leert ALLES inkl. Ansagen –
  das ist die Abgrenzung zum Annullieren/Zurückziehen (die Ansagen bewahren). Der Reset wurde als
  Komfort-Werkzeug fürs Hamburger-Menü festgehalten; die zugehörige Notbremse-Feinheit der gestrichenen
  Umhängen-Folgekonsequenzen-Regel wurde damit gegenstandslos.
- **Session 8 – Wisch-Geste (B.5.10) & Abschluss Wording-Katalog:** Die drei getrennten
  B.5.10-Einträge (neutral / Widerspruch / feste Verankerung) zu **einem** Sammelblock zusammengeführt,
  der alle fünf Verhaltensweisen beschreibt (inkl. der drei dialoglosen No-ops) – mit Claude-Code-
  Hinweis, dass die Geste mit-gebaut wird und Detailfragen mit Jan zu klären sind. Neue Konvention:
  **Richtungswahl-Dialoge (echte offene Wahl, kein Konflikt) → Abbrechen unten**; Konflikt-Dialoge
  weiter Abbrechen zuerst. Kernprinzip festgehalten (Jan): *die Zuordnung von zweien ist immer die
  Zuordnung von vieren* – daher darf die Auflösung auch An-/Absagen dritter, nicht gewischter Personen
  zurückziehen. Tiefen-Beispiel (fünfzeilige Konsequenz-Liste, asymmetrische Richtungen) im Katalog
  dokumentiert. Damit Teil C vollständig (9/9), kein offener Katalog-Block mehr.
- **Session 9 – Umsetzung Teil 2b/2c & Schließen der Wording-Lücken:** Bei der Implementierung der
  Partei-Knoten-Teile traten Stellen zutage, an denen Teil C nur ein Beispiel statt aller Varianten
  ausformuliert hatte; diese wurden nachgetragen, damit Spec und Code deckungsgleich sind.
  **C.5.7:** Annullieren-Zeile je Spieltyp ausformuliert (bisher nur Hochzeit-Beispiel): Hochzeit „Die
  Hochzeit zwischen A und B …", Armut „Die Armut von A und B …", Solo „[Solist]s [Solo-Typ] …".
  **C.5.9:** Ergebnis-Zeile (zweite Subtitle) je Aktion tabelliert; neuer Unterblock **„Sonderspiel-Tür"**
  für den **kaskaden-induzierten Dritt-Konflikt** (B.5.9 vorausschauend): ein per Kaskade auf die
  Gegenseite gedrückter dritter Gegner verletzt seine eigene Ansage. Entscheidung Jan: das **Wording
  herleiten** statt im Fallback zu lassen – Solo nutzt weiter die Katalogform („… kann nicht das Solo
  spielen"), Hochzeit/Armut bei Dritt-Beteiligung die hergeleitete **Team-Form** („A und B können nicht
  zusammen Hochzeit/die Armut spielen"). Bis zu zwei Ansagen zugleich (I5) werden in einer Option
  zurückgezogen.
  **C.2.6 (neu):** Die verspätete An-/Absage-Doppelung durch Partei-Zuordnung (B.2.6) bekam einen
  eigenen Katalog-Block. Entscheidung Jan: da beide Ansagen gleich alt sind (keine „klickende"
  Ansagerin wie in C.2.5), bietet der Dialog **beide Richtungen** zum Behalten an statt einer einzigen
  Korrektur. B.2.6-Regeltext entsprechend ergänzt.
  **C.5.8:** Umsetzungsnotiz ergänzt – das Löschen ungültig gewordener gefangener Sonderpunkte ist als
  **automatischer Drop in jeder partei-ändernden Aktion** realisiert und deckt damit beide B.5.8-Fälle
  (stiller Drop ohne Dialog beim lautlosen Umhängen + Konsequenz-Zeile im Dialog) einheitlich ab.
  Engine-seitig dazugekommen: zusammengesetzte Aktionen `setSolo`/`setHochzeit`/`setArmut` (Rollen +
  alle vier Parteien in einem Zug, B.4.7 – Voraussetzung für die P5-Vorausschau beim Partner-Picker)
  und `clearSpecialGame` (Annullieren-Ablauf C.5.7). Inhaltlich keine neuen Regeln, nur Wording-Lücken
  geschlossen.
- **Session 10 – Umsetzung Teil 4 (Sonderpunkte) & C.3.4 (neu):** Die Sonderpunkt-Erfassung an die
  zentrale Engine angeschlossen (bisher direkt committet, ohne Prüfung). Das Kontingent wird jetzt
  **tischweit** ausgewertet (I11, vorher zählte der UI-Code pro Person), die Viererreihe nach P5
  ausgegraut-aber-klickbar statt hart deaktiviert, und C.3.2 (Kontingent erschöpft) als Auflösungs-
  Dialog gebaut (Fuchs/Doppelkopf „Statt"-Optionen, Karlchen „Korrektur"; bei gefangenen Punkten
  schließt das „von wem"-Nachfassen an, technisch über einen geteilten `pendingLoserSelection`-Auftrag
  vom zentralen Dialog ans Sheet). **C.3.4 (neu):** Entscheidung Jan – im „von wem?"-Picker werden
  eigene Teamkollegen ausgegraut (I12); Klick darauf zeigt einen reinen Hinweis-Dialog mit nur
  „Abbrechen" (Fangen im eigenen Team unmöglich). B.3.4 um die beiden Richtungen (Ersterfassung /
  spätere Partei-Änderung) erweitert. B.5.8 war schon in Teil 2c (automatischer Drop) erledigt.
- **Session 11 – Umsetzung Teil 5 (Wisch-Geste B.5.10/C.5.10):** Gesten-Bedienung mit Jan festgelegt und
  in C.5.10 als „Gesten-Bedienung" verankert (ganzer Player-Backdrop als Start- UND Ziel-Fläche der vier
  Aktiven; Tap <20px/<0,4s → Sheet, Wisch ab ~0,4s Halten ODER >20px Bewegung; Verbindungslinie vom
  Avatar; Ziel per `elementFromPoint`; iOS-Callout/Scroll via `touch-action`/`user-select`/
  `-webkit-touch-callout: none` unterdrückt). Engine: neue atomare Aktion `setAllParties` (alle vier
  Parteien in einem Zug, ein einziger C.5.8-Drop-Durchlauf), `uniteInDirection` (annulliert ein im Weg
  stehendes Sonderspiel → zieht widersprechende Re/Kontra-Ansagen zurück, auch dritter Personen → setzt
  alle vier) und `buildSwipeDialog` (Fälle d/e) in `consistencyDialogs.js`; `requestSwipe` im GameContext
  (a/b/c dialoglos, d/e Dialog, sonst sicherer Fallback). `TableView`: Pointer-basierte Gestenerkennung
  + Verbindungslinien-Overlay. **Spec-Korrektur (Jan, 15.6.2026):** Das „zwei Ansagen"-Beispiel war
  fehlerhaft (zeigte einen *neutral + zugeordnet*-Fall als Konflikt-Dialog und zog bei „Beide Kontra"
  eine Re-Ansage zurück, die gar nicht im Weg stand). Klarstellung verankert: **neutral + bereits
  zugeordnet ⇒ immer dialoglos zur zugeordneten Partei** (Fall c); das Beispiel auf einen echten Konflikt
  umgeschrieben (beide Gewischten gegnerisch angesagt: Robert Re, Kathrin Kontra). **Absage-Doppelung
  durch Wisch (Jan-Entscheid):** bringt eine Vereinigung zwei gleiche Absagen ins Team, wird das über den
  **C.2.6-Dialog als Folge-Schritt** gelöst (`resolveSwipe` im GameContext, `buildAbsageKeepDialog`); die
  Option committet Team-Setzung + Rückzug atomar (nie inkonsistenter Commit, P8). `uniteInDirection` lässt
  I6 darum offen (statt null/Fallback), alle anderen Restverletzungen weiterhin → Fallback. In C.5.10
  dokumentiert.
