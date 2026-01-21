import { createClient } from '@supabase/supabase-js';

// Utiliser les variables d'environnement pour la sécurité
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Variables d\'environnement Supabase manquantes. ' +
    'Vérifiez que VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY sont définies dans votre fichier .env.local'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
