"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useRequireAuth } from "@/lib/use-require-auth";
import { isForbidden, messageFromError } from "@/lib/api";
import {
  listTickets,
  type ListTicketsFilters,
  type TicketListItem,
  type TicketPriority,
  type TicketStatus,
} from "@/lib/tickets";
import { canOpenTicket } from "@/lib/rbac";
import { formatDateTime, formatLocation } from "@/lib/format";
import { Avatar } from "@/components/Avatar";
import { PriorityBadge, SlaBadge, StatusBadge } from "@/components/StatusBadge";

const STATUS_OPTIONS: { value: TicketStatus | ""; label: string }[] = [
  { value: "", label: "Todos os status" },
  { value: "OPEN", label: "Aberto" },
  { value: "IN_PROGRESS", label: "Em andamento" },
  { value: "RESOLVED", label: "Resolvido" },
  { value: "CLOSED", label: "Fechado" },
  { value: "CANCELED", label: "Cancelado" },
];

const PRIORITY_OPTIONS: { value: TicketPriority | ""; label: string }[] = [
  { value: "", label: "Todas as prioridades" },
  { value: "LOW", label: "Baixa" },
  { value: "MEDIUM", label: "Média" },
  { value: "HIGH", label: "Alta" },
  { value: "CRITICAL", label: "Crítica" },
];

const COLS = 8;

export default function DashboardPage() {
  const router = useRouter();
  const { user, authorized } = useRequireAuth();

  const [tickets, setTickets] = useState<TicketListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [filters, setFilters] = useState<ListTicketsFilters>({
    status: "",
    priority: "",
    slaBreached: false,
    page: 1,
    pageSize: 20,
  });

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    setError(null);
    setForbidden(false);
    try {
      const res = await listTickets(filters);
      setTickets(res.data);
    } catch (err) {
      if (isForbidden(err)) {
        setForbidden(true);
      } else {
        setError(messageFromError(err));
      }
      setTickets([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    if (user) void fetchTickets();
  }, [user, fetchTickets]);

  if (!authorized || !user) {
    return <div className="text-sm text-slate-500">Verificando sessão…</div>;
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
        {canOpenTicket(user.role) && (
          <Link
            href="/tickets/new"
            className="inline-flex items-center rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500"
          >
            + Novo chamado
          </Link>
        )}
      </div>

      <div className="flex flex-wrap items-end gap-3 rounded-md border border-slate-200 bg-white p-3">
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

        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={filters.slaBreached ?? false}
            onChange={(e) =>
              setFilters((f) => ({ ...f, slaBreached: e.target.checked, page: 1 }))
            }
            className="h-4 w-4 rounded border-slate-300"
          />
          Só SLA estourado
        </label>

        <button
          type="button"
          onClick={() => void fetchTickets()}
          className="ml-auto rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100"
        >
          Atualizar
        </button>
      </div>

      {forbidden ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-6 text-center text-sm text-amber-800">
          Seu perfil não tem acesso ao backlog completo. Os chamados que você abrir
          aparecerão aqui.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-md border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-3 py-2">Título</th>
                <th className="px-3 py-2">Local</th>
                <th className="px-3 py-2">Categoria</th>
                <th className="px-3 py-2">Prioridade</th>
                <th className="px-3 py-2">SLA</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Responsável</th>
                <th className="px-3 py-2 whitespace-nowrap">Aberto em</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading &&
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={`skeleton-${i}`} className="animate-pulse">
                    {Array.from({ length: COLS }).map((__, j) => (
                      <td key={j} className="px-3 py-3">
                        <div className="h-3 w-24 rounded bg-slate-200" />
                      </td>
                    ))}
                  </tr>
                ))}

              {!loading && error && (
                <tr>
                  <td colSpan={COLS} className="px-3 py-6 text-center text-red-700">
                    {error}
                  </td>
                </tr>
              )}

              {!loading && !error && tickets.length === 0 && (
                <tr>
                  <td colSpan={COLS} className="px-3 py-12 text-center">
                    <div className="mx-auto flex max-w-sm flex-col items-center gap-2">
                      <p className="text-sm font-medium text-slate-700">
                        Nenhum chamado encontrado
                      </p>
                      <p className="text-xs text-slate-500">
                        Ajuste os filtros ou abra um novo chamado para começar.
                      </p>
                      {canOpenTicket(user.role) && (
                        <Link
                          href="/tickets/new"
                          className="mt-2 inline-flex items-center rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800"
                        >
                          + Novo chamado
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              )}

              {!loading &&
                !error &&
                tickets.map((t) => (
                  <tr
                    key={t.id}
                    onClick={() => router.push(`/tickets/${t.id}`)}
                    className="cursor-pointer hover:bg-slate-50"
                  >
                    <td className="px-3 py-2 font-medium text-slate-900">
                      <Link
                        href={`/tickets/${t.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="hover:underline"
                      >
                        {t.title}
                      </Link>
                    </td>
                    <td className="px-3 py-2 text-slate-700">
                      {formatLocation(t.location)}
                    </td>
                    <td className="px-3 py-2 text-slate-700">{t.category.name}</td>
                    <td className="px-3 py-2">
                      <PriorityBadge priority={t.priority} />
                    </td>
                    <td className="px-3 py-2">
                      <SlaBadge ticket={t} />
                    </td>
                    <td className="px-3 py-2">
                      <StatusBadge status={t.status} />
                    </td>
                    <td className="px-3 py-2 text-slate-700">
                      {t.assignee ? (
                        <span className="inline-flex items-center gap-1.5">
                          <Avatar name={t.assignee.name} size="sm" />
                          <span className="hidden sm:inline">{t.assignee.name}</span>
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-slate-500">
                      {formatDateTime(t.createdAt)}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
