# database/imports/

Ablage für die historischen Import-JSONs aus Roberts Büchlein (Format: siehe
`ROBERT_IMPORT.md`, eine Datei pro Spielabend/Partie).

Import mit dem Skript (aus dem Repo-Root ausführen):

```bash
# Dry-Run: prüft die Datei und zeigt, was importiert würde – schreibt NICHTS
node app/scripts/import_session.mjs database/imports/dokorama_import_2026-06-10.json

# Echter Import: schreibt in die DB (alles-oder-nichts)
node app/scripts/import_session.mjs database/imports/dokorama_import_2026-06-10.json --commit
```
