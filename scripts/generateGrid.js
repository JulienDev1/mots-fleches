import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach((line) => {
    const separator = line.indexOf('=');
    if (separator > 0) {
      process.env[line.slice(0, separator).trim()] = line.slice(separator + 1).trim();
    }
  });
}

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !supabaseKey) {
  throw new Error('VITE_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont requis pour générer une grille.');
}
const supabase = createClient(supabaseUrl, supabaseKey);

const COLS = 22;
const ROWS = 18;
const IMAGE_SIZE = 4;
const IMAGE_ROW = 7;
const IMAGE_COL = Math.floor((COLS - IMAGE_SIZE) / 2);
const DIRECTIONS = ['H', 'V'];
const THEMES = [
  { name: 'Nature', imageUrl: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&q=80' },
  { name: 'Mer', imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80' },
  { name: 'Voyage', imageUrl: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=800&q=80' },
  { name: 'Paysage', imageUrl: 'https://images.unsplash.com/photo-1500534623283-312aade485b7?w=800&q=80' }
];

const isImage = (r, c) =>
  r >= IMAGE_ROW && r < IMAGE_ROW + IMAGE_SIZE && c >= IMAGE_COL && c < IMAGE_COL + IMAGE_SIZE;

async function fetchDictionary() {
  const { data, error } = await supabase.from('dictionary').select('word, definition');
  if (error) throw new Error(`Impossible de charger le dictionnaire : ${error.message}`);

  const unique = new Map();
  (data || []).forEach((item) => {
    const word = String(item.word || '').trim().toLocaleUpperCase('fr-FR');
    const definition = String(item.definition || '').trim();
    if (/^[A-ZÀ-ÖØ-Ý]{2,20}$/u.test(word) && definition) unique.set(word, { word, definition });
  });
  if (unique.size < 2) throw new Error('Le dictionnaire ne contient pas assez de mots valides.');
  return [...unique.values()];
}

function createBoard(imageUrl) {
  return Array.from({ length: ROWS }, (_, r) =>
    Array.from({ length: COLS }, (_, c) => (isImage(r, c) ? { type: 'image', imageUrl } : null))
  );
}

function generateGrid(dictionary) {
  const theme = THEMES[Math.floor(Math.random() * THEMES.length)];
  const board = createBoard(theme.imageUrl);
  const entries = [];
  const usedWords = new Set();

  const cell = (r, c) => (board[r] && board[r][c]) || null;
  const coordinates = (dir, r, c, index) =>
    dir === 'H' ? { r, c: c + index } : { r: r + index, c };

  function candidateFor(item, dir, r, c) {
    const length = item.word.length;
    const clueR = dir === 'V' ? r - 1 : r;
    const clueC = dir === 'H' ? c - 1 : c;
    const end = coordinates(dir, r, c, length - 1);
    if (clueR < 0 || clueC < 0 || end.r >= ROWS || end.c >= COLS) return null;
    if (isImage(clueR, clueC) || isImage(end.r, end.c)) return null;

    // A slot is maximal: its clue is immediately before it and the next
    // cell is a separator. This prevents undeclared runs at every crossing.
    const after = coordinates(dir, r, c, length);
    if (after.r < ROWS && after.c < COLS && cell(after.r, after.c)?.type === 'letter') return null;
    if (cell(clueR, clueC)?.type === 'letter') return null;

    const clue = cell(clueR, clueC);
    const arrow = dir === 'H' ? 'right' : 'down';
    if (clue && clue.type !== 'definition') return null;
    if (clue?.def1?.arrow === arrow || clue?.def2?.arrow === arrow) return null;

    let intersections = 0;
    for (let i = 0; i < length; i++) {
      const position = coordinates(dir, r, c, i);
      if (isImage(position.r, position.c)) return null;
      const existing = cell(position.r, position.c);
      if (existing && (existing.type !== 'letter' || existing.solution !== item.word[i])) return null;
      if (existing?.type === 'letter') {
        if (existing.directions?.includes(dir)) return null;
        intersections++;
      } else {
        // A fresh letter may only touch a perpendicular entry at a crossing.
        // Otherwise it would silently extend that entry and create a run
        // which has no clue/definition.
        const perpendicular = dir === 'H'
          ? [[position.r - 1, position.c], [position.r + 1, position.c]]
          : [[position.r, position.c - 1], [position.r, position.c + 1]];
        if (perpendicular.some(([sideR, sideC]) => {
          const side = cell(sideR, sideC);
          return side?.type === 'letter' && !side.directions?.includes(dir === 'H' ? 'V' : 'H');
        })) return null;
      }
    }
    return { ...item, dir, r, c, clueR, clueC, intersections };
  }

  function placements() {
    const result = [];
    for (const item of dictionary) {
      if (usedWords.has(item.word)) continue;
      for (const dir of DIRECTIONS) {
        for (let r = 0; r < ROWS; r++) {
          for (let c = 0; c < COLS; c++) {
            const candidate = candidateFor(item, dir, r, c);
            if (candidate) result.push(candidate);
          }
        }
      }
    }
    return result;
  }

  function place(entry) {
    const clue = board[entry.clueR][entry.clueC];
    const definition = { text: entry.definition, arrow: entry.dir === 'H' ? 'right' : 'down' };
    const changed = [{ r: entry.clueR, c: entry.clueC, value: clue }];
    board[entry.clueR][entry.clueC] = clue
      ? { ...clue, def2: definition }
      : { type: 'definition', def1: definition };
    for (let i = 0; i < entry.word.length; i++) {
      const position = coordinates(entry.dir, entry.r, entry.c, i);
      changed.push({ r: position.r, c: position.c, value: board[position.r][position.c] });
      const existing = board[position.r][position.c];
      board[position.r][position.c] = {
        ...(existing || {}),
        type: 'letter',
        solution: entry.word[i],
        directions: [...(existing?.directions || []), entry.dir]
      };
    }
    entries.push(entry);
    usedWords.add(entry.word);
    return changed;
  }

  function undo(entry, changed) {
    changed.forEach(({ r, c, value }) => { board[r][c] = value; });
    entries.pop();
    usedWords.delete(entry.word);
  }

  function hasOnlyDeclaredRuns() {
    const declared = new Set(entries.map((entry) => `${entry.dir}:${entry.r}:${entry.c}:${entry.word}`));
    for (const dir of DIRECTIONS) {
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          if (cell(r, c)?.type !== 'letter') continue;
          const before = dir === 'H' ? cell(r, c - 1) : cell(r - 1, c);
          if (before?.type === 'letter') continue;
          let word = '';
          let end = { r, c };
          while (cell(end.r, end.c)?.type === 'letter') {
            word += cell(end.r, end.c).solution;
            end = coordinates(dir, end.r, end.c, 1);
          }
          // One-letter fragments are expected while the search is in progress.
          if (word.length > 1 && !declared.has(`${dir}:${r}:${c}:${word}`)) return false;
        }
      }
    }
    return true;
  }

  function search(depth, limit) {
    const options = placements();
    if (!options.length || depth >= limit) return;
    options.sort((a, b) => b.intersections - a.intersections || b.word.length - a.word.length);
    // Keep the search bounded while trying different long words on each run.
    const shortlist = options.slice(0, depth === 0 ? 40 : 24);
    for (const option of shortlist) {
      const changed = place(option);
      if (!hasOnlyDeclaredRuns()) {
        undo(option, changed);
        continue;
      }
      search(depth + 1, limit);
      if (entries.length >= 25) return;
      undo(option, changed);
    }
  }

  // Several independent starts avoid depending on dictionary ordering.
  for (let attempt = 0; attempt < 18 && entries.length < 12; attempt++) {
    const starts = placements().sort((a, b) => b.word.length - a.word.length);
    const start = starts[(attempt * 7) % Math.max(starts.length, 1)];
    if (!start) break;
    const changed = place(start);
    search(1, 80);
    if (entries.length < 12) undo(start, changed);
  }

  if (!entries.length) throw new Error('Aucune implantation de mot possible.');

  if (!hasOnlyDeclaredRuns()) {
    throw new Error('Run non déclarée détectée après la recherche.');
  }
  const cells = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) cells.push({ r, c, ...(board[r][c] || { type: 'black' }) });
  }
  return { cells, wordCount: entries.length, theme: theme.name };
}

async function run() {
  const dictionary = await fetchDictionary();
  const candidates = [];
  for (let attempt = 0; attempt < 80; attempt++) {
    try {
      candidates.push(generateGrid(dictionary));
    } catch (error) {
      if (attempt === 79) throw error;
    }
  }
  if (!candidates.length) {
    throw new Error('Échec explicite : aucune grille ne respecte les contraintes.');
  }
  const best = candidates.reduce((winner, candidate) => {
    const occupied = candidate.cells.filter((item) => item.type === 'letter' || item.type === 'definition').length;
    const winnerOccupied = winner.cells.filter((item) => item.type === 'letter' || item.type === 'definition').length;
    return occupied > winnerOccupied ? candidate : winner;
  });
  if (!best || best.wordCount === 0) throw new Error('Échec explicite : aucune grille valide n’a été générée.');

  const number = Math.floor(Math.random() * 9000) + 1000;
  const date = new Date().toISOString().split('T')[0];
  const { data, error } = await supabase.from('grids').insert({
    title: `Grille Dense - ${best.theme} - ${date} - N°${number}`,
    cols: COLS,
    rows: ROWS,
    cells: best.cells
  }).select('id').single();
  if (error || !data) throw new Error(`Impossible d'enregistrer la grille : ${error?.message || 'aucune ligne insérée'}`);
  console.log(`✅ Grille N°${number} générée avec ${best.wordCount} mots.`);
}

run().catch((error) => {
  console.error(`❌ ${error.message}`);
  process.exitCode = 1;
});
