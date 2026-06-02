-- DOKORAMA – RLS-Policies für die Entwicklungsphase
-- ACHTUNG: Diese Policies sind bewusst offen – alles ist lesbar und schreibbar.
-- In Phase 3 (Auth) werden sie durch echte Benutzerregeln ersetzt.

-- Lesen für alle Tabellen
CREATE POLICY "dev_read" ON players              FOR SELECT USING (true);
CREATE POLICY "dev_read" ON groups               FOR SELECT USING (true);
CREATE POLICY "dev_read" ON venues               FOR SELECT USING (true);
CREATE POLICY "dev_read" ON group_memberships    FOR SELECT USING (true);
CREATE POLICY "dev_read" ON sessions             FOR SELECT USING (true);
CREATE POLICY "dev_read" ON rounds               FOR SELECT USING (true);
CREATE POLICY "dev_read" ON round_participations FOR SELECT USING (true);
CREATE POLICY "dev_read" ON games                FOR SELECT USING (true);
CREATE POLICY "dev_read" ON game_results         FOR SELECT USING (true);
CREATE POLICY "dev_read" ON announcements        FOR SELECT USING (true);
CREATE POLICY "dev_read" ON special_points       FOR SELECT USING (true);

-- Schreiben (wird in Phase 3 eingeschränkt)
CREATE POLICY "dev_write" ON sessions              FOR INSERT WITH CHECK (true);
CREATE POLICY "dev_write" ON rounds                FOR INSERT WITH CHECK (true);
CREATE POLICY "dev_write" ON round_participations  FOR INSERT WITH CHECK (true);
CREATE POLICY "dev_write" ON games                 FOR INSERT WITH CHECK (true);
CREATE POLICY "dev_write" ON game_results          FOR INSERT WITH CHECK (true);
CREATE POLICY "dev_write" ON announcements         FOR INSERT WITH CHECK (true);
CREATE POLICY "dev_write" ON special_points        FOR INSERT WITH CHECK (true);

-- Aktualisieren
CREATE POLICY "dev_update" ON sessions     FOR UPDATE USING (true);
CREATE POLICY "dev_update" ON rounds       FOR UPDATE USING (true);
CREATE POLICY "dev_update" ON games        FOR UPDATE USING (true);
CREATE POLICY "dev_update" ON game_results FOR UPDATE USING (true);

-- Löschen
CREATE POLICY "dev_delete" ON announcements  FOR DELETE USING (true);
CREATE POLICY "dev_delete" ON special_points FOR DELETE USING (true);
CREATE POLICY "dev_delete" ON games          FOR DELETE USING (true);
