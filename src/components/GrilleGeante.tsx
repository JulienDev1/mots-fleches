import React, { useState, useEffect, useRef } from 'react';
import { fetchTodayGrid, fetchUserProgress, saveUserProgress } from '../services/gridService';
import type { CellData, Direction, GrilleGeanteProps } from '../types/game';
import { generateMockGridData } from '../data/mockGrille';

const COLS = 12;
const ROWS = 17;
const STORAGE_KEY = 'mots_fleches_quota';

const checkQuota = (isPremium: boolean) => {
  if (isPremium) return { canPlay: true, remaining: Infinity };
  const today = new Date().toISOString().split('T')[0];
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return { canPlay: true, remaining: 3 };

  try {
    const data = JSON.parse(saved);
    if (data.date !== today) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ date: today, count: 0 }));
      return { canPlay: true, remaining: 3 };
    }
    return { canPlay: data.count < 3, remaining: Math.max(0, 3 - data.count) };
  } catch {
    return { canPlay: true, remaining: 3 };
  }
};

const extractAnswers = (grid: CellData[][]): Record<string, string> => {
  const answers: Record<string, string> = {};
  grid.forEach((row, r) => {
    row.forEach((cell, c) => {
      if (cell.type === 'lettre' && cell.saisie) {
        answers[`${r}-${c}`] = cell.saisie;
      }
    });
  });
  return answers;
};

export const GrilleGeante: React.FC<GrilleGeanteProps & { userId?: string }> = ({
  isPremium = false,
  userId,
}) => {
  const [remainingGrids, setRemainingGrids] = useState<number>(3);
  const [gridId, setGridId] = useState<string | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string>('https://picsum.photos/200/200');
  const [gridState, setGridState] = useState<CellData[][]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [direction, setDirection] = useState<Direction>('horizontal');
  const [activePos, setActivePos] = useState<{ r: number; c: number } | null>(null);
  const [isWon, setIsWon] = useState<boolean>(false);

  const inputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  useEffect(() => {
    const initGrid = async () => {
      const { remaining } = checkQuota(isPremium);
      setRemainingGrids(remaining);

      try {
        const todayGrid = await fetchTodayGrid();

        if (todayGrid && todayGrid.grid_data && todayGrid.id) {
          setGridId(todayGrid.id);
          if (todayGrid.photo_url) setPhotoUrl(todayGrid.photo_url);

          const baseGrid = todayGrid.grid_data as CellData[][];
          const savedProgress = userId ? await fetchUserProgress(userId, todayGrid.id) : null;

          if (savedProgress) {
            const restoredGrid = baseGrid.map((row, r) =>
              row.map((cell, c) => {
                const key = `${r}-${c}`;
                if (cell.type === 'lettre' && savedProgress[key]) {
                  return { ...cell, saisie: savedProgress[key] };
                }
                return cell;
              })
            );
            setGridState(restoredGrid);
          } else {
            setGridState(baseGrid);
          }
        } else {
          console.warn("Grille introuvable en BDD, chargement de la grille fictive.");
          setGridState(generateMockGridData() as CellData[][]);
        }
      } catch (err) {
        console.error("Erreur lors de la récupération de la grille :", err);
        setGridState(generateMockGridData() as CellData[][]);
      } finally {
        setLoading(false);
      }
    };

    initGrid();
  }, [isPremium, userId]);

  const focusCell = (r: number, c: number) => {
    if (r >= 0 && r < ROWS && c >= 0 && c < COLS) {
      inputRefs.current[`${r}-${c}`]?.focus();
    }
  };

  const handleCellClick = (r: number, c: number) => {
    if (activePos?.r === r && activePos?.c === c) {
      setDirection((prev) => (prev === 'horizontal' ? 'vertical' : 'horizontal'));
    } else {
      setActivePos({ r, c });
    }
  };

  const moveToNextCell = (r: number, c: number) => {
    let nextR = r;
    let nextC = c;
    if (direction === 'horizontal') nextC++;
    else nextR++;

    while (nextR < ROWS && nextC < COLS) {
      if (gridState[nextR]?.[nextC]?.type === 'lettre') {
        focusCell(nextR, nextC);
        return;
      }
      if (direction === 'horizontal') nextC++;
      else nextR++;
    }
  };

  const handleInputChange = (r: number, c: number, val: string) => {
    const letter = val.slice(-1).toUpperCase();
    const updated = gridState.map((row) => [...row]);
    updated[r][c] = { ...updated[r][c], saisie: letter, isError: false };

    setGridState(updated);
    if (gridId && userId) {
      saveUserProgress(userId, gridId, extractAnswers(updated));
    }
    if (letter) moveToNextCell(r, c);
  };

  const handleKeyDown = (r: number, c: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === ' ') {
      e.preventDefault();
      setDirection((prev) => (prev === 'horizontal' ? 'vertical' : 'horizontal'));
    } else if (e.key === 'Backspace' && !gridState[r][c]?.saisie) {
      let prevR = direction === 'vertical' ? r - 1 : r;
      let prevC = direction === 'horizontal' ? c - 1 : c;
      while (prevR >= 0 && prevC >= 0) {
        if (gridState[prevR]?.[prevC]?.type === 'lettre') {
          focusCell(prevR, prevC);
          return;
        }
        if (direction === 'horizontal') prevC--;
        else prevR--;
      }
    } else if (e.key === 'ArrowRight') focusCell(r, c + 1);
    else if (e.key === 'ArrowLeft') focusCell(r, c - 1);
    else if (e.key === 'ArrowDown') focusCell(r + 1, c);
    else if (e.key === 'ArrowUp') focusCell(r - 1, c);
  };

  const checkGrid = () => {
    let hasError = false;
    let isComplete = true;
    const updated = gridState.map((row) =>
      row.map((cell) => {
        if (cell.type !== 'lettre') return cell;
        if (!cell.saisie) {
          isComplete = false;
          return cell;
        }
        const error = cell.solution ? cell.saisie !== cell.solution : false;
        if (error) hasError = true;
        return { ...cell, isError: error };
      })
    );
    setGridState(updated);
    const winState = isComplete && !hasError;
    if (winState) setIsWon(true);
    if (gridId && userId) {
      saveUserProgress(userId, gridId, extractAnswers(updated));
    }
  };

  const revealGrid = () => {
    const updated = gridState.map((row) =>
      row.map((cell) => {
        if (cell.type === 'lettre') {
          return { ...cell, saisie: cell.solution || cell.saisie, isError: false };
        }
        return cell;
      })
    );
    setGridState(updated);
    setIsWon(true);
    if (gridId && userId) {
      saveUserProgress(userId, gridId, extractAnswers(updated));
    }
  };

  if (loading) {
    return (
      <div style={{ color: '#fff', textAlign: 'center', marginTop: '50px', fontWeight: 'bold' }}>
        Chargement de la grille...
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        minHeight: '100vh',
        maxWidth: '460px',
        margin: '0 auto',
        padding: '12px',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          width: '100%',
          backgroundColor: 'rgba(15, 23, 42, 0.9)',
          borderRadius: '8px',
          padding: '6px 12px',
          marginBottom: '6px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          border: '1px solid rgba(255,255,255,0.2)',
          boxSizing: 'border-box',
        }}
      >
        <span style={{ fontSize: '12px', color: '#e2e8f0', fontWeight: 'bold' }}>
          {isPremium ? 'Premium' : `Grilles restantes : ${remainingGrids}/3`}
        </span>
        <button
          onClick={() => setDirection((prev) => (prev === 'horizontal' ? 'vertical' : 'horizontal'))}
          style={{
            backgroundColor: '#2563eb',
            color: '#fff',
            border: 'none',
            padding: '4px 10px',
            borderRadius: '6px',
            fontSize: '11px',
            fontWeight: 'bold',
            cursor: 'pointer',
          }}
        >
          {direction === 'horizontal' ? '➔ Horizontal' : '⬇ Vertical'}
        </button>
      </div>

      <div
        style={{
          position: 'relative',
          display: 'grid',
          gridTemplateColumns: `repeat(${COLS}, 1fr)`,
          gridTemplateRows: `repeat(${ROWS}, minmax(16px, 22px))`,
          gap: '1px',
          backgroundColor: '#1e293b',
          border: '2px solid #0f172a',
          borderRadius: '6px',
          width: '100%',
          boxShadow: '0 10px 25px rgba(0,0,0,0.6)',
          overflow: 'hidden',
        }}
      >
        {gridState.map((row, r) =>
          row.map((cell, c) => {
            const key = `${r}-${c}`;

            if (cell.type === 'image') {
              return <div key={key} style={{ backgroundColor: 'transparent' }} />;
            }

            if (cell.type === 'noire') {
              return <div key={key} style={{ backgroundColor: '#0f172a' }} />;
            }

            if (cell.type === 'definition') {
              const defText =
                cell.definitions && cell.definitions.length > 0 ? cell.definitions[0].texte : 'MOT';
              const defDir =
                cell.definitions && cell.definitions.length > 0
                  ? cell.definitions[0].direction
                  : 'horizontal';

              return (
                <div
                  key={key}
                  style={{
                    backgroundColor: '#f59e0b',
                    color: '#0f172a',
                    fontSize: '6.5px',
                    fontWeight: '800',
                    lineHeight: '7.5px',
                    padding: '1px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    textAlign: 'center',
                    boxSizing: 'border-box',
                    overflow: 'hidden',
                    wordBreak: 'break-word',
                  }}
                >
                  {defText} {defDir === 'horizontal' ? '➔' : '⬇'}
                </div>
              );
            }

            const isSelected = activePos?.r === r && activePos?.c === c;
            return (
              <input
                key={key}
                ref={(el) => {
                  inputRefs.current[key] = el;
                }}
                maxLength={1}
                value={cell.saisie || ''}
                onClick={() => handleCellClick(r, c)}
                onChange={(e) => handleInputChange(r, c, e.target.value)}
                onKeyDown={(e) => handleKeyDown(r, c, e)}
                style={{
                  width: '100%',
                  height: '100%',
                  textAlign: 'center',
                  fontWeight: '800',
                  backgroundColor: cell.isError ? '#fca5a5' : isSelected ? '#93c5fd' : '#ffffff',
                  color: cell.isError ? '#991b1b' : '#0f172a',
                  border: 'none',
                  outline: 'none',
                  fontSize: '11px',
                  padding: 0,
                  boxSizing: 'border-box',
                }}
              />
            );
          })
        )}

        <div
          style={{
            position: 'absolute',
            top: 'calc((100% / 17) * 6)',
            left: 'calc((100% / 12) * 4)',
            width: 'calc((100% / 12) * 4)',
            height: 'calc((100% / 17) * 4)',
            zIndex: 5,
            border: '2px solid #2563eb',
            boxSizing: 'border-box',
          }}
        >
          <img src={photoUrl} alt="Mystère" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginTop: '8px', width: '100%' }}>
        <button
          onClick={checkGrid}
          style={{
            flex: 1,
            backgroundColor: '#16a34a',
            color: '#fff',
            border: 'none',
            padding: '8px',
            borderRadius: '6px',
            fontWeight: 'bold',
            fontSize: '12px',
            cursor: 'pointer',
          }}
        >
          Vérifier
        </button>
        <button
          onClick={revealGrid}
          style={{
            flex: 1,
            backgroundColor: '#dc2626',
            color: '#fff',
            border: 'none',
            padding: '8px',
            borderRadius: '6px',
            fontWeight: 'bold',
            fontSize: '12px',
            cursor: 'pointer',
          }}
        >
          Révéler
        </button>
      </div>

      {isWon && (
        <div
          style={{
            marginTop: '6px',
            padding: '6px 12px',
            backgroundColor: '#22c55e',
            color: '#fff',
            fontWeight: 'bold',
            borderRadius: '6px',
            textAlign: 'center',
            width: '100%',
            fontSize: '12px',
          }}
        >
          Félicitations, grille résolue !
        </div>
      )}
    </div>
  );
};

export default GrilleGeante;