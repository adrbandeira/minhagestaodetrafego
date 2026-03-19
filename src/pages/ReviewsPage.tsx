import { useState, useMemo } from 'react';
import { useStore } from '@/lib/store';
import { useNavigate } from 'react-router-dom';
import { PlatformBadge } from '@/components/Badges';
import { CheckCircle2, Circle, CalendarDays } from 'lucide-react';
import { Client } from '@/lib/types';

const WEEKDAYS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const WORK_DAYS = [1, 2, 3, 4, 5]; // seg-sex

function distributeClients(clients: Client[]): Map<number, Client[]> {
  const schedule = new Map<number, Client[]>();
  WORK_DAYS.forEach(d => schedule.set(d, []));

  const sorted = [...clients].sort((a, b) => a.name.localeCompare(b.name));
  sorted.forEach((client, i) => {
    const dayIndex = WORK_DAYS[i % WORK_DAYS.length];
    schedule.get(dayIndex)!.push(client);
  });

  return schedule;
}

export default function ReviewsPage() {
  const { clients, reviews, toggleReview, getClientName } = useStore();
  const navigate = useNavigate();
  const [tab, setTab] = useState<'agenciado' | 'pessoal'>('agenciado');

  const today = new Date();
  const todayDay = today.getDay(); // 0=dom ... 6=sab
  const todayStr = today.toISOString().split('T')[0];

  const pessoais = useMemo(() => clients.filter(c => c.type === 'pessoal' && c.status === 'ativo'), [clients]);
  const agenciados = useMemo(() => clients.filter(c => c.type === 'agenciado' && c.status === 'ativo'), [clients]);

  const schedulePessoal = useMemo(() => distributeClients(pessoais), [pessoais]);
  const scheduleAgenciado = useMemo(() => distributeClients(agenciados), [agenciados]);

  const currentSchedule = tab === 'pessoal' ? schedulePessoal : scheduleAgenciado;
  const currentClients = tab === 'pessoal' ? pessoais : agenciados;

  const todayClients = currentSchedule.get(todayDay) || [];

  const todayReviews = reviews.filter(r => r.date === todayStr);
  const getReviewForClient = (clientId: string) => todayReviews.find(r => r.clientId === clientId);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-syne font-bold">Revisões do Dia</h1>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CalendarDays className="w-4 h-4" />
          <span className="font-medium">{WEEKDAYS[todayDay]}, {today.toLocaleDateString('pt-BR')}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-secondary rounded-lg p-1 mb-6 w-fit">
        <button
          onClick={() => setTab('agenciado')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === 'agenciado' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
        >
          Agenciados ({agenciados.length})
        </button>
        <button
          onClick={() => setTab('pessoal')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === 'pessoal' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
        >
          Pessoais ({pessoais.length})
        </button>
      </div>

      {/* Today's reviews */}
      <div className="mb-8">
        <h2 className="text-sm font-syne font-bold text-primary mb-3 uppercase tracking-wider">
          Revisões de Hoje — {WEEKDAYS[todayDay]}
        </h2>
        {todayClients.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            {WORK_DAYS.includes(todayDay) ? 'Nenhum cliente agendado para hoje.' : 'Hoje é fim de semana — sem revisões agendadas.'}
          </p>
        ) : (
          <div className="space-y-2">
            {todayClients.map(client => {
              const review = getReviewForClient(client.id);
              const isDone = review?.done ?? false;
              return (
                <div
                  key={client.id}
                  className={`flex items-center gap-3 p-4 rounded-lg border transition-colors cursor-pointer ${isDone ? 'bg-muted/30 border-border/50' : 'bg-card border-border hover:bg-secondary/50'}`}
                  onClick={() => navigate(`/cliente/${client.id}`)}
                >
                  {isDone ? (
                    <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                  ) : (
                    <Circle className="w-5 h-5 text-muted-foreground shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <span className={`text-sm font-medium ${isDone ? 'line-through text-muted-foreground' : ''}`}>
                      {client.name}
                    </span>
                    <span className="text-[11px] text-muted-foreground ml-2">{client.segment}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {client.platforms.map(p => <PlatformBadge key={p} platform={p} />)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Full week schedule */}
      <div>
        <h2 className="text-sm font-syne font-bold text-muted-foreground mb-4 uppercase tracking-wider">
          Agenda da Semana
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {WORK_DAYS.map(day => {
            const dayClients = currentSchedule.get(day) || [];
            const isToday = day === todayDay;
            return (
              <div
                key={day}
                className={`rounded-lg border p-4 ${isToday ? 'border-primary bg-primary/5' : 'border-border bg-card'}`}
              >
                <p className={`text-xs font-syne font-bold mb-3 uppercase tracking-wider ${isToday ? 'text-primary' : 'text-muted-foreground'}`}>
                  {WEEKDAYS[day]}
                  <span className="ml-1.5 font-mono text-[10px]">({dayClients.length})</span>
                </p>
                <div className="space-y-1.5">
                  {dayClients.map(c => (
                    <div
                      key={c.id}
                      onClick={() => navigate(`/cliente/${c.id}`)}
                      className="text-[12px] py-1.5 px-2 rounded hover:bg-secondary/80 cursor-pointer transition-colors truncate"
                    >
                      {c.name}
                    </div>
                  ))}
                  {dayClients.length === 0 && (
                    <p className="text-[11px] text-muted-foreground">—</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
