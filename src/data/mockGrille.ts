import type { CellData } from '../types/game';

const COLS = 12;
const ROWS = 17;

export const generateMockGridData = (): CellData[][] => {
  const grid: CellData[][] = [];

  for (let r = 0; r < ROWS; r++) {
    const row: CellData[] = [];
    for (let c = 0; c < COLS; c++) {
      // Emplacement réservé à l'image centrale (lignes 6-9, colonnes 4-7)
      if (r >= 6 && r <= 9 && c >= 4 && c <= 7) {
        row.push({ type: 'image' });
        continue;
      }

      // Cases de définition d'exemple
      if ((r === 0 && c === 0) || (r === 2 && c === 3) || (r === 5 && c === 1) || (r === 11 && c === 0)) {
        row.push({
          type: 'definition',
          definitions: [
            {
              texte: 'MOT',
              direction: r % 2 === 0 ? 'horizontal' : 'vertical',
            },
          ],
        });
        continue;
      }

      // Cases noires
      if ((r === 1 && c === 1) || (r === 4 && c === 8) || (r === 10 && c === 2) || (r === 14 && c === 9)) {
        row.push({ type: 'noire' });
        continue;
      }

      // Cases de saisie
      row.push({
        type: 'lettre',
        solution: 'A',
        saisie: '',
        isError: false,
      });
    }
    grid.push(row);
  }

  return grid;
};