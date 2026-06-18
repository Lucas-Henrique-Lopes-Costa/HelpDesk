import type { TicketListItem, TicketPriority, TicketStatus } from "@/lib/tickets";
import { slaInfo, type SlaUrgency } from "@/lib/sla";

type BadgeStyle = { label: string; className: string; dotClassName: string };

const STATUS_STYLES: Record<TicketStatus, BadgeStyle> = {
  OPEN: {
    label: "Aberto",
    className: "bg-amber-100 text-amber-800",
    dotClassName: "bg-amber-500",
  },
  IN_PROGRESS: {
    label: "Em andamento",
    className: "bg-blue-100 text-blue-800",
    dotClassName: "bg-blue-500",
  },
  RESOLVED: {
    label: "Resolvido",
    className: "bg-emerald-100 text-emerald-800",
    dotClassName: "bg-emerald-500",
  },
  CLOSED: {
    label: "Fechado",
    className: "bg-slate-200 text-slate-700",
    dotClassName: "bg-slate-500",
  },
  CANCELED: {
    label: "Cancelado",
    className: "bg-rose-100 text-rose-700",
    dotClassName: "bg-rose-400",
  },
};

const PRIORITY_STYLES: Record<TicketPriority, BadgeStyle> = {
  LOW: {
    label: "Baixa",
    className: "bg-slate-100 text-slate-700",
    dotClassName: "bg-slate-400",
  },
  MEDIUM: {
    label: "Média",
    className: "bg-sky-100 text-sky-800",
    dotClassName: "bg-sky-500",
  },
  HIGH: {
    label: "Alta",
    className: "bg-orange-100 text-orange-800",
    dotClassName: "bg-orange-500",
  },
  CRITICAL: {
    label: "Crítica",
    className: "bg-red-100 text-red-800",
    dotClassName: "bg-red-500",
  },
};

function Badge({ style }: { style: BadgeStyle }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${style.className}`}
    >
      <span
        aria-hidden
        className={`h-1.5 w-1.5 rounded-full ${style.dotClassName}`}
      />
      {style.label}
    </span>
  );
}

export function StatusBadge({ status }: { status: TicketStatus }) {
  return <Badge style={STATUS_STYLES[status]} />;
}

export function PriorityBadge({ priority }: { priority: TicketPriority }) {
  return <Badge style={PRIORITY_STYLES[priority]} />;
}

const SLA_CLASSNAME: Record<SlaUrgency, string> = {
  breached: "bg-red-100 text-red-800",
  soon: "bg-amber-100 text-amber-800",
  ok: "bg-emerald-50 text-emerald-700",
  none: "bg-slate-100 text-slate-600",
  done: "bg-slate-100 text-slate-500",
};

/**
 * Badge de SLA derivado de dueAt/slaBreached/status. Não renderiza nada para
 * chamados em estado terminal (SLA não se aplica).
 */
export function SlaBadge({
  ticket,
  hideWhenDone = true,
}: {
  ticket: Pick<TicketListItem, "status" | "dueAt" | "slaBreached">;
  hideWhenDone?: boolean;
}) {
  const info = slaInfo(ticket);
  if (info.urgency === "done" && hideWhenDone) return null;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${SLA_CLASSNAME[info.urgency]}`}
      title="SLA"
    >
      <span aria-hidden>⏱</span>
      {info.label}
    </span>
  );
}
