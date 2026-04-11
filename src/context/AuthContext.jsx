import { createContext, useState, useEffect } from "react";
import { normalizeUser } from "../lib/auth-user";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const storedToken = localStorage.getItem("token");

    if (storedUser && storedToken) {
      try {
        const parsed = JSON.parse(storedUser);
        setUser(normalizeUser(parsed));
        setToken(storedToken);
      } catch {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
      }
    }
  }, []);

  const login = (userData, authToken) => {
    const normalized = normalizeUser(userData);
    setUser(normalized);
    setToken(authToken);
    localStorage.setItem("user", JSON.stringify(normalized));
    localStorage.setItem("token", authToken);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  };

  const updateUser = (newUserData) => {
    const normalized = normalizeUser(newUserData);
    setUser(normalized);
    localStorage.setItem("user", JSON.stringify(normalized));
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};
