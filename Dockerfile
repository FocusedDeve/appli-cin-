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
# Le build prérend l'accueil et appelle donc TMDB : le token est fourni en secret
# de build (jamais écrit dans une couche de l'image).
ENV TMDB_BASE_URL=https://api.themoviedb.org/3 \
    TMDB_IMAGE_BASE_URL=https://image.tmdb.org/t/p
RUN --mount=type=secret,id=tmdb_token,env=TMDB_ACCESS_TOKEN pnpm build

FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    TMDB_BASE_URL=https://api.themoviedb.org/3 \
    TMDB_IMAGE_BASE_URL=https://image.tmdb.org/t/p
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public
USER node
EXPOSE 3000
# TMDB_ACCESS_TOKEN est à fournir à l'exécution (docker run -e / --env-file).
CMD ["node", "server.js"]
