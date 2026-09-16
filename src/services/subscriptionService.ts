import { supabase } from '../lib/supabaseClient';

export const checkAndFetchDailyQuota = async (userId: string) => {
  const today = new Date().toISOString().split('T')[0];

  // 1. Vérifier si l'utilisateur est abonné
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_subscribed')
    .eq('id', userId)
    .maybeSingle();

  if (profile?.is_subscribed) {
    return { freeGridsRemainingToday: Infinity };
  }

  // 2. Vérifier s'il a déjà joué aujourd'hui dans la table d'usage
  const { data: usage } = await supabase
    .from('user_weekly_usage')
    .select('grids_played')
    .eq('user_id', userId)
    .eq('usage_date', today)
    .maybeSingle();

  const gridsPlayedToday = usage?.grids_played ?? 0;

  return {
    freeGridsRemainingToday: gridsPlayedToday >= 1 ? 0 : 1,
  };
};

export const consumeFreeGrid = async (userId: string) => {
  const today = new Date().toISOString().split('T')[0];

  // Insère une ligne pour aujourd'hui ou incrémente si elle existe déjà
  await supabase
    .from('user_weekly_usage')
    .upsert(
      {
        user_id: userId,
        usage_date: today,
        grids_played: 1,
        update_at: new Date().toISOString(),
      },
      { onConflict: 'user_id, usage_date' }
    );
};