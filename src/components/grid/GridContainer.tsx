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
  type: 'letter' | 'definition' | 'black';
  solution?: string;
  value?: string;
  def1?: Definition;
  def2?: Definition;
}

const CELL_SIZE = 64;

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
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  const effectiveSchema = schema ?? grid;
  const inputsRef = useRef<{ [key: string]: HTMLInputElement | null }>({});

  const todayKey = new Date().toISOString().split('T')[0];
  const storageKey = `mots_fleches_progress_${userId || 'guest'}_${gridId || 'daily'}_${todayKey}`;

  // 1. Nettoyage automatique du localStorage
  useEffect(() => {
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('mots_fleches_progress_') && !key.endsWith(todayKey)) {
        localStorage.removeItem(key);
      }
    });
  }, [todayKey]);

  // 2. Chargement du schéma de la grille
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
          try {
            data = await fetchGridById(gridId);
          } catch (e) {
            data = await fetchDailyGrid();
          }
        } else {
          data = await fetchDailyGrid();
        }
        setGrid(data);
      } catch (error) {
        setGrid(null);
      } finally {
        setLoading(false);
      }
    };

    loadGrid();
  }, [gridId, schema]);

  // 3. Initialisation et Restauration
  useEffect(() => {
    if (!effectiveSchema) return;

    let savedAnswers: Record<string, string> = {};
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        savedAnswers = JSON.parse(saved);
      } catch (e) {
        console.error("Erreur de lecture du cache de grille", e);
      }
    }

    const matrix: CellData[][] = Array.from({ length: effectiveSchema.rows }, (_, r) =>
      Array.from({ length: effectiveSchema.cols }, (_, c) => ({
        r,
        c,
        type: 'black',
      }))
    );

    effectiveSchema.cells.forEach((cell) => {
      const cellKey = `${cell.r}-${cell.c}`;
      const savedValue = savedAnswers[cellKey] || '';
      matrix[cell.r][cell.c] = { ...cell, value: savedValue };
    });

    setGridState(matrix);
    setIsCompleted(false);

    for (let r = 0; r < effectiveSchema.rows; r++) {
      for (let c = 0; c < effectiveSchema.cols; c++) {
        if (matrix[r][c].type === 'letter') {
          setSelectedCell({ r, c });
          return;
        }
      }
    }
  }, [effectiveSchema, storageKey]);

  // 4. Enregistrement automatique de la progression
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
    } else {
      localStorage.removeItem(storageKey);
    }
  }, [gridState, storageKey]);

  // 5. Vérification de la complétion de la grille
  useEffect(() => {
    if (gridState.length === 0) return;

    let totalLetters = 0;
    let correctLetters = 0;

    gridState.forEach((row) => {
      row.forEach((cell) => {
        if (cell.type === 'letter') {
          totalLetters++;
          if (cell.value && cell.value.toUpperCase() === cell.solution?.toUpperCase()) {
            correctLetters++;
          }
        }
      });
    });

    if (totalLetters > 0 && correctLetters === totalLetters) {
      setIsCompleted(true);
    }
  }, [gridState]);

  useEffect(() => {
    if (onVerifyRef) onVerifyRef(handleVerify);
    if (onRevealRef) onRevealRef(handleReveal);
  }, [gridState]);

  const handleCellClick = (r: number, c: number) => {
    if (!gridState[r] || gridState[r][c]?.type !== 'letter') return;
    if (selectedCell?.r === r && selectedCell?.c === c) {
      setDirection(direction === 'horizontal' ? 'vertical' : 'horizontal');
    } else {
      setSelectedCell({ r, c });
    }
  };

  const moveFocus = (r: number, c: number, dir: 'horizontal' | 'vertical', step = 1) => {
    if (!effectiveSchema) return;

    let nr = r;
    let nc = c;
    while (true) {
      if (dir === 'horizontal') nc += step;
      else nr += step;

      if (nr < 0 || nr >= effectiveSchema.rows || nc < 0 || nc >= effectiveSchema.cols) break;
      if (gridState[nr][nc].type === 'letter') {
        setSelectedCell({ r: nr, c: nc });
        inputsRef.current[`${nr}-${nc}`]?.focus();
        break;
      }
    }
  };

  const handleCellChange = (r: number, c: number, val: string) => {
    const updated = [...gridState.map((row) => [...row])];
    updated[r][c] = { ...updated[r][c], value: val.toUpperCase() };
    setGridState(updated);

    if (val !== '') {
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
          return { ...cell, value: cell.solution };
        }
        return cell;
      })
    );
    setGridState(updated);
  };

  const renderArrow = (arrow?: ArrowDirection) => {
    switch (arrow) {
      case 'right':
        return '➔';
      case 'down':
        return '⬇';
      case 'right-down':
        return '↳';
      case 'down-right':
        return '⬎';
      default:
        return '➔';
    }
  };

  if (loading) {
    return <div className="text-center py-10 text-slate-400">Chargement de la grille...</div>;
  }

  if (!effectiveSchema) {
    return <div className="text-center py-10 text-red-400">Grille introuvable.</div>;
  }

  if (gridState.length === 0) return null;

  return (
    <div style={{ position: 'relative' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${effectiveSchema.cols}, ${CELL_SIZE}px)`,
          gridTemplateRows: `repeat(${effectiveSchema.rows}, ${CELL_SIZE}px)`,
          gap: '1px',
          backgroundColor: '#334155',
          padding: '1px',
          width: 'fit-content',
          margin: '0 auto',
          userSelect: 'none',
        }}
      >
        {gridState.map((row, r) =>
          row.map((cell, c) => {
            if (cell.type === 'black') {
              return (
                <div
                  key={`${r}-${c}`}
                  style={{ width: CELL_SIZE, height: CELL_SIZE, backgroundColor: '#0f172a' }}
                />
              );
            }

            if (cell.type === 'definition') {
              const isDouble = cell.def1 && cell.def2;

              return (
                <div
                  key={`${r}-${c}`}
                  style={{
                    width: CELL_SIZE,
                    height: CELL_SIZE,
                    backgroundColor: '#e4b1e8',
                    color: '#000000',
                    padding: '2px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxSizing: 'border-box',
                    overflow: 'hidden',
                    position: 'relative',
                    border: '1px solid #c084fc',
                  }}
                  title={`${cell.def1?.text || ''} ${cell.def2?.text ? '/ ' + cell.def2.text : ''}`}
                >
                  {cell.def1 && (
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        gap: '2px',
                        height: isDouble ? '48%' : '100%',
                      }}
                    >
                      <span
                        style={{
                          fontSize: isDouble ? '9px' : '11px',
                          lineHeight: '1',
                          fontWeight: 'bold',
                          whiteSpace: 'normal',
                          wordBreak: 'break-word',
                          overflow: 'hidden',
                          textTransform: 'uppercase',
                        }}
                      >
                        {cell.def1.text}
                      </span>
                      <span style={{ fontSize: '10px', fontWeight: 'bold', flexShrink: 0 }}>
                        {renderArrow(cell.def1.arrow)}
                      </span>
                    </div>
                  )}

                  {isDouble && (
                    <div
                      style={{
                        width: '100%',
                        height: '1px',
                        backgroundColor: '#0c0a0e',
                        margin: '1px 0',
                      }}
                    />
                  )}

                  {cell.def2 && (
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-end',
                        gap: '2px',
                        height: isDouble ? '48%' : '100%',
                      }}
                    >
                      <span
                        style={{
                          fontSize: isDouble ? '9px' : '11px',
                          lineHeight: '1',
                          fontWeight: 'bold',
                          whiteSpace: 'normal',
                          wordBreak: 'break-word',
                          overflow: 'hidden',
                          textTransform: 'uppercase',
                        }}
                      >
                        {cell.def2.text}
                      </span>
                      <span style={{ fontSize: '10px', fontWeight: 'bold', flexShrink: 0 }}>
                        {renderArrow(cell.def2.arrow)}
                      </span>
                    </div>
                  )}
                </div>
              );
            }

            const isSelected = selectedCell?.r === r && selectedCell?.c === c;
            const isHighlighted =
              !isSelected &&
              ((direction === 'horizontal' && selectedCell?.r === r) ||
                (direction === 'vertical' && selectedCell?.c === c));

            let bg = '#ffffff';
            if (isSelected) bg = '#bae6fd';
            else if (isHighlighted) bg = '#e0f2fe';

            return (
              <div
                key={`${r}-${c}`}
                onClick={() => handleCellClick(r, c)}
                style={{
                  width: CELL_SIZE,
                  height: CELL_SIZE,
                  backgroundColor: bg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <input
                  ref={(el) => {
                    inputsRef.current[`${r}-${c}`] = el;
                  }}
                  type="text"
                  maxLength={1}
                  value={cell.value || ''}
                  onChange={(e) => handleCellChange(r, c, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(r, c, e)}
                  style={{
                    width: '100%',
                    height: '100%',
                    border: 'none',
                    outline: 'none',
                    textAlign: 'center',
                    fontWeight: 'bold',
                    fontSize: '32px',
                    backgroundColor: 'transparent',
                    textTransform: 'uppercase',
                    padding: 0,
                    color:
                      cell.value && cell.solution && cell.value !== cell.solution
                        ? '#dc2626'
                        : '#0f172a',
                  }}
                />
              </div>
            );
          })
        )}
      </div>

      {/* Pop-up de félicitations */}
      {isCompleted && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(2, 8, 23, 0.85)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '16px',
          }}
        >
          <div
            style={{
              backgroundColor: '#0f172a',
              border: '2px solid #22c55e',
              borderRadius: '16px',
              padding: '32px 24px',
              maxWidth: '380px',
              width: '100%',
              textAlign: 'center',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
            }}
          >
            <div style={{ fontSize: '56px', marginBottom: '12px' }}>🎉</div>
            <h2
              style={{
                fontSize: '26px',
                fontWeight: '900',
                color: '#ffffff',
                marginBottom: '8px',
              }}
            >
              Bravo !
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '15px', marginBottom: '24px' }}>
              Tu as complété la grille du jour sans aucune erreur !
            </p>
            <button
              onClick={() => setIsCompleted(false)}
              style={{
                backgroundColor: '#22c55e',
                color: '#ffffff',
                fontWeight: '800',
                fontSize: '15px',
                padding: '12px 24px',
                borderRadius: '10px',
                border: 'none',
                cursor: 'pointer',
                width: '100%',
              }}
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GridContainer;