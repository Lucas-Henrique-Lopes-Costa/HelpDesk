# HelpDesk Operacional

Sistema de gestão de chamados e manutenção de facilities para grandes empresas. Conecta colaboradores (que reportam problemas físicos — manutenção, limpeza, reposição de insumos) à equipe operacional, com validação visual (fotos antes/depois) e controle rigoroso de SLA.

> **Disciplina:** GCC267 - Projeto Integrador I (UFLA, 2026/1)
> **Professor:** Dr. Rafael Serapilha Durelli
> **Sprint 1 — entrega 22/04/2026**

## Objetivo do produto

Reduzir o tempo entre o relato de um incidente físico e sua resolução em ambientes corporativos, criando:

- um canal único para solicitantes abrirem chamados com fotos de evidência;
- um backlog priorizado por SLA para a equipe operacional atender no app mobile/PWA;
- um dashboard executivo para gestores acompanharem indicadores (chamados abertos, SLA estourado, carga por time).

## Integrantes

| Papel | Nome | GitHub |
|---|---|---|
| Tech Lead + Backend Auth | Lucas Henrique Lopes Costa | [@Lucas-Henrique-Lopes-Costa](https://github.com/Lucas-Henrique-Lopes-Costa) |
| Backend — Domínio de Chamados | Pedro Gonçalves Costa Melo | [@Pedro-Goncalves-Costa-Melo](https://github.com/Pedro-Goncalves-Costa-Melo) |
| Frontend Web | Thiago Lima Pereira | [@thiagolimapereira](https://github.com/thiagolimapereira) |
| RBAC + CI/CD + QA | Gustavo Teodoro | [@tteodorogustavo](https://github.com/tteodorogustavo) |

## Stack

- **Backend:** Node.js 20 · Express 4 · TypeScript 5 · Prisma 5 · JWT · Zod · Jest
- **Frontend:** Next.js 14 (App Router) · React 18 · Tailwind CSS
- **Banco:** PostgreSQL 16
- **Filas/Cache:** Redis 7 + BullMQ (notificações, processamento de imagens, monitor de SLA)
- **Storage:** MinIO (S3-compatível, evidências dos chamados)
- **Infra local:** Docker + Docker Compose
- **CI:** GitHub Actions

## Como rodar localmente

**Pré-requisitos:** Node.js 20+, Docker, Docker Compose.

```bash
# 1. Clone e entre no projeto
git clone https://github.com/Lucas-Henrique-Lopes-Costa/HelpDesk.git
cd HelpDesk

# 2. Infra local (Postgres, Redis, MinIO)
cp .env.example .env
docker compose up -d

# 3. Backend
cd backend
cp .env.example .env
npm install
npm run prisma:generate
npm run prisma:migrate
npm run dev  # sobe em http://localhost:3333
```

Healthcheck: `curl http://localhost:3333/health`.

## Scripts do backend

| Comando | Descrição |
|---|---|
| `npm run dev` | Hot reload (tsx watch) |
| `npm run build` | Compila para dist/ |
| `npm run start` | Executa a build |
| `npm test` | Testes unitários (Jest) |
| `npm run test:coverage` | Testes + relatório de cobertura |
| `npm run prisma:migrate` | Aplica migrations no banco |

## Documentação

- [ADR-001 — Stack tecnológica](docs/adr/001-stack-tecnologica.md)
- [ADR-002 — Arquitetura em camadas do backend](docs/adr/002-arquitetura-em-camadas.md)
- [Retrospectiva do Sprint 1](docs/retrospectivas/sprint1.md) (Gustavo)

## Gestão

- **GitHub Project:** [Sprint 1 — HelpDesk Operacional](https://github.com/users/Lucas-Henrique-Lopes-Costa/projects/5)
- **Milestone:** `Sprint 1 - Fundação do Produto`
- **Definition of Done do Sprint 1:** repositório estruturado, 3 User Stories demonstráveis (US-01 Auth, US-02 Abertura de chamado, US-03 Dashboard), suíte de testes verde, 1 PR por integrante mergeado em `main`.
