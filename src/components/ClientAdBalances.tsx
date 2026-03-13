import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Wallet, TrendingDown, Clock, Save, Pencil } from 'lucide-react';

interface AdBalance {
  id: string;
  client_id: string;
  platform: string;
  balance: number;
  daily_spend: number;
  updated_at: string;
  user_id: string | null;
}

export default function ClientAdBalances({ clientId, platforms }: { clientId: string; platforms: string[] }) {
  const [balances, setBalances] = useState<AdBalance[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [editBalance, setEditBalance] = useState('');
  const [editDailySpend, setEditDailySpend] = useState('');

  const fetchBalances = useCallback(async () => {
    const { data } = await supabase.from('ad_balances').select('*').eq('client_id', clientId);
    if (data) setBalances(data as AdBalance[]);
  }, [clientId]);

  useEffect(() => { fetchBalances(); }, [fetchBalances]);

  const getBalance = (platform: string) => balances.find(b => b.platform === platform);

  const handleSave = async (platform: string) => {
    const balance = parseFloat(editBalance) || 0;
    const dailySpend = parseFloat(editDailySpend) || 0;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const existing = getBalance(platform);
    if (existing) {
      await supabase.from('ad_balances').update({
        balance, daily_spend: dailySpend, updated_at: new Date().toISOString(),
      }).eq('id', existing.id);
    } else {
      await supabase.from('ad_balances').insert({
        client_id: clientId, platform, balance, daily_spend: dailySpend, user_id: user.id,
      });
    }
    setEditing(null);
    fetchBalances();
  };

  const startEdit = (platform: string) => {
    const b = getBalance(platform);
    setEditBalance(b?.balance?.toString() || '0');
    setEditDailySpend(b?.daily_spend?.toString() || '0');
    setEditing(platform);
  };

  const calcDaysLeft = (balance: number, dailySpend: number) => {
    if (dailySpend <= 0) return null;
    return Math.floor(balance / dailySpend);
  };

  const formatDate = (d: string) => {
    const date = new Date(d);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
      ' às ' + date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const relevantPlatforms = platforms.length > 0 ? platforms : ['Meta Ads', 'Google Ads'];

  return (
    <div className="space-y-4">
      <h3 className="font-syne font-bold text-sm flex items-center gap-2">
        <Wallet className="w-4 h-4 text-primary" /> Saldo das Contas de Anúncios
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {relevantPlatforms.map(platform => {
          const b = getBalance(platform);
          const daysLeft = b ? calcDaysLeft(b.balance, b.daily_spend) : null;
          const isMeta = platform === 'Meta Ads';
          const color = isMeta ? 'meta' : 'google';

          return (
            <div key={platform} className={`bg-card border rounded-lg p-5 border-${color}/20`}>
              <div className="flex items-center justify-between mb-4">
                <span className={`text-sm font-medium text-${color}`}>{platform}</span>
                {editing !== platform && (
                  <button onClick={() => startEdit(platform)} className="text-muted-foreground hover:text-foreground transition-colors">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {editing === platform ? (
                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] text-muted-foreground block mb-1">Saldo atual (R$)</label>
                    <input type="number" step="0.01" value={editBalance} onChange={e => setEditBalance(e.target.value)}
                      className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
                  </div>
                  <div>
                    <label className="text-[11px] text-muted-foreground block mb-1">Investimento diário (R$)</label>
                    <input type="number" step="0.01" value={editDailySpend} onChange={e => setEditDailySpend(e.target.value)}
                      className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleSave(platform)} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-[12px] font-medium hover:bg-primary/90 transition-colors">
                      <Save className="w-3 h-3" /> Salvar
                    </button>
                    <button onClick={() => setEditing(null)} className="px-3 py-1.5 bg-secondary text-muted-foreground rounded-md text-[12px] hover:text-foreground transition-colors">
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <p className="text-[11px] text-muted-foreground">Saldo</p>
                    <p className="text-xl font-syne font-bold">R$ {(b?.balance || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  </div>
                  <div className="flex gap-6">
                    <div>
                      <p className="text-[11px] text-muted-foreground">Diário</p>
                      <p className="text-sm font-medium">R$ {(b?.daily_spend || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-muted-foreground flex items-center gap-1"><TrendingDown className="w-3 h-3" /> Verba acaba em</p>
                      <p className={`text-sm font-bold ${daysLeft !== null && daysLeft <= 3 ? 'text-destructive' : daysLeft !== null && daysLeft <= 7 ? 'text-warn' : ''}`}>
                        {daysLeft !== null ? `${daysLeft} dias` : '—'}
                      </p>
                    </div>
                  </div>
                  {b && (
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1 pt-1">
                      <Clock className="w-3 h-3" /> Atualizado em {formatDate(b.updated_at)}
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
