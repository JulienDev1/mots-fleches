import React from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const STRIPE_PAYMENT_LINK = 'https://buy.stripe.com/eVqaEWeBMf8DegBdVZ3ks01';

export const PaywallModal: React.FC<Props> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const handleSubscribe = () => {
    window.location.href = STRIPE_PAYMENT_LINK;
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(2, 6, 23, 0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        zIndex: 50,
      }}
    >
      <div
        style={{
          backgroundColor: '#0f172a',
          border: '1px solid #334155',
          borderRadius: '20px',
          padding: '24px',
          maxWidth: '420px',
          width: '100%',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
          textAlign: 'center',
          color: '#ffffff',
        }}
      >
        <div style={{ fontSize: '40px', marginBottom: '12px' }}>⚡</div>

        <h2 style={{ fontSize: '24px', fontWeight: '900', marginBottom: '8px' }}>
          Accès Illimité
        </h2>

        <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '20px' }}>
          Joue sans contrainte à toutes les grilles Facile, Moyen et Difficile.
        </p>

        <div
          style={{
            backgroundColor: '#1e293b',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '20px',
            border: '1px solid #475569',
          }}
        >
          <span style={{ fontSize: '32px', fontWeight: '900', color: '#60a5fa' }}>
            2,99 €
          </span>
          <span style={{ color: '#94a3b8', fontSize: '14px' }}> / mois</span>
          <p style={{ fontSize: '12px', color: '#cbd5e1', marginTop: '6px' }}>
            Sans engagement — Annulable à tout moment.
          </p>
        </div>

        <button
          onClick={handleSubscribe}
          style={{
            width: '100%',
            background: 'linear-gradient(to right, #2563eb, #4f46e5)',
            color: '#ffffff',
            fontWeight: '900',
            fontSize: '16px',
            padding: '14px',
            borderRadius: '12px',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 10px 15px -3px rgba(37, 99, 235, 0.4)',
            marginBottom: '10px',
          }}
        >
          S'abonner maintenant
        </button>

        <button
          onClick={onClose}
          style={{
            background: 'transparent',
            color: '#94a3b8',
            border: 'none',
            fontSize: '14px',
            cursor: 'pointer',
            padding: '8px',
          }}
        >
          Plus tard
        </button>
      </div>
    </div>
  );
};