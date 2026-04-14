import React, { useState, useEffect, useRef } from 'react';
import { X, Activity, Play, Copy, Layout, ChevronRight, Info } from 'lucide-react';

const MERMAID_TEMPLATES = [
  {
    name: 'Flujograma',
    code: 'graph TD\n  A[Inicio] --> B{¿Procesar?}\n  B -- Sí --> C[Resultado]\n  B -- No --> D[Fin]',
    icon: <Layout size={16} />
  },
  {
    name: 'Secuencia',
    code: 'sequenceDiagram\n  Alice->>John: Hola John, ¿cómo estás?\n  John-->>Alice: ¡Bien!',
    icon: <Activity size={16} />
  },
  {
    name: 'Gantt',
    code: 'gantt\n  title Proyecto A\n  section Fase 1\n  Tarea 1 :a1, 2023-01-01, 30d\n  Tarea 2 :after a1, 20d',
    icon: <Play size={16} />
  }
];

const MermaidWizardModal = ({ onClose, onInsert }) => {
  const [code, setCode] = useState(MERMAID_TEMPLATES[0].code);
  const [previewHtml, setPreviewHtml] = useState('');
  const [error, setError] = useState('');
  const previewRef = useRef(null);

  const renderDiagram = async () => {
    if (!window.mermaid) {
        setError('Librería Mermaid no cargada');
        return;
    }
    setError('');
    try {
      const { svg } = await window.mermaid.render('mermaid-wizard-svg-' + Date.now(), code);
      setPreviewHtml(svg);
    } catch (e) {
      setError('Error en la sintaxis de Mermaid');
      console.error(e);
    }
  };

  useEffect(() => {
    const timer = setTimeout(renderDiagram, 500);
    return () => clearTimeout(timer);
  }, [code]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200">
        <header className="p-4 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Activity size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">Asistente Mermaid</h2>
              <p className="text-xs text-slate-400">Crea diagramas y gráficos visuales con código simple.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
            <X size={20} />
          </button>
        </header>

        <main className="flex-grow flex overflow-hidden">
          {/* Editor (Izquierda) */}
          <div className="w-1/2 p-6 flex flex-col gap-4 border-r border-slate-100 bg-slate-50/50">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Plantillas</label>
              <div className="flex gap-2">
                {MERMAID_TEMPLATES.map((t, i) => (
                  <button
                    key={i}
                    onClick={() => setCode(t.code)}
                    className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:border-indigo-300 hover:text-indigo-600 transition-all shadow-sm"
                  >
                    {t.icon} {t.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-grow flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Editor de Código</label>
              <textarea
                className="flex-grow p-4 bg-slate-900 text-slate-100 rounded-xl font-mono text-sm leading-relaxed outline-none border border-slate-800 shadow-inner resize-none"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                spellCheck="false"
              />
            </div>

            <div className="p-3 bg-amber-50 rounded-lg border border-amber-100 flex gap-2">
              <Info size={16} className="text-amber-500 shrink-0 mt-0.5" />
              <p className="text-[10px] text-amber-700 leading-normal">
                Nota: Tiptap insertará esto como un bloque de código Markdown. El visor lo renderizará automáticamente.
              </p>
            </div>
          </div>

          {/* Vista Previa (Derecha) */}
          <div className="w-1/2 p-6 flex flex-col gap-4 bg-white overflow-hidden">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Vista Previa Real</label>
            <div className="flex-grow border border-slate-100 rounded-xl bg-slate-50 relative overflow-auto flex items-center justify-center p-4 shadow-inner">
              {error ? (
                <div className="text-center p-6 text-red-400">
                  <Activity size={32} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm font-medium">{error}</p>
                </div>
              ) : (
                <div className="w-full flex justify-center bg-white p-6 rounded-lg shadow-sm border border-slate-200/50" dangerouslySetInnerHTML={{ __html: previewHtml }} />
              )}
            </div>
            
            <div className="flex justify-end gap-3 mt-2">
              <button
                onClick={onClose}
                className="px-6 py-2 text-slate-500 font-medium hover:text-slate-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => onInsert(`\n\`\`\`mermaid\n${code}\n\`\`\`\n`)}
                disabled={!!error || !code.trim()}
                className="flex items-center gap-2 px-8 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg disabled:opacity-50 disabled:translate-y-0 hover:-translate-y-1 hover:shadow-indigo-500/25"
              >
                Insertar Diagrama <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default MermaidWizardModal;
