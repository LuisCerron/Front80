const express = require('express');
const path = require('path');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = process.env.PORT || 3000;
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';

// Proxy todas las peticiones /api/* al backend real
app.use('/api', createProxyMiddleware({
  target: BACKEND_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/api': '' // quita /api antes de enviar al backend
  },
  onProxyReq: (proxyReq, req, res) => {
    console.log(`[PROXY] ${req.method} ${req.url} -> ${BACKEND_URL}${req.url}`);
  },
  onError: (err, req, res) => {
    console.error('[PROXY ERROR]', err.message);
    res.status(502).json({ error: 'Backend no disponible', details: err.message });
  }
}));

// Generar api-config.js dinámicamente
app.get('/api-config.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.send(`window.API_BASE_URL = "${BACKEND_URL}";`);
});

// Healthcheck para Dokploy
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Servir archivos estáticos del frontend
app.use(express.static(path.join(__dirname)));

// Fallback a index.html para rutas de SPA (DESPUÉS del proxy y estáticos)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Frontend corriendo en puerto ${PORT}`);
  console.log(`🔗 Backend URL: ${BACKEND_URL}`);
});
