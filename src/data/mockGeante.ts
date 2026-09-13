import type { GrilleGeanteData, CelluleGeante } from '../types/game';
import type { CellData } from '../components/GrilleGeante';

const COLS = 12;
const ROWS = 17;

export const generateGrilleGeante = (imageUrl?: string): { grid: GrilleGeanteData; photoUrl: string } => {
  const COLS = 12;
  const ROWS = 17;
 const photo = imageUrl || `https://picsum.photos/400/400?random=${Math.floor(Math.random() * 1000)}`;

  const grid: GrilleGeanteData = Array.from({ length: ROWS }, (_, r) =>
    Array.from({ length: COLS }, (_, c) => {
      // Délimitation de la zone image au centre (Lignes 7-10, Colonnes 4-7)
      if (r >= 6 && r <= 9 && c >= 3 && c <= 6) {
        return { type: 'image' };
      }
      // Par défaut des cases lettres (à remplir selon la génération)
      return { type: 'lettre', solution: 'A' };
    })
  );

  return { grid, photoUrl: photo };
};