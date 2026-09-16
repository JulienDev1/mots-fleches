import { supabase } from '../lib/supabaseClient';

export interface GridSchema {
  id: string;
  title: string;
  cols: number;
  rows: number;
  cells: any[];
  created_at?: string;
}

export interface GridSummary {
  id: string;
  title: string;
  cols: number;
  rows: number;
  created_at: string;
}

export const fetchAllGrids = async (): Promise<GridSummary[]> => {
  const { data, error } = await supabase
    .from('grids')
    .select('id, title, cols, rows, created_at')
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
      created_at: data.created_at,
    };
  } catch (err) {
    console.error('Erreur lors du chargement de la grille du jour :', err);
    return null;
  }
};