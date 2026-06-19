"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteTicket } from "@/lib/tickets";
import { messageFromError } from "@/lib/api";

type Props = {
  ticketId: string;
  ticketTitle: string;
};

export function DeleteTicketButton({ ticketId, ticketTitle }: Props) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setBusy(true);
    setError(null);
    try {
      await deleteTicket(ticketId);
      router.push("/dashboard");
    } catch (err) {
      setError(messageFromError(err));
      setBusy(false);
    }
  };

  return (
    <section className="rounded-md border border-rose-200 bg-rose-50 p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-rose-800">Zona de perigo</h2>
      <p className="mt-1 text-xs text-rose-700">
        Excluir o chamado remove também comentários e evidências. Não há como desfazer.
      </p>

      {error && (
        <p role="alert" className="mt-2 rounded-md bg-white/70 px-3 py-2 text-sm text-rose-700">
          {error}
        </p>
      )}

      {!confirming ? (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="mt-3 w-full rounded-md border border-rose-300 bg-white px-3 py-2 text-sm font-medium text-rose-700 hover:bg-rose-100"
        >
          Excluir chamado
        </button>
      ) : (
        <div className="mt-3 space-y-2">
          <p className="text-xs text-rose-800">
            Confirma a exclusão de <strong>“{ticketTitle}”</strong>?
          </p>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => setConfirming(false)}
              className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100 disabled:opacity-60"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => void handleDelete()}
              className="rounded-md bg-rose-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-rose-500 disabled:opacity-60"
            >
              {busy ? "Excluindo…" : "Sim, excluir"}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
