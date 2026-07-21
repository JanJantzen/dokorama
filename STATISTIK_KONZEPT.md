# Dokorama – Statistik-Konzept (Block C)

> **Status:** Fertiges Konzeptdokument, analog zu KONSISTENZREGELN.md und ROBERT_IMPORT.md – die eine
> vollständige Quelle für alle Statistik-Details. **Nicht** direkt die Roadmap oder die CLAUDE.md:
> Die Übernahme in Roadmap Block C (reine Bau-Reihenfolge, verweist hierher) und in CLAUDE.md
> Abschnitt 7 (kurzer Überblick, verweist hierher) ist ein eigener **Claude-Code-Auftrag**.
>
> **Aufbau des Dokuments:** Grundprinzipien → Querschnitts-Achsen (Ebenen, Zeiträume, Normierung,
> Datenqualität, Stichprobe) → Master-Tabelle → Block 1–7 (Leistung, Ausdauer, Risiko, Solo,
> Sonderspiele, Sonderpunkte, Gesamtscore) im Detail → Kuriositätenkabinett, Teamplay, Hall of Fame,
> Ort → Darreichungsform (Navigation, Nerd-Modus, alle sechs Einstiege, alle drei Steckbrief-Typen) →
> Priorisierung / Bau-Reihenfolge.

> ⚠️ **Wording-Konsistenzregel:** Es heißt durchgängig **Partie**, niemals „Abend" oder „Spieltag".
> Die Ebenen sind ausschließlich **Spiel / Runde / Partie**. Bei der Hochzeit: „jemand **hat eine
> Hochzeit**" / „jemand **ist eingeheiratet**" – NICHT „Hochzeiter:in". Feststehender Begriff
> **„trumpfschwach"** = höchster Trumpf maximal ein Fuchs (kann selbst keinen Fuchs stechen).
> (Vgl. KONSISTENZREGELN.md.)

---

## Grundprinzipien (übergeordnet, gelten für das gesamte Statistik-Konzept)

**P1 – Auf dem vollen Modell entwerfen.**
Jede Statistik wird so konzipiert, als läge jedes Spiel vollständig (App-erfasst) vor. Keine Kennzahl
wird beschnitten, weil historische Daten sie nicht füllen können. Wir designen für die Zukunft, in die
hinein wir erfassen – die historischen Lücken sind ein zu lösendes Detail, keine Designgrenze.

**P2 – Datenqualität ist abgeleitet, pro Spiel und pro Feld, niemals nach Jahr verdrahtet.**
Ob ein Spiel eine Kennzahl bedienen kann, ergibt sich allein daraus, ob die nötigen Felder real
vorhanden sind – nicht aus dem Datum. Die Qualitätsgrenze läuft nachweislich mitten durch Zeiträume
(Beispiel 2026: 12 aus dem Buch abgeschriebene Spiele mit Augen-Range + ab 17.06. App-Erfassung,
davon zunächst nur 1 wirklich vollständig). Bekannte Lückenarten:
- Augen nur als Range (`augen_re_min/max`) statt exakt (`augen_re`) – abgeschriebene Buchspiele
- Sonderpunkt ohne Gegenseite (`verlierer_id` leer) – z. B. 2024: „gefangen" notiert, „von wem" nicht
- Farb-Solo ohne Farbe (`farbe`-Feld leer) – z. B. 2024
- Füchse 2024 offenbar gar nicht erfasst (in Daten zu prüfen)

**P3 – Echte 0 ≠ fehlender Wert.**
Eine Kennzahl muss „ist nicht passiert" (echte 0) von „wurde nicht erfasst" (Lücke) unterscheiden.
Sonst entstehen plausibel aussehende, aber falsche Zahlen – besonders gefährlich bei Quoten/Schnitten,
wo unvollständige Erfassung den Nenner still verzerrt. (Die alte 2024-Tabelle hat das intuitiv schon
richtig gemacht: leere Zelle statt „0 %", wo nie etwas vorlag.)

**P4 – Lückenbehandlung ist reservierter, noch offener Platz.**
Wie Lücken dem Nutzer gegenüber aufgelöst werden (lokaler Hinweis pro Kennzahl / globaler
Reinheitsfilter / Ausschluss / einstellbare Leitplanken) ist bewusst noch nicht entschieden.
Tendenz: lokale Transparenz pro Kennzahl als Alltag, globaler Filter als Notbremse.

**P5 – Jede Kennzahl trägt ein Datenanforderungs-Profil.**
Als Nebenprodukt notieren wir bei jeder Kennzahl, welche Felder/Einträge sie braucht. Daraus ergibt
sich automatisch, wo Lückenbehandlung (P4) greifen muss.

**P6 – Mindest-Stichprobe / statistische Belastbarkeit.** *(zentrales Prinzip + offene Schwelle)*
Quoten und Durchschnitte von Spieler:innen mit sehr wenigen Einheiten sind exakt erfasst, aber
statistisch bedeutungslos (Beispiel 2024: Louisa 1 Partie → Siegquote 100 %, Soloquote 100 %).
Betrifft ALLES Quoten- und Durchschnittsartige; absolute Zahlen sind immun. Mögliche Lösungen
(Schwelle noch offen): Mindest-Schwelle vor Anzeige/Ranking · visuelle Dämpfung/Konfidenzhinweis ·
statistische Glättung gegen Gruppenschnitt · Filter „nur ab X Einheiten". Konzeptionell neben P4
(beides „Umgang mit nicht voll belastbaren Zahlen", verschiedene Ursachen).
**Zentral & arbeitssparend:** P6 ist der EINE globale Filter, der entscheidet, wann eine Quote
belastbar genug zum Anzeigen ist. Deshalb müssen einzelne Kennzahlen NICHT lokal „hier macht eine
Quote keinen Sinn" wegdefinieren (z. B. bei seltenen Vitrinen-Stücken) – das erledigt P6 automatisch.
Alle Kennzahlen dürfen schlicht „Häufigkeit + Quote" führen; P6 blendet zu dünne Quoten aus.

> **Idee, kein Scope jetzt – Vollständigkeits-Landkarte.** Entwickler-Werkzeug/Abfrage, das zeigt,
> wie gut welche Felder über den Bestand gefüllt sind. Macht „in die Daten schauen statt hardcoden"
> datenbasiert. Reine Idee.

---

## Querschnitts-Achsen (Schritt 2)


Dimensionen, die QUER durch viele Kennzahlen laufen (statt zu einer einzelnen zu gehören). Hier einmal
zentral definiert; bei den Kennzahlen nur noch referenziert.

- **Achse 1 – Ebenen:** Spiel / Runde / Partie. Grundsatz wie beim Vorrat: definieren, welche Ebenen
  eine Kennzahl tragen KANN; nur ausklammern, was strukturell unmöglich ist. Welche Ebene zuerst
  angezeigt wird (Standard vs. Drilldown) = Darreichung, Schritt 3. Realisiert über die Spalte
  „Ebenen (kann)" in jeder Master-Tabellen-Zeile – keine separate Matrix nötig.
- **Achse 2 – Zeitraum (universeller Filter, liegt über ALLEM):** Statt Spezial-Bereiche („Jahresbeste"
  etc.) ist der Zeitraum eine generische Achse, die auf JEDE Kennzahl UND jede Schau-Kategorie
  (auch Hall of Fame) angewendet werden darf. „Jahresbester 2025" = Hall of Fame + Jahresfilter, kein
  eigenes Konzept. Mögliche Zeiträume (im Vorrat ALLE, V1-Auswahl erst in Schritt 3):
  - **Total** (gesamte Historie, ewige Bilanz)
  - **Kalenderjahr** (pro Jahr, inkl. laufendem) → erlaubt Jahresvergleiche & macht Entwicklung sichtbar
  - **Quartal / Monat / frei wählbarer Zeitraum** (feinere Filter)
  Der Filter „macht nicht immer Sinn" (z. B. Streak nach Jahr), DARF aber überall gesetzt werden – der
  Nutzer zieht sich, was er will. Wann er ANGEZEIGT wird = Darreichung (Schritt 3).
  *Methodik-Erinnerung:* Vorrat = ALLES Mögliche, auch Zukunft; nicht vorab kürzen.
  *Streak über Jahresgrenze (gelöst durch universellen Filter):* Die „echte" Streak ist die Total-Sicht
  (durchgängig, Jahreswechsel bricht NICHT). Mit Jahresfilter sieht man nur den Teil der Serie INNERHALB
  des Jahres. Zwei Sichten auf dasselbe, kein Widerspruch.
- **Achse 3 – Normierung:** „pro 4 Runden" = künstliche **Standard-Partie** (4 Runden = typische
  Partie; eine Runde = jeder am Tisch einmal Geber, bei Solos entsprechend mehr Spiele). V1: die 4
  hardcoded.
  **Basis ist die RUNDE, nicht das Spiel** (festgelegt): Eine Runde ist eine Runde – egal ob sie wegen
  vieler Spieler oder vieler Solos länger war. Auf Spiele umzurechnen würde Runden mit vielen Solos/
  großen Tischen verzerren; die Runde ist die robuste, tischgrößen- und solo-invariante Zähleinheit,
  der Durchschnitt gleicht Längenschwankungen aus.
  **Formel:** `Wert pro 4 Runden = Summe der Kennzahl ÷ Anzahl meiner gespielten Runden × 4`.
  „Gespielte Runden" = Runden, an denen ICH teilnahm (nicht die der Gruppe) → fair für Spätankömmlinge/
  Früh-Geher.
  **Gilt nur für absolute Mengen/Summen** (Häufigkeiten wie Karlchen/Solos/Ansagen; Punkt-Salden wie
  Mut-/Solo-Ertrag), **NICHT für Quoten** (sind schon Verhältnisse – „82 % pro 4R" wäre Unsinn) und
  **NICHT für reine Ausdauer-Mengen** (da IST die Absolutzahl die Aussage, Block 2).
  Sonderfall **Gebe-Mehrlast (A5):** als % über Norm statt Roh-pro-4R (Rohwert läge bei allen nahe 4).
- **Achse 4 – Datenqualität (P2/P3) & Stichprobe (P6):** Querschnitt über alle Kennzahlen.
  **Darreichungs-Regel bei Teil-Lücke im gewählten Zeitraum (festgelegt, Option C):** Kennzahl ZEIGEN
  ab Datenbeginn + Transparenzhinweis („Daten erst ab …"). NIEMALS als 0 verfälschen (P3), NIEMALS die
  ganze Kennzahl sperren/ausblenden (verschenkt belastbare neuere Daten). Beispiel: Fuchs-Bilanz bei
  „Total" zeigt den Wert ab 2025 + Hinweis. *Wie* der Hinweis aussieht = Schritt 3.
  **These „Stichtag, dann lückenlos":** Kennzahlen kommen an klaren Zeitpunkten dazu und sind danach
  lückenlos (kein Schweizer Käse) → wenige, saubere Brüche → Lückenbehandlung simpel. **Mit der
  Vollständigkeits-Landkarte zu VERIFIZIEREN, wenn alle Daten da sind.**
  **NICHT hardcoden:** Logik leitet pro Spiel/Feld ab (P2); der Zeitstrahl unten ist nur die ERWARTETE
  Realität zum Abgleich, nicht in Code gegossene Datumsgrenzen.

  **Erwarteter Daten-Zeitstrahl (Hypothesen):**
  - **Augen-Ranges statt exakter Punktzahl:** gilt für ALLE abgeschriebenen Buchspiele – also 2024,
    2025 UND 2026 bis 16.7. (Robert notierte nie exakte Augen, nur das Ergebnis). Exakte Punktzahl erst
    ab App-Erfassung (17.6.2026).
  - **2024:** zusätzlich fehlt kompletter **Fuchs** (gefangen + verloren) + **Karlchen-Verliererseite**
    (wer verloren hat). Rest vorhanden.
  - **2025:** vermutlich vollständig außer Gebeversuchen (und exakter Punktzahl, s. o.). *Unsicher – zu
    prüfen.*
  - **2026 bis 16.7.:** abgeschriebene Buchspiele → Augen-Ranges, **keine Gebeversuche**. Rest da.
  - **ab 17.6.2026:** Vollerfassung (App), exakte Punktzahl. Feinheit: **Gebeversuche** erst ab der
    Partie NACH dem 17.6.
  - Bruchstellen also: Fuchs ab 2025 · Karlchen-Verliererseite ab 2025 · **exakte Punktzahl ab 17.6.2026
    (davor durchgehend Ranges)** · Gebeversuche ab Partie nach 17.6.2026. → (a) klare Brüche, (b) wenige
    Brüche.

  **Stichprobe (P6):** quotenartige Kennzahlen → P6-Filter (s. Prinzip P6); absolute Zahlen immun.

- **Achse 5 – Personen-Filter (universeller Filter, analog Zeitraum):** Auf beliebige bestehende
  Kennzahlen anwendbar (z. B. L1–L9, T1), eingeschränkt auf Spiele mit einer gewählten
  Personen-Konstellation (2, 3 oder 4 von 4 Mitspieler:innen). Beispiel: „nur Robert + ich" →
  Head-to-Head-artige Sicht auf L2 (Erster), beschränkt auf gemeinsame Spiele. Kein eigener
  Datentopf, keine eigene Kennzahl – reine Einschränkung des Nenners, wie der Zeitraum-Filter (Achse
  2). Details (welche Kennzahlen sinnvoll filterbar, UI) = Darreichung, Schritt 3.

### Universelles Darreichungs-Muster: Kompakt → Vollliste → Steckbrief (für Schritt 3)
*Ändert NICHTS an der Statistik-Definition – wie bei jeder rankingfähigen Kennzahl (fast alle
Kennzahlen im Dokument, plus Ort ab jetzt) präsentiert wird. Einmal hier zentral notiert, damit es
in Schritt 3 nicht pro Block neu erfunden wird.*

Drei Ebenen, dieselbe Kennzahl, wachsender Detailgrad:
1. **Kompakt-Ansicht:** Top 3 (z. B. „Meiste Gesamtpunkte: 1. Jan, 2. Robert, 3. …").
2. **Klick auf die Kennzahl selbst:** vollständige, sortierte Rangliste aller Beteiligten (alle
   Spieler bzw. alle Orte).
3. **Klick auf eine EINZELNE Person/einen einzelnen Ort innerhalb der Liste:** Perspektivwechsel –
   weg von „KPI zuerst, Personen/Orte als Werte darunter" hin zu „Person/Ort zuerst, alle ihre
   Top-Werte darunter" (**Spieler-Steckbrief** bzw. **Ort-Steckbrief**). Beim Ort-Steckbrief gehören
   dazu auch die Rekorde (HOF) und Kuriositäten (KUR), die an diesem Ort passiert sind – dieselben
   Einträge wie in KUR/HOF, nur nach Ort statt nach Person/Zeit sortiert aufgerufen.

Ein Master-Detail-Muster, das sich für Spieler UND für Orte wiederholt – kein separater Mechanismus
je Block, sondern ein wiederverwendbares Bauteil.

**Dritter Anwendungsfall: Partie-Steckbrief („Stats of the Party", vgl. CLAUDE.md).** Dieselbe
Steckbrief-Logik wie bei Spieler/Ort, nur mit der **Partie** als Subjekt statt als Filter: eine
kuratierte Mini-Statistik-Auswahl bezogen auf genau einen Abend (Endstand, bester/schlechtester
Einzelspielwert des Abends, Anzahl Solos/Sonderpunkte/Sonderspiele, Verlaufskurve über die Spiele
dieser Partie). Kein eigener Datentopf und kein eigenes Konzept-Kapitel – reine Kuratierung
bestehender Kennzahlen, gefiltert/aggregiert auf eine einzelne Partie, genau wie Spieler- und
Ort-Steckbrief auf eine einzelne Person bzw. einen einzelnen Ort filtern. Welche Kennzahlen genau in
diese Auswahl kommen, ist Teil von Schritt 3 (Darreichung/Kuratierung).

### Implementierungs-Hinweis: live berechnen vs. vorberechnen (Architektur)
*Ändert NICHTS an der Statistik-Definition (wir bauen das Rezept, nicht die Küche) – nur ein Vermerk
für Claude Code.*
- **Empfehlung: erstmal alles LIVE rechnen.** Datenmenge ist klein (wenige tausend Spiele) → Rechenlast
  vernachlässigbar. Vorteil: immer aktuell, eine einzige Wahrheit (Rohdaten), neue Kennzahlen brauchen
  nur eine Abfrage statt Datenmodell-Änderung. Passt zu P1 (auf vollem Modell) und P2 (Qualität pro
  Spiel ableiten) – live über Rohdaten ist da viel einfacher als gepflegte abgeleitete Werte.
- **Datenbank-Views** (Supabase/PostgreSQL) als Mittelweg: gespeicherte ABFRAGE (kein gespeicherter
  Wert) – liest sich wie fertige Tabelle, rechnet aber live. Bei Bedarf später einzelne in
  „materialisierte Views" (vorberechnet) umwandelbar, ohne den Rest anzufassen.
- **Vorberechnung** erst, WENN ein konkretes Performance-Problem gemessen wird (erst messen, dann
  optimieren) – kein Startpunkt.
- **Rechnerisch teure Kennzahlen** (Kandidaten für zuerst-ein-View): die THEORETISCHEN – Mut-Ertrag
  (R4, „was wäre ohne meine Ansage"-Neubewertung), Score-Anatomie (G2, Schichtzerlegung). Dort als
  „rechnerisch teuer" vermerken.

---

---

## Master-Tabelle (Schritt 2 — alle Kennzahlen × alle Achsen)


Zentrale Konsistenz- und Übersichtstabelle. Nummerierung als Referenzschema (L=Leistung, A=Ausdauer,
R=Risiko, S=Solo, H=Hochzeit, AM=Armut, K=Karlchen, DK=Doppelkopf, F=Fuchs,
G=Gesamtscore, KUR=Kuriositäten, T=Teamplay, HOF=Hall of Fame). Präfix-Regel: kürzestes eindeutiges
Kürzel (ein Buchstabe wenn frei, zwei wenn's mit einem bestehenden kollidiert; immer Großbuchstaben).
„alle" beim Zeitraum = Total + Jahr +
feinere Filter (universeller Filter). „—" bei Normierung = nicht pro 4R (Quote/Extremwert/Verteilung).
P6 = unterliegt dem Stichproben-Filter (nur Quoten/Durchschnitte; Absolutzahlen, Streaks, Extremwerte
immun).

### Block 1 — Leistung
| Nr | Kennzahl | Ebenen (kann) | Normierung | Zeitraum | P6 | Datenqualität |
|---|---|---|---|---|---|---|
| **L1** | Sieg/Niederlage — Absolut + Quote | Spiel | — | alle | abs. nein, Quote ja | voll |
| **L2** | Erster — Absolut + Quote | Runde, Partie | — | alle | abs. nein, Quote ja | voll |
| **L3** | Letzter — Absolut + Quote | Runde, Partie | — | alle | abs. nein, Quote ja | voll |
| **L4** | Netto pos/neutral/neg — Absolut + Quote | Runde, Partie | — | alle | abs. nein, Quote ja | voll |
| **L5** | Streaks (einer je Zustand L1–L4) | Ebene des jeweiligen Zustands | — | Total durchgängig / Jahr = Ausschnitt | nein | voll |
| **L6** | Durchschnittsscore | Spiel, Runde, Partie | pro 4R (+ absolut) | alle | ja | voll |
| **L7** | Bester/schlechtester Wert | Spiel, Runde, Partie | — | alle | nein | voll |
| **L8** | Streuung/Konstanz (Box-Plot) | Spiel, Runde, Partie | — | alle | ja | voll |
| **L9** | Deutlichkeit der Siege | primär Spiel, auf Runde/Partie aggregierbar | Verteilung in % | alle | ja | voll |

*Heimat der absoluten „Anzahl Siege/Erster/…": bei L1–L4 (Leistung) – Absolutzahl UND Quote wohnen
hier. (Nicht bei Ausdauer – das war ein Erbfehler der alten 2024-Tabelle.)*

### Block 2 — Ausdauer
| Nr | Kennzahl | Ebenen (kann) | Normierung | Zeitraum | P6 | Datenqualität |
|---|---|---|---|---|---|---|
| **A1** | Anzahl gespielter Spiele/Runden/Partien | zählt selbst je Ebene | — (absolut = Aussage) | alle | nein | voll |
| **A2** | Dichte: Ø Runden/Partie **und** Ø Spiele/Runde | Partie + Runde | — | alle | nein | voll |
| **A3** | Teilnahmequote (Anteil an allen Partien der Gruppe) | Partie | — (Quote) | alle | **nein** (Gruppen-Nenner) | voll |
| **A4** | Anwesenheits-Muster (Timeline) | Partie | — | alle (zeitlich) | nein | voll |
| **A5** | Gebeversuche — Absolut + Gebe-Mehrlast % | — | Mehrlast = % über Norm | alle | nein | **P2: ab Partie NACH 17.6.2026** |
| **A6** | Spielzeit gesamt (Stunden) | — (reine Summe) | — | alle | nein | **P2: ab 17.6.2026 (App)** |
| **A7** | Ø Dauer je Partie/Runde/Spiel | Partie, Runde, (Spiel¹) | — | alle | nein | **P2: ab 17.6.2026 (App)** |

¹ Spielebenen-Dauer **erfassungs-empfindlich** (erfordert sofortiges Aufschreiben pro Einzelspiel, keine
Pausen dazwischen). Vorhanden im Vorrat, in der Praxis mit Vorsicht.
*A1b „Gewonnen/verloren absolut" GESTRICHEN aus Ausdauer – ist Leistung, wohnt als Absolut-Teil bei
L1–L4.*

### Block 3 — Risiko (R)
| Nr | Kennzahl | Ebenen (kann) | Normierung | Zeitraum | P6 | Datenqualität |
|---|---|---|---|---|---|---|
| **R1** | Ansage-Pyramide: Häufigkeit + Erfolgsquote (Grundansage + Absagen K90/K60/K30/Schwarz, je nach Re/Kontra/Solo, alle Drilldown-Ebenen) | — (keine Spiel/Runde/Partie-Ebene nötig) | pro 4R (+ absolut) | alle | abs. nein, pro4R + Quote ja | voll |
| **R2** | Re- vs. Kontra-Profil | — | — (Quote) | alle | ja | voll |
| **R3** | Ansage-Bilanz (deskriptiv, netto Punkte) | — | pro 4R (+ absolut) | alle | ja | voll |
| **R4** | Mut-Ertrag (theoretisch/modellhaft) | — | pro 4R (+ absolut) | alle | ja | voll *(Modellwert, keine Tatsache – s. Block 3; ⚙️ rechnerisch teuer)* |
| **R5** | Überreizt-Quote (total + je Absage-Stufe) | — | — (Quote) | alle | ja | voll *(genügt die Augen-Stufe/Range, keine exakte Punktzahl nötig)* |

*Die Zwillinge von R4 (Partner-Glück/Gegner-Pech: „was haben MIR die Ansagen ANDERER gebracht") wohnen
NICHT hier, sondern als T3a/T3b im Teamplay-Sammelabschnitt – gleiche Mechanik, andere Perspektive.*

### Block 7 — Gesamtscore (G)
| Nr | Kennzahl | Ebenen (kann) | Normierung | Zeitraum | P6 | Datenqualität |
|---|---|---|---|---|---|---|
| **G1** | Gesamtscore (Summe aller Spielwerte) | — | pro 4R (+ absolut) | alle | abs. nein, pro4R ja | voll |
| **G2** | Score-Anatomie (Wasserfall: Grund-/Ansage-/Solo-/Sonderpunkt-Score) | — | pro 4R (+ absolut), auf Durchschnittsscore normiert | alle | ja | voll *(⚙️ rechnerisch teuer, Zerlegungsfrage offen — s. Fließtext)* |

*Kein eigener G-Eintrag für: kumulierte Verlaufskurve (reine Darreichung von G1, Schritt 3) und den
Klick-Drilldown Kurve→Wasserfall (Darreichungs-Verbindung G1↔G2, keine eigene Kennzahl).*

### Block 6 — Sonderpunkte (K / DK / F)

**Karlchen:**
| Nr | Kennzahl | Ebenen (kann) | Normierung | Zeitraum | P6 | Datenqualität |
|---|---|---|---|---|---|---|
| **K1** | Karlchen gemacht (Häufigkeit) | — | pro 4R (+ absolut) | alle | abs. nein, pro4R ja | voll |
| **K2** | Karlchen gefangen (Häufigkeit) | — | pro 4R (+ absolut) | alle | abs. nein, pro4R ja | voll |
| **K3** | Karlchen verloren (Häufigkeit) | — | pro 4R (+ absolut) | alle | abs. nein, pro4R ja | **P2** (Verliererseite fehlt 2024) |
| **K4** | Erfolgsbilanz (gemacht − verloren) | — | pro 4R (+ absolut) | alle | ja | **P2** (wegen K3) |
| **K5** | Jagdbilanz (gefangen − verloren) | — | pro 4R (+ absolut) | alle | ja | **P2** (wegen K3) |
| **K6** | Doppel-Karlchen (gemacht + gefangen im selben Stich) | — | — (Absolutzahl, Trophäe) | alle | nein | voll |

**Doppelkopf:**
| Nr | Kennzahl | Ebenen (kann) | Normierung | Zeitraum | P6 | Datenqualität |
|---|---|---|---|---|---|---|
| **DK1** | Doppelkopf Häufigkeit | — | pro 4R (+ absolut) | alle | abs. nein, pro4R ja | voll |
| **DK2** | Vitrinen-Doppelköpfe (2er / 3er / 4er in einem Spiel) | — | — (Absolutzahl, Orden) | alle | nein | voll |

**Fuchs:**
| Nr | Kennzahl | Ebenen (kann) | Normierung | Zeitraum | P6 | Datenqualität |
|---|---|---|---|---|---|---|
| **F1** | Fuchs gefangen (Häufigkeit) | — | pro 4R (+ absolut) | alle | abs. nein, pro4R ja | **P2** (Fuchs 2024 komplett nicht erfasst) |
| **F2** | Fuchs verloren (Häufigkeit) | — | pro 4R (+ absolut) | alle | abs. nein, pro4R ja | **P2** |
| **F3** | Jagdbilanz (gefangen − verloren) | — | pro 4R (+ absolut) | alle | ja | **P2** |
| **F4** | Vitrinen-Füchse (beide gefangen / beide verloren in einer Partie) | — | — (Absolutzahl, Vitrine) | alle | nein | **P2** |

*Gestrichen: Sonderpunkt-Gesamtbilanz (vermischt Skill mit Glück, im Gesamtscore sowieso enthalten
→ Kerngedanke lebt weiter als Score-Anatomie in Block 7).*
*Teamplay-Duelle → Karlchen-Battle bei T4, Fuchs-Battle bei T5 (eigene Zeile wegen eigener
Datenqualitäts-Lage).*

### Block 5 — Sonderspiele (H / AM)
| Nr | Kennzahl | Ebenen (kann) | Normierung | Zeitraum | P6 | Datenqualität |
|---|---|---|---|---|---|---|
| **H1** | Hochzeit: Häufigkeit + Quote, wenn ich eine Hochzeit habe | — | pro 4R (+ absolut) bei Häufigkeit, Quote bei Erfolg | alle | ja | voll |
| **H2** | Hochzeit: Häufigkeit + Quote, wenn ich eingeheiratet bin | — | pro 4R (+ absolut) bei Häufigkeit, Quote bei Erfolg | alle | ja | **P2** (Gegenrolle fehlt 2024) |
| **AM1** | Armut: Häufigkeit + Quote, wenn ich arm bin | — | pro 4R (+ absolut) bei Häufigkeit, Quote bei Erfolg | alle | ja | voll |
| **AM2** | Armut: Häufigkeit + Quote, wenn ich Retter:in bin | — | pro 4R (+ absolut) bei Häufigkeit, Quote bei Erfolg | alle | ja | **P2** (Retterrolle fehlt 2024, vermutlich ab 2025 – zu prüfen) |

*Kein eigener Ho/AR-Eintrag für: Ehe-Dynamik (bereits T1, Spezialfall Team-Chemie).*
*Gestrichen: Kartenglück-Indikator – redundant zu H1/AM1-Häufigkeit (pro 4R normiert, Vergleich
ergibt sich direkt).*

### Block 4 — Solos (S)
| Nr | Kennzahl | Ebenen (kann) | Normierung | Zeitraum | P6 | Datenqualität |
|---|---|---|---|---|---|---|
| **S1** | Solo-Häufigkeit | — | pro 4R (+ absolut) | alle | abs. nein, pro4R ja | voll |
| **S2** | Solo-Quote (Erfolg) | — | — (Quote) | alle | ja | voll |
| **S3** | Aufschlüsselung nach Typ: Häufigkeit + Quote je Typ (Fleischlos / Buben / Damen / Farb / Still / Solo Hochzeit). Farb-Solo = ein konsolidierter Typ; darunter Drilldown auf einzelne Farben (Kreuz/Pik/Herz/Karo), erst ab Vollerfassung (P2) | — | pro 4R (+ absolut) bei Häufigkeit, Quote bei Erfolg | alle | ja | voll, **Farb-Drilldown P2** |
| **S4** | Solo-Punkteertrag: Saldo + Box-Plot-Verteilung (bestes/schlechtestes Solo, Streuung) | — | pro 4R (+ absolut) | alle | ja | voll |

*Kein eigener S-Eintrag für: Lieblings-Solo (Darreichung von S3 → Spieler-Steckbrief „Spielstil"),
Mut-vs-Können-Matrix (Visualisierung S1 × S2 → Nerd-Modus im Ranglisten-Block + Quadrant im
Spieler-Steckbrief „Spielstil"), An-/Absagen im Solo (Querverweis auf R1, Achse „Solo" – Quelle bleibt
Block 3, als Auszug eingeblendet).*

### Kuriositätenkabinett (KUR)
| Nr | Kennzahl | Ebenen (kann) | Normierung | Zeitraum | P6 | Datenqualität |
|---|---|---|---|---|---|---|
| **KUR1** | Gespaltener Arsch (Beteiligung + davon gewonnen/verloren) | — | — (Absolutzahl) | alle | nein | **P2** (exakte Augen nötig, erst ab 17.6.2026) |
| **KUR2** | Sieg trotz netto-negativ (Häufigkeit) | — | — (Absolutzahl) | alle | nein | **P2** (abhängig von vollständiger Sonderpunkt-Erfassung; Fuchs ab 2025 wahrscheinlich, davor P2) |
| **KUR3** | Netto-positiv trotz Niederlage (Häufigkeit) | — | — (Absolutzahl) | alle | nein | **P2** (analog KUR2) |
| **KUR4** | Gebversuch-Ursachen (Fünf Neunen / Unrettbare Armut / Trumpfschwach / Vergeben) | — | — (Absolutzahl) | alle | nein | **P2/P3** (erst ab Partie NACH 17.6.2026 erfasst) |

*Kein eigener KUR-Eintrag für die Leihgaben (Doppel-Karlchen → Heimat K6, Vitrinen-Doppelköpfe →
Heimat DK2, Doppel-Fuchs → Heimat F4) – dort zu Hause, hier nur ausgestellt, keine Doppelpflege.*

### Teamplay (T)
| Nr | Kennzahl | Ebenen (kann) | Normierung | Zeitraum | P6 | Datenqualität |
|---|---|---|---|---|---|---|
| **T1** | Team-Chemie: Siegquote je Paarung (+ verfeinert nach Re/Kontra-Rolle; inkl. Spezialfall Hochzeit: wen heirate ich / welche Ehe gewinnt) | — (Paar-Ebene: gemeinsame Spiele) | — (Quote) | alle | ja | voll *(Hochzeit-Anteil: gerichtet/ungerichtet noch offen, s. Fließtext)* |
| **T2** | Übermut: Partner-Schaden durch fremde Absage (Opfer-Ranking) + Gegenstück (Täter-Ranking) | — | pro 4R (+ absolut) | alle | ja | voll |
| **T3a** | Partner-Glück: Punkte durch mutige Ansagen (wechselnder) Partner | — | pro 4R (+ absolut) | alle | ja | voll *(niedrige Priorität, s. Priorisierung)* |
| **T3b** | Gegner-Pech: Punkte durch mutige Ansagen (wechselnder) Gegner | — | pro 4R (+ absolut) | alle | ja | voll *(niedrige Priorität, s. Priorisierung)* |
| **T4** | Karlchen-Battle (Lieblingsbeute / Angstgegner, Person vs. Person) | — | pro 4R (+ absolut) | alle | ja | **P2** (Karlchen-Verliererseite fehlt 2024) |
| **T5** | Fuchs-Battle (Lieblingsbeute / Angstgegner, Person vs. Person) | — | pro 4R (+ absolut) | alle | ja | **P2** (Fuchs komplett erst ab neuer Erfassung) |
| **T6** | Gegner-Bilanz: Siegquote/Netto-Bilanz in allen Spielen, in denen Person X mein Gegner war (Ergänzung zu T1, das nur Partner-Fälle zählt) | — (Paar-Ebene: gemeinsame Spiele als Gegner) | — (Quote) | alle | ja | voll |

### Hall of Fame (HOF)
| Nr | Rekord | Quelle | Umfang | Datenqualität |
|---|---|---|---|---|
| **HOF1** | Bestes / schlechtestes Spiel, Runde, Partie (Punktwert) | L6/L7 | 6 Rekorde (2 Richtungen × 3 Ebenen) | voll |
| **HOF2** | Längste Siegesserie / längste Pechsträhne | L5 | 2 Rekorde | voll |

*Ebenen/Normierung/P6 gelten für beide gleich: Ebenen — (kein Spiel/Runde/Partie-Konzept, immer der
eine Höchstwert), Normierung — (Rohwert, keine pro-4R-Skalierung sinnvoll), Zeitraum Total als
Standard, per Achse-2-Filter auch „Bester des Jahres X" abrufbar, P6 nein (Extremwerte sind absolute
Zahlen, immun). Kein eigener Eintrag für Solo-Ertrag (S4), Absage-Rekord (R3–R5),
Karlchen-/Fuchs-Bilanz (K4/K5/F3) – strukturell deckungsgleich mit HOF1 bzw. Randnotiz im
Heimatblock, s. Fließtext.*

### Ort (O)
| Nr | Kennzahl | Ebenen (kann) | Normierung | Zeitraum | P6 | Datenqualität |
|---|---|---|---|---|---|---|
| **O1** | Anzahl gespielter Partien je Ort | — | — (Absolutzahl) | alle | nein | voll |
| **O2** | Gespielte Dauer je Ort (Summe) | — | — (Absolutzahl) | alle | nein | **P2** (hängt an Partie-Timestamps, gleiche Lücke wie A6/A7) |
| **O3** | Anzahl verschiedener Spieler:innen, die je an diesem Ort gespielt haben (über die gesamte Historie) | — | — (Absolutzahl) | alle | nein | voll |

*Ort-zentrierte Alternative zu den bisher überwiegend spielerzentrierten Blöcken – das Subjekt ist
hier der Ort, nicht die Person. Deshalb kein Ebenen-Konzept (ein Ort ist ein Ort) und keine
P6-Logik (reine Zähler/Summen, keine Quoten). O3 lohnt sich, weil private Orte (nur der feste
Stammtisch) sich so von offenen Orten (z. B. Kneipe, wechselnde Gäste) unterscheiden lassen.*

---

## Block 1 — Leistung: „Wie gut spiele ich?"


Leistung = alles rund um **Siege/Niederlagen und Spielwert**. NICHT wie ich spiele (Ansagen → Kat. 4,
Solos → Kat. 5), sondern wie erfolgreich.

### Grunddefinitionen (festgelegt)

- **Gewinnen = Platz 1**, auf jeder Ebene. Siegquote = „Einheiten als Erste:r beendet ÷ gespielte Einheiten".
- **Spielebene:** nur **Sieg / Niederlage** (binär, Team gewinnt/verliert). Netto-Sicht wird hier NICHT
  ausgewiesen → die seltene Abweichung „Sieg trotz netto-negativ durch gegnerische Sonderpunkte" löst
  sich von selbst auf (ggf. später als Fun Stat). Gespaltener Arsch: Gewinner ist Kontra, fertig.
- **Runde + Partie:** vier Zustände, zwei Achsen:
  - *Platzierung (relativ):* **Erster** (klarer Sieg) / **Letzter** (klare Niederlage).
    Mittelplätze (2./3./…) werden BEWUSST NICHT ausgewertet – verworfene Komplexität.
  - *Saldo (absolut):* **netto positiv / neutral / netto negativ.**
- **Nullsummen-Eigenschaft:** Jede Einheit saldiert auf 0. Es können nie alle positiv/negativ sein
  (max. 3:1 bzw. 1:3 bei 4 Spielenden). netto-pos / neutral / netto-neg summieren zu 100 %.
- **Geteilte Plätze gelten voll für alle Beteiligten:** zwei punktgleich vorn = beide Erster; zwei
  punktgleich hinten = beide Letzter. Allein-Erster und geteilt-Erster sind gleichwertig.
- **Neutralfall (netto exakt 0)** wird als eigener Saldo-Zustand ausgewiesen.

### Kennzahlen-Vorrat

| Nr | Kennzahl | Spiel | Runde | Partie | Datenbedarf |
|---|---|---|---|---|---|
| **L1** | Sieg / Niederlage (binär) | ✓ | – | – | Gewinner-Flag |
| **L2** | Erster | – | ✓ | ✓ | Salden je Spieler:in |
| **L3** | Letzter | – | ✓ | ✓ | Salden je Spieler:in |
| **L4** | Netto positiv / neutral / negativ | – | ✓ | ✓ | Salden je Spieler:in |
| **L5** | Streaks (je Zustand L1–L4) | je nach Zustand | je nach Zustand | je nach Zustand | s. u. |
| **L6** | Durchschnittsscore (auch **pro 4R**) | ✓ | ✓ | ✓ | Spielwert |
| **L7** | Bester / schlechtester Wert | ✓ | ✓ | ✓ | Spielwert |
| **L8** | Streuung / Konstanz | ✓ | ✓ | ✓ | Spielwert-Reihe |
| **L9** | Deutlichkeit der Siege | ✓ | (ableitb.) | (ableitb.) | Erreicht-Stufe |

**Streaks (L5):** Jeder Zustand (Sieg/Niederlage, Erster/Letzter, netto-pos/neutral/neg) trägt
**Quote + aktueller Streak + längster Streak**. Streak-Regel (Spec): über Einheiten hinweg,
Abwesenheit unterbricht NICHT, nur das Gegenteil des Kriteriums bricht.

**Deutlichkeit der Siege (L9)** – am **Erreichten** gemessen (nicht am Angesagten – das ist Kat. 4!).
Fünf Stufen von knapp → vernichtend: Normaler Sieg (>120, keine Absage geschafft) → Keine 90 →
Keine 60 → Keine 30 → Schwarz. Kennzahl = Verteilung der eigenen Siege über diese Stufen.
Voll datenverfügbar auch im Import (Absage-Erreicht ist exakt, hängt nicht an genauer Augenzahl).

**Streuung / Konstanz (L8)** – zeigt verlässlicher Spieler vs. Zocker. Voraussichtlich als
**Box-Plot/Quartils-Darstellung** (mittlere 50 % als Kasten, Median als Strich, Extreme als Whisker) –
selbsterklärend und ausreißer-robust. Genaue Darstellung (Quartile vs. „typische Schwankung" vs.
Standardabweichung im Nerd-Modus) bei Implementierung final. Standardabweichung höchstens versteckt.
Kleine Stichproben → P6 beachten (Kerze sonst bedeutungslos).

### Ausgelagert / verschoben
- **Team-Chemie** („mit wem gewinne ich am meisten") → Teamplay (eigener Abschnitt am Ende des
  Dokuments).
- **Kuriositäten** (Sieg trotz netto-negativ; netto-positiv trotz Niederlage; Häufigkeit Gespaltener
  Arsch) → Kuriositätenkabinett (eigener Block am Dokumentende).

### Datenqualität dieses Blocks
Trägt durchgängig über Spielwert / Gewinner / Absage-Erreicht – alles auch im Import exakt.
Block 1 ist damit auf JEDER Datenqualität voll belastbar (P6-Stichprobenfrage bleibt davon unberührt).

---

## Block 2 — Ausdauer / Engagement: „Wie viel spiele ich?"


Gegen-Kategorie zur Leistung: nicht *wie gut*, sondern *wie viel*. Überwiegend **absolute Zahlen** →
immun gegen Stichprobe (P6) und gegen Datenqualität (Anwesenheit/Anzahl sind immer exakt).

**Aussortier-Kriterium aus diesem Block:** Misst die Kennzahl den *Spieler* oder die *Struktur*?
Strukturschatten (Tischmechanik, Rotation) fliegen raus.

### Kennzahlen-Vorrat

### A1 — Mengen
Anzahl gespielter Spiele / Runden / Partien (absolut). Plus gewonnen/verloren absolut. Die
Grundwährung der Ausdauer.

### A2 — Dichte pro Partie
Ø Runden/Partie, Ø Spiele/Partie. Wie intensiv eine typische Partie war.

### A3 — Teilnahmequote
Anteil an ALLEN Partien der Gruppe (Stammspieler:in vs. Gelegenheitsgast). Nenner = alle Partien der
Gruppe, NICHT die eigene Stichprobe → P6-immun, immer aussagekräftig. In der alten Tabelle wegen
Platzlimit gar nicht vorhanden – jetzt drin.

### A4 — Anwesenheits-Muster
Timeline der Teilnahme über die Zeit (treuer Stammgast vs. intensive Phase + abgeflacht).
Spielerbiografie. Verwandt mit den Verlaufskurven (Partie-Steckbrief, s. Darreichungs-Muster).

### A5 — Gebeversuche
*(Arbeitstitel)* — **wie oft musste ich mischen & austeilen.** Der physische Ausdauer-Akt, fällt an
EGAL WARUM. Summe aus drei Quellen:
1. **normales Geben** (Rotation, ein gültiges Spiel; implizit in Sitzposition)
2. **Solo-Neugeben** (steckt schon in der Geberrolle – ein weiteres gültiges Spiel mit mir als
   Gebendem)
3. **gescheiterte Gebversuche** (neue Tabelle: fünf Neunen / unrettbare Armut / trumpfschwach /
   vergeben – kein Spiel zustande gekommen)
→ ACHTUNG beim Zählen: alle drei Quellen, nicht nur die neue Tabelle. Quelle 2 muss aus dem Solo
abgeleitet werden (steht NICHT in der Gebversuch-Tabelle).

**Hauptzahl – Absolutzahl:** „wie viel Mischarbeit ich insgesamt in die Gruppe spendiert habe".
**Aussagekräftige Relation – Gebe-Mehrlast in %:** Bezug ist **pro Runde** (Norm = 1,0, da jeder pro
Runde genau einmal gibt; kann nie < 1 sein, wird durch Solo + Fehlversuche > 1). Da die Rohwerte
immer knapp über 1 liegen (1,1 / 1,2 …) und nebeneinander „alle gleich" aussähen, NICHT den Rohwert
zeigen, sondern die **prozentuale Mehrleistung über Norm** (1,2 → +20 %). Spreizt die kleinen
Unterschiede, erzählt „wer musste überdurchschnittlich oft austeilen" (Pech-/Solo-Vielgeber).
**Verworfen:** Anteil an allen Gaben der Gruppe (weicht auch nur marginal ab, schlecht darstellbar);
pro-4R-Rohwert (≈4,x, schlecht lesbar – deshalb als % über Norm).

**NEU im Datenmodell** (mit Robert beschlossen, ab jetzt erfasst): zusätzliche Gebversuche je Spiel,
an Spiel-ID gebunden, je EINE von vier Ursachen + EIN Verursacher, mehrere pro Spiel möglich.
**P2/P3:** erst ab jetzt erfasst – Altdaten 0 wäre Lüge.
*Ursachen/Verursacher gehören NICHT zu Ausdauer, sondern ins Kuriositätenkabinett (KUR) – Ausdauer
kriegt nur die Mengen-Zahl.*

### A6 — Spielzeit / Spielstunden
Aus Timestamps. „Wie viele Stunden am Tisch verbracht." **P2-Hinweis:** nur App-erfasste Spiele;
Timestamps fehlen im Import → erst ab Vollerfassung sinnvoll.

### A7 — Ø Dauer je Partie/Runde/Spiel
Durchschnittliche Dauer, abgeleitet aus denselben Timestamps wie A6 (Spielzeit gesamt) – auf Partie-
und Runden-Ebene einfach Gesamtzeit ÷ Anzahl Einheiten. Auf **Spielebene** ist die Kennzahl
**erfassungsempfindlich** (gleiche Einschränkung wie bei der Master-Tabellen-Fußnote zu A7): sie
braucht das sofortige Aufschreiben jedes Einzelspiels, ohne Pausen dazwischen – sonst verwischt die
Pause zwischen zwei Spielen mit der eigentlichen Spieldauer. Steht im Vorrat, in der Praxis mit
Vorsicht zu behandeln. **P2:** wie A6 erst ab 17.6.2026 (App) sinnvoll, da Timestamps im Import
fehlen.

### Bewusst verworfen
- **Aussetzer-Quote** — misst nur die Tischgröße (in 5er/6er/7er-Runden setzt durch die Rotation
  jeder gleich oft aus), kein echtes Spielerverhalten. *(Bekommt bewusst KEINE A-Nummer – kein
  Master-Tabellen-Eintrag.)*
- **Geber-Häufigkeit als Spieler-Unterschied** — in Normalspielen gibt durch die Rotation jeder exakt
  gleich oft; ein Spieler-DIFFERENZIERENDES Signal entsteht nur durch zusätzliche Gebversuche – und
  die zählen als Ursachen ins Kabinett, als Menge in A5. *(Ebenfalls keine eigene Nummer.)*

### Keine Normierung
Absolute Mengen SIND hier die Aussage, nicht der Bug. „Pro 4 Runden" wäre sinnwidrig – wer viel da war,
hat ehrlich viel gespielt. Normierung gehört zu Leistung/Sonderpunkten, nicht zu Ausdauer.

---

## Block 3 — Risiko (R) / Ansagen: „Wie mutig spiele ich?"


Misst freiwillig eingegangenes Risiko über **Ansagen** und **Absagen**. Schaut auf das **Angesagte**
(= Risiko), während Block 1 „Deutlichkeit" auf das **Erreichte** (= Ergebnis) schaut – gleiches
Vokabular, zwei Richtungen. Beispiel: „Keine 90" erreichen ohne Ansage = Deutlichkeit (Kat. 1);
„Keine 90" ansagen und verfehlen = Risiko (Kat. 3).

### Begriffsordnung (festgelegt)
- **Ansage = Grundansage Re / Kontra.** „Wir gewinnen." Verdoppelt den Wert. Im Normalspiel an die
  Partei gebunden (Re sagt nur Re, Kontra nur Kontra). **ABER durch die Solo-Ebene (s. u.) splittet
  sich „Re": ein Solist, der „Re" ruft, ist eine eigene Solo-Re-Ansage**, herausgelöst aus den
  normalen Re-Ansagen (der Solist ist formal Re-Partei, lt. Datenmodell).
- **Absage = die Steigerungen:** Keine 90 → Keine 60 → Keine 30 → Schwarz. Behauptung „Gegner kriegt
  nicht mal X Augen", treibt den Wert hoch; verfehlt man die angesagte Stufe, verliert man.
  **Neu & wichtig:** Eine Absage kann aus der **Re-** ODER der **Kontra-Partei** heraus erfolgen
  (Kontra-Absage ist mutiger – strukturell im Nachteil). Dafür muss ich NICHT selbst „Re/Kontra"
  gesagt haben, nur der jeweiligen Partei angehören (Partei ist pro Spiel ohnehin bekannt). DIESE
  Re/Kontra-Trennung der Absagen gab es in den alten Daten nicht – sie ist neu.

### Dritte Ansage-Achse: Re / Kontra / **Solo** (festgelegt)
An-/Absagen werden nach der Situation getrennt, aus der heraus sie erfolgten: **Re (Normalspiel) /
Kontra (Normalspiel) / Solo**. Begründung: Eine Ansage IM Solo ist eine andere Qualität von Mut –
Risiko allein getragen, dreifacher Hebel, nicht mit Partner geteilt. Formal ist der Solist Re-Partei
(Datenmodell), wird aber für die Statistik herausgetrennt, sonst verwässert die Solo-Re-Ansage die
normale Re-Quote. Macht sichtbar, wer sein Solo zusätzlich durch Ansagen auflädt (Maximal-Zocker).
Auch die **Grundansage „Re" splittet** sich dadurch in Normalspiel-Re und Solo-Re.
**Stilles Solo / Solo Hochzeit:** Ansagen sind formal MÖGLICH (z. B. „Re" anfangs verschweigen zur
Tarnung, später doch „Keine 90" nachschieben, wenn die Messe gelesen ist) – nur strategisch meist
unklug. KEINE Sonderbehandlung/Sperre: taucht eine Ansage auf, wird sie normal unter der Solo-Achse
gezählt. (Keine künstliche Regel, die echte seltene Fälle als Fehler markiert.)

### Normierung (festgelegt)
**Nur „pro 4 Runden"** (= normierte Partie) als Hauptzahl, Absolutwert als Beiwerk. KEINE
Spiel/Runde/Partie-Ebenen nötig – die 4 Runden sind die Normierung.

### R1 — Ansage-Pyramide
Von grob nach fein; über JEDE Zelle werden **Häufigkeit (abs. + pro 4R)** und **Erfolgsquote**
(P6-relevant) gelegt:

- **Ebene 0 – Gesamt:** alle Ansagen gesamt (altes „163"); davon nach **Re / Kontra / Solo**.
- **Ebene 1 – Ansage vs. Absage:**
  - Ansagen (Grundansage) gesamt – aufgeteilt nach **Re / Kontra / Solo** (Solo-Re herausgelöst).
  - Absagen (K90+) gesamt; **nach Re / Kontra / Solo getrennt**.
- **Ebene 2 – jede Stufe einzeln:** Keine 90 / Keine 60 / Keine 30 / Schwarz – jeweils einzeln UND
  zusätzlich nach **Re / Kontra / Solo** sortiert.

### Kategorieübergreifende Kennzahlen (passen nicht in die Pyramide)

### R2 — Re- vs. Kontra-Profil
Sage ich eher Re (offensiv) oder Kontra (Gegenwehr)? Getrennte Quoten. Sehr wichtig; durch die
Absagen-Sortierung (oben) jetzt tiefer als bisher. (2024: Robert 113 Re vs. 22 Kontra → klarer
Re-Spieler.)

**Ertrag des Risikos — eine Kennzahl-FAMILIE (nicht eine Zahl):** R3 und R4 beschreiben beide, was
mir MEINE eigenen An-/Absagen gebracht haben – aus zwei verschiedenen Blickwinkeln (deskriptiv vs.
theoretisch-isoliert). Der Zwilling dieser Familie, **T3** (was mir die Ansagen ANDERER gebracht
haben), wohnt in Teamplay (andere Perspektive, gleiche Mechanik).

### R3 — Ansage-Bilanz (deskriptiv)
Netto Punkte in allen Spielen, in denen ich selbst eine An-/Absage gemacht habe. Beschreibt das
Resultat („mache ich den Mund auf, komme ich ins Plus oder Minus"), sagt aber NICHT warum (Karten
vs. Mut). Einfach, ehrlich, tischtauglich. Bleibt bewusst drin. *(Name vorläufig.)*

### R4 — Mut-Ertrag (theoretisch, mechanisch definiert)
Isoliert den Effekt MEINES Risikos: **realer Ertrag minus Ertrag derselben Spiele, neu bewertet ohne
meine EIGENEN An-/Absagen** (alles andere bleibt, wie es war). Differenz = was mein Mut über das
„Klappe halten" hinaus gebracht hat. Korrigiert den Trugschluss von R3 (gute Re-Bilanz kommt oft vom
Blatt, nicht vom Mut). **Theorie-Vorbehalt (bewusst):** ignoriert, dass (a) der Partner das Re evtl.
selbst gesagt hätte und (b) sich das Spiel ohne meine verratende Ansage anders entwickelt hätte –
nicht rückrechenbar. Mechanisch berechenbar & konsistent, aber ein MODELLWERT, kein Tatsachenwert
(so kennzeichnen). Ggf. pro 4R normiert → fair zwischen Viel-/Wenigsagern. ⚙️ *rechnerisch teuer →
ggf. zuerst als Datenbank-View (s. Architektur-Hinweis).*
*Offene Definitionsfrage:* zählt nur, was ich SELBST angesagt habe, oder auch der Profit/Schaden aus
Partei-Ansagen meines Partners (Grundansage „gehört" oft der Partei)? Datenmodell weiß, wer gesagt
hat – konzeptionell zu entscheiden. Tendenz: nur eigene Ansagen.

### R5 — Überreizt-Quote
Verlorene Spiele, in denen ich eine **Absage** verfehlt habe, das Spiel OHNE diese Absage aber
gewonnen hätte (Übermut-Indikator). NUR bei Absagen relevant: verfehltes Re/Kontra heißt <120 Augen
→ sowieso verloren, kein Überreizen. Beispiel: 125 Augen (hätte mit Re gewonnen), aber „Keine 90"
gesagt und Gegner kriegt 95 → durch Übermut verloren.
**Auflösung:** Überreizquote **total** UND **je Stufe** (K90 / K60 / K30 / Schwarz einzeln) – zeigt,
WO der Übermut sitzt (z. B. nie bei K90, ständig bei Schwarz).
**P2-Hinweis (entschärft):** braucht NICHT die exakte Augenzahl, sondern nur die erreichte
**Augen-Stufe** (über 120? welche Absage-Schwelle erreicht/verfehlt?) – und die Range IST die Stufe.
Damit auch aus abgeschriebenen Range-Daten voll ableitbar, sobald Absage + erreichte Stufe erfasst
sind. Nur ein seltener Grenzfall (Ergebnis exakt auf der Schwelle) wäre mehrdeutig. KEINE reine
Zukunfts-Kennzahl.

### Darreichung dieses Blocks
- **Risiko-Tiefe / „durchschnittliche Reizhöhe"** — wie hoch reize ich im Schnitt (Zocker vs.
  Sicherheitsspieler). Überschneidet sich mit der Häufigkeitsverteilung über die Stufen (R1) – eine
  verdichtete LESART der Verteilung, keine eigene Kennzahl. **Geklärt:** personenbezogenes Ergebnis
  (ein Label wie „mittel-mutig") wandert in den Spieler-Steckbrief, Abschnitt „Spielstil" (s. Schritt 3).

### Ausgelagert → Teamplay (siehe Sammelabschnitt am Dokumentende)
- **Übermut** (→ T2) und die **Zwillinge von R4, Partner-Glück/Gegner-Pech** (→ T3a/T3b). Alle dort
  gesammelt, mit Team-Chemie (T1) und Gegner-Bilanz (T6).

### Datenqualität dieses Blocks
Re/Kontra + Absagen sind auch im Import exakt erfasst → R1, R2, R3, R4 tragen auf jeder Qualität.
R5 (Überreizt) braucht nur die erreichte Augen-Stufe (= die Range), nicht die exakte Augenzahl → auch
aus abgeschriebenen Range-Daten voll ableitbar; nur seltener Grenzfall an der Schwelle mehrdeutig.

---

## Block 4 — Solos (S): „Wie schlage ich mich allein?"


Solo = einer gegen alle. Maximales Risiko, **dreifacher** Spielwert-Hebel. Eigene Kategorie.

### Lust vs. Pflicht (geklärt – kein Achsen-Problem, nur ein Sonderfall)
In der AKTUELLEN Spielweise sind faktisch alle Solos **Lustsolos** (freiwillig, inkl. Stilles Solo =
verschwiegene Hochzeit). EINZIGER erzwungener Fall: **Solo Hochzeit** (lt. Datenmodell: Hochzeit
angesagt, aber alle ersten 3 Stiche an die Person mit der Hochzeit → kein Partner → erzwungenes Solo; Solo-Flow,
kein Neugeben). Kommt praktisch NIE vor.
**Entscheidung:** Solo Hochzeit bleibt pragmatisch als normaler Solo-Typ in ALLEN Kennzahlen drin
(Häufigkeit, Quote, Ertrag) – keine Sonderlogik für einen Fall, der nie eintritt. *Vorbehalt:* falls
sie je häufiger wird (andere Spielweise), nachträglich aus der Quote trennbar.
*Zukunfts-Vorbehalt:* Andere Spielweisen kennen Pflichtsoli (1 Pflicht je 4 Runden, Rest Lust) – dann
kann JEDER Typ Pflicht oder Lust sein. Wird erst bei Einführung ins Datenmodell relevant.

### Kennzahlen-Vorrat

### S1 — Solo-Häufigkeit
**Pro 4 Runden** (Hauptzahl, = normierte Partie), absolut nur Beiwerk.

### S2 — Solo-Quote (Erfolg)
Wie oft gewinne ich meine Solos. **P6-relevant** (2 Solos, beide gewonnen ≠ echte 100 %).

### S3 — Aufschlüsselung nach Typ
Häufigkeit + Quote je Typ (Fleischlos / Buben / Damen / Farb / Still / Solo Hochzeit).
**Farb-Solo** ist dabei ein **konsolidierter Typ** auf der ersten Ebene. Darunter gibt es einen
weiteren **Drilldown auf die einzelne Farbe** (Kreuz / Pik / Herz / Karo) – dieser Drilldown ist
aber erst **ab Vollerfassung (P2)** verfügbar, weil die Farbe in alten Importen fehlt. Bis dahin muss
„Farb-Solo ohne Farbzuordnung" als Fall existieren.

### S4 — Solo-Punkteertrag
Solos haben dreifachen Hebel. **Saldo** (netto Punkte aus allen Solos, „lohnen sich meine
Alleingänge") **+ Box-Plot-Verteilung** (bestes/schlechtestes Solo, Streuung – gleiche Logik wie
Block-1-Streuung L8, wiederverwendet). Solo-Pendant zum Mut-Ertrag (R4).

### → Darreichung (Schritt 3)
Die folgenden Ideen sind keine eigenen Kennzahlen, sondern Darstellungsformen vorhandener S-Werte.
Sie bekommen bewusst keine S-Nummer.

- **Lieblings-Solo / Spezialität** — welcher Typ ist meiner, wo bin ich überdurchschnittlich.
  Reine Darreichungsform von S3 (welcher Typ sticht heraus). **Geklärt:** personenbezogenes Ergebnis
  (welcher Typ) wandert in den Spieler-Steckbrief, Abschnitt „Spielstil" (s. Schritt 3).
- **Mut-vs-Können-Matrix** — Streudiagramm aus **S1 (Häufigkeit) × S2 (Quote)**, je Spieler ein
  Punkt, vier Quadranten: viel+gut = Vollprofi · viel+schlecht = überschätzt sich ·
  selten+gut = Sniper · selten+schlecht = Pechvogel. KEINE dritte Kennzahl, nur eine Sicht auf zwei
  vorhandene. **Wiederverwendbares Muster:** genauso auf Block 3 anwendbar (Ansage-Häufigkeit ×
  Erfolgsquote). **Geklärt:** die volle Matrix (alle Spieler:innen gleichzeitig) läuft als Nerd-Modus-
  Visualisierung im jeweiligen Ranglisten-Block (Solo bzw. Risiko); der eigene Quadrant (ein Wort wie
  „Sniper") wandert zusätzlich in den Spieler-Steckbrief, Abschnitt „Spielstil".
- **An-/Absagen im Solo** — konzeptionell & datentechnisch im **Mut-Block (Block 3)** verankert,
  als dritte Ansage-Achse „Solo" (neben Re/Kontra). In der Solo-Darreichung als **Auszug** von R1
  einblenden – ohne Doppelpflege. Einzige Quelle bleibt Block 3. *(Entschieden: einfache Einblendung,
  kein eigener Darstellungsaufwand.)*

### Gestrichen
- **Solo-Anteil** — redundant: Häufigkeit *pro 4 Runden* normiert bereits auf die mitgespielten
  Spiele und IST damit effektiv schon der Anteil.
- **„Unter wessen Solos leide ich?"** — verworfen. In einer (nahezu) festen Runde schadet ein Solo
  allen Mitspielenden gleich; die Anwesenheits-Schwankung ist ein zu schwaches Signal. Die Kennzahl
  wäre nur eine umständliche Umschreibung von „wer ist Solo-König" – und das sieht man direkt an
  S1. Kein eigener Informationswert.

### Ausgelagert → Teamplay
*(derzeit keine Teamplay-Auslagerung aus Block 4 – siehe gestrichene Idee oben)*

### Datenqualität dieses Blocks
Solo-Typ, Gewinner, Spielwert auch im Import exakt → S1/S2/S4 tragen voll. Nur die **Farbe** beim
Farb-Solo (Drilldown in S3) fehlt in alten Importen (P2).

---

## Block 5 — Sonderspiele (H / AM): „Wie schlage ich mich in besonderen Rollen?"


Sonderspiele = Spieltypen mit abweichender Struktur und **besonderen Rollen**. Nach der Bereinigung
sind das zwei: **Hochzeit** und **Armut**. (Solos sind als eigener Block 4 herausgezogen. Gespaltener
Arsch ist KEIN Sonderspiel, sondern eine Ergebnis-Sonderform → verschoben zu Kuriositäten.)
Kerngedanke: nicht „wie oft", sondern **nach Rolle** – dieselbe Situation fühlt sich je Rolle anders an.

> ⚠️ **Wording:** „jemand **hat eine Hochzeit**" / „jemand **ist eingeheiratet**". NICHT
> „Hochzeiter:in". (Code-Identifier `hochzeit` / `eingeheiratet` bleiben technisch.) Vgl. Wording-Regel.

### H1 — Hochzeit: wenn ich eine Hochzeit habe
Häufigkeit + Quote (beide Kreuz-Damen, suche Partner) — das Bewährte; in der alten Statistik die
EINZIGE erfasste Seite. Pro 4R, **P6-relevant** (Hochzeiten selten → kleine Stichproben zeigen
schnell 100 %).

### H2 — Hochzeit: wenn ich eingeheiratet bin
Häufigkeit + Quote — **neu**, erst ab Erfassung der Gegenrolle (P2: alte Daten kennen den
Eingeheirateten nicht). Pro 4R, P6-relevant.
**Ehe-Dynamik** (wen heirate ich / welche Ehe gewinnt) → Teamplay (T1), als Spezialfall der
Team-Chemie. Kein eigener H-Eintrag.

### AM1 — Armut: wenn ich arm bin
Häufigkeit + Quote (musste Armut ansagen). Pro 4R, P6-relevant.

### AM2 — Armut: wenn ich Retter:in bin
Häufigkeit + Quote (habe aufgenommen). Erzählung: ewiger Armer vs. edler Retter? Pro 4R, P6-relevant.
Datenmodell: `arm` / `reich`. **P2:** Retterrolle fehlt 2024, vermutlich ab 2025 vorhanden – zu prüfen.

### Gestrichen
- **Kartenglück-Indikator** (kommt Hochzeit/Armut bei mir über-/unterdurchschnittlich oft vor?) —
  redundant: H1/AM1-Häufigkeit ist bereits pro 4R normiert, der Vergleich ergibt sich direkt aus den
  nebeneinanderstehenden Werten.

### Datenqualität dieses Blocks
Rollen `hochzeit`/`arm` werden im neuen Modell erfasst und sind auch historisch stabil → H1/AM1 voll.
Gegenrollen (`eingeheiratet`, `reich`) fehlen in alten Daten → H2/AM2 P2. „Wer eine Hochzeit/Armut
HAT" ist die historisch stabilere Seite.

---

## Block 6 — Sonderpunkte (K / DK / F): „Die kleinen Münzen"


Kleine Zusatzpunkte (±1), die INNERHALB eines Spiels zusätzlich zum Spielausgang anfallen. Datenmodell-
Typen: **Karlchen gemacht**, **Karlchen gefangen**, **Doppelkopf**, **Fuchs gefangen**.
(Der **Gespaltene Arsch** ist KEIN Sonderpunkt – kein ±1, sondern eine Ergebnis-Sonderform – und
wandert in den eigenen **Kuriositätenkabinett**-Block, s. u.)

**Bauplan der Kategorie:** manche Sonderpunkte haben ZWEI Seiten (Fänger + Bestohlene:r), manche nur
EINE (nur Macher:in). Zwei Seiten: Karlchen gefangen, Fuchs gefangen. Eine Seite: Karlchen gemacht,
Doppelkopf. Verliererseite (`Verlierer:in-ID`) wird im neuen Modell erfasst, fehlte aber 2024 → großes
P2/P3-Thema. „verloren"-Events werden ABGELEITET aus dem Fang-Eintrag der Gegenseite (nicht separat
erfasst, lt. Datenmodell).

### Karlchen — die Skill-Kennzahl unter den Sonderpunkten

**Karlchen = Kreuz-Bube** (NICHT Karo-Bube). „Gemacht" = letzten Stich mit dem Kreuz-Buben geholt
(max. 1/Spiel). „Gefangen" = gegnerischen Kreuz-Buben im letzten Stich überstochen (max. 2, wenn beide
fallen). „Verloren" = mir wurde mein Kreuz-Bube im letzten Stich weggestochen (abgeleitet aus dem
Fang-Eintrag der Gegenseite). Kombiniertes Limit gemacht + gefangen ≤ 2 (nur 2 Kreuz-Buben im Spiel).

### K1 — Karlchen gemacht (Häufigkeit)
Skill: bewusst den Kreuz-Buben für den letzten Stich aufgehoben. Pro 4R (+ absolut).

### K2 — Karlchen gefangen (Häufigkeit)
Skill: aktiv den gegnerischen Kreuz-Buben abgestochen. Pro 4R (+ absolut).

### K3 — Karlchen verloren (Häufigkeit)
Pro 4R (+ absolut). **P2: 2024 fehlt die Verliererseite → erst ab neuer Erfassung** (P3: „0
verloren" für 2024 wäre eine Lüge).

### K4 — Erfolgsbilanz (gemacht − verloren)
Die HAUPT-/Skill-Erzählung: „Ich will ein Karlchen machen, hebe mir den Kreuz-Buben auf – mal
gelingt's, mal habe ich die Damen nicht richtig gezählt und es wird mir weggestochen." Wie gut plane
ich meinen letzten Stich. **P2** (wegen K3).

### K5 — Jagdbilanz (gefangen − verloren)
Das Duell um die Buben: jage ich die Kreuz-Buben anderer, oder werde ich gejagt – Jäger vs. Beute.
**P2** (wegen K3).
*Hinweis:* „verloren" (K3) geht in BEIDE Bilanzen (K4 + K5) negativ ein (gewollt – dasselbe
Ereignis aus zwei Blickwinkeln). Bei gemeinsamer Anzeige kurz kenntlich machen, damit das
Doppelauftauchen nicht verwirrt.

### K6 — Doppel-Karlchen
Mit dem eigenen Kreuz-Buben den letzten Stich machen UND dabei den gegnerischen Kreuz-Buben
überstechen (gemacht=1 + gefangen=1 im selben Stich; lt. Datenmodell explizit möglich). Die Krönung.
**Keine pro-4R-Normierung** (zu selten → sinnlos klein); zählt als **Absolutzahl mit Rekord-/
Trophäen-Charakter**.

**Teamplay (→ T4):** durch die neu erfasste Verliererseite möglich:
- „von wem fange ich besonders oft?" (Lieblingsbeute)
- „an wen verliere ich besonders oft?" (Angstgegner)
- Karlchen-Battle Person vs. Person (Jan vs. Robert: wer fängt wem öfter weg). Gerichtetes Duell.

### Doppelkopf — der einfache Sonderpunkt

Ein Stich mit 40+ Augen (Datenmodell: Zähler, max. 4/Spiel). **Nur EINE Seite** – kein Bestohlener,
keine Verliererseite, keine zwei Bilanzen, kein P2-Gegenseiten-Problem, keine Teamplay-Duelle
(Gegenstück zum Karlchen). Eher **Glück als Skill** (hohe Karten sammeln sich im Stich) – beliebte
Zahl, aber NICHT als Skill-Kennzahl verkaufen.
**Keine** Re/Kontra- oder Sieg/Niederlage-Verfeinerung – trägt kein eigenständiges Signal.

### DK1 — Doppelkopf Häufigkeit
Absolut + pro 4R. Die Alltagszahl, im Grunde die einzige Roh-Kennzahl.

### DK2 — Vitrinen-Doppelköpfe
Mehrere Doppelköpfe von EINER Person in EINEM Spiel als gestaffelte Auszeichnungen: 2er / 3er / 4er
(4 = Maximum lt. Datenmodell, die Krönung). Absolutzahl, Orden-/Rekord-Charakter, **keine Normierung**
(analog K6). Eine ehrliche **0** ist hier erlaubt und sogar reizvoll („den 4er hat noch niemand") –
echtes Ereignis, sauber erfassbar, KEINE Lücke (P3-Unterschied zu Fuchs 2024).

### Fuchs — Zwilling des Karlchens, aber nur EINE Bilanz

Der **Fuchs = Karo-Ass**. „Gefangen" = gegnerisches Karo-Ass überstochen (Sonderpunkt, mit
Verliererseite `Verlierer:in-ID`). „Verloren" = mein Fuchs wurde gefangen (abgeleitet aus dem
Fang-Eintrag der Gegenseite, wie beim Karlchen).
**Wichtiger Unterschied zum Karlchen:** Es gibt **kein „gemacht"** – einen Fuchs „macht" man nicht,
das Karo-Ass ist einfach da, man fängt es oder verliert es. Also nur EINE Medaille → nur die
**Jagdbilanz = gefangen − verloren** (der Name passt hier sogar noch besser als beim Karlchen).
**GRÖSSTER P2/P3-Fall des Konzepts:** Fuchs wurde 2024 KOMPLETT GAR NICHT erfasst (weder gefangen
noch verloren) → gesamte Fuchs-Statistik erst ab neuer Erfassung. Eine 0 für 2024 wäre die
größtmögliche Lüge (Füchse wurden gefangen, nur nie notiert).

### F1 — Fuchs gefangen (Häufigkeit)
Pro 4R (+ absolut). **P2** (Fuchs 2024 komplett nicht erfasst).

### F2 — Fuchs verloren (Häufigkeit)
Pro 4R (+ absolut). **P2**.

### F3 — Jagdbilanz (gefangen − verloren)
Pro 4R (+ absolut). **P2**.

### F4 — Vitrinen-Füchse
Beide Füchse einer Partie **gefangen** (Glanzleistung) bzw. beide eigenen Füchse **verloren** (das
Drama). Positiv- UND Negativrekord. Nicht super selten (gutes Blatt fängt oft beide; wer beide auf der
Hand hat, verliert oft beide), aber selten genug für die Vitrine. Absolutwerte. **P2**.

**Teamplay (→ T5):** von wem fange ich oft / an wen verliere ich oft / Fuchs-Battle Person vs. Person.

### Gestrichen
- **Sonderpunkt-Gesamtbilanz** — plumpe Addition aller Sonderpunkte verworfen: vermischt **Skill**
  (Karlchen) mit **Glück** (Doppelkopf) und ist als Teilsumme ohnehin im Gesamtscore enthalten. Die
  Einzelbilanzen (K4/K5, F3) tragen die Aussage.
  **ABER:** Der „woraus besteht mein Score"-Gedanke, der hier aufkam, ist viel größer und wird zur
  **Kernidee von Block 7 (Gesamtscore): die Score-Anatomie als Wasserfall** (s. Block 7).

### Datenqualität Block 6 gesamt
K1/K2 + DK1/DK2: auch 2024 erfasst → voll. K3–K5 (Verliererseite) fehlen 2024 → P2/P3.
Fuchs (F1–F4) komplett erst ab neuer Erfassung → P2/P3. Fuchs ist der größte Lückenfall.

---

## Block 7 — Gesamtscore: „Woraus besteht mein Erfolg?"


Spec nennt den Gesamtscore die „Königskennzahl", aber zugleich die am WENIGSTEN aussagekräftige (steigt
durch bloße Teilnahme). Die **Score-Anatomie** gibt ihm eine eigene Daseinsberechtigung: nicht nur
*wie viel*, sondern *woraus*.

### G1 — Gesamtscore klassisch + die kumulierte Verlaufskurve
Summe aller Spielwerte (absolut) + **pro 4 Runden** (die ehrliche, teilnahme-normierte Variante).
Absolutwert P6-immun, aber wenig aussagekräftig (s. o.).

**Zwei Zoom-Ebenen** (verbindet Block 7 mit dem Partie-Steckbrief / den Verlaufskurven – dieselbe Sache, zwei Blicke):
- **Herausgezoomt – alle zusammen:** kumulierte Punktekurve ALLER Spieler in EINEM Diagramm über die
  Zeit. Zeigt die ganze Wettkampf-Dramaturgie: wer führt, wer hat wen wann überholt (Führungswechsel =
  Kreuzungspunkte der Linien), wer stürzt ab / holt auf. **Die Rangliste ist hier kein separates
  Element**, sondern der rechte Rand der Kurve (wer oben endet, führt) – erzählerischer als eine
  statische Liste.
- **Hineingezoomt – eine Person:** Klick auf einen Spieler → sein **Wasserfall** (G2). Vom
  Wettkampf-Überblick zum persönlichen Innenleben mit einem Klick. Kurve = „wer & wann", Wasserfall =
  „woraus".

### G2 — Score-Anatomie (Wasserfall) — die Kernidee  ⭐
Zerlegt den (Durchschnitts-)Score in seine **Herkunfts-Schichten**, statt ihn als eine Zahl zu zeigen:
- **Grund-Score** — nackter Spielausgang (gewonnen/verloren), das Fundament
- **Ansage-Score** — Beitrag der Verdopplungen durch Re/Kontra + Absagen
- **Solo-Score** — Beitrag des dreifachen Solo-Hebels
- **Sonderpunkt-Score** — die kleinen Münzen (Karlchen/Fuchs/Doppelkopf)

**Darstellung als Wasserfall** (nicht Plus-gegen-Minus, das saldiert sich gegen null): von 0 aufbauen,
positive Beiträge stapeln, negative wieder herunterziehen, Endbalken landet exakt auf dem
Durchschnittsscore. Zeigt auf einen Blick „mein Plus kommt zu 70 % aus gewonnenen Spielen, aber meine
Ansagen kosten mich unterm Strich" – eine Geschichte, die eine einzelne Zahl nie erzählt.
**Synthese-Charakter:** bindet die anderen Kategorien zusammen – Ansage-Anteil ≈ Mut-Ertrag (R4),
Solo-Anteil ≈ Solo-Ertrag (S4), Sonderpunkt-Anteil ≈ Bilanzen (Block 6) – alle in EINEM Bild, auf den
Score normiert. (Energie-Flussdiagramm-Analogie / Sankey-nah.) ⚙️ *rechnerisch teuer → ggf. zuerst als
Datenbank-View (s. Architektur-Hinweis).*

**Offene Definitionsfrage (für Umsetzung):** Ansagen & Solo MULTIPLIZIEREN den Wert (addieren nicht),
daher muss die eindeutige Zerlegung „was war Grund, was war Ansage-Effekt" sauber definiert werden –
dieselbe mechanische Frage wie beim Mut-Ertrag (R4), Werkzeug also halb vorhanden. Lösbar, braucht
Sorgfalt.

*Architektur-Notiz (nicht jetzt zu entscheiden):* denkbar wäre, die Zerlegung direkt bei
Spiel-Erfassung in der DB mitzuführen statt sie live zu berechnen – Abwägung live vs. vorberechnet
folgt dem generellen Architektur-Hinweis oben (Implementierungs-Hinweis-Abschnitt), keine
Sonderregel für G2 nötig.

---

## Teamplay — Sammelabschnitt


> Eigene Kategorie, die sich durch alle Blöcke hindurch herausgebildet hat. Überwiegend Perspektive
> (nicht V1-Kern), aber zentral gesammelt, damit nichts verloren geht.

### T1 — Team-Chemie (fundamental, große Datenbasis)
Doppelkopf ist FAST IMMER ein Teamspiel: außer im Solo spielt man immer mit einem Partner (Re = die
zwei Kreuz-Damen, Rest = Kontra). Also gibt es in praktisch JEDEM Spiel eine Zweier-Konstellation, die
zusammen gewinnt/verliert → große, P6-freundliche Datenbasis (nicht nur die seltenen Hochzeiten).
- **Achse 1 – Paarung:** gemeinsame Siegquote jeder Zweier-Paarung (Robert+Jan, Sophia+Robert, …).
  Die „wer harmoniert mit wem"-Landkarte. Dream-Team vs. Pechpaar.
- **Achse 2 – verfeinert nach Re/Kontra-Rolle:** dieselbe Paarung als Re-Team (offensiv, mit Damen)
  vs. als Kontra-Team (defensiv) kann sich stark unterscheiden. (Gleiche Re/Kontra-Logik wie Block 3,
  hier im Teamplay.)
- **Spezialfall Hochzeit (aus Block 5):** „wen heirate ich" (Partnerwahl-Verteilung, z. B. 20× Kathrin,
  4× Robert) + „welche Ehe gewinnt" (Quote je Paarung). Offene Detailfrage: **gerichtet** (wer hatte
  die Damen / wer ist eingeheiratet) oder **ungerichtet**? Reine Komplexitäts-Abwägung, später.

### T2 — Übermut (aus Block 3)
Wessen Übermut reißt die PARTNER mit rein? Reine Häufigkeits-Zählung (Anzahl Spiele), zwei Rollen,
zwei Rankings:
- **Opfer-Ranking:** wie oft wurde GENAU DIESE Person durch den übermütigen (gescheiterten) Anruf
  eines wechselnden Partners um den sicheren Sieg gebracht.
- **Täter-Ranking (Gegenstück):** wie oft hat GENAU DIESE Person durch ihren eigenen übermütigen Anruf
  ihrem wechselnden Partner den sicheren Sieg gekostet. (Kathrin-Anekdote.)

### T3 — Fremder Mut: Partner-Glück & Gegner-Pech (aus Block 3, teilweise Zwilling von R4)
Was haben mir die An-/Absagen ANDERER an PUNKTEN gebracht/gekostet – aufgeteilt nach Rolle, nicht in
einen Topf geworfen (Partner- und Gegner-Beziehung sind inhaltlich zu verschieden für eine gemeinsame
Zahl, sonst verwässert die Story). Nur die Empfänger-Perspektive; die Täter-Perspektive entfällt
bewusst, weil sie rechnerisch R4 dupliziert (Doppelkopf teilt den Punkt-Swing zwischen Partnern – was
eine Person sich selbst durch Mut erspielt, hat sie automatisch auch ihrem jeweiligen Partner erspielt).
- **T3a – Partner-Glück:** wer hat über alle Partien hinweg am meisten Punkte durch mutige Ansagen
  seiner (wechselnden) Partner gewonnen.
- **T3b – Gegner-Pech:** wer hat am meisten Punkte durch mutige Ansagen seiner (wechselnden) Gegner
  verloren.
*Priorität: niedrig – bleibt im Vorrat, wird aber nicht als Erstes gebaut (s. Priorisierungskapitel).*

### T4 — Karlchen-Battle (aus Block 6, K)
Gerichtete Duelle um den Kreuz-Buben, erst durch die neu erfasste Verliererseite möglich: „von wem
fange ich besonders oft" (Lieblingsbeute) · „an wen verliere ich besonders oft" (Angstgegner) ·
Person vs. Person (Jan vs. Robert: wer fängt wem öfter weg).

### T5 — Fuchs-Battle (aus Block 6, F)
Dieselbe Duell-Logik wie T4, aber ums Karo-Ass – **eigene Zeile, weil eigene Datenqualitäts-Lage**:
Fuchs wurde 2024 komplett gar nicht erfasst (größter Lückenfall des Konzepts), Karlchen-Verliererseite
dagegen „nur" ab 2025. „Von wem fange ich besonders oft" (Lieblingsbeute) · „an wen verliere ich
besonders oft" (Angstgegner) · Person vs. Person, getrennt vom Karlchen-Battle geführt.

### T6 — Gegner-Bilanz (Ergänzung zu T1)
Siegquote/Netto-Bilanz in allen Spielen, in denen Person X mein **Gegner** war (Kontra, wenn ich Re
bin, oder umgekehrt) — die fehlende zweite Hälfte von T1, das NUR die Partner-Fälle zählt (gleiche
Seite). Zusammen decken T1 + T6 ALLE gemeinsam gespielten Spiele ab: „mit wem harmoniere ich" (T1)
vs. „gegen wen laufe ich gut" (T6).

**→ Darreichung:** siehe Schritt 3 – Darreichungsform, Abschnitt „Teamplay" am Dokumentende (dort
gebündelt statt hier verstreut).

---

## Kuriositätenkabinett (Fun Stats / Rekorde)


Eigener Block für seltene Ereignisse, Trophäen und Kuriositäten – KEINE Durchschnitts-/Quoten-Logik,
sondern Absolutzahlen mit Rekord-/Sammelcharakter.

**Prinzip Heimat vs. Ausstellung** (wie bei den Solo-Ansagen, Querverweis auf R1): Viele Kabinett-Stücke sind
konzeptionell & datentechnisch in ihrem Fachblock ZU HAUSE und werden hier nur zur Schau **ausgestellt**
(Leihgabe, Querverweis – keine Doppelpflege). Daneben gibt es **eigene Bewohner**, die nur hier ein
Zuhause haben.

### Eigene Bewohner (Heimat NUR hier)
**KUR1 — Gespaltener Arsch**
**Mechanik (präzisiert):** Genau 120:120 **Augen** → daraus folgt automatisch, dass die **Kontra-Partei
gewonnen** hat (Doko-Regel bei Augen-Gleichstand). Betrifft NUR den Augenstand, NICHT den Spielwert –
der Spielwert wird ganz normal aus Gewinner (= Kontra) + Re/Kontra-Ansagen + Absagen + Sonderpunkten
berechnet. Kann in JEDEM Spiel auftreten, sogar im Solo.
Kennzahl – **personenbezogen** (gemischte Rundenzusammensetzung → an Personen gezählt). Für die
beteiligte Person ein **Münzwurf**: Re-Seite = verloren, Kontra-Seite = gewonnen.
- Wie oft beteiligt (Absolutzahl) · davon gewonnen (war Kontra) / verloren (war Re).

**KUR2 — Sieg trotz netto-negativ** (Heimat hier; Wurzel in Block 1): Gewinner eines Spiels, der durch
gegnerische Sonderpunkte unterm Strich ins **Minus** rutscht.
**KUR3 — Netto-positiv trotz Niederlage** (Spiegelbild von KUR2): Verlierer eines Spiels, der durch eigene
Sonderpunkte (gefangene Karlchen/Füchse, Doppelköpfe) trotzdem mit **Plus** aus dem Spiel geht.

**KUR4 — Gebversuch-Ursachen (Verursacher-Statistik)** (Datenmodell ab jetzt)
Aus den neu erfassten „zusätzlichen Gebversuchen" (Heimat-Menge in A5): je Gebversuch eine von vier
Ursachen + ein Verursacher. Die URSACHEN gehören NICHT zu Ausdauer, sondern hierher – kuriose,
tischtaugliche Geschichten, je personenbezogen gezählt:
- **Fünf Neunen** — wie oft hattest DU fünf Neunen und musstest schmeißen. (Kartenpech)
- **Unrettbare Armut** — wie oft wollte niemand DEINE Armut aufnehmen. (Kartenpech)
- **Trumpfschwach** — wie oft war DEIN höchster Trumpf maximal ein Fuchs (kannst selbst keinen Fuchs
  stechen; darfst aber >3 Trümpfe haben). (Kartenpech) — *Begriff „trumpfschwach" festgelegt.*
- **Vergeben** — wie oft hast DU dich als Geber:in schlicht verteilt/verzählt. (Eigener Fehler →
  Tollpatsch-Orden.)
Erzählerische Trennung: drei = **Pech-Orden** (fünf Neunen / unrettbare Armut / trumpfschwach),
einer = **Tollpatsch-Orden** (vergeben). **P2/P3:** erst ab jetzt erfasst, Altdaten 0 = Lüge.

### Leihgaben (Heimat im Fachblock, hier nur ausgestellt) — persönlich gezählte Ereignisarten
Sorte A = „wie oft ist DIR das Kuriose passiert" (persönliche Zählung, existiert für jeden Spieler):
- **Doppel-Karlchen** (Königs-Sonderpunkt) → Heimat K6
- **Vitrinen-Doppelköpfe** 2/3/4 in einer Partie → Heimat DK2
- **Doppel-Fuchs** gefangen / verloren → Heimat F4
- *(Welche wirklich in die Vitrine kommen = Kuratierung in Schritt 3.)*
- 🚧 weitere persönlich gezählte Kuriositäten noch zu sammeln.

**Ort-Attribut:** Jeder KUR-Eintrag trägt neben dem Datum künftig auch den **Ort**, an dem er
passiert ist – kostet nichts (jede Partie hat ohnehin einen Ort), macht den Ort-Steckbrief möglich
(s. Ort-Block am Dokumentende).

> **Abgrenzung:** Allzeit-Bestwerte (bestes Spiel jemals, längster Streak jemals …) sind KEINE
> Kuriositäten, sondern EINZELNE Rekorde mit genau einem Inhaber → eigene Kategorie **Hall of Fame**
> (s. u.). Nicht mit den persönlich gezählten Kuriositäten vermischen.

---

## Hall of Fame (Allzeit-Rekorde)


Die **ewige Bestenliste** der Gruppe: Spitzen- und Tiefstwerte über die GESAMTE Historie, jeweils mit
**genau einem Inhaber + Datum**. Strukturell verschieden vom Kuriositätenkabinett:
- Kabinett = seltene **Ereignisart**, pro Person gezählt („wie oft ist DIR X passiert").
- Hall of Fame = **ein einzelner Rekord**, ein Inhaber („WER hält den Rekord", z. B. „bestes Spiel
  jemals: Jan, +76, 14.03.2024").

**Leihgabe-Prinzip:** Hall of Fame ist eine **Ausstellungsform**, kein eigener Datentopf – sie zieht
das Allzeit-Extrem jeder quantitativen Kennzahl aus deren Fachblock.

### HOF1 — Bestes / schlechtestes Spiel, Runde, Partie
Punktwert-Extreme auf allen drei Ebenen (Spiel/Runde/Partie), je Richtung (bester + schlechtester) →
6 Rekorde, Quelle L6/L7. Zeigt automatisch mit, ob es ein Solo war (ein Inhaber) oder ein Normalspiel
(zwei Inhaber derselben Seite) – ein Solo verdreifacht den Wert für eine Person, das schlägt praktisch
jede Ansage-Verdopplung im Normalspiel, daher ist der Extremwert so gut wie immer ein Solo.

### HOF2 — Längste Siegesserie / längste Pechsträhne
Zwei Rekorde, Quelle L5.

**Bewusst schlank gehalten:** Solo-Ertrag (S4), Absage-Rekord (R3–R5) und Karlchen-/Fuchs-Bilanz
(K4/K5/F3) bekommen **keinen eigenen HOF-Eintrag**, weil sie strukturell fast immer mit HOF1
deckungsgleich sind (s. o.) bzw. schon als Randnotiz in ihrem Heimatblock auftauchen. Jederzeit später
„beförderbar", falls sich zeigt, dass ein Rekord doch eine eigene Geschichte erzählt (z. B. falls ein
Normalspiel HOF1 schlägt, wird der Absage-Rekord plötzlich interessant). 🚧 Offen: grundsätzlich ist von
JEDER Kennzahl ein „Spitzenreiter aller Zeiten" denkbar; weitere Kandidaten wurden im Schritt-3-
Durchgang nicht mehr geprüft – bei Bedarf nachholen.

**Ort-Attribut:** Jeder HOF-Rekord trägt neben Inhaber + Datum künftig auch den **Ort**, an dem er
aufgestellt wurde – kostet nichts (jede Partie hat ohnehin einen Ort), macht den Ort-Steckbrief
möglich (s. Ort-Block unten und das universelle Darreichungs-Muster bei den Querschnitts-Achsen).

---

## Ort (O): „Wo wird gespielt?"


Ort-zentrierte Alternative zu den bisher überwiegend spielerzentrierten Blöcken: das Subjekt ist hier
der **Ort**, nicht die Person. Herkunft: aus der alten CLAUDE.md-Perspektive-Liste
(„Ortsstatistik") übernommen und geschärft.

**Bewusst kein Ort-Filter über bestehende Kennzahlen** (verworfen): „spiele ich an Ort X besser"
klingt zunächst wie die Personen-Filter-Idee (Achse 5), hat aber keinen plausiblen Mechanismus – die
Karten wissen nicht, wo der Tisch steht. Jeder Unterschied wäre Rauschen bei vermutlich sehr kleinen
Stichproben pro Ort (P6 würde das ohnehin meistens wegfiltern). Kein Aufwand für eine Erkenntnis, die
im Kern „kein Unterschied" lautet.

### O1 — Anzahl gespielter Partien je Ort
Reiner Zähler, keine Normierung nötig.

### O2 — Gespielte Dauer je Ort (Summe)
Summe der Partie-Dauer je Ort. Datenqualität **P2** – hängt an denselben Partie-Timestamps wie A6/A7
(alte Buchspiele ohne Zeiterfassung).

### O3 — Anzahl verschiedener Spieler:innen je Ort (über die gesamte Historie)
Zählt, wie viele unterschiedliche Personen je an diesem Ort mitgespielt haben – nicht zwangsläufig 4,
weil Gäste/wechselnde Runden dazukommen können. Unterscheidet private Orte (nur der feste
Stammtisch, vermutlich immer dieselben 4) von offenen Orten (z. B. Kneipe, deutlich mehr
verschiedene Mitspieler:innen über die Zeit).

**Verworfene Kandidaten:** Ø Dauer pro Partie am Ort (reine Ableitung aus O1/O2, keine eigene
Kennzahl); erstes/letztes Partie-Datum je Ort (netter Fun Fact, aber marginal – höchstens als
Randnotiz im Ort-Steckbrief, keine eigene Nummer).

### → Darreichung (Schritt 3)
Ort-Steckbrief (Klick auf einen Ort in der O1/O2/O3-Rangliste) zeigt zusätzlich zu O1–O3 auch die
HOF-Rekorde und KUR-Ereignisse, die an diesem Ort passiert sind – Anwendungsfall des universellen
Kompakt→Vollliste→Steckbrief-Musters (s. Querschnitts-Achsen), analog zum Spieler-Steckbrief.

---

## Drei Schau-Kategorien — saubere Abgrenzung (Merkhilfe)
- **Kuriositätenkabinett** — seltene *Ereignisarten*, pro Person gezählt. „Wie oft ist DIR das Kuriose passiert."
- **Hall of Fame** — *ewige Bestenliste*, ein Inhaber pro Rekord. „WER hält den Rekord."
- **Teamplay** — Duelle & Paarungen (Team-Chemie, Battles). „Wie läufst du GEGEN/MIT anderen."
- **Ort** — dieselben Fragen, aber mit dem Ort statt der Person als Subjekt. „WO wird gespielt."

---

## Schritt 3 — Darreichungsform

Legt fest, was auf welcher Ebene sichtbar ist: Navigationsstruktur, Nerd-Modus als Querschnittsschalter,
und die konkrete Darreichung für jeden der sechs Navigations-Einstiege sowie alle drei Steckbrief-Typen.

### Nerd-Modus: quer liegender Schalter, keine eigene Stufe


Der Begriff **„Nerd-Modus"** ist bereits in der CLAUDE.md festgelegt (Statistik-Abschnitt: „welche Stats
prominent angezeigt, welche hinter einem „Nerd-Modus" versteckt … ist eine UI-Entscheidung bei der
Implementierung"). Hier wird er präzisiert: Nerd-Modus ist **keine vierte Stufe** im Muster Kompakt →
Vollliste → Steckbrief, sondern ein **globaler Ein/Aus-Schalter**, der quer über alle drei Stufen liegt
– analog zu Zeitraum-Filter (Achse 2) und Personen-Filter (Achse 5). Er schaltet an derselben Stelle
zusätzliche technische Tiefe zu, ohne den Klickpfad zu verlängern (Beispiel: im Steckbrief steht normal
„Streuung: Box-Plot"; Nerd-Modus AN blendet zusätzlich „σ = 12,3" am selben Ort ein).

**Nebeneffekt (Monetarisierung, nicht Teil der fachlichen Definition):** Weil „hinter dem Schalter:
ja/nein" pro Kennzahl als einfache Eigenschaft modelliert wird, lässt sich später ein Pricing-Gate ohne
Änderung am Statistik-Konzept an genau diesen Schalter hängen.

Kandidaten, die hinter dem Schalter liegen könnten (vorläufig, endgültige Zuordnung folgt bei der
Kennzahlen-Durchdeklinierung in Schritt 3): Standardabweichung neben Box-Plot (L8) · exakte
Stichprobengröße hinter einer P6-gefilterten Quote · Farb-Drilldown bei Farb-Solo (S3), sobald
Datenqualität es hergibt · Modellwert-Kennzahlen (R4/T3/G2), weil sie eine Interpretationsannahme
tragen statt einer reinen Tatsache.

### Navigationsstruktur: sechs Top-Level-Einstiege


Zwei Klarstellungen aus der Diskussion, die der Struktur vorausgehen:
- Die 7 Fachblöcke (Leistung, Ausdauer, Risiko, Solo, Sonderspiele, Sonderpunkte, Gesamtscore) zeigen in
  Kompakt/Vollliste **keine „meine Werte"**, sondern eine Rangliste ALLER Spieler:innen zu einer
  Kennzahl-Kategorie. Die echte „meine Werte"-Sicht ist ausschließlich der Spieler-Steckbrief.
- Kuriositätenkabinett (KUR) und Ort (O) folgen strukturell demselben Rangliste-Muster wie die
  Fachblöcke (Kompakt → Vollliste → Steckbrief) – nur mit anderem Subjekt (Person bzw. Ort) oder
  anderer Tonalität (kurios statt ernst). Teamplay (Paar als Subjekt, Matrix) und Hall of Fame (ein
  Extremwert + ein Inhaber, keine Rangliste) sind die einzigen zwei echten Strukturausnahmen.

Daraus ergeben sich sechs gleichrangige Einstiege auf oberster Navigationsebene:

| Einstieg | Inhalt | Ziel bei Klick auf Person/Ort |
|---|---|---|
| **Gesamtscore** | Startbildschirm/Dashboard-Charakter (Synthese aller Kategorien, G1/G2) | Spieler-Steckbrief |
| **Hall of Fame** | Ewige Rekorde, je ein Inhaber – kein Ranking | – |
| **Ranglisten** | Zwischenebene: Auswahl aus 8 Blöcken (Leistung, Ausdauer, Risiko, Solo, Sonderspiele, Sonderpunkte, Kuriositätenkabinett, Orte) | bei 7 Blöcken → Spieler-Steckbrief; beim Orte-Block → Ort-Steckbrief |
| **Personen** | reines Verzeichnis aller Spieler:innen, keine eigene Kennzahl | Spieler-Steckbrief (identisches Ziel wie über Ranglisten) |
| **Teamplay** | Duelle & Paarungen (T1–T6), Matrix-Darstellung | – |
| **Orte** | Übersicht aller Orte (O1–O3) | Ort-Steckbrief (identisches Ziel wie über Ranglisten → Orte) |

**Konvergenz-Prinzip:** Spieler-Steckbrief und Ort-Steckbrief sind je eine einzige Zielseite, die über
mehrere Wege erreichbar ist (Ranglisten UND Personen bzw. Ranglisten UND Orte) – kein Duplikat, sondern
dieselbe Seite von zwei Einstiegen aus. Gesamtscore wurde bewusst NICHT zusätzlich als neunter
Ranglisten-Block geführt (anders als Orte), weil der Top-Level-Einstieg dort bereits dieselbe Ansicht
zeigen würde – keine zwei unterschiedlichen Blickwinkel wie bei Orte (Übersicht vs. O1–O3), also keine
Notwendigkeit für einen zweiten Pfad.

**Bewusst außerhalb des Scopes dieses Konzepts:** Menü-Layout, Icons, Auf-/Zuklapp-Verhalten, ob die
Navigation immer sichtbar ist – das sind UI-/Implementierungsentscheidungen (vgl. CLAUDE.md-Prinzip
beim Nerd-Modus: „UI-Entscheidung bei der Implementierung"), nicht Teil des Statistik-Konzepts.

**Noch offen (nächste Ebene von Schritt 3):** was innerhalb jedes Einstiegs passiert – z. B. wie die
Kompakt-Ansicht innerhalb eines Ranglisten-Blocks aussieht, was ein Klick auf eine einzelne Kennzahl
zeigt, wie sich mehrere Kennzahlen in der Vollliste sortieren/filtern lassen.

### Block-Seite innerhalb „Ranglisten": Layout und Klickpfade


- Klick auf „Ranglisten" (Top-Level) führt auf eine **Zwischenebene**: Umschalter zwischen den 8
  Block-Ranglisten (Leistung, Ausdauer, Risiko, Solo, Sonderspiele, Sonderpunkte, Kuriositätenkabinett,
  Orte). Ein Block ist beim Einstieg vorausgewählt, von dort auf jeden anderen umschaltbar – kein
  separater Klickweg pro Block nötig. *(Welcher Block Default ist, ist eine spätere/UI-Entscheidung,
  nicht Teil dieses Konzepts.)*
- Auf der Seite EINES Blocks (z. B. Leistung) werden **alle zugehörigen Kennzahlen gestapelt in
  Kompakt-Form** gezeigt (L1 Top 3, L2 Top 3, L3 Top 3, … jeweils als eigene Kachel) – man wählt nicht
  erst eine einzelne Kennzahl aus, sondern sieht den ganzen Block auf einen Blick.
- Aus jeder Kompakt-Kachel gibt es **zwei Klickziele**, kein erzwungener Umweg:
  - Klick auf die Kennzahl/Kachel selbst → **Vollliste** dieser einen Kennzahl.
  - Klick direkt auf einen der Top-3-Namen innerhalb der Kachel → **Spieler-Steckbrief** dieser Person
    (überspringt die Vollliste – präzisiert Punkt 3 des Kompakt→Vollliste→Steckbrief-Musters oben: der
    Sprung zum Steckbrief funktioniert aus BEIDEN Ebenen, nicht nur aus der Vollliste).
- Aus der Vollliste heraus ist derselbe Sprung auf jede einzelne Person → Spieler-Steckbrief weiterhin
  möglich (keine Sackgasse).
- Gilt symmetrisch für den Orte-Block (Steckbrief-Sprung landet dann im Ort-Steckbrief statt im
  Spieler-Steckbrief).

### Detailtiefe: Kompakt vs. Vollliste


- **Kompakt-Kachel:** zeigt nur Name + Wert (z. B. „Robert – Streak 7" oder „Jan – Gesamtscore 412"),
  bewusst OHNE Datum/Ort – Platzgrund, drei Kacheln müssen knapp bleiben.
- **Vollliste:** zeigt ALLE Einträge (nicht nur Top 3). Datum + Ort erscheinen dort aber **nur bei
  Extremwert-/Ereignis-Kennzahlen** – also wo EIN Eintrag EIN konkretes Ereignis ist: L5 (Streaks), L7
  (bestes/schlechtestes Einzelspiel), S4 (bestes/schlechtestes Solo), sowie alle HOF-artigen Werte
  (dort ohnehin schon so festgelegt: „Jeder HOF-Rekord trägt neben Inhaber + Datum künftig auch den
  Ort").
  **Bei aggregierten Kennzahlen** (Summe/Quote/Durchschnitt über den gewählten Zeitraum, z. B. L1
  Siegquote, G1 Gesamtscore) entfällt Datum/Ort – ein Eintrag fasst viele Partien zusammen, hat kein
  einzelnes Datum.

### Globaler Filter (Zeitraum + Personen) in der Navigation


Keine neue Entscheidung, sondern die Anbindung der bereits in Schritt 2 festgelegten universellen
Filter an die neue Navigationsstruktur: **Zeitraum-Filter (Achse 2)** und **Personen-Filter (Achse 5)**
sind ein **persistenter, globaler Zustand** – einmal gesetzt, gelten sie über die gesamte Navigation
hinweg (Ranglisten, Personen, Teamplay, Orte, Hall of Fame, Gesamtscore), bis sie geändert oder entfernt
werden. Keine Ansicht setzt ihren eigenen Filter zurück; man „drillt" sich durch die Statistiken, ohne
den einmal gesetzten Filter zu verlieren.
**Außerhalb des Scopes** (UI-Layout): wo genau der Filter auf dem Screen sitzt, wie er visuell aussieht
(Chip/Dropdown/Sidebar) – das ist Implementierungsdetail, wie schon beim Nerd-Modus festgehalten.

### Default-Sortierung der Verzeichnisse (Personen, Orte)


Die Vollliste innerhalb Ranglisten braucht keine zusätzliche Sortieroption – sie ist per Definition
schon nach der jeweiligen Kennzahl sortiert (Rang). Die Top-Level-Verzeichnisse **Personen** und
**Orte** haben dagegen keine eigene Rangliste als Sortiergrundlage und würden „nackt" alphabetisch
wirken – stattdessen wird eine bereits vorhandene Kennzahl als Default-Sortierschlüssel wiederverwendet
(kein neuer Datentopf):
- **Personen-Verzeichnis:** sortiert nach **A1** (Anzahl gespielter Partien), absteigend – Stammspieler:innen oben, Gelegenheitsgäste unten.
- **Orte-Verzeichnis:** sortiert nach **O1** (Anzahl gespielter Partien je Ort), absteigend – meistbespielter Ort oben.

**Einheit bewusst „Partien", nicht „Spiele" oder „Runden":** O1 existiert nur als Partien-Zählung – „Spiele je Ort" gibt es nicht als Kennzahl. Bei A1 gäbe es zwar alle drei Ebenen (Spiele/Runden/Partien), aber damit beide Verzeichnisse dieselbe Einheit verwenden und nichts Neues erfunden werden muss, wird bei Personen ebenfalls die Partien-Ebene von A1 genommen.

**Der Sortierwert wird direkt neben Name/Ort angezeigt** (z. B. „Robert – 87 Partien", „Kathrins Wohnzimmer – 42 Partien") – kein zusätzliches „dabei seit"-Datum o. Ä. in der Verzeichniszeile, da die App gerade neu aufgesetzt wird und ein Beitrittsdatum aktuell nichts Aussagekräftiges liefern würde. Weitere Details erst im jeweiligen Steckbrief.

*Zukunfts-Vorbehalt:* Bei sehr vielen Einträgen wäre eine wählbare Sortierung (z. B. alphabetisch als
Alternative) denkbar – aktuell nicht nötig, kein Scope jetzt.

### Gesamtscore-Startbildschirm


- **Default-Ansicht: die kumulierte Verlaufskurve (G1)**, nicht eine Kompakt-Kachel wie bei Ranglisten –
  die Kurve enthält das Ranking bereits (rechter Rand = aktueller Stand, „wer oben endet, führt"),
  erzählt aber zusätzlich die Dramaturgie (Führungswechsel, Auf-/Abstiege), die eine reine Liste
  wegwirft.
- **Umschaltbar auf aktuelles Ranking** (Snapshot-Liste) als Alternative zur Kurve – beide Ansichten
  desselben G1-Wertes, kein neues Datenkonzept.
- **Linien-Reduktion gegen Wirrwarr:** Standardmäßig werden nur die Top 5–6 Linien gezeigt. Dafür wird
  KEIN neues Steuerelement gebraucht, sondern der bereits bestehende globale Personen-Filter (Achse 5)
  wiederverwendet – ohne aktiven Filter gilt der Top-5/6-Default, mit aktivem Filter zeigt die Kurve
  exakt die gewählten Personen.
- **Beschriftung:** keine separate Legende (Farbkästchen + Namen unten). Stattdessen stehen Platzierung
  (1, 2, 3, …) + Name direkt am rechten Kurvenrand, in derselben Farbe wie die zugehörige Linie, in
  Rangreihenfolge übereinander gestapelt – das ist zugleich die Rangliste.
- **Klick auf eine Person** – auf die Linie im Diagramm selbst, auf die Randbeschriftung (Platzierung +
  Name rechts) ODER auf den Eintrag in der umgeschalteten Ranking-Liste, alle drei gleichwertig – führt
  zu ihrem **Spieler-Steckbrief**. Der **Wasserfall (G2)** ist dabei KEINE eigene Zielseite, sondern
  einer der Abschnitte innerhalb des Spieler-Steckbriefs (Konsistenz mit dem Konvergenz-Prinzip: „Klick
  auf eine Person" führt immer zur selben einen Steckbrief-Seite, egal von wo). *Layout/Platzierung des
  Wasserfalls im Steckbrief wird bei den Steckbrief-Inhalten am Schluss geklärt, hier nur vorgemerkt.*
- *Offen, unkritisch:* zeigt die umgeschaltete Ranking-Liste ebenfalls nur Top 5/6 oder immer alle
  (bei kleiner Gruppe spricht einiges für „alle") – kann später final entschieden werden.

### Hall of Fame


Keine Kompakt/Vollliste-Unterscheidung nötig – die Menge ist mit 8 Rekorden fest und klein:

- **Layout: zweispaltig, paarweise.** 4 Zeilen × 2 Spalten = 8 Kacheln, links der Positivrekord, rechts
  direkt daneben der korrespondierende Negativrekord derselben Ebene:
  1. Bestes Spiel | Schlechtestes Spiel
  2. Beste Runde | Schlechteste Runde
  3. Beste Partie | Schlechteste Partie
  4. Längste Siegesserie | Längste Pechsträhne
- **Kachel-Inhalt HOF1 (Zeilen 1–3):** Avatar + Name des Inhabers (bei Solo eine Person, bei Normalspiel
  die gewinnende/verlierende Seite) · Wert (Punktzahl) · Datum · **Ort**.
- **Kachel-Inhalt HOF2 (Zeile 4):** Avatar + Name · Länge der Serie · Datum (Start–Ende) · **kein Ort**
  – eine Serie kann über mehrere Partien und damit mehrere Orte laufen, „ein Ort pro Rekord" passt hier
  nicht, daher entfällt das Feld bewusst (Abweichung vom generellen „Ort-Attribut" bei HOF1).
- **Klickziele:** Name → Spieler-Steckbrief, Ort (nur HOF1) → Ort-Steckbrief – beides bereits bestehende
  Zielseiten, kein neues Konzept.

### Teamplay


Nicht alle sechs Kennzahlen sind gleich strukturiert – zwei Gruppen:

**Rankbar (Standard-Ansicht = Rangliste, Matrix = Nerd-Modus-Deep-Dive):**

| Kennzahl | Standard-Ansicht | Nerd-Modus |
|---|---|---|
| **T1** Team-Chemie | Duo-Ranking, absteigend nach Siegquote | Matrix (alle Paare auf einmal) |
| **T2** Übermut | zwei Ranglisten: Opfer-Ranking + Täter-Ranking (Häufigkeit, absteigend) | gerichtete Matrix (Täter×Opfer je Zelle) – die beiden Ranglisten sind ihre Randsummen |
| **T3a** Partner-Glück | ein Ranking, Punkte, absteigend | Partner-Matrix (Zelle = Punkte durch genau diese Person als Partner) |
| **T3b** Gegner-Pech | ein Ranking, Punkte, absteigend | Gegner-Matrix (eigene, nicht mit T3a kombiniert – Partner-/Gegner-Beziehung inhaltlich zu verschieden für eine gemeinsame Zelle) |

**Nur Direktvergleich, keine sinnvolle Rangliste** (ein Personen-Aggregat würde eine bereits
bestehende Kennzahl duplizieren – der Mehrwert dieser drei ist gerade das „gegen wen genau"):

| Kennzahl | Warum nicht rankbar | Zugang |
|---|---|---|
| **T4** Karlchen-Battle | Aggregat = K5 (Jagdbilanz Karlchen) | Personen-Filter (2 Personen) → Head-to-Head |
| **T5** Fuchs-Battle | Aggregat = F3 (Jagdbilanz Fuchs) | Personen-Filter (2 Personen) → Head-to-Head |
| **T6** Gegner-Bilanz | Aggregat = L1 (Gesamt-Siegquote) | Personen-Filter (2 Personen) → Head-to-Head |

**Gemeinsamer Zugang für alle sechs:** Klick auf einen Ranking-Eintrag (Duo bei T1, Person bei T2/T3a/
T3b) setzt den globalen Personen-Filter (Achse 5) auf die beteiligten Personen und öffnet automatisch
die Head-to-Head-Ansicht – kein neues Steuerelement, Wiederverwendung des bereits definierten Filters.
Matrix-Darstellung (Nerd-Modus): Spieler:innen in Zeilen UND Spalten, Diagonale bleibt leer (Person
kann nicht gegen/mit sich selbst spielen).

### Spieler-Steckbrief

Sechs inhaltliche Abschnitte – bewusst schlank, weil ein möglicher weiterer Bereich („alle eigenen
Werte im Detail") sich als reiner Link auf bereits Bestehendes herausgestellt hat, kein neuer Inhalt:

- **A – Kopf/Identität:** Name, Avatar.
- **B – Gesamtscore:** aktueller Stand + der G2-Score-Wasserfall dieser Person.
- **C – Highlights:** alle Kennzahlen aus den 8 Ranglisten-Blöcken, bei denen die Person in der
  jeweiligen Kompakt-Top-3 auftaucht – nutzt exakt denselben Top-3-Schwellenwert, der ohnehin überall
  als Kompakt-Standard gilt, nur auf „eigene Werte" angewendet statt auf „alle Spieler:innen".
  **Fallback:** taucht die Person nirgends in einer Top-3 auf, werden ersatzweise ihre besten
  vorhandenen Ränge gezeigt, egal welcher Platz.
- **D – Spielstil:** drei kurze, personenbezogene Charakter-Labels statt roher Zahlen – Ergebnisse
  bereits vorhandener Kennzahlen, keine neuen Datentöpfe:
  - **Ø Reizhöhe** (aus R1) — Zocker- vs. Sicherheitsspieler-Einordnung.
  - **Lieblings-Solo** (aus S3) — welcher Solo-Typ heraussticht.
  - **Mut-vs-Können-Quadrant** (aus S1 × S2) — z. B. „Sniper" (selten, aber treffsicher). Die volle
    Matrix mit allen Spieler:innen läuft separat als Nerd-Modus-Visualisierung im jeweiligen
    Ranglisten-Block (Solo bzw. Risiko) – hier nur das eigene Ergebnis als ein Wort.
- **E – Teamplay:** die eigene Zeile/Spalte aus den Teamplay-Matrizen (bester Partner aus T1, härtester
  Gegner aus T6, eigene Opfer-/Täter-Werte aus T2, Partner-Glück/Gegner-Pech aus T3a/T3b).
- **F – Hall of Fame:** falls die Person Inhaber:in eines der 8 Rekorde ist.

**Kein eigener „Alle Werte"-Bereich:** Ein Link/Button führt stattdessen zu **Ranglisten**, mit dem
globalen Personen-Filter (Achse 5) automatisch auf genau diese eine Person voreingestellt – dieselbe
Seite, die für die normale Ranglisten-Navigation eh schon existiert, nur vorgefiltert. Kein neuer
Seitentyp, keine Dopplung von C oder D.

**Filter-Verhalten beim Verlassen:** Der beim Betreten eines Steckbriefs automatisch gesetzte
Personen-Filter wird beim Verlassen des Steckbriefs wieder zurückgesetzt – sonst bliebe man beim
Weiternavigieren (z. B. zu Hall of Fame) unbeabsichtigt auf diese eine Person gefiltert.

### Ort-Steckbrief


Analog zum Spieler-Steckbrief, aber schlanker – ein Ort hat weder Gesamtscore noch Spielstil noch
Teamplay-Beziehungen, dafür etwas, das eine Person nicht hat (Kuriositäten):

- **A' – Kopf/Identität:** Ortsname (statt Name/Avatar einer Person).
- **B, D, E – entfallen komplett:** kein Gesamtscore/Wasserfall, kein Spielstil (Reizhöhe/Solo-
  Vorlieben sind Personen-Eigenschaften), keine Teamplay-Matrix – alles drei ergibt für einen Ort
  keinen Sinn.
- **C' – Highlights:** die Ort-Kennzahlen (O1–O3), bei denen dieser Ort in der jeweiligen Kompakt-Top-3
  auftaucht, gleicher Top-3-Fallback wie beim Spieler-Steckbrief.
- **F' – Hall of Fame:** Rekorde (HOF1-Werte, die einen Ort tragen), die an diesem Ort passiert sind.
- **G' – Kuriositätenkabinett (neu ggü. Spieler-Steckbrief):** KUR-Ereignisse, die an diesem Ort
  passiert sind – bereits so vorgemerkt („dieselben Einträge wie in KUR/HOF, nur nach Ort statt nach
  Person/Zeit sortiert aufgerufen").

Kein „Alle Werte"-Link nötig wie beim Spieler-Steckbrief, da O1–O3 mit nur drei Kennzahlen ohnehin
schon vollständig unter C' passen – kein Bedarf für eine gefilterte Ranglisten-Ansicht als Ergänzung.

*Offen, unkritisch, nicht entschieden:* ein Mini-Ranking „wer hat an diesem Ort am meisten gewonnen"
(Personen-Ranking gefiltert auf einen einzelnen Ort) wäre denkbar, ist aber noch nicht bestätigt –
bei Bedarf später ergänzen.

### Partie-Steckbrief


Liegt außerhalb der Statistik-Navigation (im Partie-Details-Screen, hinter „Details" beim Endstand,
vgl. CLAUDE.md) – kein Teil des Konvergenz-Prinzips von Spieler-/Ort-Steckbrief, aber dieselbe
Kuratierungs-Logik: bestehende Kennzahlen, gefiltert auf genau eine Partie, kein neuer Datentopf.

- **Kopf:** Datum + Ort der Partie.
- **Verlaufskurve über die Spiele dieser Partie, inklusive Endstand:** dieselbe Lösung wie beim
  Gesamtscore-Startbildschirm – kein separates „Endstand"-Element nötig, der rechte Kurvenrand TRÄGT
  den Endstand schon (Platzierung + Avatar + Name je Linie, meist ohnehin nur 4–5 Spieler:innen an
  einem Abend, also übersichtlich ohne Reduktion auf Top 5/6).
- **Bester/schlechtester Einzelspielwert des Abends** (samt Inhaber:in – dieselbe Logik wie L7, nur auf
  die Partie begrenzt).
- **Streak des Abends:** längste Sieg-/Niederlagenfolge, die innerhalb dieser einen Partie auftrat –
  Wiederverwendung von L5, aber bewusst nur der Ausschnitt „innerhalb dieses Abends" (eine „echte"
  L5-Streak kann über Partie-Grenzen hinweglaufen; hier zählt nur, was an diesem einen Abend passierte,
  analog zum Einzelspielwert oben).
- **Anzahl Solos/Sonderpunkte/Sonderspiele** an diesem Abend, **mit Benchmark gegen die
  Durchschnittspartie** – z. B. „4 Soli (Ø 2,3 pro Partie in der Gruppe)". Leichtgewichtig: kein neuer
  Eintrag im Kennzahlen-Vorrat, sondern ein an dieser Stelle direkt berechneter Kontext-Durchschnitt
  (Gesamtzahl über ALLE Partien der Dokorama-Gruppe ÷ Anzahl Partien) – kein eigenes Ranking, keine
  P6-Behandlung nötig, dient nur als Einordnungshilfe. **Bewusst nur der reine Durchschnittswert**,
  keine Min/Max/Median-Bandbreite mit Strahl – aus Kompaktheitsgründen (Partie-Steckbrief soll laut
  CLAUDE.md kompakt bleiben). *Vorgemerkte Idee für später:* Min/Max/Median als Strahl mit
  Markierung, wo die heutige Partie liegt – hübscher, aber mehr Platz, aktuell zurückgestellt.
- **HOF/KUR-Ereignisse, die an diesem Abend passiert sind** (konsistent zum Ort-Steckbrief).
- **Neue Rekorde/Ranking-Veränderungen durch diese Partie** – „du bist heute Abend neue:r
  Rekordhalter:in bei X geworden" bzw. „neu in die Top 3 bei Y gerutscht". Anders als die Elemente
  oben ist das kein reines Filtern (Partie-ID als Filter), sondern ein **Vorher-Nachher-Vergleich**:
  Rangzustand jeder rankbaren Kennzahl unmittelbar vor dieser Partie gegen den Zustand danach. ⚙️
  **Rechnerisch teuer**, ähnlich wie R4 – zusätzlich unscharf bei nachträglich importierten/historischen
  Partien (Robert-Import), wo „vorher" nicht immer eindeutig ist, wenn nicht chronologisch sauber
  eingegeben wird. **Bleibt im Vorrat, aber niedrige Priorität** – wird nicht als Erstes gebaut (s.
  Priorisierungskapitel), inhaltlich aber Teil des Partie-Steckbriefs. *Verwandte Idee, hier nur
  vorgemerkt statt spezifiziert:* dieselbe Information könnte auch direkt als Hinweis unmittelbar nach
  Abschluss der Dateneingabe erscheinen, nicht erst beim späteren Aufruf des Steckbriefs – eigene
  Konzept-Runde nötig (Benachrichtigungs-Mechanik), nicht Teil von Schritt 3.

Kein Gesamtscore-Wasserfall, keine Teamplay-Matrix, kein Personen-Filter-Link – diese Elemente gehören
zum Spieler-Steckbrief, nicht zur Partie-Ebene.

---

## Schritt 4 — Priorisierung / Bau-Reihenfolge


**Navigations-Prinzip:** Die Navigation wächst MIT dem tatsächlich Fertigen – kein „Coming Soon" für
Ungebautes. Begründung: kleine, geschlossene Freundesrunde ohne Bedarf an vollständig wirkendem
Produkt, und „Coming Soon"-Zustände wären zusätzlicher Bauaufwand ohne Lernwert für ein Hobbyprojekt.

**Bewusst ausgeklammert:** Ob Statistik-Werte live aus den Rohdaten berechnet oder in einer eigenen
aggregierten Tabelle vorgehalten werden, ist eine Backend-/Performance-Frage, keine Konzeptfrage. Bei
der Größe der Gruppe (Handvoll Spieler:innen, wenige hundert Partien) ist Live-Berechnung mit hoher
Wahrscheinlichkeit ausreichend schnell – falls nicht, ist das eine spätere Implementierungs-
Optimierung (DB-Views, Indizes), kein Teil dieses Dokuments.

### Tier 1 — sofort
- Gesamtscore-Startbildschirm
- Ranglisten-Basis: Leistung, Ausdauer
- **Infrastruktur, die ab hier existieren muss:** P6 (Mindest-Stichprobe-Filter, wird schon bei
  Siegquoten in Leistung/Ausdauer gebraucht), Zeitraum-Filter (Total/Kalenderjahr), Nerd-Modus-Schalter
  (wird schon bei L8 „Streuung" innerhalb Leistung gebraucht).

### Tier 2 — direkt danach
- Personen-Verzeichnis + Spieler-Steckbrief (Konvergenzpunkt von allem, macht Ranglisten erst richtig
  nutzbar)
- Restliche Ranglisten-Blöcke: Risiko, Solo, Sonderspiele, Sonderpunkte
- **Partie-Steckbrief-Kern** (Verlaufskurve inkl. Endstand, bester/schlechtester Einzelspielwert,
  Streak des Abends, Solo-/Sonderpunkte-Anzahl mit Benchmark, HOF/KUR-Ereignisse des Abends) – hoher
  Gameflow-Wert direkt nach Partie-Abschluss, günstig zu bauen (reines Filtern bereits vorhandener
  Daten), daher vorgezogen statt bei Teamplay/Orte in Tier 3/4 mitzulaufen.
- **Infrastruktur, die ab hier existieren muss:** Personen-Filter (Achse 5) – erste echte Notwendigkeit
  ist der automatisch gesetzte Filter beim Betreten des Spieler-Steckbriefs.

### Tier 3 — später
- Orte + Ort-Steckbrief
- Hall of Fame
- Kuriositätenkabinett (strukturell einer der 8 Ranglisten-Blöcke, aber Vitrine-/Fun-Charakter wie
  Hall of Fame statt ernster Leistungsmessung – daher hier statt bei Tier 2 einsortiert)

### Tier 4 — deutlich später
- Teamplay komplett (T1, T2, T3a, T3b, T4, T5, T6) – T3a/T3b zusätzlich mit eigenem Low-Priority-
  Vermerk aus Schritt 1/3 (dünnste Story der ganzen Kategorie)
- Partie-Steckbrief „Neue Rekorde/Ranking-Veränderungen"-Feature – rechnerisch teuer
  (Vorher-Nachher-Vergleich über alle rankbaren Kennzahlen), unscharf bei historischem Import

---

Die Übernahme in Roadmap Block C und CLAUDE.md Abschnitt 7 ist ein eigener Claude-Code-Auftrag
(s. Status-Hinweis am Dokumentanfang).
