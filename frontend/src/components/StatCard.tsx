type Tone = "default" | "info" | "danger" | "success";

const TONE_STYLES: Record<Tone, { value: string; accent: string }> = {
  default: { value: "text-slate-900", accent: "bg-slate-400" },
  info: { value: "text-blue-700", accent: "bg-blue-500" },
  danger: { value: "text-red-700", accent: "bg-red-500" },
  success: { value: "text-emerald-700", accent: "bg-emerald-500" },
};

export function StatCard({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: number | string;
  hint?: string;
  tone?: Tone;
}) {
  const styles = TONE_STYLES[tone];
  return (
    <div className="relative overflow-hidden rounded-md border border-slate-200 bg-white p-4 shadow-sm">
      <span className={`absolute inset-y-0 left-0 w-1 ${styles.accent}`} aria-hidden />
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className={`mt-1 text-3xl font-semibold tabular-nums ${styles.value}`}>
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}
