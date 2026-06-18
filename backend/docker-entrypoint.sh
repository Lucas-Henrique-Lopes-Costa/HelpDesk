#!/bin/sh
set -e

echo "[entrypoint] Aplicando migrations (prisma migrate deploy)..."
npx prisma migrate deploy

if [ "${RUN_SEED:-false}" = "true" ]; then
  echo "[entrypoint] Populando dados iniciais (seed)..."
  npx prisma db seed || echo "[entrypoint] seed falhou ou já aplicado — seguindo."
fi

echo "[entrypoint] Iniciando aplicação: $*"
exec "$@"
