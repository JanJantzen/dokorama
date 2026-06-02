# ROBERT_IMPORT.md – Gedächtnis für den Foto-Import aus Roberts Büchlein

> Diese Datei ist das Gedächtnis für Claude beim Transkribieren von Roberts handgeschriebenen
> Spielabenden in das Dokorama-Import-JSON-Format.
> Sie wird zu Beginn jedes Import-Chats gelesen und nach jedem Abend aktualisiert.
> Letzte Aktualisierung: 1. Juni 2026 – zweiter Abend transkribiert (29.4.2026, 18 Spiele/4 Runden); neue Learnings: spaltenweises Lesen, K=Karlchen/C=Kontra, Solo-Sp=3×Wert (BS/DS), Spielwert-1=Re, Null-Spiel-Erkennung

---

## 1. Struktur von Roberts Büchlein

### Tabellenaufbau

- Jede Seite = ein Spielabend
- **Datum** steht oben rechts (z.B. „27.5.")
- **Erste Zeile** = Spaltenköpfe: Spielernamen-Kürzel + letzte Spalte „Sp" (Spielwert)
- **Jede weitere Zeile** = ein Spiel, mit dem **kumulierten Spielstand** je Spieler:in + Kürzeln
- **Trennlinien** markieren das Ende einer Runde

### Wichtige Grundregeln

- Die Zahlen in den Spieler-Spalten sind **kumulierte Spielstände**, NICHT Deltas!
  → Deltas immer erst selbst berechnen: aktueller Stand minus vorheriger Stand
- Kürzel stehen **direkt hinter der Zahl** des jeweiligen Spielers (z.B. „4 F+" = Stand 4, Fuchs gefangen)
- Kürzel können **direkt aneinandergehängt** sein ohne Trennzeichen (z.B. „8 R96" = Stand 8, Re angesagt + Keine 90 + Keine 60). Die Kürzel müssen selbst auseinandergelesen werden.
- Die **nächste eigenständige Zahl** (die keine Absage-Ziffer ist) gehört zur nächsten Spalte. Absage-Ziffern 9, 6, 3, 0 sind immer Teil der Kürzel-Kette, nie ein eigenständiger Spielstand.
- Kürzel in der **Sp-Spalte** enthalten NUR: Spielwert (Zahl) + optional C + optional Solo-Typ (FL etc.). Niemals Ansage-Kürzel (R, K, 9, 6, 3, 0) – diese stehen immer bei den Spielern!
- Roberts Handschrift: **9 kann wie 7 aussehen**, **8 kann wie „e" aussehen**, **19 kann wie „1J" aussehen**
  → Wenn ein Delta nicht aufgeht: erst prüfen ob eine Zahl falsch gelesen wurde, bevor nachgefragt wird

### Schreibfehler und Korrekturen

- Durchgestrichene Spalten = Schreibfehler, komplett ignorieren
- Fehlende Kürzel (z.B. vergessenes C) sind möglich → Plausibilitätsprüfung!

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

**Vorgehen:**
1. Alle fünf (bzw. n+1) Spalten einzeln einlesen: Ja, Jö, Ka, Ro, …, Sp
2. Die **Sp-Spalte gleich mit-einlesen** – sie ist die Spielwert-Kontrolle UND der Solo-Indikator
3. Erst dann zeilenweise die Deltas rechnen

**Bei einer einzelnen Abweichung (Delta geht nicht auf):**
- Erkennen, welche *eine* Zahl aus dem Muster fällt
- Berechnen, was dort stehen *müsste*
- Prüfen, ob ein Lesefehler / unsaubere Schreibweise plausibel ist (siehe Schrift-Lernprotokoll)
- Mit dem Delta des **Folgespiels** gegenprüfen (geht das nächste Spiel mit der Korrektur auf?)
- Erst wenn das alles nicht greift: bei Jan nachfragen

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

- Robert unterstreicht die kumulierten Spielstände von **zwei Spieler:innen** → diese haben zusammengespielt
- Hat er das vergessen → nachfragen wer mit wem gespielt hat
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
- Ausnahme: Null-Spiel → Vorzeichen helfen nicht, Robert unterstreicht zwei Namen
- **Null-Spiel-Erkennung:** Bei einem Null-Spiel (Sp=0) ändern sich die kumulierten Stände
  NICHT – alle vier Deltas sind 0. Das ist das sichere Erkennungsmerkmal (zusätzlich zur
  Unterstreichung). Ein gefangener Fuchs wirkt dabei teamrelativ (+1 eigenes Team / −1
  Gegnerteam) und kann den Sieg-Grundpunkt exakt ausgleichen → netto 0 für alle.
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

**Finaler Sanity Check: Spielwert nachrechnen**
- Grundpunkte berechnen (was wurde erreicht?)
- Verdopplung durch Ansagen anwenden
- Sonderpunkte addieren/abziehen (NACH der Verdopplung!)
- Ergebnis muss mit Sp-Spalte übereinstimmen
- **Spielwert beim Solo = was die Gegner bekommen** (einfach), nicht das Dreifache des Solisten!

---

## 3a. Standard-Tabellenformat (Anzeige je Runde)

Nach jeder gelesenen Runde wird Jan die Runde in diesem Format gezeigt – konsequent
**nur die Gewinnerpartei**:

| # | Gewinner | Art | Partei | Ansage | Schwelle | Range | Sonderpunkte (Gew. \| Gegner) | Wert |

- **#**: Spielnummer (fortlaufend über den Abend)
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

---

## 9. Vollständig transkribierte Abende

| Datum | Spieler | Spiele | Runden | Offene Fragen | Status |
|-------|---------|--------|--------|---------------|--------|
| 27.5.2026 | Ja, Ro, Da, So | 13 | 3 (inkl. 1 Solo) | Spiel 13: Ansage fehlt | Fast komplett |
| 29.4.2026 | Ja, Jö, Ka, Ro | 18 | 4 (inkl. 2 Solos in R3, 1 Null-Spiel in R4) | keine | ✓ Komplett |

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
