# Retrospectiva Sprint 1

**Data:** 2026-04-23
**Participantes:** Lucas, Pedro, Thiago, Gustavo
**Sprint encerrado em:** 22/04/2026

## O que entregamos

Fechamos as três User Stories planejadas para o Sprint 1, com 1 PR mergeado em `main` por integrante.

- **Lucas** subiu o esqueleto do projeto: estrutura do monorepo (`backend/`, `frontend/`, `docs/`), o `docker-compose.yml` com Postgres, Redis e MinIO, e os dois primeiros ADRs (001 — escolha da stack, e 002 — arquitetura em camadas do backend). Implementou US-01 inteira: cadastro e login com JWT, hash de senha com bcrypt, validação por Zod e os testes unitários de `auth.service` e `hash.service`. Para fechar, escreveu o README e configurou o Swagger UI em `/docs` para a gente conseguir testar os endpoints manualmente.
- **Pedro** levantou o domínio de chamados em três PRs encadeados (#21, #22, #23): primeiro os models `Ticket`, `Location` e `Category` no Prisma com migrations; depois o `POST /tickets` (US-02 do lado do back); e por fim o `GET /tickets` com filtros (status, prioridade, categoria, local, responsável) + paginação, e o `GET /tickets/:id` para detalhar. Cobriu cada peça com testes do service usando o mesmo padrão de Prisma mockado em memória que o Lucas tinha proposto.
- **Thiago** fez o frontend em Next.js 14 (App Router) com Tailwind: tela de login ligada no `POST /auth/login` (US-01), dashboard de listagem com filtros (US-03) e o formulário de abertura de chamado (US-02). A branch dele já está pronta no remote (`feat/sprint-1-thiago-frontend`); o PR vai entrar logo após o merge deste de RBAC.
- **Gustavo** entrei depois com a parte de segurança e de CI: o middleware `authorize(roles)` (que se encaixa com o `authenticate` que o Pedro tinha deixado pronto), a classe de erro `ForbiddenError`, os testes unitários dos dois middlewares, a aplicação do RBAC nas rotas de tickets, o workflow do GitHub Actions rodando teste e build a cada PR e push em `main`, e a badge de status no README.

No fim, a suíte de testes do backend ficou em 27 testes verdes (auth, hash, tickets e middlewares), o `npm run build` passa limpo e o `docker compose up -d` sobe o ambiente local com um comando só.

## Continue

1. **Dividir o backend em routes/controller/service.** Cada um trabalhou no seu trio sem pisar no pé do outro e os PRs fluíram em paralelo, com pouquíssimos conflitos de merge. A regra "service recebe Prisma por parâmetro" foi o que permitiu rodar testes sem subir banco.
2. **PRs pequenos, um por feature.** O Pedro abriu três PRs separados só para US-02 e isso fez o review do Lucas ser viável. Vamos manter granularidade pequena no Sprint 2.
3. **Decidir antes de codar.** As ADRs evitaram briga de padrão na hora dos PRs — quando alguém divergia, a gente apontava o ADR e seguia. Quero abrir mais ADRs no Sprint 2 (filas, storage, política de SLA).

## Stop

1. **Issues sem assignee.** A gente perdeu tempo em call só descobrindo "quem ia fazer o que" quando começamos. No Sprint 2 todo mundo assume sua issue no GitHub Project antes de começar a trabalhar.
2. **Testes manuais sem registro.** Subia, testava no Swagger, dava certo e mergeava — mas não ficou trilha do que foi testado. No Sprint 2 quero ter uma checklist mínima de smoke test no body do PR.
3. **TODOs no código sem dono nem destino.** Ficou TODO solto que ninguém sabe se vira issue ou se é Sprint 2 mesmo. Padronizar para `// TODO(sprint-2):` e/ou abrir issue correspondente.

## Start

1. **Configurar ESLint + Prettier no backend.** Já deixei o espaço reservado no `ci.yml` com um TODO de Sprint 2. Quero o lint quebrando antes do `npm test`.
2. **Aplicar checagem de ownership em `GET /tickets/:id`.** Hoje qualquer autenticado vê qualquer ticket. Solicitante deveria ver só os próprios — vai virar issue do Sprint 2.
3. **Ativar branch protection no `main`.** Exigir PR + 1 aprovação + status check `Backend (test + build)` verde. Hoje, teoricamente, um push direto ainda passaria. Instruções no corpo do PR de RBAC/CI.
4. **Testes de integração com Postgres real.** O service `postgres` já está no `ci.yml` justamente para isso — falta um job paralelo que rode `prisma migrate deploy` + uma suíte que exercite as constraints de FK (location, category, reporter).
