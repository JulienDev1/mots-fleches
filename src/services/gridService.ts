import { supabase } from '../supabaseClient';
import type { CellData } from '../components/GrilleGeante';
export interface DailyGridRecord {
  id: string;
  date: string;
  grid_data: CellData[][];
  photo_url: string;
}

// Charger la grille du jour ou en générer une par défaut
export const fetchTodayGrid = async (): Promise<DailyGridRecord | null> => {
  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('daily_grids')
    .select('*')
    .eq('date', today)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Erreur chargement grille du jour :', error);
  }

  return data || null;
};

// Charger la sauvegarde de l'utilisateur
export const fetchUserProgress = async (gridId: string): Promise<CellData[][] | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('user_grid_progress')
    .select('saved_state')
    .eq('user_id', user.id)
    .eq('grid_id', gridId)
    .single();

  if (error) return null;
  return data?.saved_state as CellData[][];
};

// Sauvegarder la progression
export const saveUserProgress = async (
  gridId: string, 
  gridState: CellData[][], 
  isCompleted: boolean = false
) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase
    .from('user_grid_progress')
    .upsert({
      user_id: user.id,
      grid_id: gridId,
      saved_state: gridState,
      is_completed: isCompleted,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id,grid_id' });

  if (error) {
    console.error('Erreur de sauvegarde :', error);
  }
};