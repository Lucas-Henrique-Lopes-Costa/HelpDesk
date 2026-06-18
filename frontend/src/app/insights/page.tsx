"use client";

import { useCallback, useEffect, useState } from "react";
import { useRequireAuth } from "@/lib/use-require-auth";
import { getStats, type TicketStats } from "@/lib/stats";
import { messageFromError } from "@/lib/api";
import { INSIGHTS_ROLES } from "@/lib/rbac";
import type { TicketStatus } from "@/lib/tickets";
import { StatCard } from "@/components/StatCard";
import { BarList, type BarItem } from "@/components/BarList";
import { CenteredMessage, ErrorBanner } from "@/components/Feedback";

const STATUS_META: Record<TicketStatus, { label: string; color: string }> = {
  OPEN: { label: "Aberto", color: "bg-amber-500" },
  IN_PROGRESS: { label: "Em andamento", color: "bg-blue-500" },
  RESOLVED: { label: "Resolvido", color: "bg-emerald-500" },
  CLOSED: { label: "Fechado", color: "bg-slate-500" },
  CANCELED: { label: "Cancelado", color: "bg-rose-400" },
};

const STATUS_ORDER: TicketStatus[] = [
  "OPEN",
  "IN_PROGRESS",
  "RESOLVED",
  "CLOSED",
  "CANCELED",
];

export default function InsightsPage() {
  const { user, authorized } = useRequireAuth(INSIGHTS_ROLES);

  const [stats, setStats] = useState<TicketStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setStats(await getStats());
    } catch (err) {
      setError(messageFromError(err));
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) void load();
  }, [user, load]);

  if (!authorized || !user) {
    return <CenteredMessage>Verificando sessão…</CenteredMessage>;
  }

  const total = stats
    ? STATUS_ORDER.reduce((sum, s) => sum + stats.byStatus[s], 0)
    : 0;

  const statusItems: BarItem[] = stats
    ? STATUS_ORDER.map((s) => ({
        label: STATUS_META[s].label,
        value: stats.byStatus[s],
        colorClass: STATUS_META[s].color,
      }))
    : [];

  const assigneeItems: BarItem[] = stats
    ? [...stats.byAssignee]
        .sort((a, b) => b.count - a.count)
        .map((a) => ({ label: a.assigneeName, value: a.count, colorClass: "bg-blue-500" }))
    : [];

  const categoryItems: BarItem[] = stats
    ? [...stats.byCategory]
        .sort((a, b) => b.count - a.count)
        .map((c) => ({ label: c.categoryName, value: c.count, colorClass: "bg-violet-500" }))
    : [];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Indicadores</h1>
          <p className="text-sm text-slate-500">
            Visão executiva da operação de chamados.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100"
        >
          Atualizar
        </button>
      </div>

      {loading && <CenteredMessage>Carregando indicadores…</CenteredMessage>}

      {!loading && error && <ErrorBanner message={error} onRetry={() => void load()} />}

      {!loading && !error && stats && (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard label="Abertos" value={stats.byStatus.OPEN} tone="info" />
            <StatCard
              label="Em andamento"
              value={stats.byStatus.IN_PROGRESS}
              tone="info"
            />
            <StatCard
              label="SLA estourado"
              value={stats.slaBreached}
              tone="danger"
              hint="Chamados ativos fora do prazo"
            />
            <StatCard
              label="Resolvidos"
              value={stats.byStatus.RESOLVED}
              tone="success"
            />
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            <section className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="mb-3 text-sm font-semibold text-slate-800">
                Chamados por status
              </h2>
              <BarList items={statusItems} />
              <p className="mt-3 text-xs text-slate-400">{total} chamados no total.</p>
            </section>

            <section className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="mb-3 text-sm font-semibold text-slate-800">
                Carga por responsável
              </h2>
              <BarList items={assigneeItems} emptyLabel="Nenhuma atribuição ainda." />
            </section>

            <section className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="mb-3 text-sm font-semibold text-slate-800">
                Chamados por categoria
              </h2>
              <BarList items={categoryItems} />
            </section>
          </div>
        </>
      )}
    </div>
  );
}
