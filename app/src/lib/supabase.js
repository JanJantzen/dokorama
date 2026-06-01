// Supabase-Client – die Verbindung zur Datenbank
// Dieser Client wird in der gesamten App verwendet um Daten zu lesen und zu schreiben.
// Die URL und der Key kommen aus der .env-Datei (niemals direkt hier eintragen!).

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
