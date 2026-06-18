"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./auth-context";
import type { UserRole } from "./rbac";

type GuardResult = {
  user: ReturnType<typeof useAuth>["user"];
  loading: boolean;
  /** true quando há usuário e (se informado) o papel é permitido. */
  authorized: boolean;
};

/**
 * Protege uma página: redireciona para /login se não autenticado e para
 * /dashboard se o papel não estiver entre os permitidos. Passe `allowedRoles`
 * como constante de módulo (referência estável) para evitar re-execuções.
 */
export function useRequireAuth(allowedRoles?: UserRole[]): GuardResult {
  const { user, loading } = useAuth();
  const router = useRouter();

  const roleOk = !allowedRoles || (!!user && allowedRoles.includes(user.role));

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (!roleOk) {
      router.replace("/dashboard");
    }
  }, [user, loading, roleOk, router]);

  return { user, loading, authorized: !!user && roleOk };
}
