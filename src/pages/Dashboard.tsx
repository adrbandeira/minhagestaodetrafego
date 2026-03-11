import { useStore } from '@/lib/store';
import { useNavigate } from 'react-router-dom';
import { PlatformBadge, PriorityDot } from '@/components/Badges';
import { Users, ClipboardList, CheckSquare, AlertTriangle, Clock } from 'lucide-react';

export default function Dashboard() {
  const { clients, getTodayReviews, getOpenTasks, getClientsWithoutRecentReview, getClientName, toggleReview } = useStore();
  const navigate = useNavigate();

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
        {/* Reviews */}
        <div className="bg-card rounded-lg border border-border p-5">
          <h2 className="font-syne font-bold text-sm mb-4 flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-primary" /> Revisões do Dia
          </h2>
          <div className="space-y-2">
            {todayReviews.length === 0 && <p className="text-muted-foreground text-sm">Nenhuma revisão agendada.</p>}
            {todayReviews.map(r => (
              <div key={r.id} className="flex items-center gap-3 p-3 rounded-md bg-surface2/50 hover:bg-surface2 transition-colors cursor-pointer group" onClick={() => navigate(`/cliente/${r.clientId}`)}>
                <input
                  type="checkbox"
                  checked={r.done}
                  onChange={(e) => { e.stopPropagation(); toggleReview(r.id); }}
                  className="w-4 h-4 rounded accent-primary cursor-pointer"
                />
                <span className={`text-sm flex-1 ${r.done ? 'line-through text-muted-foreground' : ''}`}>
                  {getClientName(r.clientId)}
                </span>
                <div className="flex items-center gap-2">
                  {r.platforms.map(p => <PlatformBadge key={p} platform={p} />)}
                  <PriorityDot priority={r.priority} />
                  <span className="text-[11px] font-mono text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {r.time}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Alerts */}
        <div className="bg-card rounded-lg border border-border p-5">
          <h2 className="font-syne font-bold text-sm mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-warn" /> Painel de Alertas
          </h2>
          <div className="space-y-2">
            {alertClients.map(c => (
              <div key={c.id} className="flex items-center gap-3 p-3 rounded-md bg-warn/5 border border-warn/20 cursor-pointer hover:bg-warn/10 transition-colors" onClick={() => navigate(`/cliente/${c.id}`)}>
                <AlertTriangle className="w-4 h-4 text-warn flex-shrink-0" />
                <span className="text-sm flex-1">{c.name}</span>
                <span className="text-[11px] text-warn font-mono">
                  {c.lastReviewDate ? `Última revisão: ${formatDate(c.lastReviewDate)}` : 'Nunca revisado'}
                </span>
              </div>
            ))}
            {tasksDueToday.length > 0 && tasksDueToday.map(t => (
              <div key={t.id} className="flex items-center gap-3 p-3 rounded-md bg-danger/5 border border-danger/20">
                <CheckSquare className="w-4 h-4 text-danger flex-shrink-0" />
                <span className="text-sm flex-1">{t.title}</span>
                <span className="text-[11px] text-danger font-mono">Vence hoje</span>
              </div>
            ))}
            {alertClients.length === 0 && tasksDueToday.length === 0 && (
              <p className="text-muted-foreground text-sm">Nenhum alerta no momento. 🎉</p>
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

function formatDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}
