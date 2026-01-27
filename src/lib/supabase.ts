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

// URL du site pour les redirections d'authentification
export const siteUrl = import.meta.env.VITE_SITE_URL || 
  (typeof window !== 'undefined' ? window.location.origin : 'https://web-menu-ar.vercel.app');

// Créer le client Supabase
// Configuration optimisée pour la sécurité et la gestion des tokens
// Note: redirectTo est spécifié lors des appels d'authentification, pas ici
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Utiliser PKCE (Proof Key for Code Exchange) pour une sécurité renforcée
    flowType: 'pkce',
    // Détecter automatiquement les tokens dans l'URL (pour les callbacks OAuth)
    detectSessionInUrl: true,
    // Rafraîchir automatiquement les tokens expirés
    // Ceci est crucial pour éviter les erreurs 401
    autoRefreshToken: true,
    // Persister la session dans le localStorage pour maintenir la connexion
    persistSession: true,
  }
});
