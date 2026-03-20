import { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Review, Task } from '@/lib/types';

interface SLAEvolutionChartProps {
  reviews: Review[];
  tasks: Task[];
  periodStart: string;
  today: string;
  clientIds: Set<string>;
}

export default function SLAEvolutionChart({ reviews, tasks, periodStart, today, clientIds }: SLAEvolutionChartProps) {
  const chartData = useMemo(() => {
    // Generate weekly buckets between periodStart and today
    const start = new Date(periodStart);
    const end = new Date(today);
    const buckets: { start: Date; end: Date }[] = [];

    const cursor = new Date(start);
    while (cursor <= end) {
      const bucketEnd = new Date(cursor);
      bucketEnd.setDate(bucketEnd.getDate() + 6);
      buckets.push({
        start: new Date(cursor),
        end: bucketEnd > end ? end : bucketEnd,
      });
      cursor.setDate(cursor.getDate() + 7);
    }

    return buckets.map(bucket => {
      const bStart = bucket.start.toISOString().split('T')[0];
      const bEnd = bucket.end.toISOString().split('T')[0];

      const bReviews = reviews.filter(r => clientIds.has(r.clientId) && r.date >= bStart && r.date <= bEnd);
      const bTasks = tasks.filter(t => (t.clientId ? clientIds.has(t.clientId) : true) && t.dueDate >= bStart && t.dueDate <= bEnd);

      const reviewRate = bReviews.length > 0 ? Math.round((bReviews.filter(r => r.done).length / bReviews.length) * 100) : null;
      const taskRate = bTasks.length > 0 ? Math.round((bTasks.filter(t => t.done).length / bTasks.length) * 100) : null;

      const label = `${bucket.start.getDate().toString().padStart(2, '0')}/${(bucket.start.getMonth() + 1).toString().padStart(2, '0')}`;

      return {
        semana: label,
        revisoes: reviewRate,
        tarefas: taskRate,
      };
    });
  }, [reviews, tasks, periodStart, today, clientIds]);

  const hasData = chartData.some(d => d.revisoes !== null || d.tarefas !== null);

  if (!hasData) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground text-sm">
        Sem dados suficientes para gerar o gráfico de evolução.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h3 className="text-sm font-syne font-bold uppercase tracking-wider text-muted-foreground mb-4">
        Evolução Semanal do SLA
      </h3>
      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
            <defs>
              <linearGradient id="colorRevisoes" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorTarefas" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--accent-foreground))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--accent-foreground))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="semana"
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
              tickLine={false}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${v}%`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                fontSize: '12px',
              }}
              formatter={(value: number | null, name: string) => {
                if (value === null) return ['—', name];
                const label = name === 'revisoes' ? 'Revisões' : 'Tarefas';
                return [`${value}%`, label];
              }}
              labelFormatter={(label) => `Semana de ${label}`}
            />
            <Legend
              formatter={(value) => (value === 'revisoes' ? 'Revisões' : 'Tarefas')}
              wrapperStyle={{ fontSize: '12px' }}
            />
            <Area
              type="monotone"
              dataKey="revisoes"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              fill="url(#colorRevisoes)"
              connectNulls
              dot={{ r: 3, fill: 'hsl(var(--primary))' }}
              activeDot={{ r: 5 }}
            />
            <Area
              type="monotone"
              dataKey="tarefas"
              stroke="hsl(var(--accent-foreground))"
              strokeWidth={2}
              fill="url(#colorTarefas)"
              connectNulls
              dot={{ r: 3, fill: 'hsl(var(--accent-foreground))' }}
              activeDot={{ r: 5 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
