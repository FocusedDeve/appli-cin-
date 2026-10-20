# syntax=docker/dockerfile:1

FROM node:24-alpine AS base
RUN npm install -g pnpm@12.5.1
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Aucune clé n'est nécessaire au build : l'accueil est statique et les appels
# TMDB / Gemini ont lieu à l'exécution.
RUN pnpm build

FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    TMDB_BASE_URL=https://api.themoviedb.org/3 \
    TMDB_IMAGE_BASE_URL=https://image.tmdb.org/t/p \
    AI_MODEL=gemini-3.5-flash-lite
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public
USER node
EXPOSE 3000
# À fournir à l'exécution (docker run -e / --env-file) : TMDB_ACCESS_TOKEN,
# GOOGLE_GENERATIVE_AI_API_KEY et, en option, AI_MODEL.
CMD ["node", "server.js"]
