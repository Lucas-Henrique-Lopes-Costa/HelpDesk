"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  listTickets,
  type ListTicketsFilters,
  type TicketListItem,
  type TicketPriority,
  type TicketStatus,
} from "@/lib/tickets";
import { PriorityBadge, StatusBadge } from "@/components/StatusBadge";

const STATUS_OPTIONS: { value: TicketStatus | ""; label: string }[] = [
  { value: "", label: "Todos os status" },
  { value: "OPEN", label: "Aberto" },
  { value: "IN_PROGRESS", label: "Em andamento" },
  { value: "RESOLVED", label: "Resolvido" },
  { value: "CLOSED", label: "Fechado" },
];

const PRIORITY_OPTIONS: { value: TicketPriority | ""; label: string }[] = [
  { value: "", label: "Todas as prioridades" },
  { value: "LOW", label: "Baixa" },
  { value: "MEDIUM", label: "Média" },
  { value: "HIGH", label: "Alta" },
  { value: "CRITICAL", label: "Crítica" },
];

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

function formatLocation(loc: TicketListItem["location"]) {
  const extra = [loc.building, loc.floor].filter(Boolean).join(" / ");
  return extra ? `${loc.name} — ${extra}` : loc.name;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [tickets, setTickets] = useState<TicketListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ListTicketsFilters>({
    status: "",
    priority: "",
    page: 1,
    pageSize: 20,
  });

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login");
  }, [user, authLoading, router]);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listTickets(filters);
      setTickets(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar chamados.");
      setTickets([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    if (user) void fetchTickets();
  }, [user, fetchTickets]);

  if (authLoading || !user) {
    return (
      <div className="text-sm text-slate-500">Verificando sessão…</div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Chamados</h1>
          <p className="text-sm text-slate-500">
            Acompanhe e priorize os chamados abertos pela operação.
          </p>
        </div>
        <Link
          href="/tickets/new"
          className="inline-flex items-center rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500"
        >
          + Novo chamado
        </Link>
      </div>

      <div className="flex flex-wrap gap-3 rounded-md border border-slate-200 bg-white p-3">
        <label className="flex flex-col text-xs font-medium text-slate-600">
          Status
          <select
            value={filters.status ?? ""}
            onChange={(e) =>
              setFilters((f) => ({
                ...f,
                status: e.target.value as TicketStatus | "",
                page: 1,
              }))
            }
            className="mt-1 rounded-md border border-slate-300 px-2 py-1.5 text-sm text-slate-900"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col text-xs font-medium text-slate-600">
          Prioridade
          <select
            value={filters.priority ?? ""}
            onChange={(e) =>
              setFilters((f) => ({
                ...f,
                priority: e.target.value as TicketPriority | "",
                page: 1,
              }))
            }
            className="mt-1 rounded-md border border-slate-300 px-2 py-1.5 text-sm text-slate-900"
          >
            {PRIORITY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          onClick={() => void fetchTickets()}
          className="self-end rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100"
        >
          Atualizar
        </button>
      </div>

      <div className="overflow-x-auto rounded-md border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-3 py-2">Título</th>
              <th className="px-3 py-2">Local</th>
              <th className="px-3 py-2">Categoria</th>
              <th className="px-3 py-2">Prioridade</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Reporter</th>
              <th className="px-3 py-2 whitespace-nowrap">Aberto em</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading &&
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={`skeleton-${i}`} className="animate-pulse">
                  {Array.from({ length: 7 }).map((__, j) => (
                    <td key={j} className="px-3 py-3">
                      <div className="h-3 w-24 rounded bg-slate-200" />
                    </td>
                  ))}
                </tr>
              ))}

            {!loading && error && (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center text-red-700">
                  {error}
                </td>
              </tr>
            )}

            {!loading && !error && tickets.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="px-3 py-10 text-center text-sm text-slate-500"
                >
                  Nenhum chamado encontrado para os filtros atuais.
                </td>
              </tr>
            )}

            {!loading &&
              !error &&
              tickets.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50">
                  <td className="px-3 py-2 font-medium text-slate-900">
                    {t.title}
                  </td>
                  <td className="px-3 py-2 text-slate-700">
                    {formatLocation(t.location)}
                  </td>
                  <td className="px-3 py-2 text-slate-700">
                    {t.category.name}
                  </td>
                  <td className="px-3 py-2">
                    <PriorityBadge priority={t.priority} />
                  </td>
                  <td className="px-3 py-2">
                    <StatusBadge status={t.status} />
                  </td>
                  <td className="px-3 py-2 text-slate-700">{t.reporter.name}</td>
                  <td className="px-3 py-2 whitespace-nowrap text-slate-500">
                    {formatDate(t.createdAt)}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
