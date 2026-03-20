import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FileText } from 'lucide-react';
import { useStore } from '@/lib/store';
import PinGate from '@/components/PinGate';
import DailyReport from '@/components/reports/DailyReport';
import WeeklyReport from '@/components/reports/WeeklyReport';
import MonthlyReportContent from '@/components/reports/MonthlyReport';

type ReportTab = 'diario' | 'semanal' | 'mensal';
type ClientTypeTab = 'agenciado' | 'pessoal';

function ReportsContent() {
  const { clients } = useStore();
  const [tab, setTab] = useState<ReportTab>('diario');
  const [clientType, setClientType] = useState<ClientTypeTab>('agenciado');

  const agenciados = clients.filter(c => c.type === 'agenciado' && c.status === 'ativo');
  const pessoais = clients.filter(c => c.type === 'pessoal' && c.status === 'ativo');

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-syne font-bold flex items-center gap-3">
          <FileText className="w-6 h-6 text-primary" /> Relatórios
        </h1>
        <div className="flex gap-1 bg-secondary rounded-lg p-1">
          {([['diario', 'Diário'], ['semanal', 'Semanal'], ['mensal', 'Mensal']] as const).map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === key ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-1 bg-secondary rounded-lg p-1 mb-6 w-fit">
        <button onClick={() => setClientType('agenciado')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${clientType === 'agenciado' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
          Agenciados ({agenciados.length})
        </button>
        <button onClick={() => setClientType('pessoal')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${clientType === 'pessoal' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
          Pessoais ({pessoais.length})
        </button>
      </div>

      {clientType === 'pessoal' ? (
        <PinGate>
          {tab === 'diario' && <DailyReport clientType="pessoal" />}
          {tab === 'semanal' && <WeeklyReport clientType="pessoal" />}
          {tab === 'mensal' && <MonthlyReportContent clientType="pessoal" />}
        </PinGate>
      ) : (
        <>
          {tab === 'diario' && <DailyReport clientType="agenciado" />}
          {tab === 'semanal' && <WeeklyReport clientType="agenciado" />}
          {tab === 'mensal' && <MonthlyReportContent clientType="agenciado" />}
        </>
      )}
    </div>
  );
}

export default function ReportsPage() {
  return <ReportsContent />;
}
