# ========================================
# Dockerfile - Frontend Nginx para Dokploy
# Build context: raíz del repo
# ========================================
FROM nginx:alpine

# Instalar envsubst para reemplazar variables en la plantilla
RUN apk add --no-cache gettext

# Copiar todos los archivos estáticos del frontend
COPY Fronted/ /usr/share/nginx/html/

# Copiar la plantilla de configuración de nginx
COPY Fronted/nginx.conf.template /etc/nginx/conf.d/default.conf.template

# Copiar el script de entrada
COPY Fronted/entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Eliminar archivos de build del web root (limpieza)
RUN rm -f /usr/share/nginx/html/Dockerfile \
          /usr/share/nginx/html/nginx.conf.template \
          /usr/share/nginx/html/entrypoint.sh \
          /usr/share/nginx/html/.dockerignore \
          /usr/share/nginx/html/.env.example

# Eliminar la configuración por defecto de nginx
RUN rm -f /etc/nginx/conf.d/default.conf

# Healthcheck para Dokploy
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT:-80}/health || exit 1

# Exponer el puerto (Dokploy lo mapea automáticamente)
EXPOSE ${PORT:-80}

# Usar nuestro script de entrada personalizado
ENTRYPOINT ["/docker-entrypoint.sh"]
