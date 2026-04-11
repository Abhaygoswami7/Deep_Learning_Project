/**
 * Auth Context — Shared authentication state across both platforms.
 * Stores JWT token in localStorage for persistence across sessions.
 */
import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../utils/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("auth_token") || "");
  const [loading, setLoading] = useState(true);

  // On mount, verify existing token
  useEffect(() => {
    if (token) {
      api
        .getMe(token)
        .then((data) => {
          setUser(data);
        })
        .catch(() => {
          // Invalid token, clear it
          setToken("");
          localStorage.removeItem("auth_token");
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (username, password) => {
    const data = await api.login(username, password);
    setToken(data.access_token);
    setUser(data.user);
    localStorage.setItem("auth_token", data.access_token);
    return data;
  };

  const signup = async (username, email, password, displayName) => {
    const data = await api.signup(username, email, password, displayName);
    setToken(data.access_token);
    setUser(data.user);
    localStorage.setItem("auth_token", data.access_token);
    return data;
  };

  const logout = () => {
    setToken("");
    setUser(null);
    localStorage.removeItem("auth_token");
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}

export default AuthContext;
