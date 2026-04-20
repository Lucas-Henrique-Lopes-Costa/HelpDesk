# ADR-001: Stack tecnológica do HelpDesk Operacional

- **Status:** Aceito
- **Data:** 2026-04-20
- **Decisores:** Lucas, Pedro, Thiago, Gustavo
- **Contexto de decisão:** Sprint 1 — escolha da stack que acompanha os 3 sprints.

## Contexto

O produto precisa entregar, até o Sprint 3:

1. Uma API REST com autenticação por token e RBAC (Admin, Gestor, Solicitante, Operacional).
2. Um backlog de chamados com máquina de estados, SLA e evidências em imagem.
3. Processamento assíncrono de 3 cenários: notificações, compressão/thumbs de imagem e monitor de SLA.
4. Um dashboard web e uma interface mobile-first para a equipe operacional.

Temos 4 integrantes, ~3 meses, e restrições da disciplina: SonarCloud, GitHub Actions, Docker, cobertura mínima de testes. O time tem experiência prévia em JavaScript/TypeScript e algum contato com Python.

## Opções consideradas

| Opção | Prós | Contras |
|---|---|---|
| **Node.js + Express + TypeScript (escolhida)** | Stack unificada entre back/front; ecossistema maduro (Prisma, BullMQ, Zod); produtividade alta; equipe confortável | Single-thread exige atenção com CPU-bound (mitigado por filas) |
| Python + FastAPI | Excelente DX, typing, docs automática | Dois runtimes diferentes (front em JS); curva para usuários novos |
| Java + Spring Boot | Maturidade corporativa; boa adesão ao mundo de facilities | Mais verboso; boilerplate alto para 3 sprints; build mais pesado |

## Decisão

Adotar **Node.js 20 + Express 4 + TypeScript 5** no backend, com:

- **Prisma 5** como ORM (migrations automáticas, tipos gerados, DX de alta qualidade);
- **Zod** para validação de input (contrato compartilhável com o frontend no futuro);
- **Jest + Supertest** para testes unitários e de integração;
- **bcryptjs + jsonwebtoken** para autenticação;
- **BullMQ (Redis)** para as 3 filas previstas no planejamento.

No frontend: **Next.js 14 (App Router) + Tailwind CSS** — permite dashboard web e PWA/mobile-first a partir da mesma base.

Infra local: **Docker Compose** subindo Postgres 16, Redis 7 e MinIO. Object storage em MinIO mantém a API S3 do AWS, permitindo futura migração sem código novo.

## Consequências

- **Positivas:** time compartilha linguagem no full-stack, reduzindo context switch; tipagem estática reduz bugs antes do Sprint 2; Prisma acelera o Sprint 2 (migrations versionadas já cobertas pela disciplina).
- **Negativas:** Node single-thread exige que qualquer trabalho CPU-bound (ex: redimensionar imagem) seja delegado à fila BullMQ — não executado na request. Este é um design constraint assumido, não um débito.
- **Follow-ups:** workers da fila serão implementados no Sprint 2 junto com o upload de evidências.
