import React, { useState } from 'react';
import { 
  Calendar, 
  Smile, 
  Meh, 
  Flame, 
  Crown, 
  Bot, 
  ArrowLeft 
} from 'lucide-react';
import { GrilleGeante } from './components/GrilleGeante';
import './App.css';
// Dans src/App.tsx du projet mots-fleches
import { useEffect } from 'react';
import { supabase } from './supabaseClient';

useEffect(() => {
  const handleURLSession = async () => {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get('access_token');
    const refreshToken = hashParams.get('refresh_token');

    if (accessToken && refreshToken) {
      const { error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (!error) {
        // Nettoyer l'URL propre sans récharger la page
        window.history.replaceState(null, '', window.location.pathname);
      }
    }
  };

  handleURLSession();
}, []);
const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'menu' | 'game'>('menu');

  return (
    <div className="menu-container">
      {currentView === 'menu' ? (
        <>
          <h1 className="title-card">MOTS-FLÉCHÉS</h1>

          <div className="grid-buttons">
            <button className="btn-orange" onClick={() => setCurrentView('game')}>
              <Calendar className="btn-icon" />
              <span>Défi du jour</span>
            </button>

            <button className="btn-green" onClick={() => setCurrentView('game')}>
              <Smile className="btn-icon" />
              <span>Facile</span>
            </button>

            <button className="btn-yellow" onClick={() => setCurrentView('game')}>
              <Meh className="btn-icon" />
              <span>Moyen</span>
            </button>

            <button className="btn-red" onClick={() => setCurrentView('game')}>
              <Flame className="btn-icon" />
              <span>Difficile</span>
            </button>

            <button className="btn-premium">
              <Crown className="btn-icon" />
              <span>PREMIUM 2,99 € / mois</span>
            </button>

            <button className="btn-ia">
              <Bot className="btn-icon" />
              <span>Aide avec MajorIA</span>
            </button>
          </div>
        </>
      ) : (
        <div className="game-view">
          <button className="btn-back" onClick={() => setCurrentView('menu')}>
            <ArrowLeft className="btn-icon" />
            <span>Retour au menu</span>
          </button>

          <div className="grid-container">
            <GrilleGeante />
          </div>
        </div>
      )}
    </div>
  );
};

export default App;