import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, 'utf8');
  envConfig.split('\n').forEach((line) => {
    const [key, value] = line.split('=');
    if (key && value) process.env[key.trim()] = value.trim();
  });
}

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const COLS = 14;
const ROWS = 18;

async function fetchDictionary() {
  const { data, error } = await supabase.from('dictionary').select('word, definition');
  if (error) return [];
  return data;
}

function generateUltraDenseGrid(dictionary) {
  const grid = Array.from({ length: ROWS }, () => Array.from({ length: COLS }, () => null));
  const placedWords = [];

  const shuffled = [...dictionary].sort(() => Math.random() - 0.5);

  function canPlace(word, dir, r, c) {
    const len = word.length;
    const defR = dir === 'V' ? r - 1 : r;
    const defC = dir === 'H' ? c - 1 : c;

    if (defR < 0 || defR >= ROWS || defC < 0 || defC >= COLS) return false;
    if (grid[defR][defC] !== null) return false;

    if (dir === 'H' && c + len > COLS) return false;
    if (dir === 'V' && r + len > ROWS) return false;

    let hasIntersection = placedWords.length === 0;

    for (let i = 0; i < len; i++) {
      const curR = dir === 'V' ? r + i : r;
      const curC = dir === 'H' ? c + i : c;
      const cell = grid[curR][curC];

      if (cell !== null) {
        if (cell.type !== 'letter' || cell.solution !== word[i]) return false;
        hasIntersection = true;
      }
    }
    return hasIntersection;
  }

  function place(item, dir, r, c) {
    const word = item.word;
    const defR = dir === 'V' ? r - 1 : r;
    const defC = dir === 'H' ? c - 1 : c;

    grid[defR][defC] = {
      type: "definition",
      def1: { text: item.definition, arrow: dir === 'H' ? "right" : "down" }
    };

    for (let i = 0; i < word.length; i++) {
      const curR = dir === 'V' ? r + i : r;
      const curC = dir === 'H' ? c + i : c;
      grid[curR][curC] = { type: "letter", solution: word[i] };
    }

    placedWords.push({ word, dir, r, c });
  }

  // Multi-passes de remplissage
  for (let pass = 0; pass < 5; pass++) {
    for (const item of shuffled) {
      if (placedWords.some(w => w.word === item.word)) continue;

      if (placedWords.length === 0) {
        if (canPlace(item.word, 'H', 1, 1)) place(item, 'H', 1, 1);
        continue;
      }

      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          if (canPlace(item.word, 'H', r, c)) {
            place(item, 'H', r, c);
            break;
          }
          if (canPlace(item.word, 'V', r, c)) {
            place(item, 'V', r, c);
            break;
          }
        }
      }
    }
  }

  const cells = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (grid[r][c]) {
        cells.push({ r, c, ...grid[r][c] });
      } else {
        cells.push({ r, c, type: "black" });
      }
    }
  }

  return { cells, wordCount: placedWords.length };
}

async function run() {
  const dictionary = await fetchDictionary();
  const { cells, wordCount } = generateUltraDenseGrid(dictionary);

  const gridNumber = Math.floor(Math.random() * 9000) + 1000;
  await supabase.from('grids').insert({
    title: `Grille N°${gridNumber}`,
    cols: COLS,
    rows: ROWS,
    cells: cells
  });

  console.log(`✅ Grille N°${gridNumber} générée avec ${wordCount} mots.`);
}

run();