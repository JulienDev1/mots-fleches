import React, { useEffect, useState } from 'react';
import { fetchAllGrids, GridSummary } from '../../services/gridService';
import type { GridDifficulty, UserSubscription } from '../../types/grid';

interface Props {
  currentGridId?: string;
  subscription?: UserSubscription;
  onSelectGrid: (difficulty: GridDifficulty) => void;
  onOpenPaywall?: () => void;
}

export const GridSelector: React.FC<Props> = ({
  subscription,
  onSelectGrid,
  onOpenPaywall = () => {},
}) => {
  const sub = subscription ?? { isSubscribed: false, freeGridsRemainingThisWeek: 1 };

  const handleSelect = (difficulty: GridDifficulty) => {
    if (difficulty !== 'easy' && !sub.isSubscribed) {
      onOpenPaywall();
      return;
    }

    if (difficulty === 'easy' && !sub.isSubscribed && sub.freeGridsRemainingThisWeek <= 0) {
      onOpenPaywall();
      return;
    }

    onSelectGrid(difficulty);
  };

  return (
    <div
      style={{
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        border: '1px solid #334155',
        borderRadius: '16px',
        padding: '16px',
        margin: '16px auto',
        maxWidth: '600px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '12px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
      }}
    >
      {/* 1. Badge Quota Semaine */}
      {!sub.isSubscribed && (
        <div
          style={{
            backgroundColor: '#f59e0b',
            color: '#0f172a',
            padding: '8px 16px',
            borderRadius: '12px',
            fontSize: '15px',
            fontWeight: '900',
            border: '1px solid #fcd34d',
            textAlign: 'center',
            width: '100%',
            boxSizing: 'border-box',
          }}
        >
          ⚡ Grille gratuite cette semaine : {sub.freeGridsRemainingThisWeek} restante(s)
        </div>
      )}

      {/* 2. Boutons de Niveaux */}
      <div
        style={{
          display: 'flex',
          gap: '10px',
          width: '100%',
          justifyContent: 'space-between',
        }}
      >
        <button
          onClick={() => handleSelect('easy')}
          style={{
            flex: 1,
            backgroundColor: '#059669',
            color: '#ffffff',
            fontWeight: '800',
            fontSize: '16px',
            padding: '12px 8px',
            borderRadius: '12px',
            border: '1px solid #34d399',
            cursor: 'pointer',
          }}
        >
          Facile
        </button>

        <button
          onClick={() => handleSelect('medium')}
          style={{
            flex: 1,
            backgroundColor: sub.isSubscribed ? '#d97706' : '#334155',
            color: sub.isSubscribed ? '#ffffff' : '#94a3b8',
            fontWeight: '800',
            fontSize: '16px',
            padding: '12px 8px',
            borderRadius: '12px',
            border: sub.isSubscribed ? '1px solid #fbbf24' : '1px solid #475569',
            cursor: sub.isSubscribed ? 'pointer' : 'not-allowed',
          }}
        >
          Moyen {!sub.isSubscribed && '🔒'}
        </button>

        <button
          onClick={() => handleSelect('hard')}
          style={{
            flex: 1,
            backgroundColor: sub.isSubscribed ? '#e11d48' : '#334155',
            color: sub.isSubscribed ? '#ffffff' : '#94a3b8',
            fontWeight: '800',
            fontSize: '16px',
            padding: '12px 8px',
            borderRadius: '12px',
            border: sub.isSubscribed ? '1px solid #fb7185' : '1px solid #475569',
            cursor: sub.isSubscribed ? 'pointer' : 'not-allowed',
          }}
        >
          Difficile {!sub.isSubscribed && '🔒'}
        </button>
      </div>

      {/* 3. Bouton Offre Illimitée */}
      {!sub.isSubscribed && (
        <button
          onClick={onOpenPaywall}
          style={{
            width: '100%',
            background: 'linear-gradient(to right, #2563eb, #4f46e5)',
            color: '#ffffff',
            fontWeight: '900',
            fontSize: '16px',
            padding: '14px 16px',
            borderRadius: '12px',
            border: '1px solid #60a5fa',
            cursor: 'pointer',
            boxShadow: '0 10px 15px -3px rgba(37, 99, 235, 0.4)',
          }}
        >
          🚀 Débloquer l'accès illimité — 2,99 € / mois
        </button>
      )}
    </div>
  );
};
interface GridSelectorProps {
  onSelectGrid: (gridId: string) => void;
  currentGridId?: string;
}

export const GridListSelector: React.FC<GridSelectorProps> = ({ onSelectGrid, currentGridId }) => {
  const [grids, setGrids] = useState<GridSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadList = async () => {
      const data = await fetchAllGrids();
      setGrids(data);
      setLoading(false);
    };
    loadList();
  }, []);

  if (loading) {
    return <div className="text-center py-4 text-gray-400">Chargement des grilles...</div>;
  }

  return (
    <div className="space-y-2">
      {grids.map((g) => {
        const isSelected = g.id === currentGridId;
        return (
          <button
            key={g.id}
            onClick={() => onSelectGrid(String(g.id))}
            className={`p-3 rounded-lg text-left transition-all border flex flex-col justify-between gap-1 ${
              isSelected
                ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg ring-2 ring-indigo-400'
                : 'bg-slate-800/80 border-slate-700 text-slate-200 hover:bg-slate-700'
            }`}
          >
            <div className="font-bold text-sm truncate">{g.title}</div>
            <div className="text-[11px] text-slate-300 flex justify-between items-center w-full mt-1 border-t border-slate-700/50 pt-1">
              <span className="bg-slate-900/60 px-1.5 py-0.5 rounded text-amber-400 font-mono">
                {g.cols} × {g.rows}
              </span>
              <span className="text-slate-400">
                {new Date(g.created_at || Date.now()).toLocaleDateString('fr-FR')}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
};