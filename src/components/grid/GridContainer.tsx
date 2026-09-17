import React, { useEffect, useRef, useState } from 'react';
import { fetchGridById, fetchDailyGrid, GridSchema } from '../../services/gridService';

export interface GridContainerProps {
  gridId?: string;
  userId?: string;
  schema?: GridSchema | null;
  onVerifyRef?: (callback: () => void) => void;
  onRevealRef?: (callback: () => void) => void;
}

export type ArrowDirection = 'right' | 'down' | 'right-down' | 'down-right';

export interface Definition {
  text: string;
  arrow: ArrowDirection;
}

export interface CellData {
  r: number;
  c: number;
  type: 'letter' | 'definition' | 'black' | 'image';
  solution?: string;
  value?: string;
  isError?: boolean;
  def1?: Definition;
  def2?: Definition;
}

const COLS = 23;
const ROWS = 18;
const CELL_SIZE = 64;

const MOCK_SCHEMA: GridSchema = {
  id: 'mock-18x23',
  rows: ROWS,
  cols: COLS,
  photo_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80',
};

const generateMockCells = (rows: number, cols: number): CellData[][] => {
  const grid: CellData[][] = [];

  for (let r = 0; r < rows; r++) {
    const row: CellData[] = [];
    for (let c = 0; c < cols; c++) {
      // Image centrée (lignes 7 à 10, colonnes 9 à 13)
      if (r >= 7 && r <= 10 && c >= 9 && c <= 13) {
        row.push({ r, c, type: 'image' });
        continue;
      }

      // Cases de définitions réparties
      if (r === 0 && c === 0) {
        row.push({ r, c, type: 'definition', def1: { text: 'SUD-EST', arrow: 'right' }, def2: { text: 'MISTRAL', arrow: 'down' } });
        continue;
      }
      if (r === 0 && c === 5) {
        row.push({ r, c, type: 'definition', def1: { text: 'MARSEILLE', arrow: 'down' } });
        continue;
      }
      if (r === 0 && c === 12) {
        row.push({ r, c, type: 'definition', def1: { text: 'AZUR', arrow: 'right' }, def2: { text: 'PORT', arrow: 'down' } });
        continue;
      }
      if (r === 0 && c === 18) {
        row.push({ r, c, type: 'definition', def1: { text: 'CÔTE', arrow: 'down' } });
        continue;
      }
      if (r === 3 && c === 2) {
        row.push({ r, c, type: 'definition', def1: { text: 'OCÉAN', arrow: 'right' } });
        continue;
      }
      if (r === 3 && c === 15) {
        row.push({ r, c, type: 'definition', def1: { text: 'RIVAGE', arrow: 'right' }, def2: { text: 'SABLE', arrow: 'down' } });
        continue;
      }
      if (r === 6 && c === 0) {
        row.push({ r, c, type: 'definition', def1: { text: 'PLAGE', arrow: 'right' } });
        continue;
      }
      if (r === 6 && c === 18) {
        row.push({ r, c, type: 'definition', def1: { text: 'ÎLE', arrow: 'down' } });
        continue;
      }
      if (r === 11 && c === 2) {
        row.push({ r, c, type: 'definition', def1: { text: 'MARÉE', arrow: 'right' }, def2: { text: 'VAGUE', arrow: 'down' } });
        continue;
      }
      if (r === 12 && c === 14) {
        row.push({ r, c, type: 'definition', def1: { text: 'VOILE', arrow: 'right' } });
        continue;
      }
      if (r === 15 && c === 0) {
        row.push({ r, c, type: 'definition', def1: { text: 'SOLEIL', arrow: 'right' } });
        continue;
      }
      if (r === 15 && c === 8) {
        row.push({ r, c, type: 'definition', def1: { text: 'DUNE', arrow: 'down' } });
        continue;
      }
      if (r === 15 && c === 17) {
        row.push({ r, c, type: 'definition', def1: { text: 'CALANQUE', arrow: 'right' } });
        continue;
      }

      // Cases noires stratégiques
      if ((r === 0 && c === 10) || (r === 2 && c === 8) || (r === 5 && c === 17) || (r === 11 && c === 12) || (r === 14 && c === 4)) {
        row.push({ r, c, type: 'black' });
        continue;
      }

      // Cases de lettres
      row.push({ r, c, type: 'letter', solution: 'A', value: '', isError: false });
    }
    grid.push(row);
  }

  return grid;
};

export const GridContainer: React.FC<GridContainerProps> = ({
  gridId,
  userId,
  schema,
  onVerifyRef,
  onRevealRef,
}) => {
  const [grid, setGrid] = useState<GridSchema | null>(schema ?? null);
  const [loading, setLoading] = useState<boolean>(!schema);
  const [gridState, setGridState] = useState<CellData[][]>([]);
  const [selectedCell, setSelectedCell] = useState<{ r: number; c: number } | null>(null);
  const [direction, setDirection] = useState<'horizontal' | 'vertical'>('horizontal');

  const inputsRef = useRef<{ [key: string]: HTMLInputElement | null }>({});
  const todayKey = new Date().toISOString().split('T')[0];
  const storageKey = `mots_fleches_progress_${userId || 'guest'}_${gridId || 'daily'}_${todayKey}`;

  useEffect(() => {
    if (schema) {
      setGrid(schema);
      setLoading(false);
      return;
    }

    const loadGrid = async () => {
      setLoading(true);
      try {
        let data: GridSchema | null = null;
        if (gridId) data = await fetchGridById(gridId);
        if (!data) data = await fetchDailyGrid();
        setGrid(data || MOCK_SCHEMA);
      } catch (err) {
        console.error('Erreur chargement grille:', err);
        setGrid(MOCK_SCHEMA);
      } finally {
        setLoading(false);
      }
    };

    loadGrid();
  }, [gridId, schema]);

  useEffect(() => {
    const activeSchema = grid || MOCK_SCHEMA;
    let savedAnswers: Record<string, string> = {};

    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) savedAnswers = JSON.parse(saved);
    } catch (e) {
      console.error('Erreur lecture progression:', e);
    }

    let matrix: CellData[][];

    if (activeSchema.grid_data && Array.isArray(activeSchema.grid_data) && activeSchema.grid_data.length > 0) {
      matrix = activeSchema.grid_data.map((row: any[], r: number) =>
        row.map((cell: any, c: number) => {
          const key = `${r}-${c}`;
          const cellType = cell.type === 'lettre' ? 'letter' : cell.type === 'noire' ? 'black' : cell.type;
          return {
            r,
            c,
            type: cellType || 'letter',
            solution: cell.solution || 'A',
            value: savedAnswers[key] || cell.saisie || cell.value || '',
            isError: false,
            def1: cell.definitions?.[0]
              ? { text: cell.definitions[0].texte, arrow: cell.definitions[0].direction === 'vertical' ? 'down' : 'right' }
              : cell.def1,
            def2: cell.definitions?.[1]
              ? { text: cell.definitions[1].texte, arrow: cell.definitions[1].direction === 'vertical' ? 'down' : 'right' }
              : cell.def2,
          };
        })
      );
    } else {
      matrix = generateMockCells(activeSchema.rows || ROWS, activeSchema.cols || COLS);
      matrix = matrix.map((row, r) =>
        row.map((cell, c) => {
          const key = `${r}-${c}`;
          if (cell.type === 'letter' && savedAnswers[key]) {
            return { ...cell, value: savedAnswers[key] };
          }
          return cell;
        })
      );
    }

    setGridState(matrix);

    for (let r = 0; r < matrix.length; r++) {
      for (let c = 0; c < matrix[r].length; c++) {
        if (matrix[r][c].type === 'letter') {
          setSelectedCell({ r, c });
          return;
        }
      }
    }
  }, [grid, storageKey]);

  useEffect(() => {
    if (gridState.length === 0) return;
    const answersToSave: Record<string, string> = {};
    let hasData = false;

    gridState.forEach((row) => {
      row.forEach((cell) => {
        if (cell.type === 'letter' && cell.value) {
          answersToSave[`${cell.r}-${cell.c}`] = cell.value;
          hasData = true;
        }
      });
    });

    if (hasData) {
      localStorage.setItem(storageKey, JSON.stringify(answersToSave));
    }
  }, [gridState, storageKey]);

  const handleVerify = () => {
    const updated = gridState.map((row) =>
      row.map((cell) => {
        if (cell.type === 'letter' && cell.value) {
          return { ...cell, isError: cell.value !== cell.solution };
        }
        return cell;
      })
    );
    setGridState(updated);
  };

  const handleReveal = () => {
    const updated = gridState.map((row) =>
      row.map((cell) => {
        if (cell.type === 'letter') {
          return { ...cell, value: cell.solution || 'A', isError: false };
        }
        return cell;
      })
    );
    setGridState(updated);
  };

  useEffect(() => {
    if (onVerifyRef) onVerifyRef(handleVerify);
    if (onRevealRef) onRevealRef(handleReveal);
  }, [onVerifyRef, onRevealRef, gridState]);

  const handleCellClick = (r: number, c: number) => {
    if (!gridState[r] || gridState[r][c]?.type !== 'letter') return;
    if (selectedCell?.r === r && selectedCell?.c === c) {
      setDirection((prev) => (prev === 'horizontal' ? 'vertical' : 'horizontal'));
    } else {
      setSelectedCell({ r, c });
    }
  };

  const moveFocus = (r: number, c: number, dir: 'horizontal' | 'vertical', step = 1) => {
    let nr = r;
    let nc = c;
    const maxR = gridState.length;
    const maxC = gridState[0]?.length || 0;

    while (true) {
      if (dir === 'horizontal') nc += step;
      else nr += step;

      if (nr < 0 || nr >= maxR || nc < 0 || nc >= maxC) break;
      if (gridState[nr]?.[nc]?.type === 'letter') {
        setSelectedCell({ r: nr, c: nc });
        inputsRef.current[`${nr}-${nc}`]?.focus();
        break;
      }
    }
  };

  const handleCellChange = (r: number, c: number, val: string) => {
    const char = val.slice(-1).toUpperCase();
    const updated = gridState.map((row) => [...row]);
    updated[r][c] = { ...updated[r][c], value: char, isError: false };
    setGridState(updated);

    if (char !== '') {
      moveFocus(r, c, direction, 1);
    }
  };

  const handleKeyDown = (r: number, c: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !gridState[r][c].value) {
      moveFocus(r, c, direction, -1);
    } else if (e.key === 'ArrowRight') moveFocus(r, c, 'horizontal', 1);
    else if (e.key === 'ArrowLeft') moveFocus(r, c, 'horizontal', -1);
    else if (e.key === 'ArrowDown') moveFocus(r, c, 'vertical', 1);
    else if (e.key === 'ArrowUp') moveFocus(r, c, 'vertical', -1);
  };

  if (loading) {
    return <div style={{ color: '#94a3b8', textAlign: 'center', padding: '40px' }}>Chargement de la grille...</div>;
  }

  const activeCols = gridState[0]?.length || COLS;
  const activeRows = gridState.length || ROWS;
  const imageUrl = grid?.photo_url || MOCK_SCHEMA.photo_url;

  return (
    <div
      style={{
        width: '100%',
        maxWidth: '100vw',
        overflow: 'auto',
        padding: '16px',
        boxSizing: 'border-box',
        display: 'flex',
        justifyContent: 'flex-start',
        alignItems: 'flex-start',
      }}
    >
      <div
        style={{
          position: 'relative',
          display: 'grid',
          gridTemplateColumns: `repeat(${activeCols}, ${CELL_SIZE}px)`,
          gridTemplateRows: `repeat(${activeRows}, ${CELL_SIZE}px)`,
          gap: '1px',
          backgroundColor: '#0f172a',
          padding: '2px',
          borderRadius: '8px',
          boxShadow: '0 12px 30px rgba(0,0,0,0.6)',
          userSelect: 'none',
        }}
      >
        {gridState.map((row, r) =>
          row.map((cell, c) => {
            const key = `${r}-${c}`;

            if (cell.type === 'black') {
              return <div key={key} style={{ backgroundColor: '#0f172a', width: `${CELL_SIZE}px`, height: `${CELL_SIZE}px` }} />;
            }

            if (cell.type === 'image') {
              return <div key={key} style={{ backgroundColor: 'transparent', width: `${CELL_SIZE}px`, height: `${CELL_SIZE}px` }} />;
            }

            if (cell.type === 'definition') {
              return (
                <div
                  key={key}
                  style={{
                    backgroundColor: '#d97706',
                    color: '#ffffff',
                    width: `${CELL_SIZE}px`,
                    height: `${CELL_SIZE}px`,
                    padding: '3px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    boxSizing: 'border-box',
                    border: '1px solid #b45309',
                    fontSize: '10px',
                    fontWeight: '800',
                    lineHeight: '11px',
                    textAlign: 'center',
                    overflow: 'hidden',
                  }}
                >
                  {cell.def1 && (
                    <div style={{ width: '100%', wordBreak: 'break-word' }}>
                      {cell.def1.text} {cell.def1.arrow === 'down' ? '⬇' : '➔'}
                    </div>
                  )}
                  {cell.def2 && (
                    <div
                      style={{
                        width: '100%',
                        borderTop: '1px solid rgba(255,255,255,0.4)',
                        marginTop: '2px',
                        paddingTop: '2px',
                        wordBreak: 'break-word',
                      }}
                    >
                      {cell.def2.text} {cell.def2.arrow === 'down' ? '⬇' : '➔'}
                    </div>
                  )}
                </div>
              );
            }

            const isSelected = selectedCell?.r === r && selectedCell?.c === c;
            const isInLine =
              selectedCell &&
              ((direction === 'horizontal' && selectedCell.r === r) ||
                (direction === 'vertical' && selectedCell.c === c));

            return (
              <div key={key} style={{ position: 'relative', width: `${CELL_SIZE}px`, height: `${CELL_SIZE}px` }}>
                <input
                  ref={(el) => {
                    inputsRef.current[key] = el;
                  }}
                  type="text"
                  maxLength={1}
                  value={cell.value || ''}
                  onClick={() => handleCellClick(r, c)}
                  onChange={(e) => handleCellChange(r, c, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(r, c, e)}
                  style={{
                    width: '100%',
                    height: '100%',
                    textAlign: 'center',
                    fontWeight: '900',
                    fontSize: '22px',
                    backgroundColor: isSelected ? '#60a5fa' : isInLine ? '#dbeafe' : '#ffffff',
                    color: cell.isError ? '#dc2626' : '#0f172a',
                    border: cell.isError ? '2px solid #dc2626' : '1px solid #cbd5e1',
                    outline: 'none',
                    boxSizing: 'border-box',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                  }}
                />
                {isSelected && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '2px',
                      right: '3px',
                      fontSize: '10px',
                      color: '#1e3a8a',
                      pointerEvents: 'none',
                    }}
                  >
                    {direction === 'horizontal' ? '➔' : '⬇'}
                  </span>
                )}
              </div>
            );
          })
        )}

        {/* Image centrale alignée en absolute dans la grille CSS */}
        <div
          style={{
            gridColumn: '10 / 15',
            gridRow: '8 / 12',
            zIndex: 10,
            border: '3px solid #f59e0b',
            borderRadius: '4px',
            overflow: 'hidden',
            boxShadow: '0 4px 15px rgba(0,0,0,0.5)',
            backgroundColor: '#0f172a',
          }}
        >
          <img
            src={imageUrl}
            alt="Thème du jour"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>
      </div>
    </div>
  );
};

export default GridContainer;