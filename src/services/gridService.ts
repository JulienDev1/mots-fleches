import { supabase } from '../lib/supabaseClient';

// Récupère une chaîne unique par jour (ex: "2026-09-16")
export const getTodayKey = (): string => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

// Exemple : Obtenir l'ID de la grille quotidienne selon le jour
export const getDailyGridId = (): string => {
  const dateStr = getTodayKey();
  // Génère ou sélectionne un index de grille basé sur la date du jour
  return `grid_${dateStr}`;
};

export interface GridSchema {
  id: string;
  title: string;
  cols: number;
  rows: number;
  cells: any[];
  is_premium?: boolean;
  created_at?: string;
}

export interface GridSummary {
  id: string;
  title: string;
  cols: number;
  rows: number;
  is_premium?: boolean;
  created_at: string;
}

export const fetchAllGrids = async (): Promise<GridSummary[]> => {
  const { data, error } = await supabase
    .from('grids')
    .select('id, title, cols, rows, is_premium, created_at')
    .ilike('title', '%Dense%')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erreur lors de la récupération des grilles :', error);
    return [];
  }

  return data || [];
};

export const fetchGridById = async (id: string): Promise<GridSchema | null> => {
  try {
    const { data, error } = await supabase
      .from('grids')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;

    return {
      id: data.id,
      title: data.title,
      cols: data.cols,
      rows: data.rows,
      cells: typeof data.cells === 'string' ? JSON.parse(data.cells) : data.cells,
      is_premium: data.is_premium,
      created_at: data.created_at,
    };
  } catch (err) {
    console.error('Erreur lors du chargement de la grille :', err);
    return null;
  }
};

export const fetchDailyGrid = async (): Promise<GridSchema | null> => {
  try {
    const { data, error } = await supabase
      .from('grids')
      .select('*')
      .ilike('title', '%Dense%')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) return null;

    return {
      id: data.id,
      title: data.title,
      cols: data.cols,
      rows: data.rows,
      cells: typeof data.cells === 'string' ? JSON.parse(data.cells) : data.cells,
      is_premium: data.is_premium,
      created_at: data.created_at,
    };
  } catch (err) {
    console.error('Erreur lors du chargement de la grille du jour :', err);
    return null;
  }
};

export interface UserProgressData {
  id?: string;
  photo_url?: string;
  grid_data?: any;
}

export const fetchTodayGrid = async (): Promise<any> => {
  return null;
};

export const fetchUserProgress = async (gridId: string, userId?: string): Promise<UserProgressData | null> => {
  return null;
};

export const saveUserProgress = async (
  gridId: string, 
  stateOrUserId: any, 
  isWonOrState?: any
): Promise<boolean> => {
  return true;
};