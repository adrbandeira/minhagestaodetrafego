import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '@/lib/store';
import { StatusChip, PlatformBadge } from '@/components/Badges';
import { Plus } from 'lucide-react';

export default function ClientList() {
  const { type } = useParams<{ type: string }>();
  const navigate = useNavigate();
  const { clients } = useStore();

  const filtered = clients.filter(c => c.type === type);
  const label = type === 'pessoal' ? 'Pessoais' : 'Agenciados';

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-syne font-bold">Clientes {label}</h1>
        <button onClick={() => navigate(`/clientes/novo?tipo=${type}`)} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
          <Plus className="w-4 h-4" /> Novo Cliente
        </button>
      </div>

      <div className="space-y-2">
        {filtered.map(c => {
          const initials = c.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
          return (
            <div key={c.id} onClick={() => navigate(`/cliente/${c.id}`)} className="flex items-center gap-4 p-4 rounded-lg bg-card border border-border hover:bg-surface2/50 transition-colors cursor-pointer">
              <div className="w-9 h-9 rounded-lg bg-primary/20 flex items-center justify-center text-sm font-syne font-bold text-primary">
                {initials}
              </div>
              <span className="text-sm flex-1 font-medium">{c.name}</span>
              <span className="text-[12px] text-muted-foreground">{c.segment}</span>
              <div className="flex gap-1.5">{c.platforms.map(p => <PlatformBadge key={p} platform={p} />)}</div>
              <StatusChip status={c.status} />
            </div>
          );
        })}
        {filtered.length === 0 && <p className="text-muted-foreground text-sm">Nenhum cliente encontrado.</p>}
      </div>
    </div>
  );
}
