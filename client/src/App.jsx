import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Plus, Tag, ChevronLeft, Save, Edit3, Trash2, BookOpen, X, Loader2, AlertCircle, WifiOff,
  Heading1, Heading2, Heading3, Bold, Italic, List, ListOrdered, CheckSquare, 
  Code, Table as TableIcon, Quote, Minus, Activity, Link as LinkIcon, Image as ImageIcon,
  Calendar as CalendarIcon, Zap, Share2, Download, Filter, MoreHorizontal, CheckCircle, Search, Bell, Check, Heart, PlayCircle, ListMusic,
  SkipForward, SkipBack, Play, Pause, Shuffle, Layout
} from 'lucide-react';
import TiptapEditor from './components/TiptapEditor';
import CalendarView from './components/CalendarView';
import FlashcardMode from './components/FlashcardMode';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import TurndownService from 'turndown';
import TableWizardModal from './components/TableWizardModal';

// La variable VITE_API_URL puede ser una URL absoluta o relativa.
// Si no está definida, usamos la raíz del sitio + /api
const getApiBase = () => {
  const envApi = import.meta.env.VITE_API_URL;
  if (envApi) return envApi;
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/api`;
  }
  return '/api';
};

export const API_BASE = getApiBase();
export const SERVER_URL = API_BASE.replace('/api', '');

console.log('📡 API Base:', API_BASE);
console.log('🖼️ Server URL:', SERVER_URL);

/**
 * Helper to ensure image URLs are absolute.
 * Converts "/uploads/..." to "http://host:port/uploads/..."
 */
export const getAssetUrl = (url) => {
  if (!url) return '';
  // Si ya es una URL absoluta o base64, no hacemos nada
  if (url.startsWith('http') || url.startsWith('data:')) return url;
  
  // Si empieza con /uploads, nos aseguramos de que sea absoluta usando SERVER_URL
  if (url.startsWith('/uploads')) {
    // Si SERVER_URL es relativa o termina en slash, lo manejamos
    const base = SERVER_URL.endsWith('/') ? SERVER_URL.slice(0, -1) : SERVER_URL;
    return `${base}${url}`;
  }
  return url;
};

async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Error desconocido' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

const api = {
  getNotes: (categoryId) => apiFetch(`/notes${categoryId && categoryId !== 'all' ? `?categoryId=${categoryId}` : ''}`),
  getNote: (id) => apiFetch(`/notes/${id}`),
  createNote: (data) => apiFetch('/notes', { method: 'POST', body: JSON.stringify(data) }),
  updateNote: (id, data) => apiFetch(`/notes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteNote: (id) => apiFetch(`/notes/${id}`, { method: 'DELETE' }),
  getCategories: () => apiFetch('/categories'),
  createCategory: (data) => apiFetch('/categories', { method: 'POST', body: JSON.stringify(data) }),
  updateCategory: (id, data) => apiFetch(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCategory: (id) => apiFetch(`/categories/${id}`, { method: 'DELETE' }),
  getTags: () => apiFetch('/tags'),
  createTag: (data) => apiFetch('/tags', { method: 'POST', body: JSON.stringify(data) }),
  deleteTag: (id) => apiFetch(`/tags/${id}`, { method: 'DELETE' }),
  addTagToNote: (noteId, tagId) => apiFetch(`/notes/${noteId}/tags`, { method: 'POST', body: JSON.stringify({ tagId }) }),
  removeTagFromNote: (noteId, tagId) => apiFetch(`/notes/${noteId}/tags/${tagId}`, { method: 'DELETE' }),
  updateNoteTags: (noteId, tagIds) => apiFetch(`/notes/${noteId}/tags`, { method: 'PUT', body: JSON.stringify({ tagIds }) }),
  patchNote: (id, data) => apiFetch(`/notes/${id}`, { method: 'PATCH', body: JSON.stringify(data) }).catch(() => api.updateNote(id, data)), // Fallback a PUT si PATCH no existe
  markAsRead: (id) => apiFetch(`/notes/${id}`, { method: 'PUT', body: JSON.stringify({ notificationRead: true, status: 'completed' }) }),
};

const CATEGORY_COLORS = [
  'bg-blue-100 text-blue-800 border-blue-200',
  'bg-green-100 text-green-800 border-green-200',
  'bg-purple-100 text-purple-800 border-purple-200',
  'bg-red-100 text-red-800 border-red-200',
  'bg-yellow-100 text-yellow-800 border-yellow-200',
  'bg-indigo-100 text-indigo-800 border-indigo-200',
  'bg-pink-100 text-pink-800 border-pink-200',
  'bg-teal-100 text-teal-800 border-teal-200',
  'bg-orange-100 text-orange-800 border-orange-200',
];

// --- Hook para cargar scripts externos (marked + mermaid + highlight.js) ---
function useExternalScripts() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (document.getElementById('marked-script') && window.mermaid && window.hljs) { setReady(true); return; }
    
    // Highlight.js CSS
    const hlcss = document.createElement('link');
    hlcss.rel = 'stylesheet';
    hlcss.href = 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark.min.css';
    document.head.appendChild(hlcss);

    const m = document.createElement('script');
    m.id = 'marked-script';
    m.src = 'https://cdn.jsdelivr.net/npm/marked@12.0.1/marked.min.js';
    
    const mr = document.createElement('script');
    mr.id = 'mermaid-script';
    mr.src = 'https://cdn.jsdelivr.net/npm/mermaid@10.9.0/dist/mermaid.min.js';

    const hl = document.createElement('script');
    hl.id = 'highlight-script';
    hl.src = 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js';

    document.body.appendChild(m);
    document.body.appendChild(mr);
    document.body.appendChild(hl);

    Promise.all([
      new Promise(res => { m.onload = res; }),
      new Promise(res => { mr.onload = res; }),
      new Promise(res => { hl.onload = res; }),
    ]).then(() => {
      window.mermaid?.initialize({ startOnLoad: false, theme: 'default' });
      
      // Función global para copiar código - Versión mejorada
      window.copyCodeToClipboard = async (btn, code) => {
        try {
          if (!code) {
             const card = btn.closest('.code-card');
             code = card?.querySelector('code')?.innerText || '';
          }
          await navigator.clipboard.writeText(code);
          const originalHTML = btn.innerHTML;
          btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-green-500"><polyline points="20 6 9 17 4 12"></polyline></svg> ¡Copiado!';
          btn.classList.add('text-green-500');
          setTimeout(() => {
            btn.innerHTML = originalHTML;
            btn.classList.remove('text-green-500');
          }, 2000);
        } catch (err) {
          console.error('Error al copiar:', err);
          // Fallback para contextos no seguros
          const textArea = document.createElement("textarea");
          textArea.value = code;
          document.body.appendChild(textArea);
          textArea.select();
          try {
            document.execCommand('copy');
            btn.innerHTML = '¡Copiado!';
            setTimeout(() => { btn.innerHTML = originalHTML; }, 2000);
          } catch (e) {
            alert('No se pudo copiar el código automáticamente.');
          }
          document.body.removeChild(textArea);
        }
      };

      setReady(true);
    });
  }, []);
  return ready;
}

// --- Componente de error ---
function ErrorBanner({ message, onDismiss }) {
  if (!message) return null;
  return (
    <div className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl shadow-lg max-w-sm animate-in slide-in-from-top-2">
      <AlertCircle size={18} className="shrink-0" />
      <span className="text-sm">{message}</span>
      <button onClick={onDismiss} className="ml-2 hover:text-red-900"><X size={16} /></button>
    </div>
  );
}

// --- App Principal ---
export default function App() {
  const [notes, setNotes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [activeCategoryId, setActiveCategoryId] = useState('all');
  const [activeObjectiveFilter, setActiveObjectiveFilter] = useState('none');
  const [view, setView] = useState('home');
  const [activeNoteId, setActiveNoteId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showReviewOnly, setShowReviewOnly] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const scriptsLoaded = useExternalScripts();

  // Calcular notificaciones basadas en deadlines de objetivos
  useEffect(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    
    const expiredOrToday = notes.filter(n => {
      if (!n.deadline || n.objectiveType === 'none' || n.notificationRead) return false;
      const deadlineStr = n.deadline.split('T')[0];
      return deadlineStr <= todayStr;
    }).map(n => ({
      id: n.id,
      title: n.title,
      deadline: n.deadline,
      isExpired: n.deadline.split('T')[0] < todayStr,
      isToday: n.deadline.split('T')[0] === todayStr,
    }));
    
    setNotifications(expiredOrToday);
  }, [notes]);

  const showError = (msg) => setError(msg);
  const clearError = () => setError(null);

  // Carga inicial
  useEffect(() => {
    setLoading(true);
    Promise.all([api.getCategories(), api.getNotes(), api.getTags()])
      .then(([cats, nts, tgs]) => { 
        setCategories(cats); 
        setNotes(nts); 
        setTags(tgs);
      })
      .catch((err) => {
        console.error(err);
        showError('No se pudo conectar con el servidor. ¿Está corriendo el backend?');
      })
      .finally(() => setLoading(false));
  }, []);

  // Recargar notas al cambiar categoría u objetivo
  useEffect(() => {
    if (loading) return;
    api.getNotes(activeCategoryId)
      .then(nts => {
        if (activeObjectiveFilter !== 'none') {
          setNotes(nts.filter(n => n.objectiveType === activeObjectiveFilter));
        } else {
          setNotes(nts);
        }
      })
      .catch(() => showError('Error al cargar las notas.'));
  }, [activeCategoryId, activeObjectiveFilter]);

  const handleCreateNote = () => { setActiveNoteId(null); setView('editor'); };
  
  const handleEditNote = (id) => { setActiveNoteId(id); setView('editor'); };
  const handleViewNote = (id) => { setActiveNoteId(id); setView('viewer'); };

  const handleSaveNote = async (noteData) => {
    try {
      const { tagIds, ...data } = noteData;
      let finalNote;
      if (activeNoteId) {
        finalNote = await api.updateNote(activeNoteId, data);
        await api.updateNoteTags(activeNoteId, tagIds);
        // Recargar nota completa para tener tags actualizados
        finalNote = await api.getNote(activeNoteId);
        setNotes(ns => ns.map(n => n.id === activeNoteId ? finalNote : n));
      } else {
        finalNote = await api.createNote(data);
        await api.updateNoteTags(finalNote.id, tagIds);
        finalNote = await api.getNote(finalNote.id);
        setNotes(ns => [finalNote, ...ns]);
        setActiveNoteId(finalNote.id);
      }
      setView('home');
    } catch (err) {
      showError(`Error al guardar: ${err.message}`);
    }
  };

  const handleDeleteNote = async (noteId) => {
    if (!window.confirm('¿Estás seguro de eliminar esta nota?')) return;
    try {
      await api.deleteNote(noteId);
      setNotes(ns => ns.filter(n => n.id !== noteId));
      setView('home');
    } catch (err) {
      showError(`Error al eliminar: ${err.message}`);
    }
  };

  const handleAddCategory = async (name, parentId = null) => {
    const color = parentId 
      ? (categories.find(c => c.id === parentId)?.color || CATEGORY_COLORS[0])
      : CATEGORY_COLORS[Math.floor(Math.random() * CATEGORY_COLORS.length)];
      
    try {
      const newCat = await api.createCategory({ name, color, parentId });
      setCategories(cs => [...cs, newCat]);
      return newCat.id;
    } catch (err) {
      showError(`Error al crear categoría: ${err.message}`);
    }
  };

  const handleUpdateCategory = async (id, data) => {
    try {
      const updated = await api.updateCategory(id, data);
      setCategories(cs => cs.map(c => c.id === id ? { ...c, ...updated } : c));
    } catch (err) {
      showError(`Error al editar categoría: ${err.message}`);
    }
  };

  const handleDeleteCategory = async (id) => {
    const category = categories.find(c => c.id === id);
    const hasSubcats = categories.some(c => c.parentId === id);
    let msg = `¿Estás seguro de eliminar la categoría "${category?.name}"?`;
    if (hasSubcats) msg += "\n\nIMPORTANTE: Esto también eliminará todas sus subcategorías.";
    
    if (!window.confirm(msg)) return;
    
    try {
      await api.deleteCategory(id);
      // Eliminar recursivamente en el estado (el backend ya lo hace en DB)
      setCategories(cs => cs.filter(c => c.id !== id && c.parentId !== id));
      if (activeCategoryId === id || categories.some(c => c.id === activeCategoryId && c.parentId === id)) {
        setActiveCategoryId('all');
      }
    } catch (err) {
      showError(`Error al eliminar categoría: ${err.message}`);
    }
  };

  const handleMarkAsRead = async (noteId) => {
    try {
      const note = notes.find(n => n.id === noteId);
      if (!note) return;
      
      // Actualizamos localmente primero para mejor UX
      setNotes(ns => ns.map(n => n.id === noteId ? { ...n, notificationRead: true, status: 'completed' } : n));
      
      // Llamada al API
      await api.markAsRead(noteId);
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };
  
  const handleToggleReview = async (noteId) => {
    try {
      const note = notes.find(n => n.id === noteId);
      if (!note) return;
      const updatedNote = { ...note, isReview: !note.isReview };
      
      // Actualización optimista
      setNotes(ns => ns.map(n => n.id === noteId ? updatedNote : n));
      
      await api.updateNote(noteId, updatedNote);
    } catch (err) {
      showError(`Error al cambiar estado de repaso: ${err.message}`);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const idsToMark = notifications.map(n => n.id);
      if (idsToMark.length === 0) return;

      // Actualizamos localmente
      setNotes(ns => ns.map(n => idsToMark.includes(n.id) ? { ...n, notificationRead: true, status: 'completed' } : n));

      // Llamadas al API en paralelo
      await Promise.all(idsToMark.map(id => api.markAsRead(id)));
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  const handleExportPDF = async (note) => {
    const element = document.getElementById('note-render-area');
    if (!element) return;

    try {
      // Usamos mm para mayor precisión en el diseño de página
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = 210;
      const pageHeight = 297;
      const margin = 20; 
      const contentWidth = pageWidth - (margin * 2);
      const contentHeight = pageHeight - (margin * 2);

      // Guardar posición de scroll y mover al inicio para captura limpia
      const scrollPos = window.scrollY;
      window.scrollTo(0, 0);

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        scrollX: 0,
        scrollY: 0
      });

      // Restaurar posición de scroll original
      window.scrollTo(0, scrollPos);

      const imgData = canvas.toDataURL('image/png');
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      
      const scaledHeight = (imgHeight * contentWidth) / imgWidth;
      
      let heightLeft = scaledHeight;
      let position = margin;
      let pageNumber = 1;
      
      const addPageInfo = (num) => {
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Página ${num}`, pageWidth - margin, pageHeight - 10, { align: 'right' });
      };

      // Primera página
      doc.addImage(imgData, 'PNG', margin, position, contentWidth, scaledHeight);
      addPageInfo(pageNumber);
      heightLeft -= contentHeight;

      // Páginas adicionales
      while (heightLeft > 0) {
        position = (heightLeft - scaledHeight) + margin;
        doc.addPage();
        pageNumber++;
        doc.addImage(imgData, 'PNG', margin, position, contentWidth, scaledHeight);
        addPageInfo(pageNumber);
        heightLeft -= contentHeight;
      }

      doc.save(`${note.title || 'nota'}.pdf`);
    } catch (err) {
      console.error('Error al exportar PDF:', err);
      showError('Error al generar PDF. Por favor, refresca la página (F5) e inténtalo de nuevo.');
    }
  };

  const handleExportMD = (note) => {
    const turndownService = new TurndownService();
    turndownService.keep(['table', 'thead', 'tbody', 'tr', 'th', 'td']);
    const markdown = `# ${note.title}\n\n${turndownService.turndown(note.content)}`;
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${note.title || 'nota'}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <Loader2 size={36} className="animate-spin text-indigo-500" />
          <p className="font-medium">Conectando con la base de datos de ReNote...</p>
        </div>
      </div>
    );
  }

  const activeNote = notes.find(n => n.id === activeNoteId);
  const activeCategory = categories.find(c => c.id === activeNote?.categoryId);

  // Lógica de filtrado para el buscador
  const filteredNotes = notes.filter(note => {
    if (!searchTerm.trim()) return true;
    
    const searchLower = searchTerm.toLowerCase();
    const category = categories.find(c => c.id === note.categoryId);
    const parentCategory = category?.parentId ? categories.find(c => c.id === category.parentId) : null;
    
    // Limpiar contenido para buscar (eliminar tags HTML/MD)
    const stripContent = (text) => {
      if (!text) return '';
      return text.replace(/<[^>]*>?/gm, '').replace(/[#*`_>\[\]\(\)]/g, '').toLowerCase();
    };
    
    const matchesTitle = note.title.toLowerCase().includes(searchLower);
    const matchesContent = stripContent(note.content).includes(searchLower);
    const matchesCategory = category?.name.toLowerCase().includes(searchLower);
    const matchesSubcategory = parentCategory?.name.toLowerCase().includes(searchLower);
    const matchesTags = note.tags?.some(t => t.name.toLowerCase().includes(searchLower));
    
    // Formatos de fecha comunes para buscar
    const noteDate = new Date(note.updatedAt);
    const matchesDate = noteDate.toLocaleDateString().includes(searchTerm) || 
                       noteDate.toISOString().includes(searchTerm);
    
    const matchesReview = showReviewOnly ? note.isReview : true;
    
    return matchesReview && (matchesTitle || matchesContent || matchesCategory || matchesSubcategory || matchesTags || matchesDate);
  });

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      <style>{`
        .markdown-body { font-family: 'Inter', sans-serif; color: #37352f; line-height: 1.6; }
        .markdown-body h1 { font-size: 2.25rem; font-weight: 700; margin-top: 1.5em; margin-bottom: 0.5em; color: #37352f; border-bottom: none; }
        .markdown-body h2 { font-size: 1.875rem; font-weight: 600; margin-top: 1.5em; margin-bottom: 0.5em; color: #37352f; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.3em; }
        .markdown-body h3 { font-size: 1.5rem; font-weight: 600; margin-top: 1.25em; margin-bottom: 0.5em; color: #37352f; }
        .markdown-body p { margin-bottom: 1.25em; line-height: 1.6; color: #37352f; }
        .markdown-body code { background-color: #f1f1ef; padding: 0.2em 0.4em; border-radius: 3px; font-family: ui-monospace, monospace; font-size: 0.9em; color: #eb5757; }
        
        /* Imágenes */
        .markdown-body img { max-width: 100%; height: auto; border-radius: 0.75rem; border: 1px solid #e2e8f0; margin: 1.5rem auto; display: block; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
        
        .rendered-html-block img { max-width: 100%; height: auto; border-radius: 0.5rem; }
        
        /* Code Cards Estilo Notion */
        .code-card { background-color: #1e293b; border-radius: 0.75rem; margin-bottom: 1.5em; overflow: hidden; border: 1px solid #334155; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
        .code-card-header { display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 1rem; background-color: #0f172a; border-bottom: 1px solid #334155; }
        .code-lang { color: #94a3b8; font-family: ui-monospace, monospace; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
        .copy-btn { color: #94a3b8; font-size: 0.75rem; font-weight: 500; padding: 0.25rem 0.5rem; border-radius: 0.375rem; transition: all 0.2s; display: flex; align-items: center; gap: 0.25rem; background: transparent; border: none; cursor: pointer; }
        .copy-btn:hover { background-color: #1e293b; color: #f8fafc; }
        
        /* Dropdown de lenguaje en el editor */
        .code-card select { appearance: none; background: transparent; border: none; color: #94a3b8; font-family: ui-monospace, monospace; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; cursor: pointer; outline: none; }
        .code-card select option { background: #0f172a; color: #f8fafc; }
        
        .markdown-body pre { background-color: transparent; color: #f8fafc; padding: 1rem; margin: 0; border-radius: 0; overflow-x: auto; flex-grow: 1; }
        .markdown-body pre code { background-color: transparent; padding: 0; color: inherit; font-family: 'JetBrains Mono', ui-monospace, monospace; font-size: 0.9rem; line-height: 1.5; white-space: pre; }
        
        /* Números de línea */
        .line-numbers-col { 
          display: flex; 
          flex-direction: column; 
          font-family: ui-monospace, monospace; 
          font-size: 0.75rem; 
          color: #475569; 
          min-width: 2.5rem;
          user-select: none;
        }
        .line-number {
          line-height: 1.5; /* Debe coincidir con el line-height del código */
          height: 1.35rem; /* Ajuste fino */
          display: block;
        }
        .code-content-wrapper { background-color: #0f172a; display: flex; overflow-x: auto; }
        .code-card-footer { user-select: none; }
        
        /* Ajustes de highlight.js para que combinen con la tarjeta */
        .hljs { background: transparent !important; padding: 0 !important; }
        .markdown-body blockquote { border-left: 4px solid #cbd5e1; padding-left: 1em; color: #64748b; font-style: italic; margin-bottom: 1em; }
        .markdown-body a { color: #2563eb; text-decoration: underline; }
        .markdown-body table { 
          width: 100%; 
          border-collapse: separate; 
          border-spacing: 0; 
          border: 1px solid #e2e8f0; 
          border-radius: 0.75rem; 
          overflow: hidden; 
          margin-bottom: 1.5rem; 
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
        }
        .markdown-body th, .markdown-body td { 
          border: 1px solid #f1f5f9; 
          padding: 0.875rem 1.25rem; 
        }
        .markdown-body th { 
          background: #f8fafc; 
          font-weight: 700; 
          color: #1e293b; 
          text-align: left; 
          font-size: 0.875rem;
          text-transform: uppercase;
          letter-spacing: 0.025em;
          border-bottom: 2px solid #e2e8f0;
        }
        .markdown-body tr:nth-child(even) {
          background-color: #fcfcfd;
        }
        .markdown-body tr:hover td {
          background-color: #f8fafc;
        }
        .mermaid { background: white; padding: 1rem; border-radius: 0.5rem; border: 1px solid #e2e8f0; margin-bottom: 1em; display: flex; justify-content: center; overflow-x: auto; }
        .html-note-wrapper { position: relative; width: 100%; border-radius: 0.75rem; overflow: hidden; border: 1px solid #e2e8f0; background: white; }
        .html-note-iframe { width: 100%; min-height: 600px; border: 0; display: block; }

        /* Code Editor Mode Styles */
        .html-code-editor {
          width: 100%;
          min-height: 500px;
          padding: 1.5rem;
          font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
          font-size: 0.95rem;
          line-height: 1.7;
          background-color: #f8fafc;
          color: #1e293b;
          border: 1px solid #e2e8f0;
          border-radius: 0.75rem;
          outline: none;
          resize: vertical;
          tab-size: 2;
        }
        .html-code-editor:focus {
          border-color: #4f46e5;
          background-color: #ffffff;
          box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.1);
        }
        .html-code-editor::placeholder {
          color: #94a3b8;
          opacity: 0.7;
        }

        /* Toolbar Styles */
        .editor-toolbar { display: flex; flex-wrap: wrap; gap: 0.25rem; padding: 0.5rem; background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(12px); border-bottom: 1px solid #e2e8f0; border-radius: 0.75rem 0.75rem 0 0; margin-bottom: 0; position: sticky; top: 0; z-index: 10; box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); }
        .toolbar-group { display: flex; gap: 0.25rem; padding: 0 0.5rem; border-right: 1px solid #e2e8f0; }
        .toolbar-group:last-child { border-right: none; }
        .toolbar-btn { p: 0.5rem; color: #64748b; border-radius: 0.5rem; transition: all 0.2s; display: flex; align-items: center; justify-content: center; }
        .toolbar-btn:hover { background: #f1f5f9; color: #4f46e5; transform: translateY(-1px); }
        .toolbar-btn active { background: #eef2ff; color: #4f46e5; }

        /* Task List Styles en el Visor */
        .markdown-body ul[data-type="taskList"] {
          list-style: none;
          padding-left: 0.5rem;
        }
        .markdown-body ul[data-type="taskList"] li {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          margin-bottom: 0.5rem;
        }
        .markdown-body ul[data-type="taskList"] li input[type="checkbox"] {
          width: 1.2rem;
          height: 1.2rem;
          margin-top: 0.35rem;
          cursor: pointer;
          accent-color: #4f46e5;
          flex-shrink: 0;
        }
        .markdown-body ul[data-type="taskList"] li > div {
          flex: 1;
          min-width: 0;
        }
        .markdown-body ul[data-type="taskList"] li[data-checked="true"] > div {
          text-decoration: line-through;
          color: #94a3b8;
        }

        /* Notion Callouts */
        .notion-callout {
          display: flex;
          gap: 1rem;
          padding: 1rem 1.25rem;
          border-radius: 0.75rem;
          margin-bottom: 1.5rem;
          border: 1px solid transparent;
          font-size: 1rem;
          line-height: 1.6;
        }
        .notion-callout.note { background-color: #eff6ff; border-color: #bfdbfe; color: #1e3a8a; }
        .notion-callout.tip { background-color: #f0fdf4; border-color: #bbf7d0; color: #14532d; }
        .notion-callout.important { background-color: #fffbeb; border-color: #fef3c7; color: #78350f; }
        .notion-callout.warning { background-color: #fef2f2; border-color: #fecaca; color: #7f1d1d; }
        .notion-callout > div { flex: 1; }
        .notion-callout svg { flex-shrink: 0; margin-top: 0.15rem; }

        /* Premium Divider */
        .notion-divider {
          border: 0;
          height: 1px;
          background: #e2e8f0;
          margin: 2rem 0;
          position: relative;
        }
        .notion-divider::after {
          content: "";
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          width: 8px;
          height: 8px;
          background: #e2e8f0;
          border-radius: 50%;
        }
      `}</style>

      <ErrorBanner message={error} onDismiss={clearError} />

      {view === 'home' && (
        <HomeView
          notes={filteredNotes}
          categories={categories}
          activeCategoryId={activeCategoryId}
          setActiveCategoryId={(id) => { setActiveCategoryId(id); setActiveObjectiveFilter('none'); }}
          activeObjectiveFilter={activeObjectiveFilter}
          setActiveObjectiveFilter={(filter) => { setActiveObjectiveFilter(filter); setActiveCategoryId('all'); }}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          setView={setView}
          onCreateNote={handleCreateNote}
          onViewNote={handleViewNote}
          onAddCategory={handleAddCategory}
          onUpdateCategory={handleUpdateCategory}
          onDeleteCategory={handleDeleteCategory}
          notifications={notifications}
          onMarkAsRead={handleMarkAsRead}
          onMarkAllAsRead={handleMarkAllAsRead}
          showReviewOnly={showReviewOnly}
          setShowReviewOnly={setShowReviewOnly}
          onToggleReview={handleToggleReview}
        />
      )}
      {view === 'editor' && (
        <EditorView
          key={activeNoteId || 'new'}
          note={activeNote}
          categories={categories}
          tags={tags}
          defaultCategoryId={activeCategoryId}
          onSave={handleSaveNote}
          onCancel={() => setView(activeNoteId ? 'viewer' : 'home')}
          scriptsLoaded={scriptsLoaded}
          onAddTag={async (name) => {
            const newTag = await api.createTag({ name, color: 'bg-indigo-100 text-indigo-700' });
            setTags(ts => [...ts, newTag]);
            return newTag;
          }}
        />
      )}
      {view === 'viewer' && (
        <ViewerView
          key={activeNoteId}
          note={activeNote}
          category={activeCategory}
          onEdit={() => handleEditNote(activeNoteId)}
          onBack={() => setView('home')}
          onDelete={() => handleDeleteNote(activeNoteId)}
          onFlashcard={() => setView('flashcards')}
          onExportPDF={() => handleExportPDF(activeNote)}
          onExportMD={() => handleExportMD(activeNote)}
          onUpdateContent={async (newContent) => {
            try {
              const updated = await api.updateNote(activeNoteId, { ...activeNote, content: newContent });
              setNotes(ns => ns.map(n => n.id === activeNoteId ? { ...n, content: newContent } : n));
            } catch (err) {
              console.error('Error auto-saving task state:', err);
            }
          }}
          scriptsLoaded={scriptsLoaded}
          onToggleReview={handleToggleReview}
        />
      )}
      {view === 'review' && (
        <ReviewPlaylistView
          notes={notes.filter(n => n.isReview)}
          onBack={() => setView('home')}
          onViewNote={(id) => { setActiveNoteId(id); setView('viewer'); }}
          scriptsLoaded={scriptsLoaded}
          categories={categories}
          onToggleReview={handleToggleReview}
        />
      )}
      {view === 'calendar' && (
        <CalendarView
          notes={notes}
          categories={categories}
          onBack={() => setView('home')}
          onViewNote={(id) => { setActiveNoteId(id); setView('viewer'); }}
        />
      )}
      {view === 'flashcards' && (
        <FlashcardMode
          note={activeNote}
          onBack={() => setView('viewer')}
        />
      )}
    </div>
  );
}

function HomeView({ 
  notes, categories, activeCategoryId, setActiveCategoryId, 
  activeObjectiveFilter, setActiveObjectiveFilter, searchTerm, setSearchTerm, setView,
  onCreateNote, onViewNote, onAddCategory, onUpdateCategory, onDeleteCategory,
  notifications, onMarkAsRead, onMarkAllAsRead,
  showReviewOnly, setShowReviewOnly, onToggleReview
}) {
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [addingToParentId, setAddingToParentId] = useState(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showObjectiveMenu, setShowObjectiveMenu] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [saving, setSaving] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef(null);

  // Cerrar dropdowns al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notificationRef.current && !notificationRef.current.contains(e.target)) setShowNotifications(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSaveCategory = async () => {
    if (!newCategoryName.trim()) return;
    setSaving(true);
    await onAddCategory(newCategoryName.trim(), addingToParentId);
    setNewCategoryName('');
    setIsAddingCategory(false);
    setAddingToParentId(null);
    setSaving(false);
  };

  const startEditing = (cat) => {
    setEditingId(cat.id);
    setEditingName(cat.name);
  };

  // Agrupar categorías (Padres e hijos)
  const rootCategories = categories.filter(c => !c.parentId);
  
  // Determinar el padre activo para mostrar sus subcategorías
  const activeCategory = categories.find(c => c.id === activeCategoryId);
  const activeRootId = activeCategoryId === 'all' ? null : (activeCategory?.parentId || activeCategoryId);
  const activeRoot = categories.find(c => c.id === activeRootId);
  
  const subCategories = activeRootId ? categories.filter(c => c.parentId === activeRootId) : [];

  const handleUpdate = async () => {
    if (!editingName.trim()) return;
    setSaving(true);
    await onUpdateCategory(editingId, { name: editingName.trim() });
    setEditingId(null);
    setSaving(false);
  };

  const handleWheel = (e) => {
    const container = e.currentTarget;
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      container.scrollLeft += e.deltaY;
    }
  };

  const renderCategoryButton = (cat, isSub = false) => {
    const isActive = activeCategoryId === cat.id;
    const isEditing = editingId === cat.id;

    return (
      <div key={cat.id} className="relative group flex items-center shrink-0">
        {isEditing ? (
          <div className="flex items-center gap-1 bg-white border border-indigo-300 rounded-full px-2 py-1 shadow-sm">
            <input
              autoFocus
              className="text-sm outline-none w-24 bg-transparent"
              value={editingName}
              onChange={e => setEditingName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleUpdate()}
              onBlur={() => !saving && setEditingId(null)}
            />
            <button onClick={handleUpdate} className="p-1 text-green-600 hover:text-green-700">
              <Save size={14} />
            </button>
          </div>
        ) : (
          <div className="flex items-center">
            <div
              onClick={() => setActiveCategoryId(cat.id)}
              className={`cursor-pointer whitespace-nowrap px-3 py-2 rounded-full text-xs font-medium transition-colors border flex items-center gap-1.5 ${
                isActive ? `${cat.color} ring-1 ring-offset-1 ring-indigo-400` : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              } ${isSub ? 'opacity-90' : ''}`}
            >
              {cat.name}
              <div className="flex items-center gap-1 ml-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={(e) => { e.stopPropagation(); startEditing(cat); }}
                  className="p-1 hover:bg-black/5 rounded text-slate-400 hover:text-indigo-600"
                  title="Editar"
                ><Edit3 size={11} /></button>
                <button 
                  onClick={(e) => { e.stopPropagation(); onDeleteCategory(cat.id); }}
                  className="p-1 hover:bg-black/5 rounded text-slate-400 hover:text-red-500"
                  title="Eliminar"
                ><Trash2 size={11} /></button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full max-w-4xl mx-auto pb-24 min-h-screen bg-white shadow-xl">
      <header className="bg-white px-4 py-6 shadow-sm sticky top-0 z-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div className="flex items-center gap-6 flex-grow w-full md:w-auto mr-4">
            <div className="flex items-center gap-2 text-slate-900 shrink-0">
              <BookOpen size={24} className="text-indigo-600" />
              <h1 className="text-xl font-bold tracking-tight hidden lg:block">ReNote</h1>
            </div>
            
            <div className="relative flex-grow max-w-md group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                <Search size={18} />
              </div>
              <input
                type="text"
                placeholder="Buscar por título, contenido, fecha o tags..."
                className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <button
                onClick={() => setShowObjectiveMenu(!showObjectiveMenu)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all font-medium border ${
                  activeObjectiveFilter !== 'none' 
                    ? 'bg-indigo-50 border-indigo-200 text-indigo-700' 
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Zap size={18} /> 
                {activeObjectiveFilter === 'none' ? 'Objetivos' : 
                 activeObjectiveFilter === 'daily' ? 'Diarios' :
                 activeObjectiveFilter === 'weekly' ? 'Semanales' :
                 activeObjectiveFilter === 'monthly' ? 'Mensuales' : 'Anuales'}
              </button>
              
              {showObjectiveMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-xl z-30 py-2 animate-in fade-in zoom-in-95 duration-100">
                  <button onClick={() => { setActiveObjectiveFilter('none'); setShowObjectiveMenu(false); }} className="w-full text-left px-4 py-2 hover:bg-slate-50 text-sm font-medium text-slate-700">Todos</button>
                  <div className="border-t border-slate-100 my-1"></div>
                  <button onClick={() => { setActiveObjectiveFilter('daily'); setShowObjectiveMenu(false); }} className="w-full text-left px-4 py-2 hover:bg-slate-50 text-sm flex items-center gap-2 text-slate-600"><div className="w-2 h-2 rounded-full bg-blue-500"></div> Diarios</button>
                  <button onClick={() => { setActiveObjectiveFilter('weekly'); setShowObjectiveMenu(false); }} className="w-full text-left px-4 py-2 hover:bg-slate-50 text-sm flex items-center gap-2 text-slate-600"><div className="w-2 h-2 rounded-full bg-green-500"></div> Semanales</button>
                  <button onClick={() => { setActiveObjectiveFilter('monthly'); setShowObjectiveMenu(false); }} className="w-full text-left px-4 py-2 hover:bg-slate-50 text-sm flex items-center gap-2 text-slate-600"><div className="w-2 h-2 rounded-full bg-purple-500"></div> Mensuales</button>
                  <button onClick={() => { setActiveObjectiveFilter('yearly'); setShowObjectiveMenu(false); }} className="w-full text-left px-4 py-2 hover:bg-slate-50 text-sm flex items-center gap-2 text-slate-600"><div className="w-2 h-2 rounded-full bg-red-500"></div> Anuales</button>
                </div>
              )}
            </div>

            <button
              onClick={() => setView('calendar')}
              className="flex items-center gap-2 px-4 py-2 bg-slate-50 text-slate-600 rounded-xl hover:bg-slate-100 transition-all font-medium border border-slate-200"
            >
              <CalendarIcon size={18} /> Calendario
            </button>

            {/* Botón de Repaso (Playlist) */}
            <button
              onClick={() => setView('review')}
              className="flex items-center gap-2 px-4 py-2 bg-rose-50 border-rose-200 text-rose-600 rounded-xl hover:bg-rose-100 transition-all font-medium border"
              title="Abrir playlist de repaso"
            >
              <ListMusic size={18} /> 
              <span className="hidden sm:inline">Repaso</span>
            </button>



            {/* Campana de Notificaciones */}
            <div className="relative" ref={notificationRef}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className={`relative flex items-center gap-2 px-3 py-2 rounded-xl transition-all font-medium border ${
                  showNotifications ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Bell size={18} />
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full border-2 border-white">
                    {notifications.length}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-72 bg-white border border-slate-200 rounded-xl shadow-xl z-30 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                  <div className="p-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase text-slate-500 tracking-wider">Notificaciones</h3>
                    {notifications.length > 0 && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); onMarkAllAsRead(); }}
                        className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 uppercase"
                      >
                        Marcar todo como leído
                      </button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto custom-scrollbar">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-slate-400">
                        <Bell size={24} className="mx-auto mb-2 opacity-20" />
                        <p className="text-sm">No hay plazos vencidos</p>
                      </div>
                    ) : (
                      notifications.map(note => (
                        <div 
                          key={note.id} 
                          onClick={() => { onViewNote(note.id); setShowNotifications(false); }}
                          className="p-3 border-b border-slate-50 hover:bg-slate-50 cursor-pointer group transition-colors"
                        >
                          <div className="flex justify-between items-center gap-2">
                            <div className="flex-grow min-w-0">
                              <div className="flex justify-between items-start gap-2">
                                <h4 className="text-sm font-semibold text-slate-800 line-clamp-1 group-hover:text-indigo-600 transition-colors">{note.title || 'Sin título'}</h4>
                                {note.isExpired ? (
                                  <span className="shrink-0 text-[10px] px-1.5 py-0.5 bg-red-100 text-red-700 rounded-md font-bold uppercase">Vencido</span>
                                ) : (
                                  <span className="shrink-0 text-[10px] px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded-md font-bold uppercase">Hoy</span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                                <CalendarIcon size={10} /> {new Date(note.deadline).toLocaleDateString()}
                              </p>
                            </div>
                            <button
                              onClick={(e) => { e.stopPropagation(); onMarkAsRead(note.id); }}
                              className="shrink-0 p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all"
                              title="Marcar como leído y completar tarea"
                            >
                              <Check size={16} />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* NIVEL 1: Categorías Raíz */}
        <div 
          onWheel={handleWheel}
          className="flex items-center flex-nowrap gap-2 overflow-x-auto py-3 -mx-4 px-4 custom-scrollbar border-b border-slate-50"
        >
          <button
            onClick={() => setActiveCategoryId('all')}
            className={`whitespace-nowrap px-3 py-2 rounded-full text-xs font-medium transition-colors border shrink-0 ${activeCategoryId === 'all' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
          >Todas</button>
          
          {rootCategories.map(cat => renderCategoryButton(cat))}

          {(isAddingCategory && !addingToParentId) ? (
            <div className="flex items-center gap-1 bg-white border border-indigo-300 rounded-full pr-1 pl-3 py-1 ml-2 shadow-md shrink-0">
              <input
                type="text"
                autoFocus
                placeholder="Raíz..."
                className="text-sm outline-none w-24 bg-transparent text-slate-700"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveCategory()}
              />
              <button onClick={handleSaveCategory} disabled={saving} className="p-1 bg-indigo-100 text-indigo-600 rounded-full">
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              </button>
              <button onClick={() => setIsAddingCategory(false)} className="p-1 text-slate-400"><X size={14} /></button>
            </div>
          ) : (
            <button
              onClick={() => { setIsAddingCategory(true); setAddingToParentId(null); }}
              className="flex items-center gap-1 whitespace-nowrap px-2.5 py-2 rounded-full text-xs font-medium text-slate-400 border border-dashed border-slate-200 hover:bg-slate-50 shrink-0"
            ><Plus size={14} /> Nueva</button>
          )}
        </div>

        {/* NIVEL 2: Subcategorías (Solo si hay un padre seleccionado) */}
        {activeRootId && (
          <div 
            onWheel={handleWheel}
            className="flex items-center flex-nowrap gap-2 overflow-x-auto py-2 -mx-4 px-4 custom-scrollbar bg-slate-50/50 animate-in slide-in-from-top-1 duration-200"
          >
            <div className="text-[10px] uppercase font-bold text-slate-400 mr-2 border-r pr-2 flex items-center gap-1 shrink-0">
              <Tag size={10} /> {activeRoot?.name}
            </div>
            
            <button
              onClick={() => setActiveCategoryId(activeRootId)}
              className={`whitespace-nowrap px-3 py-1 rounded-full text-xs font-medium transition-all border ${
                activeCategoryId === activeRootId ? 'bg-white shadow-sm border-indigo-200 text-indigo-600' : 'text-slate-500 border-transparent hover:text-slate-800'
              }`}
            >Todo {activeRoot?.name}</button>

            {subCategories.map(sub => renderCategoryButton(sub, true))}

            {(isAddingCategory && addingToParentId) ? (
              <div className="flex items-center gap-1 bg-white border border-indigo-300 rounded-full pr-1 pl-3 py-0.5 ml-2 shadow-sm shrink-0">
                <input
                  type="text"
                  autoFocus
                  placeholder="Sub..."
                  className="text-xs outline-none w-20 bg-transparent text-slate-700"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveCategory()}
                />
                <button onClick={handleSaveCategory} disabled={saving} className="p-1 text-indigo-600">
                  {saving ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                </button>
                <button onClick={() => { setIsAddingCategory(false); setAddingToParentId(null); }} className="p-1 text-slate-400"><X size={12} /></button>
              </div>
            ) : (
              <button
                onClick={() => { setIsAddingCategory(true); setAddingToParentId(activeRootId); }}
                className="flex items-center gap-1 whitespace-nowrap px-2 py-1 rounded-full text-xs font-medium text-slate-400 border border-dashed border-slate-200 hover:text-indigo-600 shrink-0"
              ><Plus size={14} /> Sub</button>
            )}
          </div>
        )}
      </header>

      <main className="p-4">
        {notes.length === 0 ? (
          <div className="text-center py-20 text-slate-400 flex flex-col items-center animate-in fade-in duration-500">
            {showReviewOnly ? <Heart size={48} className="mb-4 opacity-20 text-rose-500" /> : <Tag size={48} className="mb-4 opacity-50" />}
            <p className="text-lg font-medium">
              {showReviewOnly ? 'Tu lista de repaso está vacía.' : 'No hay notas en esta categoría.'}
            </p>
            <p className="text-sm mt-1">
              {showReviewOnly ? 'Marca notas con el corazón para tenerlas a mano.' : '¡Crea una tocando el botón de abajo!'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {notes.map(note => {
              const category = categories.find(c => c.id === note.categoryId);
              // Limpieza robusta para la previsualización
              const stripContent = (text) => {
                if (!text) return '';
                return text
                  .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Eliminar scripts
                  .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')   // Eliminar estilos
                  .replace(/<[^>]*>?/gm, '') // Eliminar otras etiquetas HTML
                  .replace(/[#*`_>\[\]\(\)]/g, '') // Eliminar Markdown común
                  .replace(/\s+/g, ' ') // Normalizar espacios
                  .trim();
              };
              const cleanContent = stripContent(note.content).substring(0, 120);
              return (
                <div
                  key={note.id}
                  onClick={() => onViewNote(note.id)}
                  className="bg-white rounded-xl p-5 border border-slate-200 flex flex-col h-56 cursor-pointer hover:border-indigo-300 hover:shadow-sm transition-all group relative"
                >
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-semibold text-lg text-slate-800 line-clamp-2 leading-tight group-hover:text-indigo-600 transition-colors">
                      {note.title || 'Sin Título'}
                    </h3>
                    <button
                      onClick={(e) => { e.stopPropagation(); onToggleReview(note.id); }}
                      className={`p-1.5 rounded-full transition-all ${
                        note.isReview ? 'text-rose-500 bg-rose-50' : 'text-slate-300 hover:text-rose-400 hover:bg-slate-50'
                      }`}
                    >
                      <Heart size={18} fill={note.isReview ? "currentColor" : "none"} />
                    </button>
                  </div>
                  <p className="text-slate-500 text-sm flex-grow line-clamp-3 leading-relaxed">
                    {cleanContent || 'No hay contenido adicional.'}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2 items-center justify-between border-t border-slate-50 pt-3">
                    <div className="flex items-center gap-2 overflow-hidden">
                      {category && (
                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${category.color} truncate max-w-[80px]`}>{category.name}</span>
                      )}
                      {note.tags?.slice(0, 1).map(t => (
                        <span key={t.id} className="text-[10px] text-slate-400 font-medium">#{t.name}</span>
                      ))}
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap">
                      {new Date(note.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <button
        onClick={onCreateNote}
        className="fixed bottom-6 right-6 p-4 bg-indigo-600 text-white rounded-2xl shadow-lg hover:bg-indigo-700 hover:shadow-xl hover:-translate-y-1 transition-all z-20 flex items-center gap-2"
      >
        <Plus size={24} />
        <span className="font-semibold hidden sm:inline-block pr-2">Escribir Nota</span>
      </button>
    </div>
  );
}

// --- Vista de Edición ---
function EditorView({ note, categories, tags, onSave, onCancel, scriptsLoaded, onAddTag, defaultCategoryId }) {
  const rootCategories = categories.filter(c => !c.parentId);

  // Determinar valores iniciales
  const getInitialState = () => {
    // Si estamos editando una nota existente
    const noteCat = categories.find(c => c.id === note?.categoryId);
    if (noteCat) {
      if (noteCat.parentId) {
        return { parent: noteCat.parentId, sub: noteCat.id };
      }
      return { parent: noteCat.id, sub: 'none' };
    }

    // Si es una nota nueva y hay una categoría activa seleccionada
    if (!note && defaultCategoryId && defaultCategoryId !== 'all') {
      const activeCat = categories.find(c => c.id === defaultCategoryId);
      if (activeCat) {
        if (activeCat.parentId) {
          return { parent: activeCat.parentId, sub: activeCat.id };
        }
        return { parent: activeCat.id, sub: 'none' };
      }
    }

    // Default: primera categoría raíz o vacía
    return { parent: rootCategories[0]?.id || '', sub: 'none' };
  };

  const initialState = getInitialState();
  const [title, setTitle] = useState(note?.title || '');
  const [content, setContent] = useState(note?.content || '');
  const [parentCategoryId, setParentCategoryId] = useState(initialState.parent);
  const [subCategoryId, setSubCategoryId] = useState(initialState.sub);
  const [type, setType] = useState(note?.type || 'standard');
  const [status, setStatus] = useState(note?.status || 'todo');
  const [priority, setPriority] = useState(note?.priority || 'medium');
  const [deadline, setDeadline] = useState(note?.deadline || '');
  const [startDate, setStartDate] = useState(note?.startDate || '');
  const [endDate, setEndDate] = useState(note?.endDate || '');
  const [allDay, setAllDay] = useState(note?.allDay || false);
  const [isRecurring, setIsRecurring] = useState(note?.isRecurring || false);
  const [rrule, setRrule] = useState(note?.rrule || '');
  const [objectiveType, setObjectiveType] = useState(note?.objectiveType || 'none');
  const [renderMode, setRenderMode] = useState(note?.renderMode || 'visual');
  const [isReview, setIsReview] = useState(note?.isReview || false);
  const [selectedTagIds, setSelectedTagIds] = useState(note?.tags?.map(t => t.id) || []);
  const [activeTab, setActiveTab] = useState('write');
  const [saving, setSaving] = useState(false);
  const [showTagMenu, setShowTagMenu] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [showTableWizard, setShowTableWizard] = useState(false);


  // Subcategorías disponibles para el padre seleccionado
  const availableSubcategories = categories.filter(c => c.parentId === parentCategoryId);




  const handleSave = async () => {
    if (!title.trim() && !content.trim()) return;
    setSaving(true);
    const finalCategoryId = subCategoryId !== 'none' ? subCategoryId : parentCategoryId;
    
    const noteData = { 
      title, 
      content, 
      categoryId: finalCategoryId,
      type,
      status,
      priority,
      deadline,
      startDate,
      endDate,
      allDay,
      isRecurring,
      rrule,
      objectiveType,
      renderMode,
      isReview,
      tagIds: selectedTagIds
    };
    
    await onSave(noteData);
    setSaving(false);
  };

  const handleParentChange = (e) => {
    setParentCategoryId(e.target.value);
    setSubCategoryId('none'); // Resetear subcategoría al cambiar de padre
  };

  return (
    <div className="w-full max-w-4xl mx-auto h-screen bg-white flex flex-col shadow-xl">
      <header className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-white sticky top-0 z-20">
        <button onClick={onCancel} className="p-2 -ml-2 text-slate-500 hover:text-slate-800 rounded-full hover:bg-slate-50 transition-colors">
          <ChevronLeft size={24} />
        </button>
        <div className="flex bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('write')}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'write' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
          >Escribir</button>
          <button
            onClick={() => setActiveTab('preview')}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'preview' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
          >Vista Previa</button>
        </div>
        <button
          onClick={handleSave}
          disabled={(!title.trim() && !content.trim()) || saving}
          className="flex items-center gap-1 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          <span className="hidden sm:inline">{saving ? 'Guardando...' : 'Guardar'}</span>
        </button>
      </header>

      <main className="flex-grow flex flex-col px-4 sm:px-6 pb-4 sm:pb-6 pt-0 overflow-y-auto">
        {activeTab === 'write' ? (
          <div className="flex flex-col flex-grow">
            <input
              type="text"
              placeholder="Título de la nota..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-3xl sm:text-4xl font-bold text-slate-800 placeholder-slate-300 outline-none w-full bg-transparent mb-4 pt-6"
            />
            
            <div className="mb-6 flex flex-wrap gap-4 items-center bg-slate-50 p-4 rounded-xl border border-slate-100">
              {/* Tipo de Nota */}
              <div className="flex items-center">
                <Zap size={18} className="text-slate-400 mr-2" />
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="bg-white border border-slate-200 text-slate-700 text-sm rounded-lg p-2 outline-none"
                >
                  <option value="standard">Nota Estándar</option>
                  <option value="task_list">Lista de Tareas</option>
                  <option value="cornell">Método Cornell</option>
                </select>
              </div>

              {/* Selector de Categoría Principal */}
              <div className="flex items-center">
                <Tag size={18} className="text-slate-400 mr-2" />
                <select
                  value={parentCategoryId}
                  onChange={handleParentChange}
                  className="bg-white border border-slate-200 text-slate-700 text-sm rounded-lg p-2 outline-none"
                >
                  {rootCategories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              {/* Selector de Subcategoría */}
              {availableSubcategories.length > 0 && (
                <div className="flex items-center">
                  <select
                    value={subCategoryId}
                    onChange={(e) => setSubCategoryId(e.target.value)}
                    className="bg-white border border-slate-200 text-slate-700 text-sm rounded-lg p-2 outline-none"
                  >
                    <option value="none">Sin subcategoría</option>
                    {availableSubcategories.map(sub => (
                      <option key={sub.id} value={sub.id}>{sub.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Prioridad */}
              <div className="flex items-center">
                <span className="text-xs font-bold text-slate-400 mr-2 uppercase">Prioridad</span>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className={`text-sm rounded-lg p-2 outline-none border ${
                    priority === 'high' ? 'bg-red-50 border-red-100 text-red-700' :
                    priority === 'medium' ? 'bg-yellow-50 border-yellow-100 text-yellow-700' :
                    'bg-green-50 border-green-100 text-green-700'
                  }`}
                >
                  <option value="low">Baja</option>
                  <option value="medium">Media</option>
                  <option value="high">Alta</option>
                </select>
              </div>

              {/* Deadline (Legacy) */}
              <div className="flex items-center">
                <CalendarIcon size={18} className="text-slate-400 mr-2" />
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => {
                    setDeadline(e.target.value);
                    if (!startDate) setStartDate(e.target.value);
                  }}
                  className="bg-white border border-slate-200 text-slate-700 text-sm rounded-lg p-2 outline-none"
                  title="Deadline"
                />
              </div>
            </div>

            {/* Configuración de Evento y Objetivos */}
            <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-indigo-50/30 p-4 rounded-xl border border-indigo-100/50">
                <h4 className="text-xs font-bold text-indigo-600 uppercase mb-3 flex items-center gap-2">
                  <CalendarIcon size={14} /> Configuración de Evento
                </h4>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Todo el día</span>
                    <input type="checkbox" checked={allDay} onChange={e => setAllDay(e.target.checked)} className="rounded text-indigo-600 focus:ring-indigo-500" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Inicio</label>
                      <input 
                        type={allDay ? "date" : "datetime-local"} 
                        value={startDate} 
                        onChange={e => setStartDate(e.target.value)} 
                        className="bg-white border border-slate-200 text-slate-700 text-sm rounded-lg p-2 outline-none"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Fin</label>
                      <input 
                        type={allDay ? "date" : "datetime-local"} 
                        value={endDate} 
                        onChange={e => setEndDate(e.target.value)} 
                        className="bg-white border border-slate-200 text-slate-700 text-sm rounded-lg p-2 outline-none"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">¿Es recurrente?</span>
                    <input type="checkbox" checked={isRecurring} onChange={e => setIsRecurring(e.target.checked)} className="rounded text-indigo-600 focus:ring-indigo-500" />
                  </div>
                  {isRecurring && (
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Regla de Recurrencia (RRule)</label>
                      <select 
                        value={rrule}
                        onChange={e => setRrule(e.target.value)}
                        className="bg-white border border-slate-200 text-slate-700 text-sm rounded-lg p-2 outline-none"
                      >
                        <option value="">Seleccionar...</option>
                        <option value="FREQ=DAILY">Diariamente</option>
                        <option value="FREQ=WEEKLY">Semanalmente</option>
                        <option value="FREQ=MONTHLY">Mensualmente</option>
                        <option value="FREQ=YEARLY">Anualmente</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-amber-50/30 p-4 rounded-xl border border-amber-100/50">
                <h4 className="text-xs font-bold text-amber-600 uppercase mb-3 flex items-center gap-2">
                  <Zap size={14} /> Definir como Objetivo
                </h4>
                <div className="flex flex-col gap-4">
                  <p className="text-xs text-slate-500 italic">Marca esta nota como un objetivo para completar en un periodo específico.</p>
                  <div className="flex flex-wrap gap-2">
                    {['none', 'daily', 'weekly', 'monthly', 'yearly'].map(t => (
                      <button
                        key={t}
                        onClick={() => setObjectiveType(t)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                          objectiveType === t 
                            ? 'bg-amber-100 border-amber-300 text-amber-700 shadow-sm' 
                            : 'bg-white border-slate-200 text-slate-500 hover:border-amber-200'
                        }`}
                      >
                        {t === 'none' ? 'Ninguno' : t === 'daily' ? 'Diario' : t === 'weekly' ? 'Semanal' : t === 'monthly' ? 'Mensual' : 'Anual'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <h4 className="text-xs font-bold text-slate-600 uppercase mb-3 flex items-center gap-2">
                  <BookOpen size={14} /> Modo de Renderizado
                </h4>
                <div className="flex flex-col gap-3">
                  <p className="text-xs text-slate-500 italic">Elige cómo se interpretará el contenido de la nota.</p>
                  <div className="flex bg-white p-1 rounded-lg border border-slate-200 self-start">
                    <button
                      onClick={() => setRenderMode('markdown')}
                      className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                        renderMode === 'markdown' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'
                      }`}
                    >Markdown</button>
                    <button
                      onClick={() => setRenderMode('visual')}
                      className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                        renderMode === 'visual' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'
                      }`}
                    >Visual</button>
                    <button
                      onClick={() => setRenderMode('html')}
                      className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                        renderMode === 'html' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'
                      }`}
                    >HTML Puro</button>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                    <span className="text-sm text-slate-600 font-medium">Marcada para Repaso</span>
                    <button 
                      onClick={() => setIsReview(!isReview)}
                      className={`p-2 rounded-lg border transition-all ${isReview ? 'bg-rose-50 border-rose-200 text-rose-600' : 'bg-white border-slate-200 text-slate-400 hover:text-rose-400'}`}
                    >
                      <Heart size={18} fill={isReview ? "currentColor" : "none"} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Tags UI */}
            <div className="mb-6 flex flex-wrap gap-2 items-center">
              <div className="flex items-center gap-2">
                <Tag size={16} className="text-slate-400" />
                {tags.filter(t => selectedTagIds.includes(t.id)).map(tag => (
                  <span key={tag.id} className={`${tag.color} text-[10px] uppercase font-bold px-2 py-0.5 rounded-full flex items-center gap-1`}>
                    {tag.name}
                    <button onClick={() => setSelectedTagIds(ids => ids.filter(id => id !== tag.id))}><X size={10} /></button>
                  </span>
                ))}
              </div>
              <div className="relative">
                <button 
                  onClick={() => setShowTagMenu(!showTagMenu)}
                  className="p-1.5 text-slate-400 hover:text-indigo-600 border border-dashed border-slate-200 rounded-full hover:bg-slate-50"
                ><Plus size={14} /></button>
                
                {showTagMenu && (
                  <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-slate-200 shadow-xl rounded-xl z-30 p-2">
                    <div className="max-h-40 overflow-y-auto mb-2 custom-scrollbar">
                      {tags.filter(t => !selectedTagIds.includes(t.id)).map(tag => (
                        <button
                          key={tag.id}
                          onClick={() => {
                            setSelectedTagIds([...selectedTagIds, tag.id]);
                            setShowTagMenu(false);
                          }}
                          className="w-full text-left px-3 py-1.5 text-xs hover:bg-slate-50 rounded-lg flex items-center gap-2"
                        >
                          <div className={`w-2 h-2 rounded-full ${tag.color.split(' ')[0]}`}></div>
                          {tag.name}
                        </button>
                      ))}
                    </div>
                    <div className="border-t border-slate-100 pt-2 flex gap-1">
                      <input 
                        className="text-xs p-1.5 border rounded-lg w-full outline-none"
                        placeholder="Nuevo tag..."
                        value={newTagName}
                        onChange={e => setNewTagName(e.target.value)}
                        onKeyDown={async e => {
                          if (e.key === 'Enter' && newTagName.trim()) {
                            const newTag = await onAddTag(newTagName.trim());
                            setSelectedTagIds([...selectedTagIds, newTag.id]);
                            setNewTagName('');
                            setShowTagMenu(false);
                          }
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {renderMode === 'markdown' ? (
              <div className="flex-grow flex flex-col min-h-0">
                {activeTab === 'write' ? (
                  <>
                    <MarkdownToolbar 
                      onInsert={(text) => {
                        const textarea = document.querySelector('.html-code-editor');
                        if (textarea) {
                          const start = textarea.selectionStart;
                          const end = textarea.selectionEnd;
                          const val = textarea.value;
                          const newVal = val.substring(0, start) + text + val.substring(end);
                          setContent(newVal);
                          setTimeout(() => {
                            textarea.focus();
                            textarea.setSelectionRange(start + text.length, start + text.length);
                          }, 10);
                        }
                      }} 
                      onUpload={async (file) => {
                        const formData = new FormData();
                        formData.append('image', file);
                        try {
                          const res = await fetch(`${API_BASE}/upload`, { method: 'POST', body: formData });
                          const data = await res.json();
                          if (data.url) {
                            const insertion = `![](${data.url})`;
                            const textarea = document.querySelector('.html-code-editor');
                            if (textarea) {
                              const start = textarea.selectionStart;
                              const newVal = content.substring(0, start) + insertion + content.substring(start);
                              setContent(newVal);
                            }
                          }
                        } catch (err) { console.error('Upload error:', err); }
                      }}
                      onOpenGallery={() => setShowGallery(true)}
                      onOpenTableWizard={() => setShowTableWizard(true)}
                    />

                    {showTableWizard && (
                      <TableWizardModal 
                        onClose={() => setShowTableWizard(false)}
                        onInsert={(html) => {
                          const turndownService = new TurndownService();
                          turndownService.keep(['table', 'thead', 'tbody', 'tr', 'th', 'td']);
                          const markdown = turndownService.turndown(html);
                          
                          const textarea = document.querySelector('.html-code-editor');
                          if (textarea) {
                            const start = textarea.selectionStart;
                            const newVal = content.substring(0, start) + '\n' + markdown + '\n' + content.substring(start);
                            setContent(newVal);
                          }
                          setShowTableWizard(false);
                        }}
                      />
                    )}

                    {showGallery && (
                      <GalleryModal 
                        onClose={() => setShowGallery(false)} 
                        onSelect={(url) => {
                          const insertion = `![](${url})`;
                          const textarea = document.querySelector('.html-code-editor');
                          if (textarea) {
                            const start = textarea.selectionStart;
                            const newVal = content.substring(0, start) + insertion + content.substring(start);
                            setContent(newVal);
                          }
                          setShowGallery(false);
                        }}
                      />
                    )}
                    <div className="flex-grow flex flex-col mt-4 bg-[#fcfcfc] rounded-xl border border-slate-200 overflow-hidden shadow-inner">
                      <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        onDrop={async (e) => {
                          if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                            e.preventDefault();
                            const file = e.dataTransfer.files[0];
                            if (file.type.startsWith('image/')) {
                              const formData = new FormData();
                              formData.append('image', file);
                              try {
                                const res = await fetch(`${API_BASE}/upload`, { method: 'POST', body: formData });
                                const data = await res.json();
                                if (data.url) {
                                  const insertion = `![](${data.url})`;
                                  const cursor = e.target.selectionStart;
                                  const newContent = content.slice(0, cursor) + insertion + content.slice(cursor);
                                  setContent(newContent);
                                }
                              } catch (err) { console.error('Upload error:', err); }
                            }
                          }
                        }}
                        onPaste={async (e) => {
                          if (e.clipboardData.files && e.clipboardData.files[0]) {
                            const file = e.clipboardData.files[0];
                            if (file.type.startsWith('image/')) {
                              e.preventDefault();
                              const formData = new FormData();
                              formData.append('image', file);
                              try {
                                const res = await fetch(`${API_BASE}/upload`, { method: 'POST', body: formData });
                                const data = await res.json();
                                if (data.url) {
                                  const insertion = `![](${data.url})`;
                                  const cursor = e.target.selectionStart;
                                  const newContent = content.slice(0, cursor) + insertion + content.slice(cursor);
                                  setContent(newContent);
                                }
                              } catch (err) { console.error('Upload error:', err); }
                            }
                          }
                        }}
                        className="html-code-editor w-full h-full p-6 bg-transparent border-none outline-none resize-none"
                        placeholder="Escribe aquí tu Markdown con Mermaid..."
                        spellCheck="false"
                      />
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col h-full bg-white rounded-xl border border-slate-200 overflow-y-auto p-8 shadow-sm">
                    <MarkdownRenderer content={content} isReady={scriptsLoaded} renderMode="markdown" />
                  </div>
                )}
              </div>
            ) : renderMode === 'html' ? (
              <div className="flex-grow flex flex-col">
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="html-code-editor flex-grow mb-4"
                  placeholder="Escribe o pega aquí tu código HTML puro..."
                  spellCheck="false"
                />
              </div>
            ) : (
              <TiptapEditor 
                content={content} 
                onChange={setContent} 
                type={type}
              />
            )}
          </div>
        ) : (
          <div className="flex-grow bg-white rounded-xl p-2">
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-800 mb-6">{title || 'Sin Título'}</h1>
            {content.trim()
              ? <MarkdownRenderer content={content} isReady={scriptsLoaded} renderMode={renderMode} />
              : <p className="text-slate-400 italic">No hay contenido para visualizar.</p>
            }
          </div>
        )}

      </main>
    </div>
  );
}

// --- Vista de Visualización ---
function ViewerView({ note, category, onEdit, onBack, onDelete, onFlashcard, onExportPDF, onExportMD, onUpdateContent, scriptsLoaded, onToggleReview }) {
  if (!note) return null;
  return (
    <div className="w-full max-w-4xl mx-auto min-h-screen bg-white shadow-xl animate-in fade-in duration-300">
      <header className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-white sticky top-0 z-20">
        <button onClick={onBack} className="p-2 -ml-2 text-slate-500 hover:text-slate-800 rounded-full hover:bg-slate-50 transition-colors flex items-center">
          <ChevronLeft size={24} /><span className="font-medium hidden sm:inline ml-1">Volver</span>
        </button>
        <div className="flex flex-wrap items-center gap-2">
          {note.tags?.map(tag => (
            <span key={tag.id} className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${tag.color}`}>
              {tag.name}
            </span>
          ))}
          <div className="h-6 w-px bg-slate-200 mx-1"></div>
          <button onClick={onExportPDF} className="p-2 text-slate-400 hover:text-indigo-600 transition-colors" title="Exportar PDF"><Download size={20} /></button>
          <button onClick={onExportMD} className="p-2 text-slate-400 hover:text-indigo-600 transition-colors" title="Exportar MD"><Share2 size={20} /></button>
          
          <button 
            onClick={() => onToggleReview(note.id)} 
            className={`p-2 transition-all rounded-full ${note.isReview ? 'text-rose-500 bg-rose-50' : 'text-slate-400 hover:text-rose-500 hover:bg-slate-50'}`} 
            title={note.isReview ? "Quitar de repaso" : "Añadir a repaso"}
          >
            <Heart size={20} fill={note.isReview ? "currentColor" : "none"} />
          </button>
          {note.type === 'cornell' && (
            <button onClick={onFlashcard} className="flex items-center gap-2 px-4 py-2 bg-yellow-50 text-yellow-700 rounded-lg font-bold hover:bg-yellow-100 transition-colors border border-yellow-200">
              <Zap size={18} /> Estudiar
            </button>
          )}
          <button onClick={onDelete} className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors" title="Eliminar">
            <Trash2 size={20} />
          </button>
          <button onClick={onEdit} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 shadow-md transition-colors">
            <Edit3 size={18} /> Editar
          </button>
        </div>
      </header>
      <main className="p-6 sm:p-10 pb-24">
        <div id="note-render-area" className="bg-white">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-slate-900 mb-4">{note.title}</h1>
            <div className="flex items-center gap-4">
              {category && (
                <span className={`text-sm px-3 py-1 rounded-full font-medium ${category.color}`}>{category.name}</span>
              )}
              {note.deadline && (
                <span className="text-sm font-bold text-indigo-600 flex items-center gap-1">
                  <CalendarIcon size={14} /> {new Date(note.deadline).toLocaleDateString()}
                </span>
              )}
              {note.isReview && (
                <span className="text-sm font-bold text-rose-600 flex items-center gap-1 bg-rose-50 px-2 py-0.5 rounded-full">
                  <Heart size={14} fill="currentColor" /> Repaso
                </span>
              )}
              <span className="text-sm text-slate-400">
                Creado: {new Date(note.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
          <div className="border-t border-slate-100 pt-8">
            <MarkdownRenderer content={note.content} isReady={scriptsLoaded} renderMode={note.renderMode} onUpdate={onUpdateContent} />
          </div>
        </div>
      </main>
    </div>
  );
}


// --- Renderizador Markdown + Mermaid + HTML ---
function MarkdownRenderer({ content, isReady, renderMode, onUpdate }) {
  const containerRef = useRef(null);
  const [html, setHtml] = useState('');

  const isFullHtml = content.trim().toLowerCase().startsWith('<!doctype') || 
                     content.trim().toLowerCase().startsWith('<html');

  useEffect(() => {
    if (!isReady || !window.marked) return;

    // Si el modo es HTML, simplemente mostramos el contenido tal cual (o via iframe si es completo)
    if (renderMode === 'html' || isFullHtml) {
      setHtml(content);
      return;
    }

    const turndownService = new TurndownService({
      headingStyle: 'atx',
      codeBlockStyle: 'fenced'
    });
    
    // Regla para Tiptap Task Lists: Mantener el HTML para que sea interactivo
    turndownService.addRule('taskList', {
      filter: (node) => node.nodeName === 'UL' && node.getAttribute('data-type') === 'taskList',
      replacement: (content, node) => {
        return `<ul data-type="taskList">${content}</ul>`;
      }
    });

    turndownService.addRule('taskItem', {
      filter: (node) => node.nodeName === 'LI' && node.getAttribute('data-type') === 'taskItem',
      replacement: (content, node) => {
        const checked = node.getAttribute('data-checked') === 'true';
        // Limpiar el contenido de labels internos y divs extra que tiptap a veces añade al convertir
        let cleanContent = content.replace(/<label>.*?<\/label>/gi, '').trim();
        // Si el contenido ya viene envuelto en un div (común en Tiptap), lo dejamos tal cual
        const hasWrapper = cleanContent.startsWith('<div') || cleanContent.startsWith('<p');
        return `<li data-type="taskItem" data-checked="${checked}"><input type="checkbox" ${checked ? 'checked' : ''} /> ${hasWrapper ? cleanContent : `<div>${cleanContent}</div>`}</li>`;
      }
    });

    // Preservar tablas HTML y estilos inline para que no se pierdan al renderizar
    turndownService.keep(['table', 'thead', 'tbody', 'tr', 'th', 'td', 'span', 'mark', 'u']);
    
    // Evitar que turndown escape caracteres de markdown, para permitir la "detección automática"
    turndownService.escape = (text) => text;
    
    // Si el contenido parece HTML (viene de Tiptap) y NO estamos en modo Markdown puro,
    // lo convertimos a MD para que 'marked' detecte los bloques de código.
    let markdownSource = content;
    if (renderMode !== 'markdown' && renderMode !== 'html' && content.includes('<') && content.includes('>')) {
      markdownSource = turndownService.turndown(content);
    }

    const renderer = new window.marked.Renderer();
    
    // Extender el renderizador para que no escape las etiquetas HTML que queremos mantener (taskList)
    renderer.text = (args) => {
      // API de marked v12+ pasa un objeto con la propiedad text
      if (typeof args === 'object' && args.text !== undefined) return args.text;
      return args;
    };

    renderer.image = (argsOrHref, title, text) => {
      const href = typeof argsOrHref === 'object' ? argsOrHref.href : argsOrHref;
      const t = typeof argsOrHref === 'object' ? argsOrHref.title : title;
      const alt = typeof argsOrHref === 'object' ? argsOrHref.text : text;
      
      const absoluteUrl = getAssetUrl(href);
      return `<img src="${absoluteUrl}" alt="${alt || ''}" title="${t || ''}" loading="lazy" />`;
    };

    renderer.code = (argsOrCode, lang) => {
      const code = typeof argsOrCode === 'object' ? argsOrCode.text : argsOrCode;
      const language = typeof argsOrCode === 'object' ? argsOrCode.lang : lang;

      if (language === 'mermaid') return `<div class="mermaid">${code}</div>`;
      if (language === 'html') return `<div class="rendered-html-block">${code}</div>`;
      
      let highlightedCode = code;
      if (window.hljs && language) {
        try {
          highlightedCode = window.hljs.highlight(code, { language }).value;
        } catch (e) {
          highlightedCode = window.hljs.highlightAuto(code).value;
        }
      } else if (window.hljs) {
        highlightedCode = window.hljs.highlightAuto(code).value;
      } else {
        highlightedCode = (code || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      }

      const encodedCode = encodeURIComponent(code);
      
      // Procesar números de línea
      const lines = code.split('\n');
      const lineNumbersHtml = lines.map((_, i) => `<span class="line-number">${i + 1}</span>`).join('');
      
      return `
        <div class="code-card group/card" data-code="${encodedCode}">
          <div class="code-card-header">
            <div class="flex items-center gap-2">
               <span class="code-lang">${language || 'code'}</span>
            </div>
            <button class="copy-btn hover:scale-105 active:scale-95 transition-transform" data-copy-trigger="true">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
              Copiar
            </button>
          </div>
          <div class="code-content-wrapper flex">
            <div class="line-numbers-col py-4 px-2 text-right bg-slate-900/30 border-r border-slate-700 select-none hidden sm:block">
              ${lineNumbersHtml}
            </div>
            <pre class="flex-grow"><code class="hljs language-${language || ''}">${highlightedCode}</code></pre>
          </div>
          <div class="code-card-footer px-4 py-1.5 bg-slate-900/20 border-t border-slate-700/50 flex justify-between items-center">
             <span class="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Fin del bloque</span>
             <span class="text-[9px] text-slate-600 font-mono">${lines.length} líneas</span>
          </div>
        </div>
      `;
    };

    // Soporte para Callouts (Notion-style)
    renderer.blockquote = (args) => {
      const text = typeof args === 'object' ? args.text : args;
      const calloutMatch = text.match(/^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\n?([\s\S]*)$/i);
      if (calloutMatch) {
        const type = calloutMatch[1].toLowerCase();
        const content = calloutMatch[2];
        const icons = {
          note: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-blue-500"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
          tip: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-green-500"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .5 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><line x1="9" y1="18" x2="15" y2="18"/><line x1="10" y1="22" x2="14" y2="22"/></svg>',
          important: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-amber-500"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
          warning: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-red-500"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
        };
        return `<div class="notion-callout ${type}">${icons[type] || icons.note}<div>${content}</div></div>`;
      }
      return `<blockquote>${text}</blockquote>`;
    };

    renderer.hr = () => '<hr class="notion-divider" />';

    window.marked.setOptions({ renderer, breaks: true, gfm: true });
    setHtml(window.marked.parse(markdownSource));
  }, [content, isReady, isFullHtml, renderMode]);

  useEffect(() => {
    if (!isReady || !window.mermaid || !html || isFullHtml || renderMode === 'html') return;
    const renderMermaid = async () => {
      try {
        // En Mermaid v10+ run() es la forma recomendada para contenido dinámico
        await window.mermaid.run({
          querySelector: '.mermaid',
        });
      } catch (e) {
        console.warn('Mermaid rendering error:', e);
      }
    };
    const id = setTimeout(renderMermaid, 100);
    return () => clearTimeout(id);
  }, [html, isReady, isFullHtml, renderMode]);

  // Manejador de clics para tareas y copia de código
  const handleContainerClick = (e) => {
    // Caso 1: Click en checkbox de tareas
    if (e.target.type === 'checkbox' && onUpdate) {
      const allCheckboxes = Array.from(containerRef.current.querySelectorAll('input[type="checkbox"]'));
      const index = allCheckboxes.indexOf(e.target);
      
      if (index !== -1) {
        const isChecked = e.target.checked;
        const parser = new DOMParser();
        const doc = parser.parseFromString(content, 'text/html');
        const tasks = doc.querySelectorAll('li[data-type="taskItem"]');
        
        if (tasks[index]) {
          tasks[index].setAttribute('data-checked', isChecked ? 'true' : 'false');
          onUpdate(doc.body.innerHTML);
        }
      }
      return;
    }

    // Caso 2: Click en botón de copiar (Delegación de eventos)
    const copyBtn = e.target.closest('[data-copy-trigger="true"]');
    if (copyBtn) {
      const card = copyBtn.closest('.code-card');
      const encodedCode = card?.getAttribute('data-code');
      const code = encodedCode ? decodeURIComponent(encodedCode) : '';
      if (window.copyCodeToClipboard) {
        window.copyCodeToClipboard(copyBtn, code);
      }
    }
  };

  if (!isReady) return <div className="text-slate-400 animate-pulse">Cargando renderizador...</div>;

  if (isFullHtml || renderMode === 'html') {
    // Si es HTML completo (doctype/html tag) siempre usamos iframe
    if (isFullHtml) {
      return (
        <div className="html-note-wrapper">
          <iframe
            srcDoc={content}
            title="HTML Full Note"
            className="html-note-iframe"
            sandbox="allow-scripts allow-modals allow-forms allow-same-origin"
          />
        </div>
      );
    }
    
    // Si es HTML parcial pero modo HTML activo, renderizamos directamente
    return (
      <div 
        className="rendered-raw-html" 
        dangerouslySetInnerHTML={{ __html: content }} 
      />
    );
  }

  return (
    <div
      ref={containerRef}
      className="markdown-body text-lg text-slate-800"
      dangerouslySetInnerHTML={{ __html: html }}
      onClick={handleContainerClick}
    />
  );
}

// --- Toolbar para Markdown ---
function MarkdownToolbar({ onInsert, onUpload, onOpenGallery, onOpenTableWizard }) {
  const [showTableGrid, setShowTableGrid] = useState(false);
  const [hoverGrid, setHoverGrid] = useState({ r: 0, c: 0 });
  const fileInputRef = useRef(null);
  const tableGridRef = useRef(null);

  // Cerrar dropdown de tablas al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (tableGridRef.current && !tableGridRef.current.contains(e.target)) {
        setShowTableGrid(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const onInsertTable = (rows, cols) => {
    let tableHtml = '\n<table style="width: 100%; border-collapse: collapse;"><thead><tr>';
    for (let c = 0; c < cols; c++) {
      tableHtml += '<th style="border: 1px solid #e2e8f0; padding: 12px; background: #f8fafc;">Título</th>';
    }
    tableHtml += '</tr></thead><tbody>';
    for (let r = 1; r < rows; r++) {
      tableHtml += '<tr>';
      for (let c = 0; c < cols; c++) {
        tableHtml += '<td style="border: 1px solid #e2e8f0; padding: 12px;"></td>';
      }
      tableHtml += '</tr>';
    }
    tableHtml += '</tbody></table>\n';
    onInsert(tableHtml);
    setShowTableGrid(false);
  };

  const tools = [
    { label: 'H1', icon: <Heading1 size={16} />, text: '# ' },
    { label: 'H2', icon: <Heading2 size={16} />, text: '## ' },
    { label: 'H3', icon: <Heading3 size={16} />, text: '### ' },
    { label: 'Negrita', icon: <Bold size={16} />, text: '****', offset: 2 },
    { label: 'Cursiva', icon: <Italic size={16} />, text: '__', offset: 1 },
    { label: 'Lista', icon: <List size={16} />, text: '\n- ' },
    { label: 'Tarea', icon: <CheckSquare size={16} />, text: '\n- [ ] ' },
    { label: 'Tabla', icon: <TableIcon size={16} />, onClick: () => onOpenTableWizard() },
    { label: 'Imagen', icon: <ImageIcon size={16} />, onClick: () => fileInputRef.current.click() },
    { label: 'Galería', icon: <Share2 size={16} />, onClick: () => onOpenGallery() },
    { label: 'Link', icon: <LinkIcon size={16} />, text: '[]()', offset: 1 },
    { label: 'Cita', icon: <Quote size={16} />, text: '\n> ' },
    { label: 'Código', icon: <Code size={16} />, text: '\n```javascript\n\n```\n', offset: 15 },
    { label: 'Diagrama', icon: <Activity size={16} />, text: '\n```mermaid\ngraph TD\n  A --> B\n```\n' },
    { label: 'Separador', icon: <Minus size={16} />, text: '\n---\n' },
    { label: 'Callout', icon: <AlertCircle size={16} />, text: '\n> [!NOTE]\n> ' },
  ];

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file && onUpload) {
      await onUpload(file);
    }
    e.target.value = ''; // Reset
  };

  return (
    <div className="flex flex-wrap gap-1 p-2 bg-white border border-slate-200 rounded-xl shadow-sm">
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept="image/*,.svg" 
        onChange={handleFileChange} 
      />
      {tools.map((tool, i) => (
        <div key={i} className="relative">
          <button
            onClick={() => {
              if (tool.onClick) {
                tool.onClick();
              } else {
                onInsert(tool.text);
              }
            }}
            className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-50 rounded-lg transition-all flex items-center gap-1.5"
            title={tool.label}
          >
            {tool.icon}
            <span className="text-[10px] font-bold uppercase hidden md:inline">{tool.label}</span>
          </button>
        </div>
      ))}
    </div>
  );
}

// --- Modal de Galería ---
export function GalleryModal({ onClose, onSelect }) {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/images`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setImages(data);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Gallery error:', err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        <header className="p-4 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Galería de Imágenes</h2>
            <p className="text-xs text-slate-400">Selecciona una imagen previamente subida.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600"><X size={20} /></button>
        </header>
        
        <main className="flex-grow overflow-y-auto p-4 custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="animate-spin text-indigo-500" size={32} />
              <p className="text-slate-400 text-sm">Cargando tus imágenes...</p>
            </div>
          ) : !images || images.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-2">
              <ImageIcon size={48} className="opacity-20" />
              <p>No tienes imágenes guardadas.</p>
              <p className="text-xs">Sube una primero desde el editor.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {images.map((img, i) => (
                <div 
                  key={i} 
                  onClick={() => onSelect(img.url)}
                  className="group relative aspect-square rounded-xl overflow-hidden border border-slate-100 cursor-pointer hover:border-indigo-500 hover:ring-2 hover:ring-indigo-500/20 transition-all bg-slate-50"
                >
                  <img src={getAssetUrl(img.url)} alt={img.name} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-white text-[10px] font-bold uppercase tracking-wider">Insertar</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

// --- Vista de Sección de Repaso ---
function ReviewPlaylistView({ notes, onBack, onViewNote, scriptsLoaded, categories, onToggleReview }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeNote = notes[activeIndex];

  if (notes.length === 0) {
    return (
      <div className="w-full max-w-4xl mx-auto min-h-screen bg-white shadow-xl flex flex-col items-center justify-center p-10 animate-in fade-in duration-500">
        <div className="p-8 bg-rose-50 rounded-full mb-6">
          <Heart size={64} className="text-rose-400 opacity-50" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Sección de Repaso vacía</h2>
        <p className="text-slate-500 text-center max-w-md mb-8">
          Marca tus notas importantes con el corazón para tenerlas a mano en esta sección de acceso rápido.
        </p>
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg hover:-translate-y-1"
        >
          <ChevronLeft size={20} /> Volver al Inicio
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto min-h-screen bg-white shadow-2xl flex flex-col animate-in fade-in duration-300">
      <header className="px-6 py-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md z-30">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 -ml-2 text-slate-400 hover:text-slate-800 rounded-full hover:bg-slate-50 transition-colors">
            <ChevronLeft size={24} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Heart size={20} className="text-rose-500" fill="currentColor" />
              Sesión de Repaso
            </h1>
            <p className="text-xs text-slate-400 font-medium">{notes.length} notas seleccionadas</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setActiveIndex(Math.floor(Math.random() * notes.length))}
            className="flex items-center gap-2 px-4 py-2 bg-slate-50 text-slate-600 rounded-xl hover:bg-slate-100 transition-all text-sm font-bold border border-slate-200"
          >
            <Shuffle size={16} /> Aleatorio
          </button>
          <div className="h-6 w-px bg-slate-200 mx-1"></div>
          <button 
            onClick={() => {
              if (activeIndex > 0) setActiveIndex(activeIndex - 1);
              else setActiveIndex(notes.length - 1);
            }}
            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-lg"
          >
            <SkipBack size={20} />
          </button>
          <div className="text-xs font-mono font-bold text-slate-400 w-12 text-center">
            {activeIndex + 1} / {notes.length}
          </div>
          <button 
            onClick={() => {
              if (activeIndex < notes.length - 1) setActiveIndex(activeIndex + 1);
              else setActiveIndex(0);
            }}
            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-lg"
          >
            <SkipForward size={20} />
          </button>
        </div>
      </header>

      <div className="flex flex-grow overflow-hidden">
        {/* Lista Lateral (Estilo App) */}
        <aside className="w-72 border-r border-slate-50 flex flex-col bg-slate-50/50 hidden md:flex shrink-0">
          <div className="p-4 space-y-2 overflow-y-auto custom-scrollbar flex-grow">
            {notes.map((note, index) => (
              <div
                key={note.id}
                onClick={() => setActiveIndex(index)}
                className={`p-3 rounded-xl cursor-pointer transition-all border ${
                  activeIndex === index 
                    ? 'bg-white shadow-md border-rose-200 ring-1 ring-rose-100' 
                    : 'bg-transparent border-transparent hover:bg-white/60 text-slate-500'
                }`}
              >
                <h4 className={`text-xs font-bold truncate mb-1 ${activeIndex === index ? 'text-slate-900' : ''}`}>
                  {note.title || 'Sin Título'}
                </h4>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] opacity-60">
                    {categories.find(c => c.id === note.categoryId)?.name || 'General'}
                  </span>
                  {activeIndex === index && <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></div>}
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 border-t border-slate-100 bg-white">
             <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-rose-500 transition-all duration-500" 
                  style={{ width: `${((activeIndex + 1) / notes.length) * 100}%` }}
                ></div>
             </div>
          </div>
        </aside>

        {/* Contenido de la Nota */}
        <main className="flex-grow overflow-y-auto bg-white p-6 sm:p-10 custom-scrollbar relative">
          <div className="max-w-3xl mx-auto">
            <div className="mb-10 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] uppercase font-bold px-3 py-1 rounded-full ${categories.find(c => c.id === activeNote?.categoryId)?.color || 'bg-slate-100'}`}>
                    {categories.find(c => c.id === activeNote?.categoryId)?.name || 'General'}
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                    Actualizado el {new Date(activeNote?.updatedAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => onToggleReview(activeNote.id)}
                    className="p-2 text-rose-500 hover:bg-rose-50 rounded-full transition-colors"
                    title="Quitar de repaso"
                  >
                    <Heart size={20} fill="currentColor" />
                  </button>
                  <button 
                    onClick={() => onViewNote(activeNote.id)}
                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-full transition-colors"
                  >
                    <Edit3 size={20} />
                  </button>
                </div>
              </div>
              <h2 className="text-4xl font-bold text-slate-900 leading-tight">{activeNote?.title || 'Sin Título'}</h2>
              <div className="h-1 w-20 bg-rose-100 rounded-full"></div>
            </div>

            <div className="prose prose-slate max-w-none">
              {activeNote && (
                <MarkdownRenderer content={activeNote.content} isReady={scriptsLoaded} renderMode={activeNote.renderMode} />
              )}
            </div>
            
            {/* Navegación inferior integrada */}
            <div className="mt-20 pt-8 border-t border-slate-100 flex items-center justify-between text-slate-400">
               <button 
                 onClick={() => activeIndex > 0 && setActiveIndex(activeIndex - 1)}
                 disabled={activeIndex === 0}
                 className="flex items-center gap-2 hover:text-indigo-600 transition-colors disabled:opacity-20"
               >
                 <SkipBack size={16} /> <span className="text-sm font-bold uppercase tracking-wider">Anterior</span>
               </button>
               <button 
                 onClick={() => activeIndex < notes.length - 1 && setActiveIndex(activeIndex + 1)}
                 disabled={activeIndex === notes.length - 1}
                 className="flex items-center gap-2 hover:text-indigo-600 transition-colors disabled:opacity-20 text-right"
               >
                  <span className="text-sm font-bold uppercase tracking-wider">Siguiente</span> <SkipForward size={16} />
               </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
