# syntax=docker/dockerfile:1

# ---------- Stage 1: build (compila TypeScript e gera o Prisma Client) ----------
FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npx prisma generate && npm run build

# ---------- Stage 2: runtime (imagem enxuta só com deps de produção) ----------
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

# Apenas dependências de produção (inclui prisma CLI e tsx para migrate/seed no boot)
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Prisma Client já gerado no estágio de build + código compilado + fontes do seed
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/src ./src
COPY --from=build /app/docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

EXPOSE 3333

# O entrypoint roda `prisma migrate deploy` (e seed opcional) antes de subir a API.
ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "dist/server.js"]
