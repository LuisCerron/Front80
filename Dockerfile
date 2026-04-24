# ========================================
# Dockerfile - Frontend Node.js para Dokploy
# Sin nginx. Usamos Express para servir estáticos.
# ========================================
FROM node:20-alpine

WORKDIR /app

# Copiar archivos de dependencias e instalar
COPY package.json ./
RUN npm install --only=production && npm cache clean --force

# Copiar todo el frontend
COPY . .

# Healthcheck para Dokploy
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT:-3000}/health || exit 1

# Exponer el puerto (Dokploy lo mapea automáticamente)
EXPOSE ${PORT:-3000}

# Comando de inicio
CMD ["node", "server.js"]
