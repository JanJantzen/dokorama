# ROBERT_IMPORT.md – Gedächtnis für den Foto-Import aus Roberts Büchlein

> Diese Datei ist das Gedächtnis für Claude beim Transkribieren von Roberts handgeschriebenen
> Spielabenden in das Dokorama-Import-JSON-Format.
> Sie wird zu Beginn jedes Import-Chats gelesen und nach jedem Abend aktualisiert.
> Letzte Aktualisierung: 23. Juni 2026 – fünfter Abend (22.4.2026, 19 Spiele/4 Runden, 4 Spieler:innen
> So/Da/Ja/Ro) vollständig abgeschlossen. Wichtigste neue Learnings dieses Abends: **Anker-Methode bei
> unleserlichen Blöcken** – wenn ein Block (hier R4) zu dicht geschrieben ist, NICHT raten: Endstand
> des Abends + zwei sauber vorgelesene durchlaufende Spalten (hier Ja und Ro) zwingen die beiden
> übrigen Spalten und jede Zeile rechnerisch eindeutig (Nullsumme je Zeile + Solo-Bedingung). Damit
> wird jede Zeile *verifiziert* statt geraten. **Kürzel-Zuordnung im engen Block über die Zahl-Position,
> nicht die optische Zeile**: Sophias „RDK" schien zur w=1-Zeile zu gehören, gehörte aber zur Solo-Zeile
> darüber (So-Stand 9) – erst der Wert-Gegencheck (RDK passt nur zum Bubensolo, nicht zu Wert 1) deckte
> es auf. **Doppelfuchs als exakter Null-Spiel-Ausgleich**: F+F+ (+2 fürs Fänger-Team) gleicht einen
> Grundpunkt-Sieg von genau 2 (Gewonnen + Gegen die Alten) exakt auf 0 aus – klassische Null-Spiel-
> Mechanik ohne jede Augen-Sonderregel. **Bubensolo mit Ansage + Sonderpunkt**: einfacher Wert 9 =
> (Gewonnen + K90 + K60 + K30 geschafft = 4) × 2 (Re angesagt) + 1 (Doppelkopf); Sp zeigt 3×9 = „27 BS".
> Keine Robert-Fehler an diesem Abend (Endstand deckt sich exakt). Frühere Kern-Learnings unverändert gültig: **NIE eine
> mathematisch erzwungene Ansage als Antwort akzeptieren** – wenn ein Wert nur mit einer Re/Kontra-
> Ansage aufgeht, ist das ein Alarmsignal für „genau hinschauen", kein Beweis, dass die Ansage da ist;
> bei Verdacht sofort in der Ersterfassung mit ⚠️ einhaken, nicht erst am Schluss. **Roberts eigene
> Fehler** treten in zwei Spielarten auf: (a) Personen-Vertauschung zwischen zwei Spielenden bei
> gleichem Betrag (R1·S3, Re/Kontra-Konstellation falsch zugeordnet), (b) kompletter Wert-Fehler,
> bei dem der ganze Folge-Verlauf zu niedrig weitergeschrieben wurde (R4·S1, Wert 3 statt 6) – beide
> Fehlertypen sind über die Quersumme NICHT erkennbar (die geht in Roberts Buch immer auf), sondern
> nur über die Spiellogik-Rückrechnung. Weitere Learnings: systematischer Ansagen-Audit per Skript
> (für jedes Spiel prüfen: hart gelesen / einzige mathematische Lösung / echte Mehrdeutigkeit – nur
> die letzte Kategorie braucht Rückfrage), Doppelfuchs-Fänger/Verlierer können in der ersten Lesung
> vertauscht werden, explizite Verneinungen („keine Ansagen") sind harte Fakten und schließen Fälle
> ab.
>
> *(Vorherige Abende: 27.5., 29.4., 3.6., 10.6. – siehe Abschnitt 9. Kern-Learnings von 3.6.: Spielwert
> „richtig herum", 3-gegen-1-Regel, dreistufige Korrektur-Gegenprüfung, 7↔1, Linien-Inventur,
> Unterstrichen=Re-Team. Kern-Learnings von 10.6. (5-Spieler-Logik): siehe Abschnitt 1d.
> Kern-Learnings von 22.4. (Anker-Methode, Doppelfuchs-Nullspiel, Bubensolo-Wert): siehe Abschnitt 1e.)*

---

## 1. Struktur von Roberts Büchlein

### Tabellenaufbau

- Jede Seite = ein Spielabend
- **Datum** steht oben rechts (z.B. „27.5.")
- **Erste Zeile** = Spaltenköpfe: Spielernamen-Kürzel + letzte Spalte „Sp" (Spielwert)
- **Jede weitere Zeile** = ein Spiel, mit dem **kumulierten Spielstand** je Spieler:in + Kürzeln
- **Trennlinien** markieren das Ende einer Runde – ABER: die **Zählung** ist maßgeblich, nicht
  Roberts Linien. Eine Runde endet, wenn die Spielzahl stimmt (Anzahl Spieler + angesagte Solos),
  nicht zwangsläufig dort, wo Robert einen Strich zieht. Linien sind ein Hinweis, kein Beweis.
- **Wellenlinie = durchgestrichene Linie = KEIN Rundenende.** Robert markiert eine versehentlich
  gezogene Trennlinie durch Durchstreichen/Wellen als ungültig. Nur eine **glatte, durchgezogene
  Linie** ist ein echtes Rundenende. (Beispiel 3.6., Runde 1: nach Spiel 4 eine Wellenlinie –
  die Runde lief mit dem Solo-verlängerten 5. Spiel weiter, erst danach die echte Linie.)

### Wichtige Grundregeln

- Die Zahlen in den Spieler-Spalten sind **kumulierte Spielstände**, NICHT Deltas!
  → Deltas immer erst selbst berechnen: aktueller Stand minus vorheriger Stand
- Kürzel stehen **direkt hinter der Zahl** des jeweiligen Spielers (z.B. „4 F+" = Stand 4, Fuchs gefangen)
- **Kürzel-Zuordnung über die Zahl-Position, NICHT über die Spaltenbreite!** Alle Kürzel zwischen
  der Zahl einer Person und der nächsten eigenständigen Zahl gehören zu der Person *davor* –
  auch wenn die Kürzel-Kette optisch weit in die Nachbarspalte hineinragt. Roberts Ketten ziehen
  sich oft so weit nach rechts, dass sie unter dem Spaltenkopf der nächsten Person zu liegen
  scheinen. Das täuscht: maßgeblich ist „nach welcher Zahl / vor welcher nächsten Zahl", nicht
  „unter welchem Spaltenkopf". (Beispiel 3.6., R1S5: „23 HRDKF+ 9" – HR, DK und F+ gehören ALLE
  zu Kathrins 23, obwohl F+ fast über Jans Spalte steht; die 9 ist Jans Stand.)
- Kürzel können **direkt aneinandergehängt** sein ohne Trennzeichen (z.B. „8 R96" = Stand 8, Re angesagt + Keine 90 + Keine 60). Die Kürzel müssen selbst auseinandergelesen werden.
- Die **nächste eigenständige Zahl** (die keine Absage-Ziffer ist) gehört zur nächsten Spalte. Absage-Ziffern 9, 6, 3, 0 sind immer Teil der Kürzel-Kette, nie ein eigenständiger Spielstand.
- Kürzel in der **Sp-Spalte** enthalten NUR: Spielwert (Zahl) + optional C + optional Solo-Typ (FL etc.). Niemals Ansage-Kürzel (R, K, 9, 6, 3, 0) – diese stehen immer bei den Spielern!
- Roberts Handschrift: **9 kann wie 7 aussehen**, **8 kann wie „e" aussehen**, **19 kann wie „1J" aussehen**
  → Wenn ein Delta nicht aufgeht: erst prüfen ob eine Zahl falsch gelesen wurde, bevor nachgefragt wird

### Schreibfehler und Korrekturen

- Durchgestrichene Spalten = Schreibfehler, komplett ignorieren
- Fehlende Kürzel (z.B. vergessenes C) sind möglich → Plausibilitätsprüfung!

### Roberts EIGENE Fehler (nicht Claudes Lesefehler!) – seit 3.6./10.6.2026 bekannt

Neben Lesefehlern (Claude verliest eine Ziffer/ein Kürzel) gibt es eine zweite, unabhängige
Fehlerquelle: **Robert selbst verbucht ein Spiel falsch**, und zwar konsequent weiter – die
Quersumme bleibt dabei IMMER bei 0 (Check A schlägt nicht an!), weil Robert in sich stimmig
weiterrechnet. Solche Fehler fallen ausschließlich über die **Spiellogik-Rückrechnung** (Check B /
„richtig herum") auf, nie über die Arithmetik allein. Zwei bekannte Spielarten:

1. **Personen-Vertauschung bei gleichem Betrag:** Robert schreibt den richtigen Betrag, aber bei
   der falschen Person (z.B. +9 bei Spieler A statt bei Spieler B, −9 umgekehrt). Erkennbar daran,
   dass sich der Spielwert rechnerisch nicht herleiten lässt, obwohl die Beträge stimmen. Beispiel
   3.6./10.6., R1·S3: Robert gab Jan +9 und Kathrin −9, richtig wäre Jan −9 und Kathrin +9 gewesen
   (Kathrin+Dani haben zusammengespielt, nicht Jan+Dani).
2. **Kompletter Wert-Fehler:** Robert verbucht das ganze Spiel mit einem zu niedrigen/hohen Wert,
   und alle Folgezeilen schreiben auf dieser falschen Basis konsistent weiter. Beispiel 10.6.,
   R4·S1: Robert schrieb Wert 3, tatsächlich war es 6 (Gewonnen+K90 geschafft+K90 angesagt=3 ×2(Re)
   =6, +Fuchs(eigen)=7, −Karlchen(gegnerisch)=6). Der Fehler hat sich bis zum Abend-Ende durchgezogen.

**Konsequenz für die Abend-Endstände:** Beide Fehlertypen erzeugen einen **konstanten Offset**, der
sich von der Fehlerstelle bis zum Ende des Abends durchzieht (da Robert ab dort korrekt, aber auf
falscher Basis weiterschreibt). Der von Jan/Robert gegebene „Endstand laut Büchlein" ist deshalb
NICHT automatisch der wahre Endstand – er muss um JEDEN gefundenen Fehler-Offset korrigiert werden.
Bei mehreren Fehlern am selben Abend addieren sich die Offsets unabhängig (siehe 10.6.: R1·S3 und
R4·S1 zusammen ergaben einen anderen Endstand als nur einer der beiden Korrekturen allein).
**Solche Fehler werden nur durch telefonische/persönliche Rückfrage bei Robert aufgedeckt**, nicht
durch nochmaliges Hinschauen aufs Blatt – das Blatt selbst ist ja in sich konsistent falsch.

---

## 1a. Eingangsprüfung pro Abend (Schritt 0 – IMMER zuerst!)

Bevor ein einziges Spiel ausgewertet wird, immer diese zwei Checks durchführen und
das Ergebnis mit Jan bestätigen:

**1. Datum bestätigen**
- Datum vom Blatt ablesen (steht oben rechts oder unten)
- Explizit an Jan zurückspiegeln (z.B. „Datum: 29.4.")
- Prüfen, ob dieser Abend schon in Abschnitt 9 (transkribierte Abende) steht → Doppel-Import vermeiden

**2. Spieler:innen checken – bekannt oder neu?**
- Alle Spaltenköpfe ablesen (Kürzel + die letzte Spalte „Sp")
- Jedes Spieler-Kürzel gegen das Lexikon (Abschnitt 2) abgleichen
- Bei bekannten Kürzeln: bestätigen
- Bei **neuen/unbekannten Kürzeln**: STOPP – bei Jan nachfragen, wer das ist.
  Niemals einen Namen oder eine player_id erfinden oder raten.
- Erst nach Auflösung aller Kürzel ins Lexikon aufnehmen und mit der Auswertung beginnen

Erst wenn Datum und alle Spieler:innen geklärt und von Jan bestätigt sind → mit der
Auswertungs-Reihenfolge (Abschnitt 3) starten.

---

## 1b. Leseweise: IMMER spaltenweise (wichtigste Methodik-Regel!)

Roberts Tabelle wird **Spalte für Spalte** gelesen, jede Spieler-Spalte (und die Sp-Spalte)
isoliert von oben nach unten – NICHT zeilenweise hin- und herspringen.

**Warum:** Beim zeilenweisen Lesen „erbt" man leicht Zahlen aus der Nachbarzeile
(z.B. denselben Wert zweimal lesen) oder verrutscht zwischen Spalten. Das war die
mit Abstand häufigste Fehlerquelle. Spaltenweises Lesen zeigt den **Verlauf** einer
Spalte (Ausreißer fallen sofort auf) und hält die Zuordnung sauber.

**Vorgehen (Schritt A – Erst-Read, NUR einlesen, noch nicht rechnen):**
1. Alle fünf (bzw. n+1) Spalten einzeln einlesen: Ja, Jö, Ka, Ro, …, Sp
2. Die **Sp-Spalte gleich mit-einlesen** – sie ist die Spielwert-Kontrolle UND der Solo-Indikator
3. **Linien-/Struktur-Inventur:** Schon beim Erst-Read alle Trennlinien notieren UND ihren
   Typ erfassen – **glatte, durchgezogene Linie** vs. **Wellenlinie**. Das gibt die
   Rundenstruktur (wie viele Spiele bis zur nächsten echten Linie) von Anfang an vor und
   verhindert, dass man eine Runde zu früh abschließt. (Unterstreichungen einzelner Stände
   gehören NICHT in den Erst-Read – die sucht man erst gezielt, wenn die Deltas ein Null-Spiel
   zeigen, siehe Abschnitt 3 Schritt 3.)
4. Erst dann (Schritt B/C) zeilenweise die Deltas rechnen und Spiel für Spiel auswerten.

**Reihenfolge nicht vermischen!** Erst *alle* Spalten komplett einlesen (A), dann *eine* Zelle
nach der anderen verifizieren (B), dann erst rechnen/deuten (C). Nicht mitten im Einlesen schon
ein Spiel auswerten – das führt zu vorschnellen Rückfragen, bevor die volle Spalten-Sicht da ist.

**Die 3-gegen-1-Regel bei Delta-Abweichungen (sehr wichtig!):**
Wenn von vier Deltas **drei übereinstimmen** (z.B. Betrag 4) und nur **eines abweicht**, dann ist
die überwältigend wahrscheinliche Erklärung: **Der Spielwert ist der der drei (hier 4), und die
eine abweichende Zahl ist falsch gelesen** – NICHT umgekehrt. Niemals einen Spielwert „fabulieren",
der zur einen Ausreißer-Zahl passt. Die Mehrheit der Deltas gewinnt. Danach: welcher Stand müsste
stehen, damit das Delta zur Mehrheit passt?

**Dreistufige Gegenprüfung einer Korrektur** (mind. eine, idealerweise mehrere bestätigen):
1. **Sp-Spalte prüfen:** Steht dort der vermutete Spielwert? (Achtung 7↔1: Sp „7" ist oft eine 1!)
2. **Optische Re-Inspektion:** Die Ausreißer-Zahl nochmal genau ansehen – oft ist eine vermeintliche
   Ziffer in Wahrheit etwas Durchgekritzeltes/Korrigiertes (z.B. „−15" entpuppt sich als „−5").
3. **Folgespiel-Quergegenprüfung:** Geht das Delta des *nächsten* Spiels mit der Korrektur sauber
   auf? Der korrigierte Stand muss auch als Ausgangswert des Folgespiels stimmen.
- Erst wenn alle drei nicht greifen: bei Jan nachfragen.

---

## 1c. Verifikations-Konvention (was die Tabelle bedeutet)

Nach jeder gelesenen Runde wird Jan eine Tabelle im Standardformat (Abschnitt 3a) gezeigt.

- **Was in der Tabelle steht, ist von Claude verifiziert** (Nullsumme, Deltas, Spielwert
  gegen Sp, Re/Kontra, Sonderpunkt-Paarigkeit). Jan muss das NICHT händisch nachrechnen.
- **Unsichere Zellen werden mit ⚠️ markiert** + kurze Notiz darunter, was angenommen/vermutet
  wird. Nur diese Stellen brauchen Jans Blick aufs Foto oder seine Entscheidung.
- Zwei Sorten echter Unsicherheit, die Claude nicht allein lösen kann:
  1. **Reine Lese-Unsicherheit** (Schrift mehrdeutig, Logik hilft nicht weiter)
  2. **Logik-Unsicherheit** (mehrere Lesarten ergeben denselben Spielwert, aber unterschiedliche
     Statistik-Folgen; Null-Spiel ohne Unterstreichung; Widersprüche in den Kürzeln)

---

## 1c2. Forcing-Verbot: mathematisch erzwungen ≠ bestätigt (seit 10.6.2026 verbindlich)

**Eine Ansage (Re/Kontra), die nur deshalb angenommen wird, weil ohne sie der Wert nicht aufgeht,
ist NIEMALS eine fertige Antwort – sie ist ein Alarmsignal.** Dieser Fehler ist besonders
verräterisch, weil er sich „richtig" anfühlt (die Rechnung geht ja auf) und deshalb leicht
unbemerkt durchläuft.

**Vorgehen, sobald eine Ansage mathematisch erzwungen wirkt:**
1. Sofort in der Ersterfassung mit ⚠️ markieren – nicht erst in der Abend-Zusammenfassung.
2. Aktiv ein zweites Mal genau auf die Zeile schauen, ob das erzwungene Kürzel tatsächlich dort
   steht. In aller Regel steht es wirklich da, man hat es beim ersten Durchgang übersehen
   (Beispiel 10.6., R1·S2/R1·S5/R3·S1/R3·S3/R3·S5: alle vier „erzwungenen" Ansagen waren beim
   genauen Nachschauen tatsächlich vorhanden – R, RF+, 0R, R9 etc.).
3. Erst wenn der zweite Blick nichts zeigt: konkret nachfragen, mit der Begründung „nur mit
   Re/Kontra geht der Wert auf, ohne bräuchte es X Stufen unangesagt".

**Sauberer Test, um Forcing von echter Mehrdeutigkeit zu unterscheiden:** Für jedes fragliche Spiel
per Skript durchrechnen, ob *ohne* jede Ansage eine plausible Stufenzahl (0–2, ggf. mit Sonderpunkten
verrechnet) zum Wert führt. Gibt es **nur eine** gültige Lösung und die erfordert eine Ansage → das
ist Forcing, zweimal hinschauen. Gibt es **zwei gleich plausible** Lösungen (mit und ohne Ansage,
beide ≤2 Stufen) → das ist **echte Mehrdeutigkeit**, eine legitime Rückfrage. Gibt es **nur eine**
Lösung **ohne** Ansage → gar keine Rückfrage nötig, einfach „keine Ansage" setzen.

---

## 1d. Mehr als vier Spieler:innen – der Geber setzt aus (ab 10.6.2026)

Bei 5 (bis 7) Spieler:innen spielt nicht jede:r jedes Spiel mit. **Der/die Geber:in setzt aus**
(bei 5 genau eine Person, bei 6 zwei, bei 7 drei). Das ändert die Auswertung an mehreren Stellen –
hier gebündelt:

- **Aussetzer = „−" in der Spalte = Delta 0.** Der kumulierte Stand der aussetzenden Person bleibt
  unverändert. Ein „−" ohne Zahl ist also kein Spielergebnis, sondern „hat nicht mitgespielt".
- **Quersumme 0 je Zeile gilt über ALLE Spieler:innen** (auch die Aussetzer, deren Delta 0 ist).
  Jede gelesene Zeile muss über alle fünf Stände eine in sich schlüssige Verteilung ergeben.
- **Nullsummen- und ±-Prüfung NUR über die Aktiven.** Bei 5 Spieler:innen rechnest du die Deltas
  der **vier Aktiven** und erwartest dort das übliche Muster: Normalspiel = zweimal +v / zweimal −v;
  Solo = einmal +3v / dreimal −v. Der Aussetzer ist nicht Teil dieser vier.
- **Achtung Zeilenversatz beim Aussetzer (häufige Falle!):** Wenn in einer Zeile *fünf* Werte sich
  zu ändern scheinen, hast du sehr wahrscheinlich ein „−" als Zahl fehlgelesen (oder eine Spalte um
  eine Zeile verrutscht). Spaltenweise lesen, das „−" suchen. (Beispiel 10.6.: ein „− über dem 6F−"
  bei Jan – die 6F− gehörte zum Spiel *danach*.)

### Geber-Rotation und Rundenlänge bei n Spieler:innen

- **Jede Runde beginnt der Geber bei Sitzplatz 1** und rotiert dann durch die Sitzpositionen.
  Bei 5 Spieler:innen setzt also S1 = Sitz 1, S2 = Sitz 2, … aus. Das ist ein starker, von der
  Schrift unabhängiger Anker: du weißt vor dem Lesen, wer aussetzt.
- **Ein angesagtes Solo verlängert die Runde um 1 Spiel** (CLAUDE.md): der/die Solist:in kommt
  selber raus, der/die Geber:in **muss nochmal geben** – also setzt **derselbe Geber zweimal
  hintereinander** aus. Die Geber-Folge einer 5er-Runde mit einem Solo ist z.B. Ja, Ro, **Ka, Ka**,
  So, Da (das doppelte Ka ist das Solo-Nachgeben).
- **Spielezahl je Runde IMMER aus Zeilenanzahl/Solo-Markern ableiten, nie „= Spielerzahl" annehmen.**
  5 Spieler:innen → 5 Spiele **+ 1 je angesagtem Solo**. Ein im Foto übersehenes Solo macht aus
  5 Spielen 6. (Beispiel 10.6., R4: ich rechnete fälschlich mit 5 Spielen und lief gegen die Wand,
  bis Danis Spalte 6 Einträge hatte – das versteckte Fleischlos-Solo war Spiel 4 der Runde.)

### Endstand & Rundengrenzen als harte Anker (sehr mächtig bei n>4)

Wenn die Innenzeilen schwer lesbar sind: Lass dir die **Rundengrenzen** (letzte Zeile je Block) und
den **Endstand** geben/bestätigen. Mit Anfangs- und Endstand je Runde + den Regeln (Quersumme 0,
gleiche Beträge je Spiel, ein Geber raus) lässt sich jede Runde **rückwärts** so stark eingrenzen,
dass man Lesungen *verifiziert* statt *rät*. Eine einzelne durchlaufende Spalte (am 10.6. Jans und
Danis Spalten) liefert oft schon genug Zwischenanker, um eine ganze Runde zu knacken.

---

## 1e. Anker-Methode bei unleserlichen Blöcken (ab 22.4.2026)

Wenn ein ganzer Block so dicht/unleserlich ist, dass die Zwischenzeilen nicht sicher gelesen
werden können (22.4., Runde 4): NICHT raten und NICHT mit erfundenen Zwischenständen rechnen.
Stattdessen die Runde **zwischen zwei harten Ankern aufspannen und rechnerisch erzwingen**:

1. **Start-Anker** = Endstand der Vorrunde (bereits verifiziert).
2. **End-Anker** = Endstand des Abends (von Jan/Robert bestätigen lassen).
3. **Rundenlänge** = Anzahl Spiele klären (bei n=4: 4 Spiele + 1 je Solo). Bei 22.4. R4: das BS in
   der Sp-Spalte signalisierte 1 Solo, Jan bestätigte 5 Spiele.
4. **Zwei durchlaufende Spalten vorlesen lassen** (nur die kumulierten Zahlen, ohne Kürzel). Schon
   zwei Spalten + beide Anker genügen: pro Zeile gilt Nullsumme der vier Deltas, also ist
   `dSo + dDa = −(dJa + dRo)` je Zeile vorgegeben. Zusammen mit dem Wissen „eine Zeile ist das Solo"
   (Solist +3w, drei Gegner −w) und „Normalspiel = zwei +w / zwei −w" sind die beiden übrigen
   Spalten **eindeutig erzwungen**, nicht geraten.
5. **Solo-Zeile identifizieren**: die Zeile mit dem großen, einseitigen Ausschlag (22.4. R4: Sophia
   +28 über die Runde, davon +27 allein im Solo). Solist-Vorzeichen verrät gewonnen/verloren.
6. **Erst danach** die Kürzel (Ansagen/Sonderpunkte) den nun bekannten Zeilen zuordnen und jeden
   Wert „richtig herum" gegenrechnen.

**Königsregel:** Zwei Anker + zwei Spalten schlagen jede unsichere Einzelzeilen-Lesung. Lieber Jan
zwei Spalten vorlesen lassen als fünf Zeilen raten.

### Kürzel-Zuordnung im engen Block über die Zahl, nicht die optische Zeile (22.4.)

Ein Kürzel, das optisch in einer bestimmten Zeile zu stehen scheint, kann zur Zeile darüber/darunter
gehören. **Der Wert-Gegencheck entscheidet, nicht das Auge.** Beispiel 22.4. R4: „RDK" schien zur
w=1-Zeile zu gehören, passte dort aber nicht (Re-Ansage ×2 + Doppelkopf ergäbe ≥3, nicht 1). Es
gehörte zur Solo-Zeile darüber (So-Stand 9 = Bubensolo), wo es exakt aufgeht (4×2+1=9). Regel:
Wenn ein Ansage-/Sonderpunkt-Kürzel den Wert seiner vermeintlichen Zeile sprengt, gehört es
mit hoher Wahrscheinlichkeit zur Nachbarzeile – über die Zahl-Position verifizieren.

### Doppelfuchs als exakter Null-Spiel-Ausgleich (22.4. R4S1)

Ein Doppelfuchs (F+F+, +2 fürs Fänger-Team, −2 fürs Gegner-Team) gleicht einen Grundpunkt-Sieg
von genau 2 exakt aus → Spielwert netto 0, alle vier Deltas 0. Klassische Konstellation: Kontra
gewinnt mit Gewonnen + Gegen die Alten (=2), das verlierende Re-Team fängt aber den Doppelfuchs
(+2) → 0. Hier war Re=Ro+So (verloren grundpunktlich, +2 Fuchs), Kontra=Da+Ja (Gewonnen+GgdA=2, −2 Fuchs).

**PFLICHT-PAARIGKEITSCHECK (Lehre aus 22.4., Fehler-Wiederholung vermeiden!):** Zwei F+ erfordern
ZWINGEND zwei F− – jeder gefangene Fuchs hat genau einen Verlierer. Bei F+F+ (Doppelfuchs) müssen
also **zwei** F− bei den Gegnern stehen (22.4. R4S1: Ro F+F+ ↔ Ja F− **und** Da F−). Ebenso gehört
jedes K+ zu genau einem K− und umgekehrt. **Wenn die Paarigkeit nicht aufgeht, ist ein Kürzel der
falschen Zeile zugeordnet (Zeilenversatz beim Sonderpunkt) – NICHT erfinden, sondern die richtige
Zeile suchen.** Am 22.4. habe ich die Karlchen- und Fuchs-Zeilen mehrfach vertauscht; korrekt ist:
R4S2 Ja K+ ↔ Da K− (Karlchen), R4S4 Ja K+ ↔ Da K− (Karlchen) UND Ro F+ ↔ Ja F− (Fuchs), R4S1 Ro F+F+ ↔ Ja F− + Da F−. Merke:
**fängt ein Spieler aus dem Verlierer-Team einen Sonderpunkt, zieht das den Spielwert um 1 nach
unten** (R4S2: Wert 1 = Gew+K90=2 −1 Karlchen). Wenn ein Gewinner einen SP fängt und ein Verlierer
auch (R4S4: Ja K+ eigen, Ro F+ gegnerisch), heben sich beide auf → Wert = reine Grundpunkte
(R4S4: Wert 2 = Gewonnen + Keine 90 geschafft, netto-SP 0).

### Bubensolo-Wert mit Ansage + Doppelkopf (22.4. R4S3)

Einfacher Wert 9 = (Gewonnen + **Solopunkt** + Keine 90 + Keine 60 = 4 Grundpunkte)
× 2 (Re vom Solisten angesagt) + 1 (Doppelkopf, eigen). Sp-Spalte zeigt den 3-fachen Wert „27 BS".
Beim Solo gibt es **kein „Gegen die Alten"** (das ist Kontra-spezifisch im Normalspiel). **Der
Solopunkt ist ein eigener Grundpunkt jedes Solos** – er erhöht den Wert, zählt aber NICHT zur
Augen-Stufen-Leiter (wichtig für den Feigheits-Check, s. Abschnitt 4a Check C). Erreichte
Augen-Stufen hier: nur K90 + K60 (Level 2); bei Re-Ansage (Level 0) Abstand 2 → **keine Feigheit**.
Augen-Range Re 181–210 (Keine 60 geschafft).

---

## 2. Kürzel-Lexikon

### Spieler-Kürzel (Jans Runde)

| Kürzel | Name    | player_id |
|--------|---------|-----------|
| Ja     | Jan     | jan       |
| Ro     | Robert  | robert    |
| Da     | Dani    | dani      |
| So     | Sophia  | sophia    |
| Jö     | Jörn    | joern     |
| Ka     | Kathrin | kathrin   |

### Kürzel an Spieler:innen (hinter dem kumulierten Stand)

| Kürzel | Bedeutung                                      | Hinweis                                      |
|--------|------------------------------------------------|----------------------------------------------|
| R      | Re angesagt                                    | Von dieser Person                            |
| C      | Kontra angesagt                                | Robert schreibt Kontra IMMER als C, NIE als K! |
| A      | Armut                                          | Diese Person hat die Armut (Partner = Retter:in) |
| H      | Hochzeit                                       | Diese Person hatte die Hochzeit (Hochzeiter:in) |
| HR     | Hochzeit + Re angesagt                         | Kombination                                  |
| F+     | Fuchs gefangen                                 | Sonderpunkt +1 für diese Person              |
| F−     | Fuchs verloren                                 | Nur Statistik-Notiz, KEIN negativer Sonderpunkt! |
| K+     | Karlchen gefangen                              | Sonderpunkt +1 für diese Person              |
| K−     | Karlchen verloren                              | Nur Statistik-Notiz, KEIN negativer Sonderpunkt! |
| K      | Karlchen gemacht                               | Letzten Stich mit Kreuz-Buben gemacht, Sonderpunkt +1. K allein = Karlchen, NICHT Kontra! |
| DK     | Doppelkopf                                     | Stich mit 40+ Augen gemacht                  |
| 9/6/3/0 | Keine 90 / Keine 60 / Keine 30 / Schwarz (angesagt) | Teil der Kürzel-Kette, z.B. „R9DK" = Re + Keine 90 + Doppelkopf |

### Kürzel in der Sp-Spalte

Die Sp-Spalte enthält NUR den Spielwert (Zahl) + folgende optionale Kürzel:

| Kürzel | Bedeutung |
|--------|-----------|
| C      | Kontra-Partei hat gewonnen (positiver Indikator, aber Robert vergisst es manchmal) |
| FL     | Fleischloses Solo |
| BS     | Bubensolo |
| DS     | Damensolo |

**WICHTIG – Spielwert bei Solo:** In der Sp-Spalte notiert Robert beim Solo den
**DREIFACHEN** Spielwert (= was der Solist bekommt), NICHT den einfachen.
Beispiel: „12 BS" = Bubensolo, Solist bekommt +12, einfacher Spielwert = 4 (jeder Gegner −4).
Das ist die Ausnahme zur sonstigen Sp-Regel (sonst steht dort der einfache Spielwert).
→ Der Solo-Typ in der Sp-Spalte ist auch der **sichere Solo-Indikator**: Steht dort kein
Solo-Kürzel, ist es KEIN Solo – egal wie verlockend ein Faktor-3-Sprung in den Deltas aussieht.

Ansage-Kürzel (R, C, 9, 6, 3, 0) stehen NIEMALS in der Sp-Spalte – immer beim jeweiligen Spieler.

### Re-Partei vs. Sieger – nicht verwechseln!

Der **Spieltyp bestimmt, WER die Re-Partei ist**, aber NICHT, wer gewinnt:
- Solo: Solist:in = Re
- Hochzeit: Hochzeiter:in + Eingeheiratete:r = Re
- Armut: Armut + Retter:in = Re
- Normalspiel: das Team mit den Kreuz-Damen = Re

Diese Re-Partei kann durchaus **verlieren** (siehe Abend 29.4., Spiel 13: Armut verliert,
Spiel 14: Hochzeit mit Re-Ansage verliert). Dann gewinnt Kontra. In der Standard-Tabelle
steht immer die **Gewinnerpartei** – das kann also Kontra sein, obwohl der Spieltyp (Armut/
Hochzeit/Solo) bei der Re-Partei „hängt".

### Gescheiterte Absage

Sagt die Re-Partei eine Absage an (z.B. „Keine 90") und schafft sie nicht, **verliert Re**
und Kontra gewinnt – die gescheiterte Absage zählt als Grundpunkt für Kontra, plus „angesagt".
Die Re-Ansage verdoppelt trotzdem (auch wenn Re verliert). Beispiel Spiel 18 (29.4.):
Re sagt Re + Keine 90, schafft es nicht → Kontra: (Gewonnen + Gegen die Alten + K90 + K90
angesagt) × 2 − gegnerische Sonderpunkte.

### Null-Spiele (Spielwert 0)

- Robert unterstreicht die kumulierten Spielstände von **zwei Spieler:innen**. **FESTGELEGT
  (4.6.2026): Die Unterstrichenen sind das RE-Team** (Robert ist entsprechend gebrieft). Daraus
  Gegner-Team = Kontra ableiten und den Sieger über Grundpunkte/Sonderpunkte rekonstruieren
  (siehe Abschnitt 3, Schritt 3).
- Hat er das Unterstreichen vergessen → nachfragen, wer das Re-Team war
- Erkennungsmerkmal: alle vier Deltas = 0 (Stände ändern sich nicht). Siehe auch Schritt 3.

---

## 3. Auswertungs-Reihenfolge (je Spiel)

**Schritt 1: Zeile sauber lesen**
- Kumulierten Stand und Kürzel für jeden Spieler sauber trennen
- Sp-Spalte separat lesen

**Schritt 2: Deltas berechnen und gegen Sp abgleichen**
- Delta = aktueller Stand minus vorheriger Stand
- Deltas müssen paarweise +Sp und −Sp ergeben (außer bei Solo: einmal +3×Sp, dreimal −Sp)
- Nullsumme der Deltas muss 0 ergeben
- Wenn ein Delta nicht aufgeht: erst selbst überlegen welche Zahl falsch gelesen wurde!

**Schritt 3: Wer hat zusammengespielt?**
- Gleiche Vorzeichen der Deltas = zusammengespielt
- Ausnahme: Null-Spiel → Vorzeichen helfen nicht (alle Deltas 0), Robert unterstreicht zwei Namen
- **Null-Spiel-Erkennung:** Bei einem Null-Spiel (Sp=0) ändern sich die kumulierten Stände
  NICHT – alle vier Deltas sind 0. Das ist das sichere Erkennungsmerkmal (zusätzlich zur
  Unterstreichung). Erst NACH dieser Delta-Erkennung gezielt in genau dieser Zeile nach den
  zwei unterstrichenen Ständen suchen (nicht schon im Erst-Read pauschal danach fahnden).
  Ein gefangener Fuchs oder Karlchen wirkt dabei teamrelativ (+1 eigenes Team / −1
  Gegnerteam) und kann den Sieg-Grundpunkt exakt ausgleichen → netto 0 für alle.
- **FESTGELEGT (4.6.2026): Unterstrichen = das RE-Team** (Robert wurde entsprechend gebrieft).
  Begründung: Beim Null-Spiel ist Re/Kontra die einzige Information, die sich aus nichts anderem
  ableiten lässt (Vorzeichen sind alle 0, oft kein Spieltyp-Kürzel). Der *Sieger* dagegen ist
  meist rekonstruierbar (über Grundpunkte + Sonderpunkte). Robert liefert mit der Unterstreichung
  also genau die nicht-ableitbare Größe. Zusätzlich passt es direkt ins `party`-Feld des Schemas
  (alle Augen-Ranges sind „aus Sicht der Re-Partei" definiert).
- **Sieger aus der Partei rekonstruieren:** Wer +1 Grundpunkt gewinnt, kann das nur als **Re**
  („Gewonnen"). Ein Kontra-Sieg brächte zwingend Gewonnen + Gegen die Alten = 2 – AUSSER beim
  gespaltenen Arsch, wo Kontra nur „Gegen die Alten" (+1) bekommt. Genau deshalb macht erst die
  Re/Kontra-Zuordnung einen gespaltenen Arsch erkennbar. (Beispiel 3.6., R3S3: Ro+Ka unterstrichen
  = Re, gewinnen mit +1; Ja hat Karlchen +1 für Kontra → gleicht aus → netto 0 für alle.)
- Hat Robert das Unterstreichen vergessen → nachfragen, wer mit wem gespielt hat (Re-Team).
- **WICHTIG – Null-Spiel ≠ Gespaltener Arsch:**
  - Null-Spiel = der **Spielwert** ist 0 (nach Grundpunkten × Verdopplung ± Sonderpunkten).
    Die **Augen** können dabei alles sein! Eine Partei kann sogar K60 erreicht haben und der
    Spielwert trotzdem 0 sein, wenn die andere genug Sonderpunkte hat. Die Augen-Range ergibt
    sich aus den **tatsächlich erreichten Schwellen**, NICHT aus dem Spielwert 0.
  - Gespaltener Arsch = beide Parteien haben genau **120 Augen**. Per se Spielwert > 0
    (Kontra gewinnt mit „Gegen die Alten" +1). Wird nur durch Re-Sonderpunkte zum Null-Spiel.

**Schritt 4: Wer ist Re, wer ist Kontra?**
Mehrstufig – in dieser Reihenfolge:
1. Direkte Hinweise: Ansage (R), Spieltyp (A, H, HR, Solo) → eindeutig
2. C im Sp-Feld → Kontra hat gewonnen (100% sicher wenn vorhanden)
3. Kein C, kein direkter Hinweis → Default: Re hat gewonnen
4. Wenn Re rechnerisch nicht plausibel → Kontra, Robert hat C vergessen

**Wichtig:** C ist ein **positiver Indikator**, kein negativer Beweis. Fehlendes C bedeutet NICHT automatisch Re!

**Schritt 5: Ansagen und Absagen ablesen**
- Direkt aus den Kürzeln beim jeweiligen Spieler – werden nicht abgeleitet!
- Kürzel können aneinandergehängt sein: R=Re, C=Kontra, 9=Keine 90, 6=Keine 60, 3=Keine 30, 0=Schwarz
- **K ist NICHT Kontra!** K allein = Karlchen gemacht (Sonderpunkt). Kontra = C.
- Beispiel: „R9DK" = Re angesagt + Keine 90 angesagt + Doppelkopf

**Schritt 6: Sonderpunkte ablesen**
- F+, K+, K, DK = echte Sonderpunkte (+1 für den Erzielenden)
- F− und K− = nur Statistik-Notizen (wessen Fuchs/Karlchen wurde gefangen) – KEIN negativer Sonderpunkt!
- Sonderpunkte sind teamrelativ: eigene +1, gegnerische −1

**Finaler Sanity Check: Spielwert nachrechnen – IMMER „richtig herum" denken!**

Die zentrale Methodik (häufigste Fehlerquelle bei der Deutung): **Nicht** von einer angenommenen
Grundpunkt-Konstellation ausgehen und schauen, ob sie zur Sp-Zahl passt. Das ist rückwärts und
führt in die Irre. Stattdessen:

1. **Alle sichtbaren Fakten sind Pflicht-Input:** Die Sp-Zahl und ALLE sichtbaren Kürzel (Ansagen,
   Absagen, Sonderpunkte) MÜSSEN in die Rechnung. Eine Re-Ansage *muss* verdoppeln, ein sichtbarer
   Sonderpunkt *muss* rein – das ist nicht verhandelbar.
2. **Dann die passende Grundpunkt-Konstellation suchen**, die (a) mit allen sichtbaren Kürzeln
   konsistent ist, (b) zur Sp-Zahl führt und (c) spielerisch plausibel ist (keine erfundenen
   Extra-Schwellen).
3. **Fehlende Grundpunkte kommen aus GESCHAFFTEN, nicht angesagten Schwellen – NIEMALS eine
   Ansage erfinden, um einen Wert zu treffen!** Wenn die sichtbaren Ansagen den Wert nicht voll
   erklären, ist die Lücke fast immer eine in den **Augen erreichte** Schwelle (Keine 90 / Keine 60
   geschafft = je +1 Grundpunkt, auch ohne Ansage). Diese Schwelle hinterlässt **keine Ziffer** im
   Büchlein, sondern schlägt sich in der **Augen-Range** (`augen_re_min/max`) nieder. Die
   **Verdopplung** steigt ausschließlich durch **real notierte** Re/Kontra-Kürzel – eine Re- oder
   Kontra-Ansage, die nicht auf dem Blatt steht, gibt es nicht. (Lehrbeispiel 10.6., R4·S2: Kontra
   angesagt (×2), Wert 9, Sophia fängt Karlchen (+1). Falsch wäre, eine zweite Ansage zu erfinden
   um auf ×4 zu kommen. Richtig: Gewonnen + Gegen die Alten + **Keine 90 geschafft** + **Keine 60
   geschafft** = 4 Grundpunkte × 2 + 1 = 9. → Re-Augen-Range 30–59, weil Kontra die hohen Augen hat.)
4. **MATHEMATISCH ERZWUNGEN ≠ BESTÄTIGT – das größte Learning vom 10.6.2026!** Wenn ein Wert nur
   dann aufgeht, wenn eine Re/Kontra-Ansage existiert (keine andere Grundpunkt-Konstellation passt),
   ist das ein **Alarmsignal, genau hinzuschauen**, NIEMALS ein Beweis, dass die Ansage da ist und
   NIEMALS ein Freibrief, sie als gelesen zu präsentieren. Vorgehen bei einer solchen Erzwingung:
   a) Sofort in der Ersterfassung mit ⚠️ markieren, nicht erst am Ende der Auswertung.
   b) Aktiv noch einmal genau auf die Zeile schauen, ob das erzwungene Kürzel tatsächlich da steht
      (in aller Regel steht es wirklich da – man hat es beim ersten Lesen nur übersehen).
   c) Erst wenn auch der zweite Blick nichts zeigt: bei Jan/Robert nachfragen, mit der konkreten
      Begründung „nur mit Re/Kontra geht der Wert auf, ohne bräuchte es X Stufen unangesagt".
   Ein eigenes Prüfskript (für jedes Spiel: Wert mit/ohne Verdopplung durchrechnen, prüfen ob nur
   eine Variante eine plausible Stufenzahl ergibt) macht diese Fälle systematisch sichtbar, statt sie
   einzeln zu erraten. Nur echte **Mehrdeutigkeit** (mehrere Lesarten ergeben denselben Wert, keine
   ist erzwungen) ist eine legitime Rückfrage – „erzwungen, aber ungeprüft" ist keine.

Rechenreihenfolge:
- Grundpunkte summieren (Gewonnen, Gegen die Alten, Solo-Punkt, geschaffte/angesagte Absagen)
- **Grundpunkte × Verdopplung** (nur Re/Kontra-Ansagen verdoppeln; Absagen allein nicht)
- **DANACH** Sonderpunkte addieren/abziehen (eigene +1, gegnerische −1)
- Ergebnis muss mit Sp-Spalte übereinstimmen
- **Spielwert beim Solo = was die Gegner bekommen** (einfach), nicht das Dreifache des Solisten!

**„Gegen die Alten" ist ein GRUNDPUNKT, kein Sonderpunkt!** Es wird also mit-verdoppelt (bei
Re/Kontra-Ansage) und gehört in Schritt „Grundpunkte summieren", NICHT zu den Sonderpunkten am Ende.
Grundpunkte = Gewonnen, Gegen die Alten, Solo-Punkt, Absagen. Sonderpunkte (erst nach Verdopplung)
= nur Fuchs, Karlchen, Doppelkopf.

Beispiel-Logik (3.6., R1S1): Sp=4, Re angesagt + Re gewinnt, keine Sonderpunkte.
→ Grundpunkte × 2 = 4 → Grundpunkte = 2 → plausibel „Gewonnen (+1) + Keine 90 geschafft (+1)".
K90 wurde nicht angesagt (sonst stünde das Kürzel da und es wären 3 Grundpunkte → Sp=6).

**Feigheits-Kriterium (Plausibilitäts-Auffälligkeit) – als Stufen-Logik:** Die Schwellen-Stufen
über einer bloßen Re/Kontra-Ansage („ich gewinne") sind: **K90 = 1 Stufe**, **K60 = 2 Stufen**,
**K30 = 3 Stufen**, Schwarz = 4. Faustregel:

- **Bis 2 Stufen geschafft ohne Ansage = unauffällig.** Re/Kontra gesagt + Keine 90 geschafft
  (1 Stufe) ist völlig normal. **Kontra gesagt + Keine 60 geschafft (2 Stufen) geht *gerade noch*
  durch** – nicht meckern, so erfassen wie gelesen.
- **Ab 3 Stufen (Keine 30 geschafft, aber nur Re/Kontra/nichts angesagt) = Feigheitsverdacht** →
  **Finger heben**: erst prüfen, ob eine höhere Ansage (Absage) übersehen wurde, bevor man die
  geschaffte K30 als ungesagt erfasst.

Feigheit heißt: deutlich mehr *geschafft* als *angesagt* (≥3 Stufen). „Angesagt, aber nur knapp
geschafft" ist NIE feige (eine Ansage darf knapp aufgehen). Und auch ein Verdacht ist nur Anlass
zum **Gegenprüfen**, kein Korrektur-Freibrief: Ist das Blatt eindeutig und Robert erinnert nichts,
wird erfasst wie geschrieben – ohne erfundene Ansage.

> **Als systematischer Abschluss-Check formalisiert in Abschnitt 4a (Check C).** Dort steht das
> exakte Level-Mapping aus den Re-Augen. Gezählt wird inklusiv mit „Gewonnen" als unterster Stufe;
> das ist identisch zur Stufen-Zählung hier (K30 ohne Ansage = 3). Lehre vom 22.4.: Diesen Check
> für JEDES Spiel programmatisch laufen lassen, nicht nur stichprobenartig. **Solo-Falle:** Der
> Solopunkt ist ein Grundpunkt, aber keine Augen-Stufe – nicht in den Ansage-Abstand einrechnen.
> Am 22.4. schien Sophias Bubensolo R4S3 zunächst feige (fälschlich als Gew+K90+K60+K30 zerlegt);
> korrekt zerlegt (Gew+Solopunkt+K90+K60) ist die erreichte Augen-Stufe nur K60 (Level 2) → keine
> Feigheit. Der Abend hatte am Ende NULL Feigheiten.

---

## 3a. Standard-Tabellenformat (Anzeige je Runde)

Nach jeder gelesenen Runde wird Jan die Runde in diesem Format gezeigt – konsequent
**nur die Gewinnerpartei**:

| Runde | Spiel | Gewinner | Art | Partei | Ansage | Schwelle | Range | Sonderpunkte (Gew. \| Gegner) | Wert |

- **Runde / Spiel**: Zählung **genau wie im Datenmodell/JSON** – Spiel-Nummer startet in jeder
  Runde neu bei 1 (also „Runde 2, Spiel 1", nicht durchlaufend „Spiel 6"). Auch im Gespräch immer
  so benennen, damit Anzeige und JSON deckungsgleich sind und beim JSON-Bau nichts verrutscht.
- **Gewinner**: Spieler:innen der Gewinnerpartei
- **Art**: N=Normal, H=Hochzeit, A=Armut, BS/DS/FL/… (Solo). Bei H/A die Rollen dazu,
  z.B. „A (Armut: Ro, Retter: Jö)" oder „H (Hochz.: Ro, Eingeh.: Jö)"
- **Partei**: Re oder Kontra (der Gewinner)
- **Ansage**: z.B. „Re (Ro)" – Person in Klammern, wie bei Sonderpunkten
- **Schwelle**: höchste erreichte Schwelle (Gew. / K90 / K60 / K30 / Schwarz / Gegen d. Alten / gescheiterte Absage)
- **Range**: abgeleitete Re-Augen-Range (siehe Abschnitt 10)
- **Sonderpunkte**: erst Gewinner, dann mit „|" getrennt die Gegnerpartei; Person in Klammern;
  Kürzel K+/K−/K/F+/F−/DK
- **Wert**: Spielwertberechnung kurz als Formel, Ergebnis fett. Bei Solo zusätzlich „(Solist +3×Wert)"

Legende immer mitdenken: K+=Karlchen gefangen, K−=Karlchen verloren, K=Karlchen gemacht,
F+=Fuchs gefangen, F−=Fuchs verloren, DK=Doppelkopf.

---

## 4. Sanity Checks

| Check | Was wird geprüft | Wann |
|-------|-----------------|------|
| Delta-Check | Deltas paarweise ±Sp (bzw. Solo-Schema) | Schritt 2 |
| Nullsumme | Summe aller Deltas = 0 | Schritt 2 |
| Re/Kontra-Plausibilität | Passt die Konstellation zu Ansagen/Spieltyp? | Schritt 4 |
| Spielwert-Check | Berechneter Spielwert = Sp-Spalte | Finaler Check |
| Rundenende | Anzahl Spiele = Anzahl Spieler + angesagte Solos | Nach Trennlinie |
| Paarigkeit | F+ muss F− gegenüberstehen (Statistik), K+ muss K− gegenüberstehen (Statistik) | Schritt 6 |
| Plausibilität | Ist das Spiel spielerisch realistisch? (z.B. Schwarz ohne Ansage = sehr unwahrscheinlich) | Finaler Check |
| **Endstand-Abgleich** | **Summe aller Deltas je Spieler = letzter kumulierter Stand im Büchlein** | **Abschluss des Abends** |
| **Spielwert-Rückrechnung** | **Jeder Spielwert unabhängig aus Grundpunkten × Verdopplung ± Sonderpunkten = Sp** | **Abschluss des Abends** |
| **Feigheits-Check** | **Geht der Wert nur auf, wenn ≥3 Level zwischen Ansage und Ergebnis liegen? → Hand heben** | **Abschluss des Abends** |

**Wann nachfragen:**
- Wenn nach eigenem Nachdenken noch echte Unklarheiten bleiben
- Bei Null-Spielen ohne Unterstreichung (wer hat mit wem gespielt?)
- Bei spielerisch unplausiblen Ergebnissen (z.B. sehr hoher Spielwert ohne Ansagen)
- Wenn Re rechnerisch nicht aufgeht und kein C notiert ist

---

## 4a. Verbindlicher Abend-Abschluss-Check (vor dem JSON-Bau!)

Bevor das Import-JSON gebaut wird, IMMER zwei voneinander unabhängige Gesamtprüfungen
durchführen – am besten programmatisch (kleines Python-Skript), das ist schnell und fehlerfrei:

**Check A – Endstand-Abgleich (arithmetisch):**
- Alle Deltas je Spieler über den ganzen Abend aufsummieren
- Ergebnis muss exakt dem **letzten kumulierten Stand im Büchlein** (Spalte, letzte Zeile) entsprechen
- Zusätzlich: Gesamtsumme aller Endstände muss 0 sein
- Findet jeden übersehenen Lese- oder Vorzeichenfehler, der sich sonst versteckt

**Check B – Spielwert-Rückrechnung (inhaltlich):**
- Jeden Spielwert UNABHÄNGIG von den Deltas neu herleiten:
  `(Grundpunkte × Verdopplung) + eigene Sonderpunkte − gegnerische Sonderpunkte`
- Muss den einfachen Spielwert (= Sp, bei Solo Sp/3) ergeben
- Prüft, ob die erfasste Spiel-Logik (Ansagen, Schwellen, Sonderpunkte) den Wert wirklich erzeugt

Erst wenn BEIDE Checks für ALLE Spiele sauber durchlaufen, ist der Abend wasserdicht und das
JSON kann gebaut werden. Die Checks sind unabhängig: A prüft, ob die Zahlen aufgehen, B prüft,
ob die Spiel-Logik den Wert erzeugt. Beide zusammen schließen versteckte Fehler aus.

**Check C – Feigheits-Check (Auffälligkeit, kein Fehler):** Für jedes Spiel den Abstand zwischen
*Ansage* und tatsächlichem *Ergebnis* prüfen. Die Stufen-Leiter (jeweils mitgezählt, **„Gewonnen"
ist die unterste Stufe**): Gewonnen (0) → Keine 90 (1) → Keine 60 (2) → Keine 30 (3) → Schwarz (4).
Eine **Feigheit** liegt vor, wenn `erreichtes Level − angesagtes Level ≥ 3` (Re/Kontra ohne Stufe =
angesagtes Level 0; gar nichts angesagt = Level −1). Beispiele (jeweils 3 Level Abstand):
Re angesagt, Keine 30 gespielt · Keine 90 angesagt, Schwarz gespielt · nichts angesagt, Keine 60
gespielt. **Wichtig: 1 oder 2 Stufen Abstand sind KEINE Feigheit** (normales vorsichtiges Spiel).
**Beim Solo zählt der Solopunkt NICHT als Augen-Stufe** – für den Abstand nur die echten
Augen-Stufen (K90/K60/K30/Schwarz) gegen die Ansage rechnen (Lehre 22.4. R4S3: Wert 9 = Gew +
Solopunkt + K90 + K60; erreichte Augen-Stufe nur K60/Level 2 → Abstand 2 → keine Feigheit).
Bei einer Feigheit die Hand heben und im Spiel-Kommentar vermerken – der Wert ist trotzdem korrekt,
es ist nur eine spielerische Auffälligkeit (jemand hat viel höher gespielt als angesagt). Das
geschaffte Level leitet sich aus den Re-Augen ab, **immer aus Sicht der Gewinner-Partei**
(bei Kontra-Sieg also die Kontra-Augen). Augen-Mapping (Gewinner-Augen): ≥151 = Keine 90,
≥181 = Keine 60, ≥211 = Keine 30, 240 = Schwarz; 121–150 und 91–120 = nur Gewonnen.

**Warum BEIDE nötig sind (Beispiel 3.6.2026):** Beim Solo R1S4 waren in der Prüf-Tabelle
versehentlich Ka und Ja vertauscht (+12 bei Ja statt Ka). Check B lief trotzdem sauber durch –
die Spiel-Logik war ja korrekt. Erst Check A deckte es auf: Endstand Ka/Ja stimmte nicht mit dem
Büchlein. Solche **Übertragungsfehler** (richtig gelesen/gedeutet, aber falsch in Tabelle/JSON
übertragen) fängt nur der Endstand-Abgleich.

**Tipp zur Fehlerlokalisierung:** Wenn Check A scheitert, nicht nur die Endstände, sondern die
**kumulierten Stände Zeile für Zeile** gegen das Büchlein abgleichen (kleines Skript). Eine
Abweichung, die ab einem bestimmten Spiel auftaucht und konstant bleibt, stammt aus genau diesem
einen Spiel. Gegengleiche Abweichungen zweier Spieler (z.B. {Ka −16, Ja +16}) deuten auf eine
Vertauschung/Fehlverteilung genau zwischen diesen beiden.

---

## 5. Arbeitsanweisungen

- **Erst selbst zu Ende denken, dann fragen.** Wenn ein Delta nicht aufgeht oder ein Kürzel unklar ist: erst alle Rechenwege durchgehen, erst dann nachfragen.
- **Spielwert ist immer das Einfache.** Beim Solo: was die Gegner bekommen, nicht das Dreifache des Solisten.
- **Sonderpunkte kommen nach der Verdopplung.** Nie vom bekannten Spielwert abziehen um Grundpunkte zu ermitteln – stattdessen: (Sp − Sonderpunkte) / Verdopplungsfaktor = Grundpunkte.
- **F− ist nur Statistik.** Kein negativer Sonderpunkt, nur eine Notiz wessen Fuchs gefangen wurde.
- **Kürzel gehören zum Spieler davor.** Nie Kürzel der falschen Spalte zuordnen.
- **C ist positiver Indikator, kein negativer Beweis.**
- **Roberts Schrift kennen:** 9↔7, 8↔e, 19↔1J – erst optisch prüfen bevor nachgefragt wird.
- **Fehlende Werte = null**, nie schätzen oder erfinden.
- **Spielwert 1 ⇒ in aller Regel Re-Sieg.** Ein gewonnenes Kontra bringt normalerweise
  „Gewonnen" (+1) UND „Gegen die Alten" (+1) = mindestens 2. AUSNAHME: Gespaltener Arsch
  (genau 120:120) – dort bekommt Kontra NUR „Gegen die Alten" (+1), also Spielwert 1 für Kontra.
  Das ist sehr selten, aber möglich. Im Zweifel über Augen/Kürzel prüfen.
- **Feigheit / Plausi-Auffälligkeit ist ein Anlass zum Gegenprüfen, kein Korrektur-Freibrief.**
  Wenn ein Solist hohe Schwellen schafft, aber gar nichts angesagt hat (≥3 Stufen Abstand =
  „feige"), erst prüfen ob eine Ansage übersehen wurde. Aber wenn das Blatt eindeutig ist und
  Robert sich an nichts erinnert → erfassen wie geschrieben (ohne Ansage), nichts dazuerfinden.
- **Spielwert immer „richtig herum" plausibilisieren.** Alle sichtbaren Kürzel (Ansagen, Absagen,
  Sonderpunkte) sind Pflicht-Input und MÜSSEN in die Rechnung; dann die passende, plausible
  Grundpunkt-Konstellation suchen. Nie von einer angenommenen Konstellation ausgehen und schauen,
  ob sie zufällig passt.
- **„Gegen die Alten" ist ein Grundpunkt** (wird mit-verdoppelt), kein Sonderpunkt. Sonderpunkte
  sind nur Fuchs, Karlchen, Doppelkopf und kommen nach der Verdopplung.
- **3-gegen-1-Regel:** Stimmen drei Deltas überein und eines weicht ab, ist der Spielwert der der
  drei und die eine Zahl falsch gelesen – nicht umgekehrt.
- **Korrektur dreifach gegenprüfen:** Sp-Spalte / optische Re-Inspektion / Folgespiel.
- **Zählung schlägt Roberts Linien; Wellenlinie ≠ Rundenende.** Im Erst-Read Linientypen
  inventarisieren.
- **Kürzel gehören zur Zahl davor, nicht zur optischen Spalte.** Position relativ zu den Zahlen
  schlägt Position relativ zu den Spaltenköpfen.
- **Unterstrichen = Re-Team** (bei Null-Spielen).
- **Runde/Spiel zählen wie im Datenmodell** – Spielnummer startet je Runde neu bei 1.
- **Beide Abschluss-Checks (A und B) sind Pflicht** – B allein übersieht Übertragungsfehler.
- **7↔1 beachten** (Roberts Schrift) – besonders in der Sp-Spalte.
- **NIEMALS eine Ansage erfinden, um einen Wert zu treffen.** Fehlende Grundpunkte = geschaffte
  (nicht angesagte) Schwellen → Augen-Range. Verdopplung nur durch real notierte Re/Kontra-Kürzel.
- **Mathematisch erzwungen ≠ bestätigt.** Erzwungene Ansagen sofort in der Ersterfassung mit ⚠️
  markieren und ZWEIMAL hinschauen, bevor man sie als gelesen präsentiert oder nachfragt.
- **Roberts eigene Fehler sind eine andere Kategorie als Lesefehler:** Personen-Vertauschung bei
  gleichem Betrag, oder kompletter Wert-Fehler mit durchlaufendem Offset. Beide unsichtbar für
  Check A (Quersumme bleibt 0!), nur über Check B / Rückfrage bei Robert auffindbar.
- **Feigheit als Stufen-Logik:** bis 2 Stufen ungesagt geschafft = ok (Kontra + K60 = gerade noch
  durch); ab 3 Stufen (K30 ungesagt) = Verdacht, Finger heben und gegenprüfen.
- **Geber setzt aus (n>4 Spieler:innen).** „−"/Delta 0; Quersumme 0 je Zeile über ALLE Spieler:innen;
  Nullsummen-/±-Prüfung nur über die Aktiven. Fünf sich ändernde Werte in einer Zeile = ein „−"
  wurde als Zahl fehlgelesen.
- **Geber startet je Runde bei Sitz 1; Solo-Geber gibt zweimal** (setzt zweimal hintereinander aus).
- **Spielezahl je Runde aus Zeilen/Solo-Markern ableiten, nie „= Spielerzahl" annehmen.** Verstecktes
  Solo macht aus 5 Spielen 6.
- **Rundengrenzen & Endstand als harte Anker nutzen**, um Runden rückwärts zu verifizieren statt zu raten.
- **Doppelfuchs F+F+ / F−F−** ist möglich (zwei gefangene Füchse) – beide Kürzel hintereinander.
- **Solo in Sp = dreifacher Spielwert.** „12 BS" → einfacher Spielwert 4. Kein Solo-Kürzel in Sp = kein Solo.

---

## 6. Import-JSON Format

> **Entwurf – wird nach Fertigstellung des Datenbankschemas (Phase 1) finalisiert.**
> Das JSON ist **menschenlesbar** gehalten – also mit sprechenden Namen statt echter DB-IDs.
> Ein Import-Script (gebaut von Claude Code, Anweisungen dazu später in der CLAUDE.md) übersetzt
> dieses Format beim Einspielen in die echten Datenbank-IDs.
> Fehlende Werte werden als `null` gesetzt – nie schätzen oder erfinden.

```json
{
  "session": {
    "date": "2026-05-27",
    "group_id": "jan-runde",
    "venue_id": null,
    "status": "completed"
  },
  "rounds": [
    {
      "number": 1,
      "status": "completed",
      "participations": [
        { "player_id": "jan",    "seat_position": 1 },
        { "player_id": "robert", "seat_position": 2 },
        { "player_id": "dani",   "seat_position": 3 },
        { "player_id": "sophia", "seat_position": 4 }
      ],
      "games": [
        {
          "number": 1,
          "game_type": "normal",
          "solo_color": null,
          "augen_re": null,
          "augen_re_min": null,
          "augen_re_max": null,
          "timestamp": null,
          "results": [
            { "player_id": "jan",    "party": "re",     "special_role": null, "points": 2  },
            { "player_id": "robert", "party": "kontra", "special_role": null, "points": -2 },
            { "player_id": "dani",   "party": "kontra", "special_role": null, "points": -2 },
            { "player_id": "sophia", "party": "re",     "special_role": null, "points": 2  }
          ],
          "announcements": [],
          "special_points": []
        },
        {
          "number": 2,
          "game_type": "armut",
          "solo_color": null,
          "augen_re": null,
          "augen_re_min": null,
          "augen_re_max": null,
          "timestamp": null,
          "results": [
            { "player_id": "jan",    "party": "re", "special_role": "retter",  "points": 2  },
            { "player_id": "robert", "party": "re", "special_role": "armut",   "points": 2  },
            { "player_id": "dani",   "party": "kontra", "special_role": null,  "points": -2 },
            { "player_id": "sophia", "party": "kontra", "special_role": null,  "points": -2 }
          ],
          "announcements": [],
          "special_points": [
            { "player_id": "jan",  "type": "fuchs_gefangen", "loser_id": "dani" }
          ]
        }
      ]
    }
  ]
}
```

### Spieltypen (game_type)
| Wert | Bedeutung |
|------|-----------|
| `normal` | Normalspiel |
| `hochzeit` | Hochzeit |
| `armut` | Armut |
| `fleischlos` | Fleischloses Solo |
| `buben_solo` | Buben-Solo |
| `damen_solo` | Damen-Solo |
| `farb_solo` | Farb-Solo (+ solo_color: "karo"/"herz"/"pik"/"kreuz") |
| `stilles_solo` | Stilles Solo |

### Sonderrollen (special_role)
| Wert | Bedeutung |
|------|-----------|
| `solist` | Solist:in |
| `hochzeiter` | Hat die Hochzeit |
| `eingeheiratet` | Hat eingeheiratet |
| `armut` | Hat Armut gespielt |
| `retter` | Hat die Armut gerettet |

### Ansage-Typen (announcements)
| Wert | Bedeutung |
|------|-----------|
| `re` | Re angesagt |
| `kontra` | Kontra angesagt |
| `keine_90` | Keine 90 angesagt |
| `keine_60` | Keine 60 angesagt |
| `keine_30` | Keine 30 angesagt |
| `schwarz` | Schwarz angesagt |

### Sonderpunkt-Typen (special_points)
| Wert | Bedeutung | loser_id? |
|------|-----------|-----------|
| `fuchs_gefangen` | Fuchs gefangen | Ja (wer hat verloren) |
| `karlchen_gemacht` | Karlchen gemacht | Nein |
| `karlchen_gefangen` | Karlchen gefangen | Ja (wer hat verloren) |
| `doppelkopf` | Doppelkopf (40+ Augen) | Nein |

---

## 7. Offene Nachfragen (aktueller Abend)

### Abend 29.4.2026

| Spiel | Nachfrage | Status |
|-------|-----------|--------|
| 14 | Widerspruch R (Ka) vs. H (Ro) | ✓ Geklärt: R gehört zu Ro (Hochzeit+Re), Ja+Ka = Kontra-Sieger |
| 16 | Null-Spiel ohne Unterstreichung – wer mit wem? | ✓ Geklärt: Ja+Ka (Re) gegen Jö+Ro (Kontra) |

Keine offenen Punkte mehr – Abend vollständig.

### Abend 27.5.2026

| Spiel | Nachfrage | Status |
|-------|-----------|--------|
| 8  | Wer hat mit wem gespielt? (Null-Spiel, keine Unterstreichung) | ✓ Geklärt: Ro+So gegen Ja+Da |
| 9  | Fehlende Ansagen – Jan hat Re angesagt, K60 geschafft | ✓ Geklärt |
| 13 | Fehlende Ansage – K30 ohne Ansage unplausibel | Offen – bei Robert klären |

### Abend 3.6.2026

| Spiel | Nachfrage | Status |
|-------|-----------|--------|
| R3/S2 | Re oder Kontra? Wert 4 ohne sichtbare Ansage. Re-Default ⇒ K30 ohne Ansage (unplausibel); Kontra (C vergessen) ⇒ K60, plausibler. Auge kann es nicht entscheiden. | ⏳ Vorläufig als Re-Sieg angenommen (Annahme: Robert hat korrekt aufgeschrieben). Verifikation bei Robert ausstehend – ggf. später korrigieren (dann Schwelle K60, Range 181–210; Wert bleibt 4) |

### Abend 10.6.2026

Alle ursprünglich offenen Punkte (R1·S3 Konstellation, R4·S1 Wert-Diskrepanz, vier
„mathematisch erzwungene" Ansagen in R1·S5/R3·S1/R3·S3/R3·S5, diverse Sonderpunkte und
Sonderspiele) sind geklärt – siehe Lernprotokoll und Abschnitt 9. Keine offenen Punkte mehr.

**Status-Typen:** ✓ Geklärt · Offen (im Chat mit Jan zu klären) · **⏳ Vorläufig angenommen,
Verifikation bei externer Quelle (Robert) ausstehend** – mit Default-Annahme weiterarbeiten,
Wiedervorlage-Flag setzen. Diese dritte Sorte greift, wenn weder Logik noch das menschliche Auge
die Frage lösen können.

### Abend 22.4.2026

| Spiel | Nachfrage | Status |
|-------|-----------|--------|
| R1S4 | ⚠️ „1 SP fehlt" (F+ oder K+?) | ✓ Geklärt: Jan K+ (Karlchen gefangen), Ro K− Gegenstück – Wert paarig, Kontostände unverändert |
| R4S1 | Null-Spiel: Re-Team? | ✓ Geklärt (Jan): Re = Ro+So (verloren, +Doppelfuchs), Kontra = Da+Ja (Gewonnen+GgdA) → netto 0. Ro F+F+ ↔ Ja F− **und** Da F− |
| R4S2 | Sonderpunkte? | ✓ Geklärt (Jan): Ja K+ ↔ Da K− (Karlchen). Wert 1 = Gew+K90=2 −1 Karlchen |
| R4S4 | Sonderpunkte? | ✓ Geklärt (Jan): Ja K+ ↔ Da K− (Karlchen) UND Ro F+ ↔ Ja F− (Fuchs). SP heben sich auf → Wert 2 = Gew+K90 |
| R4S3 | Feigheit? | ✓ Keine Feigheit: Wert 9 = Gew+Solopunkt+K90+K60 (×2 Re +DK). Erreichte Augen-Stufe nur K60 (Level 2), Re angesagt → Abstand 2 |
| R4 gesamt | Block unleserlich | ✓ Geklärt: per Anker-Methode (Endstand + Ja/Ro-Spalten vorgelesen) eindeutig rekonstruiert |

Keine offenen Punkte mehr – Abend vollständig.

---

## 8. Lernprotokoll Roberts Schrift

| Beobachtung | Gelernt am |
|-------------|------------|
| 9 kann wie 7 aussehen | 27.5.2026 |
| 8 kann wie „e" aussehen | 27.5.2026 |
| 19 kann wie „1J" aussehen | 27.5.2026 |
| Durchgestrichene erste Spalte = Schreibfehler, ignorieren | 27.5.2026 |
| Null-Spiele: zwei Namen unterstrichen = haben zusammengespielt | 27.5.2026 |
| C in Sp wird manchmal vergessen | 27.5.2026 |
| Ansagen werden manchmal nicht vollständig notiert | 27.5.2026 |
| 10 kann wie 20 aussehen (führende 1 / Schleife) | 29.4.2026 |
| 9 kann wie 5 aussehen | 29.4.2026 |
| F+ kann wie „E+" aussehen – wenn ein F− in der Zeile ist, ist es ein F+ | 29.4.2026 |
| A (Armut) und R (Re) können verwechselt werden | 29.4.2026 |
| Häufigster Fehler: Zeilenversatz beim spaltenübergreifenden Lesen → IMMER spaltenweise lesen | 29.4.2026 |
| Sonderpunkt-/Fuchs-Kürzel sind oft nach rechts gezogen und sehen aus wie Nachbarzeile/-spalte | 29.4.2026 |
| 7 kann wie 1 aussehen (v.a. in der Sp-Spalte) – „7" entpuppt sich oft als „1" | 3.6.2026 |
| 17 (mit Kürzel dahinter) kann wie „1 R" aussehen – führende 1 + Schnörkel verschmilzt | 3.6.2026 |
| Verkritzelte/korrigierte Ziffern: vermeintliche führende Ziffer ist oft Durchgekritzeltes (−15→−5, −2x→−24) | 3.6.2026 |
| Wellenlinie = von Robert durchgestrichene/ungültige Trennlinie (≠ Rundenende) | 3.6.2026 |
| Kürzel-Ketten ragen weit in die optische Nachbarspalte – Zuordnung über Zahl-Position, nicht Spaltenbreite | 3.6.2026 |
| Unterstreichung bei Null-Spiel = Re-Team (ab 4.6.2026 mit Robert so festgelegt) | 3.6.2026 |
| 8 kann wie 4 aussehen (24↔28 am Zeilenrand) | 10.6.2026 |
| 4 kann wie 2 aussehen / 6 kann wie 2 aussehen (−24↔−22, −16↔−22 am Rand) | 10.6.2026 |
| Erfundenes führendes „−": ein Schnörkel/Vorzeile lässt „18" wie „−18" aussehen | 10.6.2026 |
| „9" direkt hinter einer Zahl ist eine Absage-Ziffer (Keine 90), KEIN eigener Stand und kein Vorzeichen | 10.6.2026 |
| Aussetzer-„−" wird leicht als Zahl gelesen → Zeilenversatz (Jans „6F−" gehörte ins Spiel danach) | 10.6.2026 |
| Doppelfuchs F+F+ bzw. F−F− (zwei gefangene Füchse) | 10.6.2026 |
| Solo-Kürzel in Sp: FL = Fleischlos, DS = Damensolo (Wert ist 3-fach, „6 FL" = einfach 2) | 10.6.2026 |
| Doppelfuchs-Fänger/Verlierer können beim ersten Lesen vertauscht aussehen (F+F+/F−F− steht bei wem?) | 10.6.2026 |
| Mathematisch erzwungene Ansagen sind beim zweiten, gezielten Hinschauen fast immer real vorhanden | 10.6.2026 |
| Robert kann ein ganzes Spiel mit falschem Wert verbuchen (nicht nur Personen vertauschen) – Quersumme bleibt trotzdem 0 | 10.6.2026 |
| Anker-Methode: Endstand + 2 vorgelesene Spalten erzwingen eine ganze unleserliche Runde rechnerisch | 22.4.2026 |
| Kürzel kann zur Nachbarzeile gehören – wenn es den Wert seiner optischen Zeile sprengt, über die Zahl zuordnen (RDK gehörte zur Solo-Zeile) | 22.4.2026 |
| Doppelfuchs F+F+ (+2) gleicht Grundpunkt-Sieg von 2 exakt zu Null-Spiel aus | 22.4.2026 |
| PFLICHT: jedes F+ braucht ein F−, jedes K+ ein K− – F+F+ ⇒ ZWEI F−. Geht Paarigkeit nicht auf = Zeilenversatz beim SP, richtige Zeile suchen (nicht erfinden) | 22.4.2026 |
| Bubensolo-Wert 9 = (Gew+K90+K60+K30)=4 ×2(Re) +1(DK); Sp zeigt 3×9 = „27 BS"; im Solo kein „Gegen die Alten" | 22.4.2026 |
| Feigheits-Check für JEDES Spiel programmatisch (≥3 Level Ansage↔Ergebnis, „Gewonnen" zählt mit) – nicht nur stichprobenartig; am 22.4. gab es NULL Feigheiten | 22.4.2026 |
| Beim Solo ist der Solopunkt ein eigener Grundpunkt, aber KEINE Augen-Stufe – beim Feigheits-Check nicht mitzählen (R4S3: Wert 9 = Gew+Solopunkt+K90+K60, nur Level 2) | 22.4.2026 |

---

## 9. Vollständig transkribierte Abende

| Datum | Spieler | Spiele | Runden | Offene Fragen | Status |
|-------|---------|--------|--------|---------------|--------|
| 27.5.2026 | Ja, Ro, Da, So | 13 | 3 (inkl. 1 Solo) | Spiel 13: Ansage fehlt | Fast komplett |
| 29.4.2026 | Ja, Jö, Ka, Ro | 18 | 4 (inkl. 2 Solos in R3, 1 Null-Spiel in R4) | keine | ✓ Komplett |
| 3.6.2026 | Ka, Ja, Ro, Da | 13 | 3 (inkl. 1 Bubensolo in R1, 1 Null-Spiel in R3) | R3/S2: Re/Kontra bei Robert verifizieren | ⏳ Inhaltlich verifiziert (beide Abschluss-Checks ok), 1 Robert-Rückfrage offen; JSON wartet auf Roberts Antwort |
| 10.6.2026 | Ja, Ro, Ka, So, Da (**5 Spieler:innen**) | 23 | 4 (R1: 6 Sp. inkl. Ja-Damensolo · R2: 5 Sp. · R3: 6 Sp. inkl. Ro-Damensolo + Hochzeit · R4: 6 Sp. inkl. Ja-Fleischlos-Solo + Hochzeit) | keine | ✓ Komplett – JSON erstellt (`dokorama_import_2026-06-10.json`), inkl. zwei korrigierter Robert-Schreibfehler (R1·S3 Personentausch, R4·S1 Wert 3→6) |
| 22.4.2026 | So, Da, Ja, Ro | 19 | 4 (R1: 4 Sp. · R2: 5 Sp. inkl. So-Bubensolo · R3: 5 Sp. inkl. Ro-Damensolo · R4: 5 Sp. inkl. So-Bubensolo) | keine | ✓ Komplett – Endstand So 9 / Da −9 / Ja 13 / Ro −13 deckt sich exakt mit Büchlein (kein Robert-Fehler). R4 per Anker-Methode rekonstruiert; Sonderpunkte über Paarigkeitscheck (R4S1 F+F+/2×F−, R4S2 K+/K−, R4S4 K+/K− + F+/F−). R3S4 Damensolo mit Re-Ansage. R1S4 um Jan-K+/Ro-K− ergänzt. JSON ausstehend |

---

## 10. Augen-Felder: echt vs. historisch

Roberts Büchlein enthält keine Augenzahlen. Stattdessen lässt sich aus dem Spielwert und den
Ansagen/Absagen eine exakte Range ableiten (immer genau 29 Punkte breit):

| Feld | Wann gesetzt | Bedeutung |
|------|-------------|-----------|
| `augen_re` | Nur bei App-Erfassung | Echter gezählter Wert |
| `augen_re_min` | Nur bei historischem Import | Untergrenze der Range |
| `augen_re_max` | Nur bei historischem Import | Obergrenze der Range |

Nie `augen_re` UND `augen_re_min/max` gleichzeitig setzen.

**Range-Grenzen** (aus Sicht der Re-Partei, Gesamtaugen = 240):
- Kontra gewinnt (gespaltener Arsch oder knapp): augen_re 91–120
- Re gewinnt knapp (nur Gewonnen): 121–150
- Keine 90 geschafft: 151–180
- Keine 60 geschafft: 181–210
- Keine 30 geschafft: 211–239
- Schwarz: 240 (exakt, keine Range)
