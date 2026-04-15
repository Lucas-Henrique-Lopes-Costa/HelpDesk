import type { TicketPriority, TicketStatus } from "@/lib/tickets";

const STATUS_STYLES: Record<TicketStatus, { label: string; className: string }> =
  {
    OPEN: { label: "Aberto", className: "bg-amber-100 text-amber-800" },
    IN_PROGRESS: {
      label: "Em andamento",
      className: "bg-blue-100 text-blue-800",
    },
    RESOLVED: {
      label: "Resolvido",
      className: "bg-emerald-100 text-emerald-800",
    },
    CLOSED: { label: "Fechado", className: "bg-slate-200 text-slate-700" },
  };

const PRIORITY_STYLES: Record<
  TicketPriority,
  { label: string; className: string }
> = {
  LOW: { label: "Baixa", className: "bg-slate-100 text-slate-700" },
  MEDIUM: { label: "Média", className: "bg-sky-100 text-sky-800" },
  HIGH: { label: "Alta", className: "bg-orange-100 text-orange-800" },
  CRITICAL: { label: "Crítica", className: "bg-red-100 text-red-800" },
};

export function StatusBadge({ status }: { status: TicketStatus }) {
  const style = STATUS_STYLES[status];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${style.className}`}
    >
      {style.label}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: TicketPriority }) {
  const style = PRIORITY_STYLES[priority];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${style.className}`}
    >
      {style.label}
    </span>
  );
}
