# CLAUDE.md – Projektbriefing „Dokorama"

> Diese Datei ist das zentrale Briefing für jeden Claude-Assistenten, der an diesem Projekt arbeitet.
> Sie wird bei jeder neuen Sitzung gelesen. Halte sie aktuell.
> Letzte Aktualisierung: 31. Mai 2026 – App-Name „Dokorama" festgelegt (Arbeitstitel).

---

## 1. Wer ist der Nutzer?

Der Projektinhaber heißt Jan. Er ist Ökonom, kein Softwareentwickler. Er denkt strategisch und konzeptionell, hinterfragt Entscheidungen kritisch und will das Coding verstehen und lernen. Er arbeitet parallel an einem iOS-Projekt in Swift/SwiftUI (siehe separates Briefing „Bewusster Genuss") und baut damit gerade seine ersten Coding-Erfahrungen auf.

Dieses Projekt ist sein **zweites Coding-Lernprojekt** – diesmal mit Fokus auf Web-Technologien, Datenbank-Design und Server-Anbindung.

### Was das für die Zusammenarbeit bedeutet:

- **Immer erst erklären, dann implementieren.** Vor jeder Änderung: Was wird geändert, wo, warum, welche Dateien sind betroffen.
- **Ausführliche deutsche Kommentare** im Code. Jede Datei, jede Funktion, jeder nicht-triviale Block. Geschrieben für einen neugierigen Laien.
- **Keine unnötigen Fachbegriffe.** Wenn doch, dann direkt erklären.
- **Risiken und Alternativen benennen.** Jan will fundiert entscheiden, nicht blind vertrauen.
- **Keine stillen Änderungen.** Jede Änderung braucht Jans Bestätigung, bevor sie umgesetzt wird.
- **Lernprojekt-Modus:** Jan will jeden Schritt selbst machen und verstehen. Nicht „hier ist der fertige Code", sondern „hier ist was wir als nächstes bauen und warum".
- **Nichts dazuerfinden.** Nur dokumentieren, was Jan explizit gesagt hat. Im Zweifel fragen, nicht annehmen.

---

## 2. Was ist die „Doko-App"?

### Die Grundidee

**Dokorama** (Arbeitstitel) – eine Web-App zur Erfassung und Auswertung von Doppelkopf-Spielabenden für Jans private Spielrunde. Ziel: Das handgeschriebene Büchlein und die mühsame Excel-Pflege ablösen – mit einer schnellen Eingabe und automatischen, umfangreichen Statistiken.

### Warum das Projekt existiert

Die Runde spielt regelmäßig Doppelkopf und schreibt jedes Spiel detailliert in ein Büchlein. 2024 hat Jan alle Partien in Excel übertragen und Auswertungen gemacht – das war sehr beliebt, aber zu aufwändig, um es dauerhaft durchzuhalten. 2025 ist die Excel-Pflege eingeschlafen. Alle wollen die Statistiken zurück, aber niemand will den manuellen Aufwand.

### Die zentrale Design-Herausforderung

**Maximale Statistik-Tiefe bei minimalem Eingabe-Aufwand.** Die Erfassung muss so schnell und reibungslos sein, dass sie am Spieltisch nach jedem einzelnen Spiel passieren kann, ohne den Spielfluss zu stören.

---

## 3. Zielgruppe und Nutzungskontext

### V1: Jans private Doko-Runde

- **Spielerkreis:** Ein Pool von ca. 10–15 Personen (4–5 Kernspieler:innen + 3–4 Ersatzspieler:innen), die innerhalb eines Jahres mal dabei sind
- **Pro Abend:** Typischerweise 4–5 Spieler:innen anwesend, selten 6. Technisch müssen bis zu 7 unterstützt werden (bisher nie vorgekommen, bei 8 würde man zwei Partien aufmachen)
- **Bei mehr als 4 Spieler:innen** setzen immer die über 4 hinausgehenden Personen aus (bei 5: 1 setzt aus, bei 6: 2, bei 7: 3)
- **Edge Case:** Spieler:innen können auch mitten am Abend dazukommen oder früher gehen (wird auf Runden-Ebene getrackt)
- **Erfassung:** Jede:r eingeloggte Spieler:in kann Spiele erfassen – typischerweise macht es eine:r (meist Robert), aber das ist nicht technisch eingeschränkt
- **Mixed Devices:** Apple und Android → darum Web-App
- **Kein Budget** in der Runde für Hosting o.ä. Jan hat eine kleine Zahlungsbereitschaft als Lehrgeld, aber je günstiger desto besser

### Zugangsmodell (V1):

- **Gruppen-Link (ohne Login):** Jeder mit dem Link kann alles sehen – laufenden Abend, Statistiken, Historie. Niedrige Hürde für Mitspieler:innen, die nur konsumieren wollen.
- **Individueller Login:** Nur eingeloggte Spieler:innen können Abende starten, Spiele erfassen und korrigieren. Nachvollziehbar wer was eingetragen oder geändert hat. Nicht jede:r Spieler:in muss einen Login haben.

### Duplikat-Schutz (V1):

Wenn ein:e Spieler:in ein Spiel speichert, das bereits von jemand anderem gespeichert wurde, erscheint ein Hinweis: „Dieses Spiel wurde bereits von [Name] gespeichert. Willst Du [Name]s Version ansehen, Deine Version speichern (überschreibt) oder Deine Notizen verwerfen?"

### Perspektivisch (kein aktueller Scope, aber im Design berücksichtigen):

- Öffnung für andere Doppelkopf-Gruppen mit eigenen Zählweisen
- Eigenes User-Management (Registrierung, Login)
- Mögliches Free/Pay-Modell
- Doko-Dating: Neue Runden kennenlernen, gruppenübergreifende Statistiken, Turniere
- Kollaboratives Schreiben (mehrere erfassen gemeinsam ein Spiel in Echtzeit)

### Konsequenz fürs Datenmodell:

Von Anfang an ein Konzept „Gruppe" im Schema anlegen, auch wenn V1 nur eine einzige Gruppe hat. Das kostet nichts extra und vermeidet späteres Re-Engineering.

---

## 4. Zählwerk und Abrechnungslogik

### Wichtige Abgrenzung

Die App muss **kein Doppelkopf spielen** und kennt keine Spielregeln (Trumpfreihenfolge, Stichregeln, Ansagefristen etc.). Die App muss nur das **Ergebnis korrekt verbuchen**. Dieser Abschnitt beschreibt ausschließlich, was für die Punkteberechnung relevant ist.

**Dieses Zählwerk wurde vollständig mit Robert (dem Schreiber der Runde) validiert – inkl. 15 Testfälle.**

### Zählrelevante Konfiguration (pro Gruppe)

Perspektivisch muss jede Gruppe folgendes konfigurieren können. In V1 sind Jans Werte hardcoded, aber das Datenmodell ist flexibel angelegt:

- Welche **Ansagen und Absagen** gibt es?
- Welche **Sonderpunkte** gibt es?
- Welche **Spieltypen** gibt es?
- Wie wird der **Spielwert berechnet**? (Berechnungsformel)

Kein Konfigurations-UI in V1 – nur das flexible Datenmodell.

### Spieltypen bei Jans Runde

**Normalspiel-Varianten (2 vs. 2):**

| Spieltyp  | Beschreibung                                                               | Erfassung                                    |
| --------- | -------------------------------------------------------------------------- | -------------------------------------------- |
| Normal    | Standard-Doppelkopf, Teams ergeben sich aus den Kreuz-Damen                | Wer ist Re, wer ist Kontra                   |
| Hochzeit  | Ein:e Spieler:in hat beide Kreuz-Damen und sucht eine:n Partner:in         | Wer hatte die Hochzeit, wer hat eingeheiratet |
| Armut     | Jemand hat ≤3 Trumpf, ein:e andere:r nimmt diese und gibt 3 Karten zurück | Wer ist Armut, wer ist Retter:in             |

**Solo-Varianten (1 vs. 3):**

| Solo-Typ     | Beschreibung                                                    | Erfassung                        |
| ------------ | --------------------------------------------------------------- | -------------------------------- |
| Fleischlos   | Keine Trümpfe außer den Dullen                                  | Wer spielt Solo                  |
| Buben-Solo   | Nur Buben sind Trumpf                                           | Wer spielt Solo                  |
| Damen-Solo   | Nur Damen sind Trumpf                                           | Wer spielt Solo                  |
| Farb-Solo    | Eine Farbe wird als Trumpf bestimmt (Karo, Herz, Pik oder Kreuz) | Wer spielt Solo + welche Farbe |
| Stilles Solo | Hochzeit verschwiegen – spielt still alleine (wie Farb-Solo Karo) | Wer spielt Solo                |

**Solo-Auswirkungen:**

- **Zählweise:** Solist:in bekommt den dreifachen Spielwert
- **Grundpunkt:** Solo bringt immer +1 als Grundpunkt (wie „gegen die Alten")
- **Rundenlänge:** Bei allen angesagten Solos (alles außer Stilles Solo) kommt der/die Solist:in selber raus und der/die Geber:in muss nochmal geben → die Runde wird um 1 Spiel verlängert
- **Stilles Solo:** Kein Neugeben, zählt als normales Spiel in der Rundenfolge

### Ansagen und Absagen bei Jans Runde

- **Re** – Das Re-Team sagt an, dass es gewinnt (verdoppelt den Spielwert)
- **Kontra** – Das Kontra-Team sagt an, dass es gewinnt (verdoppelt den Spielwert)
- **Absagen** (Verschärfungen): „Keine 90", „Keine 60", „Keine 30", „Schwarz"

**Wichtige Regeln:**

- Ansagen (Re/Kontra) und Absagen sind **unabhängig voneinander**. Man kann Absagen machen, ohne vorher Re oder Kontra angesagt zu haben. In dem Fall gibt es keine Verdopplung – die Absage bringt nur die zusätzlichen Grundpunkte wenn geschafft.
- **Absagen können übersprungen werden.** Man kann z.B. Re sagen und dann direkt „Keine 60" ohne „Keine 90" dazwischen. Dann gibt es den Sonderpunkt für „Keine 90 angesagt" nicht.
- Jede Kombination ist möglich – die App darf keine Reihenfolge erzwingen.
- **Gescheiterte Absagen führen zur Niederlage!** Wenn eine Absage nicht geschafft wird, verliert die ansagende Partei das Spiel – egal wie viele Augen sie hat. Die gescheiterte Absage wird als Grundpunkt für den Gegner gezählt. Die ansagende Partei wird für jede Ansage bestraft.

Erfasst wird: Welche Ansage/Absage von welchem/welcher Spieler:in. Ob das Ziel erreicht wurde, berechnet die App automatisch aus den Augen.

### Sonderpunkte bei Jans Runde

| Sonderpunkt       | Beschreibung                                                | Erfassung auf Spielerebene                | Mehrfach pro Spiel? |
| ----------------- | ----------------------------------------------------------- | ----------------------------------------- | ------------------- |
| Fuchs gefangen    | Karo-Ass des Gegners in einem beliebigen Stich gewonnen     | Wer hat gefangen, wer hat verloren        | Ja (bis zu 2)       |
| Karlchen gemacht  | Letzten Stich mit dem Kreuz-Buben gemacht                   | Wer hat es gemacht                        | Nein (1 letzter Stich) |
| Karlchen gefangen | Kreuz-Buben des Gegners im letzten Stich überstochen        | Wer hat gefangen, wer hat verloren        | Nein (1 letzter Stich) |
| Doppelkopf        | Stich mit 40+ Augen                                         | Wer hat den Stich gemacht                 | Ja (mehrere möglich) |

**Hinweis:** Karlchen gemacht und Karlchen gefangen können gleichzeitig auftreten – wenn ein Kreuz-Bube den letzten Stich macht und dabei den gegnerischen Kreuz-Buben übersticht.

**Sonderpunkte sind teamrelativ:** Eigene Sonderpunkte sind Plus, gegnerische sind Minus. Dadurch können Gewinner in Summe sogar Minuspunkte bekommen.

### Spielwert-Berechnung (Jans Runde) – validiert mit Robert

Die Berechnung erfolgt in drei Schritten:

**Schritt 1: Grundpunkte addieren**

Aus Sicht des Gewinners (wer der Gewinner ist, ergibt sich aus den Augen UND den Absagen – eine gescheiterte Absage kann den Gewinner zum Verlierer machen):

- Gewonnen: +1 (Ausnahme: Gespaltener Arsch – hier bekommt Kontra NICHT „Gewonnen", nur „Gegen die Alten")
- Gegen die Alten: +1 (nur wenn Kontra gegen Re gewinnt)
- Solo-Punkt: +1 (immer bei Solo)
- Keine 90 geschafft: +1
- Keine 90 angesagt und geschafft: +1
- Keine 60 geschafft: +1
- Keine 60 angesagt und geschafft: +1
- Keine 30 geschafft: +1
- Keine 30 angesagt und geschafft: +1
- Schwarz geschafft: +1
- Schwarz angesagt und geschafft: +1

**Gescheiterte Absagen:** Wenn eine Absage nicht erreicht wird, verliert die ansagende Partei. Die Grundpunkte drehen sich dann: Der Gegner bekommt Punkte für die gescheiterte Absage UND für den Sieg. Die ansagende Partei wird für jede Ansage bestraft.

**Gespaltener Arsch (genau 120:120):** Kontra gewinnt, bekommt aber nur „Gegen die Alten" (+1), NICHT „Gewonnen".

**Schritt 2: Verdopplung durch Ansagen**
- Re angesagt: ×2
- Kontra angesagt: ×2
- Beides angesagt: ×4
- **Nur Ansagen (Re/Kontra) verdoppeln!** Absagen allein (ohne Re/Kontra) führen NICHT zur Verdopplung.

**Schritt 3: Sonderpunkte addieren/abziehen**
Sonderpunkte kommen NACH der Verdopplung drauf:
- Eigene Sonderpunkte: +1 je Punkt
- Gegnerische Sonderpunkte: −1 je Punkt

**Spielwert verbuchen:**
- Gewinner-Team: +Spielwert pro Person
- Verlierer-Team: −Spielwert pro Person
- Bei Solo: Solist:in bekommt ×3, jeder Gegner ×1

### Was die App aus den erfassten Daten automatisch berechnet:

- Wer hat gewonnen (aus Augen + Absagen – gescheiterte Absage = Niederlage)
- Ob Ansagen/Absagen erreicht wurden (aus Augen)
- Den kompletten Spielwert (aus Grundpunkten + Verdopplung + Sonderpunkten)
- Die Punkte pro Spieler:in

### Was manuell erfasst werden muss:

- Wer ist in welcher Partei (Re/Kontra) – durch Antippen von zwei Spieler:innen die ein Team bilden
- Ob diese Partei Re oder Kontra ist
- Augen dieser Partei (egal welcher – die App rechnet die andere aus: 240 minus eingegebene Augen)
- Ansagen und Absagen (wer hat was gesagt)
- Sonderpunkte (wer hat was erzielt/verloren)
- Spieltyp-Besonderheiten (Hochzeit, Armut, Solo) durch Anpinnen an Spieler:innen

Hinweis: Der Spieltyp ergibt sich automatisch aus den Zuordnungen – kein separater „Spieltyp wählen"-Schritt nötig. Wenn niemand etwas Besonderes angepinnt bekommt, ist es ein Normalspiel.

### Referenz-Testfälle (validiert mit Robert)

Diese 15 Testfälle dienen als Referenz für die Implementierung der Punkteberechnung:

| Nr  | Beschreibung                       | Re Augen | Ansagen                              | Sonderpunkte                     | Re   | Kontra |
| --- | ---------------------------------- | -------- | ------------------------------------ | -------------------------------- | ---- | ------ |
| 1   | Einfachster Fall                   | 135      | –                                    | –                                | +1   | −1     |
| 2   | Re angesagt                        | 160      | Re                                   | –                                | +4   | −4     |
| 3   | Re + Kontra angesagt               | 145      | Re, Kontra                           | –                                | +4   | −4     |
| 4   | Kontra gewinnt                     | 110      | –                                    | –                                | −2   | +2     |
| 5   | Absage geschafft                   | 195      | Re, K90 (Re)                         | –                                | +8   | −8     |
| 6   | Absage gescheitert                 | 145      | Re, K90 (Re)                         | –                                | −8   | +8     |
| 7   | Re angesagt, Re verliert           | 115      | Re                                   | –                                | −4   | +4     |
| 8   | Kontra angesagt, Kontra verliert   | 155      | Kontra                               | –                                | +4   | −4     |
| 9   | Absage ohne Ansage                 | 175      | K90 (Re), kein Re!                   | –                                | +3   | −3     |
| 10  | Absage übersprungen                | 198      | Re, K60 (Re), K90 übersprungen       | –                                | +8   | −8     |
| 11  | Mehrere Absagen, eine gescheitert  | 170      | Re, K90 (Re), K60 (Re)              | –                                | −12  | +12    |
| 12  | Sonderpunkte nach Verdopplung      | 138      | Re, Kontra                           | Fuchs (Re), Doko (Kontra)        | +4   | −4     |
| 13  | Gewinner mit Minuspunkten          | 125      | –                                    | 2× Fuchs (Kontra), Doko (Kontra) | −2   | +2     |
| 14  | Solo (Buben, Solist 140 Augen)     | –        | –                                    | –                                | +6*  | −2     |
| 15  | Gespaltener Arsch + Karlchen (Re)  | 120      | –                                    | Karlchen (Re)                    | 0    | 0      |

*Testfall 14: Solist bekommt +6 (dreifach), jeder Gegner −2.
*Testfall 15: Gegen die Alten +1 für Kontra, Karlchen −1 für Kontra = netto 0 für beide.

---

## 5. Datenmodell

### Übersicht

Das Datenmodell besteht aus 11 Entitäten. Jede Entität bekommt eine eigene ID. Für jede Entität werden V1-Attribute (was jetzt gebraucht wird) und perspektivische Attribute (Ideensammlung für später) unterschieden.

### Hauptentitäten

**Spieler:in (Player)**

| Attribut            | V1 | Beschreibung                                                         |
| ------------------- | -- | -------------------------------------------------------------------- |
| ID                  | ✓  | Eindeutige Kennung                                                   |
| Spielername         | ✓  | Wie man am Tisch heißt („Robert", „Jan", ...)                        |
| Avatar-Bild         | ✓  | Profilbild – macht die UI persönlich und die Erfassung visuell schneller |
| E-Mail              | ✓  | Für Login (optional – nur für die, die erfassen wollen)              |
| Login/Passwort      | ✓  | Via Supabase Auth (optional)                                         |
| Registrierungsdatum | ✓  | Wann der App beigetreten                                             |
| Globalrolle         | ✓  | Super-Admin (für App-weite Verwaltung) oder Normal                   |
| Vorname, Nachname   | –  | Perspektive                                                          |
| Ort                 | –  | Perspektive (um Spieler:innen zusammenzubringen)                     |
| Steckbrief          | –  | Perspektive (Spielarten, Verfügbarkeit, ...)                         |

**Gruppe (Group)**

| Attribut       | V1 | Beschreibung                                                      |
| -------------- | -- | ----------------------------------------------------------------- |
| ID             | ✓  | Eindeutige Kennung                                                |
| Name           | ✓  | Name der Gruppe                                                   |
| Gründungsdatum | ✓  | Wann die Gruppe erstellt wurde                                    |
| Gruppenbild    | ✓  | Bild der Gruppe                                                   |
| Gruppen-Link   | ✓  | Öffentlicher Link für Nur-Lesen-Zugriff (Statistiken etc.)       |
| Zählregeln     | –  | Perspektive (Konfiguration pro Gruppe)                            |
| Offen für neue | –  | Perspektive                                                       |
| Termine, Orte  | –  | Perspektive                                                       |
| Beschreibung   | –  | Perspektive                                                       |

**Austragungsort (Venue)**

| Attribut        | V1 | Beschreibung                                                             |
| --------------- | -- | ------------------------------------------------------------------------ |
| ID              | ✓  | Eindeutige Kennung                                                       |
| Name            | ✓  | z.B. „Bei Robert", „Vereinsheim", ...                                    |
| Eigentümer:in   | ✓  | Spieler:in-ID (optional – wenn leer = öffentlich, wenn gesetzt = privat) |
| Adresse         | –  | Perspektive                                                              |
| Koordinaten     | –  | Perspektive (für Karte)                                                  |
| Hintergrundbild | –  | Perspektive (ortsspezifisches Bild für den Erfassungsscreen)             |

**Abend (Session)**

| Attribut          | V1 | Beschreibung                          |
| ----------------- | -- | ------------------------------------- |
| ID                | ✓  | Eindeutige Kennung                    |
| Gruppen-ID        | ✓  | Zu welcher Gruppe gehört dieser Abend |
| Datum             | ✓  | Wann fand der Abend statt             |
| Austragungsort-ID | ✓  | Wo fand der Abend statt               |
| Status            | ✓  | Laufend / Abgeschlossen               |

Hinweis: Die teilnehmenden Spieler:innen eines Abends werden NICHT am Abend gespeichert, sondern ergeben sich aus den Runden-Teilnahmen. Beim Aufsetzen eines Abends werden die Spieler:innen einmal ausgewählt und dann automatisch für jede neue Runde übernommen. Änderungen (jemand kommt dazu oder geht) sind nur zwischen Runden über ein separates Menü möglich – nicht im normalen Erfassungsflow. Zu- und Abgänge sowie die neue Sitzreihenfolge müssen bestätigt werden.

**Runde (Round)**

| Attribut        | V1 | Beschreibung                                       |
| --------------- | -- | -------------------------------------------------- |
| ID              | ✓  | Eindeutige Kennung                                 |
| Abend-ID        | ✓  | Zu welchem Abend gehört diese Runde                |
| Laufende Nummer | ✓  | Nummer innerhalb des Abends (1, 2, 3, ...)         |
| Status          | ✓  | Laufend / Abgeschlossen                             |

Eine Runde ist vollständig, wenn alle regulären Spiele (= Anzahl Spieler:innen) plus alle angesagten Solos gespielt wurden. Es darf keine unfertigen Runden geben (außer die aktuell laufende). Wird ein Abend abgeschlossen obwohl die letzte Runde unfertig ist, wird die unfertige Runde verworfen. Die App zeigt vorher einen Hinweis: „Die aktuelle Runde ist noch nicht abgeschlossen. Wenn Du den Abend jetzt beendest, wird die unfertige Runde nicht gespeichert."

**Spiel (Game)**

| Attribut              | V1 | Beschreibung                                                                  |
| --------------------- | -- | ----------------------------------------------------------------------------- |
| ID                    | ✓  | Eindeutige Kennung                                                            |
| Runden-ID             | ✓  | Zu welcher Runde gehört dieses Spiel                                          |
| Laufende Nummer       | ✓  | Nummer innerhalb der Runde (1, 2, 3, ...)                                     |
| Spieltyp              | ✓  | Normal / Hochzeit / Armut / Fleischlos / Buben-Solo / Damen-Solo / Farb-Solo / Stilles Solo |
| Farbe (bei Farb-Solo) | ✓  | Karo / Herz / Pik / Kreuz (nur bei Farb-Solo, sonst leer)                    |
| Augen Re-Partei       | ✓  | Augen der Re-Partei (Kontra = 240 minus Re). Re-Partei ist: bei Normalspiel das Team mit den Kreuz-Damen, bei Solo der/die Solist:in, bei Armut die Partei mit Armut + Retter:in, bei Hochzeit die Partei mit Hochzeiter:in + Eingeheiratet. In der UI kann man die Augen beliebiger Partei eingeben, gespeichert wird immer Re. Nur bei echter App-Erfassung gesetzt, nie zusammen mit augen_re_min/max. |
| Augen Re-Min          | ✓  | Untere Grenze der Re-Augen (Integer, nullable). Nur beim historischen Import gesetzt, nie zusammen mit augen_re. |
| Augen Re-Max          | ✓  | Obere Grenze der Re-Augen (Integer, nullable). Nur beim historischen Import gesetzt, nie zusammen mit augen_re. |
| Timestamp             | ✓  | Zeitstempel (für Spieldauer-Berechnung etc.)                                  |

Hinweis: Der Spielwert (Punkte) wird NICHT am Spiel gespeichert – er ergibt sich aus den Spielergebnissen (Maximum der positiven Zählpunkte).

Hinweis: Der Spieltyp ergibt sich in der Erfassungs-UI aus den Zuordnungen (Hochzeit/Armut/Solo an Spieler:innen pinnen). Kein separater Auswahl-Schritt. Normalspiel = nichts gepinnt.

Hinweis: `augen_re` und `augen_re_min`/`augen_re_max` schließen sich gegenseitig aus. Bei echter App-Erfassung wird nur `augen_re` gesetzt. Beim historischen Import (Roberts Büchlein, keine exakten Augenzahlen) wird stattdessen eine aus Spielwert + Ansagen/Absagen abgeleitete 29-Punkte-Range in `augen_re_min`/`augen_re_max` gespeichert (z.B. Keine 90 geschafft aber nicht Keine 60 → 151–180).

### Verknüpfungstabellen

**Gruppenmitgliedschaft (GroupMembership)**

| Attribut       | V1 | Beschreibung                                              |
| -------------- | -- | --------------------------------------------------------- |
| ID             | ✓  | Eindeutige Kennung                                        |
| Spieler:in-ID  | ✓  | Welche:r Spieler:in                                       |
| Gruppen-ID     | ✓  | Welche Gruppe                                             |
| Rolle          | ✓  | Admin / Schreiber:in / Leser:in (gruppenspezifisch)       |
| Eintrittsdatum | ✓  | Wann dieser Gruppe beigetreten                            |
| Spitzname      | –  | Perspektive (gruppenspezifischer Name)                    |

**Runden-Teilnahme (RoundParticipation)**

| Attribut      | V1 | Beschreibung                                                      |
| ------------- | -- | ----------------------------------------------------------------- |
| ID            | ✓  | Eindeutige Kennung                                                |
| Runden-ID     | ✓  | Welche Runde                                                      |
| Spieler:in-ID | ✓  | Welche:r Spieler:in                                               |
| Sitzposition  | ✓  | 1–7, wobei Position 1 = erste:r Geber:in der Runde               |

Aus der Sitzposition ergibt sich automatisch:
- Wer gibt bei welchem Spiel (Rotation)
- Wer sitzt aus:
  - Bei 4 Spieler:innen: niemand
  - Bei 5 Spieler:innen: der/die Geber:in
  - Bei 6 Spieler:innen: Geber:in und übernächste Position (1+3, 2+4, 3+5, ...)
  - Bei 7 Spieler:innen: Positionen 1+3+5, dann 2+4+6, etc. (gleichmäßig verteilt)
- Wer kommt raus (links vom/von der Geber:in)

**Spielergebnis (GameResult)**

| Attribut      | V1 | Beschreibung                                                                    |
| ------------- | -- | ------------------------------------------------------------------------------- |
| ID            | ✓  | Eindeutige Kennung                                                              |
| Spiel-ID      | ✓  | Welches Spiel                                                                   |
| Spieler:in-ID | ✓  | Welche:r Spieler:in                                                             |
| Partei        | ✓  | Re / Kontra / Ausgesetzt                                                        |
| Sonderrolle   | ✓  | Optional: Solist:in / Hochzeiter:in / Eingeheiratet / Armut / Retter:in         |
| Zählpunkte    | ✓  | +/− Punkte für diese:n Spieler:in (berechnet, aber gespeichert)                 |

**Ansage (Announcement)**

| Attribut      | V1 | Beschreibung                                                    |
| ------------- | -- | --------------------------------------------------------------- |
| ID            | ✓  | Eindeutige Kennung                                              |
| Spiel-ID      | ✓  | Welches Spiel                                                   |
| Spieler:in-ID | ✓  | Wer hat die Ansage gemacht                                      |
| Typ           | ✓  | Re / Kontra / Keine 90 / Keine 60 / Keine 30 / Schwarz         |

Ob die Ansage/Absage erreicht wurde, berechnet die App aus den Augen – wird nicht gespeichert.

**Sonderpunkt (SpecialPoint)**

| Attribut        | V1 | Beschreibung                                                                     |
| --------------- | -- | -------------------------------------------------------------------------------- |
| ID              | ✓  | Eindeutige Kennung                                                               |
| Spiel-ID        | ✓  | Welches Spiel                                                                    |
| Spieler:in-ID   | ✓  | Wer hat den Sonderpunkt erzielt                                                  |
| Typ             | ✓  | Fuchs gefangen / Karlchen gemacht / Karlchen gefangen / Doppelkopf               |
| Verlierer:in-ID | ✓  | Optional: Wem wurde er abgenommen (nur bei Fuchs gefangen und Karlchen gefangen) |

---

## 6. Erfassung (Eingabe-UI)

### Design-Prinzip: So wenig Klicks und so übersichtlich wie möglich

Die Erfassung erfolgt auf dem Smartphone, typischerweise durch eine:n eingeloggte:n Spieler:in (meist Robert, aber nicht eingeschränkt). An einem typischen Abend werden 16–30 Spiele erfasst. Die Erfassung muss so schnell sein, dass sie den Spielfluss nicht stört – bei einem einfachen Spiel wenige Sekunden, bei einem komplexen Spiel mit vielen Ansagen und Sonderpunkten immer noch unter einer halben Minute.

### Session-Start (einmal pro Abend):

1. **Anwesende Spieler:innen auswählen** aus dem Gruppen-Pool
2. **Sitzreihenfolge festlegen** und erste:n Geber:in bestimmen
3. **Austragungsort wählen** (aus bekannten Orten oder neuen anlegen)
4. Erste Runde startet automatisch

### Spiel-Erfassung: Mitlaufendes Protokoll

Die Erfassung ist kein Zwei-Phasen-Modell, sondern ein **einziger fließender Flow**. Man kann jederzeit Dinge eintragen, sobald sie passieren – muss aber nicht. Es gibt keinen erzwungenen Bruch zwischen „während des Spiels" und „nach dem Spiel".

**Alles kann jederzeit, in beliebiger Reihenfolge an Spieler:innen angepinnt werden:**
- Ansagen und Absagen
- Sonderpunkte (bei Fuchs/Karlchen gefangen: gleich abfragen wem er abgenommen wurde)
- Spieltyp-Besonderheiten (Hochzeit, Armut, Solo) – der Spieltyp ergibt sich automatisch aus dem was gepinnt wird. Normalspiel = nichts Besonderes gepinnt.
- Partei-Zuordnung (zwei Spieler:innen als Team markieren + Re oder Kontra)
- Augen einer Partei

**Mindestanforderung für die Bestätigung:**
Der „Bestätigen"-Button wird erst aktiv, wenn die Mindestinfos da sind:
- Teams zugeordnet (wer ist Re, wer ist Kontra)
- Augen eingegeben

Alles andere (Ansagen, Sonderpunkte, Spieltyp) ist optional – ein Normalspiel ohne Ansagen und Sonderpunkte braucht nur Team + Augen.

**Bestätigung:**
- Übersicht mit vollständiger Bewertung des Spiels (automatisch berechnet)
- Wenn alles ok → Bestätigen → nächstes Spiel
- Wenn etwas falsch → zurück und korrigieren

**Konkrete UI-Gestaltung** (Buttons vs. Popups, Layout, Tischplatten-Ansicht, Dealer-Button etc.) wird beim Prototyping in Phase 2 entschieden. Die Direktive ist: So wenig Klicks und so übersichtlich wie möglich.

### Runden-Logik:

- Die App weiß, wie viele Spiele eine Runde hat (Anzahl Spieler:innen + angesagte Solos)
- Nach dem letzten Spiel einer Runde wird diese automatisch abgeschlossen
- **Runden-Übergang:** Hinweis „Runde X beendet!", aktuelle Punktetabelle (Rangliste des Abends) anzeigen, Optionen „Nächste Runde starten" oder „Abend beenden"
- Bei einem angesagten Solo (außer Still): Runde verlängert sich um 1 Spiel

### Optimierungen für Geschwindigkeit:

- Spieler:innen-Namen mit **Avatar als Tap-Buttons**
- **Sinnvolle Defaults:** Normalspiel vorausgewählt (= nichts gepinnt), keine Ansagen vorausgewählt
- **Aussetzer automatisch rotieren** (aus Sitzreihenfolge berechenbar)
- Nur mitspielende Spieler:innen aktiv angezeigt, aussetzende ausgegraut oder ausgeblendet

### Korrektur:

- Letztes Spiel muss einfach **editierbar** und **löschbar** sein
- Auch ältere Spiele eines Abends müssen korrigierbar sein
- Nur eingeloggte Spieler:innen können korrigieren

### Spieler:innen-Wechsel am Abend (Edge Case):

Über ein separates Menü (nicht im normalen Erfassungsflow) kann ein:e eingeloggte:r Spieler:in die Spieler:innen-Konstellation **ab der nächsten Runde** ändern:
- Spieler:in kommt dazu → zur Teilnehmerliste hinzufügen
- Spieler:in geht → aus der Teilnehmerliste entfernen
- Die laufende Runde bleibt unberührt und wird in der ursprünglichen Konstellation fertig gespielt
- Neue Sitzreihenfolge und Zu-/Abgänge müssen bestätigt werden

---

## 7. Auswertungen und Statistiken

### Grundprinzip

Alles auswerten, was die Daten hergeben. Die Runde ist statistik-verrückt. Die Datenerfassung ist von Anfang an granular genug, um auch später noch neue Auswertungen zu ermöglichen, ohne das Datenmodell zu ändern. Welche Stats prominent angezeigt, welche hinter einem „Nerd-Modus" versteckt und welche erst später gebaut werden, ist eine UI-Entscheidung bei der Implementierung. Die Daten sind vollständig – dieser Abschnitt beschreibt was wir **anzeigen**, nicht was wir erfassen.

### Zeiträume

Alle Auswertungen sind filterbar nach:
- **Total** (über alle Daten)
- **Kalenderjahr** (inkl. laufendes Jahr)

**Perspektive:** Quartale, Monate, benutzerdefinierte Zeiträume.

### Normierung

Wo absolute Zahlen durch unterschiedliche Teilnahme verzerrt werden (z.B. Gesamtpunktestand), werden Durchschnittswerte pro Spiel, pro Runde oder **pro 4 Runden** (als normierter Standard-Abend) ausgewiesen. 4 Runden ist der Referenzwert, da dies einer typischen/turniermäßigen Abendlänge entspricht. In V1 hardcoded auf 4, perspektivisch pro Gruppe konfigurierbar.

### Statistik-Kategorien

#### 1. Gesamtscore (Königskennzahl)

Die prominenteste Zahl – belohnt die Kombination aus Leistung und Ausdauer. Wird als erstes angezeigt, ist aber eigentlich die am wenigsten aussagekräftige Kennzahl, da sie durch häufige Teilnahme allein steigen kann.

- Gesamtpunktestand (Rangliste)
- Punkteverlauf über Zeit (Chart)

#### 2. Leistung – Wie gut spiele ich?

Auf jeder Ebene (Spiel / Runde / Abend):
- Siegquote
- Bester Score
- Schlechtester Score (Negativrekorde sind auch interessant!)
- Durchschnittsscore
- Längste Siegserie
- Längste Niederlagenserie

Hinweis zu Streaks: Werden pro Spieler:in über Abende hinweg berechnet. Abwesenheit unterbricht einen Streak nicht – nur eine Niederlage (bzw. das Gegenteil des Streak-Kriteriums) bricht ihn.

#### 3. Ausdauer / Engagement – Wie viel spiele ich?

- Anzahl Spiele / Runden / Abende
- Gewonnen / Verloren (absolute Zahlen)
- Anteil an Gesamtabenden (Teilnahmequote)
- Perspektive: Spielstunden (aus Timestamps ableitbar)

#### 4. Risikofreude – Ansagen

- Ansagenhäufigkeit total und je Typ (Re, Kontra, Keine 90, Keine 60, Keine 30, Schwarz)
- Davon gewonnen / Gewinnquote (total und je Typ)
- Durchschnittliche Ansagen pro Spiel und pro Runde (total und je Typ)
- Perspektive: Aufschlüsselung ob Absagen als Re-, Kontra- oder Solo-Spieler:in gemacht wurden

#### 5. Einzelkämpfer – Solos

- Solos total und je Typ (Fleischlos, Buben-Solo, Damen-Solo, Farb-Solo, Stilles Solo)
- Gewonnen / Verloren / Gewinnquote (total und je Typ)
- Durchschnitt Solos pro Runde
- Durchschnittlicher Punkteertrag pro Solo
- Solo-Anteil (wie viel Prozent meiner Spiele sind Solos)
- Perspektive: Farb-Solo Aufschlüsselung nach Farbe

#### 6. Sonderpunkte & Sonderspiele

**Sonderpunkte:**
- Karlchen gemacht / Karlchen gefangen / Karlchen verloren – absolut und pro 4 Runden (Karlchen ist die echte Skill-Kennzahl bei den Sonderpunkten)
- Doppelkopf – absolut und pro 4 Runden
- Fuchs gefangen / Fuchs verloren – absolut und pro 4 Runden
- Sonderpunkte-Bilanz (gefangen minus verloren – wer hat netto die meisten?)

**Sonderspiele:**
- Hochzeit: Häufigkeit, davon als Hochzeiter:in / Eingeheiratet
- Armut: Häufigkeit, davon als Armut / Retter:in
- Gespaltener Arsch: Wie oft als glückliche:r Gewinner:in / unglückliche:r Verlierer:in

Alle jeweils absolut und pro 4 Runden.

### Perspektive (nicht V1):

- **Head-to-Head:** Bilanz Spieler:in A vs. Spieler:in B
- **Ortsstatistik:** Wo gewinnt wer am meisten?
- **Fun Stats / Rekorde:** Sammelkategorie für alles Kuriose
- **Gruppenübergreifende Statistiken:** Wenn die App für mehrere Gruppen offen ist

---

## 8. Tech-Stack

| Was               | Entscheidung              | Warum                                                        |
| ----------------- | ------------------------- | ------------------------------------------------------------ |
| Typ               | Web-App (PWA)             | Apple + Android, kein App Store nötig, auf Homescreen installierbar |
| Frontend          | React                     | Meistgenutztes Framework, großes Ökosystem, hoher Lernwert   |
| Styling           | Tailwind CSS + shadcn/ui  | Schnell professionelle UI, individualisierbar (Code wird ins Projekt kopiert, kein Lock-in), Jan kann sich auf Logik statt Pixel-Schubserei konzentrieren |
| Backend / DB      | Supabase (BaaS)           | Echte PostgreSQL-DB mit direktem SQL-Zugang, fertige Auth & API, großzügiges Free Tier, Open Source, kein Lock-in |
| Datenbank         | PostgreSQL (via Supabase) | Industriestandard, relationale DB ideal für Doko-Datenstruktur, SQL als Lernziel |
| Hosting Frontend  | Vercel                    | Kostenlos, automatisches Deployment bei Git-Push, einfachstes Setup für React-Apps. US-Firma, aber Frontend enthält keine personenbezogenen Daten. Bei Bedarf später zu EU-Hoster wechselbar. |
| Versionskontrolle | Git + GitHub              | Standard-Workflow, Backup in der Cloud                       |
| State Management  | React Context + Supabase  | React Context für lokalen UI-Zustand (laufende Erfassung), Supabase als Single Source of Truth für alles Persistente |
| Charts            | Recharts                  | React-nativ, gut dokumentiert, funktioniert gut mit shadcn/ui |

### Bewusste Entscheidung für Supabase (Weg 2: Frontend + BaaS):

- **Echte PostgreSQL-Datenbank** mit direktem SQL-Zugang und Web-Konsole → maximaler Lernwert für Jans Fokus-Thema Datenbank-Design
- **Fertige Auth, API, Realtime** → kein eigener Server nötig
- **Open Source, kein Lock-in** → kann theoretisch selbst gehostet werden
- **Großzügiges Free Tier** → reicht für Jans Runde und darüber hinaus
- **Skaliert** → User-Management, Row Level Security und Edge Functions wachsen mit, wenn die App für andere Gruppen geöffnet wird. Kein Re-Engineering nötig.

### Bewusste Entscheidung gegen Alternativen:

- **Firebase (Google):** NoSQL-Datenbank (Firestore), schlecht für relationale Doko-Daten und komplexe SQL-Auswertungen. Proprietäre Syntax statt Standard-SQL.
- **Appwrite:** Jünger, kleineres Ökosystem, kein direkter SQL-Zugang.
- **PocketBase:** Self-Hosting nötig, weniger Features.
- **Eigenes Backend (Weg 1: React + Node.js + PostgreSQL):** Zu viel Overhead für V1 (drei Projekte in einem). Kann später bei Bedarf ergänzt werden – Supabase ist keine Sackgasse.

---

## 9. Architektur-Überblick

```
┌─────────────────────────────────────┐
│          React Frontend             │
│  (PWA, läuft im Browser/Homescreen) │
│                                     │
│  ┌───────────┐  ┌────────────────┐  │
│  │ Erfassung │  │  Statistiken   │  │
│  │    UI      │  │  & Dashboards  │  │
│  └───────────┘  └────────────────┘  │
└──────────────┬──────────────────────┘
               │ Supabase Client SDK
               ▼
┌─────────────────────────────────────┐
│           Supabase                  │
│                                     │
│  ┌──────────┐  ┌────────────────┐   │
│  │   Auth   │  │  PostgreSQL    │   │
│  │ (Login)  │  │  (Datenbank)   │   │
│  └──────────┘  └────────────────┘   │
│  ┌──────────┐  ┌────────────────┐   │
│  │ Realtime │  │  Row Level     │   │
│  │  (Sync)  │  │  Security      │   │
│  └──────────┘  └────────────────┘   │
└─────────────────────────────────────┘
```

### Was Supabase liefert (muss nicht selbst gebaut werden):

- **PostgreSQL-Datenbank** mit Web-UI und SQL-Konsole
- **Auto-generierte REST-API** aus dem Datenbankschema
- **Auth** – User-Management, Login, Registrierung
- **Realtime** – Echtzeit-Updates (wenn Robert ein Spiel einträgt, sehen die anderen es sofort)
- **Row Level Security** – Zugriffsregeln auf Datenbankebene (Gruppe sieht nur eigene Daten)
- **Edge Functions** – kleine Server-Logik-Häppchen, falls später nötig

### Was selbst gebaut wird:

- **React Frontend** – die gesamte Benutzeroberfläche (Erfassung, Statistiken, Navigation)
- **Datenbank-Schema** – Tabellen, Beziehungen, Indizes
- **SQL-Queries** – für die komplexen Statistik-Auswertungen
- **Spielwert-Berechnung** – Logik zur automatischen Berechnung der Punkte (validiert mit 15 Testfällen)

---

## 10. Authentifizierung und Zugang

### V1: Hybrid-Modell

- **Gruppen-Link (ohne Login):** Jeder mit dem Link kann alles sehen – laufenden Abend, Statistiken, Historie. Niedrige Hürde für Mitspieler:innen.
- **Individueller Login (via Supabase Auth):** Nur eingeloggte Spieler:innen können Abende starten, Spiele erfassen und korrigieren. Nachvollziehbar wer was gemacht hat.
- Nicht jede:r Spieler:in muss einen Login haben – man existiert als Spieler:in in der Datenbank (für Statistiken) auch ohne Login.

### Rollen:

**Globalrolle (am/an der Spieler:in):**
- Super-Admin: Zugriff auf alles, technische Verwaltung der gesamten App

**Gruppenspezifische Rollen (an der Gruppenmitgliedschaft):**
- Admin: Kann Gruppe konfigurieren, Spieler:innen einladen/entfernen
- Schreiber:in: Kann Abende starten, Spiele erfassen und korrigieren
- Leser:in: Kann nur Statistiken sehen

Ein:e Spieler:in kann in verschiedenen Gruppen verschiedene Rollen haben.

### Perspektivisch:

- Jede:r Spieler:in hat einen eigenen Account
- Registrierung und Login für alle

---

## 11. PWA (Progressive Web App)

Die App soll als PWA funktionieren, damit sie auf dem Homescreen installiert werden kann und sich wie eine native App anfühlt:

- **Installierbar:** „Zum Startbildschirm hinzufügen" auf iOS und Android
- **Responsive:** Optimiert für Smartphone-Nutzung, funktioniert aber auch auf Tablet/Desktop

### Offline-Verhalten (V1):

- **Kein Internet → Warnung anzeigen**, keine neuen Eingaben möglich
- Was schon geladen ist (Statistiken, laufender Abend) **bleibt sichtbar**
- **Noch nicht gespeichertes Spiel** (halb erfasst) wird lokal gehalten und gespeichert sobald die Verbindung wieder da ist – **kein Datenverlust**
- Bereits gespeicherte Spiele sind sicher in Supabase
- **Keine volle Offline-Erfassung** in V1 (also nicht mehrere Spiele ohne Verbindung erfassen und später synchronisieren – das wäre ein eigenes Teilprojekt)

---

## 12. Nicht-funktionale Anforderungen

- **Performance:** Erfassung muss den Spielfluss nicht stören – bei einfachen Spielen wenige Sekunden, bei komplexen unter 30 Sekunden. Statistik-Laden < 2 Sekunden.
- **Mobile-first:** Primäre Nutzung auf Smartphones
- **Verfügbarkeit:** Supabase Free Tier ist ausreichend (keine SLA nötig)
- **Datensicherung:** Supabase macht automatische Backups; zusätzlich Export-Funktion (CSV/JSON) einplanen
- **Sprache:** App auf Deutsch, Code-Bezeichnungen auf Englisch, Kommentare auf Deutsch

---

## 13. Roadmap

### Phase 1: Fundament (Setup + Datenbank + Grundgerüst)

1. **Entwicklungsumgebung einrichten:**
   - Node.js und npm installieren
   - React-Projekt erstellen
   - Tailwind CSS + shadcn/ui einrichten
   - Git-Repository auf GitHub erstellen, CLAUDE.md reinlegen
2. **Cloud-Dienste einrichten:**
   - Supabase Account + Projekt erstellen (Region: EU/Frankfurt)
   - Vercel Account erstellen + mit GitHub verbinden
   - Erstes Deployment: leere App live auf Vercel (damit die Pipeline steht)
3. **Datenbank-Schema** gemeinsam entwerfen und in Supabase anlegen
4. **Design-Grundlagen:** Farben, Schriften, generelles Look & Feel definieren
5. **Basis-Frontend:** Navigation, Seitenstruktur
6. Spieler:innen und Gruppe anlegen (Seed-Daten für Jans Runde)

### Phase 2: Erfassung

7. Abend starten (Datum, Austragungsort, anwesende Spieler:innen aus Pool wählen, Sitzreihenfolge)
8. Runden-Logik (automatische Verwaltung, Rotation, Aussetzer-Berechnung, Verlängerung bei Solo)
9. Einzelspiel erfassen (mitlaufendes Protokoll: Ansagen, Sonderpunkte, Spieltyp-Besonderheiten, Parteien, Augen). UI-Gestaltung (Tischplatten-Ansicht? Buttons vs. Popups? Dealer-Button?) wird beim Prototyping hier entschieden.
10. Spielwert automatisch berechnen (Jans Regeln hardcoded, validiert gegen 15 Testfälle)
11. Bestätigung mit Übersicht und Duplikat-Schutz
12. Korrektur/Löschen von Spielen
13. Laufende Punktetabelle pro Abend und pro Runde
14. Runden-Übergang (Hinweis, Punktetabelle, Optionen)

### Phase 3: App einsatzbereit machen

15. PWA-Setup (Installierbar, Offline-Warnung, Datenverlust-Schutz)
16. Responsive Design Feinschliff

**→ Ab hier kann die App das Büchlein ersetzen!**

### Phase 4: Statistiken (Basis)

17. Gesamtscore / Rangliste
18. Leistung (Siegquoten, Durchschnitte, Streaks – auf allen drei Ebenen)
19. Ausdauer / Engagement (Teilnahme, Anwesenheitsquote)
20. Zeitraum-Filter (Total, Kalenderjahr)

### Phase 5: Statistiken (Erweitert)

21. Risikofreude (Ansagen-Statistiken)
22. Einzelkämpfer (Solo-Statistiken)
23. Sonderpunkte & Sonderspiele
24. Normierung auf pro 4 Runden

### Phase 6: Extras

25. Export-Funktion (CSV/JSON)
26. Realtime-Updates (Supabase Realtime)

### Historische Daten (parallel ab Phase 2):

27. **Excel-Import (2024):** Import-Script für die vorhandene Excel-Datei. Daten sind nicht vollständig kompatibel mit dem neuen Datenmodell – fehlende Details bleiben leer.
28. **Foto-Workflow (2025/2026, ggf. älter):** Fotos von Roberts handgeschriebenen Zetteln im Chat-Dialog transkribieren, in CSVs übersetzen, dann in die Datenbank importieren. Separates Chat-Projekt, unabhängig von der App-Entwicklung. Kann starten sobald das Datenmodell steht.
29. **CSV-Import in der App:** Feature zum Importieren der erstellten CSVs.

### Irgendwann / kein fester Zeitpunkt:

- Öffnung für andere Gruppen (Multi-Tenancy, Regelkonfiguration, Konfigurations-UI)
- Echtes User-Management für alle Spieler:innen
- Free/Pay-Modell (Stripe-Integration)
- Notifications
- Sichtbarkeitslogik für Austragungsorte (öffentlich/privat)
- Head-to-Head Statistiken
- Ortsstatistik
- Fun Stats / Rekorde
- Ortsspezifische Hintergrundbilder für den Erfassungsscreen
- Doko-Dating, gruppenübergreifende Statistiken, Turniere
- Volle Offline-Erfassung mit Sync
- Kollaboratives Schreiben (mehrere erfassen gemeinsam ein Spiel in Echtzeit)

---

## 14. Nicht tun

- Keine Änderungen ohne vorherige Erklärung und Bestätigung durch Jan
- Keine unnötig komplexen Patterns einführen
- Keine stillen Architekturwechsel
- Keine Abkürzungen ohne Erklärung
- Keine externen Dependencies ohne triftigen Grund und Erklärung
- Keine Over-Engineering für Features, die erst „irgendwann" kommen
- Nicht die Erfassung zugunsten der Statistik vernachlässigen – die Eingabe-UX ist erfolgskritisch
- Keine Annahmen über Doppelkopf-Regeln treffen, ohne mit Jan abzustimmen
- Nichts dazuerfinden, was Jan nicht explizit gesagt hat

---

## 15. Glossar

| Begriff                     | Bedeutung                                                                 |
| --------------------------- | ------------------------------------------------------------------------- |
| **Abend (Session)**         | Ein Treffen der Gruppe, typischerweise 3–6 Runden (16–30 Spiele).        |
| **Absage**                  | Verschärfung: Keine 90, Keine 60, Keine 30, Schwarz. Kann ohne Ansage gemacht werden und kann übersprungen werden. Führt NICHT zur Verdopplung. Gescheiterte Absage = Niederlage für die ansagende Partei, egal wie viele Augen. |
| **Anpinnen**                | Erfassungsmethode: Ansagen, Sonderpunkte und Spieltyp-Besonderheiten werden an Spieler:innen „angepinnt" – in beliebiger Reihenfolge, jederzeit während oder nach dem Spiel. |
| **Ansage**                  | Re oder Kontra ansagen – verdoppelt den Spielwert. Unabhängig von Absagen. |
| **Armut**                   | Ein:e Spieler:in hat ≤3 Trumpf und gibt sie an eine:n andere:n ab. Erfasst: wer ist Armut, wer ist Retter:in. |
| **Attribut**                | Eine Eigenschaft einer Entität, gespeichert als Spalte in der Tabelle (z.B. Name, Datum). |
| **BaaS**                    | Backend as a Service – fertiges Backend aus der Cloud (hier: Supabase). Liefert Datenbank, API, Auth und Realtime, ohne dass man einen eigenen Server betreiben muss. |
| **Beziehung**               | Wie Tabellen zusammenhängen (z.B. „ein Spiel gehört zu einer Runde"). |
| **Doppelkopf**              | Ein Stich mit 40 oder mehr Augen. Mehrere pro Spiel möglich.             |
| **Entität**                 | Ein „Ding" das in der Datenbank als eigene Tabelle gespeichert wird (z.B. Spieler:in, Spiel, Abend). |
| **Fremdschlüssel**          | Ein Feld das auf die ID einer anderen Tabelle zeigt und so die Beziehung herstellt. |
| **Fuchs gefangen**          | Karo-Ass des Gegners in einem beliebigen Stich gewonnen. Erfasst: wer hat gefangen, wer hat verloren. Bis zu 2 pro Spiel möglich. |
| **Geber:in**                | Wer die Karten gibt. Rotiert nach Sitzposition. Bei 5+ Spieler:innen sitzt der/die Geber:in aus. |
| **Gespaltener Arsch**       | Genau 120:120 Augen. Kontra gewinnt, bekommt aber nur „Gegen die Alten" (+1), NICHT „Gewonnen". |
| **Gruppe (Group)**          | Der Spieler:innen-Pool der zusammen gehört. In V1 nur Jans Runde, perspektivisch mehrere. |
| **Hochzeit**                | Ein:e Spieler:in hat beide Kreuz-Damen und sucht eine:n Partner:in. Erfasst: wer hatte die Hochzeit (Hochzeiter:in), wer hat eingeheiratet. |
| **Karlchen**                | Kreuz-Bube – „gemacht" wenn er den letzten Stich macht, „gefangen" wenn er dabei überstochen wird. Beides kann gleichzeitig auftreten. Die Skill-Kennzahl unter den Sonderpunkten. |
| **Kontra**                  | Das gegnerische Team. Gewinnt bei 120:120 („Gespaltener Arsch"), bekommt dann aber nur „Gegen die Alten", nicht „Gewonnen". |
| **n:m-Beziehung**           | Viele-zu-viele: Ein:e Spieler:in kann in mehreren Gruppen sein, eine Gruppe kann viele Spieler:innen haben. Wird über eine Verknüpfungstabelle aufgelöst. |
| **Normierung**              | Statistik-Werte umgerechnet auf „pro 4 Runden" (Standard-Abend) oder „pro mitgespieltem Spiel", um unterschiedliche Anwesenheit auszugleichen. |
| **PostgreSQL**              | Relationale Datenbank, Industriestandard. Die Daten werden in Tabellen mit Beziehungen gespeichert. Abfragesprache: SQL. |
| **Pro 4 Runden**            | Normierungseinheit für Durchschnittswerte. 4 Runden entsprechen einem typischen/turniermäßigen Abend. Vermeidet sehr kleine Dezimalwerte die bei „pro Spiel" entstehen würden. |
| **PWA**                     | Progressive Web App – Web-App die sich wie eine native App installieren lässt. Kein App Store nötig, funktioniert über den Browser. Man kann sie auf dem Homescreen installieren. |
| **Re**                      | Das Team, das die Kreuz-Damen hält (oder der/die Solist:in). Braucht 121 Augen zum Sieg. |
| **React**                   | JavaScript-Framework für Benutzeroberflächen. Das meistgenutzte Frontend-Framework. |
| **React Context**           | Mechanismus in React um Daten zwischen Komponenten zu teilen, ohne sie durch jede Ebene durchreichen zu müssen. Wird für den lokalen UI-Zustand verwendet (z.B. laufende Erfassung). |
| **Recharts**                | React-native Chart-Bibliothek für Diagramme und Graphen. Wird für die Statistik-Visualisierungen verwendet. |
| **Retter:in**               | Die Person, die bei einer Armut die Trümpfe nimmt und Karten zurückgibt. |
| **Row Level Security**      | Zugriffsregeln direkt in der Datenbank (wer darf welche Zeilen sehen). Supabase-Feature. |
| **Runde (Round)**           | Jede:r hat einmal gegeben. Bei 4 Spieler:innen = 4 Spiele + angesagte Solos, bei 5 = 5 + Solos. Muss immer vollständig abgeschlossen werden. |
| **Seed-Daten**              | Vorbefüllte Daten in der Datenbank (z.B. Jans Spieler:innen, Sonderpunkt-Typen, die eine V1-Gruppe). |
| **shadcn/ui**               | Sammlung fertiger UI-Komponenten (Buttons, Tabellen, Dialoge etc.) die als Code ins Projekt kopiert werden. Individualisierbar, kein Lock-in. |
| **Sitzposition**            | Feste Position am Tisch (1–7), bestimmt Geber-Rotation und Aussetzer. Position 1 = erste:r Geber:in der Runde. |
| **Solo**                    | Ein:e Spieler:in spielt alleine gegen die anderen drei. Typen: Fleischlos, Buben-Solo, Damen-Solo, Farb-Solo (mit Farbwahl), Stilles Solo. Solist:in bekommt dreifachen Spielwert. Bringt immer +1 Solo-Punkt als Grundpunkt. Angesagte Solos (außer Still) verlängern die Runde um 1 Spiel. |
| **Spiel (Game)**            | Eine einzelne Partie Doppelkopf (12 Stiche, dann wird neu gegeben).       |
| **Spieler:in (Player)**     | Eine Person in der App. Kann in mehreren Gruppen sein.                    |
| **Spielwert**               | Die Punkte, die für ein einzelnes Spiel vergeben werden. Wird nicht manuell erfasst, sondern automatisch berechnet aus: Grundpunkte → Verdopplung durch Ansagen → Sonderpunkte. Pro Spieler:in als Zählpunkte im Spielergebnis gespeichert. |
| **SQL**                     | Structured Query Language – die Sprache, mit der man Datenbanken abfragt. Jans Lernziel. |
| **Streak**                  | Serie aufeinanderfolgender Siege (oder anderer Kriterien). Wird über Abende hinweg gezählt, Abwesenheit unterbricht nicht. Nur eine Niederlage bricht den Streak. Gibt es auf allen drei Ebenen (Spiel, Runde, Abend). |
| **Supabase**                | Open-Source BaaS mit PostgreSQL-Datenbank, Auth, Realtime und API. Die Backend-Lösung für die Doko-App. |
| **Tailwind CSS**            | Styling-Framework – man schreibt vordefinierte Klassen direkt an die HTML-Elemente statt eigene CSS-Dateien. Gibt ein konsistentes Design-System vor. |
| **Vercel**                  | Hosting-Dienst für Frontend-Apps. Automatisches Deployment bei Git-Push. Kostenlos für kleine Projekte. |
| **Verknüpfungstabelle**     | Eine Tabelle die zwei andere Tabellen verbindet (z.B. Gruppenmitgliedschaft verbindet Spieler:in und Gruppe). Löst n:m-Beziehungen auf. |
