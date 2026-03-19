import { useState, useMemo, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle2, Circle, ClipboardList, CheckSquare, StickyNote, Wallet, ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';

interface AdBalance {
  client_id: string;
  platform: string;
  balance: number;
  daily_spend: number;
  updated_at: string;
}

function getWeekRange(date: Date): { start: string; end: string; label: string } {
  const d = new Date(date);
  const day = d.getDay();
  const diffToMon = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + diffToMon);
  const friday = new Date(monday);
  friday.setDate(monday.getDate() + 4);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const start = monday.toISOString().split('T')[0];
  const end = sunday.toISOString().split('T')[0];
  const label = `${monday.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} — ${sunday.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}`;
  return { start, end, label };
}

export default function WeeklyReport() {
  const { clients, reviews, tasks, notes, history } = useStore();
  const [weekOffset, setWeekOffset] = useState(0);
  const [balances, setBalances] = useState<AdBalance[]>([]);

  useEffect(() => {
    async function fetch() {
      const { data } = await supabase.from('ad_balances').select('*');
      if (data) setBalances(data as AdBalance[]);
    }
    fetch();
  }, []);

  const baseDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + weekOffset * 7);
    return d;
  }, [weekOffset]);

  const { start, end, label } = getWeekRange(baseDate);
  const isCurrentWeek = weekOffset === 0;

  const inRange = (date: string) => date >= start && date <= end;

  const weekReviews = useMemo(() => reviews.filter(r => inRange(r.date)), [reviews, start, end]);
  const weekHistory = useMemo(() => history.filter(h => inRange(h.date)), [history, start, end]);
  const weekTasks = useMemo(() => tasks.filter(t => inRange(t.dueDate)), [tasks, start, end]);
  const weekNotes = useMemo(() => notes.filter(n => inRange(n.date)), [notes, start, end]);
  const weekBalances = useMemo(() => {
    return balances.filter(b => b.updated_at && inRange(b.updated_at.split('T')[0]));
  }, [balances, start, end]);

  const doneReviews = weekReviews.filter(r => r.done);
  const doneTasks = weekTasks.filter(t => t.done);

  const getClientName = (id: string | null) => {
    if (!id) return 'Geral';
    return clients.find(c => c.id === id)?.name ?? 'Desconhecido';
  };

  // Group history by client for a nicer view
  const historyByClient = useMemo(() => {
    const map = new Map<string, typeof weekHistory>();
    weekHistory.forEach(h => {
      const name = getClientName(h.clientId);
      if (!map.has(name)) map.set(name, []);
      map.get(name)!.push(h);
    });
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [weekHistory, clients]);

  // Days with activity
  const WEEKDAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
  const daysActivity = useMemo(() => {
    const days: { date: string; label: string; reviews: number; tasks: number; notes: number }[] = [];
    const mon = new Date(start + 'T12:00:00');
    for (let i = 0; i < 7; i++) {
      const d = new Date(mon);
      d.setDate(mon.getDate() + i);
      const ds = d.toISOString().split('T')[0];
      days.push({
        date: ds,
        label: WEEKDAYS[i],
        reviews: weekReviews.filter(r => r.date === ds && r.done).length,
        tasks: weekTasks.filter(t => t.dueDate === ds && t.done).length,
        notes: weekNotes.filter(n => n.date === ds).length,
      });
    }
    return days;
  }, [start, weekReviews, weekTasks, weekNotes]);

  return (
    <div>
      {/* Week navigation */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => setWeekOffset(w => w - 1)} className="p-2 rounded-lg hover:bg-secondary transition-colors">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-2 text-sm">
          <CalendarDays className="w-4 h-4 text-primary" />
          <span className="font-medium">{label}</span>
          {isCurrentWeek && <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">Semana atual</span>}
        </div>
        <button onClick={() => setWeekOffset(w => w + 1)} className="p-2 rounded-lg hover:bg-secondary transition-colors" disabled={isCurrentWeek}>
          <ChevronRight className={`w-4 h-4 ${isCurrentWeek ? 'text-muted-foreground/30' : ''}`} />
        </button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard label="Revisões" value={`${doneReviews.length}/${weekReviews.length}`} icon={<ClipboardList className="w-4 h-4" />} />
        <StatCard label="Tarefas" value={`${doneTasks.length}/${weekTasks.length}`} icon={<CheckSquare className="w-4 h-4" />} />
        <StatCard label="Anotações" value={String(weekNotes.length)} icon={<StickyNote className="w-4 h-4" />} />
        <StatCard label="Verbas atualizadas" value={String(weekBalances.length)} icon={<Wallet className="w-4 h-4" />} />
      </div>

      {/* Days overview */}
      <div className="grid grid-cols-7 gap-2 mb-6">
        {daysActivity.map(day => {
          const hasActivity = day.reviews > 0 || day.tasks > 0 || day.notes > 0;
          const todayStr = new Date().toISOString().split('T')[0];
          const isToday = day.date === todayStr;
          return (
            <div key={day.date} className={`rounded-lg border p-3 text-center ${isToday ? 'border-primary bg-primary/5' : hasActivity ? 'border-border bg-card' : 'border-border/50 bg-muted/20'}`}>
              <p className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${isToday ? 'text-primary' : 'text-muted-foreground'}`}>{day.label}</p>
              <div className="space-y-1">
                {day.reviews > 0 && <p className="text-[10px] text-muted-foreground"><span className="font-mono font-bold text-foreground">{day.reviews}</span> rev</p>}
                {day.tasks > 0 && <p className="text-[10px] text-muted-foreground"><span className="font-mono font-bold text-foreground">{day.tasks}</span> tarefas</p>}
                {day.notes > 0 && <p className="text-[10px] text-muted-foreground"><span className="font-mono font-bold text-foreground">{day.notes}</span> notas</p>}
                {!hasActivity && <p className="text-[10px] text-muted-foreground/50">—</p>}
              </div>
            </div>
          );
        })}
      </div>

      {/* Review summaries by client */}
      {historyByClient.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-syne font-bold uppercase tracking-wider mb-3 flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-muted-foreground" /> Resumos das Revisões
          </h3>
          <div className="space-y-3">
            {historyByClient.map(([clientName, items]) => (
              <div key={clientName} className="rounded-lg border border-border bg-card p-4">
                <p className="text-sm font-bold mb-2">{clientName}</p>
                <div className="space-y-2">
                  {items.sort((a, b) => a.date.localeCompare(b.date)).map(h => (
                    <div key={h.id} className="flex gap-3">
                      <span className="text-[10px] font-mono text-muted-foreground mt-0.5 shrink-0 w-10">
                        {new Date(h.date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                      </span>
                      <p className="text-xs text-muted-foreground">{h.summary}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pending tasks */}
      {weekTasks.filter(t => !t.done).length > 0 && (
        <div>
          <h3 className="text-sm font-syne font-bold uppercase tracking-wider mb-3 flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-muted-foreground" /> Tarefas Pendentes da Semana
          </h3>
          <div className="space-y-2">
            {weekTasks.filter(t => !t.done).map(t => (
              <div key={t.id} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card">
                <Circle className="w-4 h-4 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm">{t.title}</p>
                  <p className="text-[11px] text-muted-foreground">{getClientName(t.clientId)} — {new Date(t.dueDate + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {weekReviews.length === 0 && weekTasks.length === 0 && weekNotes.length === 0 && weekHistory.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground text-sm">Nenhuma atividade registrada nesta semana.</p>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-muted-foreground">{icon}</span>
        <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">{label}</span>
      </div>
      <p className="text-xl font-bold font-mono">{value}</p>
    </div>
  );
}
