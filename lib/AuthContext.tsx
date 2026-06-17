"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import type { User } from "./types";
import { clearSession, loadSession, persistSession } from "./auth-storage";

interface AuthState {
  token: string | null;
  user: User | null;
}

interface AuthContextType extends AuthState {
  login: (token: string, user: User, rememberMe?: boolean) => void;
  logout: () => void;
  isInitialized: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    token: null,
    user: null,
  });
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const session = loadSession();
    if (session) {
      setState(session);
    }
    setIsInitialized(true);
  }, []);

  const login = (token: string, user: User, rememberMe = true) => {
    persistSession(token, user, rememberMe);
    setState({ token, user });
  };

  const logout = () => {
    clearSession(false);
    setState({ token: null, user: null });
  };

  return (
    <AuthContext.Provider value={{ ...state, login, logout, isInitialized }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
