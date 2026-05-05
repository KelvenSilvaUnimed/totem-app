FROM node:22-slim
WORKDIR /app

# No modo offline, apenas copiamos o que já foi buildado no host (Windows)
COPY package*.json ./
COPY node_modules ./node_modules
COPY dist ./dist

# Garante que as variáveis de ambiente existam
ENV NODE_ENV=production

# O comando para rodar a aplicação
CMD ["node", "dist/server.js"]