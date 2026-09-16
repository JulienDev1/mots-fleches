import type { CellData } from '../types/game';

const COLS = 12;
const ROWS = 17;

export const generateMockGridData = (): CellData[][] => {
  const grid: CellData[][] = Array.from({ length: ROWS }, () =>
    Array.from({ length: COLS }, () => ({ type: 'lettre', solution: 'A', saisie: '' }))
  );

  // Zone Image centrale (4x4)
  for (let r = 6; r <= 9; r++) {
    for (let c = 4; c <= 7; c++) {
      grid[r][c] = { type: 'image' };
    }
  }

  // Cases noires
  const blackCells = [
    [1, 3], [2, 8], [3, 2], [4, 10], [5, 1], [10, 3], [11, 8], [12, 2], [13, 9], [14, 1]
  ];
  blackCells.forEach(([r, c]) => {
    grid[r][c] = { type: 'noire' };
  });

  // Liste complète des définitions pour remplir toutes les cases jaunes de la grille
  const defsMap: { [key: string]: { texte: string; dir: 'horizontal' | 'vertical' }[] } = {
    '0-0': [{ texte: 'RIVIERE', dir: 'horizontal' }],
    '0-5': [{ texte: 'ASTRE', dir: 'vertical' }],
    '0-9': [{ texte: 'NOTE', dir: 'vertical' }],
    '2-0': [{ texte: 'AVION', dir: 'horizontal' }],
    '2-4': [{ texte: 'META', dir: 'horizontal' }],
    '4-0': [{ texte: 'OCEAN', dir: 'horizontal' }],
    '5-5': [{ texte: 'ROCHE', dir: 'vertical' }],
    '5-8': [{ texte: 'VENT', dir: 'horizontal' }],
    '10-0': [{ texte: 'ARBRE', dir: 'horizontal' }],
    '10-5': [{ texte: 'MONAGNE', dir: 'vertical' }],
    '11-1': [{ texte: 'FRUIT', dir: 'horizontal' }],
    '12-0': [{ texte: 'SABLE', dir: 'horizontal' }],
    '12-6': [{ texte: 'PLAGE', dir: 'vertical' }],
    '14-4': [{ texte: 'SOLEIL', dir: 'horizontal' }],
    '15-0': [{ texte: 'ROUTE', dir: 'horizontal' }]
  };

  // Convertit chaque coordonnée déclarée en type definition
  Object.entries(defsMap).forEach(([coord, defs]) => {
    const [r, c] = coord.split('-').map(Number);
    grid[r][c] = {
      type: 'definition',
      definitions: defs.map((d) => ({ texte: d.texte, direction: d.dir }))
    };
  });

  // Remplissage par défaut des cases isolées non définies pour éviter les blocs jaunes vides
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const cell = grid[r][c];
      if (cell?.type === 'definition' && (!cell.definitions || cell.definitions.length === 0)) {
        cell.definitions = [{ texte: 'MOT', direction: 'horizontal' }];
      }
    }
  }

  return grid;
};