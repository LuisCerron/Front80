#!/bin/sh
set -e

# Generar api-config.js con la URL del backend
# Este archivo será servido como estático y leído por el navegador
cat > /usr/share/nginx/html/api-config.js << EOF
window.API_BASE_URL = "${BACKEND_URL}";
EOF

echo "=== Frontend configurado ==="
echo "BACKEND_URL: ${BACKEND_URL}"
echo "PORT: ${PORT:-80}"
echo "=========================="

# Reemplazar variables en la plantilla de nginx
envsubst '$PORT' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf

# Iniciar nginx en primer plano
nginx -g 'daemon off;'
