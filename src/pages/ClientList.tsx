import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '@/lib/store';
import { StatusChip, PlatformBadge } from '@/components/Badges';
import { Plus, LayoutGrid, List, Lock } from 'lucide-react';
import { useState } from 'react';

export default function ClientList() {
  const { type } = useParams<{ type: string }>();
  const navigate = useNavigate();
  const { clients } = useStore();
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [unlocked, setUnlocked] = useState(type !== 'pessoal');
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState(false);

  const filtered = clients.filter(c => c.type === type);
  const label = type === 'pessoal' ? 'Pessoais' : 'Agenciados';

  const handleUnlock = () => {
    if (pin === '1010') {
      setUnlocked(true);
      setPinError(false);
    } else {
      setPinError(true);
    }
  };

  if (type === 'pessoal' && !unlocked) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <div className="bg-card border border-border rounded-lg p-8 max-w-sm w-full text-center">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-6 h-6 text-primary" />
          </div>
          <h2 className="font-syne font-bold text-lg mb-2">Área Protegida</h2>
          <p className="text-sm text-muted-foreground mb-6">Digite o PIN para acessar os clientes pessoais.</p>
          <div className="flex gap-2">
            <input
              type="password"
              maxLength={4}
              value={pin}
              onChange={e => { setPin(e.target.value); setPinError(false); }}
              onKeyDown={e => e.key === 'Enter' && handleUnlock()}
              placeholder="PIN"
              className={`flex-1 bg-secondary border rounded-md px-4 py-2.5 text-center text-lg font-mono tracking-[0.5em] focus:outline-none focus:ring-1 focus:ring-primary ${pinError ? 'border-destructive' : 'border-border'}`}
            />
            <button onClick={handleUnlock} className="px-5 py-2.5 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors">
              Entrar
            </button>
          </div>
          {pinError && <p className="text-destructive text-xs mt-2">PIN incorreto</p>}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-syne font-bold">Clientes {label}</h1>
        <div className="flex items-center gap-3">
          <div className="flex bg-secondary rounded-lg p-0.5">
            <button onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
              <List className="w-4 h-4" />
            </button>
            <button onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
          <button onClick={() => navigate(`/clientes/novo?tipo=${type}`)} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
            <Plus className="w-4 h-4" /> Novo Cliente
          </button>
        </div>
      </div>

      {viewMode === 'list' ? (
        <div className="space-y-2">
          {filtered.map(c => {
            const initials = c.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
            return (
              <div key={c.id} onClick={() => navigate(`/cliente/${c.id}`)} className="flex items-center gap-4 p-4 rounded-lg bg-card border border-border hover:bg-secondary/50 transition-colors cursor-pointer">
                <div className="w-9 h-9 rounded-lg bg-primary/20 flex items-center justify-center text-sm font-syne font-bold text-primary">{initials}</div>
                <span className="text-sm flex-1 font-medium">{c.name}</span>
                <span className="text-[12px] text-muted-foreground">{c.segment}</span>
                <div className="flex gap-1.5">{c.platforms.map(p => <PlatformBadge key={p} platform={p} />)}</div>
                <StatusChip status={c.status} />
              </div>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(c => {
            const initials = c.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
            return (
              <div key={c.id} onClick={() => navigate(`/cliente/${c.id}`)} className="bg-card border border-border rounded-lg p-5 hover:bg-secondary/50 transition-colors cursor-pointer">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center text-sm font-syne font-bold text-primary">{initials}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{c.name}</p>
                    <p className="text-[11px] text-muted-foreground">{c.segment}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex gap-1.5">{c.platforms.map(p => <PlatformBadge key={p} platform={p} />)}</div>
                  <StatusChip status={c.status} />
                </div>
                <p className="text-[11px] text-muted-foreground mt-3 font-mono">R$ {c.budget.toLocaleString('pt-BR')}/mês</p>
              </div>
            );
          })}
        </div>
      )}
      {filtered.length === 0 && <p className="text-muted-foreground text-sm">Nenhum cliente encontrado.</p>}
    </div>
  );
}
