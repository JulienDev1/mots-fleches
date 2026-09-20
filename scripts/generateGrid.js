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
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'VITE_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont requis pour générer une grille.'
  );
}
const supabase = createClient(supabaseUrl, supabaseKey);

const COLS = 22;
const ROWS = 18;
const IMAGE_SIZE = 4;
const IMAGE_ROW = 7;
const IMAGE_COL = Math.floor((COLS - IMAGE_SIZE) / 2);
const THEMES = [
  { name: 'Nature', imageUrl: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&q=80' },
  { name: 'Mer', imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80' },
  { name: 'Voyage', imageUrl: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=800&q=80' },
  { name: 'Paysage', imageUrl: 'https://images.unsplash.com/photo-1500534623283-312aade485b7?w=800&q=80' }
];

async function fetchDictionary() {
  const { data, error } = await supabase.from('dictionary').select('word, definition');
  if (error) return [];
  return data;
}

function generateUltraDenseGrid(dictionary) {
  const grid = Array.from({ length: ROWS }, () => Array.from({ length: COLS }, () => null));
  const placedWords = [];
  const theme = THEMES[Math.floor(Math.random() * THEMES.length)];
  const imageUrl = theme.imageUrl;

  for (let r = IMAGE_ROW; r < IMAGE_ROW + IMAGE_SIZE; r++) {
    for (let c = IMAGE_COL; c < IMAGE_COL + IMAGE_SIZE; c++) {
      grid[r][c] = { type: 'image', imageUrl };
    }
  }

  const shuffled = [...dictionary]
    .map((item) => ({
      word: String(item.word || '')
        .trim()
        .toLocaleUpperCase('fr-FR'),
      definition: String(item.definition || '').trim()
    }))
    .filter((item) => item.word.length >= 2 && item.definition.length > 0)
    .filter((item, index, items) => items.findIndex((candidate) => candidate.word === item.word) === index)
    .sort((a, b) => b.word.length - a.word.length || Math.random() - 0.5);

  function canPlace(word, dir, r, c) {
    const len = word.length;
    const defR = dir === 'V' ? r - 1 : r;
    const defC = dir === 'H' ? c - 1 : c;
    const endR = dir === 'V' ? r + len : r;
    const endC = dir === 'H' ? c + len : c;

    if (dir === 'H' && c + len > COLS) return false;
    if (dir === 'V' && r + len > ROWS) return false;
    if (defR < 0 || defR >= ROWS || defC < 0 || defC >= COLS) return false;

    // A word must start after its clue and stop before a border or an empty
    // separator. Otherwise a neighbouring entry can silently extend it.
    if (
      endR >= 0 &&
      endR < ROWS &&
      endC >= 0 &&
      endC < COLS &&
      grid[endR][endC] !== null
    ) {
      return false;
    }

    const definitionCell = grid[defR][defC];
    if (
      definitionCell !== null &&
      (definitionCell.type !== 'definition' ||
        definitionCell.def1?.arrow === (dir === 'H' ? 'right' : 'down') ||
        definitionCell.def2)
    ) {
      return false;
    }

    for (let i = 0; i < len; i++) {
      const curR = dir === 'V' ? r + i : r;
      const curC = dir === 'H' ? c + i : c;
      const cell = grid[curR][curC];

      if (cell !== null) {
        if (cell.type !== 'letter' || cell.solution !== word[i]) return false;
        if (cell.directions?.includes(dir)) return false;
      }

      const perpendicular = dir === 'H' ? 'V' : 'H';
      const sideCoordinates =
        dir === 'H'
          ? [[curR - 1, curC], [curR + 1, curC]]
          : [[curR, curC - 1], [curR, curC + 1]];

      for (const [sideR, sideC] of sideCoordinates) {
        if (sideR < 0 || sideR >= ROWS || sideC < 0 || sideC >= COLS) continue;
        const sideCell = grid[sideR][sideC];
        if (
          sideCell?.type === 'letter' &&
          !(cell?.type === 'letter' && cell.directions?.includes(perpendicular))
        ) {
          return false;
        }
      }
    }

    // Independent entries are allowed when no crossing is available; this
    // keeps the board playable instead of leaving most cells black.
    return true;
  }

  function validatePlacement(item, dir, r, c) {
    const defR = dir === 'V' ? r - 1 : r;
    const defC = dir === 'H' ? c - 1 : c;
    const clue = grid[defR][defC];
    const expectedArrow = dir === 'H' ? 'right' : 'down';
    const answerCells = [];

    for (let i = 0; i < item.word.length; i++) {
      const answerR = dir === 'V' ? r + i : r;
      const answerC = dir === 'H' ? c + i : c;
      answerCells.push(grid[answerR][answerC]);
    }

    return (
      (clue?.type === 'definition' &&
        ((clue.def1?.arrow === expectedArrow && clue.def1.text === item.definition) ||
          (clue.def2?.arrow === expectedArrow && clue.def2.text === item.definition))) &&
      answerCells.every((cell, index) => cell?.type === 'letter' && cell.solution === item.word[index])
    );
  }

  function countIntersections(word, dir, r, c) {
    let intersections = 0;
    for (let i = 0; i < word.length; i++) {
      const curR = dir === 'V' ? r + i : r;
      const curC = dir === 'H' ? c + i : c;
      if (grid[curR][curC]?.type === 'letter') intersections++;
    }
    return intersections;
  }

  function place(item, dir, r, c) {
    const word = item.word;
    const defR = dir === 'V' ? r - 1 : r;
    const defC = dir === 'H' ? c - 1 : c;

    const definition = { text: item.definition, arrow: dir === 'H' ? 'right' : 'down' };
    const existingDefinition = grid[defR][defC];
    const previousDefinition = existingDefinition
      ? { ...existingDefinition, def1: existingDefinition.def1 && { ...existingDefinition.def1 }, def2: existingDefinition.def2 && { ...existingDefinition.def2 } }
      : null;
    const previousLetters = [];
    for (let i = 0; i < word.length; i++) {
      const curR = dir === 'V' ? r + i : r;
      const curC = dir === 'H' ? c + i : c;
      previousLetters.push({ r: curR, c: curC, cell: grid[curR][curC] });
    }

    if (existingDefinition?.type === 'definition') {
      existingDefinition.def2 = definition;
    } else {
      grid[defR][defC] = { type: 'definition', def1: definition };
    }

    for (let i = 0; i < word.length; i++) {
      const curR = dir === 'V' ? r + i : r;
      const curC = dir === 'H' ? c + i : c;
      const existingCell = grid[curR][curC];
      grid[curR][curC] = {
        ...(existingCell?.type === 'letter' ? existingCell : {}),
        type: 'letter',
        solution: word[i],
        directions: [
          ...(existingCell?.type === 'letter' ? existingCell.directions || [] : []),
          dir
        ]
      };
    }

    if (!validatePlacement(item, dir, r, c)) {
      grid[defR][defC] = previousDefinition;
      previousLetters.forEach(({ r: previousR, c: previousC, cell }) => {
        grid[previousR][previousC] = cell;
      });
      return false;
    }

    placedWords.push({ word, definition: item.definition, dir, r, c });
    return true;
  }

  function findPlacement(word) {
    if (placedWords.length === 0) {
      const centeredPlacements = [
        { dir: 'H', r: Math.floor(ROWS / 2), c: 1 },
        { dir: 'V', r: 1, c: Math.floor(COLS / 2) }
      ];
      const centeredPlacement = centeredPlacements.find(({ dir, r, c }) =>
        canPlace(word, dir, r, c)
      );
      if (centeredPlacement) return centeredPlacement;
    }

    let bestPlacement = null;
    let bestIntersections = -1;
    let bestBorderScore = -1;

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        for (const dir of ['H', 'V']) {
          if (!canPlace(word, dir, r, c)) continue;

          const intersections = countIntersections(word, dir, r, c);
          const endR = dir === 'V' ? r + word.length - 1 : r;
          const endC = dir === 'H' ? c + word.length - 1 : c;
          const borderScore =
            Number(r <= 1) +
            Number(c <= 1) +
            Number(endR >= ROWS - 2) +
            Number(endC >= COLS - 2);
          if (
            intersections > bestIntersections ||
            (intersections === bestIntersections && borderScore > bestBorderScore)
          ) {
            bestPlacement = { dir, r, c };
            bestIntersections = intersections;
            bestBorderScore = borderScore;
          }
        }
      }
    }
    return bestPlacement;
  }

  // Multi-passes de remplissage. Each word is placed at most once per pass.
  for (let pass = 0; pass < shuffled.length && placedWords.length < 40; pass++) {
    let placedInPass = 0;
    for (const item of shuffled) {
      if (placedWords.some((placed) => placed.word === item.word)) continue;

      const placement = findPlacement(item.word);
      if (placement) {
        if (place(item, placement.dir, placement.r, placement.c)) {
          placedInPass++;
        }
      }
    }

    if (placedInPass === 0) break;
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

  return { cells, wordCount: placedWords.length, theme: theme.name };
}

async function run() {
  const dictionary = await fetchDictionary();
  const { cells, wordCount, theme } = generateUltraDenseGrid(dictionary);

  const gridNumber = Math.floor(Math.random() * 9000) + 1000;
  const date = new Date().toISOString().split('T')[0];
  const { data: insertedGrid, error } = await supabase.from('grids').insert({
    title: `Grille Dense - ${theme} - ${date} - N°${gridNumber}`,
    cols: COLS,
    rows: ROWS,
    cells: cells
  }).select('id').single();

  if (error || !insertedGrid) {
    throw new Error(`Impossible d'enregistrer la grille : ${error?.message || 'aucune ligne insérée'}`);
  }

  console.log(`✅ Grille N°${gridNumber} générée avec ${wordCount} mots.`);
}

run();