import { useMemo, useState } from 'react';
import { useStore } from '@/lib/store';
import { TrendingUp, Clock, CheckCircle2, AlertTriangle, BarChart3 } from 'lucide-react';
import PinGate from '@/components/PinGate';
import SLAEvolutionChart from '@/components/SLAEvolutionChart';

type ClientTypeTab = 'agenciado' | 'pessoal';

function SLAContent({ clientType }: { clientType: ClientTypeTab }) {
  const { clients, reviews, tasks, history } = useStore();
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d');

  const clientIds = useMemo(() => {
    return new Set(clients.filter(c => c.type === clientType).map(c => c.id));
  }, [clients, clientType]);

  const periodStart = useMemo(() => {
    const d = new Date();
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    d.setDate(d.getDate() - days);
    return d.toISOString().split('T')[0];
  }, [period]);

  const today = new Date().toISOString().split('T')[0];

  // Filter data by client type and period
  const periodReviews = useMemo(() =>
    reviews.filter(r => clientIds.has(r.clientId) && r.date >= periodStart && r.date <= today),
    [reviews, clientIds, periodStart, today]
  );

  const periodTasks = useMemo(() =>
    tasks.filter(t => (t.clientId ? clientIds.has(t.clientId) : true) && t.dueDate >= periodStart && t.dueDate <= today),
    [tasks, clientIds, periodStart, today]
  );

  const periodHistory = useMemo(() =>
    history.filter(h => clientIds.has(h.clientId) && h.date >= periodStart && h.date <= today),
    [history, clientIds, periodStart, today]
  );

  // SLA Metrics
  const reviewsDone = periodReviews.filter(r => r.done).length;
  const reviewsTotal = periodReviews.length;
  const reviewRate = reviewsTotal > 0 ? Math.round((reviewsDone / reviewsTotal) * 100) : 0;

  const tasksDone = periodTasks.filter(t => t.done).length;
  const tasksTotal = periodTasks.length;
  const taskRate = tasksTotal > 0 ? Math.round((tasksDone / tasksTotal) * 100) : 0;

  // Average response time: days between task creation date and completion
  // We'll estimate using dueDate as proxy
  const overdueTasks = periodTasks.filter(t => !t.done && t.dueDate < today).length;
  const onTimeTasks = periodTasks.filter(t => t.done).length;
  const onTimeRate = tasksTotal > 0 ? Math.round((onTimeTasks / tasksTotal) * 100) : 0;

  // Per-client SLA breakdown
  const clientBreakdown = useMemo(() => {
    const filteredClients = clients.filter(c => c.type === clientType && c.status === 'ativo');
    return filteredClients.map(client => {
      const cReviews = periodReviews.filter(r => r.clientId === client.id);
      const cDone = cReviews.filter(r => r.done).length;
      const cTasks = periodTasks.filter(t => t.clientId === client.id);
      const cTasksDone = cTasks.filter(t => t.done).length;
      const cHistory = periodHistory.filter(h => h.clientId === client.id);
      const rate = cReviews.length > 0 ? Math.round((cDone / cReviews.length) * 100) : null;
      const taskR = cTasks.length > 0 ? Math.round((cTasksDone / cTasks.length) * 100) : null;
      return {
        id: client.id,
        name: client.name,
        segment: client.segment,
        reviewsDone: cDone,
        reviewsTotal: cReviews.length,
        reviewRate: rate,
        tasksDone: cTasksDone,
        tasksTotal: cTasks.length,
        taskRate: taskR,
        historyCount: cHistory.length,
      };
    }).sort((a, b) => (a.reviewRate ?? 100) - (b.reviewRate ?? 100));
  }, [clients, clientType, periodReviews, periodTasks, periodHistory]);

  function getRateColor(rate: number | null) {
    if (rate === null) return 'text-muted-foreground';
    if (rate >= 90) return 'text-primary';
    if (rate >= 70) return 'text-yellow-500';
    return 'text-destructive';
  }

  function getRateBg(rate: number | null) {
    if (rate === null) return 'bg-secondary';
    if (rate >= 90) return 'bg-primary/10';
    if (rate >= 70) return 'bg-yellow-500/10';
    return 'bg-destructive/10';
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-syne font-bold flex items-center gap-3">
          <BarChart3 className="w-6 h-6 text-primary" /> SLA de Entregas
        </h1>
        <div className="flex gap-1 bg-secondary rounded-lg p-1">
          {([['7d', '7 dias'], ['30d', '30 dias'], ['90d', '90 dias']] as const).map(([key, label]) => (
            <button key={key} onClick={() => setPeriod(key)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${period === key ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <KPICard
          label="Revisões Concluídas"
          value={`${reviewRate}%`}
          sub={`${reviewsDone}/${reviewsTotal}`}
          icon={<CheckCircle2 className="w-5 h-5" />}
          good={reviewRate >= 90}
          warn={reviewRate >= 70 && reviewRate < 90}
        />
        <KPICard
          label="Tarefas no Prazo"
          value={`${onTimeRate}%`}
          sub={`${onTimeTasks}/${tasksTotal}`}
          icon={<TrendingUp className="w-5 h-5" />}
          good={onTimeRate >= 90}
          warn={onTimeRate >= 70 && onTimeRate < 90}
        />
        <KPICard
          label="Tarefas Entregues"
          value={`${taskRate}%`}
          sub={`${tasksDone}/${tasksTotal}`}
          icon={<Clock className="w-5 h-5" />}
          good={taskRate >= 90}
          warn={taskRate >= 70 && taskRate < 90}
        />
        <KPICard
          label="Tarefas Atrasadas"
          value={String(overdueTasks)}
          sub="pendentes"
          icon={<AlertTriangle className="w-5 h-5" />}
          good={overdueTasks === 0}
          warn={overdueTasks > 0 && overdueTasks <= 3}
        />
      </div>

      {/* Client breakdown */}
      <h2 className="text-sm font-syne font-bold uppercase tracking-wider text-muted-foreground mb-4">
        Detalhamento por Cliente
      </h2>
      <div className="rounded-xl border border-border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-secondary/50 text-[11px] text-muted-foreground uppercase tracking-wider">
              <th className="text-left px-4 py-3 font-medium">Cliente</th>
              <th className="text-center px-4 py-3 font-medium">Revisões</th>
              <th className="text-center px-4 py-3 font-medium">% Revisões</th>
              <th className="text-center px-4 py-3 font-medium">Tarefas</th>
              <th className="text-center px-4 py-3 font-medium">% Tarefas</th>
              <th className="text-center px-4 py-3 font-medium">Resumos</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {clientBreakdown.map(c => (
              <tr key={c.id} className="hover:bg-secondary/30 transition-colors">
                <td className="px-4 py-3">
                  <p className="text-sm font-medium">{c.name}</p>
                  <p className="text-[10px] text-muted-foreground">{c.segment}</p>
                </td>
                <td className="text-center px-4 py-3 text-sm font-mono">{c.reviewsDone}/{c.reviewsTotal}</td>
                <td className="text-center px-4 py-3">
                  {c.reviewRate !== null ? (
                    <span className={`text-sm font-bold font-mono px-2 py-0.5 rounded-full ${getRateBg(c.reviewRate)} ${getRateColor(c.reviewRate)}`}>
                      {c.reviewRate}%
                    </span>
                  ) : (
                    <span className="text-[11px] text-muted-foreground">—</span>
                  )}
                </td>
                <td className="text-center px-4 py-3 text-sm font-mono">{c.tasksDone}/{c.tasksTotal}</td>
                <td className="text-center px-4 py-3">
                  {c.taskRate !== null ? (
                    <span className={`text-sm font-bold font-mono px-2 py-0.5 rounded-full ${getRateBg(c.taskRate)} ${getRateColor(c.taskRate)}`}>
                      {c.taskRate}%
                    </span>
                  ) : (
                    <span className="text-[11px] text-muted-foreground">—</span>
                  )}
                </td>
                <td className="text-center px-4 py-3 text-sm font-mono">{c.historyCount}</td>
              </tr>
            ))}
            {clientBreakdown.length === 0 && (
              <tr><td colSpan={6} className="text-center py-8 text-muted-foreground text-sm">Nenhum dado para o período</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function KPICard({ label, value, sub, icon, good, warn }: {
  label: string; value: string; sub: string; icon: React.ReactNode; good: boolean; warn: boolean;
}) {
  const color = good ? 'text-primary border-primary/30 bg-primary/5' : warn ? 'text-yellow-500 border-yellow-500/30 bg-yellow-500/5' : 'text-destructive border-destructive/30 bg-destructive/5';
  return (
    <div className={`rounded-xl border p-5 ${color}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] uppercase tracking-wider font-medium opacity-80">{label}</span>
        {icon}
      </div>
      <p className="text-3xl font-bold font-mono">{value}</p>
      <p className="text-[11px] opacity-70 mt-1">{sub}</p>
    </div>
  );
}

export default function SLAPage() {
  const { clients } = useStore();
  const [clientType, setClientType] = useState<ClientTypeTab>('agenciado');

  const agenciados = clients.filter(c => c.type === 'agenciado' && c.status === 'ativo');
  const pessoais = clients.filter(c => c.type === 'pessoal' && c.status === 'ativo');

  return (
    <div>
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
          <SLAContent clientType="pessoal" />
        </PinGate>
      ) : (
        <SLAContent clientType="agenciado" />
      )}
    </div>
  );
}
