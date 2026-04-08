"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export function Topbar() {
  const { user, logout, loading } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-10 bg-slate-900 text-slate-100 shadow">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link
          href={user ? "/dashboard" : "/login"}
          className="font-semibold tracking-tight text-white hover:text-slate-200"
        >
          HelpDesk Operacional
        </Link>

        {!loading && user && (
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden sm:inline text-slate-300">
              {user.name}{" "}
              <span className="text-slate-500">({user.role.toLowerCase()})</span>
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
