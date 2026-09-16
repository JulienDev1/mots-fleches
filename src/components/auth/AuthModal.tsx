import React from 'react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '../../lib/supabaseClient';

export const AuthModal: React.FC = () => {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: '#020817',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        zIndex: 100,
      }}
    >
      <div
        style={{
          backgroundColor: '#0f172a',
          border: '1px solid #334155',
          borderRadius: '20px',
          padding: '32px',
          maxWidth: '400px',
          width: '100%',
          color: '#ffffff',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
        }}
      >
        <h2 style={{ fontSize: '24px', fontWeight: '900', textAlign: 'center', marginBottom: '8px' }}>
          Mots Fléchés
        </h2>
        <p style={{ color: '#94a3b8', fontSize: '14px', textAlign: 'center', marginBottom: '24px' }}>
          Connecte-toi pour jouer et sauvegarder ta progression.
        </p>

        <Auth
          supabaseClient={supabase}
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: '#2563eb',
                  brandAccent: '#1d4ed8',
                  inputBackground: '#1e293b',
                  inputText: '#ffffff',
                  inputBorder: '#475569',
                  inputPlaceholder: '#64748b',
                },
              },
            },
          }}
          providers={['google']}
          localization={{
            variables: {
              sign_in: {
                email_label: 'Adresse e-mail',
                password_label: 'Mot de passe',
                button_label: 'Se connecter',
              },
              sign_up: {
                email_label: 'Adresse e-mail',
                password_label: 'Mot de passe',
                button_label: "S'inscrire",
              },
            },
          }}
        />
      </div>
    </div>
  );
};