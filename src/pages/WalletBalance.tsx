import { useParams } from 'react-router-dom';
import { useStore } from '@/lib/store';
import { Platform } from '@/lib/types';
import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from '@/hooks/use-toast';
import { Wallet, Save, X, Pencil, Clock, TrendingDown, CreditCard, CalendarDays, LayoutGrid, List } from 'lucide-react';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { DatePicker } from '@/components/ui/date-picker';
import PinGate from '@/components/PinGate';
import { PlatformBadge } from '@/components/Badges';

interface WalletRow {
  id: string | null; // ad_balance row id (null if no record yet)
  clientId: string;
  clientName: string;
  balance: number;
  paymentMethod: string;
  dailySpend: number;
  lastPaymentAmount: number;
  lastPaymentDate: string;
  platform: string;
  updatedAt: string;
}

function WalletBalanceContent() {
  const { type } = useParams<{ type: string }>();
  const { clients } = useStore();
  const [rows, setRows] = useState<WalletRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingKey, setEditingKey] = useState<string | null>(null); // "clientId:platform"
  const [editForm, setEditForm] = useState<Partial<WalletRow>>({});
  const [platformFilter, setPlatformFilter] = useState<'all' | 'meta' | 'google'>('all');
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards');

  const filtered = clients.filter(c => c.type === type && c.status === 'ativo');
  const label = type === 'pessoal' ? 'Pessoais' : 'Agenciados';

  const fetchBalances = useCallback(async () => {
    setLoading(true);
    const clientIds = filtered.map(c => c.id);
    if (clientIds.length === 0) { setLoading(false); return; }

    const { data } = await supabase
      .from('ad_balances')
      .select('*')
      .in('client_id', clientIds);

    // Map: "clientId:platform" -> ad_balance row
    const balanceMap = new Map<string, any>();
    (data || []).forEach((row: any) => {
      balanceMap.set(`${row.client_id}:${row.platform}`, row);
    });

    // Create one row per client per platform
    const mapped: WalletRow[] = [];
    filtered.forEach(c => {
      const platforms = c.platforms?.length ? c.platforms : ['Meta Ads'];
      platforms.forEach(platform => {
        const key = `${c.id}:${platform}`;
        const b = balanceMap.get(key);
        mapped.push({
          id: b?.id ?? null,
          clientId: c.id,
          clientName: c.name,
          balance: b?.balance ?? 0,
          paymentMethod: b?.payment_method ?? '',
          dailySpend: b?.daily_spend ?? 0,
          lastPaymentAmount: b?.last_payment_amount ?? 0,
          lastPaymentDate: b?.last_payment_date ?? '',
          platform,
          updatedAt: b?.updated_at ?? '',
        });
      });
    });

    // Sort by client name
    mapped.sort((a, b) => a.clientName.localeCompare(b.clientName));
    setRows(mapped);
    setLoading(false);
  }, [filtered]);

  useEffect(() => { fetchBalances(); }, [clients, type]);

  const rowKey = (row: WalletRow) => `${row.clientId}:${row.platform}`;

  const startEdit = (row: WalletRow) => {
    setEditingKey(rowKey(row));
    setEditForm({ ...row });
  };

  const cancelEdit = () => {
    setEditingKey(null);
    setEditForm({});
  };

  const saveEdit = async () => {
    if (!editingKey) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const currentRow = rows.find(r => rowKey(r) === editingKey);
    if (!currentRow) return;

    const payload = {
      client_id: currentRow.clientId,
      balance: editForm.balance ?? 0,
      daily_spend: editForm.dailySpend ?? 0,
      payment_method: editForm.paymentMethod ?? '',
      last_payment_amount: editForm.lastPaymentAmount ?? 0,
      last_payment_date: editForm.lastPaymentDate ?? '',
      platform: currentRow.platform,
      user_id: user.id,
      updated_at: new Date().toISOString(),
    };

    let error;
    if (currentRow.id) {
      // Update existing record by its unique ID
      ({ error } = await supabase.from('ad_balances').update(payload).eq('id', currentRow.id));
    } else {
      // Insert new record
      ({ error } = await supabase.from('ad_balances').insert(payload));
    }

    if (!error) {
      toast({ title: 'Salvo', description: 'Saldo atualizado com sucesso.' });
      setEditingKey(null);
      fetchBalances();
    } else {
      toast({ title: 'Erro', description: 'Não foi possível salvar.', variant: 'destructive' });
    }
  };

  const formatCurrency = (v: number) =>
    v ? `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '—';

  const calcDaysLeft = (balance: number, daily: number): { text: string; days: number } => {
    if (!daily || daily <= 0 || !balance) return { text: '—', days: -1 };
    const days = Math.floor(balance / daily);
    return { text: `${days} dia${days !== 1 ? 's' : ''}`, days };
  };

  const formatDateTime = (iso: string) => {
    if (!iso) return '—';
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('pt-BR') + ' às ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } catch { return '—'; }
  };

  const displayRows = useMemo(() => {
    if (platformFilter === 'all') return rows;
    const keyword = platformFilter === 'meta' ? 'meta' : 'google';
    return rows.filter(row => row.platform.toLowerCase().includes(keyword));
  }, [rows, platformFilter]);

  const hasGoogle = rows.some(r => r.platform.toLowerCase().includes('google'));
  const hasMeta = rows.some(r => r.platform.toLowerCase().includes('meta'));

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <Wallet className="w-5 h-5 text-primary" />
          </div>
          <h1 className="text-2xl font-syne font-bold">Saldo da Carteira — {label}</h1>
        </div>
        <div className="flex items-center gap-2">
          {(hasGoogle || hasMeta) && (
            <div className="flex gap-1 bg-secondary rounded-lg p-1">
              <button onClick={() => setPlatformFilter('all')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${platformFilter === 'all' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
                Todos
              </button>
              {hasMeta && (
                <button onClick={() => setPlatformFilter('meta')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${platformFilter === 'meta' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
                  Meta Ads
                </button>
              )}
              {hasGoogle && (
                <button onClick={() => setPlatformFilter('google')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${platformFilter === 'google' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
                  Google Ads
                </button>
              )}
            </div>
          )}
          <div className="flex gap-1 bg-secondary rounded-lg p-1">
            <button onClick={() => setViewMode('cards')}
              className={`p-2 rounded-md transition-colors ${viewMode === 'cards' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <p className="text-muted-foreground text-sm">Carregando...</p>
      ) : displayRows.length === 0 ? (
        <p className="text-muted-foreground text-sm">Nenhum cliente encontrado.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {displayRows.map(row => {
            const key = rowKey(row);
            const isEditing = editingKey === key;
            const daysInfo = calcDaysLeft(row.balance, row.dailySpend);
            const isLow = daysInfo.days >= 0 && daysInfo.days <= 3;

            return (
              <div key={key} className={`rounded-xl border p-5 transition-all ${isLow && !isEditing ? 'border-destructive/50 bg-destructive/5' : 'border-border bg-card'}`}>
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold truncate">{row.clientName}</h3>
                    <div className="mt-1">
                      <PlatformBadge platform={row.platform as Platform} />
                    </div>
                  </div>
                  {!isEditing && (
                    <button onClick={() => startEdit(row)} className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0">
                      <Pencil className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {isEditing ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-1 block">Saldo</label>
                        <input type="number" step="0.01" value={editForm.balance ?? 0}
                          onChange={e => setEditForm(f => ({ ...f, balance: parseFloat(e.target.value) || 0 }))}
                          className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm" />
                      </div>
                      <div>
                        <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-1 block">Diário</label>
                        <input type="number" step="0.01" value={editForm.dailySpend ?? 0}
                          onChange={e => setEditForm(f => ({ ...f, dailySpend: parseFloat(e.target.value) || 0 }))}
                          className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm" />
                      </div>
                    </div>
                    <div>
                      <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-1 block">Pagamento</label>
                      <select value={editForm.paymentMethod ?? ''}
                        onChange={e => setEditForm(f => ({ ...f, paymentMethod: e.target.value }))}
                        className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm">
                        <option value="">—</option>
                        <option value="PIX">PIX</option>
                        <option value="CARTÃO">CARTÃO</option>
                        <option value="BOLETO">BOLETO</option>
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-1 block">Último Pgto</label>
                        <input type="number" step="0.01" value={editForm.lastPaymentAmount ?? 0}
                          onChange={e => setEditForm(f => ({ ...f, lastPaymentAmount: parseFloat(e.target.value) || 0 }))}
                          className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm" />
                      </div>
                      <div>
                        <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-1 block">Data Pgto</label>
                        <DatePicker value={editForm.lastPaymentDate ?? ''} onChange={v => setEditForm(f => ({ ...f, lastPaymentDate: v }))} className="bg-secondary border-border text-sm h-9 w-full" />
                      </div>
                    </div>
                    <div className="flex gap-2 pt-1">
                      <button onClick={saveEdit} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
                        <Save className="w-4 h-4" /> Salvar
                      </button>
                      <button onClick={cancelEdit} className="px-4 py-2 bg-secondary text-muted-foreground rounded-lg text-sm hover:text-foreground transition-colors">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Balance */}
                    <div className="mb-4">
                      <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-0.5">Saldo</p>
                      <p className="text-2xl font-bold font-mono">{formatCurrency(row.balance)}</p>
                    </div>

                    {/* Stats grid */}
                    <div className="grid grid-cols-2 gap-x-4 gap-y-3 mb-4">
                      <div className="flex items-start gap-2">
                        <TrendingDown className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Diário</p>
                          <p className="text-sm font-mono font-medium">{formatCurrency(row.dailySpend)}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <CalendarDays className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${isLow ? 'text-destructive' : 'text-muted-foreground'}`} />
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Verba acaba em</p>
                          <p className={`text-sm font-mono font-bold ${isLow ? 'text-destructive' : ''}`}>{daysInfo.text}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <CreditCard className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Pagamento</p>
                          <p className="text-sm font-medium">{row.paymentMethod || '—'}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Wallet className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Último Pgto</p>
                          <p className="text-sm font-mono">{formatCurrency(row.lastPaymentAmount)}</p>
                        </div>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground border-t border-border pt-3">
                      <Clock className="w-3 h-3" />
                      <span>{formatDateTime(row.updatedAt)}</span>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function WalletBalance() {
  const { type } = useParams<{ type: string }>();
  if (type === 'pessoal') {
    return <PinGate><WalletBalanceContent /></PinGate>;
  }
  return <WalletBalanceContent />;
}
