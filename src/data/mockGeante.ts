// ✅ Import direct depuis le fichier de types
import type { CellData } from '../types/game';

// Type alias pour expliciter le type d'une cellule
export type CelluleGeante = CellData;

export const COLS = 12;
export const ROWS = 17;

export const generateGrilleGeante = (): CelluleGeante[][] => {
  return Array.from({ length: ROWS }, (_, r) =>
    Array.from({ length: COLS }, (_, c) => {
      if (c >= 4 && c <= 7 && r >= 6 && r <= 9) return { type: 'image' };
      if (r === 0 && c === 0) return { type: 'definition', definitions: [{ texte: 'ASTRE', direction: 'horizontal' }] };
      if (r === 0 && c === 5) return { type: 'definition', definitions: [{ texte: 'FLEUVE', direction: 'vertical' }] };
      if ((r === 3 && c === 2) || (r === 12 && c === 10)) return { type: 'noire' };
      return { type: 'lettre', solution: 'A', saisie: '' };
    })
  );
};

export const mockGeante = generateGrilleGeante();