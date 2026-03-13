import { useState } from 'react';
import { useStore } from '@/lib/store';
import { Platform, Priority } from '@/lib/types';
import { Save, X } from 'lucide-react';

export default function ClientReviewForm({ clientId, onClose }: { clientId: string; onClose: () => void }) {
  const { addReview } = useStore();
  const today = new Date().toISOString().split('T')[0];
  const [time, setTime] = useState('09:00');
  const [platforms, setPlatforms] = useState<Platform[]>(['Meta Ads']);
  const [priority, setPriority] = useState<Priority>('media');

  const togglePlatform = (p: Platform) => {
    setPlatforms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
  };

  const handleSave = () => {
    addReview({ clientId, date: today, time, platforms, priority, done: false });
    onClose();
  };

  return (
    <div className="bg-card border border-border rounded-lg p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-syne font-bold text-sm">Nova Revisão</h3>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
      </div>
      <div>
        <label className="text-[12px] text-muted-foreground block mb-1">Horário</label>
        <input type="time" value={time} onChange={e => setTime(e.target.value)}
          className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
      </div>
      <div>
        <label className="text-[12px] text-muted-foreground block mb-1">Plataformas</label>
        <div className="flex gap-2">
          {(['Meta Ads', 'Google Ads'] as Platform[]).map(p => (
            <button key={p} onClick={() => togglePlatform(p)}
              className={`px-3 py-1.5 rounded text-[12px] font-medium transition-colors ${platforms.includes(p) ? (p === 'Meta Ads' ? 'bg-meta/20 text-meta' : 'bg-google/20 text-google') : 'bg-secondary text-muted-foreground'}`}>
              {p}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="text-[12px] text-muted-foreground block mb-1">Prioridade</label>
        <div className="flex gap-2">
          {(['alta', 'media', 'baixa'] as Priority[]).map(p => (
            <button key={p} onClick={() => setPriority(p)}
              className={`px-3 py-1.5 rounded text-[12px] font-medium capitalize transition-colors ${priority === p ? 'bg-primary/20 text-primary' : 'bg-secondary text-muted-foreground'}`}>
              {p}
            </button>
          ))}
        </div>
      </div>
      <button onClick={handleSave} className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors">
        <Save className="w-3.5 h-3.5" /> Salvar Revisão
      </button>
    </div>
  );
}
