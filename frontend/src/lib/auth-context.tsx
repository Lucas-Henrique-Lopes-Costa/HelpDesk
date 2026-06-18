"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { api } from "./api";
import { useMock } from "./tickets";
import { mockRoleForEmail, mockUserForEmail } from "./mock-db";
import type { UserRole } from "./rbac";

export type { UserRole } from "./rbac";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};

type LoginResponse = {
  token: string;
  user: AuthUser;
};

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_TOKEN = "hd_token";
const STORAGE_USER = "hd_user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const storedToken = localStorage.getItem(STORAGE_TOKEN);
      const storedUser = localStorage.getItem(STORAGE_USER);
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser) as AuthUser);
      }
    } catch {
      // localStorage indisponível ou JSON inválido — segue deslogado
    } finally {
      setLoading(false);
    }
  }, []);

  const persist = useCallback((nextToken: string, nextUser: AuthUser) => {
    localStorage.setItem(STORAGE_TOKEN, nextToken);
    localStorage.setItem(STORAGE_USER, JSON.stringify(nextUser));
    setToken(nextToken);
    setUser(nextUser);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      // Modo demo: autentica em memória, sem backend. O papel é derivado do
      // e-mail (ver mockRoleForEmail) para exercitar o RBAC das telas.
      if (useMock) {
        const mockUser: AuthUser = {
          ...mockUserForEmail(email),
          role: mockRoleForEmail(email),
        };
        persist(`mock-${mockUser.id}`, mockUser);
        return;
      }

      const data = await api<LoginResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      persist(data.token, data.user);
    },
    [persist],
  );

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_TOKEN);
    localStorage.removeItem(STORAGE_USER);
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, token, loading, login, logout }),
    [user, token, loading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
