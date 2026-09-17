import { supabase } from './supabaseClient';

export interface GridSummary {
  id: string;
  title?: string;
  created_at?: string;
  difficulty?: string;
  photo_url?: string;
  cols?: number;
  rows?: number;
}

export interface GridSchema {
  id: string;
  rows: number;
  cols: number;
  grid_data?: any;
  photo_url?: string;
  created_at?: string;
}

export const fetchTodayGrid = async () => {
  try {
    const { data, error } = await supabase
      .from('grids')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Erreur Supabase (fetchTodayGrid) :', error.message);
      return null;
    }
    return data;
  } catch (err) {
    console.error('Erreur réseau / Supabase (fetchTodayGrid) :', err);
    return null;
  }
};

export const fetchDailyGrid = async (): Promise<GridSchema | null> => {
  return await fetchTodayGrid();
};

export const fetchGridById = async (id: string): Promise<GridSchema | null> => {
  try {
    const { data, error } = await supabase
      .from('grids')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('Erreur Supabase (fetchGridById) :', error.message);
      return null;
    }
    return data;
  } catch (err) {
    console.error('Erreur réseau / Supabase (fetchGridById) :', err);
    return null;
  }
};

export const fetchAllGrids = async (): Promise<GridSummary[]> => {
  try {
    const { data, error } = await supabase
      .from('grids')
      .select('id, title, created_at, difficulty, photo_url, cols, rows')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erreur Supabase (fetchAllGrids) :', error.message);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error('Erreur réseau / Supabase (fetchAllGrids) :', err);
    return [];
  }
};

export const fetchUserProgress = async (userId: string, gridId: string) => {
  try {
    const { data, error } = await supabase
      .from('user_progress')
      .select('answers')
      .eq('user_id', userId)
      .eq('grid_id', gridId)
      .maybeSingle();

    if (error) {
      console.error('Erreur Supabase (fetchUserProgress) :', error.message);
      return null;
    }
    return data?.answers || null;
  } catch (err) {
    console.error('Erreur réseau / Supabase (fetchUserProgress) :', err);
    return null;
  }
};

export const saveUserProgress = async (
  userId: string,
  gridId: string,
  answers: Record<string, string>
) => {
  try {
    const { error } = await supabase.from('user_progress').upsert(
      {
        user_id: userId,
        grid_id: gridId,
        answers,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,grid_id' }
    );

    if (error) {
      console.error('Erreur Supabase (saveUserProgress) :', error.message);
    }
  } catch (err) {
    console.error('Erreur réseau / Supabase (saveUserProgress) :', err);
  }
};