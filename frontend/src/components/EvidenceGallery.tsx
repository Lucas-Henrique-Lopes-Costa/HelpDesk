"use client";

import { useState } from "react";
import type { Attachment, AttachmentKind } from "@/lib/attachments";
import { formatDateTime } from "@/lib/format";

const KIND_LABEL: Record<AttachmentKind, string> = {
  BEFORE: "Antes",
  AFTER: "Depois",
};

function Column({
  kind,
  items,
  onOpen,
}: {
  kind: AttachmentKind;
  items: Attachment[];
  onOpen: (a: Attachment) => void;
}) {
  return (
    <div>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
        {KIND_LABEL[kind]}
      </h3>
      {items.length === 0 ? (
        <div className="flex h-24 items-center justify-center rounded-md border border-dashed border-slate-200 text-xs text-slate-400">
          Nenhuma foto {KIND_LABEL[kind].toLowerCase()}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {items.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => onOpen(a)}
              className="group relative aspect-square overflow-hidden rounded-md border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-500"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={a.url}
                alt={`Evidência ${KIND_LABEL[kind].toLowerCase()}`}
                className="h-full w-full object-cover transition group-hover:scale-105"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function EvidenceGallery({ attachments }: { attachments: Attachment[] }) {
  const [active, setActive] = useState<Attachment | null>(null);
  const before = attachments.filter((a) => a.kind === "BEFORE");
  const after = attachments.filter((a) => a.kind === "AFTER");

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Column kind="BEFORE" items={before} onOpen={setActive} />
        <Column kind="AFTER" items={after} onOpen={setActive} />
      </div>

      {active && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setActive(null)}
        >
          <div
            className="max-h-full max-w-3xl overflow-hidden rounded-lg bg-white"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={active.url}
              alt={`Evidência ${KIND_LABEL[active.kind].toLowerCase()}`}
              className="max-h-[70vh] w-full object-contain"
            />
            <div className="flex items-center justify-between gap-3 border-t border-slate-200 px-4 py-2 text-xs text-slate-500">
              <span>
                {KIND_LABEL[active.kind]}
                {active.uploadedBy ? ` · por ${active.uploadedBy.name}` : ""} ·{" "}
                {formatDateTime(active.createdAt)}
              </span>
              <button
                type="button"
                onClick={() => setActive(null)}
                className="rounded-md border border-slate-300 px-2 py-1 font-medium text-slate-700 hover:bg-slate-100"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
