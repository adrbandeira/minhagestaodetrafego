import { useState, useEffect, useMemo } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/lib/store';
import { supabase } from '@/integrations/supabase/client';
import { Users, ClipboardList, CheckSquare, AlertTriangle, Wallet } from 'lucide-react';
import PinGate from '@/components/PinGate';

interface AdBalance {
  client_id: string;
  platform: string;
  balance: number;
  daily_spend: number;
}

type DashboardTab = 'geral' | 'agenciado' | 'pessoal';

export default function Dashboard() {
  const { clients, getTodayReviews, getOpenTasks, getClientsWithoutRecentReview } = useStore();
  const [balances, setBalances] = useState<AdBalance[]>([]);
  const [tab, setTab] = useState<DashboardTab>('geral');

  useEffect(() => {
    async function fetch() {
      const { data } = await supabase.from('ad_balances').select('*');
      if (data) setBalances(data as AdBalance[]);
    }
    fetch();
  }, []);

  const tabs: { key: DashboardTab; label: string }[] = [
    { key: 'geral', label: 'Geral' },
    { key: 'agenciado', label: 'Agenciados' },
    { key: 'pessoal', label: 'Pessoais' },
  ];

  const content = tab === 'pessoal' ? (
    <PinGate>
      <DashboardContent tab={tab} clients={clients} balances={balances} getTodayReviews={getTodayReviews} getOpenTasks={getOpenTasks} getClientsWithoutRecentReview={getClientsWithoutRecentReview} />
    </PinGate>
  ) : (
    <DashboardContent tab={tab} clients={clients} balances={balances} getTodayReviews={getTodayReviews} getOpenTasks={getOpenTasks} getClientsWithoutRecentReview={getClientsWithoutRecentReview} />
  );

  return (
    <div>
      <h1 className="text-2xl font-syne font-bold mb-4">Dashboard</h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t.key
                ? 'bg-primary text-primary-foreground'
                : 'bg-card border border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {content}
    </div>
  );
}

interface DashboardContentProps {
  tab: DashboardTab;
  clients: ReturnType<typeof useStore>['clients'];
  balances: AdBalance[];
  getTodayReviews: ReturnType<typeof useStore>['getTodayReviews'];
  getOpenTasks: ReturnType<typeof useStore>['getOpenTasks'];
  getClientsWithoutRecentReview: ReturnType<typeof useStore>['getClientsWithoutRecentReview'];
}

function DashboardContent({ tab, clients, balances, getTodayReviews, getOpenTasks, getClientsWithoutRecentReview }: DashboardContentProps) {
  const navigate = useNavigate();
  const isFiltered = tab !== 'geral';
  
  const filteredClients = useMemo(() => {
    if (!isFiltered) return clients;
    return clients.filter(c => c.type === tab);
  }, [clients, tab, isFiltered]);

  const filteredClientIds = useMemo(() => new Set(filteredClients.map(c => c.id)), [filteredClients]);

  const todayReviews = useMemo(() => {
    const all = getTodayReviews();
    if (!isFiltered) return all;
    return all.filter(r => filteredClientIds.has(r.clientId));
  }, [getTodayReviews, isFiltered, filteredClientIds]);

  const openTasks = useMemo(() => {
    const all = getOpenTasks();
    if (!isFiltered) return all;
    return all.filter(t => t.clientId && filteredClientIds.has(t.clientId));
  }, [getOpenTasks, isFiltered, filteredClientIds]);

  const alertClients = useMemo(() => {
    const all = getClientsWithoutRecentReview();
    if (!isFiltered) return all;
    return all.filter(c => c.type === tab);
  }, [getClientsWithoutRecentReview, isFiltered, tab]);

  const activeClients = filteredClients.filter(c => c.status === 'ativo').length;
  const doneReviews = todayReviews.filter(r => r.done).length;

  const today = new Date().toISOString().split('T')[0];
  const tasksDueToday = openTasks.filter(t => t.dueDate === today);

  const lowBudgetAlerts = useMemo(() => {
    const filtered = isFiltered
      ? balances.filter(b => filteredClientIds.has(b.client_id))
      : balances;
    return filtered
      .filter(b => b.daily_spend > 0 && Math.floor(b.balance / b.daily_spend) <= 3)
      .map(b => {
        const client = clients.find(c => c.id === b.client_id);
        const daysLeft = Math.floor(b.balance / b.daily_spend);
        return { ...b, clientName: client?.name || 'Desconhecido', daysLeft };
      });
  }, [balances, isFiltered, filteredClientIds, clients]);

  const hasAlerts = alertClients.length > 0 || tasksDueToday.length > 0 || lowBudgetAlerts.length > 0;

  return (
    <>
      {/* Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={<Users className="w-5 h-5 text-primary" />} label="Clientes Ativos" value={activeClients} />
        <StatCard icon={<ClipboardList className="w-5 h-5 text-meta" />} label="Revisões Hoje" value={`${doneReviews}/${todayReviews.length}`} />
        <StatCard icon={<CheckSquare className="w-5 h-5 text-warn" />} label="Tarefas Abertas" value={openTasks.length} />
        <StatCard icon={<AlertTriangle className="w-5 h-5 text-danger" />} label="Alertas Ativos" value={(alertClients.length > 0 ? 1 : 0) + (tasksDueToday.length > 0 ? 1 : 0) + lowBudgetAlerts.length} accent />
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
              isFiltered ? (
                <ReviewAlertsList clients={alertClients} />
              ) : (
                <div className="flex items-center gap-3 p-3 rounded-md bg-warn/5 border border-warn/20">
                  <AlertTriangle className="w-4 h-4 text-warn flex-shrink-0" />
                  <span className="text-sm flex-1">{alertClients.length} cliente{alertClients.length > 1 ? 's' : ''} sem revisão há mais de 3 dias</span>
                </div>
              )
            )}
            {tasksDueToday.length > 0 && (
              <div className="flex items-center gap-3 p-3 rounded-md bg-danger/5 border border-danger/20">
                <CheckSquare className="w-4 h-4 text-danger flex-shrink-0" />
                <span className="text-sm flex-1">{tasksDueToday.length} tarefa{tasksDueToday.length > 1 ? 's' : ''} vence{tasksDueToday.length === 1 ? '' : 'm'} hoje</span>
              </div>
            )}
            {lowBudgetAlerts.map(alert => (
              <div
                key={`${alert.client_id}-${alert.platform}`}
                onClick={() => navigate(`/cliente/${alert.client_id}`)}
                className="flex items-center gap-3 p-3 rounded-md bg-danger/5 border border-danger/20 cursor-pointer hover:bg-danger/10 transition-colors"
              >
                <Wallet className="w-4 h-4 text-danger flex-shrink-0" />
                <span className="text-sm flex-1">
                  {isFiltered && <><span className="font-medium">{alert.clientName}</span> — </>}
                  Verba de <span className="font-medium">{alert.platform}</span> acaba em <span className="font-bold text-danger">{alert.daysLeft} dia{alert.daysLeft !== 1 ? 's' : ''}</span>
                </span>
              </div>
            ))}
            {!hasAlerts && (
              <p className="text-muted-foreground text-sm">Nenhum alerta no momento.</p>
            )}
          </div>
        </div>
      </div>
    </>
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

function ReviewAlertsList({ clients }: { clients: { id: string; name: string }[] }) {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
  const MAX_VISIBLE = 3;
  const hasMore = clients.length > MAX_VISIBLE;
  const visible = expanded ? clients : clients.slice(0, MAX_VISIBLE);

  return (
    <div className="space-y-2">
      {visible.map(client => (
        <div
          key={client.id}
          onClick={() => navigate(`/clientes/${client.id}`)}
          className="flex items-center gap-3 p-3 rounded-md bg-warn/5 border border-warn/20 cursor-pointer hover:bg-warn/10 transition-colors"
        >
          <AlertTriangle className="w-4 h-4 text-warn flex-shrink-0" />
          <span className="text-sm flex-1">
            <span className="font-medium">{client.name}</span> sem revisão há mais de 3 dias
          </span>
        </div>
      ))}
      {hasMore && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors w-full justify-center py-1.5"
        >
          {expanded ? (
            <>Mostrar menos <ChevronUp className="w-3.5 h-3.5" /></>
          ) : (
            <>+ {clients.length - MAX_VISIBLE} cliente{clients.length - MAX_VISIBLE > 1 ? 's' : ''} sem revisão <ChevronDown className="w-3.5 h-3.5" /></>
          )}
        </button>
      )}
    </div>
  );
}
