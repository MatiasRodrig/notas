import React, { useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import rrulePlugin from '@fullcalendar/rrule';
import { ChevronLeft, Calendar as CalendarIcon, Filter } from 'lucide-react';

const CalendarView = ({ notes, categories, onBack, onViewNote }) => {
  const calendarRef = useRef(null);

  // Mapeo de estilos de categoría a colores de FullCalendar
  // Extraemos el color de fondo aproximado de las clases de Tailwind
  const getColorFromClass = (category) => {
    if (!category || !category.color) return '#64748b'; // slate-500
    if (category.color.includes('blue')) return '#3b82f6';
    if (category.color.includes('green')) return '#10b981';
    if (category.color.includes('purple')) return '#8b5cf6';
    if (category.color.includes('red')) return '#ef4444';
    if (category.color.includes('yellow')) return '#f59e0b';
    if (category.color.includes('indigo')) return '#6366f1';
    if (category.color.includes('pink')) return '#ec4899';
    if (category.color.includes('teal')) return '#14b8a6';
    if (category.color.includes('orange')) return '#f97316';
    return '#64748b';
  };

  const events = notes
    .filter(n => n.startDate || n.deadline)
    .map(n => {
      const category = categories.find(c => c.id === n.categoryId);
      const color = getColorFromClass(category);
      
      const event = {
        id: n.id,
        title: n.title || 'Sin Título',
        allDay: n.allDay,
        backgroundColor: color + '20', // Transparencia para el fondo
        borderColor: color,
        textColor: color,
        extendedProps: {
          priority: n.priority,
          categoryName: category?.name || 'Sin Categoría'
        }
      };

      if (n.isRecurring && n.rrule) {
        event.rrule = {
          dtstart: n.startDate || n.deadline,
          freq: n.rrule.split('=')[1].toLowerCase(), // Simplificado: freq=daily -> daily
          // FullCalendar rrule espera objeto o string rrule completa
        };
        // Si es rrule string completa:
        event.rrule = n.rrule + ';DTSTART=' + (n.startDate || n.deadline).replace(/[-:]/g, '');
      } else {
        event.start = n.startDate || n.deadline;
        event.end = n.endDate;
      }

      return event;
    });

  const handleEventClick = (info) => {
    onViewNote(info.event.id);
  };

  return (
    <div className="w-full max-w-5xl mx-auto min-h-screen bg-white flex flex-col shadow-xl animate-in fade-in duration-300">
      <header className="flex items-center justify-between px-4 py-4 border-b border-slate-100 sticky top-0 bg-white z-20">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 -ml-2 text-slate-500 hover:text-slate-800 rounded-full hover:bg-slate-50 transition-colors flex items-center">
            <ChevronLeft size={24} /><span className="font-medium ml-1">Volver</span>
          </button>
          <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>
          <div className="flex items-center gap-2 text-indigo-600 font-bold">
            <CalendarIcon size={20} />
            <span className="hidden sm:inline">Calendario Avanzado</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden md:flex bg-slate-100 p-1 rounded-lg">
             <button onClick={() => calendarRef.current.getApi().changeView('dayGridMonth')} className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-indigo-600 rounded-md transition-all uppercase">Mes</button>
             <button onClick={() => calendarRef.current.getApi().changeView('timeGridWeek')} className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-indigo-600 rounded-md transition-all uppercase">Semana</button>
             <button onClick={() => calendarRef.current.getApi().changeView('timeGridDay')} className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-indigo-600 rounded-md transition-all uppercase">Día</button>
             <button onClick={() => calendarRef.current.getApi().changeView('listYear')} className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-indigo-600 rounded-md transition-all uppercase">Agenda</button>
          </div>
        </div>
      </header>

      <main className="p-4 sm:p-6 flex-grow overflow-y-auto">
        <div className="fullcalendar-wrapper bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
          <FullCalendar
            ref={calendarRef}
            plugins={[
              dayGridPlugin, 
              timeGridPlugin, 
              listPlugin, 
              interactionPlugin, 
              rrulePlugin
            ]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: '' // Movimos las vistas al header personalizado
            }}
            locale="es"
            buttonText={{
              today: 'Hoy'
            }}
            events={events}
            eventClick={handleEventClick}
            height="auto"
            nowIndicator={true}
            editable={false}
            selectable={true}
            dayMaxEvents={true}
            eventTimeFormat={{
              hour: '2-digit',
              minute: '2-digit',
              meridiem: false,
              hour12: false
            }}
          />
        </div>
      </main>

      <style>{`
        .fc { font-family: inherit; --fc-border-color: #f1f5f9; --fc-button-bg-color: #f8fafc; --fc-button-border-color: #e2e8f0; --fc-button-text-color: #64748b; --fc-button-hover-bg-color: #f1f5f9; --fc-button-hover-border-color: #cbd5e1; --fc-button-active-bg-color: #eef2ff; --fc-button-active-border-color: #indigo-200; --fc-event-bg-color: #4f46e5; --fc-event-border-color: #4f46e5; }
        .fc .fc-toolbar-title { font-size: 1.25rem; font-weight: 800; color: #1e293b; text-transform: capitalize; }
        .fc .fc-button-primary:not(:disabled).fc-button-active, .fc .fc-button-primary:not(:disabled):active { background-color: #eef2ff; border-color: #c7d2fe; color: #4f46e5; box-shadow: none; }
        .fc .fc-button { border-radius: 0.75rem; font-weight: 600; font-size: 0.875rem; transition: all 0.2s; }
        .fc .fc-button:focus { box-shadow: none !important; }
        .fc-theme-standard td, .fc-theme-standard th { border-color: #f1f5f9; }
        .fc-daygrid-event { border-radius: 6px; padding: 2px 4px; border-left-width: 4px !important; font-size: 0.75rem; font-weight: 600; }
        .fc-v-event { border-radius: 6px; padding: 2px; border-left-width: 4px !important; }
        .fc-list-event { cursor: pointer; }
        .fc-col-header-cell { background: #f8fafc; padding: 12px 0 !important; }
        .fc-col-header-cell-cushion { color: #64748b; font-size: 0.75rem; font-weight: 800; text-transform: uppercase; text-decoration: none !important; }
        .fc-daygrid-day-number { color: #94a3b8; font-weight: 600; font-size: 0.875rem; padding: 8px !important; text-decoration: none !important; }
        .fc-day-today { background: #f0f4ff !important; }
        .fc-day-today .fc-daygrid-day-number { color: #4f46e5; font-weight: 800; }
      `}</style>
    </div>
  );
};

export default CalendarView;
