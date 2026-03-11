import { Client } from '@/lib/types';
import { PlatformBadge, StatusChip, TypeChip } from '@/components/Badges';

export default function ClientInfo({ client }: { client: Client }) {
  return (
    <div className="bg-card border border-border rounded-lg p-6 max-w-xl">
      <div className="space-y-4">
        <InfoRow label="Nome" value={client.name} />
        <InfoRow label="Tipo">
          <TypeChip type={client.type} />
        </InfoRow>
        <InfoRow label="Status">
          <StatusChip status={client.status} />
        </InfoRow>
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
