import { useState, useMemo } from 'react';
import { useStore } from '@/lib/store';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';
import { CheckCircle2, Circle, ClipboardList, CheckSquare, StickyNote, Wallet, ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import { PlatformBadge } from '@/components/Badges';
import { Platform } from '@/lib/types';

interface AdBalance {
  client_id: string;
  platform: string;
  balance: number;
  daily_spend: number;
  updated_at: string;
}

const WEEKDAYS = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];

export default function DailyReport({ clientType, initialDate }: { clientType: 'agenciado' | 'pessoal'; initialDate?: string }) {
  const { clients, reviews, tasks, notes, history } = useStore();
  const [selectedDate, setSelectedDate] = useState(() => initialDate || new Date().toISOString().split('T')[0]);
  const [balances, setBalances] = useState<AdBalance[]>([]);

  useEffect(() => {
    async function fetch() {
      const { data } = await supabase.from('ad_balances').select('*');
      if (data) setBalances(data as AdBalance[]);
    }
    fetch();
  }, []);

  const clientIds = useMemo(() => new Set(clients.filter(c => c.type === clientType).map(c => c.id)), [clients, clientType]);

  const navigateDay = (dir: -1 | 1) => {
    const d = new Date(selectedDate + 'T12:00:00');
    d.setDate(d.getDate() + dir);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const isToday = selectedDate === new Date().toISOString().split('T')[0];
  const dateObj = new Date(selectedDate + 'T12:00:00');
  const dayLabel = `${WEEKDAYS[dateObj.getDay()]}, ${dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}`;

  // Day's data filtered by client type
  const dayReviews = useMemo(() => reviews.filter(r => r.date === selectedDate && clientIds.has(r.clientId)), [reviews, selectedDate, clientIds]);
  const dayHistory = useMemo(() => history.filter(h => h.date === selectedDate && clientIds.has(h.clientId)), [history, selectedDate, clientIds]);
  const dayTasks = useMemo(() => tasks.filter(t => t.dueDate === selectedDate && (t.clientId ? clientIds.has(t.clientId) : true)), [tasks, selectedDate, clientIds]);
  const dayNotes = useMemo(() => notes.filter(n => n.date === selectedDate && clientIds.has(n.clientId)), [notes, selectedDate, clientIds]);

  // Updated balances on this day
  const dayBalances = useMemo(() => {
    return balances.filter(b => {
      if (!b.updated_at) return false;
      return b.updated_at.split('T')[0] === selectedDate && clientIds.has(b.client_id);
    });
  }, [balances, selectedDate, clientIds]);

  const doneReviews = dayReviews.filter(r => r.done);
  const doneTasks = dayTasks.filter(t => t.done);
  const pendingTasks = dayTasks.filter(t => !t.done);

  const getClientName = (id: string | null) => {
    if (!id) return 'Geral';
    return clients.find(c => c.id === id)?.name ?? 'Desconhecido';
  };

  const allReviewsDone = dayReviews.length > 0 && doneReviews.length === dayReviews.length;
  const allTasksDone = dayTasks.length > 0 && doneTasks.length === dayTasks.length;

  return (
    <div>
      {/* Date navigation */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigateDay(-1)} className="p-2 rounded-lg hover:bg-secondary transition-colors">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-2 text-sm">
          <CalendarDays className="w-4 h-4 text-primary" />
          <span className="font-medium">{dayLabel}</span>
          {isToday && <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">Hoje</span>}
        </div>
        <button onClick={() => navigateDay(1)} className="p-2 rounded-lg hover:bg-secondary transition-colors" disabled={isToday}>
          <ChevronRight className={`w-4 h-4 ${isToday ? 'text-muted-foreground/30' : ''}`} />
        </button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard label="Revisões" value={`${doneReviews.length}/${dayReviews.length}`} done={allReviewsDone} icon={<ClipboardList className="w-4 h-4" />} />
        <StatCard label="Tarefas" value={`${doneTasks.length}/${dayTasks.length}`} done={allTasksDone} icon={<CheckSquare className="w-4 h-4" />} />
        <StatCard label="Anotações" value={String(dayNotes.length)} icon={<StickyNote className="w-4 h-4" />} />
        <StatCard label="Verbas atualizadas" value={String(dayBalances.length)} icon={<Wallet className="w-4 h-4" />} />
      </div>

      {/* No activity */}
      {dayReviews.length === 0 && dayTasks.length === 0 && dayNotes.length === 0 && dayHistory.length === 0 && dayBalances.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground text-sm">Nenhuma atividade registrada neste dia.</p>
        </div>
      )}

      <div className="space-y-6">
        {/* Reviews section */}
        {dayReviews.length > 0 && (
          <Section title="Revisões" icon={<ClipboardList className="w-4 h-4" />} count={`${doneReviews.length}/${dayReviews.length}`} done={allReviewsDone}>
            <div className="space-y-2">
              {dayReviews.map(r => (
                <div key={r.id} className={`flex items-start gap-3 p-3 rounded-lg border ${r.done ? 'bg-muted/30 border-border/50' : 'border-border bg-card'}`}>
                  {r.done ? <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" /> : <Circle className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${r.done ? 'line-through text-muted-foreground' : ''}`}>{getClientName(r.clientId)}</p>
                    {r.summary && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{r.summary}</p>}
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-[10px] text-muted-foreground">{r.time}</span>
                      {r.platforms.map(p => <PlatformBadge key={p} platform={p as Platform} />)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* History summaries */}
        {dayHistory.length > 0 && (
          <Section title="Resumos de Revisão" icon={<ClipboardList className="w-4 h-4" />} count={String(dayHistory.length)}>
            <div className="space-y-2">
              {dayHistory.map(h => (
                <div key={h.id} className="p-3 rounded-lg border border-border bg-card">
                  <p className="text-sm font-medium mb-1">{getClientName(h.clientId)}</p>
                  <p className="text-xs text-muted-foreground">{h.summary}</p>
                  <div className="flex gap-1.5 mt-2">
                    {h.platforms.map(p => <PlatformBadge key={p} platform={p as Platform} />)}
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Tasks */}
        {dayTasks.length > 0 && (
          <Section title="Tarefas" icon={<CheckSquare className="w-4 h-4" />} count={`${doneTasks.length}/${dayTasks.length}`} done={allTasksDone}>
            <div className="space-y-2">
              {dayTasks.map(t => (
                <div key={t.id} className={`flex items-center gap-3 p-3 rounded-lg border ${t.done ? 'bg-muted/30 border-border/50' : 'border-border bg-card'}`}>
                  {t.done ? <CheckCircle2 className="w-4 h-4 text-primary shrink-0" /> : <Circle className="w-4 h-4 text-muted-foreground shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${t.done ? 'line-through text-muted-foreground' : ''}`}>{t.title}</p>
                    <p className="text-[11px] text-muted-foreground">{getClientName(t.clientId)}</p>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Notes */}
        {dayNotes.length > 0 && (
          <Section title="Anotações" icon={<StickyNote className="w-4 h-4" />} count={String(dayNotes.length)}>
            <div className="space-y-2">
              {dayNotes.map(n => (
                <div key={n.id} className="p-3 rounded-lg border border-border bg-card">
                  <p className="text-sm font-medium mb-1">{getClientName(n.clientId)}</p>
                  <p className="text-xs text-muted-foreground whitespace-pre-wrap">{n.content}</p>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Balance updates */}
        {dayBalances.length > 0 && (
          <Section title="Verbas Atualizadas" icon={<Wallet className="w-4 h-4" />} count={String(dayBalances.length)}>
            <div className="space-y-2">
              {dayBalances.map(b => (
                <div key={`${b.client_id}-${b.platform}`} className="flex items-center justify-between p-3 rounded-lg border border-border bg-card">
                  <div>
                    <p className="text-sm font-medium">{getClientName(b.client_id)}</p>
                    <p className="text-[11px] text-muted-foreground">{b.platform}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-mono font-medium">R$ {b.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    <p className="text-[10px] text-muted-foreground">R$ {b.daily_spend.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/dia</p>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, done, icon }: { label: string; value: string; done?: boolean; icon: React.ReactNode }) {
  return (
    <div className={`rounded-xl border p-4 ${done ? 'border-primary bg-primary/5' : 'border-border bg-card'}`}>
      <div className="flex items-center gap-2 mb-2">
        <span className={done ? 'text-primary' : 'text-muted-foreground'}>{icon}</span>
        <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">{label}</span>
        {done && <CheckCircle2 className="w-3.5 h-3.5 text-primary ml-auto" />}
      </div>
      <p className="text-xl font-bold font-mono">{value}</p>
    </div>
  );
}

function Section({ title, icon, count, done, children }: { title: string; icon: React.ReactNode; count?: string; done?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <span className={done ? 'text-primary' : 'text-muted-foreground'}>{icon}</span>
        <h3 className="text-sm font-syne font-bold uppercase tracking-wider">{title}</h3>
        {count && <span className="text-[10px] font-mono text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">{count}</span>}
        {done && <CheckCircle2 className="w-4 h-4 text-primary" />}
      </div>
      {children}
    </div>
  );
}
