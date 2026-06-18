import { api } from "./api";
import { useMock, type UserMini } from "./tickets";
import * as mock from "./mock-db";

export type Comment = {
  id: string;
  ticketId: string;
  body: string;
  createdAt: string;
  author: UserMini;
};

/** Aceita tanto um array puro quanto `{ data: [...] }` do backend. */
function normalizeList(res: unknown): Comment[] {
  if (Array.isArray(res)) return res as Comment[];
  if (res && Array.isArray((res as { data?: unknown }).data)) {
    return (res as { data: Comment[] }).data;
  }
  return [];
}

export async function listComments(ticketId: string): Promise<Comment[]> {
  if (useMock) return mock.listComments(ticketId);
  return normalizeList(await api<unknown>(`/tickets/${ticketId}/comments`));
}

export async function addComment(
  ticketId: string,
  body: string,
): Promise<Comment> {
  if (useMock) return mock.addComment(ticketId, body);
  return api<Comment>(`/tickets/${ticketId}/comments`, {
    method: "POST",
    body: JSON.stringify({ body }),
  });
}
