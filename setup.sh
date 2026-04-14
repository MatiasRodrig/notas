#!/bin/bash
# =============================================================
# setup.sh — Deploy de ReNote en VPS (Ubuntu/Debian)
# Uso: bash setup.sh
# =============================================================

set -e
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

log() { echo -e "${BLUE}[setup]${NC} $1"; }
ok()  { echo -e "${GREEN}[ok]${NC} $1"; }

# ---- 1. Node.js (si no está) --------------------------------
if ! command -v node &>/dev/null; then
  log "Instalando Node.js 20 LTS..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi
ok "Node.js $(node -v)"

# ---- 2. PM2 (proceso manager) --------------------------------
if ! command -v pm2 &>/dev/null; then
  log "Instalando PM2..."
  sudo npm install -g pm2
fi
ok "PM2 $(pm2 -v)"

# ---- 3. Dependencias del backend -----------------------------
log "Instalando dependencias del backend..."
npm install
ok "Dependencias instaladas"

# ---- 4. Crear carpeta de datos (SQLite) ----------------------
mkdir -p data
ok "Carpeta 'data/' lista"

# ---- 5. Build del frontend -----------------------------------
if [ -d "client" ]; then
  log "Instalando dependencias del frontend..."
  cd client && npm install

  log "Construyendo el frontend (Vite)..."
  npm run build

  log "Copiando dist/ al directorio raíz..."
  cp -r dist ../dist
  cd ..
  ok "Frontend compilado en dist/"
else
  log "No se encontró carpeta 'client/'. Asegurate de tener el frontend de Vite ahí."
  log "Estructura esperada:"
  log "  notes-app/"
  log "  ├── server.js"
  log "  ├── package.json"
  log "  ├── data/          (se crea automáticamente)"
  log "  ├── dist/          (build del frontend)"
  log "  └── client/        (fuente del frontend React/Vite)"
fi

# ---- 6. Levantar con PM2 ------------------------------------
log "Iniciando servidor con PM2..."
pm2 start server.js --name "notes-app" --env production || pm2 restart notes-app

# Guardar config de PM2 para que sobreviva reinicios
pm2 save
pm2 startup | tail -1 | bash 2>/dev/null || true

echo ""
echo "======================================================"
ok "¡ReNote deployada exitosamente!"
echo ""
echo "  Puerto API:   4222  (configurable con PORT=xxxx)
  Puerto UI:    4223  (si se sirve por separado)
"
echo "  SQLite DB:  ./data/notes.db"
echo "  Logs:       pm2 logs notes-app"
echo "  Status:     pm2 status"
echo "  Reiniciar:  pm2 restart notes-app"
echo ""
echo "  Para acceder desde el exterior, configurá Nginx:"
echo "  ver NGINX_CONFIG.md incluido en el proyecto."
echo "======================================================"
