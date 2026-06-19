"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
  canManageUsers,
  canViewInsights,
  canViewQueue,
  roleLabel,
  type UserRole,
} from "@/lib/rbac";

type NavItem = { href: string; label: string; show: (role: UserRole) => boolean };

const NAV: NavItem[] = [
  { href: "/dashboard", label: "Chamados", show: () => true },
  { href: "/queue", label: "Fila", show: canViewQueue },
  { href: "/insights", label: "Indicadores", show: canViewInsights },
  { href: "/admin/users", label: "Usuários", show: canManageUsers },
];

export function Topbar() {
  const { user, logout, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const items = user ? NAV.filter((i) => i.show(user.role)) : [];

  return (
    <header className="sticky top-0 z-10 bg-slate-900 text-slate-100 shadow">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4">
        <div className="flex items-center gap-6">
          <Link
            href={user ? "/dashboard" : "/login"}
            className="whitespace-nowrap font-semibold tracking-tight text-white hover:text-slate-200"
          >
            HelpDesk
          </Link>

          {!loading && user && (
            <nav className="flex items-center gap-1 overflow-x-auto text-sm">
              {items.map((item) => {
                const active =
                  pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`whitespace-nowrap rounded-md px-3 py-1.5 font-medium transition ${
                      active
                        ? "bg-slate-700 text-white"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          )}
        </div>

        {!loading && user && (
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden text-slate-300 sm:inline">
              {user.name}{" "}
              <span className="text-slate-500">({roleLabel(user.role)})</span>
            </span>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-md bg-slate-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-400"
            >
              Sair
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
