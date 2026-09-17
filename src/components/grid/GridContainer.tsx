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
  def1?: Definition;
  def2?: Definition;
}

const MOCK_SCHEMA: GridSchema = {
  id: 'mock-1',
  rows: 17,
  cols: 12,
  photo_url: 'https://picsum.photos/200/200',
};

const generateMockCells = (rows: number, cols: number): CellData[][] => {
  return Array.from({ length: rows }, (_, r) =>
    Array.from({ length: cols }, (_, c) => {
      if (r >= 6 && r <= 9 && c >= 4 && c <= 7) {
        return { r, c, type: 'image' };
      }
      if ((r === 0 && c === 0) || (r === 2 && c === 3) || (r === 5 && c === 1) || (r === 11 && c === 0)) {
        return {
          r,
          c,
          type: 'definition',
          def1: { text: 'MOT', arrow: r % 2 === 0 ? 'right' : 'down' },
        };
      }
      if ((r === 1 && c === 1) || (r === 4 && c === 8) || (r === 10 && c === 2) || (r === 14 && c === 9)) {
        return { r, c, type: 'black' };
      }
      return {
        r,
        c,
        type: 'letter',
        solution: 'A',
        value: '',
      };
    })
  );
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
        if (gridId) {
          data = await fetchGridById(gridId);
        }
        if (!data) {
          data = await fetchDailyGrid();
        }
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
            def1: cell.definitions?.[0]
              ? { text: cell.definitions[0].texte, arrow: cell.definitions[0].direction === 'vertical' ? 'down' : 'right' }
              : cell.def1,
          };
        })
      );
    } else {
      matrix = generateMockCells(activeSchema.rows || 17, activeSchema.cols || 12);
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
        if (cell.type === 'letter' && cell.value && cell.value !== cell.solution) {
          return { ...cell, value: '' };
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
          return { ...cell, value: cell.solution || 'A' };
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
    updated[r][c] = { ...updated[r][c], value: char };
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

  const activeCols = gridState[0]?.length || 12;
  const activeRows = gridState.length || 17;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${activeCols}, minmax(18px, 1fr))`,
          gridTemplateRows: `repeat(${activeRows}, minmax(18px, 24px))`,
          gap: '1px',
          backgroundColor: '#1e293b',
          padding: '2px',
          borderRadius: '8px',
          width: '100%',
          maxWidth: '460px',
          boxSizing: 'border-box',
          boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
        }}
      >
        {gridState.map((row, r) =>
          row.map((cell, c) => {
            const key = `${r}-${c}`;

            if (cell.type === 'black') {
              return <div key={key} style={{ backgroundColor: '#0f172a' }} />;
            }

            if (cell.type === 'image') {
              return <div key={key} style={{ backgroundColor: '#1e293b' }} />;
            }

            if (cell.type === 'definition') {
              return (
                <div
                  key={key}
                  style={{
                    backgroundColor: '#f59e0b',
                    color: '#0f172a',
                    fontSize: '7px',
                    fontWeight: 'bold',
                    padding: '1px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                    lineHeight: '8px',
                    overflow: 'hidden',
                  }}
                >
                  {cell.def1?.text || 'MOT'} {cell.def1?.arrow === 'down' ? '⬇' : '➔'}
                </div>
              );
            }

            const isSelected = selectedCell?.r === r && selectedCell?.c === c;

            return (
              <input
                key={key}
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
                  fontWeight: 'bold',
                  fontSize: '12px',
                  backgroundColor: isSelected ? '#93c5fd' : '#ffffff',
                  color: '#0f172a',
                  border: 'none',
                  outline: 'none',
                  padding: 0,
                  boxSizing: 'border-box',
                }}
              />
            );
          })
        )}
      </div>
    </div>
  );
};

export default GridContainer;