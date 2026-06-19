"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useRequireAuth } from "@/lib/use-require-auth";
import { getTicket, type TicketListItem, type UserMini } from "@/lib/tickets";
import { addComment, listComments, type Comment } from "@/lib/comments";
import { listAttachments, type Attachment } from "@/lib/attachments";
import { listOperators } from "@/lib/users";
import { messageFromError } from "@/lib/api";
import { canAssignOthers, canComment, canDeleteTicket } from "@/lib/rbac";
import { formatDateTime, formatLocation } from "@/lib/format";
import { PriorityBadge, SlaBadge, StatusBadge } from "@/components/StatusBadge";
import { Avatar } from "@/components/Avatar";
import { EvidenceGallery } from "@/components/EvidenceGallery";
import { CommentTimeline } from "@/components/CommentTimeline";
import { TicketActions } from "@/components/TicketActions";
import { DeleteTicketButton } from "@/components/DeleteTicketButton";
import { CenteredMessage, ErrorBanner } from "@/components/Feedback";

function MetaRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 py-2 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="text-right font-medium text-slate-800">{children}</span>
    </div>
  );
}

export default function TicketDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { user, authorized } = useRequireAuth();

  const [ticket, setTicket] = useState<TicketListItem | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [operators, setOperators] = useState<UserMini[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const t = await getTicket(id);
      // Comentários/evidências são complementares: se o endpoint ainda não
      // existir no backend, a página do chamado continua utilizável.
      const [cs, as] = await Promise.all([
        listComments(id).catch(() => []),
        listAttachments(id).catch(() => []),
      ]);
      setTicket(t);
      setComments(cs);
      setAttachments(as);
    } catch (err) {
      setError(messageFromError(err));
      setTicket(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (user) void load();
  }, [user, load]);

  // Carrega operadores apenas para quem pode atribuir.
  useEffect(() => {
    if (user && canAssignOthers(user.role)) {
      listOperators()
        .then(setOperators)
        .catch(() => setOperators([]));
    }
  }, [user]);

  const handleAddComment = async (body: string) => {
    const created = await addComment(id, body);
    setComments((prev) => [...prev, created]);
  };

  if (!authorized || !user) {
    return <CenteredMessage>Verificando sessão…</CenteredMessage>;
  }

  return (
    <div className="space-y-5">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
      >
        ← Voltar para chamados
      </Link>

      {loading && <CenteredMessage>Carregando chamado…</CenteredMessage>}

      {!loading && error && <ErrorBanner message={error} onRetry={() => void load()} />}

      {!loading && !error && ticket && (
        <>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-xl font-semibold text-slate-900">{ticket.title}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <StatusBadge status={ticket.status} />
                <PriorityBadge priority={ticket.priority} />
                <SlaBadge ticket={ticket} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            {/* Coluna principal */}
            <div className="space-y-5 lg:col-span-2">
              <section className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
                <h2 className="mb-2 text-sm font-semibold text-slate-800">Descrição</h2>
                <p className="whitespace-pre-wrap text-sm text-slate-700">
                  {ticket.description?.trim() || "Sem descrição."}
                </p>
              </section>

              <section className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
                <h2 className="mb-3 text-sm font-semibold text-slate-800">
                  Evidências (antes / depois)
                </h2>
                <EvidenceGallery attachments={attachments} />
              </section>

              <section className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
                <h2 className="mb-3 text-sm font-semibold text-slate-800">
                  Comentários
                </h2>
                <CommentTimeline
                  comments={comments}
                  canComment={canComment()}
                  onSubmit={handleAddComment}
                />
              </section>
            </div>

            {/* Coluna lateral */}
            <div className="space-y-5">
              <TicketActions
                ticket={ticket}
                currentUser={user}
                operators={operators}
                hasAfterEvidence={attachments.some((a) => a.kind === "AFTER")}
                onChanged={load}
              />

              <section className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
                <h2 className="mb-1 text-sm font-semibold text-slate-800">Detalhes</h2>
                <div className="divide-y divide-slate-100">
                  <MetaRow label="Local">{formatLocation(ticket.location)}</MetaRow>
                  <MetaRow label="Categoria">
                    {ticket.category.name}
                    {ticket.category.slaHours ? (
                      <span className="ml-1 text-xs font-normal text-slate-400">
                        (SLA {ticket.category.slaHours}h)
                      </span>
                    ) : null}
                  </MetaRow>
                  <MetaRow label="Responsável">
                    {ticket.assignee ? (
                      <span className="inline-flex items-center gap-1.5">
                        <Avatar name={ticket.assignee.name} size="sm" />
                        {ticket.assignee.name}
                      </span>
                    ) : (
                      <span className="font-normal text-slate-500">Não atribuído</span>
                    )}
                  </MetaRow>
                  <MetaRow label="Solicitante">{ticket.reporter.name}</MetaRow>
                  <MetaRow label="Aberto em">
                    {formatDateTime(ticket.createdAt)}
                  </MetaRow>
                  <MetaRow label="Prazo (SLA)">
                    {ticket.dueAt ? formatDateTime(ticket.dueAt) : "—"}
                  </MetaRow>
                  {ticket.resolvedAt && (
                    <MetaRow label="Resolvido em">
                      {formatDateTime(ticket.resolvedAt)}
                    </MetaRow>
                  )}
                  {ticket.closedAt && (
                    <MetaRow label="Fechado em">
                      {formatDateTime(ticket.closedAt)}
                    </MetaRow>
                  )}
                </div>
              </section>

              {canDeleteTicket(user.role) && (
                <DeleteTicketButton ticketId={ticket.id} ticketTitle={ticket.title} />
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
