import type { CellData } from '../types/game';

const COLS = 23;
const ROWS = 18;

export const generateMockGridData = (): CellData[][] => {
  const grid: CellData[][] = [];

  for (let r = 0; r < ROWS; r++) {
    const row: CellData[] = [];
    for (let c = 0; c < COLS; c++) {
      // Emplacement de l'image centrale du jour
      if (r >= 7 && r <= 10 && c >= 9 && c <= 13) {
        row.push({ type: 'image' });
        continue;
      }

      // Cases de définitions stratégiques (avec gestion demi-cases / doubles définitions)
      if ((r === 0 && c === 0) || (r === 0 && c === 5) || (r === 0 && c === 12) || (r === 0 && c === 18)) {
        row.push({
          type: 'definition',
          definitions: [
            { texte: 'RÉGION SUDEST', direction: 'horizontal' },
            { texte: 'VENT FRAIS', direction: 'vertical' },
          ],
        });
        continue;
      }

      if ((r === 3 && c === 2) || (r === 6 && c === 0) || (r === 12 && c === 4) || (r === 15 && c === 15)) {
        row.push({
          type: 'definition',
          definitions: [{ texte: 'CITÉ PHO CÉENNE', direction: 'horizontal' }],
        });
        continue;
      }

      // Cases noires minimales
      if ((r === 2 && c === 8) || (r === 5 && c === 17) || (r === 11 && c === 3) || (r === 14 && c === 20)) {
        row.push({ type: 'noire' });
        continue;
      }

      // Cases de lettres interactives
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