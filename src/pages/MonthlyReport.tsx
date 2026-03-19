import { useState, useEffect, useMemo } from 'react';
import { useStore } from '@/lib/store';
import { supabase } from '@/integrations/supabase/client';
import { FileText, ChevronDown, CheckSquare, ClipboardList, Wallet, TrendingDown, Download } from 'lucide-react';
import PinGate from '@/components/PinGate';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface AdBalance {
  client_id: string;
  platform: string;
  balance: number;
  daily_spend: number;
  updated_at: string;
}

function getClientData(client: any, reviews: any[], tasks: any[], history: any[], balances: AdBalance[], monthStart: string, monthEnd: string) {
  const clientReviews = reviews.filter(r => r.clientId === client.id && r.date >= monthStart && r.date <= monthEnd);
  const doneReviews = clientReviews.filter(r => r.done).length;
  const clientHistory = history.filter(h => h.clientId === client.id && h.date >= monthStart && h.date <= monthEnd);
  const clientTasks = tasks.filter(t => t.clientId === client.id);
  const doneTasks = clientTasks.filter(t => t.done).length;
  const totalTasks = clientTasks.length;
  const clientBalances = balances.filter(b => b.client_id === client.id);
  return { clientReviews, doneReviews, clientHistory, clientTasks, doneTasks, totalTasks, clientBalances };
}

function exportClientPDF(client: any, data: ReturnType<typeof getClientData>, monthLabel: string) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Relatório Mensal', 14, 20);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100);
  doc.text(monthLabel, 14, 28);

  // Client info
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0);
  doc.text(client.name, 14, 42);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100);
  doc.text(`${client.segment} — R$ ${client.budget.toLocaleString('pt-BR')}/mês`, 14, 49);

  let y = 58;

  // Reviews table
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0);
  doc.text('Revisões', 14, y);
  y += 2;

  autoTable(doc, {
    startY: y,
    head: [['Métrica', 'Valor']],
    body: [
      ['Agendadas', String(data.clientReviews.length)],
      ['Concluídas', String(data.doneReviews)],
      ['Histórico registrado', String(data.clientHistory.length)],
      ['Taxa de conclusão', data.clientReviews.length > 0 ? `${Math.round((data.doneReviews / data.clientReviews.length) * 100)}%` : '—'],
    ],
    theme: 'striped',
    headStyles: { fillColor: [34, 139, 96] },
    margin: { left: 14, right: 14 },
  });

  y = (doc as any).lastAutoTable.finalY + 12;

  // Tasks table
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Tarefas', 14, y);
  y += 2;

  autoTable(doc, {
    startY: y,
    head: [['Métrica', 'Valor']],
    body: [
      ['Total', String(data.totalTasks)],
      ['Concluídas', String(data.doneTasks)],
      ['Pendentes', String(data.totalTasks - data.doneTasks)],
      ['Taxa de conclusão', data.totalTasks > 0 ? `${Math.round((data.doneTasks / data.totalTasks) * 100)}%` : '—'],
    ],
    theme: 'striped',
    headStyles: { fillColor: [34, 139, 96] },
    margin: { left: 14, right: 14 },
  });

  y = (doc as any).lastAutoTable.finalY + 12;

  // Ad Balances table
  if (data.clientBalances.length > 0) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Verba de Anúncios', 14, y);
    y += 2;

    const balanceRows = data.clientBalances.map(b => {
      const daysLeft = b.daily_spend > 0 ? Math.floor(b.balance / b.daily_spend) : null;
      return [
        b.platform,
        `R$ ${b.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        `R$ ${b.daily_spend.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        daysLeft !== null ? `${daysLeft} dias` : '—',
      ];
    });

    autoTable(doc, {
      startY: y,
      head: [['Plataforma', 'Saldo', 'Investimento Diário', 'Verba acaba em']],
      body: balanceRows,
      theme: 'striped',
      headStyles: { fillColor: [34, 139, 96] },
      margin: { left: 14, right: 14 },
    });
  }

  // Footer
  const finalY = (doc as any).lastAutoTable?.finalY || y;
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text(`Gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`, 14, finalY + 16);
  doc.text('Minha Gestão de Tráfego', pageWidth - 14, finalY + 16, { align: 'right' });

  const safeName = client.name.replace(/[^a-zA-Z0-9]/g, '_');
  doc.save(`relatorio_${safeName}_${monthLabel.replace(/\s/g, '_')}.pdf`);
}

function MonthlyReportContent() {
  const { clients, reviews, tasks, history } = useStore();
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [balances, setBalances] = useState<AdBalance[]>([]);

  useEffect(() => {
    async function fetchBalances() {
      const { data } = await supabase.from('ad_balances').select('*');
      if (data) setBalances(data as AdBalance[]);
    }
    fetchBalances();
  }, []);

  const activeClients = clients.filter(c => c.status === 'ativo');

  const monthStart = `${selectedMonth}-01`;
  const monthEnd = (() => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const lastDay = new Date(y, m, 0).getDate();
    return `${selectedMonth}-${String(lastDay).padStart(2, '0')}`;
  })();

  const months = useMemo(() => {
    const result: string[] = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      result.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    }
    return result;
  }, []);

  const formatMonth = (m: string) => {
    const [y, mo] = m.split('-').map(Number);
    const date = new Date(y, mo - 1);
    return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  };

  const monthLabel = formatMonth(selectedMonth);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-syne font-bold flex items-center gap-3">
          <FileText className="w-6 h-6 text-primary" /> Relatório Mensal
        </h1>
        <div className="relative">
          <select
            value={selectedMonth}
            onChange={e => setSelectedMonth(e.target.value)}
            className="appearance-none bg-card border border-border rounded-lg px-4 py-2 pr-8 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
          >
            {months.map(m => (
              <option key={m} value={m} className="capitalize">{formatMonth(m)}</option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 text-muted-foreground absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {activeClients.length === 0 && (
        <p className="text-muted-foreground text-sm">Nenhum cliente ativo.</p>
      )}

      <div className="space-y-6">
        {activeClients.map(client => {
          const data = getClientData(client, reviews, tasks, history, balances, monthStart, monthEnd);

          return (
            <div key={client.id} className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-sm font-syne font-bold text-primary">
                    {client.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{client.name}</p>
                    <p className="text-[11px] text-muted-foreground">{client.segment} — R$ {client.budget.toLocaleString('pt-BR')}/mês</p>
                  </div>
                </div>
                <button
                  onClick={() => exportClientPDF(client, data, monthLabel)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary text-foreground rounded-md text-[12px] font-medium hover:bg-secondary/80 transition-colors border border-border"
                  title="Exportar PDF"
                >
                  <Download className="w-3.5 h-3.5" /> PDF
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border">
                {/* Reviews */}
                <div className="p-5">
                  <h3 className="text-xs font-medium text-muted-foreground mb-3 flex items-center gap-1.5">
                    <ClipboardList className="w-3.5 h-3.5" /> Revisões
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Agendadas</span>
                      <span className="font-medium">{data.clientReviews.length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Concluídas</span>
                      <span className="font-medium text-primary">{data.doneReviews}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Histórico registrado</span>
                      <span className="font-medium">{data.clientHistory.length}</span>
                    </div>
                    {data.clientReviews.length > 0 && (
                      <div className="mt-2">
                        <div className="w-full bg-secondary rounded-full h-2">
                          <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${(data.doneReviews / data.clientReviews.length) * 100}%` }} />
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-1">{Math.round((data.doneReviews / data.clientReviews.length) * 100)}% concluído</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Tasks */}
                <div className="p-5">
                  <h3 className="text-xs font-medium text-muted-foreground mb-3 flex items-center gap-1.5">
                    <CheckSquare className="w-3.5 h-3.5" /> Tarefas
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Total</span>
                      <span className="font-medium">{data.totalTasks}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Concluídas</span>
                      <span className="font-medium text-primary">{data.doneTasks}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Pendentes</span>
                      <span className="font-medium text-warn">{data.totalTasks - data.doneTasks}</span>
                    </div>
                    {data.totalTasks > 0 && (
                      <div className="mt-2">
                        <div className="w-full bg-secondary rounded-full h-2">
                          <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${(data.doneTasks / data.totalTasks) * 100}%` }} />
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-1">{Math.round((data.doneTasks / data.totalTasks) * 100)}% concluído</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Ad Balances */}
                <div className="p-5">
                  <h3 className="text-xs font-medium text-muted-foreground mb-3 flex items-center gap-1.5">
                    <Wallet className="w-3.5 h-3.5" /> Verba de Anúncios
                  </h3>
                  {data.clientBalances.length === 0 ? (
                    <p className="text-xs text-muted-foreground">Sem dados de verba registrados.</p>
                  ) : (
                    <div className="space-y-3">
                      {data.clientBalances.map(b => {
                        const daysLeft = b.daily_spend > 0 ? Math.floor(b.balance / b.daily_spend) : null;
                        return (
                          <div key={b.platform} className="space-y-1">
                            <p className="text-xs font-medium">{b.platform}</p>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Saldo</span>
                              <span className="font-medium">R$ {b.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Diário</span>
                              <span className="font-medium">R$ {b.daily_spend.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground flex items-center gap-1"><TrendingDown className="w-3 h-3" /> Acaba em</span>
                              <span className={`font-bold ${daysLeft !== null && daysLeft <= 3 ? 'text-destructive' : daysLeft !== null && daysLeft <= 7 ? 'text-warn' : ''}`}>
                                {daysLeft !== null ? `${daysLeft} dias` : '—'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
