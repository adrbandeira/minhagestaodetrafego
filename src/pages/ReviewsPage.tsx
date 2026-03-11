import { useState } from 'react';
import { useStore } from '@/lib/store';
import { useNavigate } from 'react-router-dom';
import { PlatformBadge, PriorityDot } from '@/components/Badges';
import { Plus, Clock } from 'lucide-react';
import { Platform, Priority } from '@/lib/types';

export default function ReviewsPage() {
  const { getTodayReviews, getClientName, toggleReview, addReview, clients } = useStore();
  const navigate = useNavigate();
  const reviews = getTodayReviews();
  const [showForm, setShowForm] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-syne font-bold">Revisões do Dia</h1>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
          <Plus className="w-4 h-4" /> Nova Revisão
        </button>
      </div>

      {showForm && <NewReviewForm clients={clients} onAdd={(r) => { addReview(r); setShowForm(false); }} onCancel={() => setShowForm(false)} />}

      <div className="space-y-2">
        {reviews.map(r => (
          <div key={r.id} className="flex items-center gap-3 p-4 rounded-lg bg-card border border-border hover:bg-surface2/50 transition-colors cursor-pointer" onClick={() => navigate(`/cliente/${r.clientId}`)}>
            <input type="checkbox" checked={r.done} onChange={(e) => { e.stopPropagation(); toggleReview(r.id); }} className="w-4 h-4 rounded accent-primary cursor-pointer" />
            <span className={`text-sm flex-1 ${r.done ? 'line-through text-muted-foreground' : ''}`}>{getClientName(r.clientId)}</span>
            <div className="flex items-center gap-2">
              {r.platforms.map(p => <PlatformBadge key={p} platform={p} />)}
              <PriorityDot priority={r.priority} />
              <span className="text-[11px] font-mono text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" /> {r.time}</span>
            </div>
          </div>
        ))}
        {reviews.length === 0 && <p className="text-muted-foreground text-sm">Nenhuma revisão agendada para hoje.</p>}
      </div>
    </div>
  );
}

function NewReviewForm({ clients, onAdd, onCancel }: { clients: any[]; onAdd: (r: any) => void; onCancel: () => void }) {
  const [clientId, setClientId] = useState('');
  const [time, setTime] = useState('09:00');
  const [platforms, setPlatforms] = useState<Platform[]>(['Meta Ads']);
  const [priority, setPriority] = useState<Priority>('media');
  const today = new Date().toISOString().split('T')[0];

  const togglePlatform = (p: Platform) => {
    setPlatforms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
  };

  return (
    <div className="bg-card border border-border rounded-lg p-5 mb-4 space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-[12px] text-muted-foreground block mb-1">Cliente</label>
          <select value={clientId} onChange={e => setClientId(e.target.value)} className="w-full bg-surface2 border border-border rounded-md px-3 py-2 text-sm text-foreground">
            <option value="">Selecione...</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[12px] text-muted-foreground block mb-1">Horário</label>
          <input type="time" value={time} onChange={e => setTime(e.target.value)} className="w-full bg-surface2 border border-border rounded-md px-3 py-2 text-sm text-foreground" />
        </div>
      </div>
      <div>
        <label className="text-[12px] text-muted-foreground block mb-1">Plataformas</label>
        <div className="flex gap-2">
          {(['Meta Ads', 'Google Ads'] as Platform[]).map(p => (
            <button key={p} onClick={() => togglePlatform(p)} className={`px-3 py-1.5 rounded text-[12px] font-medium transition-colors ${platforms.includes(p) ? (p === 'Meta Ads' ? 'bg-meta/20 text-meta' : 'bg-google/20 text-google') : 'bg-surface2 text-muted-foreground'}`}>
              {p}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="text-[12px] text-muted-foreground block mb-1">Prioridade</label>
        <div className="flex gap-2">
          {(['alta', 'media', 'baixa'] as Priority[]).map(p => (
            <button key={p} onClick={() => setPriority(p)} className={`px-3 py-1.5 rounded text-[12px] font-medium capitalize transition-colors ${priority === p ? 'bg-primary/20 text-primary' : 'bg-surface2 text-muted-foreground'}`}>
              {p}
            </button>
          ))}
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={() => { if (clientId) onAdd({ clientId, date: today, time, platforms, priority, done: false }); }} className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors">Salvar</button>
        <button onClick={onCancel} className="px-4 py-2 bg-surface2 text-muted-foreground rounded-md text-sm hover:text-foreground transition-colors">Cancelar</button>
      </div>
    </div>
  );
}
