import React, { useState, useRef, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableHeader } from '@tiptap/extension-table-header';
import { TableCell } from '@tiptap/extension-table-cell';
import { 
  X, Check, Plus, Minus, ArrowUpToLine, ArrowDownToLine, 
  ArrowLeftToLine, ArrowRightToLine, Trash2, ChevronDown, Layout 
} from 'lucide-react';

const TableWizardModal = ({ onClose, onInsert }) => {
  const [showGridSelector, setShowGridSelector] = useState(false);
  const [hoverGrid, setHoverGrid] = useState({ r: 3, c: 3 });
  const gridRef = useRef(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: '<p>Cargando editor de tablas...</p>',
    editorProps: {
      attributes: {
        class: 'tiptap border-none focus:outline-none p-4 min-h-[200px]',
      },
    },
  });

  // Inicializar con una tabla 3x3 por defecto
  useEffect(() => {
    if (editor) {
      editor.commands.setContent('');
      editor.commands.insertTable({ rows: 3, cols: 3, withHeaderRow: true });
    }
  }, [editor]);

  if (!editor) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        <header className="p-4 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
          <div>
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <div className="p-1.5 bg-indigo-100 text-indigo-600 rounded-lg">
                <Layout size={18} />
              </div>
              Asistente de Tablas Notion-style
            </h2>
            <p className="text-xs text-slate-400">Edita visualmente y luego inserta como Markdown.</p>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => onInsert(editor.getHTML())}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-md transition-all h-10"
            >
              <Check size={18} /> Confirmar e Insertar
            </button>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
              <X size={20} />
            </button>
          </div>
        </header>

        {/* Toolbar de la Tabla */}
        <div className="p-2 bg-slate-50 border-b border-slate-100 flex flex-wrap gap-2 items-center">
          <div className="flex bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
            <button onClick={() => editor.chain().focus().addColumnBefore().run()} className="p-1.5 text-slate-600 hover:bg-slate-100 rounded" title="Añadir Columna Izquierda"><ArrowLeftToLine size={16} /></button>
            <button onClick={() => editor.chain().focus().addColumnAfter().run()} className="p-1.5 text-slate-600 hover:bg-slate-100 rounded" title="Añadir Columna Derecha"><ArrowRightToLine size={16} /></button>
            <button onClick={() => editor.chain().focus().deleteColumn().run()} className="p-1.5 text-red-500 hover:bg-red-50 rounded" title="Eliminar Columna"><Minus size={16} className="rotate-90" /></button>
          </div>
          <div className="flex bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
            <button onClick={() => editor.chain().focus().addRowBefore().run()} className="p-1.5 text-slate-600 hover:bg-slate-100 rounded" title="Añadir Fila Arriba"><ArrowUpToLine size={16} /></button>
            <button onClick={() => editor.chain().focus().addRowAfter().run()} className="p-1.5 text-slate-600 hover:bg-slate-100 rounded" title="Añadir Fila Abajo"><ArrowDownToLine size={16} /></button>
            <button onClick={() => editor.chain().focus().deleteRow().run()} className="p-1.5 text-red-500 hover:bg-red-50 rounded" title="Eliminar Fila"><Minus size={16} /></button>
          </div>
          <button onClick={() => editor.chain().focus().deleteTable().run()} className="p-2 text-red-600 hover:bg-red-100 rounded-lg flex items-center gap-1.5 text-xs font-bold" title="Borrar Todo">
            <Trash2 size={16} /> Borrar Todo
          </button>
          
          <div className="flex-grow"></div>
          
          <p className="text-[10px] text-slate-400 italic mr-2 hidden sm:block">Consejo: Haz clic en una celda para ver opciones</p>
        </div>

        <main className="flex-grow overflow-auto bg-slate-50/30 p-8 custom-scrollbar">
          <div className="bg-white rounded-xl shadow-inner border border-slate-200 min-h-[300px]">
            <EditorContent editor={editor} />
          </div>
        </main>
      </div>

      <style>{`
        .tiptap table {
          border-collapse: collapse;
          table-layout: fixed;
          width: 100%;
          margin: 0;
          overflow: hidden;
        }
        .tiptap table td, .tiptap table th {
          min-width: 1em;
          border: 1.5px solid #e2e8f0;
          padding: 12px 15px;
          vertical-align: top;
          box-sizing: border-box;
          position: relative;
        }
        .tiptap table th {
          font-weight: bold;
          text-align: left;
          background-color: #f8fafc;
          border-bottom: 2px solid #e2e8f0;
        }
        .tiptap .selectedCell:after {
          z-index: 2;
          position: absolute;
          content: "";
          left: 0; right: 0; top: 0; bottom: 0;
          background: rgba(200, 200, 255, 0.4);
          pointer-events: none;
        }
      `}</style>
    </div>
  );
};

export default TableWizardModal;
