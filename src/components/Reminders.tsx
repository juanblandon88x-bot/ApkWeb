import { useState, useEffect } from 'react';
import { Bell, BellOff, Clock, X, Trash2 } from 'lucide-react';
import { M3UChannel } from '../lib/m3uParser';

interface Reminder {
  id: string;
  content: M3UChannel;
  date: string;
  time: string;
  notified: boolean;
}

interface RemindersProps {
  isOpen: boolean;
  onClose: () => void;
  onPlayContent: (content: M3UChannel) => void;
}

export function useReminders() {
  const [reminders, setReminders] = useState<Reminder[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('sirnet_reminders');
    if (saved) setReminders(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem('sirnet_reminders', JSON.stringify(reminders));
  }, [reminders]);

  const addReminder = (content: M3UChannel, date: string, time: string) => {
    const reminder: Reminder = {
      id: `${Date.now()}-${content.url}`,
      content,
      date,
      time,
      notified: false
    };
    setReminders(prev => [...prev, reminder]);
    return reminder;
  };

  const removeReminder = (id: string) => {
    setReminders(prev => prev.filter(r => r.id !== id));
  };

  const hasReminder = (url: string) => reminders.some(r => r.content.url === url);

  return { reminders, addReminder, removeReminder, hasReminder };
}

export function AddReminderModal({ content, onClose, onAdd }: { 
  content: M3UChannel; 
  onClose: () => void; 
  onAdd: (date: string, time: string) => void;
}) {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('20:00');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md">
      <div className="bg-[#1a1f2e] rounded-2xl p-6 max-w-sm w-full mx-4 border border-[#2a3142]">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Bell className="w-5 h-5 text-[#0080ff]" />
            Recordarme ver
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-[#2a3142] rounded-full">
            <X className="w-5 h-5 text-[#a3a3a3]" />
          </button>
        </div>

        <div className="bg-[#0c111b] rounded-lg p-3 mb-4">
          <p className="text-white font-medium truncate">{content.name}</p>
          <p className="text-[#6b7280] text-sm">{content.group}</p>
        </div>

        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-[#a3a3a3] text-sm mb-2">Fecha</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} min={new Date().toISOString().split('T')[0]}
              className="w-full bg-[#0c111b] border border-[#2a3142] rounded-lg px-4 py-3 text-white focus:border-[#0080ff] focus:outline-none" />
          </div>
          <div>
            <label className="block text-[#a3a3a3] text-sm mb-2">Hora</label>
            <input type="time" value={time} onChange={e => setTime(e.target.value)}
              className="w-full bg-[#0c111b] border border-[#2a3142] rounded-lg px-4 py-3 text-white focus:border-[#0080ff] focus:outline-none" />
          </div>
        </div>

        <button onClick={() => { onAdd(date, time); onClose(); }}
          className="w-full py-3 bg-[#0063e5] hover:bg-[#0080ff] text-white font-semibold rounded-lg transition-colors">
          Crear Recordatorio
        </button>
      </div>
    </div>
  );
}

export default function Reminders({ isOpen, onClose, onPlayContent }: RemindersProps) {
  const { reminders, removeReminder } = useReminders();

  if (!isOpen) return null;

  const formatDateTime = (date: string, time: string) => {
    const d = new Date(`${date}T${time}`);
    return d.toLocaleDateString('es', { weekday: 'short', day: 'numeric', month: 'short' }) + ' ' + time;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md">
      <div className="bg-[#1a1f2e] rounded-2xl p-6 max-w-md w-full mx-4 border border-[#2a3142] max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-white flex items-center gap-2">
            <Clock className="w-6 h-6 text-[#0080ff]" />
            Mis Recordatorios
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-[#2a3142] rounded-full">
            <X className="w-5 h-5 text-[#a3a3a3]" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {reminders.length === 0 ? (
            <div className="text-center py-8">
              <BellOff className="w-12 h-12 text-[#3a3d4e] mx-auto mb-3" />
              <p className="text-[#a3a3a3]">No tienes recordatorios</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reminders.map(r => (
                <div key={r.id} className="bg-[#0c111b] rounded-lg p-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">{r.content.name}</p>
                    <p className="text-[#0080ff] text-sm">{formatDateTime(r.date, r.time)}</p>
                  </div>
                  <button onClick={() => onPlayContent(r.content)} className="p-2 bg-[#0063e5] hover:bg-[#0080ff] rounded-lg">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                  </button>
                  <button onClick={() => removeReminder(r.id)} className="p-2 hover:bg-red-500/20 rounded-lg">
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
