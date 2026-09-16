import React from 'react';

interface GridModalProps {
  children: React.ReactNode;
  remainingGrids?: string;
  mode?: string;
  onVerify?: () => void;
  onReveal?: () => void;
}

export const GridModal: React.FC<GridModalProps> = ({
  children,
  remainingGrids = 'Grilles restantes : 3/3',
  mode = 'Horizontal',
  onVerify,
  onReveal,
}) => {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        backdropFilter: 'blur(4px)',
        padding: '16px',
      }}
    >
      <div
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          border: '1px solid #e2e8f0',
          padding: '16px',
          maxHeight: '90vh',
          maxWidth: '95vw',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px',
          boxSizing: 'border-box',
        }}
      >
        {/* En-tête de la modale */}
        <div
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#1e293b',
            color: '#ffffff',
            padding: '8px 16px',
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: 600,
            boxSizing: 'border-box',
          }}
        >
          <span>{remainingGrids}</span>
          <span
            style={{
              backgroundColor: '#0ea5e9',
              color: '#ffffff',
              padding: '4px 12px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 700,
              textTransform: 'uppercase',
            }}
          >
            ➔ {mode}
          </span>
        </div>

        {/* Zone de défilement pour la grille */}
        <div
          style={{
            overflow: 'auto',
            maxHeight: '65vh',
            maxWidth: '100%',
            borderRadius: '8px',
            border: '1px solid #cbd5e1',
            backgroundColor: '#f1f5f9',
            padding: '8px',
            boxSizing: 'border-box',
          }}
        >
          {children}
        </div>

        {/* Boutons d'action */}
        <div
          style={{
            width: '100%',
            display: 'flex',
            gap: '12px',
            boxSizing: 'border-box',
          }}
        >
          <button
            onClick={onVerify}
            style={{
              flex: 1,
              backgroundColor: '#059669',
              color: '#ffffff',
              fontWeight: 'bold',
              padding: '10px 16px',
              borderRadius: '12px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            Vérifier
          </button>
          <button
            onClick={onReveal}
            style={{
              flex: 1,
              backgroundColor: '#e11d48',
              color: '#ffffff',
              fontWeight: 'bold',
              padding: '10px 16px',
              borderRadius: '12px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            Révéler
          </button>
        </div>
      </div>
    </div>
  );
};

export default GridModal;