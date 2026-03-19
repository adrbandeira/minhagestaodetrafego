import { useState } from 'react';
import { FileText } from 'lucide-react';
import PinGate from '@/components/PinGate';
import DailyReport from '@/components/reports/DailyReport';
import WeeklyReport from '@/components/reports/WeeklyReport';
import MonthlyReportContent from '@/components/reports/MonthlyReport';

type ReportTab = 'diario' | 'semanal' | 'mensal';

function ReportsContent() {
  const [tab, setTab] = useState<ReportTab>('diario');

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

      {tab === 'diario' && <DailyReport />}
      {tab === 'semanal' && <WeeklyReport />}
      {tab === 'mensal' && <MonthlyReportContent />}
    </div>
  );
}

export default function ReportsPage() {
  return (
    <PinGate>
      <ReportsContent />
    </PinGate>
  );
}
