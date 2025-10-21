const DEFAULT_USER = { name: null };

export function getOrInitUser() {
  try {
    const raw = localStorage.getItem('finsights_user');
    if (raw) return JSON.parse(raw);
    localStorage.setItem('finsights_user', JSON.stringify(DEFAULT_USER));
    return DEFAULT_USER;
  } catch (e) {
    return DEFAULT_USER;
  }
}

export function setUser(user) {
  try {
    localStorage.setItem('finsights_user', JSON.stringify(user || DEFAULT_USER));
  } catch (e) {}
}

export function getUserWatchlistKey(name) {
  const n = name || 'guest';
  return `finsights_watchlist_${n}`;
}
