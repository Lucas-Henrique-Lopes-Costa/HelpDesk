import { TicketStatus } from "@prisma/client";

// Define as transições válidas de status para cada estado atual
export const VALID_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  [TicketStatus.OPEN]: [TicketStatus.IN_PROGRESS, TicketStatus.CANCELED],
  [TicketStatus.IN_PROGRESS]: [TicketStatus.RESOLVED, TicketStatus.CANCELED],
  [TicketStatus.RESOLVED]: [TicketStatus.CLOSED],
  [TicketStatus.CLOSED]: [], // Terminal state
  [TicketStatus.CANCELED]: [], // Terminal state
};

/**
 * Verifica se uma transição de status é válida
 * @param currentStatus Status atual do ticket
 * @param newStatus Novo status desejado
 * @returns true se a transição é válida, false caso contrário
 */
export function isValidTransition(currentStatus: TicketStatus, newStatus: TicketStatus): boolean {
  if (currentStatus === newStatus) return false; // Não é transição se for o mesmo status
  return VALID_TRANSITIONS[currentStatus].includes(newStatus);
}

/**
 * Retorna os status válidos para uma transição a partir de um status atual
 * @param currentStatus Status atual do ticket
 * @returns Array de status válidos para transição
 */
export function getValidNextStatuses(currentStatus: TicketStatus): TicketStatus[] {
  return VALID_TRANSITIONS[currentStatus];
}
