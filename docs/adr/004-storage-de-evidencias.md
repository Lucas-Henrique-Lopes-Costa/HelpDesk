# ADR-004: Storage de evidências (fotos antes/depois)

- **Status:** Aceito
- **Data:** 2026-06-17
- **Decisores:** Lucas, Pedro, Thiago, Gustavo
- **Contexto de decisão:** Sprint 2/3 — upload de evidências fotográficas (US-04).

## Contexto

A validação visual (foto **antes** ao abrir, foto **depois** ao resolver) é um diferencial do produto. Imagens não devem ser guardadas no Postgres (banco incha, dump fica lento, backup caro). Precisamos de um storage de objetos compatível com produção, mas que rode 100% local para a demo da banca.

## Opções consideradas

| Opção | Prós | Contras |
|---|---|---|
| **MinIO (S3-compatível) — escolhida** | Mesma API do S3; roda local via Docker; migrar para AWS S3 depois é trocar credenciais | Mais um serviço no compose |
| Salvar binário (BYTEA) no Postgres | Sem serviço extra | Incha o banco; dumps/backup pesados; ruim para servir imagem |
| Disco local do container | Trivial | Some no redeploy; não escala horizontalmente; não funciona em PaaS efêmero |

## Decisão

1. **MinIO** como object storage, já presente no `docker-compose` (bucket `helpdesk-evidences`). Em produção, as mesmas variáveis (`MINIO_*` / chaves S3) apontam para um bucket gerenciado.
2. **Metadados no Postgres, binário no storage:** uma tabela `TicketAttachment` guarda `kind` (`BEFORE`/`AFTER`), `url`/chave do objeto, `mimeType`, `sizeBytes`, `uploadedById` e FK para o ticket. O arquivo em si vive no MinIO.
3. **Validação:** apenas `image/jpeg` e `image/png`, com limite de tamanho; o backend valida antes de persistir.
4. **Regra de negócio:** a transição `IN_PROGRESS → RESOLVED` exige ao menos uma evidência `AFTER` — a "prova" da resolução.
5. **Acesso:** download via URL pré-assinada (presigned) de validade curta, para não expor o bucket publicamente.

> Implementação (model, integração com o client de storage e endpoints) é do épico de domínio (Pedro, issue #30). Este ADR fixa **onde** e **como** as evidências são guardadas.

## Consequências

- **Positivas:** banco enxuto; caminho de produção (AWS S3) é só troca de credenciais; presigned URLs evitam vazamento; demo roda local sem nuvem.
- **Negativas:** mais um serviço para subir/healthcheck; o time precisa lidar com falha de upload (transação: só cria o `TicketAttachment` se o objeto subir).
- **Follow-ups:** processamento assíncrono de imagem (thumbnail/compressão via BullMQ) e antivírus de upload ficam para evolução.
