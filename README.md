# 📝 ReNote — HTML, Markdown & Mermaid (v1.7)

[Español](#español) | [English](#english)

---

<a name="español"></a>
## 🇪🇸 Español

Una aplicación de notas moderna, rápida y minimalista construida con **React (Vite)** y **Node.js (Express)**, utilizando **SQLite** como motor de base de datos. Diseñada para ser desplegada fácilmente en un VPS.

### 🚀 Novedades v1.7
- **Editor Visual Avanzado**: Soporte mejorado para colores de texto, resaltados y subrayados que se persisten correctamente al guardar.
- **Tablas en Toolbar**: Nueva interfaz en la barra de herramientas para insertar tablas HTML personalizadas directamente.
- **Centro de Notificaciones**: Ícono de campana dinámico que alerta sobre objetivos próximos a vencer o vencidos.
- **Mejoras de Estabilidad**: Solución a problemas de renderizado de imágenes residuales y optimización de carga de scripts externos.

### 🚀 Novedades v1.6
- **Subida de Imágenes**: Nuevo soporte para insertar imágenes (PNG, JPG, SVG, etc.) directamente en tus notas.
- **Drag & Drop y Clipboard**: Sube imágenes arrastrándolas al editor o pegándolas desde el portapapeles sin configuraciones extra.
- **Gestión Local**: Carpeta `uploads/` dedicada en el servidor para almacenamiento local persistente con límite de 10MB por archivo.
- **Estética Optimizada**: Las imágenes se renderizan automáticamente con bordes redondeados, sombras y diseño responsivo.

### 🚀 Novedades v1.5.2

- **Editor HTML Dedicado**: Nuevo editor de código monoespaciado para el modo "HTML Puro", evitando que el editor visual escape etiquetas HTML.
- **Renderizado HTML Mejorado**: Aislamiento robusto mediante iframes para documentos completos y renderizado directo para fragmentos parciales.
- **Estética de Código**: Nueva interfaz oscura para el editor de HTML que mejora la legibilidad de etiquetas.

### 🚀 Novedades v1.5

- **Buscador Global**: Nueva barra de búsqueda en el Home que permite filtrar notas por título, contenido, fecha, categorías y etiquetas en tiempo real.
- **Listas de Tareas Interactivas**: Ahora puedes marcar/desmarcar tareas directamente desde el visor de notas, y el estado se persistirá automáticamente en la base de datos.
- **Sincronización Inteligente**: Los cambios en los checkboxes de las tareas se sincronizan con el contenido original (HTML/Markdown) sin corromper el formato de la nota.

### 🚀 Historial

#### v1.4
- **Barra de Herramientas Sticky**: El menú del editor Tiptap ahora permanece visible en la parte superior mientras haces scroll.
- **Selector de Tablas Dinámico**: Interfaz visual para insertar tablas de hasta 10x10.
- **Acciones Contextuales**: Herramientas inteligentes para edición rápida de filas y columnas en tablas.
- **Refinamiento UI/UX**: Mejoras en estética con efectos blur y sombras dinámicas.

#### v1.3.1
- **Fix Markdown Renderer**: Restauración de la detección automática de Markdown, Mermaid y bloques de código.
- **Estabilidad**: Mejoras generales en el renderizado de previsualizaciones.

#### v1.3
- **Editor Tiptap**: Migración completa a un editor WYSIWYG potente con soporte para tareas jerárquicas.
- **Sistema de Objetivos**: Gestión de metas diarias, semanales, mensuales y anuales integrada.
- **Calendario Integrado**: Visualización de eventos mediante FullCalendar.
- **Plantillas Cornell**: Soporte para el método Cornell con diseño optimizado.
- **Auto-selección Inteligente**: Pre-selección de categorías al crear notas.
- **Tablas Mejoradas**: Diseño premium con cebras y bordes claros.

#### v1.2
- **Tarjetas de Código Estilo Notion**: Bloques de código con resaltado de sintaxis detallado (hljs).
- **Barra de Herramientas**: Nueva barra para insertar formatos rápidamente.

#### v1.1
- **Ejecución de HTML Completo**: Renderizado en iframes aislados.
- **Bloques HTML vivos**: Renderizado de ` ```html `.

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
├── uploads/           # Carpeta de almacenamiento de imágenes subidas
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

# 📝 ReNote — HTML, Markdown & Mermaid (v1.7)

[Español](#español) | [English](#english)

---

<a name="english"></a>
## 🇺🇸 English

A modern, fast, and minimalist notes application built with **React (Vite)** and **Node.js (Express)**, using **SQLite** as the database engine. Designed for easy deployment on a VPS.

### 🚀 What's New in v1.7
- **Advanced Visual Editor**: Enhanced support for text colors, highlights, and underlines that persist correctly in Markdown.
- **Toolbar Table Tools**: New interface in the toolbar to directly insert custom HTML tables.
- **Notification System**: Dynamic bell icon alerting about upcoming or overdue goal deadlines.
- **Stability Improvements**: Fixed residual image rendering issues and optimized external script loading.

### 🚀 What's New in v1.6
- **Image Uploads**: Full support for inserting images (PNG, JPG, SVG, etc.) directly into your notes.
- **Drag & Drop & Clipboard**: Upload images by dragging them into the editor or pasting from the clipboard effortlessly.
- **Local Management**: Dedicated `uploads/` folder on the server for persistent local storage with a 10MB per file limit.
- **Optimized Aesthetics**: Images are automatically rendered with rounded corners, shadows, and responsive design.

### 🚀 What's New in v1.5.2

- **Dedicated HTML Editor**: New monospaced code editor for "HTML Puro" mode, preventing the visual editor from escaping HTML tags.
- **Enhanced HTML Rendering**: Robust iframe isolation for full documents and direct raw rendering for partial fragments.
- **Code Aesthetics**: New dark-themed interface for the HTML editor to improve tag readability.

### 🚀 What's New in v1.5

- **Global Search**: New search bar in the Home view that allows filtering notes by title, content, date, categories, and tags in real-time.
- **Interactive Task Lists**: You can now check/uncheck tasks directly from the note viewer, and the state will be automatically persisted in the database.
- **Smart Synchronization**: Task checkbox changes are synced with the original content (HTML/Markdown) without corrupting the note's formatting.

### 🚀 History

#### v1.4
- **Sticky Toolbar**: The Tiptap editor menu now stays visible at the top while scrolling.
- **Dynamic Table Selector**: Visual interface to insert tables up to 10x10.
- **Contextual Actions**: Smart tools for quick row and column editing in tables.
- **UI/UX Refinement**: Aesthetic improvements with blur effects and dynamic shadows.

#### v1.3.1
- **Markdown Renderer Fix**: Restored automatic detection of Markdown, Mermaid, and code blocks.
- **Stability**: General improvements in preview rendering.

#### v1.3
- **Tiptap Editor**: Full migration to a powerful WYSIWYG editor with hierarchical task support.
- **Objectives System**: Integrated management for daily, weekly, monthly, and annual goals.
- **Integrated Calendar**: Event visualization via FullCalendar.
- **Cornell Templates**: Cornell method support with optimized design.
- **Smart Auto-selection**: Category pre-selection when creating notes.
- **Enhanced Tables**: Premium design with zebra striping and clear borders.

#### v1.2
- **Notion-Style Code Cards**: Code blocks with detailed syntax highlighting (hljs).
- **Editor Toolbar**: New toolbar to quickly insert formats.

#### v1.1
- **Full HTML Execution**: Rendered in isolated iframes.
- **Live HTML Blocks**: ` ```html ` rendering.

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
├── uploads/           # Uploaded images storage folder
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
