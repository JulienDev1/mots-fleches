import { supabase } from '../lib/supabaseClient';

export const checkAndFetchDailyQuota = async (userId: string) => {
  const today = new Date().toISOString().split('T')[0];

  const { data: profile } = await supabase
    .from('profiles')
    .select('last_free_grid_date, is_subscribed')
    .eq('id', userId)
    .maybeSingle();

  if (profile?.is_subscribed) {
    return { freeGridsRemainingToday: Infinity };
  }

  const playedToday = profile?.last_free_grid_date === today;
  return {
    freeGridsRemainingToday: playedToday ? 0 : 1,
  };
};

export const consumeFreeGrid = async (userId: string) => {
  const today = new Date().toISOString().split('T')[0];

  await supabase
    .from('profiles')
    .update({ last_free_grid_date: today })
    .eq('id', userId);
};