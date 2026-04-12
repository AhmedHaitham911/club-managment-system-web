const STORAGE_KEYS = {
  token: "campus_club_access_token",
  user: "campus_club_user",
  legacyToken: "token",
  legacyUser: "user",
};

export const getStoredToken = () => localStorage.getItem(STORAGE_KEYS.token);
export const getStoredUser = () => localStorage.getItem(STORAGE_KEYS.user);

export const setStoredToken = (token) =>
  localStorage.setItem(STORAGE_KEYS.token, token);

export const setStoredUser = (userJson) =>
  localStorage.setItem(STORAGE_KEYS.user, userJson);

export const clearStoredAuth = () => {
  localStorage.removeItem(STORAGE_KEYS.token);
  localStorage.removeItem(STORAGE_KEYS.user);
  localStorage.removeItem(STORAGE_KEYS.legacyToken);
  localStorage.removeItem(STORAGE_KEYS.legacyUser);
};

export const migrateLegacyAuthStorage = () => {
  const hasNewToken = Boolean(localStorage.getItem(STORAGE_KEYS.token));
  const hasNewUser = Boolean(localStorage.getItem(STORAGE_KEYS.user));
  if (hasNewToken || hasNewUser) {
    localStorage.removeItem(STORAGE_KEYS.legacyToken);
    localStorage.removeItem(STORAGE_KEYS.legacyUser);
    return;
  }

  const legacyToken = localStorage.getItem(STORAGE_KEYS.legacyToken);
  const legacyUser = localStorage.getItem(STORAGE_KEYS.legacyUser);
  if (legacyToken && legacyUser) {
    localStorage.setItem(STORAGE_KEYS.token, legacyToken);
    localStorage.setItem(STORAGE_KEYS.user, legacyUser);
  }

  localStorage.removeItem(STORAGE_KEYS.legacyToken);
  localStorage.removeItem(STORAGE_KEYS.legacyUser);
};
