const STORAGE_KEY = 'mots_fleches_quota';

interface QuotaData {
  date: string;
  count: number;
}

export const checkQuota = (isPremium: boolean): { canPlay: boolean; remaining: number } => {
  if (isPremium) {
    return { canPlay: true, remaining: Infinity };
  }

  const today = new Date().toISOString().split('T')[0];
  const saved = localStorage.getItem(STORAGE_KEY);
  
  if (!saved) {
    return { canPlay: true, remaining: 3 };
  }

  const data: QuotaData = JSON.parse(saved);

  if (data.date !== today) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ date: today, count: 0 }));
    return { canPlay: true, remaining: 3 };
  }

  const remaining = Math.max(0, 3 - data.count);
  return { canPlay: remaining > 0, remaining };
};

export const incrementQuota = (isPremium: boolean): void => {
  if (isPremium) return;

  const today = new Date().toISOString().split('T')[0];
  const saved = localStorage.getItem(STORAGE_KEY);
  let count = 0;

  if (saved) {
    const data: QuotaData = JSON.parse(saved);
    if (data.date === today) {
      count = data.count;
    }
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify({ date: today, count: count + 1 }));
};