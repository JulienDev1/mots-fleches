import { supabase } from '../lib/supabaseClient';

export type ArrowDirection = 'right' | 'down' | 'right-down' | 'down-right';

export interface Definition {
  text: string;
  arrow: ArrowDirection;
}

export interface CellSchema {
  r: number;
  c: number;
  type: 'letter' | 'definition' | 'black';
  solution?: string;
  def1?: Definition;
  def2?: Definition;
}

export interface GridSchema {
  id?: string;
  rows: number;
  cols: number;
  difficulty?: string;
  cells: CellSchema[];
}

// 1. Récupération de la grille du jour avec rotation circulaire
export const fetchDailyGrid = async (): Promise<GridSchema> => {
  const { data: grids, error } = await supabase
    .from('grids')
    .select('*')
    .order('created_at', { ascending: true });

  if (error || !grids || grids.length === 0) {
    throw new Error('Aucune grille disponible dans Supabase');
  }

  // Calcul du jour de l'année (0 à 365)
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - startOfYear.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));

  // Sélection circulaire dans le stock
  const selectedIndex = dayOfYear % grids.length;
  const gridRecord = grids[selectedIndex];

  return (gridRecord.schema ?? gridRecord.data ?? gridRecord) as GridSchema;
};

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