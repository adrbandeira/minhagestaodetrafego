import { useStore } from '@/lib/store';
import { PlatformBadge } from '@/components/Badges';

export default function ClientHistory({ clientId }: { clientId: string }) {
  const { getClientHistory } = useStore();
  const history = getClientHistory(clientId);

  return (
    <div>
      {history.length === 0 && <p className="text-muted-foreground text-sm">Nenhum histórico de revisões.</p>}
      <div className="relative border-l-2 border-border ml-4 space-y-6">
        {history.map(h => (
          <div key={h.id} className="ml-6 relative">
            <div className="absolute -left-[31px] top-1 w-3 h-3 rounded-full bg-primary border-2 border-background" />
            <p className="text-[11px] font-mono text-muted-foreground mb-1">
              {new Date(h.date + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
            </p>
            <p className="text-sm mb-2">{h.summary}</p>
            <div className="flex flex-wrap gap-1.5">
              {h.platforms.map(p => <PlatformBadge key={p} platform={p} />)}
              {h.tags.map(t => (
                <span key={t} className="px-2 py-0.5 rounded text-[10px] font-mono bg-surface2 text-muted-foreground">{t}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
