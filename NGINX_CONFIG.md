# 📋 Guía de Deploy — ReNote con SQLite en VPS

## Estructura del proyecto

```
notes-app/
├── server.js          ← Backend Express + SQLite
├── package.json
├── setup.sh           ← Script de instalación automática
├── data/
│   └── notes.db       ← Base de datos SQLite (se crea sola)
├── dist/              ← Frontend compilado (Vite build)
└── client/            ← Código fuente React (tu proyecto Vite)
    ├── src/
    │   └── App.jsx    ← El App.jsx modificado va aquí
    ├── package.json
    └── vite.config.js
```

---

## 1. Configurar el frontend (Vite)

### `client/vite.config.js`
```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    // Proxy para desarrollo local: redirige /api al backend
    proxy: {
      '/api': {
        target: 'http://localhost:4222',
        changeOrigin: true,
      }
    }
  }
})
```

### `client/package.json` (ejemplo mínimo)
```json
{
  "name": "notes-client",
  "private": true,
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "lucide-react": "^0.383.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.2.1",
    "autoprefixer": "^10.4.18",
    "postcss": "^8.4.35",
    "tailwindcss": "^3.4.1",
    "vite": "^5.1.4"
  }
}
```

---

## 2. Deploy en el VPS

```bash
# Clonar / subir el proyecto al VPS
scp -r notes-app/ usuario@tu-vps:/home/usuario/

# Conectarse al VPS
ssh usuario@tu-vps

# Entrar al directorio y ejecutar el setup
cd notes-app
chmod +x setup.sh
bash setup.sh
```

---

## 3. Configurar Nginx como reverse proxy

### Instalar Nginx (si no está)
```bash
sudo apt update && sudo apt install -y nginx
```

### Crear config del sitio
```bash
sudo nano /etc/nginx/sites-available/notes-app
```

Pegar esta configuración:

```nginx
server {
    listen 80;
    server_name tu-dominio.com;   # ← cambiá esto

    # Tamaño máximo de upload (por si agregas adjuntos en el futuro)
    client_max_body_size 10M;

    location / {
        proxy_pass         http://localhost:4222;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Activar el sitio
```bash
sudo ln -s /etc/nginx/sites-available/notes-app /etc/nginx/sites-enabled/
sudo nginx -t          # verificar sintaxis
sudo systemctl reload nginx
```

---

## 4. HTTPS con Let's Encrypt (recomendado)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d tu-dominio.com
```

Certbot actualiza la config de Nginx automáticamente para redirigir HTTP → HTTPS.

---

## 5. Variables de entorno

Podés configurar estas variables antes de arrancar el servidor:

| Variable   | Default                | Descripción                          |
|------------|------------------------|--------------------------------------|
| `PORT`     | `4222`                 | Puerto donde escucha Express         |
| `DB_PATH`  | `./data/notes.db`      | Ruta al archivo SQLite               |

### Ejemplo con PM2 y variables de entorno:
```bash
PORT=4222 DB_PATH=/var/data/notes.db pm2 start server.js --name notes-app
```

O crear un archivo `ecosystem.config.js`:
```javascript
module.exports = {
  apps: [{
    name: 'notes-app',
    script: 'server.js',
    env: {
      PORT: 4222,
      DB_PATH: '/var/data/notes.db',
      NODE_ENV: 'production'
    }
  }]
}
```

Y arrancar con: `pm2 start ecosystem.config.js`

---

## 6. Comandos útiles de PM2

```bash
pm2 status              # Ver estado de todos los procesos
pm2 logs notes-app      # Ver logs en tiempo real
pm2 restart notes-app   # Reiniciar
pm2 stop notes-app      # Detener
pm2 delete notes-app    # Eliminar del PM2
```

---

## 7. Backup de la base de datos

SQLite guarda todo en un solo archivo. Backup simple:

```bash
# Manual
cp data/notes.db data/notes.backup-$(date +%Y%m%d).db

# Con cron (backup diario a las 3am)
crontab -e
# Agregar esta línea:
0 3 * * * cp /home/usuario/notes-app/data/notes.db /home/usuario/backups/notes-$(date +\%Y\%m\%d).db
```

---

## API Reference

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/notes` | Listar notas (query: `?categoryId=`) |
| GET | `/api/notes/:id` | Obtener una nota |
| POST | `/api/notes` | Crear nota |
| PUT | `/api/notes/:id` | Actualizar nota |
| DELETE | `/api/notes/:id` | Eliminar nota |
| GET | `/api/categories` | Listar categorías |
| POST | `/api/categories` | Crear categoría |
| DELETE | `/api/categories/:id` | Eliminar categoría |
