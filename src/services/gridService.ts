import { supabase } from '../lib/supabaseClient';

export type ArrowDirection = 'right' | 'down' | 'right-down' | 'down-right';

export interface Definition {
  text: string;
  arrow: ArrowDirection;
}

export interface CellSchema {
  [key: string]: unknown;
}

export interface GridSchema {
  id?: string;
  rows: number;
  cols: number;
  difficulty?: string;
  cells: CellSchema[];
  grid_data?: any; // Ajouté pour GrilleGeante
  photo_url?: string; // Ajouté pour GrilleGeante
}

export interface GridSchema {
  id?: string;
  rows: number;
  cols: number;
  difficulty?: string;
  cells: CellSchema[];
}

export type Grid = GridSchema;

// 1. Récupération de la grille du jour avec rotation circulaire
export const fetchDailyGrid = async (): Promise<GridSchema> => {
  const { data: grids, error } = await supabase
    .from('grids')
    .select('*')
    .order('created_at', { ascending: true });

  if (error || !grids || grids.length === 0) {
    throw new Error('Aucune grille disponible dans Supabase');
  }

  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - startOfYear.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));

  const selectedIndex = dayOfYear % grids.length;
  const gridRecord = grids[selectedIndex];

  return (gridRecord.schema ?? gridRecord.data ?? gridRecord) as GridSchema;
};

// Alias pour GrilleGeante.tsx
export const fetchTodayGrid = fetchDailyGrid;

// 2. Récupération d'une grille par identifiant (avec fallback)
export const fetchGridById = async (gridId: string): Promise<GridSchema> => {
  try {
    const { data, error } = await supabase
      .from('grids')
      .select('*')
      .eq('id', gridId)
      .maybeSingle();

    if (error || !data) {
      return await fetchDailyGrid();
    }

    return (data.schema ?? data.data ?? data) as GridSchema;
  } catch {
    return await fetchDailyGrid();
  }
};

// 3. Gestion de la progression utilisateur (utilisé par GrilleGeante.tsx)
export const fetchUserProgress = async (userId: string, gridId: string): Promise<Record<string, string> | null> => {
  try {
    const { data, error } = await supabase
      .from('user_progress')
      .select('progress')
      .eq('user_id', userId)
      .eq('grid_id', gridId)
      .maybeSingle();

    if (error || !data) return null;
    return data.progress as Record<string, string>;
  } catch {
    return null;
  }
};

export const saveUserProgress = async (userId: string, gridId: string, progress: Record<string, string>): Promise<void> => {
  try {
    await supabase.from('user_progress').upsert(
      {
        user_id: userId,
        grid_id: gridId,
        progress,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,grid_id' }
    );
  } catch (error) {
    console.error('Erreur de sauvegarde de la progression :', error);
  }
};

export interface GridSummary {
  id: string;
  difficulty?: string;
  created_at?: string;
}

export const fetchAllGrids = async (): Promise<GridSummary[]> => {
  const { data, error } = await supabase
    .from('grids')
    .select('id, difficulty, created_at');
    
  if (error || !data) return [];
  return data as GridSummary[];
};