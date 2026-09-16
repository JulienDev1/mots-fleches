import { supabase } from '../lib/supabaseClient'; // Ajuste le chemin selon ton projet

export const updateSubscriptionStatus = async (userId: string, isSubscribed: boolean) => {
  const { error } = await supabase
    .from('profiles')
    .update({ 
      is_subscribed: isSubscribed,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId);

  if (error) {
    console.error('Erreur lors de la mise a jour du statut :', error);
    return false;
  }

  return true;
};

// Calcule le numéro de semaine ISO courant
const getCurrentWeekDetails = () => {
  const now = new Date();
  const jan1 = new Date(now.getFullYear(), 0, 1);
  const days = Math.floor((now.getTime() - jan1.getTime()) / (24 * 60 * 60 * 1000));
  const weekNumber = Math.ceil((days + jan1.getDay() + 1) / 7);
  return { year: now.getFullYear(), weekNumber };
};

export const checkAndFetchWeeklyQuota = async (userId: string) => {
  const { year, weekNumber } = getCurrentWeekDetails();

  const { data, error } = await supabase
    .from('user_weekly_usage')
    .select('grids_played')
    .eq('user_id', userId)
    .eq('year', year)
    .eq('week_number', weekNumber)
    .maybeSingle();

  if (error) {
    console.error('Erreur lors de la récupération du quota :', error);
    return { freeGridsRemainingThisWeek: 1 };
  }

  const gridsPlayed = data?.grids_played ?? 0;
  const remaining = Math.max(0, 1 - gridsPlayed);

  return { freeGridsRemainingThisWeek: remaining };
};

export const consumeFreeGrid = async (userId: string) => {
  const { year, weekNumber } = getCurrentWeekDetails();

  const { data: existing } = await supabase
    .from('user_weekly_usage')
    .select('id, grids_played')
    .eq('user_id', userId)
    .eq('year', year)
    .eq('week_number', weekNumber)
    .maybeSingle();

  if (existing) {
    await supabase
      .from('user_weekly_usage')
      .update({ 
        grids_played: existing.grids_played + 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', existing.id);
  } else {
    await supabase
      .from('user_weekly_usage')
      .insert({
        user_id: userId,
        year,
        week_number: weekNumber,
        grids_played: 1,
      });
  }
};