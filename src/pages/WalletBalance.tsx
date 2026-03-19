import { useParams } from 'react-router-dom';
import { useStore } from '@/lib/store';
import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Wallet, Save, X, Pencil } from 'lucide-react';
import PinGate from '@/components/PinGate';

interface WalletRow {
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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<WalletRow>>({});

  const filtered = clients.filter(c => c.type === type);
  const label = type === 'pessoal' ? 'Pessoais' : 'Agenciados';

  const fetchBalances = useCallback(async () => {
    setLoading(true);
    const clientIds = filtered.map(c => c.id);
    if (clientIds.length === 0) { setLoading(false); return; }

    const { data } = await supabase
      .from('ad_balances')
      .select('*')
      .in('client_id', clientIds);

    const balanceMap = new Map<string, any>();
    (data || []).forEach((row: any) => {
      balanceMap.set(row.client_id, row);
    });

    const mapped: WalletRow[] = filtered.map(c => {
      const b = balanceMap.get(c.id);
      return {
        clientId: c.id,
        clientName: c.name,
        balance: b?.balance ?? 0,
        paymentMethod: b?.payment_method ?? '',
        dailySpend: b?.daily_spend ?? 0,
        lastPaymentAmount: b?.last_payment_amount ?? 0,
        lastPaymentDate: b?.last_payment_date ?? '',
        platform: b?.platform ?? c.platforms?.[0] ?? '',
        updatedAt: b?.updated_at ?? '',
      };
    });
    setRows(mapped);
    setLoading(false);
  }, [filtered]);

  useEffect(() => { fetchBalances(); }, [clients, type]);

  const startEdit = (row: WalletRow) => {
    setEditingId(row.clientId);
    setEditForm({ ...row });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const saveEdit = async () => {
    if (!editingId) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: existing } = await supabase
      .from('ad_balances')
      .select('id')
      .eq('client_id', editingId)
      .maybeSingle();

    const payload = {
      client_id: editingId,
      balance: editForm.balance ?? 0,
      daily_spend: editForm.dailySpend ?? 0,
      payment_method: editForm.paymentMethod ?? '',
      last_payment_amount: editForm.lastPaymentAmount ?? 0,
      last_payment_date: editForm.lastPaymentDate ?? '',
      platform: editForm.platform ?? '',
      user_id: user.id,
    };

    let error;
    if (existing) {
      ({ error } = await supabase.from('ad_balances').update(payload).eq('id', existing.id));
    } else {
      ({ error } = await supabase.from('ad_balances').insert(payload));
    }

    if (!error) {
      toast({ title: 'Salvo', description: 'Saldo atualizado com sucesso.' });
      setEditingId(null);
      fetchBalances();
    } else {
      toast({ title: 'Erro', description: 'Não foi possível salvar.', variant: 'destructive' });
    }
  };

  const formatCurrency = (v: number) =>
    v ? v.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '-';

  const calcDaysLeft = (balance: number, daily: number) => {
    if (!daily || daily <= 0 || !balance) return '—';
    const days = Math.floor(balance / daily);
    return `${days} dia${days !== 1 ? 's' : ''}`;
  };

  const formatDateTime = (iso: string) => {
    if (!iso) return '—';
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } catch { return '—'; }
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
          <Wallet className="w-5 h-5 text-primary" />
        </div>
        <h1 className="text-2xl font-syne font-bold">Saldo da Carteira — {label}</h1>
      </div>

      {loading ? (
        <p className="text-muted-foreground text-sm">Carregando...</p>
      ) : filtered.length === 0 ? (
        <p className="text-muted-foreground text-sm">Nenhum cliente encontrado.</p>
      ) : (
        <div className="border border-border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-syne font-bold text-xs uppercase tracking-wider">Cliente</TableHead>
                <TableHead className="font-syne font-bold text-xs uppercase tracking-wider text-right">Saldo Atual</TableHead>
                <TableHead className="font-syne font-bold text-xs uppercase tracking-wider">Forma de Pagamento</TableHead>
                <TableHead className="font-syne font-bold text-xs uppercase tracking-wider text-right">Valor Diário</TableHead>
                <TableHead className="font-syne font-bold text-xs uppercase tracking-wider text-right">Valor Último Pgto</TableHead>
                <TableHead className="font-syne font-bold text-xs uppercase tracking-wider">Data Último Pgto</TableHead>
                <TableHead className="font-syne font-bold text-xs uppercase tracking-wider text-right">Dias Restantes</TableHead>
                <TableHead className="font-syne font-bold text-xs uppercase tracking-wider">Última Atualização</TableHead>
                <TableHead className="w-20"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(row => {
                const isEditing = editingId === row.clientId;
                return (
                  <TableRow key={row.clientId} className="hover:bg-muted/30">
                    <TableCell className="font-medium text-sm">{row.clientName.toUpperCase()}</TableCell>

                    {isEditing ? (
                      <>
                        <TableCell className="text-right">
                          <input type="number" step="0.01" value={editForm.balance ?? 0}
                            onChange={e => setEditForm(f => ({ ...f, balance: parseFloat(e.target.value) || 0 }))}
                            className="w-28 bg-secondary border border-border rounded px-2 py-1 text-sm text-right" />
                        </TableCell>
                        <TableCell>
                          <select value={editForm.paymentMethod ?? ''}
                            onChange={e => setEditForm(f => ({ ...f, paymentMethod: e.target.value }))}
                            className="bg-secondary border border-border rounded px-2 py-1 text-sm">
                            <option value="">—</option>
                            <option value="PIX">PIX</option>
                            <option value="CARTÃO">CARTÃO</option>
                            <option value="BOLETO">BOLETO</option>
                          </select>
                        </TableCell>
                        <TableCell className="text-right">
                          <input type="number" step="0.01" value={editForm.dailySpend ?? 0}
                            onChange={e => setEditForm(f => ({ ...f, dailySpend: parseFloat(e.target.value) || 0 }))}
                            className="w-24 bg-secondary border border-border rounded px-2 py-1 text-sm text-right" />
                        </TableCell>
                        <TableCell className="text-right">
                          <input type="number" step="0.01" value={editForm.lastPaymentAmount ?? 0}
                            onChange={e => setEditForm(f => ({ ...f, lastPaymentAmount: parseFloat(e.target.value) || 0 }))}
                            className="w-28 bg-secondary border border-border rounded px-2 py-1 text-sm text-right" />
                        </TableCell>
                        <TableCell>
                          <input type="date" value={editForm.lastPaymentDate ?? ''}
                            onChange={e => setEditForm(f => ({ ...f, lastPaymentDate: e.target.value }))}
                            className="bg-secondary border border-border rounded px-2 py-1 text-sm" />
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm text-muted-foreground">{calcDaysLeft(editForm.balance ?? 0, editForm.dailySpend ?? 0)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{formatDateTime(row.updatedAt)}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <button onClick={saveEdit} className="p-1.5 rounded hover:bg-primary/10 text-primary"><Save className="w-4 h-4" /></button>
                            <button onClick={cancelEdit} className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground"><X className="w-4 h-4" /></button>
                          </div>
                        </TableCell>
                      </>
                    ) : (
                      <>
                        <TableCell className="text-right font-mono text-sm">$ {formatCurrency(row.balance)}</TableCell>
                        <TableCell className="text-sm">{row.paymentMethod || '—'}</TableCell>
                        <TableCell className="text-right font-mono text-sm">$ {formatCurrency(row.dailySpend)}</TableCell>
                        <TableCell className="text-right font-mono text-sm">$ {formatCurrency(row.lastPaymentAmount)}</TableCell>
                        <TableCell className="text-sm">{row.lastPaymentDate || '—'}</TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          <span className={row.dailySpend > 0 && row.balance > 0 && (row.balance / row.dailySpend) <= 3 ? 'text-destructive font-bold' : ''}>
                            {calcDaysLeft(row.balance, row.dailySpend)}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{formatDateTime(row.updatedAt)}</TableCell>
                        <TableCell>
                          <button onClick={() => startEdit(row)} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground">
                            <Pencil className="w-4 h-4" />
                          </button>
                        </TableCell>
                      </>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
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
