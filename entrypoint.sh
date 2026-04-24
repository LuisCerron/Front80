#!/bin/sh
set -e

# Reemplazar variables de entorno en la plantilla de nginx
envsubst '$BACKEND_URL $PORT' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf

# Mostrar configuración para debug (opcional, útil en logs de Dokploy)
echo "=== Nginx configurado ==="
echo "BACKEND_URL: $BACKEND_URL"
echo "PORT: ${PORT:-80}"
echo "========================="

# Iniciar nginx en primer plano
nginx -g 'daemon off;'
