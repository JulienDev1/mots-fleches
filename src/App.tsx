import React, { useState, useEffect } from 'react';
import { GridContainer } from './components/grid/GridContainer';
import { GridSelector } from './components/grid/GridSelector';
import { PaywallModal } from './components/common/PaywallModal';
import majoriaLogo from './assets/majoria.png';
import { supabase } from './lib/supabaseClient';
import { checkAndFetchWeeklyQuota, consumeFreeGrid } from './services/subscriptionService';
import { GridDifficulty } from './types/grid';

export const App = () => {
  const [selectedGridId, setSelectedGridId] = useState<string | undefined>(undefined);
  const [isPaywallOpen, setIsPaywallOpen] = useState(false);
  const [subscription, setSubscription] = useState({
    isSubscribed: false,
    freeGridsRemainingThisWeek: 1,
  });

  // Chargement initial du statut d'abonnement et des quotas
  useEffect(() => {
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
  }, []);

  // Gestion du choix de niveau et consommation du quota gratuit
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
      {/* En-tête de navigation inter-applications */}
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

        {/* Passerelle vers Major2IA */}
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

        {/* Sélecteur de grille avec statut d'abonnement */}
        <GridSelector
          currentGridId={selectedGridId}
          subscription={subscription}
          onSelectGrid={handleSelectGrid}
          onOpenPaywall={() => setIsPaywallOpen(true)}
        />

        {/* Grille de jeu */}
        <GridContainer gridId={selectedGridId} />
      </main>

      {/* Modale Paywall 2,99 € / mois */}
      <PaywallModal
        isOpen={isPaywallOpen}
        onClose={() => setIsPaywallOpen(false)}
      />
    </div>
  );
};

export default App;