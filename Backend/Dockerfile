FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Instala dependências de produção
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copia build
COPY --from=builder /app/dist ./dist

# Garante permissões ANTES de mudar de usuário
RUN chown -R node:node /app

USER node

EXPOSE 3000
CMD ["node", "dist/server.js"]
