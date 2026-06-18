"use client";

import { useState } from "react";
import type { TicketListItem, TicketStatus, UserMini } from "@/lib/tickets";
import { assignTicket, updateTicketStatus } from "@/lib/tickets";
import { uploadAttachment } from "@/lib/attachments";
import { messageFromError } from "@/lib/api";
import {
  canAssignOthers,
  canChangeStatus,
  canSelfAssign,
  nextStatuses,
  TRANSITION_LABELS,
  type UserRole,
} from "@/lib/rbac";
import { Avatar } from "@/components/Avatar";
import { PhotoUpload } from "@/components/PhotoUpload";

type Props = {
  ticket: TicketListItem;
  currentUser: { id: string; name: string; email: string; role: UserRole };
  operators: UserMini[];
  /** Já existe evidência "depois"? (regra: exigida para resolver) */
  hasAfterEvidence: boolean;
  onChanged: () => void | Promise<void>;
};

const DESTRUCTIVE: TicketStatus[] = ["CANCELED"];

export function TicketActions({
  ticket,
  currentUser,
  operators,
  hasAfterEvidence,
  onChanged,
}: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedOperator, setSelectedOperator] = useState("");
  const [pendingResolve, setPendingResolve] = useState(false);
  const [afterFile, setAfterFile] = useState<File | null>(null);

  const role = currentUser.role;
  const transitions = nextStatuses(ticket.status);
  const showStatus = canChangeStatus(role) && transitions.length > 0;
  const showAssignBlock = canAssignOthers(role) || canSelfAssign(role);
  const isMine = ticket.assignee?.id === currentUser.id;

  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
      await onChanged();
    } catch (err) {
      setError(messageFromError(err));
    } finally {
      setBusy(false);
    }
  };

  const handleTransition = (status: TicketStatus) => {
    // Resolver exige evidência "depois" (épico #30, US-04).
    if (status === "RESOLVED" && !hasAfterEvidence) {
      setPendingResolve(true);
      setError(null);
      return;
    }
    void run(() => updateTicketStatus(ticket.id, status));
  };

  const confirmResolve = () =>
    run(async () => {
      if (afterFile) await uploadAttachment(ticket.id, afterFile, "AFTER");
      await updateTicketStatus(ticket.id, "RESOLVED");
      setPendingResolve(false);
      setAfterFile(null);
    });

  if (!showStatus && !showAssignBlock) return null;

  return (
    <div className="space-y-4 rounded-md border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-800">Ações</h2>

      {/* Atribuição */}
      {showAssignBlock && (
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Responsável
          </p>
          <div className="flex items-center gap-2 text-sm">
            {ticket.assignee ? (
              <>
                <Avatar name={ticket.assignee.name} size="sm" />
                <span className="text-slate-700">{ticket.assignee.name}</span>
              </>
            ) : (
              <span className="text-slate-500">Não atribuído</span>
            )}
          </div>

          {canSelfAssign(role) && !isMine && (
            <button
              type="button"
              disabled={busy}
              onClick={() =>
                run(() =>
                  assignTicket(ticket.id, {
                    id: currentUser.id,
                    name: currentUser.name,
                    email: currentUser.email,
                  }),
                )
              }
              className="w-full rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-60"
            >
              Assumir chamado
            </button>
          )}

          {canAssignOthers(role) && (
            <div className="flex flex-wrap gap-2">
              <select
                value={selectedOperator}
                onChange={(e) => setSelectedOperator(e.target.value)}
                disabled={busy || operators.length === 0}
                className="min-w-0 flex-1 rounded-md border border-slate-300 px-2 py-1.5 text-sm text-slate-900 disabled:bg-slate-50"
              >
                <option value="">
                  {operators.length === 0
                    ? "Nenhum operador disponível"
                    : "Selecione um operador…"}
                </option>
                {operators.map((op) => (
                  <option key={op.id} value={op.id}>
                    {op.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                disabled={busy || !selectedOperator}
                onClick={() => {
                  const op = operators.find((o) => o.id === selectedOperator);
                  if (op) void run(() => assignTicket(ticket.id, op));
                }}
                className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-60"
              >
                Atribuir
              </button>
              {ticket.assignee && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => run(() => assignTicket(ticket.id, null))}
                  className="rounded-md px-3 py-1.5 text-sm text-slate-500 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-60"
                >
                  Remover
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Mudança de status */}
      {showStatus && (
        <div className="space-y-2 border-t border-slate-100 pt-3">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Status
          </p>
          {!pendingResolve ? (
            <div className="flex flex-wrap gap-2">
              {transitions.map((status) => (
                <button
                  key={status}
                  type="button"
                  disabled={busy}
                  onClick={() => handleTransition(status)}
                  className={`rounded-md px-3 py-2 text-sm font-medium disabled:opacity-60 ${
                    DESTRUCTIVE.includes(status)
                      ? "border border-rose-300 bg-white text-rose-700 hover:bg-rose-50"
                      : "bg-slate-900 text-white hover:bg-slate-800"
                  }`}
                >
                  {TRANSITION_LABELS[status]}
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-2 rounded-md border border-amber-200 bg-amber-50 p-3">
              <p className="text-xs text-amber-800">
                Para resolver, anexe a foto <strong>depois</strong> comprovando a
                conclusão.
              </p>
              <PhotoUpload
                label="Foto depois (obrigatória)"
                value={afterFile}
                onChange={setAfterFile}
                uploading={busy}
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    setPendingResolve(false);
                    setAfterFile(null);
                  }}
                  className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={busy || !afterFile}
                  onClick={() => void confirmResolve()}
                  className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-60"
                >
                  {busy ? "Resolvendo…" : "Confirmar resolução"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {error && (
        <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
