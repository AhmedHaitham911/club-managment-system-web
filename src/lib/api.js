import axios from "axios";
import { clearStoredAuth as clearStoredAuthStorage, getStoredToken } from "./auth-storage";

const DEFAULT_API_BASE_URL = "/api/v1";
const TOKEN_FORMAT = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;
let inMemoryToken = null;
export const AUTH_SESSION_EXPIRED_EVENT = "auth:session-expired";

const isLikelyJwt = (token) =>
  typeof token === "string" && TOKEN_FORMAT.test(token);

export const setAuthToken = (token) => {
  if (isLikelyJwt(token)) {
    inMemoryToken = token;
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
    return;
  }

  inMemoryToken = null;
  delete api.defaults.headers.common.Authorization;
};

export const clearAuthToken = () => {
  inMemoryToken = null;
  delete api.defaults.headers.common.Authorization;
};

const clearStoredAuth = () => {
  clearAuthToken();
  clearStoredAuthStorage();
};

const notifySessionExpired = () => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(AUTH_SESSION_EXPIRED_EVENT));
  }
};

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL,
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  if (config?.__skipAuthInjection) {
    return config;
  }

  const headers = config?.headers;

  const storedToken = getStoredToken() || inMemoryToken;
  if (isLikelyJwt(storedToken)) {
    inMemoryToken = storedToken;
    if (typeof headers?.set === "function") {
      headers.set("Authorization", `Bearer ${storedToken}`);
    } else {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${storedToken}`;
    }
  } else if (storedToken) {
    clearStoredAuth();
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const message = String(
      error?.response?.data?.message || error?.response?.data?.error || ""
    );
    const isInvalidToken = status === 401 && message.includes("invalid or expired token");

    if (isInvalidToken) {
      clearStoredAuth();
      notifySessionExpired();
    }

    return Promise.reject(error);
  }
);

export const getErrorMessage = (error, fallbackMessage = "Request failed") => {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallbackMessage
  );
};

export const unwrapData = (response) => {
  if (response?.data?.data !== undefined) return response.data.data;
  return response?.data;
};
