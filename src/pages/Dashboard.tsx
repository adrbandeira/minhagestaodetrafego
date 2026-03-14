import { useStore } from '@/lib/store';
import { Users, ClipboardList, CheckSquare, AlertTriangle, Clock } from 'lucide-react';

export default function Dashboard() {
  const { clients, getTodayReviews, getOpenTasks, getClientsWithoutRecentReview } = useStore();

  const todayReviews = getTodayReviews();
  const doneReviews = todayReviews.filter(r => r.done).length;
  const openTasks = getOpenTasks();
  const alertClients = getClientsWithoutRecentReview();
  const activeClients = clients.filter(c => c.status === 'ativo').length;

  const today = new Date().toISOString().split('T')[0];
  const tasksDueToday = openTasks.filter(t => t.dueDate === today);

  return (
    <div>
      <h1 className="text-2xl font-syne font-bold mb-6">Dashboard</h1>

      {/* Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={<Users className="w-5 h-5 text-primary" />} label="Clientes Ativos" value={activeClients} />
        <StatCard icon={<ClipboardList className="w-5 h-5 text-meta" />} label="Revisões Hoje" value={`${doneReviews}/${todayReviews.length}`} />
        <StatCard icon={<CheckSquare className="w-5 h-5 text-warn" />} label="Tarefas Abertas" value={openTasks.length} />
        <StatCard icon={<AlertTriangle className="w-5 h-5 text-danger" />} label="Sem revisão +3 dias" value={alertClients.length} accent />
      </div>

      {/* Two columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Reviews summary */}
        <div className="bg-card rounded-lg border border-border p-5">
          <h2 className="font-syne font-bold text-sm mb-4 flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-primary" /> Revisões do Dia
          </h2>
          <div className="space-y-2">
            {todayReviews.length === 0 && <p className="text-muted-foreground text-sm">Nenhuma revisão agendada.</p>}
            {todayReviews.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-md bg-surface2/50">
                  <span className="text-sm text-muted-foreground">Total agendadas</span>
                  <span className="text-sm font-bold">{todayReviews.length}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-md bg-primary/5 border border-primary/10">
                  <span className="text-sm text-muted-foreground">Concluídas</span>
                  <span className="text-sm font-bold text-primary">{doneReviews}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-md bg-warn/5 border border-warn/10">
                  <span className="text-sm text-muted-foreground">Pendentes</span>
                  <span className="text-sm font-bold text-warn">{todayReviews.length - doneReviews}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Alerts */}
        <div className="bg-card rounded-lg border border-border p-5">
          <h2 className="font-syne font-bold text-sm mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-warn" /> Painel de Alertas
          </h2>
          <div className="space-y-2">
            {alertClients.length > 0 && (
              <div className="flex items-center gap-3 p-3 rounded-md bg-warn/5 border border-warn/20">
                <AlertTriangle className="w-4 h-4 text-warn flex-shrink-0" />
                <span className="text-sm flex-1">{alertClients.length} cliente{alertClients.length > 1 ? 's' : ''} sem revisão há mais de 3 dias</span>
              </div>
            )}
            {tasksDueToday.length > 0 && (
              <div className="flex items-center gap-3 p-3 rounded-md bg-danger/5 border border-danger/20">
                <CheckSquare className="w-4 h-4 text-danger flex-shrink-0" />
                <span className="text-sm flex-1">{tasksDueToday.length} tarefa{tasksDueToday.length > 1 ? 's' : ''} vence{tasksDueToday.length === 1 ? '' : 'm'} hoje</span>
              </div>
            )}
            {alertClients.length === 0 && tasksDueToday.length === 0 && (
              <p className="text-muted-foreground text-sm">Nenhum alerta no momento.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string | number; accent?: boolean }) {
  return (
    <div className={`bg-card rounded-lg border p-4 ${accent ? 'border-danger/30' : 'border-border'}`}>
      <div className="flex items-center gap-3 mb-2">{icon}<span className="text-[12px] text-muted-foreground">{label}</span></div>
      <p className={`text-2xl font-syne font-bold ${accent ? 'text-danger' : ''}`}>{value}</p>
    </div>
  );
}
