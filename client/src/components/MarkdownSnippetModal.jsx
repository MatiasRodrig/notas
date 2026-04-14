import React, { useState } from 'react';
import { X, ChevronRight, Zap, Terminal } from 'lucide-react';

const MarkdownSnippetModal = ({ onClose, onInsert }) => {
  const [markdown, setMarkdown] = useState('');

  const handleInsert = () => {
    if (!markdown.trim()) return;
    
    // Usar marked para convertir a HTML (asumimos que está disponible globalmente)
    let html = '';
    if (window.marked) {
      // Configuramos marked para que genere HTML limpio
      html = window.marked.parse(markdown);
    } else {
      // Fallback simple si por alguna razón no está cargado
      html = markdown.split('\n').map(p => `<p>${p}</p>`).join('');
    }
    
    onInsert(html);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200">
        <header className="p-4 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Terminal size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">Insertar Markdown</h2>
              <p className="text-xs text-slate-400">Pega tu código Markdown para convertirlo a contenido visual.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
            <X size={20} />
          </button>
        </header>

        <main className="flex-grow p-6 flex flex-col gap-4">
          <div className="flex-grow relative border border-slate-200 rounded-xl overflow-hidden focus-within:border-indigo-300 transition-colors bg-slate-50">
            <div className="absolute top-2 right-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest pointer-events-none">
              Markdown Editor
            </div>
            <textarea
              autoFocus
              className="w-full h-[300px] p-6 bg-transparent outline-none resize-none font-mono text-sm leading-relaxed text-slate-700"
              placeholder="# Título&#10;Esto es un **ejemplo** de markdown..."
              value={markdown}
              onChange={(e) => setMarkdown(e.target.value)}
            />
          </div>

          <div className="flex gap-2 justify-between items-center mt-2">
            <div className="flex gap-2">
               <span className="text-[10px] px-2 py-1 bg-slate-100 text-slate-500 rounded font-bold uppercase">Tablas</span>
               <span className="text-[10px] px-2 py-1 bg-slate-100 text-slate-500 rounded font-bold uppercase">Listas</span>
               <span className="text-[10px] px-2 py-1 bg-slate-100 text-slate-500 rounded font-bold uppercase">Gritos #</span>
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-slate-500 font-medium hover:text-slate-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleInsert}
                disabled={!markdown.trim()}
                className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-md disabled:opacity-50 disabled:translate-y-0 hover:-translate-y-0.5 active:translate-y-0"
              >
                Convertir e Insertar <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default MarkdownSnippetModal;
