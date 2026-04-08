import { Platform, Priority, Difficulty } from '@/lib/types';

export function PlatformBadge({ platform }: { platform: Platform }) {
  const isMeta = platform === 'Meta Ads';
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-medium ${
      isMeta ? 'bg-meta/15 text-meta' : 'bg-google/15 text-google'
    }`}>
      {isMeta ? '◆' : '▲'} {platform}
    </span>
  );
}

export function PriorityDot({ priority }: { priority: Priority }) {
  const color = priority === 'alta' ? 'bg-danger' : priority === 'media' ? 'bg-warn' : 'bg-primary';
  return <span className={`w-2 h-2 rounded-full ${color} inline-block`} />;
}

export function StatusChip({ status }: { status: string }) {
  const styles: Record<string, string> = {
    ativo: 'bg-primary/15 text-primary',
    alerta: 'bg-warn/15 text-warn',
    pausado: 'bg-muted text-muted-foreground',
  };
  return (
    <span className={`px-2 py-0.5 rounded text-[11px] font-medium capitalize ${styles[status] || styles.ativo}`}>
      {status}
    </span>
  );
}

export function TypeChip({ type }: { type: string }) {
  return (
    <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-surface2 text-muted-foreground capitalize">
      {type}
    </span>
  );
}

const difficultyConfig: Record<Difficulty, { label: string; className: string }> = {
  facil: { label: 'Fácil', className: 'bg-primary/15 text-primary' },
  media: { label: 'Média', className: 'bg-warn/15 text-warn' },
  dificil: { label: 'Difícil', className: 'bg-danger/15 text-danger' },
};

export function DifficultyBadge({ difficulty }: { difficulty?: Difficulty }) {
  if (!difficulty) return null;
  const cfg = difficultyConfig[difficulty];
  return (
    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${cfg.className}`}>
      {cfg.label}
    </span>
  );
}

export function DifficultySelector({ value, onChange }: { value?: Difficulty; onChange: (v?: Difficulty) => void }) {
  const options: Difficulty[] = ['facil', 'media', 'dificil'];
  return (
    <div className="flex gap-1">
      {options.map(d => (
        <button key={d} type="button" onClick={() => onChange(value === d ? undefined : d)}
          className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${value === d ? difficultyConfig[d].className : 'bg-surface2 text-muted-foreground hover:text-foreground'}`}>
          {difficultyConfig[d].label}
        </button>
      ))}
    </div>
  );
}
