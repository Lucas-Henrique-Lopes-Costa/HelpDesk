# Diagramas

Diagrama de contexto C4 (nível 1) do HelpDesk Operacional.

```
                 ┌───────────────────────┐
                 │   Solicitante         │
                 │   (colaborador)       │
                 └──────────┬────────────┘
                            │  abre chamado com foto
                            ▼
┌──────────────────────────────────────────────────────┐
│                   HelpDesk (SaaS)                    │
│                                                      │
│   Next.js (Dashboard Web)   Next.js (PWA Mobile)     │
│           │                        │                 │
│           └─────────┬──────────────┘                 │
│                     ▼                                │
│              Express API (JWT + RBAC)                │
│                     │                                │
│      ┌──────────────┼──────────────┐                 │
│      ▼              ▼              ▼                 │
│  PostgreSQL      Redis          MinIO                │
│  (tickets,      (filas:        (evidências)          │
│   usuários)      notif,                              │
│                  imgs, SLA)                          │
└──────────────────────────────────────────────────────┘
        ▲                 ▲                  ▲
        │                 │                  │
        │                 │                  │
┌───────┴────────┐ ┌──────┴──────┐ ┌─────────┴─────────┐
│   Operacional  │ │   Gestor    │ │ Admin (seed/adm)  │
│  (PWA mobile)  │ │ (dashboard) │ │                   │
└────────────────┘ └─────────────┘ └───────────────────┘
```

**Fluxo típico**
1. Solicitante abre chamado via PWA (foto + local + categoria).
2. Backend persiste em Postgres e enfileira notificação em Redis.
3. Worker de notificação dispara aviso à equipe Operacional.
4. Operacional atende, registra foto "depois" → upload para MinIO → fila gera thumbs.
5. Gestor acompanha no dashboard; worker de SLA escala chamados não atendidos no prazo.
