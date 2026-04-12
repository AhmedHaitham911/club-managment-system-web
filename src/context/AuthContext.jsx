import { useEffect, useState } from "react";
import { normalizeUser } from "../lib/auth-user";
import {
  api,
  AUTH_SESSION_EXPIRED_EVENT,
  clearAuthToken,
  setAuthToken,
  unwrapData,
} from "../lib/api";
import {
  clearStoredAuth as clearStoredAuthStorage,
  getStoredToken,
  getStoredUser,
  migrateLegacyAuthStorage,
  setStoredToken,
  setStoredUser,
} from "../lib/auth-storage";
import { AuthContext } from "./auth-context";

const TOKEN_FORMAT = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;

const isLikelyJwt = (token) =>
  typeof token === "string" && TOKEN_FORMAT.test(token);

const clearStoredAuth = () => {
  clearAuthToken();
  clearStoredAuthStorage();
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    const onSessionExpired = () => {
      clearStoredAuth();
      setUser(null);
      setToken(null);
    };

    if (typeof window !== "undefined") {
      window.addEventListener(AUTH_SESSION_EXPIRED_EVENT, onSessionExpired);
      return () => {
        window.removeEventListener(AUTH_SESSION_EXPIRED_EVENT, onSessionExpired);
      };
    }

    return undefined;
  }, []);

  useEffect(() => {
    const hydrate = async () => {
      migrateLegacyAuthStorage();
      const storedUser = getStoredUser();
      const storedToken = getStoredToken();

      if (!(storedUser && storedToken && isLikelyJwt(storedToken))) {
        if (storedUser || storedToken) {
          clearStoredAuth();
        }
        setAuthReady(true);
        return;
      }

      try {
        JSON.parse(storedUser);
        setAuthToken(storedToken);
        const response = await api.get("/users/me");
        const normalized = normalizeUser(unwrapData(response));
        setToken(storedToken);
        setUser(normalized);
        setStoredUser(JSON.stringify(normalized));
      } catch {
        clearStoredAuth();
        setUser(null);
        setToken(null);
      } finally {
        setAuthReady(true);
      }
    };

    hydrate();
  }, []);

  const login = async (userData, authToken) => {
    if (!isLikelyJwt(authToken)) {
      throw new Error("Login response did not include a valid access token.");
    }

    const normalized = normalizeUser(userData);
    clearStoredAuth();
    setStoredToken(authToken);
    setStoredUser(JSON.stringify(normalized));
    setAuthToken(authToken);
    setToken(authToken);
    setUser(normalized);
  };

  const logout = () => {
    clearStoredAuth();
    setUser(null);
    setToken(null);
  };

  const updateUser = (newUserData) => {
    if (!newUserData) {
      setUser(null);
      return;
    }

    const normalized = normalizeUser(newUserData);
    setUser(normalized);
    setStoredUser(JSON.stringify(normalized));
  };

  return (
    <AuthContext.Provider value={{ user, token, authReady, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};
