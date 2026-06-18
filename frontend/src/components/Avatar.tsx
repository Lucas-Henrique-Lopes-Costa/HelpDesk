import { initials } from "@/lib/format";

const PALETTE = [
  "bg-slate-600",
  "bg-blue-600",
  "bg-emerald-600",
  "bg-amber-600",
  "bg-rose-600",
  "bg-violet-600",
  "bg-cyan-600",
];

function colorFor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

const SIZES = {
  sm: "h-6 w-6 text-[10px]",
  md: "h-8 w-8 text-xs",
  lg: "h-10 w-10 text-sm",
};

export function Avatar({
  name,
  size = "md",
  title,
}: {
  name: string;
  size?: keyof typeof SIZES;
  title?: string;
}) {
  return (
    <span
      title={title ?? name}
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white ${colorFor(name)} ${SIZES[size]}`}
      aria-hidden
    >
      {initials(name)}
    </span>
  );
}
