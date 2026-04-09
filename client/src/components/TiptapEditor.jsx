import { useEditor, EditorContent } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import { TaskList } from '@tiptap/extension-task-list';
import { TaskItem } from '@tiptap/extension-task-item';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableHeader } from '@tiptap/extension-table-header';
import { TableCell } from '@tiptap/extension-table-cell';
import { Placeholder } from '@tiptap/extension-placeholder';
import { 
  Bold, Italic, List, ListOrdered, CheckSquare, 
  Heading1, Heading2, Heading3, Quote, Code, 
  Table as TableIcon, Maximize, Undo, Redo, 
  Columns, Save, ChevronDown, Trash2, 
  Plus, Minus, Layout, 
  ArrowUpToLine, ArrowDownToLine, ArrowLeftToLine, ArrowRightToLine
} from 'lucide-react';
import React, { useEffect, useState, useRef } from 'react';

const TiptapEditor = ({ content, onChange, type = 'standard' }) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        code: false, // Desactivamos el código inline automático para que no atrape las comillas
      }),
      TaskList.configure(),
      TaskItem.configure({
        nested: true,
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow.configure(),
      TableHeader.configure(),
      TableCell.configure(),
      Placeholder.configure({
        placeholder: ({ node }) => {
          if (node.type.name === 'heading') {
            return 'Título...';
          }
          return 'Comienza a escribir o usa "/" para comandos...';
        },
      }),
    ],
    content: content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'tiptap prose prose-slate max-w-none focus:outline-none min-h-[500px] px-8 py-4',
      },
    },
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  if (!editor) {
    return null;
  }

  const [showGrid, setShowGrid] = useState(false);
  const [hoverGrid, setHoverGrid] = useState({ r: 0, c: 0 });
  const gridRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (gridRef.current && !gridRef.current.contains(event.target)) {
        setShowGrid(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const insertCornell = () => {
    editor.chain().focus().insertContent(`
      <table style="width: 100%; border-collapse: collapse;">
        <tbody>
          <tr>
            <th style="width: 30%; border: 1px solid #e2e8f0; padding: 12px; background: #f8fafc;">Preguntas Clave / Cues</th>
            <th style="width: 70%; border: 1px solid #e2e8f0; padding: 12px; background: #f8fafc;">Notas Detalladas</th>
          </tr>
          <tr>
            <td style="border: 1px solid #e2e8f0; padding: 12px; vertical-align: top;"></td>
            <td style="border: 1px solid #e2e8f0; padding: 12px; vertical-align: top;"></td>
          </tr>
        </tbody>
      </table>
      <div style="margin-top: 1rem; border: 1px solid #e2e8f0; padding: 12px;">
        <strong>Resumen:</strong>
        <p></p>
      </div>
    `).run();
  };

  const createTable = (rows, cols) => {
    editor.chain().focus().insertTable({ rows, cols, withHeaderRow: true }).run();
    setShowGrid(false);
  };

  const MenuBar = () => {
    return (
      <div className="editor-toolbar sticky top-0 bg-white/95 backdrop-blur-md z-10 border-b border-slate-200 p-2 flex flex-wrap gap-1 rounded-t-xl shadow-sm">
        <div className="toolbar-group flex items-center gap-1 pr-2 border-r border-slate-200">
          <button 
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-2 rounded hover:bg-slate-100 ${editor.isActive('bold') ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600'}`}
            title="Negrita"
          ><Bold size={18} /></button>
          <button 
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-2 rounded hover:bg-slate-100 ${editor.isActive('italic') ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600'}`}
            title="Cursiva"
          ><Italic size={18} /></button>
        </div>

        <div className="toolbar-group flex items-center gap-1 px-2 border-r border-slate-200">
          <button 
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={`p-2 rounded hover:bg-slate-100 ${editor.isActive('heading', { level: 1 }) ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600'}`}
            title="H1"
          ><Heading1 size={18} /></button>
          <button 
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`p-2 rounded hover:bg-slate-100 ${editor.isActive('heading', { level: 2 }) ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600'}`}
            title="H2"
          ><Heading2 size={18} /></button>
          <button 
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={`p-2 rounded hover:bg-slate-100 ${editor.isActive('heading', { level: 3 }) ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600'}`}
            title="H3"
          ><Heading3 size={18} /></button>
        </div>

        <div className="toolbar-group flex items-center gap-1 px-2 border-r border-slate-200">
          <button 
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`p-2 rounded hover:bg-slate-100 ${editor.isActive('bulletList') ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600'}`}
            title="Lista"
          ><List size={18} /></button>
          <button 
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`p-2 rounded hover:bg-slate-100 ${editor.isActive('orderedList') ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600'}`}
            title="Lista Numerada"
          ><ListOrdered size={18} /></button>
          <button 
            onClick={() => editor.chain().focus().toggleTaskList().run()}
            className={`p-2 rounded hover:bg-slate-100 ${editor.isActive('taskList') ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600'}`}
            title="Tareas"
          ><CheckSquare size={18} /></button>
        </div>

        <div className="toolbar-group flex items-center gap-1 px-2 border-r border-slate-200">
          <button 
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={`p-2 rounded hover:bg-slate-100 ${editor.isActive('blockquote') ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600'}`}
            title="Cita"
          ><Quote size={18} /></button>
          <button 
            onClick={() => editor.chain().focus().insertContent('\n```javascript\n\n```\n').run()}
            className="p-2 rounded hover:bg-slate-100 text-slate-600"
            title="Insertar Bloque de Código (Markdown)"
          ><Code size={18} /></button>
          
          <div className="relative" ref={gridRef}>
            <button 
              onClick={() => setShowGrid(!showGrid)}
              className={`p-2 rounded hover:bg-slate-100 flex items-center gap-0.5 ${showGrid ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600'}`}
              title="Insertar Tabla Dinámica"
            >
              <TableIcon size={18} />
              <ChevronDown size={12} />
            </button>
            
            {showGrid && (
              <div className="absolute top-full left-0 mt-1 p-3 bg-white border border-slate-200 shadow-xl rounded-xl z-[60] animate-in fade-in zoom-in-95 duration-100">
                <div className="text-[10px] uppercase font-bold text-slate-400 mb-2 text-center">
                  Tabla {hoverGrid.c} x {hoverGrid.r}
                </div>
                <div 
                  className="grid grid-cols-10 gap-1"
                  onMouseLeave={() => setHoverGrid({ r: 0, c: 0 })}
                >
                  {[...Array(10)].map((_, r) => (
                    [...Array(10)].map((_, c) => (
                      <div 
                        key={`${r}-${c}`}
                        onMouseEnter={() => setHoverGrid({ r: r + 1, c: c + 1 })}
                        onClick={() => createTable(r + 1, c + 1)}
                        className={`w-4 h-4 rounded-sm border transition-colors cursor-pointer ${
                          r < hoverGrid.r && c < hoverGrid.c 
                            ? 'bg-indigo-500 border-indigo-600' 
                            : 'bg-slate-50 border-slate-200'
                        }`}
                      />
                    ))
                  ))}
                </div>
              </div>
            )}
          </div>

          <button 
            onClick={insertCornell}
            className="p-2 rounded hover:bg-slate-100 text-slate-600"
            title="Insertar Formato Cornell"
          ><Columns size={18} /></button>
        </div>

        {/* Acciones de Tabla Contextuales */}
        {editor.isActive('table') && (
          <div className="toolbar-group flex items-center gap-1 px-2 border-r border-indigo-200 bg-indigo-50/50 animate-in slide-in-from-left-2 duration-200">
            <div className="flex border-r border-indigo-100 pr-1 mr-1">
              <button onClick={() => editor.chain().focus().addColumnBefore().run()} className="p-1.5 text-indigo-600 hover:bg-indigo-100 rounded" title="Añadir Columna Izquierda"><ArrowLeftToLine size={16} /></button>
              <button onClick={() => editor.chain().focus().addColumnAfter().run()} className="p-1.5 text-indigo-600 hover:bg-indigo-100 rounded" title="Añadir Columna Derecha"><ArrowRightToLine size={16} /></button>
              <button onClick={() => editor.chain().focus().deleteColumn().run()} className="p-1.5 text-red-500 hover:bg-red-50 rounded" title="Eliminar Columna"><Minus size={16} className="rotate-90" /></button>
            </div>
            <div className="flex border-r border-indigo-100 pr-1 mr-1">
              <button onClick={() => editor.chain().focus().addRowBefore().run()} className="p-1.5 text-indigo-600 hover:bg-indigo-100 rounded" title="Añadir Fila Arriba"><ArrowUpToLine size={16} /></button>
              <button onClick={() => editor.chain().focus().addRowAfter().run()} className="p-1.5 text-indigo-600 hover:bg-indigo-100 rounded" title="Añadir Fila Abajo"><ArrowDownToLine size={16} /></button>
              <button onClick={() => editor.chain().focus().deleteRow().run()} className="p-1.5 text-red-500 hover:bg-red-50 rounded" title="Eliminar Fila"><Minus size={16} /></button>
            </div>
            <button onClick={() => editor.chain().focus().deleteTable().run()} className="p-1.5 text-red-600 hover:bg-red-100 rounded" title="Eliminar Tabla Completa"><Trash2 size={16} /></button>
          </div>
        )}

        <div className="toolbar-group flex items-center gap-1 pl-2">
          <button onClick={() => editor.chain().focus().undo().run()} className="p-2 rounded hover:bg-slate-100 text-slate-400" title="Deshacer"><Undo size={18} /></button>
          <button onClick={() => editor.chain().focus().redo().run()} className="p-2 rounded hover:bg-slate-100 text-slate-400" title="Rehacer"><Redo size={18} /></button>
        </div>
      </div>
    );
  };

  return (
    <div className="tiptap-editor-container border border-slate-200 rounded-xl focus-within:border-indigo-300 transition-colors bg-white shadow-sm">
      <MenuBar />
      <EditorContent editor={editor} />
      
      <style>{`
        .tiptap .ProseMirror {
          padding: 2rem;
          min-height: 500px;
        }
        .tiptap .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #adb5bd;
          pointer-events: none;
          height: 0;
        }
        .tiptap ul[data-type="taskList"] {
          list-style: none;
          padding: 0;
        }
        .tiptap ul[data-type="taskList"] li {
          display: flex;
          align-items: flex-start;
          gap: 0.5rem;
          margin-bottom: 0.25rem;
        }
        .tiptap ul[data-type="taskList"] li > label {
          flex: 0 0 auto;
          user-select: none;
          margin-top: 0.25rem;
        }
        .tiptap ul[data-type="taskList"] li > div {
          flex: 1 1 auto;
        }
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
        .tiptap .column-resize-handle {
          position: absolute;
          right: -2px;
          top: 0;
          bottom: -2px;
          width: 4px;
          background-color: #adf;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
};

export default TiptapEditor;
