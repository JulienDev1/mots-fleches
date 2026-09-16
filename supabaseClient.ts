import { createClient } from '@supabase/supabase-js';

// Récupération des variables d'environnement Vite
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Attention : Les variables d\'environnement VITE_SUPABASE_URL et/ou VITE_SUPABASE_ANON_KEY manquent dans le fichier .env'
  );
}

// Initialisation et exportation de l'instance du client Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey);