import axios from "axios";

const DEFAULT_API_BASE_URL = "http://localhost:4000/api/v1";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL,
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

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
