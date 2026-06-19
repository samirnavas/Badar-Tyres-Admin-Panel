"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type { User, UserRole } from "./models/User";
import { hasRoutePermission } from "./permissions";
import { getPermissions } from "./repositories/permission_repository";
import { clearSession, loadSession, normalizeAuthUser, persistSession } from "./auth-storage";

interface AuthState {
  token: string | null;
  user: User | null;
}

interface AuthContextType extends AuthState {
  login: (token: string, user: User, rememberMe?: boolean) => void;
  logout: () => void;
  isInitialized: boolean;
  permissions: Record<string, string[]> | null;
  permissionsLoaded: boolean;
  refreshPermissions: () => Promise<void>;
  hasPermission: (pathname: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    token: null,
    user: null,
  });
  const [isInitialized, setIsInitialized] = useState(false);
  const [permissions, setPermissions] = useState<Record<string, string[]> | null>(
    null,
  );
  const [permissionsLoaded, setPermissionsLoaded] = useState(false);

  const refreshPermissions = useCallback(async () => {
    const data = await getPermissions();
    setPermissions(data);
    setPermissionsLoaded(true);
  }, []);

  useEffect(() => {
    const session = loadSession();
    if (session) {
      setState(session);
    }
    setIsInitialized(true);
    void refreshPermissions();
  }, [refreshPermissions]);

  const login = (token: string, user: User, rememberMe = true) => {
    const normalized = normalizeAuthUser(user);
    persistSession(token, normalized, rememberMe);
    setState({ token, user: normalized });
  };

  const logout = () => {
    clearSession(false);
    setState({ token: null, user: null });
  };

  const hasPermission = useCallback(
    (pathname: string) => {
      if (!state.user || !permissions) return false;
      return hasRoutePermission(
        state.user.role as UserRole,
        pathname,
        permissions,
      );
    },
    [state.user, permissions],
  );

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        logout,
        isInitialized,
        permissions,
        permissionsLoaded,
        refreshPermissions,
        hasPermission,
      }}
    >
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
