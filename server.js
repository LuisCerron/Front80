const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';

// Generar api-config.js dinámicamente
app.get('/api-config.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.send(`window.API_BASE_URL = "${BACKEND_URL}";`);
});

// Healthcheck para Dokploy
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Servir archivos estáticos
app.use(express.static(path.join(__dirname)));

// Fallback a index.html para SPA (si hay rutas que no sean archivos)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Frontend corriendo en puerto ${PORT}`);
  console.log(`🔗 Backend URL: ${BACKEND_URL}`);
});
