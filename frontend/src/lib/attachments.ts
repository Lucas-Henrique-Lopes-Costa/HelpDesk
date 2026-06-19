import { api } from "./api";
import { useMock, type UserMini } from "./tickets";
import * as mock from "./mock-db";

export type AttachmentKind = "BEFORE" | "AFTER";

export type Attachment = {
  id: string;
  ticketId: string;
  kind: AttachmentKind;
  url: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
  uploadedBy?: UserMini | null;
};

export const ACCEPTED_MIME = ["image/jpeg", "image/png"] as const;
export const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB

/** Valida tipo e tamanho. Retorna mensagem de erro ou null se válido. */
export function validateImage(file: File): string | null {
  if (!ACCEPTED_MIME.includes(file.type as (typeof ACCEPTED_MIME)[number])) {
    return "Formato inválido. Envie uma imagem JPEG ou PNG.";
  }
  if (file.size > MAX_FILE_BYTES) {
    return "Arquivo muito grande. O limite é 5 MB.";
  }
  return null;
}

function normalizeList(res: unknown): Attachment[] {
  if (Array.isArray(res)) return res as Attachment[];
  if (res && Array.isArray((res as { data?: unknown }).data)) {
    return (res as { data: Attachment[] }).data;
  }
  return [];
}

export async function listAttachments(ticketId: string): Promise<Attachment[]> {
  if (useMock) return mock.listAttachments(ticketId);
  return normalizeList(await api<unknown>(`/tickets/${ticketId}/attachments`));
}

export async function uploadAttachment(
  ticketId: string,
  file: File,
  kind: AttachmentKind,
): Promise<Attachment> {
  if (useMock) return mock.uploadAttachment(ticketId, file, kind);

  // O backend persiste a URL/conteúdo da evidência (ainda sem upload binário),
  // então enviamos a imagem como data URL no corpo JSON do POST /attachments.
  const url = await fileToDataUrl(file);
  return api<Attachment>(`/tickets/${ticketId}/attachments`, {
    method: "POST",
    body: JSON.stringify({
      url,
      mimeType: file.type,
      sizeBytes: file.size,
      kind,
    }),
  });
}

/** Lê o arquivo como data URL (base64) para enviar embutido no JSON. */
function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Falha ao ler o arquivo."));
    reader.readAsDataURL(file);
  });
}
