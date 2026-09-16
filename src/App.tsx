import React, { useState, useEffect } from 'react';
import { GridContainer } from './components/grid/GridContainer';
import { GridSelector } from './components/grid/GridSelector';
import { PaywallModal } from './components/common/PaywallModal';
import majoriaLogo from './assets/majoria.png';
import { supabase } from './lib/supabaseClient';
import { checkAndFetchWeeklyQuota, consumeFreeGrid } from './services/subscriptionService';
import { GridDifficulty } from './types/grid';
import { AuthModal } from './components/auth/AuthModal';

export const App = () => {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedGridId, setSelectedGridId] = useState<string | undefined>(undefined);
  const [isPaywallOpen, setIsPaywallOpen] = useState(false);
  const [subscription, setSubscription] = useState({
    isSubscribed: false,
    freeGridsRemainingThisWeek: 1,
  });

  // 1. Authentification Supabase
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // 2. Gestion de la grille quotidienne (changement à minuit)
  useEffect(() => {
    if (!session) return;

    const todayKey = new Date().toISOString().split('T')[0]; // Format "YYYY-MM-DD"
    const lastVisitedDate = localStorage.getItem('mots_fleches_last_date');

    // Si on change de jour (ou premier accès)
    if (lastVisitedDate !== todayKey) {
      localStorage.setItem('mots_fleches_last_date', todayKey);
      // Supprime la progression enregistrée pour repartir sur une grille neuve
      localStorage.removeItem('mots_fleches_grid_progress');
      localStorage.removeItem('mots_fleches_grid_state');
    }
  }, [session]);

  // 3. Chargement du statut d'abonnement et des quotas Supabase
  useEffect(() => {
    if (!session) return;

    const initQuota = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('is_subscribed')
        .eq('id', user.id)
        .maybeSingle();

      const isSubscribed = profile?.is_subscribed ?? false;

      if (!isSubscribed) {
        const quota = await checkAndFetchWeeklyQuota(user.id);
        setSubscription({
          isSubscribed: false,
          freeGridsRemainingThisWeek: quota.freeGridsRemainingThisWeek,
        });
      } else {
        setSubscription({ isSubscribed: true, freeGridsRemainingThisWeek: Infinity });
      }
    };

    initQuota();
  }, [session]);

  // 4. Sélection d'une grille et consommation du quota
  const handleSelectGrid = async (difficulty: GridDifficulty) => {
    const { data: { user } } = await supabase.auth.getUser();

    if (difficulty === 'easy' && !subscription.isSubscribed && user) {
      await consumeFreeGrid(user.id);
      const updatedQuota = await checkAndFetchWeeklyQuota(user.id);
      setSubscription((prev) => ({
        ...prev,
        freeGridsRemainingThisWeek: updatedQuota.freeGridsRemainingThisWeek,
      }));
    }

    setSelectedGridId(difficulty);
  };

  // Écran de chargement
  if (loading) {
    return (
      <div style={{ backgroundColor: '#020817', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold' }}>
        Chargement...
      </div>
    );
  }

  // Écran de connexion obligatoire si pas de session active
  if (!session) {
    return <AuthModal />;
  }

  return (
    <div
      className="min-h-screen text-slate-100"
      style={{
        backgroundColor: '#020817',
        backgroundImage: "url('/fond-mots-fleches.jpg')",
        backgroundSize: 'cover',
        backgroundRepeat: 'repeat',
      }}
    >
      {/* En-tête de navigation */}
      <nav
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 24px',
          backgroundColor: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(8px)',
          borderBottom: '1px solid #334155',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img
            src="/logo-mots-fleches.png"
            alt="Mots-Fléchés"
            style={{ width: '32px', height: '32px', borderRadius: '8px' }}
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
          <span style={{ fontWeight: '900', color: '#ffffff', fontSize: '18px' }}>
            Mots-Fléchés
          </span>
        </div>

        {/* Bouton vers Major2IA & Déconnexion */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <a
            href="https://majoria-app.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#1e293b',
              border: '1px solid #475569',
              padding: '6px 14px',
              borderRadius: '10px',
              color: '#ffffff',
              textDecoration: 'none',
              fontSize: '13px',
              fontWeight: '700',
            }}
            title="Ouvrir Major2IA"
          >
            <span>Ouvrir</span>
            <img
              src={majoriaLogo}
              alt="Major2IA"
              style={{ width: '24px', height: '24px', borderRadius: '6px' }}
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  'https://api.iconify.design/lucide:bot.svg?color=%2360a5fa';
              }}
            />
          </a>

          <button
            onClick={() => supabase.auth.signOut()}
            style={{
              backgroundColor: 'transparent',
              border: '1px solid #475569',
              color: '#94a3b8',
              padding: '6px 12px',
              borderRadius: '8px',
              fontSize: '12px',
              cursor: 'pointer',
            }}
          >
            Déconnexion
          </button>
        </div>
      </nav>

      {/* Contenu principal */}
      <main className="w-full mx-auto p-4">
        <header style={{ textAlign: 'center', marginBottom: '24px', paddingTop: '16px' }}>
          <h1
            style={{
              display: 'inline-block',
              backgroundColor: '#2563eb',
              color: '#ffffff',
              fontSize: '48px',
              fontWeight: '900',
              padding: '10px 24px',
              borderRadius: '12px',
              border: '2px solid #60a5fa',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
            }}
          >
            Mots Fléchés
          </h1>
        </header>

        {/* Sélecteur de grille */}
        <GridSelector
          currentGridId={selectedGridId}
          subscription={subscription}
          onSelectGrid={handleSelectGrid}
          onOpenPaywall={() => setIsPaywallOpen(true)}
        />

        {/* Grille de jeu */}
        <GridContainer gridId={selectedGridId} />
      </main>

      {/* Paywall Modal */}
      <PaywallModal
        isOpen={isPaywallOpen}
        onClose={() => setIsPaywallOpen(false)}
      />
    </div>
  );
};

export default App;