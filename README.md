# 📝 Notes App — Markdown & Mermaid

Una aplicación de notas moderna, rápida y minimalista construida con **React (Vite)** y **Node.js (Express)**, utilizando **SQLite** como motor de base de datos. Diseñada para ser desplegada fácilmente en un VPS.

## ✨ Funcionalidades Principales

- **Editor Markdown**: Escribe tus notas con formato enriquecido (negritas, listas, código, etc.).
- **Diagramas Mermaid**: Genera diagramas y gráficos directamente en tus notas usando bloques de código `mermaid`.
- **Categorización**: Organiza tus notas por categorías personalizadas con colores distintivos.
- **Base de Datos SQLite**: Todo se guarda localmente en un único archivo, facilitando los backups y el despliegue.
- **Diseño Premium**: Interfaz limpia, responsiva y con micro-animaciones usando **Tailwind CSS** y **Lucide React**.
- **Listo para VPS**: Incluye scripts de instalación y configuraciones de Nginx para un deploy rápido.

## 🛠️ Stack Tecnológico

- **Frontend**: React 18, Vite, Tailwind CSS, Lucide Icons.
- **Backend**: Node.js, Express, SQLite3 (vía `sqlite` wrapper).
- **Utilidades**: Marked (Markdown), Mermaid.js (Diagramas).

## 📂 Estructura del Proyecto

```text
Notas/
├── server.js          # API Express + Lógica de Base de Datos
├── package.json       # Dependencias del Backend
├── setup.sh           # Script de despliegue automático para VPS
├── NGINX_CONFIG.md    # Guía de configuración de Proxy Inverso
├── data/              # Almacenamiento de la DB (.sqlite)
├── client/            # Código fuente del Frontend (Vite)
│   ├── src/
│   │   ├── App.jsx    # Componente principal y lógica de la UI
│   │   └── main.jsx   # Punto de entrada de React
│   ├── vite.config.js # Configuración de puertos y proxy
│   └── package.json   # Dependencias del Frontend
└── dist/              # Build optimizado para producción
```

## 🚀 Instalación y Uso Local

### Requisitos
- [Node.js](https://nodejs.org/) (versión 18 o superior).

### Pasos
1. **Clonar este repositorio** o descargar los archivos.
2. **Instalar dependencias del Backend**:
   ```bash
   npm install
   ```
3. **Instalar dependencias del Frontend**:
   ```bash
   cd client
   npm install
   cd ..
   ```
4. **Iniciar en modo desarrollo**:
   - Terminal 1 (Backend): `node server.js`
   - Terminal 2 (Frontend): `cd client && npm run dev`

Accede a `http://localhost:4223` en tu navegador.

## 🌐 Despliegue en VPS

Esta aplicación está configurada para correr en los puertos:
- **API (Backend)**: 4222
- **Frontend (Vite Dev)**: 4223

Para un despliegue rápido en un servidor Ubuntu/Debian:
1. Sube la carpeta al VPS.
2. Ejecuta el script de instalación:
   ```bash
   chmod +x setup.sh
   ./setup.sh
   ```
3. Configura Nginx siguiendo las instrucciones en `NGINX_CONFIG.md`.

## 🔒 Seguridad y Configuración

- Por defecto, el servidor escucha en `0.0.0.0` (o todas las interfaces) en el puerto `4222`.
- Puedes cambiar el puerto de la API editando la variable `PORT` en `server.js` o pasando una variable de entorno: `PORT=5000 node server.js`.

---

Creado con ❤️ para organizar tus ideas.
