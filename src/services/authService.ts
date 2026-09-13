import { supabase } from '../supabaseClient';
// src/services/authService.ts
export const checkPremiumStatus = async (): Promise<boolean> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data } = await supabase
    .from('profiles')
    .select('is_premium')
    .eq('id', user.id)
    .single();

  return data?.is_premium || false;
};