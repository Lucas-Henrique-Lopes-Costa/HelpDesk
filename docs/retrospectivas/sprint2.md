# Retrospectiva Sprint 2

**Data:** 2026-06-18
**Participantes:** Lucas, Pedro, Thiago, Gustavo
**Sprint encerrado em:** 18/06/2026

## O que entregamos

Fechamos as quatro issues planejadas para o Sprint 2, com 1 PR mergeado em `main` por integrante — o mesmo ritmo do Sprint 1.

O Pedro ficou com a issue #30 (backend de tickets avançado) e entregou o `PATCH /tickets/:id/status` com uma máquina de estados completa, cobrindo todas as transições da Issue #11. Além disso, corrigiu um bug de atualização de local e categoria nos tickets e resolveu um import duplicado de `UserRole` que estava causando conflito silencioso. Os testes unitários cobrindo as transições de estado entraram juntos no mesmo PR, seguindo o padrão de mock em memória que a gente adotou desde o Sprint 1.

O Thiago foi o que mais avançou em volume de código neste sprint — ficou responsável pela issue #31, o épico completo de frontend. Entregou cinco telas: `/tickets/[id]` com status, prioridade, SLA calculado, timeline de comentários, galeria de evidências antes/depois e painel de ações por papel; `/queue` como fila do operador priorizada por SLA, com layout responsivo e filtro "meus chamados"; `/insights` com dashboard executivo (cards + gráficos de carga por responsável e por status/categoria, consumindo `GET /tickets/stats`); e `/dashboard` com linhas clicáveis para o detalhe, colunas de SLA e responsável, filtro de chamados com SLA estourado e tratamento correto de 401/403. Ainda na issue do Thiago entrou o fluxo de upload: foto "antes" obrigatória na abertura via `/tickets/new`, e foto "depois" exigida no momento da resolução. Para facilitar apresentações, ele manteve o modo mock com `NEXT_PUBLIC_USE_MOCK=true`, que deixa todas as telas navegáveis sem precisar do backend rodando.

O Lucas assumiu a issue #29 — infra, deploy e ownership — e entregou bastante coisa estrutural. Criou os Dockerfiles multi-stage do backend e do frontend (o do backend já inclui `prisma migrate deploy` + seed no entrypoint), atualizou o `docker-compose.yml` para subir a stack inteira com um comando só, e escreveu o `render.yaml` como blueprint de deploy no Render com Postgres, backend e frontend separados. No lado de segurança, implementou o enforcement de ownership: REQUESTER agora só enxerga os próprios chamados em `GET /tickets` e `GET /tickets/:id`, retornando 403 para qualquer acesso a ticket de outro usuário. Também escreveu o ADR-003 (política de SLA) e o ADR-004 (storage de evidências), que guiaram a implementação do Thiago antes mesmo de ele começar a codar. Por último, o README ganhou diagrama de arquitetura, seção Docker, seção Deploy e referências às decisões técnicas dos ADRs.

Fiquei responsável pela issue #32, focada em CI/CD e qualidade. Adicionei um job `frontend` paralelo no `ci.yml` que roda lint e build do Next.js junto com o job `backend` existente, sem aumentar o tempo total de pipeline. No backend, configurei ESLint v8 + Prettier (`.eslintrc.json`, `.prettierrc` e `.prettierignore`) e adicionei o step de `npm run lint` no job `backend` antes do `npm test`, para garantir que código fora de estilo quebre o CI antes de chegar nos testes. Defini um `coverageThreshold` de 60% no `jest.config.js` como gate mínimo de statements e lines — qualquer PR que faça a cobertura cair abaixo disso falha automaticamente. Para cobrir esse gate, escrevi testes unitários para `src/middleware/validate.ts` (5 casos cobrindo schema válido, inválido, campos extras e mensagem de erro formatada) e `src/middleware/error-handler.ts` (6 casos cobrindo `AppError`, `ConflictError`, `NotFoundError`, erro genérico e resposta sem leak de stack). Com isso, a cobertura do backend subiu de ~46% para 65%+.

No fim, o backend passou de 27 para 45 testes verdes, o CI agora valida frontend e backend em paralelo, e o `docker compose up -d` da stack completa (Postgres, Redis, MinIO, backend, frontend) funciona com um único comando.

## Continue

1. **PRs temáticos pequenos por integrante.** Funcionou igual ao Sprint 1 — cada um cuidou da própria branch, os conflitos de merge foram mínimos e o review ficou gerenciável. O ritmo de 1 PR mergeado por pessoa por sprint vale manter no Sprint 3.
2. **Pattern de service factory.** O `createXxxService(prisma)` seguiu firme em tudo que o Pedro e o Lucas implementaram neste sprint, e os testes de unidade continuam passando sem banco nenhum subindo. É o padrão que garante que o CI não precise de Postgres para rodar o job de testes.
3. **ADRs antes de codar.** O ADR-003 e o ADR-004 que o Lucas escreveu deixaram claro o contrato de SLA e a política de storage antes do Thiago começar o frontend. Quando surgiu dúvida sobre qual campo usar para o cálculo de prazo, o ADR respondeu sem precisar de call. Quero continuar abrindo ADRs para qualquer decisão que envolva mais de um integrante.
4. **Modo mock no frontend.** O `NEXT_PUBLIC_USE_MOCK=true` que o Thiago manteve vale muito na hora de apresentar o projeto: navegamos por todas as telas sem servidor rodando, o que evita surpresa de ambiente em apresentação. Manter isso como padrão para demos enquanto o backend ainda está evoluindo.

## Stop

1. **Branch longa sem abrir PR.** A branch do Pedro ficou acumulando commits por vários dias antes de o PR ser aberto, o que dificultou acompanhar o que estava pronto e gerou um conflito que ele precisou resolver no meio do trabalho. No Sprint 3, quero que PR seja aberto como draft logo nos primeiros commits, mesmo que a implementação não esteja completa.
2. **Testes de unidade deixados para o final.** O gate de `coverageThreshold` de 60% foi adicionado quando a cobertura já estava em ~46%, o que criou pressão perto do prazo para subir o número. O certo era definir o gate antes e ir cobrindo à medida que as features entravam — no Sprint 3 o gate entra junto com a primeira issue, não depois.

## Start

1. **Smoke test checklist no corpo do PR.** Já pedi isso na retrospectiva do Sprint 1 e ficou só no papel. No Sprint 3 quero implementar de verdade: uma lista mínima de endpoints ou fluxos testados manualmente, incluída no corpo do PR antes de pedir review. Não precisa ser elaborado — bastam 4 ou 5 linhas confirmando que o happy path funciona.
2. **Branch protection de verdade no `main`.** O repositório ainda aceita push direto na `main` sem aprovação. Antes de começar o Sprint 3, o Lucas precisa ativar "require PR + 1 approval + status check verde" no GitHub — com o CI cobrindo backend e frontend, a proteção finalmente faz sentido completo.
3. **Testes de integração com Postgres real.** O `service: postgres` já está no `ci.yml` desde o Sprint 1 e nunca foi usado de verdade. No Sprint 3 quero um job separado que rode `prisma migrate deploy` e exercite as constraints de FK (location, category, reporter) — as regras de ownership que o Lucas implementou são exatamente o tipo de coisa que só aparece com banco real.
