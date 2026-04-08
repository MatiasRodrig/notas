import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Plus, Tag, ChevronLeft, Save, Edit3, Trash2, BookOpen, X, Loader2, AlertCircle, WifiOff
} from 'lucide-react';

// --- API Client ---
// La variable VITE_API_URL se define en client/.env y se inyecta en el build
const API_BASE = import.meta.env.VITE_API_URL || (typeof window !== 'undefined' ? window.location.origin : '') + '/api';
console.log('📡 API Base:', API_BASE);

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

// --- Hook para cargar scripts externos (marked + mermaid) ---
function useExternalScripts() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (document.getElementById('marked-script') && window.mermaid) { setReady(true); return; }
    const m = document.createElement('script');
    m.id = 'marked-script';
    m.src = 'https://cdn.jsdelivr.net/npm/marked/marked.min.js';
    const mr = document.createElement('script');
    mr.id = 'mermaid-script';
    mr.src = 'https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js';
    document.body.appendChild(m);
    document.body.appendChild(mr);
    Promise.all([
      new Promise(res => { m.onload = res; }),
      new Promise(res => { mr.onload = res; }),
    ]).then(() => {
      window.mermaid?.initialize({ startOnLoad: false, theme: 'default' });
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
  const [activeCategoryId, setActiveCategoryId] = useState('all');
  const [view, setView] = useState('home');
  const [activeNoteId, setActiveNoteId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const scriptsLoaded = useExternalScripts();

  const showError = (msg) => setError(msg);
  const clearError = () => setError(null);

  // Carga inicial
  useEffect(() => {
    Promise.all([api.getCategories(), api.getNotes()])
      .then(([cats, nts]) => { setCategories(cats); setNotes(nts); })
      .catch(() => showError('No se pudo conectar con el servidor. ¿Está corriendo el backend?'))
      .finally(() => setLoading(false));
  }, []);

  // Recargar notas al cambiar categoría
  useEffect(() => {
    if (loading) return;
    api.getNotes(activeCategoryId)
      .then(setNotes)
      .catch(() => showError('Error al cargar las notas.'));
  }, [activeCategoryId]);

  const handleCreateNote = () => { setActiveNoteId(null); setView('editor'); };
  const handleEditNote = (id) => { setActiveNoteId(id); setView('editor'); };
  const handleViewNote = (id) => { setActiveNoteId(id); setView('viewer'); };

  const handleSaveNote = async (noteData) => {
    try {
      if (activeNoteId) {
        const updated = await api.updateNote(activeNoteId, noteData);
        setNotes(ns => ns.map(n => n.id === activeNoteId ? updated : n));
      } else {
        const created = await api.createNote(noteData);
        setNotes(ns => [created, ...ns]);
        setActiveNoteId(created.id);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <Loader2 size={36} className="animate-spin text-indigo-500" />
          <p className="font-medium">Conectando con la base de datos...</p>
        </div>
      </div>
    );
  }

  const activeNote = notes.find(n => n.id === activeNoteId);
  const activeCategory = categories.find(c => c.id === activeNote?.categoryId);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      <style>{`
        .markdown-body h1 { font-size: 1.8em; font-weight: 700; margin-top: 1em; margin-bottom: 0.5em; color: #1e293b; }
        .markdown-body h2 { font-size: 1.5em; font-weight: 600; margin-top: 1em; margin-bottom: 0.5em; color: #334155; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.3em; }
        .markdown-body h3 { font-size: 1.25em; font-weight: 600; margin-top: 1em; margin-bottom: 0.5em; color: #475569; }
        .markdown-body p { margin-bottom: 1em; line-height: 1.6; color: #334155; }
        .markdown-body ul { list-style-type: disc; padding-left: 1.5em; margin-bottom: 1em; }
        .markdown-body ol { list-style-type: decimal; padding-left: 1.5em; margin-bottom: 1em; }
        .markdown-body li { margin-bottom: 0.25em; }
        .markdown-body code { background-color: #f1f5f9; padding: 0.2em 0.4em; border-radius: 0.25rem; font-family: ui-monospace, monospace; font-size: 0.875em; color: #db2777; }
        .markdown-body pre { background-color: #1e293b; color: #f8fafc; padding: 1em; border-radius: 0.5rem; overflow-x: auto; margin-bottom: 1em; }
        .markdown-body pre code { background-color: transparent; padding: 0; color: inherit; }
        .markdown-body blockquote { border-left: 4px solid #cbd5e1; padding-left: 1em; color: #64748b; font-style: italic; margin-bottom: 1em; }
        .markdown-body a { color: #2563eb; text-decoration: underline; }
        .mermaid { background: white; padding: 1rem; border-radius: 0.5rem; border: 1px solid #e2e8f0; margin-bottom: 1em; display: flex; justify-content: center; overflow-x: auto; }
      `}</style>

      <ErrorBanner message={error} onDismiss={clearError} />

      {view === 'home' && (
        <HomeView
          notes={notes}
          categories={categories}
          activeCategoryId={activeCategoryId}
          setActiveCategoryId={setActiveCategoryId}
          onCreateNote={handleCreateNote}
          onViewNote={handleViewNote}
          onAddCategory={handleAddCategory}
          onUpdateCategory={handleUpdateCategory}
          onDeleteCategory={handleDeleteCategory}
        />
      )}
      {view === 'editor' && (
        <EditorView
          note={activeNote}
          categories={categories}
          onSave={handleSaveNote}
          onCancel={() => setView(activeNoteId ? 'viewer' : 'home')}
          scriptsLoaded={scriptsLoaded}
        />
      )}
      {view === 'viewer' && (
        <ViewerView
          note={activeNote}
          category={activeCategory}
          onEdit={() => handleEditNote(activeNoteId)}
          onBack={() => setView('home')}
          onDelete={() => handleDeleteNote(activeNoteId)}
          scriptsLoaded={scriptsLoaded}
        />
      )}
    </div>
  );
}

// --- Vista de Inicio ---
function HomeView({ notes, categories, activeCategoryId, setActiveCategoryId, onCreateNote, onViewNote, onAddCategory, onUpdateCategory, onDeleteCategory }) {
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [addingToParentId, setAddingToParentId] = useState(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  
  const [saving, setSaving] = useState(false);

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
            <button
              onClick={() => setActiveCategoryId(cat.id)}
              className={`whitespace-nowrap px-3 py-2 rounded-full text-xs font-medium transition-colors border flex items-center gap-1.5 ${
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
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full max-w-4xl mx-auto pb-24 min-h-screen bg-white shadow-xl">
      <header className="bg-white px-4 py-6 shadow-sm sticky top-0 z-10">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2 text-indigo-600">
            <BookOpen size={28} />
            <h1 className="text-2xl font-bold tracking-tight">Mis Notas</h1>
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
          <div className="text-center py-20 text-slate-400 flex flex-col items-center">
            <Tag size={48} className="mb-4 opacity-50" />
            <p className="text-lg">No hay notas en esta categoría.</p>
            <p className="text-sm">¡Crea una tocando el botón de abajo!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {notes.map(note => {
              const category = categories.find(c => c.id === note.categoryId);
              const cleanContent = note.content.replace(/[#*`_>]/g, '').substring(0, 120);
              return (
                <div
                  key={note.id}
                  onClick={() => onViewNote(note.id)}
                  className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 flex flex-col h-48 cursor-pointer hover:shadow-md hover:-translate-y-1 transition-all group"
                >
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-bold text-lg text-slate-800 line-clamp-1 group-hover:text-indigo-600 transition-colors">
                      {note.title || 'Sin Título'}
                    </h3>
                  </div>
                  <p className="text-slate-500 text-sm flex-grow line-clamp-4 leading-relaxed">
                    {cleanContent || 'No hay contenido adicional.'}
                    {note.content.length > 120 && '...'}
                  </p>
                  <div className="mt-4 flex justify-between items-center">
                    {category && (
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${category.color}`}>{category.name}</span>
                    )}
                    <span className="text-xs text-slate-400 font-medium">
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
function EditorView({ note, categories, onSave, onCancel, scriptsLoaded }) {
  const rootCategories = categories.filter(c => !c.parentId);

  // Determinar valores iniciales
  const getInitialState = () => {
    const noteCat = categories.find(c => c.id === note?.categoryId);
    if (noteCat) {
      if (noteCat.parentId) {
        return { parent: noteCat.parentId, sub: noteCat.id };
      }
      return { parent: noteCat.id, sub: 'none' };
    }
    return { parent: rootCategories[0]?.id || '', sub: 'none' };
  };

  const initialState = getInitialState();
  const [title, setTitle] = useState(note?.title || '');
  const [content, setContent] = useState(note?.content || '');
  const [parentCategoryId, setParentCategoryId] = useState(initialState.parent);
  const [subCategoryId, setSubCategoryId] = useState(initialState.sub);
  const [activeTab, setActiveTab] = useState('write');
  const [saving, setSaving] = useState(false);

  // Subcategorías disponibles para el padre seleccionado
  const availableSubcategories = categories.filter(c => c.parentId === parentCategoryId);

  const handleSave = async () => {
    if (!title.trim() && !content.trim()) return;
    setSaving(true);
    // El ID final es la subcategoría si se eligió una; si no, la categoría raíz
    const finalCategoryId = subCategoryId !== 'none' ? subCategoryId : parentCategoryId;
    await onSave({ title, content, categoryId: finalCategoryId });
    setSaving(false);
  };

  const handleParentChange = (e) => {
    setParentCategoryId(e.target.value);
    setSubCategoryId('none'); // Resetear subcategoría al cambiar de padre
  };

  return (
    <div className="w-full max-w-4xl mx-auto min-h-screen bg-white flex flex-col shadow-xl">
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

      <main className="flex-grow flex flex-col p-4 sm:p-6 overflow-y-auto">
        {activeTab === 'write' ? (
          <div className="flex flex-col flex-grow h-full">
            <input
              type="text"
              placeholder="Título de la nota..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-3xl sm:text-4xl font-bold text-slate-800 placeholder-slate-300 outline-none w-full bg-transparent mb-4"
            />
            
            <div className="mb-6 flex flex-wrap gap-4 items-center">
              {/* Selector de Categoría Principal */}
              <div className="flex items-center">
                <Tag size={18} className="text-slate-400 mr-2" title="Categoría Principal" />
                <select
                  value={parentCategoryId}
                  onChange={handleParentChange}
                  className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2 outline-none cursor-pointer"
                >
                  {rootCategories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              {/* Selector de Subcategoría (Solo si hay disponibles) */}
              {availableSubcategories.length > 0 && (
                <div className="flex items-center animate-in fade-in slide-in-from-left-2 duration-200">
                  <div className="w-4 h-px bg-slate-200 mr-2 hidden sm:block"></div>
                  <select
                    value={subCategoryId}
                    onChange={(e) => setSubCategoryId(e.target.value)}
                    className="bg-indigo-50/50 border border-indigo-100 text-indigo-700 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2 outline-none cursor-pointer"
                  >
                    <option value="none">Sin subcategoría</option>
                    {availableSubcategories.map(sub => (
                      <option key={sub.id} value={sub.id}>{sub.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <textarea
              placeholder="Escribe aquí tu nota usando Markdown..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="flex-grow w-full resize-none outline-none text-slate-700 text-lg leading-relaxed bg-transparent placeholder-slate-300 min-h-[300px]"
            />
          </div>
        ) : (
          <div className="flex-grow bg-white rounded-xl p-2">
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-800 mb-6">{title || 'Sin Título'}</h1>
            {content.trim()
              ? <MarkdownRenderer content={content} isReady={scriptsLoaded} />
              : <p className="text-slate-400 italic">No hay contenido para visualizar.</p>
            }
          </div>
        )}
      </main>
    </div>
  );
}

// --- Vista de Visualización ---
function ViewerView({ note, category, onEdit, onBack, onDelete, scriptsLoaded }) {
  if (!note) return null;
  return (
    <div className="w-full max-w-4xl mx-auto min-h-screen bg-white shadow-xl">
      <header className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-white sticky top-0 z-20">
        <button onClick={onBack} className="p-2 -ml-2 text-slate-500 hover:text-slate-800 rounded-full hover:bg-slate-50 transition-colors flex items-center">
          <ChevronLeft size={24} /><span className="font-medium hidden sm:inline ml-1">Volver</span>
        </button>
        <div className="flex gap-2">
          <button onClick={onDelete} className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors" title="Eliminar">
            <Trash2 size={20} />
          </button>
          <button onClick={onEdit} className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200 transition-colors">
            <Edit3 size={18} /> Editar
          </button>
        </div>
      </header>
      <main className="p-6 sm:p-10 pb-24">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">{note.title}</h1>
          <div className="flex items-center gap-4">
            {category && (
              <span className={`text-sm px-3 py-1 rounded-full font-medium ${category.color}`}>{category.name}</span>
            )}
            <span className="text-sm text-slate-400">
              Modificado: {new Date(note.updatedAt).toLocaleDateString()} a las {new Date(note.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>
        <div className="border-t border-slate-100 pt-8">
          <MarkdownRenderer content={note.content} isReady={scriptsLoaded} />
        </div>
      </main>
    </div>
  );
}

// --- Renderizador Markdown + Mermaid ---
function MarkdownRenderer({ content, isReady }) {
  const containerRef = useRef(null);
  const [html, setHtml] = useState('');

  useEffect(() => {
    if (!isReady || !window.marked) return;
    const renderer = new window.marked.Renderer();
    renderer.code = (argsOrCode, lang) => {
      // Compatibilidad con diferentes versiones de Marked (objeto tokens vs argumentos planos)
      const code = typeof argsOrCode === 'object' ? argsOrCode.text : argsOrCode;
      const language = typeof argsOrCode === 'object' ? argsOrCode.lang : lang;
      const safeCode = (code || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');

      if (language === 'mermaid') return `<div class="mermaid">${code}</div>`;
      return `<pre><code class="language-${language || ''}">${safeCode}</code></pre>`;
    };
    window.marked.setOptions({ renderer, breaks: true, gfm: true });
    setHtml(window.marked.parse(content));
  }, [content, isReady]);

  useEffect(() => {
    if (!isReady || !window.mermaid || !html) return;
    const id = setTimeout(() => {
      try {
        const nodes = containerRef.current?.querySelectorAll('.mermaid');
        if (nodes?.length) window.mermaid.init(undefined, nodes);
      } catch (e) { console.warn('Mermaid error:', e); }
    }, 100);
    return () => clearTimeout(id);
  }, [html, isReady]);

  if (!isReady) return <div className="text-slate-400 animate-pulse">Cargando renderizador...</div>;

  return (
    <div
      ref={containerRef}
      className="markdown-body text-lg text-slate-800"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
