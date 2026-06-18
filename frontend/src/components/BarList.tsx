export type BarItem = {
  label: string;
  value: number;
  /** classe de cor da barra (ex.: "bg-blue-500"). Padrão: slate. */
  colorClass?: string;
};

/**
 * Gráfico de barras horizontais simples (sem dependências). As barras são
 * proporcionais ao maior valor da lista.
 */
export function BarList({
  items,
  emptyLabel = "Sem dados.",
}: {
  items: BarItem[];
  emptyLabel?: string;
}) {
  if (items.length === 0) {
    return <p className="text-sm text-slate-500">{emptyLabel}</p>;
  }
  const max = Math.max(...items.map((i) => i.value), 1);

  return (
    <ul className="space-y-2.5">
      {items.map((item) => {
        const pct = Math.round((item.value / max) * 100);
        return (
          <li key={item.label}>
            <div className="mb-1 flex items-baseline justify-between gap-2 text-sm">
              <span className="truncate text-slate-700">{item.label}</span>
              <span className="tabular-nums font-medium text-slate-900">
                {item.value}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full ${item.colorClass ?? "bg-slate-500"}`}
                style={{ width: `${Math.max(pct, item.value > 0 ? 4 : 0)}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
