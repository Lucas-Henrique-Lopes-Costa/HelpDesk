"use client";

import { useState, type FormEvent } from "react";
import type { Comment } from "@/lib/comments";
import { Avatar } from "@/components/Avatar";
import { formatDateTime } from "@/lib/format";

type Props = {
  comments: Comment[];
  canComment: boolean;
  onSubmit: (body: string) => Promise<void>;
};

export function CommentTimeline({ comments, canComment, onSubmit }: Props) {
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const text = body.trim();
    if (!text) return;
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(text);
      setBody("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao enviar comentário.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {comments.length === 0 ? (
        <p className="text-sm text-slate-500">
          Nenhum comentário ainda. Seja o primeiro a registrar uma atualização.
        </p>
      ) : (
        <ul className="space-y-4">
          {comments.map((c) => (
            <li key={c.id} className="flex gap-3">
              <Avatar name={c.author.name} size="md" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <span className="text-sm font-medium text-slate-800">
                    {c.author.name}
                  </span>
                  <span className="text-xs text-slate-400">
                    {formatDateTime(c.createdAt)}
                  </span>
                </div>
                <p className="whitespace-pre-wrap break-words text-sm text-slate-700">
                  {c.body}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}

      {canComment && (
        <form onSubmit={handleSubmit} className="space-y-2 border-t border-slate-100 pt-4">
          <label htmlFor="comment-body" className="sr-only">
            Novo comentário
          </label>
          <textarea
            id="comment-body"
            rows={3}
            value={body}
            maxLength={1000}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Escreva uma atualização…"
            className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
          />
          {error && (
            <p role="alert" className="text-xs text-red-600">
              {error}
            </p>
          )}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting || body.trim().length === 0}
              className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Enviando…" : "Comentar"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
