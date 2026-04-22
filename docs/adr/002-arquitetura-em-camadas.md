# ADR-002: Arquitetura em camadas do backend

- **Status:** Aceito
- **Data:** 2026-04-20
- **Decisores:** Lucas, Pedro, Thiago, Gustavo
- **Contexto de decisão:** Sprint 1 — definição da organização interna do backend.

## Contexto

O backend precisa crescer ao longo de 3 sprints sem virar uma bola de lama. Temos 4 devs commitando em paralelo (auth, domínio de chamados, RBAC, CI) e queremos merges de baixo atrito.

## Opções consideradas

| Opção | Prós | Contras |
|---|---|---|
| **Camadas (Routes → Controller → Service → Prisma) — escolhida** | Simples, conhecida pelo time; limites explícitos; serviços testáveis com `PrismaClient` dublê | Pode degradar em "services gordos" se não dividirmos por contexto |
| Clean Architecture completa | Fronteiras rigorosas; troca de infra barata | Overhead alto para escopo de 3 sprints; risco de atrasar o Sprint 1 |
| Monolito modular (feature-first) | Boa para múltiplos domínios | Precisa de convenções já no Sprint 1; discussão ainda em aberto |

## Decisão

Organizamos o código do backend em 4 camadas, com dependência apenas para **baixo**:

```
src/
  routes/          # Define endpoints, aplica validateBody e middlewares
  controllers/     # Traduz HTTP ↔ Service. Não conhece Prisma.
  services/        # Regras de negócio. Recebe PrismaClient por injeção → testável.
  middleware/      # authenticate, authorize(roles), validate, errorHandler
  config/          # env, prisma, jwt (singletons de infra)
  utils/           # errors (AppError, ConflictError, UnauthorizedError, ...)
```

**Regras:**

1. Controllers nunca chamam `prisma` diretamente — só chamam um Service.
2. Services recebem `PrismaClient` via factory (`createAuthService(prisma)`), o que permite testes com Map in-memory no lugar do banco.
3. Erros de domínio usam `AppError` e subclasses; o `errorHandler` centralizado traduz para JSON.
4. Validação de input é responsabilidade do middleware `validateBody(zodSchema)`; o service assume payload já limpo.

## Consequências

- **Positivas:** cada feature vira um trio (`service.ts` + `controller.ts` + `routes.ts`), facilitando divisão entre os 4 devs. Testes unitários do service não precisam de Docker rodando.
- **Negativas:** a camada de controller é fina e parece boilerplate — aceitamos esse custo em troca da clareza de limites.
- **Follow-ups:** no Sprint 2, se um domínio crescer demais (ex: Tickets), extraímos um submódulo `features/tickets/` mantendo as mesmas 4 camadas localmente.
