import { useState } from 'react';
import { Client, Platform } from '@/lib/types';
import { PlatformBadge, StatusChip, TypeChip } from '@/components/Badges';
import { useStore } from '@/lib/store';
import { Pencil, Save, X } from 'lucide-react';

export default function ClientInfo({ client }: { client: Client }) {
  const { updateClient } = useStore();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ ...client });

  const handleSave = () => {
    updateClient(form);
    setEditing(false);
  };

  const handleCancel = () => {
    setForm({ ...client });
    setEditing(false);
  };

  const togglePlatform = (p: Platform) => {
    setForm(prev => ({
      ...prev,
      platforms: prev.platforms.includes(p) ? prev.platforms.filter(x => x !== p) : [...prev.platforms, p],
    }));
  };

  if (editing) {
    return (
      <div className="bg-card border border-border rounded-lg p-6 max-w-xl space-y-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-syne font-bold text-sm">Editar Informações</h3>
          <button onClick={handleCancel} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
        </div>
        <EditRow label="Nome">
          <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
            className="w-full bg-secondary border border-border rounded-md px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
        </EditRow>
        <EditRow label="Tipo">
          <div className="flex gap-2">
            {(['pessoal', 'agenciado'] as const).map(t => (
              <button key={t} onClick={() => setForm({ ...form, type: t })}
                className={`px-3 py-1.5 rounded text-[12px] font-medium capitalize transition-colors ${form.type === t ? 'bg-primary/20 text-primary' : 'bg-secondary text-muted-foreground'}`}>
                {t}
              </button>
            ))}
          </div>
        </EditRow>
        <EditRow label="Status">
          <div className="flex gap-2">
            {(['ativo', 'alerta', 'pausado'] as const).map(s => (
              <button key={s} onClick={() => setForm({ ...form, status: s })}
                className={`px-3 py-1.5 rounded text-[12px] font-medium capitalize transition-colors ${form.status === s ? 'bg-primary/20 text-primary' : 'bg-secondary text-muted-foreground'}`}>
                {s}
              </button>
            ))}
          </div>
        </EditRow>
        <EditRow label="Segmento">
          <input value={form.segment} onChange={e => setForm({ ...form, segment: e.target.value })}
            className="w-full bg-secondary border border-border rounded-md px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
        </EditRow>
        <EditRow label="Plataformas">
          <div className="flex gap-2">
            {(['Meta Ads', 'Google Ads'] as Platform[]).map(p => (
              <button key={p} onClick={() => togglePlatform(p)}
                className={`px-3 py-1.5 rounded text-[12px] font-medium transition-colors ${form.platforms.includes(p) ? (p === 'Meta Ads' ? 'bg-meta/20 text-meta' : 'bg-google/20 text-google') : 'bg-secondary text-muted-foreground'}`}>
                {p}
              </button>
            ))}
          </div>
        </EditRow>
        <EditRow label="Orçamento">
          <input type="number" value={form.budget} onChange={e => setForm({ ...form, budget: Number(e.target.value) })}
            className="w-full bg-secondary border border-border rounded-md px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
        </EditRow>
        <EditRow label="Contato">
          <input value={form.contact} onChange={e => setForm({ ...form, contact: e.target.value })}
            className="w-full bg-secondary border border-border rounded-md px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
        </EditRow>
        <EditRow label="Data de Início">
          <input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })}
            className="w-full bg-secondary border border-border rounded-md px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
        </EditRow>
        <button onClick={handleSave} className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors">
          <Save className="w-3.5 h-3.5" /> Salvar
        </button>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg p-6 max-w-xl">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-syne font-bold text-sm">Informações</h3>
        <button onClick={() => setEditing(true)} className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground text-[12px] transition-colors">
          <Pencil className="w-3.5 h-3.5" /> Editar
        </button>
      </div>
      <div className="space-y-4">
        <InfoRow label="Nome" value={client.name} />
        <InfoRow label="Tipo"><TypeChip type={client.type} /></InfoRow>
        <InfoRow label="Status"><StatusChip status={client.status} /></InfoRow>
        <InfoRow label="Segmento" value={client.segment} />
        <InfoRow label="Plataformas">
          <div className="flex gap-1.5">{client.platforms.map(p => <PlatformBadge key={p} platform={p} />)}</div>
        </InfoRow>
        <InfoRow label="Orçamento Mensal" value={`R$ ${client.budget.toLocaleString('pt-BR')}`} />
        <InfoRow label="Contato" value={client.contact} />
        <InfoRow label="Data de Início" value={new Date(client.startDate + 'T00:00:00').toLocaleDateString('pt-BR')} />
      </div>
    </div>
  );
}

function InfoRow({ label, value, children }: { label: string; value?: string; children?: React.ReactNode }) {
  return (
    <div className="flex items-start gap-4">
      <span className="text-[12px] text-muted-foreground w-32 flex-shrink-0 pt-0.5">{label}</span>
      {children || <span className="text-sm">{value}</span>}
    </div>
  );
}

function EditRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-4">
      <span className="text-[12px] text-muted-foreground w-32 flex-shrink-0 pt-2">{label}</span>
      <div className="flex-1">{children}</div>
    </div>
  );
}
