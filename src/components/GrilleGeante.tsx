import React, { useState, useEffect, useRef } from 'react';
import { fetchTodayGrid, fetchUserProgress, saveUserProgress } from '../services/gridService';

export type CellType = 'lettre' | 'definition' | 'image' | 'noire';
export type Direction = 'horizontal' | 'vertical';

export interface DefinitionData {
  texte: string;
  direction: Direction;
}

export interface CellData {
  type: CellType;
  solution?: string;
  saisie?: string;
  definitions?: DefinitionData[];
  isError?: boolean;
}

interface GrilleGeanteProps {
  onBack?: () => void;
  isPremium?: boolean;
}

const COLS = 12;
const ROWS = 17;
const STORAGE_KEY = 'mots_fleches_quota';

const checkQuota = (isPremium: boolean) => {
  if (isPremium) return { canPlay: true, remaining: Infinity };
  const today = new Date().toISOString().split('T')[0];
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return { canPlay: true, remaining: 3 };
  
  const data = JSON.parse(saved);
  if (data.date !== today) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ date: today, count: 0 }));
    return { canPlay: true, remaining: 3 };
  }
  const remaining = Math.max(0, 3 - data.count);
  return { canPlay: remaining > 0, remaining };
};

const incrementQuota = (isPremium: boolean) => {
  if (isPremium) return;
  const today = new Date().toISOString().split('T')[0];
  const saved = localStorage.getItem(STORAGE_KEY);
  let count = 0;
  if (saved) {
    const data = JSON.parse(saved);
    if (data.date === today) count = data.count;
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ date: today, count: count + 1 }));
};

const generateMockGridData = (): CellData[][] => {
  return Array.from({ length: ROWS }, (_, r) =>
    Array.from({ length: COLS }, (_, c) => {
      if (c >= 4 && c <= 7 && r >= 6 && r <= 9) return { type: 'image' };
      if (r === 0 && c === 0) return { type: 'definition', definitions: [{ texte: 'ASTRE', direction: 'horizontal' }] };
      if (r === 0 && c === 5) return { type: 'definition', definitions: [{ texte: 'FLEUVE', direction: 'vertical' }] };
      if ((r === 3 && c === 2) || (r === 12 && c === 10)) return { type: 'noire' };
      return { type: 'lettre', solution: 'A', saisie: '' };
    })
  );
};

export const GrilleGeante: React.FC<GrilleGeanteProps> = ({ onBack, isPremium = false }) => {
  const [canPlay, setCanPlay] = useState<boolean>(true);
  const [remainingGrids, setRemainingGrids] = useState<number>(3);
  const [gridId, setGridId] = useState<string | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string>('https://picsum.photos/200/200');
  const [gridState, setGridState] = useState<CellData[][]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [direction, setDirection] = useState<Direction>('horizontal');
  const [activePos, setActivePos] = useState<{ r: number; c: number } | null>(null);
  const [isWon, setIsWon] = useState(false);

  const inputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initialisation et récupération de la grille du jour + sauvegarde
  useEffect(() => {
    const initGrid = async () => {
      const { canPlay: allowed, remaining } = checkQuota(isPremium);
      setCanPlay(allowed);
      setRemainingGrids(remaining);

      if (!allowed) {
        setLoading(false);
        return;
      }

      const todayGrid = await fetchTodayGrid();
      
      if (todayGrid) {
        setGridId(todayGrid.id);
        if (todayGrid.photo_url) setPhotoUrl(todayGrid.photo_url);

        const savedProgress = await fetchUserProgress(todayGrid.id);
        setGridState(savedProgress || todayGrid.grid_data);
      } else {
        setGridState(generateMockGridData());
      }

      incrementQuota(isPremium);
      setLoading(false);
    };

    initGrid();
  }, [isPremium]);

  // Sauvegarde automatique avec anti-rebond (1,5 seconde après la dernière frappe)
  const autoSave = (updatedState: CellData[][], won: boolean = false) => {
    if (!gridId) return;
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    saveTimeoutRef.current = setTimeout(() => {
      saveUserProgress(gridId, updatedState, won);
    }, 1500);
  };

  const focusCell = (r: number, c: number) => {
    if (r >= 0 && r < ROWS && c >= 0 && c < COLS) {
      inputRefs.current[`${r}-${c}`]?.focus();
    }
  };

  const handleCellClick = (r: number, c: number) => {
    if (activePos?.r === r && activePos?.c === c) {
      setDirection(prev => prev === 'horizontal' ? 'vertical' : 'horizontal');
    } else {
      setActivePos({ r, c });
    }
  };

  const moveToNextCell = (r: number, c: number) => {
    let nextR = r;
    let nextC = c;
    if (direction === 'horizontal') nextC++; else nextR++;

    while (nextR < ROWS && nextC < COLS) {
      if (gridState[nextR][nextC].type === 'lettre') {
        focusCell(nextR, nextC);
        return;
      }
      if (direction === 'horizontal') nextC++; else nextR++;
    }
  };

  const handleInputChange = (r: number, c: number, val: string) => {
    const letter = val.slice(-1).toUpperCase();
    const updated = [...gridState.map(row => [...row])];
    updated[r][c] = { ...updated[r][c], saisie: letter, isError: false };
    
    setGridState(updated);
    autoSave(updated, isWon);

    if (letter) moveToNextCell(r, c);
  };

  const handleKeyDown = (r: number, c: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === ' ') {
      e.preventDefault();
      setDirection(prev => prev === 'horizontal' ? 'vertical' : 'horizontal');
    } else if (e.key === 'Backspace' && !gridState[r][c].saisie) {
      let prevR = direction === 'vertical' ? r - 1 : r;
      let prevC = direction === 'horizontal' ? c - 1 : c;
      while (prevR >= 0 && prevC >= 0) {
        if (gridState[prevR][prevC].type === 'lettre') {
          focusCell(prevR, prevC);
          return;
        }
        if (direction === 'horizontal') prevC--; else prevR--;
      }
    } else if (e.key === 'ArrowRight') focusCell(r, c + 1);
    else if (e.key === 'ArrowLeft') focusCell(r, c - 1);
    else if (e.key === 'ArrowDown') focusCell(r + 1, c);
    else if (e.key === 'ArrowUp') focusCell(r - 1, c);
  };

  const checkGrid = () => {
    let hasError = false;
    let isComplete = true;
    const updated = gridState.map(row =>
      row.map(cell => {
        if (cell.type !== 'lettre') return cell;
        if (!cell.saisie) { isComplete = false; return cell; }
        const error = cell.solution ? cell.saisie !== cell.solution : false;
        if (error) hasError = true;
        return { ...cell, isError: error };
      })
    );
    setGridState(updated);
    const winState = isComplete && !hasError;
    if (winState) setIsWon(true);
    autoSave(updated, winState);
  };

  const revealGrid = () => {
    const updated = gridState.map(row =>
      row.map(cell => {
        if (cell.type === 'lettre') {
          return { ...cell, saisie: cell.solution || cell.saisie, isError: false };
        }
        return cell;
      })
    );
    setGridState(updated);
    setIsWon(true);
    autoSave(updated, true);
  };

  if (loading) {
    return <div style={{ color: '#fff', textAlign: 'center', marginTop: '50px' }}>Chargement de la grille...</div>;
  }

  if (!canPlay) {
    return (
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        backgroundColor: '#1e293b',
        color: '#fff',
        padding: '24px',
        borderRadius: '12px',
        textAlign: 'center',
        zIndex: 20,
        maxWidth: '320px',
        boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
      }}>
        <h3 style={{ margin: '0 0 12px 0', fontSize: '18px' }}>Limite quotidienne atteinte</h3>
        <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '20px' }}>
          Vous avez utilisé vos 3 grilles gratuites du jour. Passez au forfait Premium pour jouer en illimité !
        </p>
        <button
          onClick={() => alert('Redirection abonnement...')}
          style={{
            backgroundColor: '#2563eb',
            color: '#fff',
            border: 'none',
            padding: '10px 18px',
            borderRadius: '8px',
            fontWeight: 'bold',
            fontSize: '13px',
            cursor: 'pointer',
            width: '100%',
            marginBottom: '10px'
          }}
        >
          Devenir Premium
        </button>
        {onBack && (
          <button onClick={onBack} style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '12px', cursor: 'pointer' }}>
            ← Retour au menu
          </button>
        )}
      </div>
    );
  }

  return (
    <div style={{
      position: 'absolute',
      top: '48%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      zIndex: 10,
      width: '95%',
      maxWidth: '380px',
      boxSizing: 'border-box'
    }}>
      <div style={{ fontSize: '10px', color: '#cbd5e1', marginBottom: '4px', fontWeight: 'bold' }}>
        {isPremium ? '⭐ Accès Premium Illimité' : `Grilles restantes aujourd'hui : ${remainingGrids - 1}/3`}
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
        {onBack && (
          <button onClick={onBack} style={{ background: 'rgba(0,0,0,0.6)', border: 'none', color: '#fff', fontSize: '11px', padding: '4px 10px', borderRadius: '12px', cursor: 'pointer' }}>
            ← Menu
          </button>
        )}
        <button onClick={() => setDirection(prev => prev === 'horizontal' ? 'vertical' : 'horizontal')} style={{ background: '#2563eb', border: 'none', color: '#fff', fontSize: '11px', padding: '4px 10px', borderRadius: '12px', cursor: 'pointer' }}>
          Mode: {direction === 'horizontal' ? '→ Horizontal' : '↓ Vertical'}
        </button>
      </div>

      <div style={{
        position: 'relative',
        display: 'grid',
        gridTemplateColumns: `repeat(${COLS}, 1fr)`,
        gridTemplateRows: `repeat(${ROWS}, 27px)`,
        gap: '1px',
        backgroundColor: '#1e293b',
        border: '2px solid #334155',
        padding: '2px',
        borderRadius: '6px',
        width: '100%',
        boxShadow: '0 10px 25px rgba(0,0,0,0.3)'
      }}>
        {gridState.map((row, r) =>
          row.map((cell, c) => {
            const key = `${r}-${c}`;
            if (cell.type === 'image') return <div key={key} style={{ backgroundColor: 'transparent' }} />;
            if (cell.type === 'noire') return <div key={key} style={{ backgroundColor: '#0f172a', width: '100%', height: '27px' }} />;

            if (cell.type === 'definition') {
              return (
                <div key={key} style={{ width: '100%', height: '27px', backgroundColor: '#fbbf24', color: '#1e293b', fontSize: '6px', lineHeight: '7px', fontWeight: 'bold', padding: '1px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', overflow: 'hidden', boxSizing: 'border-box' }}>
                  {cell.definitions?.map((d, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1px' }}>
                      <span>{d.texte}</span>
                      <span style={{ fontSize: '7px', color: '#b45309' }}>{d.direction === 'horizontal' ? '→' : '↓'}</span>
                    </div>
                  ))}
                </div>
              );
            }

            const isSelected = activePos?.r === r && activePos?.c === c;
            return (
              <input
                key={key}
                ref={(el) => { inputRefs.current[key] = el}} 
                maxLength={1}
                value={cell.saisie || ''}
                onClick={() => handleCellClick(r, c)}
                onChange={(e) => handleInputChange(r, c, e.target.value)}
                onKeyDown={(e) => handleKeyDown(r, c, e)}
                style={{
                  width: '100%',
                  height: '27px',
                  textAlign: 'center',
                  fontWeight: 'bold',
                  backgroundColor: cell.isError ? '#fca5a5' : isSelected ? '#bfdbfe' : '#fff',
                  color: cell.isError ? '#991b1b' : '#000',
                  border: 'none',
                  outline: 'none',
                  fontSize: '12px',
                  padding: 0,
                  boxSizing: 'border-box'
                }}
              />
            );
          })
        )}

        <div style={{
          position: 'absolute',
          top: 'calc(6 * 28px + 3px)',
          left: 'calc((100% / 12) * 4 + 2px)',
          width: 'calc((100% / 12) * 4 - 3px)',
          height: 'calc(4 * 28px - 3px)',
          zIndex: 5,
          borderRadius: '3px',
          overflow: 'hidden',
          border: '2px solid #2563eb'
        }}>
          <img src={photoUrl} alt="Photo mystère" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
        <button onClick={checkGrid} style={{ backgroundColor: '#16a34a', color: '#fff', border: 'none', padding: '5px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>
          Vérifier
        </button>
        <button onClick={revealGrid} style={{ backgroundColor: '#dc2626', color: '#fff', border: 'none', padding: '5px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>
          Révéler
        </button>
      </div>

      {isWon && (
        <div style={{ marginTop: '6px', padding: '4px 12px', backgroundColor: '#22c55e', color: '#fff', fontWeight: 'bold', borderRadius: '4px', fontSize: '12px' }}>
          Bravo, grille résolue !
        </div>
      )}
    </div>
  );
};