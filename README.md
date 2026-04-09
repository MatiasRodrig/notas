# 📝 Notes App — HTML, Markdown & Mermaid (v1.2)

[Español](#español) | [English](#english)

---

<a name="español"></a>
## 🇪🇸 Español

Una aplicación de notas moderna, rápida y minimalista construida con **React (Vite)** y **Node.js (Express)**, utilizando **SQLite** como motor de base de datos. Diseñada para ser desplegada fácilmente en un VPS.

### 🚀 Novedades v1.2

- **Tarjetas de Código Estilo Notion**: Bloques de código con resaltado de sintaxis detallado (hljs), botón de copiar y diseño premium.
- **Barra de Herramientas del Editor**: Nueva barra con utilidades para insertar Encabezados, Listas, Tablas, Citas, Gráficos Mermaid y más de forma rápida.
- **Inserción Inteligente**: Herramientas que envuelven el texto seleccionado o insertan plantillas en la posición del cursor.

### 🚀 Historial v1.1

- **Ejecución de HTML Completo**: Las notas que comienzan con `<!DOCTYPE html>` se renderizan en un `<iframe>` aislado.
- **Renderizado de bloques HTML**: Soporte para bloques ` ```html ` que se muestran como contenido vivo.
- **Mejora de Previsualización**: Limpieza de texto robusta en la vista de inicio.

### ✨ Funcionalidades Principales

- **Editor Markdown**: Escribe tus notas con formato enriquecido (negritas, listas, código, etc.).
- **Diagramas Mermaid**: Genera diagramas y gráficos directamente en tus notas usando bloques de código `mermaid`.
- **Categorización Jerárquica**: Organiza tus notas con un sistema de **Categorías y Subcategorías** (doble nivel).
- **Gestión de Categorías**: Edita nombres o elimina categorías (con borrado en cascada) directamente desde la barra de navegación.
- **Navegación PC Optimizada**: Desplazamiento horizontal fluido en la barra de categorías usando la rueda del ratón.
- **Filtrado Inteligente**: Al seleccionar una categoría padre, se muestran automáticamente sus notas y las de todas sus subcategorías.
- **Base de Datos SQLite**: Almacenamiento local persistente con soporte para relaciones jerárquicas.
- **Diseño Premium**: Interfaz limpia, responsiva y con micro-animaciones usando **Tailwind CSS** y **Lucide React**.
- **Listo para VPS**: Incluye scripts de instalación y configuraciones de Nginx para un deploy rápido.

### 🛠️ Stack Tecnológico

- **Frontend**: React 18, Vite, Tailwind CSS, Lucide Icons.
- **Backend**: Node.js, Express, SQLite3 (vía `sqlite` wrapper).
- **Utilidades**: Marked (Markdown), Mermaid.js (Diagramas).

### 📂 Estructura del Proyecto

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

### 🚀 Instalación y Uso Local

#### Requisitos
- [Node.js](https://nodejs.org/) (versión 18 o superior).

#### Pasos
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

### 🌐 Despliegue en VPS

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

---

<a name="english"></a>
## 🇺🇸 English

A modern, fast, and minimalist notes application built with **React (Vite)** and **Node.js (Express)**, using **SQLite** as the database engine. Designed for easy deployment on a VPS.

### 🚀 What's New in v1.2

- **Notion-Style Code Cards**: Code blocks with detailed syntax highlighting (hljs), copy button, and premium design.
- **Editor Toolbar**: New toolbar with utilities to quickly insert Headings, Lists, Tables, Quotes, Mermaid Charts, and more.
- **Smart Insertion**: Tools that wrap selected text or insert templates at the cursor position.

### 🚀 History v1.1

- **Full HTML Execution**: Notes starting with `<!DOCTYPE html>` are rendered in an isolated `<iframe>`.
- **HTML Block Rendering**: Support for ` ```html ` blocks that display as live content.
- **Preview Improvements**: Robust text cleaning in the home view.

### ✨ Key Features

- **Markdown Editor**: Write your notes with rich formatting (bold, lists, code, etc.).
- **Mermaid Diagrams**: Generate diagrams and charts directly in your notes using `mermaid` code blocks.
- **Hierarchical Categorization**: Organize your notes with a **Category and Subcategory** system (two levels).
- **Category Management**: Edit names or delete categories (with cascade deletion) directly from the navigation bar.
- **Optimized PC Navigation**: Smooth horizontal scrolling in the category bar using the mouse wheel.
- **Smart Filtering**: Selecting a parent category automatically shows its notes and those of all its subcategories.
- **SQLite Database**: Persistent local storage with support for hierarchical relationships.
- **Premium Design**: Clean, responsive interface with micro-animations using **Tailwind CSS** and **Lucide React**.
- **VPS Ready**: Includes installation scripts and Nginx configurations for quick deployment.

### 🛠️ Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Lucide Icons.
- **Backend**: Node.js, Express, SQLite3 (via `sqlite` wrapper).
- **Utilities**: Marked (Markdown), Mermaid.js (Diagrams).

### 📂 Project Structure

```text
Notas/
├── server.js          # Express API + Database Logic
├── package.json       # Backend Dependencies
├── setup.sh           # Automatic VPS deployment script
├── NGINX_CONFIG.md    # Reverse Proxy configuration guide
├── data/              # DB Storage (.sqlite)
├── client/            # Frontend Source Code (Vite)
│   ├── src/
│   │   ├── App.jsx    # Main component and UI logic
│   │   └── main.jsx   # React entry point
│   ├── vite.config.js # Port and proxy configuration
│   └── package.json   # Frontend dependencies
└── dist/              # Optimized production build
```

### 🚀 Local Installation and Usage

#### Requirements
- [Node.js](https://nodejs.org/) (version 18 or higher).

#### Steps
1. **Clone this repository** or download the files.
2. **Install Backend dependencies**:
   ```bash
   npm install
   ```
3. **Install Frontend dependencies**:
   ```bash
   cd client
   npm install
   cd ..
   ```
4. **Start in development mode**:
   - Terminal 1 (Backend): `node server.js`
   - Terminal 2 (Frontend): `cd client && npm run dev`

Access `http://localhost:4223` in your browser.

### 🌐 VPS Deployment

This application is configured to run on ports:
- **API (Backend)**: 4222
- **Frontend (Vite Dev)**: 4223

For quick deployment on an Ubuntu/Debian server:
1. Upload the folder to the VPS.
2. Run the installation script:
   ```bash
   chmod +x setup.sh
   ./setup.sh
   ```
3. Configure Nginx following the instructions in `NGINX_CONFIG.md`.

---

Created with ❤️ to help you organize your ideas.
