import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Copy, Plus, Loader2, Users, Link2, Shield, Check, Pencil, X, Save } from 'lucide-react';
import { toast } from 'sonner';

interface UserProfile {
  user_id: string;
  name: string;
  email: string;
  has_pessoal: boolean;
  has_agenciado: boolean;
  created_at: string;
  isAdmin: boolean;
}

interface InviteLink {
  id: string;
  token: string;
  created_at: string;
  expires_at: string;
  active: boolean;
  used_by: string | null;
  used_at: string | null;
}

export default function AdminPanel() {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [invites, setInvites] = useState<InviteLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editPessoal, setEditPessoal] = useState(false);
  const [editAgenciado, setEditAgenciado] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    // Load all profiles
    const { data: profiles } = await supabase.from('profiles').select('*');
    // Load all roles
    const { data: roles } = await supabase.from('user_roles').select('*');
    // Load invite links
    const { data: links } = await supabase.from('invite_links').select('*').order('created_at', { ascending: false });

    const adminUserIds = new Set((roles || []).filter((r: any) => r.role === 'admin').map((r: any) => r.user_id));

    setUsers((profiles || []).map((p: any) => ({
      user_id: p.user_id,
      name: p.name,
      email: p.email,
      has_pessoal: p.has_pessoal,
      has_agenciado: p.has_agenciado,
      created_at: p.created_at,
      isAdmin: adminUserIds.has(p.user_id),
    })));

    setInvites((links || []).map((l: any) => ({
      id: l.id,
      token: l.token,
      created_at: l.created_at,
      expires_at: l.expires_at,
      active: l.active,
      used_by: l.used_by,
      used_at: l.used_at,
    })));

    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const generateInvite = async () => {
    setGenerating(true);
    const { error } = await supabase.from('invite_links').insert({ created_by: user?.id });
    if (error) {
      toast.error('Erro ao gerar convite');
    } else {
      toast.success('Link de convite gerado!');
      await loadData();
    }
    setGenerating(false);
  };

  const copyLink = (token: string, id: string) => {
    const url = `${window.location.origin}/register?token=${token}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    toast.success('Link copiado!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleAdmin = async (userId: string, currentlyAdmin: boolean) => {
    if (userId === user?.id) {
      toast.error('Você não pode alterar seu próprio cargo.');
      return;
    }
    if (currentlyAdmin) {
      await supabase.from('user_roles').delete().eq('user_id', userId).eq('role', 'admin');
    } else {
      await supabase.from('user_roles').insert({ user_id: userId, role: 'admin' });
    }
    await loadData();
    toast.success('Permissão atualizada!');
  };

  const startEditing = (u: UserProfile) => {
    setEditingUserId(u.user_id);
    setEditPessoal(u.has_pessoal);
    setEditAgenciado(u.has_agenciado);
  };

  const cancelEditing = () => {
    setEditingUserId(null);
  };

  const savePermissions = async (userId: string) => {
    if (!editPessoal && !editAgenciado) {
      toast.error('O usuário precisa ter pelo menos um tipo de cliente.');
      return;
    }
    const { error } = await supabase
      .from('profiles')
      .update({ has_pessoal: editPessoal, has_agenciado: editAgenciado })
      .eq('user_id', userId);
    if (error) {
      toast.error('Erro ao salvar permissões.');
    } else {
      toast.success('Permissões atualizadas!');
      setEditingUserId(null);
      await loadData();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-syne font-bold text-xl text-foreground">Painel de Administração</h1>
        <p className="text-muted-foreground text-sm mt-1">Gerencie usuários, permissões e convites</p>
      </div>

      {/* Invite Links */}
      <section className="bg-surface border border-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Link2 className="w-4 h-4 text-primary" />
            <h2 className="font-syne font-bold text-sm text-foreground">Links de Convite</h2>
          </div>
          <Button size="sm" onClick={generateInvite} disabled={generating}>
            {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Plus className="w-3.5 h-3.5 mr-1.5" />}
            Gerar Convite
          </Button>
        </div>

        {invites.length === 0 ? (
          <p className="text-muted-foreground text-sm">Nenhum convite gerado ainda.</p>
        ) : (
          <div className="space-y-2">
            {invites.map(inv => {
              const isExpired = new Date(inv.expires_at) < new Date();
              const status = inv.used_by ? 'usado' : isExpired ? 'expirado' : inv.active ? 'ativo' : 'inativo';
              return (
                <div key={inv.id} className="flex items-center justify-between bg-background border border-border rounded-lg px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <code className="text-xs text-muted-foreground font-mono truncate block">
                      {window.location.origin}/register?token={inv.token.slice(0, 12)}...
                    </code>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={status === 'ativo' ? 'default' : 'secondary'} className="text-[10px]">
                        {status}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">
                        Expira: {new Date(inv.expires_at).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>
                  {inv.active && !inv.used_by && !isExpired && (
                    <Button variant="ghost" size="sm" onClick={() => copyLink(inv.token, inv.id)}>
                      {copiedId === inv.id ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Users */}
      <section className="bg-surface border border-border rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-4 h-4 text-primary" />
          <h2 className="font-syne font-bold text-sm text-foreground">Usuários ({users.length})</h2>
        </div>

        {users.length === 0 ? (
          <p className="text-muted-foreground text-sm">Nenhum usuário cadastrado.</p>
        ) : (
          <div className="space-y-2">
            {users.map(u => (
              <div key={u.user_id} className="bg-background border border-border rounded-lg px-4 py-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">{u.name || 'Sem nome'}</p>
                    <p className="text-xs text-muted-foreground">{u.email}</p>
                    {editingUserId !== u.user_id && (
                      <div className="flex gap-1.5 mt-1">
                        {u.has_pessoal && <Badge variant="secondary" className="text-[10px]">Pessoal</Badge>}
                        {u.has_agenciado && <Badge variant="secondary" className="text-[10px]">Agenciado</Badge>}
                        {u.isAdmin && <Badge className="text-[10px] bg-primary/20 text-primary border-0">Admin</Badge>}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {editingUserId === u.user_id ? (
                      <>
                        <Button variant="ghost" size="sm" onClick={() => savePermissions(u.user_id)} title="Salvar">
                          <Save className="w-4 h-4 text-primary" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={cancelEditing} title="Cancelar">
                          <X className="w-4 h-4 text-muted-foreground" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button variant="ghost" size="sm" onClick={() => startEditing(u)} title="Editar permissões">
                          <Pencil className="w-4 h-4 text-muted-foreground" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleAdmin(u.user_id, u.isAdmin)}
                          title={u.isAdmin ? 'Remover admin' : 'Tornar admin'}
                        >
                          <Shield className={`w-4 h-4 ${u.isAdmin ? 'text-primary' : 'text-muted-foreground'}`} />
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {editingUserId === u.user_id && (
                  <div className="mt-3 pt-3 border-t border-border space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Clientes Pessoais</span>
                      <Switch checked={editPessoal} onCheckedChange={setEditPessoal} />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Clientes Agenciados</span>
                      <Switch checked={editAgenciado} onCheckedChange={setEditAgenciado} />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
