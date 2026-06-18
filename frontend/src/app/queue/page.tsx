"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRequireAuth } from "@/lib/use-require-auth";
import { listTickets, type TicketListItem } from "@/lib/tickets";
import { messageFromError } from "@/lib/api";
import { QUEUE_ROLES } from "@/lib/rbac";
import { compareByUrgency } from "@/lib/sla";
import { formatLocation } from "@/lib/format";
import { PriorityBadge, SlaBadge, StatusBadge } from "@/components/StatusBadge";
import { Avatar } from "@/components/Avatar";
import { CenteredMessage, EmptyState, ErrorBanner } from "@/components/Feedback";

const ACTIVE_STATUSES = new Set<TicketListItem["status"]>(["OPEN", "IN_PROGRESS"]);

export default function QueuePage() {
  const { user, authorized } = useRequireAuth(QUEUE_ROLES);

  const [tickets, setTickets] = useState<TicketListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [onlyMine, setOnlyMine] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listTickets({ pageSize: 100 });
      setTickets(res.data);
    } catch (err) {
      setError(messageFromError(err));
      setTickets([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) void load();
  }, [user, load]);

  const queue = useMemo(() => {
    let list = tickets.filter((t) => ACTIVE_STATUSES.has(t.status));
    if (onlyMine && user) list = list.filter((t) => t.assignee?.id === user.id);
    return [...list].sort(compareByUrgency);
  }, [tickets, onlyMine, user]);

  if (!authorized || !user) {
    return <CenteredMessage>Verificando sessão…</CenteredMessage>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Fila de atendimento</h1>
          <p className="text-sm text-slate-500">
            Chamados ativos ordenados por urgência de SLA.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setOnlyMine((v) => !v)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium ${
              onlyMine
                ? "bg-slate-900 text-white"
                : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
            }`}
          >
            {onlyMine ? "Meus chamados" : "Todos"}
          </button>
          <button
            type="button"
            onClick={() => void load()}
            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100"
          >
            Atualizar
          </button>
        </div>
      </div>

      {loading && <CenteredMessage>Carregando fila…</CenteredMessage>}

      {!loading && error && <ErrorBanner message={error} onRetry={() => void load()} />}

      {!loading && !error && queue.length === 0 && (
        <EmptyState
          title="Fila vazia"
          description={
            onlyMine
              ? "Você não tem chamados ativos atribuídos."
              : "Nenhum chamado ativo no momento. Bom trabalho! 🎉"
          }
        />
      )}

      {!loading && !error && queue.length > 0 && (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {queue.map((t) => (
            <li key={t.id}>
              <Link
                href={`/tickets/${t.id}`}
                className="block h-full rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 hover:shadow"
              >
                <div className="flex items-center justify-between gap-2">
                  <PriorityBadge priority={t.priority} />
                  <SlaBadge ticket={t} />
                </div>
                <h2 className="mt-2 line-clamp-2 text-sm font-semibold text-slate-900">
                  {t.title}
                </h2>
                <p className="mt-1 text-xs text-slate-500">{formatLocation(t.location)}</p>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <StatusBadge status={t.status} />
                  {t.assignee ? (
                    <span className="inline-flex items-center gap-1.5 text-xs text-slate-600">
                      <Avatar name={t.assignee.name} size="sm" />
                      <span className="hidden sm:inline">{t.assignee.name}</span>
                    </span>
                  ) : (
                    <span className="text-xs font-medium text-amber-600">
                      Não atribuído
                    </span>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
