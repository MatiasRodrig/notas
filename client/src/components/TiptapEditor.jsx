import { useEditor, EditorContent } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import { TaskList } from '@tiptap/extension-task-list';
import { TaskItem } from '@tiptap/extension-task-item';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableHeader } from '@tiptap/extension-table-header';
import { TableCell } from '@tiptap/extension-table-cell';
import { Placeholder } from '@tiptap/extension-placeholder';
import { Image } from '@tiptap/extension-image';
import { Highlight } from '@tiptap/extension-highlight';
import { Underline } from '@tiptap/extension-underline';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { 
  Bold, Italic, List, ListOrdered, CheckSquare, 
  Heading1, Heading2, Heading3, Quote, Code, 
  Table as TableIcon, Maximize, Undo, Redo, 
  Columns, Save, ChevronDown, Trash2, 
  Plus, Minus, Layout, Activity, Image as ImageIcon,
  ArrowUpToLine, ArrowDownToLine, ArrowLeftToLine, ArrowRightToLine,
  Share2, Terminal, SquareCode, FileCode
} from 'lucide-react';
import React, { useEffect, useState, useRef } from 'react';
import { API_BASE, getAssetUrl, GalleryModal } from '../App';
import MarkdownSnippetModal from './MarkdownSnippetModal';
import MermaidWizardModal from './MermaidWizardModal';

const POPULAR_EMOJIS = ['⭐', '🔥', '✅', '🚀', '💡', '⚠️', '🎯', '📍', '📝', '📅', '⌛', '✨', '👍', '❤️', '📁', '💻'];

const TiptapEditor = ({ content, onChange, type = 'standard' }) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // starter-kit ya incluye code y codeBlock por defecto
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
      Image.configure({
        allowBase64: false, // Forzar subida al servidor
        HTMLAttributes: {
          class: 'rounded-lg shadow-md max-w-full h-auto my-4 border border-slate-200',
        },
      }),
      Highlight.configure({ multicolor: true }),
      Underline,
      TextStyle,
      Color,
    ],
    content: content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'tiptap prose prose-slate max-w-none focus:outline-none min-h-[500px] px-8 py-4',
      },
      handleDrop: (view, event, slice, moved) => {
        if (!moved && event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0]) {
          const file = event.dataTransfer.files[0];
          if (file.type.startsWith('image/') || file.name.toLowerCase().endsWith('.svg')) {
            uploadImage(file).then(url => {
              if (url) {
                const { schema } = view.state;
                const coordinates = view.posAtCoords({ left: event.clientX, top: event.clientY });
                const node = schema.nodes.image.create({ src: url });
                const transaction = view.state.tr.insert(coordinates.pos, node);
                view.dispatch(transaction);
              }
            });
            return true;
          }
        }
        return false;
      },
      handlePaste: (view, event) => {
        if (event.clipboardData && event.clipboardData.files && event.clipboardData.files[0]) {
          const file = event.clipboardData.files[0];
          if (file.type.startsWith('image/') || file.name.toLowerCase().endsWith('.svg')) {
            uploadImage(file).then(url => {
              if (url) {
                const { schema } = view.state;
                const node = schema.nodes.image.create({ src: url });
                const transaction = view.state.tr.replaceSelectionWith(node);
                view.dispatch(transaction);
              }
            });
            return true;
          }
        }
        return false;
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
  const [showMarkdownModal, setShowMarkdownModal] = useState(false);
  const [showMermaidModal, setShowMermaidModal] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const gridRef = useRef(null);
  const emojiRef = useRef(null);
  const colorRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (gridRef.current && !gridRef.current.contains(event.target)) setShowGrid(false);
      if (emojiRef.current && !emojiRef.current.contains(event.target)) setShowEmojiPicker(false);
      if (colorRef.current && !colorRef.current.contains(event.target)) setShowColorPicker(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  const fileInputRef = useRef(null);
  const [showGallery, setShowGallery] = useState(false);

  const uploadImage = async (file) => {
    if (file.size > 10 * 1024 * 1024) {
      alert("La imagen es demasiado grande. Máximo 10MB.");
      return null;
    }

    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch(`${API_BASE}/upload`, {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (data.url) return data.url;
      throw new Error(data.error || "Error al subir imagen");
    } catch (err) {
      console.error(err);
      alert("Error al subir la imagen.");
      return null;
    }
  };

  const onFileSelect = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = await uploadImage(file);
      if (url) {
        editor.chain().focus().setImage({ src: url }).run();
      }
    }
    e.target.value = ''; // Reset input
  };

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

  const insertCallout = (type) => {
    const config = {
      note: { icon: 'NOTE', title: 'Nota' },
      tip: { icon: 'TIP', title: 'Tip' },
      important: { icon: 'IMPORTANT', title: 'Importante' },
      warning: { icon: 'WARNING', title: 'Advertencia' },
    };
    const c = config[type];
    editor.chain().focus().insertContent(`<blockquote>[!${c.icon}]\nTu texto aquí...</blockquote>`).run();
  };

  const MenuBar = () => {
    return (
      <div className="editor-toolbar sticky top-0 bg-white/95 backdrop-blur-md z-10 border-b border-slate-200 p-1 flex flex-wrap gap-0.5 rounded-t-xl shadow-sm">
        {/* Grupo 1: Estilo de Texto Principal */}
        <div className="toolbar-group flex items-center gap-0.5 pr-1 border-r border-slate-200">
          <button 
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-1.5 rounded hover:bg-slate-100 transition-colors ${editor.isActive('bold') ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500'}`}
            title="Negrita"
          ><Bold size={16} /></button>
          <button 
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-1.5 rounded hover:bg-slate-100 transition-colors ${editor.isActive('italic') ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500'}`}
            title="Cursiva"
          ><Italic size={16} /></button>
          <button 
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={`p-1.5 rounded hover:bg-slate-100 transition-colors ${editor.isActive('underline') ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500'}`}
            title="Subrayado"
          ><Maximize size={16} className="rotate-45" /></button>
          <button 
            onClick={() => editor.chain().focus().toggleHighlight().run()}
            className={`p-1.5 rounded hover:bg-slate-100 transition-colors ${editor.isActive('highlight') ? 'bg-yellow-100 text-yellow-700' : 'text-slate-500'}`}
            title="Resaltar"
          ><Layout size={16} /></button>
          
          <div className="relative" ref={colorRef}>
            <button 
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="p-1.5 rounded hover:bg-slate-100 text-slate-500 flex items-center"
              title="Color de Texto"
            >
              <div className="w-4 h-4 rounded-full border border-slate-200 bg-indigo-500" style={{ backgroundColor: editor.getAttributes('textStyle').color || 'currentColor' }}></div>
            </button>
            {showColorPicker && (
              <div className="absolute top-full left-0 mt-1 p-2 bg-white border border-slate-200 shadow-xl rounded-lg z-50 grid grid-cols-5 gap-1">
                {['#000000', '#4f46e5', '#16a34a', '#dc2626', '#ca8a04', '#9333ea', '#0891b2', '#4b5563', '#be185d', '#7c3aed'].map(c => (
                  <button 
                    key={c} 
                    onClick={() => { editor.chain().focus().setColor(c).run(); setShowColorPicker(false); }}
                    className="w-5 h-5 rounded-full border border-slate-100 cursor-pointer hover:scale-110 transition-transform"
                    style={{ backgroundColor: c }}
                  />
                ))}
                <button onClick={() => { editor.chain().focus().unsetColor().run(); setShowColorPicker(false); }} className="col-span-12 text-[10px] uppercase font-bold text-slate-400 p-1 hover:text-indigo-600">Reset</button>
              </div>
            )}
          </div>
        </div>

        {/* Grupo 2: Encabezados */}
        <div className="toolbar-group flex items-center gap-0.5 px-1 border-r border-slate-200">
          <button 
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={`p-1.5 rounded hover:bg-slate-100 transition-colors ${editor.isActive('heading', { level: 1 }) ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500'}`}
            title="H1"
          ><Heading1 size={16} /></button>
          <button 
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`p-1.5 rounded hover:bg-slate-100 transition-colors ${editor.isActive('heading', { level: 2 }) ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500'}`}
            title="H2"
          ><Heading2 size={16} /></button>
          <button 
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={`p-1.5 rounded hover:bg-slate-100 transition-colors ${editor.isActive('heading', { level: 3 }) ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500'}`}
            title="H3"
          ><Heading3 size={16} /></button>
        </div>

        {/* Grupo 3: Listas y Tareas */}
        <div className="toolbar-group flex items-center gap-0.5 px-1 border-r border-slate-200">
          <button 
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`p-1.5 rounded hover:bg-slate-100 transition-colors ${editor.isActive('bulletList') ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500'}`}
            title="Lista"
          ><List size={16} /></button>
          <button 
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`p-1.5 rounded hover:bg-slate-100 transition-colors ${editor.isActive('orderedList') ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500'}`}
            title="Lista Numerada"
          ><ListOrdered size={16} /></button>
          <button 
            onClick={() => editor.chain().focus().toggleTaskList().run()}
            className={`p-1.5 rounded hover:bg-slate-100 transition-colors ${editor.isActive('taskList') ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500'}`}
            title="Tareas"
          ><CheckSquare size={16} /></button>
        </div>

        {/* Grupo 4: Elementos Especiales (Callouts, MD, Mermaid) */}
        <div className="toolbar-group flex items-center gap-0.5 px-1 border-r border-slate-200">
          <button 
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={`p-1.5 rounded hover:bg-slate-100 transition-colors ${editor.isActive('blockquote') ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500'}`}
            title="Cita"
          ><Quote size={16} /></button>
          
          <div className="relative group">
            <button className="p-1.5 rounded hover:bg-slate-100 text-slate-500" title="Avisos (Callouts)"><Activity size={16} /></button>
            <div className="absolute top-full left-0 mt-1 hidden group-hover:flex flex-col bg-white border border-slate-200 shadow-xl rounded-lg z-50 py-1 w-32">
              <button onClick={() => insertCallout('note')} className="px-3 py-1.5 text-xs text-left hover:bg-blue-50 text-blue-700">Nota</button>
              <button onClick={() => insertCallout('tip')} className="px-3 py-1.5 text-xs text-left hover:bg-green-50 text-green-700">Tip</button>
              <button onClick={() => insertCallout('important')} className="px-3 py-1.5 text-xs text-left hover:bg-amber-50 text-amber-700">Importante</button>
              <button onClick={() => insertCallout('warning')} className="px-3 py-1.5 text-xs text-left hover:bg-red-50 text-red-700">Aviso</button>
            </div>
          </div>

          <button 
            onClick={() => editor.chain().focus().toggleCode().run()}
            className={`p-1.5 rounded hover:bg-slate-100 transition-colors ${editor.isActive('code') ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500'}`}
            title="Código Inline"
          ><Code size={16} /></button>

          <button 
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            className={`p-1.5 rounded hover:bg-slate-100 transition-colors ${editor.isActive('codeBlock') ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500'}`}
            title="Bloque de Código"
          ><SquareCode size={16} /></button>

          <button 
            onClick={() => setShowMarkdownModal(true)}
            className="p-1.5 rounded hover:bg-slate-100 text-slate-500"
            title="Insertar desde Markdown"
          ><FileCode size={16} /></button>
          <button 
            onClick={() => setShowMermaidModal(true)}
            className="p-1.5 rounded hover:bg-slate-100 text-slate-500"
            title="Asistente de Diagramas Mermaid"
          ><Activity size={16} className="text-indigo-500" /></button>
          
          <button 
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            className="p-1.5 rounded hover:bg-slate-100 text-slate-500"
            title="Separador Horizontal"
          ><Minus size={16} /></button>
        </div>

        {/* Grupo 5: Tablas y Layout */}
        <div className="toolbar-group flex items-center gap-0.5 px-1 border-r border-slate-200">
          <div className="relative" ref={gridRef}>
            <button 
              onClick={() => setShowGrid(!showGrid)}
              className={`p-1.5 rounded hover:bg-slate-100 flex items-center gap-0.5 transition-colors ${showGrid ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500'}`}
              title="Insertar Tabla Dinámica"
            >
              <TableIcon size={16} /><ChevronDown size={10} />
            </button>
            {showGrid && (
              <div className="absolute top-full left-0 mt-1 p-3 bg-white border border-slate-200 shadow-xl rounded-xl z-[60] animate-in fade-in zoom-in-95 duration-100">
                <div className="text-[10px] uppercase font-bold text-slate-400 mb-2 text-center">Tabla {hoverGrid.c} x {hoverGrid.r}</div>
                <div className="grid grid-cols-10 gap-1" onMouseLeave={() => setHoverGrid({ r: 0, c: 0 })}>
                  {[...Array(10)].map((_, r) => [...Array(10)].map((_, c) => (
                    <div key={`${r}-${c}`} onMouseEnter={() => setHoverGrid({ r: r + 1, c: c + 1 })} onClick={() => createTable(r + 1, c + 1)} className={`w-3.5 h-3.5 rounded-sm border transition-colors cursor-pointer ${r < hoverGrid.r && c < hoverGrid.c ? 'bg-indigo-500 border-indigo-600' : 'bg-slate-50 border-slate-200'}`} />
                  )))}
                </div>
              </div>
            )}
          </div>
          <button onClick={insertCornell} className="p-1.5 rounded hover:bg-slate-100 text-slate-500" title="Formato Cornell"><Columns size={16} /></button>
        </div>

        {/* Grupo 6: Imágenes y Emojis */}
        <div className="toolbar-group flex items-center gap-0.5 px-1 border-r border-slate-200">
          <button onClick={() => fileInputRef.current?.click()} className="p-1.5 rounded hover:bg-slate-100 text-slate-500" title="Subir Imagen"><ImageIcon size={16} /><input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={onFileSelect} /></button>
          <button onClick={() => setShowGallery(true)} className="p-1.5 rounded hover:bg-slate-100 text-slate-500" title="Galería"><Share2 size={16} /></button>
          
          <div className="relative" ref={emojiRef}>
            <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="p-1.5 rounded hover:bg-slate-100 text-slate-500" title="Emojis">✨</button>
            {showEmojiPicker && (
              <div className="absolute top-full right-0 mt-1 p-2 bg-white border border-slate-200 shadow-xl rounded-xl z-50 w-40 grid grid-cols-4 gap-1 animate-in fade-in zoom-in-95 duration-100">
                {POPULAR_EMOJIS.map(e => (
                  <button key={e} onClick={() => { editor.chain().focus().insertContent(e).run(); setShowEmojiPicker(false); }} className="p-1.5 hover:bg-slate-50 rounded text-lg transition-transform hover:scale-125">{e}</button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Grupo 7: Acciones */}
        <div className="toolbar-group flex items-center gap-0.5 px-1 border-r border-slate-200">
          <button onClick={() => editor.chain().focus().undo().run()} className="p-1.5 rounded hover:bg-slate-100 text-slate-300 transition-colors" title="Deshacer"><Undo size={16} /></button>
          <button onClick={() => editor.chain().focus().redo().run()} className="p-1.5 rounded hover:bg-slate-100 text-slate-300 transition-colors" title="Rehacer"><Redo size={16} /></button>
        </div>
      </div>
    );
  };

  return (
    <div className="tiptap-editor-container border border-slate-200 rounded-xl focus-within:border-indigo-300 transition-colors bg-white shadow-sm">
      <MenuBar />
      <EditorContent editor={editor} />
      
      {showGallery && (
        <GalleryModal 
          onClose={() => setShowGallery(false)}
          onSelect={(url) => {
            editor.chain().focus().setImage({ src: url }).run();
            setShowGallery(false);
          }}
        />
      )}

      {showMarkdownModal && (
        <MarkdownSnippetModal 
          onClose={() => setShowMarkdownModal(false)}
          onInsert={(html) => {
            editor.chain().focus().insertContent(html).run();
            setShowMarkdownModal(false);
          }}
        />
      )}

      {showMermaidModal && (
        <MermaidWizardModal 
          onClose={() => setShowMermaidModal(false)}
          onInsert={(code) => {
            editor.chain().focus().insertContent(code).run();
            setShowMermaidModal(false);
          }}
        />
      )}
      
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
