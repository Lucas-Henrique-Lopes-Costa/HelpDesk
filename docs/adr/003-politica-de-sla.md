# ADR-003: Política de SLA dos chamados

- **Status:** Aceito
- **Data:** 2026-06-17
- **Decisores:** Lucas, Pedro, Thiago, Gustavo
- **Contexto de decisão:** Sprint 2/3 — introdução do controle de SLA (US-06).

## Contexto

O produto promete "controle rigoroso de SLA" e um backlog "priorizado por SLA". Precisamos definir **como** o prazo de cada chamado é calculado, **quando** ele é considerado estourado e **quem** monitora isso, sem acoplar a regra a um cron externo frágil.

Cada `Category` já carrega `slaHours` (ex.: Limpeza = 4h, Manutenção = 24h, Insumos = 48h). Falta transformar isso em um prazo concreto por chamado e em um sinal de estouro.

## Opções consideradas

| Opção | Prós | Contras |
|---|---|---|
| **`dueAt` calculado na abertura + monitor BullMQ — escolhida** | Prazo imutável e auditável; estouro detectado de forma assíncrona e resiliente (Redis já está na stack) | Exige um worker rodando; precisa de Redis no ambiente |
| Calcular SLA "estourado" só na leitura (sob demanda) | Zero infraestrutura extra | Não dispara notificação; recalcula a cada request; difícil ordenar/relatar |
| Cron do sistema operacional | Simples | Fora do app, não versionado, não escala em múltiplas instâncias |

## Decisão

1. **Prazo (`dueAt`)** é gravado **na criação** do chamado: `dueAt = createdAt + category.slaHours`. É imutável (não muda se a categoria mudar depois) — o prazo combinado na abertura é o que vale.
2. **Estouro (`slaBreached`)** é verdadeiro quando `now > dueAt` e o chamado ainda **não** está em estado terminal (`RESOLVED`, `CLOSED`, `CANCELED`). Após resolver, comparamos `resolvedAt` com `dueAt` para registrar se foi cumprido.
3. **Monitor assíncrono:** um worker **BullMQ + Redis** roda em intervalo fixo, varre chamados abertos vencidos, marca o estouro e (futuro) enfileira notificação ao gestor. A fila desacopla a detecção do request do usuário.
4. **Priorização:** o backlog do operador ordena por urgência de SLA (vencidos primeiro, depois os mais próximos do `dueAt`), não apenas por `priority`.

> Implementação detalhada (model, worker e endpoints) é responsabilidade do épico de domínio (Pedro, issue #30). Este ADR fixa a **regra**.

## Consequências

- **Positivas:** prazo previsível e auditável; estouro detectado mesmo sem ninguém abrir a tela; ordenação de fila objetiva; reaproveita o Redis que já está no `docker-compose`.
- **Negativas:** introduz dependência de um worker ativo — se ele cair, o estouro deixa de ser marcado em tempo real (mitigado por fallback de cálculo na leitura).
- **Follow-ups:** escalonamento (reatribuir/realertar após X% do SLA) e SLA por prioridade (multiplicador) ficam para evolução pós-entrega.
