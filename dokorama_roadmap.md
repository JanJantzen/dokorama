# Dokorama – Roadmap

> **Roadmap-Regel:** Ein Punkt wird erst als ✅ markiert wenn Jan explizit „done" sagt – nicht schon wenn Code dazu gebaut wurde.

---

## ✅ Phase 1: Fundament – abgeschlossen 1. Juni 2026

1. ✅ **Entwicklungsumgebung:** Node.js, React/Vite, Tailwind CSS + shadcn/ui, GitHub-Repo
2. ✅ **Cloud-Dienste:** Supabase (EU/Frankfurt), Vercel, automatisches Deployment via GitHub
3. ✅ **Datenbank-Schema** in Supabase angelegt (11 Tabellen, RLS aktiviert) → `database/schema.sql`
4. ✅ **Design-Grundlagen:** Waldgrün als Primärfarbe, heller Hintergrund, schlicht und clean
5. ✅ **Basis-Frontend:** Routing, Tab-Bar (Übersicht / Statistiken / Spieler), Vollbild-Erfassungsscreen
6. ✅ **Seed-Daten:** Gruppe „Dokorama" (gegr. 16.05.2018) + 11 Spieler:innen → `database/seed.sql`

**Technischer Stand:** Supabase-Client verbunden (`src/lib/supabase.js`), App live unter `dokorama.vercel.app`, Struktur: `Dokorama/app/` (React-Code), `Dokorama/database/` (SQL-Dateien)

---

## ✅ Phase 2: Erfassung – abgeschlossen 22. Juni 2026

**Architektur-Fundament (✅ abgenommen):**
- `SessionContext` + `GameContext`: geteilter Zustand für Multi-View-Erfassung
- `TableView` (Tisch-Ansicht) aus `SessionPage` extrahiert
- `BlockView` als Platzhalter angelegt, Architektur bereit
- View-Switcher im Header (Icon der jeweils anderen Ansicht)

7. ✅ **Partie starten** (Datum, Austragungsort, anwesende Spieler:innen aus Pool wählen, Sitzreihenfolge)
8. ✅ **Runden-Logik** (automatische Verwaltung, Rotation, Aussetzer-Berechnung, Verlängerung bei Solo)
9. ✅ **Tisch-Ansicht Einzelspiel erfassen** – `TableView` abgenommen. Die Konsistenz-/Konfliktlogik wird nach der separaten Spec **`KONSISTENZREGELN.md`** umgesetzt. Umsetzung in 7 abgeschlossenen Teilen:
   - **Teil 0 – Fundament** ✅: Zentrale Konsistenz-Engine im `GameContext`, Invarianten I1–I13, Dialog-Infrastruktur
   - **Teil 1 – An-/Absagen** ✅: zweite gleiche An-/Absage im Team → Korrektur-Dialog
   - **Teil 2 – Partei-Knoten** ✅: Drei-Zustands-Toggle, Kaskade, Tausch/Annullieren
   - **Teil 3 – Sonderspiele** ✅: Rollen anpinnen, Partei-Fixierung, Unteilbarkeit
   - **Teil 4 – Sonderpunkte** ✅: tischweites Kontingent, „von wem"-Nachfassen, Karlchen-Constraints
   - **Teil 5 – Wisch-Geste** ✅: zwei Spieler per Wisch zu einem Team verbinden
   - **Teil 6 – Fallback + Logging** ✅: generischer Block-Dialog + persistente DB-Log-Tabelle `consistency_logs`
10. ✅ **Spielwert automatisch berechnen** – `scoreCalculation.js` gebaut, gegen 15 Testfälle validiert
11. ✅ **Auswertungs-Screen & Bestätigung** – `EvaluationView` gebaut
12. ✅ **Korrektur/Löschen von Spielen**
13. ✅ **Spielstandanzeige** – Pokal-Button öffnet aktuellen Spielstand der Partie
14. ✅ **Runden-Übergang** – Hinweis „Runde X beendet!", Punktetabelle, Optionen „Nächste Runde / Partie beenden"
15. ✅ **Hamburger-Menü** – alle V1-Menüpunkte implementiert
16. ✅ **Partie abschließen** – vollständiger Flow inkl. Hinweis bei unfertiger letzter Runde
17. ✅ **Laufende & fertige Partien** – Übersicht und Handling beider Zustände auf der Startseite

---

## ✅ Auth-Phase: Login – abgeschlossen 25. Juni 2026

- ✅ `AuthContext`: Login-Zustand für die gesamte App (`user`, `player`, `loading`)
- ✅ `LoginPage` (`/login`): E-Mail + Passwort, Rücksprung zur Ausgangsseite
- ✅ Schreib-Aktionen geschützt: Partie starten, Spiel bearbeiten, Partie löschen
- ✅ Laufende Partie: Klick → Spielstand-Screen, von dort „Partie weiterschreiben" (Login-Gate)
- ✅ `sessions.created_by` beim Anlegen gesetzt (Grundlage für Auth-Stufe 3)
- ✅ `consistency_logs.writer_id` mit Auth-UUID befüllt
- ✅ DB-Migration 005 ausgeführt (`players.auth_user_id`, `sessions.created_by`)
- ✅ Jan + Robert in `players.auth_user_id` verknüpft

**Auth-Stufen noch offen:**
- Stufe 2: Lesender Gruppen-Link (aktuell schon weitgehend offen – Lesen ohne Login, nur Schreiben erfordert es)
- Stufe 3: Nur Partie-Ersteller:in schreibt (Fundament liegt: `created_by` vorhanden)
- Stufe 4: Paralleles Schreiben + Duplikat-Schutz (bewusst zurückgestellt)

---

## Phase 2b: Block-Ansicht

Neue alternative Erfassungs-UI: nüchterner Schreibblock-Stil, alle Infos auf einer Seite ohne Sheets. Teilt denselben `GameContext` – Zustand bleibt beim Wechsel erhalten. Architektur ist bereit (Platzhalter `BlockView` existiert).

18. **Block-Ansicht bauen** – Inhalt hinter dem Platzhalter implementieren

---

## ✅ Phase 3: App einsatzbereit machen

19. ✅ **PWA-Setup** – `manifest.json`, Icons 192/512 + maskable (Safe-Zone-Padding auf Waldgrün-Canvas), Service Worker via `vite-plugin-pwa` (Workbox), `OfflineBanner`, Datenverlust-Schutz durch `draft.js`
20. Responsive Design Feinschliff

**→ Ab hier kann die App das Büchlein ersetzen!**

---

## Phase 4: Statistiken (Basis)

21. Gesamtscore / Rangliste
    - *Perspektivisch:* Zwischenstand je Rundenende + Verlaufskurve pro Spieler:in (Chart)
22. Leistung (Siegquoten, Durchschnitte, Streaks – auf allen drei Ebenen)
23. Ausdauer / Engagement (Teilnahme, Anwesenheitsquote)
24. Zeitraum-Filter (Total, Kalenderjahr)

---

## Phase 5: Statistiken (Erweitert)

25. Risikofreude (Ansagen-Statistiken)
26. Einzelkämpfer (Solo-Statistiken)
27. Sonderpunkte & Sonderspiele
28. Normierung auf pro 4 Runden

---

## Phase 6: Extras

29. Export-Funktion (CSV/JSON)
30. Realtime-Updates (Supabase Realtime)

---

## Historische Daten (parallel ab Phase 2)

31. **Excel-Import (2024):** Import-Script für die vorhandene Excel-Datei
32. **Foto-Workflow (2025/2026):** Fotos von Roberts handgeschriebenen Zetteln transkribieren, in CSVs übersetzen, importieren
33. **CSV-Import in der App:** Feature zum Importieren der erstellten CSVs

---

## Irgendwann / kein fester Zeitpunkt

- Öffnung für andere Gruppen (Multi-Tenancy, Regelkonfiguration, Konfigurations-UI)
- Echtes User-Management für alle Spieler:innen
- Free/Pay-Modell (Stripe-Integration)
- Notifications
- Sichtbarkeitslogik für Austragungsorte (öffentlich/privat)
- Head-to-Head Statistiken
- Ortsstatistik
- Fun Stats / Rekorde
- Ortsspezifische Hintergrundbilder für den Erfassungsscreen
- Individuelle Drehung der Tischansicht (jede:r sieht sich selbst unten links)
- Weitere alternative Erfassungs-UIs (z.B. Diktat-Ansicht)
- View-Präferenz (Tisch/Block) pro eingeloggtem Schreiber in User-Profil speichern
- Doko-Dating, gruppenübergreifende Statistiken
- Turniere
- Monetarisierung
- Parallele Partien pro Gruppe
- Volle Offline-Erfassung mit Sync
- Kollaboratives Schreiben (mehrere erfassen gemeinsam ein Spiel in Echtzeit)
