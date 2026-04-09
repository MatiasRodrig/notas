import React, { useState, useEffect } from 'react';
import { ChevronLeft, Zap, RotateCcw, CheckCircle2, XCircle, ArrowRight, ArrowLeft } from 'lucide-react';

const FlashcardMode = ({ note, onBack }) => {
  const [cards, setCards] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [stats, setStats] = useState({ correct: 0, incorrect: 0 });

  useEffect(() => {
    if (!note || !note.content) return;

    // Extraer datos de la tabla Cornell si existe
    // Buscamos filas en las tablas que parecen ser de Cornell (Pregunta | Nota)
    const parser = new DOMParser();
    const doc = parser.parseFromString(note.content, 'text/html');
    const rows = doc.querySelectorAll('tr');
    
    const extractedCards = [];
    rows.forEach(row => {
      const cells = row.querySelectorAll('td');
      if (cells.length >= 2) {
        const question = cells[0].innerHTML.trim();
        const answer = cells[1].innerHTML.trim();
        if (question && answer && !question.includes('Preguntas Clave')) {
          extractedCards.push({ question, answer });
        }
      }
    });

    // Si no hay tabla, intentar extraer de listas de tareas o headings
    if (extractedCards.length === 0) {
      const headings = doc.querySelectorAll('h1, h2, h3');
      headings.forEach(h => {
        let content = '';
        let next = h.nextElementSibling;
        while (next && !['H1', 'H2', 'H3'].includes(next.tagName)) {
          content += next.outerHTML;
          next = next.nextElementSibling;
        }
        if (h.innerText.trim() && content) {
          extractedCards.push({ question: h.innerHTML, answer: content });
        }
      });
    }

    setCards(extractedCards);
  }, [note]);

  if (cards.length === 0) {
    return (
      <div className="w-full max-w-4xl mx-auto min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
        <Zap size={48} className="text-yellow-400 mb-4" />
        <h2 className="text-2xl font-bold text-slate-800 mb-2">No se encontraron flashcards</h2>
        <p className="text-slate-500 text-center mb-6">Usa el formato Cornell o encabezados para generar tarjetas de estudio automáticamente.</p>
        <button onClick={onBack} className="px-6 py-2 bg-indigo-600 text-white rounded-xl shadow-lg hover:bg-indigo-700 transition-all">Volver</button>
      </div>
    );
  }

  const currentCard = cards[currentIdx];
  const progress = ((currentIdx + 1) / cards.length) * 100;

  const handleNext = () => {
    if (currentIdx < cards.length - 1) {
      setCurrentIdx(currentIdx + 1);
      setIsFlipped(false);
    }
  };

  const handlePrev = () => {
    if (currentIdx > 0) {
      setCurrentIdx(currentIdx - 1);
      setIsFlipped(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto min-h-screen bg-slate-50 flex flex-col shadow-xl animate-in zoom-in-95 duration-300">
      <header className="flex items-center justify-between px-4 py-4 border-b border-slate-100 bg-white sticky top-0 z-20">
        <button onClick={onBack} className="p-2 -ml-2 text-slate-500 hover:text-slate-800 rounded-full hover:bg-slate-50 transition-colors flex items-center">
          <ChevronLeft size={24} /><span className="font-medium ml-1">Cerrar Sesión</span>
        </button>
        <div className="flex flex-col items-center">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Estudiando</span>
          <span className="font-bold text-slate-800 truncate max-w-[200px]">{note.title}</span>
        </div>
        <div className="text-sm font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
          {currentIdx + 1} / {cards.length}
        </div>
      </header>

      <main className="flex-grow flex flex-col items-center p-6 sm:p-10">
        <div className="w-full bg-slate-200 h-1.5 rounded-full mb-10 overflow-hidden">
          <div className="bg-indigo-600 h-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
        </div>

        <div 
          className="perspective-1000 w-full max-w-2xl h-[400px] cursor-pointer group"
          onClick={() => setIsFlipped(!isFlipped)}
        >
          <div className={`relative w-full h-full transition-transform duration-500 preserve-3d shadow-2xl rounded-3xl ${isFlipped ? 'rotate-y-180' : ''}`}>
            
            {/* Front: Question */}
            <div className={`absolute inset-0 backface-hidden bg-white border-2 border-slate-100 p-10 flex flex-col items-center justify-center text-center rounded-3xl ${isFlipped ? 'invisible' : 'visible'}`}>
              <span className="text-xs font-bold text-indigo-400 mb-6 uppercase tracking-widest">Pregunta</span>
              <div className="text-2xl font-bold text-slate-800 leading-relaxed" dangerouslySetInnerHTML={{ __html: currentCard.question }}></div>
              <p className="mt-8 text-slate-400 text-sm animate-pulse">Toca para ver la respuesta</p>
            </div>

            {/* Back: Answer */}
            <div className={`absolute inset-0 backface-hidden bg-indigo-600 text-white p-10 flex flex-col items-center justify-center text-center rounded-3xl rotate-y-180 ${isFlipped ? 'visible' : 'invisible'}`}>
              <span className="text-xs font-bold text-indigo-200 mb-6 uppercase tracking-widest">Respuesta</span>
              <div className="text-xl leading-relaxed overflow-y-auto max-h-full scrollbar-hide" dangerouslySetInnerHTML={{ __html: currentCard.answer }}></div>
              <p className="mt-8 text-indigo-200 text-sm">Toca para volver a la pregunta</p>
            </div>
          </div>
        </div>

        <div className="mt-12 flex items-center gap-6">
          <button 
            disabled={currentIdx === 0}
            onClick={(e) => { e.stopPropagation(); handlePrev(); }}
            className="p-4 bg-white border border-slate-200 text-slate-400 rounded-full hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          ><ArrowLeft size={24} /></button>

          <div className="flex gap-4">
            <button 
              onClick={(e) => { e.stopPropagation(); setStats({...stats, incorrect: stats.incorrect + 1}); handleNext(); }}
              className="flex items-center gap-2 px-6 py-3 bg-red-100 text-red-700 rounded-2xl font-bold hover:bg-red-200 transition-all border border-red-200"
            >
              <XCircle size={20} /> <span className="hidden sm:inline">No la sé</span>
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); setStats({...stats, correct: stats.correct + 1}); handleNext(); }}
              className="flex items-center gap-2 px-6 py-3 bg-green-100 text-green-700 rounded-2xl font-bold hover:bg-green-200 transition-all border border-green-200"
            >
              <CheckCircle2 size={20} /> <span className="hidden sm:inline">¡La sé!</span>
            </button>
          </div>

          <button 
            disabled={currentIdx === cards.length - 1}
            onClick={(e) => { e.stopPropagation(); handleNext(); }}
            className="p-4 bg-white border border-slate-200 text-slate-400 rounded-full hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          ><ArrowRight size={24} /></button>
        </div>

        {currentIdx === cards.length - 1 && isFlipped && (
          <div className="mt-8 animate-bounce">
            <button onClick={onBack} className="flex items-center gap-2 px-8 py-4 bg-indigo-600 text-white rounded-full font-bold shadow-xl">
              <RotateCcw size={20} /> Finalizar Sesión
            </button>
          </div>
        )}
      </main>

      <style>{`
        .perspective-1000 { perspective: 1000px; }
        .preserve-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default FlashcardMode;
