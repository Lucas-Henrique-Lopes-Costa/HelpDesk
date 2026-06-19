"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useRequireAuth } from "@/lib/use-require-auth";
import { createUser, listUsers, type PublicUser } from "@/lib/users";
import { messageFromError } from "@/lib/api";
import { ADMIN_ROLES, ASSIGNABLE_ROLES, roleLabel, type UserRole } from "@/lib/rbac";

const ROLE_OPTIONS: { value: UserRole; label: string; hint: string }[] = ASSIGNABLE_ROLES.map(
  (role) => ({
    value: role,
    label: roleLabel(role),
    hint: {
      OPERATOR: "Atende e resolve chamados na fila.",
      MANAGER: "Acompanha indicadores e atribui chamados.",
      REQUESTER: "Abre chamados e vê apenas os próprios.",
      ADMIN: "Acesso total, incluindo gestão de usuários.",
    }[role],
  }),
);

const EMPTY = { name: "", email: "", password: "", role: "OPERATOR" as UserRole };

export default function AdminUsersPage() {
  const { user, authorized } = useRequireAuth(ADMIN_ROLES);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<PublicUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      setUsers(await listUsers());
    } catch (err) {
      setLoadError(messageFromError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authorized) reload();
  }, [authorized, reload]);

  if (!authorized || !user) {
    return <div className="text-sm text-slate-500">Verificando sessão…</div>;
  }

  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (form.name.trim().length < 2) return setError("Informe o nome completo.");
    if (!form.email.includes("@")) return setError("Informe um e-mail válido.");
    if (form.password.length < 6) return setError("A senha deve ter pelo menos 6 caracteres.");

    setSubmitting(true);
    try {
      await createUser({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        role: form.role,
      });
      setForm({ ...EMPTY, role: form.role });
      setShowForm(false);
      await reload();
    } catch (err) {
      setError(messageFromError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Usuários</h1>
          <p className="mt-1 text-sm text-slate-500">
            Crie contas de operador, gestor, solicitante ou administrador.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setError(null);
            setShowForm((v) => !v);
          }}
          className="shrink-0 rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500"
        >
          {showForm ? "Fechar" : "+ Novo usuário"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mt-5 space-y-4 rounded-md border border-slate-200 bg-white p-5 shadow-sm"
          noValidate
        >
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-slate-700">
              Nome
            </label>
            <input
              id="name"
              type="text"
              required
              value={form.name}
              onChange={(e) => set({ name: e.target.value })}
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
              placeholder="Ex.: Carlos Manutenção"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              required
              value={form.email}
              onChange={(e) => set({ email: e.target.value })}
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
              placeholder="carlos@helpdesk.local"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-700">
              Senha provisória
            </label>
            <input
              id="password"
              type="text"
              required
              minLength={6}
              value={form.password}
              onChange={(e) => set({ password: e.target.value })}
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
              placeholder="Mínimo 6 caracteres"
            />
          </div>

          <div>
            <label htmlFor="role" className="block text-sm font-medium text-slate-700">
              Papel
            </label>
            <select
              id="role"
              value={form.role}
              onChange={(e) => set({ role: e.target.value as UserRole })}
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
            >
              {ROLE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-slate-500">
              {ROLE_OPTIONS.find((o) => o.value === form.role)?.hint}
            </p>
          </div>

          {error && (
            <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Criando…" : "Criar usuário"}
            </button>
          </div>
        </form>
      )}

      <div className="mt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-slate-700">
            Usuários cadastrados{!loading && ` (${users.length})`}
          </h2>
          <button
            type="button"
            onClick={reload}
            className="text-xs font-medium text-slate-500 hover:text-slate-700"
          >
            Atualizar
          </button>
        </div>

        {loadError && (
          <p role="alert" className="mt-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {loadError}
          </p>
        )}

        {loading ? (
          <p className="mt-2 text-sm text-slate-500">Carregando…</p>
        ) : users.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">Nenhum usuário cadastrado ainda.</p>
        ) : (
          <ul className="mt-2 divide-y divide-slate-100 rounded-md border border-slate-200 bg-white">
            {users.map((u) => (
              <li key={u.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                <div>
                  <p className="font-medium text-slate-900">{u.name}</p>
                  <p className="text-slate-500">{u.email}</p>
                </div>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                  {roleLabel(u.role)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
