import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useStore } from '@/lib/store';
import { ClientType, Platform } from '@/lib/types';
import { DatePicker } from '@/components/ui/date-picker';

export default function NewClient() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { addClient } = useStore();

  const [name, setName] = useState('');
  const [type, setType] = useState<ClientType>((searchParams.get('tipo') as ClientType) || 'pessoal');
  const [segment, setSegment] = useState('');
  const [platforms, setPlatforms] = useState<Platform[]>(['Meta Ads']);
  const [budget, setBudget] = useState('');
  const [contact, setContact] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);

  const togglePlatform = (p: Platform) => {
    setPlatforms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
  };

  const handleSave = () => {
    if (!name || !segment) return;
    addClient({ name, type, segment, platforms, budget: Number(budget) || 0, contact, startDate });
    navigate(`/clientes/${type}`);
  };

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-syne font-bold mb-6">Novo Cliente</h1>
      <div className="bg-card border border-border rounded-lg p-6 space-y-4">
        <Field label="Nome">
          <input value={name} onChange={e => setName(e.target.value)} className="w-full bg-surface2 border border-border rounded-md px-3 py-2 text-sm text-foreground" />
        </Field>

        <Field label="Tipo">
          <div className="flex gap-2">
            {(['pessoal', 'agenciado'] as ClientType[]).map(t => (
              <button key={t} onClick={() => setType(t)} className={`px-4 py-2 rounded-md text-sm font-medium capitalize transition-colors ${type === t ? 'bg-primary/20 text-primary' : 'bg-surface2 text-muted-foreground'}`}>
                {t}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Segmento / Nicho">
          <input value={segment} onChange={e => setSegment(e.target.value)} className="w-full bg-surface2 border border-border rounded-md px-3 py-2 text-sm text-foreground" />
        </Field>

        <Field label="Plataformas">
          <div className="flex gap-2">
            {(['Meta Ads', 'Google Ads'] as Platform[]).map(p => (
              <button key={p} onClick={() => togglePlatform(p)} className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${platforms.includes(p) ? (p === 'Meta Ads' ? 'bg-meta/20 text-meta' : 'bg-google/20 text-google') : 'bg-surface2 text-muted-foreground'}`}>
                {p}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Orçamento Mensal (R$)">
          <input type="number" value={budget} onChange={e => setBudget(e.target.value)} className="w-full bg-surface2 border border-border rounded-md px-3 py-2 text-sm text-foreground" />
        </Field>

        <Field label="Contato">
          <input value={contact} onChange={e => setContact(e.target.value)} className="w-full bg-surface2 border border-border rounded-md px-3 py-2 text-sm text-foreground" />
        </Field>

        <Field label="Data de Início">
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full bg-surface2 border border-border rounded-md px-3 py-2 text-sm text-foreground" />
        </Field>

        <div className="flex gap-2 pt-2">
          <button onClick={handleSave} className="px-5 py-2.5 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors">Salvar</button>
          <button onClick={() => navigate(-1)} className="px-5 py-2.5 bg-surface2 text-muted-foreground rounded-md text-sm hover:text-foreground transition-colors">Cancelar</button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[12px] text-muted-foreground block mb-1.5">{label}</label>
      {children}
    </div>
  );
}
