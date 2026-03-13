import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Zap, Mail, Lock, User, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';

export default function Register() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const { signUp } = useAuth();

  const [validatingAccess, setValidatingAccess] = useState(true);
  const [accessGranted, setAccessGranted] = useState(false);
  const [bootstrapMode, setBootstrapMode] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [hasPessoal, setHasPessoal] = useState(true);
  const [hasAgenciado, setHasAgenciado] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const validateAccess = async () => {
      if (token) {
        const { data } = await supabase
          .from('invite_links')
          .select('id')
          .eq('token', token)
          .eq('active', true)
          .single();

        if (!cancelled) {
          setBootstrapMode(false);
          setAccessGranted(!!data);
          setValidatingAccess(false);
        }
        return;
      }

      const { data } = await (supabase.rpc as any)('can_bootstrap_signup');
      const canBootstrap = Boolean(data);

      if (!cancelled) {
        setBootstrapMode(canBootstrap);
        setAccessGranted(canBootstrap);
        setValidatingAccess(false);
      }
    };

    validateAccess();

    return () => {
      cancelled = true;
    };
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasPessoal && !hasAgenciado) {
      setError('Selecione pelo menos um tipo de cliente.');
      return;
    }
    setError('');
    setLoading(true);

    const { error, needsConfirmation } = await signUp({
      email,
      password,
      name,
      hasPessoal,
      hasAgenciado,
      inviteToken: bootstrapMode ? '' : token,
    });

    if (error) {
      setError(error.message);
    } else if (needsConfirmation) {
      setSuccess(true);
    }
    setLoading(false);
  };

  if (validatingAccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!accessGranted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <XCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h1 className="font-syne font-bold text-lg text-foreground mb-2">
            {token ? 'Link inválido ou expirado' : 'Cadastro fechado'}
          </h1>
          <p className="text-muted-foreground text-sm mb-4">
            {token
              ? 'Este link de convite não é válido. Solicite um novo convite ao administrador.'
              : 'O cadastro direto está fechado. Peça um link de convite para o administrador.'}
          </p>
          <Link to="/login">
            <Button variant="outline">Ir para Login</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <CheckCircle className="w-12 h-12 text-primary mx-auto mb-4" />
          <h1 className="font-syne font-bold text-lg text-foreground mb-2">Conta criada!</h1>
          <p className="text-muted-foreground text-sm mb-4">
            Enviamos um e-mail de verificação para <strong className="text-foreground">{email}</strong>. Clique no link do e-mail para ativar sua conta.
          </p>
          <Link to="/login">
            <Button variant="outline">Ir para Login</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <Zap className="w-5 h-5 text-primary-foreground" />
          </div>
          <div className="font-syne font-extrabold text-[15px] leading-tight">
            <span className="text-foreground">MINHA GESTÃO</span>
            <span className="block text-primary">DE TRÁFEGO</span>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-xl p-6">
          <h1 className="font-syne font-bold text-lg text-foreground mb-1">Criar conta</h1>
          <p className="text-muted-foreground text-sm mb-6">Preencha seus dados para começar</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs text-muted-foreground font-medium mb-1.5 block">Nome</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="Seu nome" className="pl-10 bg-background border-border" required />
              </div>
            </div>

            <div>
              <label className="text-xs text-muted-foreground font-medium mb-1.5 block">E-mail</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" className="pl-10 bg-background border-border" required />
              </div>
            </div>

            <div>
              <label className="text-xs text-muted-foreground font-medium mb-1.5 block">Senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" className="pl-10 bg-background border-border" required minLength={6} />
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <p className="text-xs text-muted-foreground font-medium">Que tipos de clientes você gerencia?</p>
              <div className="flex items-center gap-2">
                <Checkbox id="pessoal" checked={hasPessoal} onCheckedChange={(v) => setHasPessoal(!!v)} />
                <label htmlFor="pessoal" className="text-sm text-foreground cursor-pointer">Clientes Pessoais</label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="agenciado" checked={hasAgenciado} onCheckedChange={(v) => setHasAgenciado(!!v)} />
                <label htmlFor="agenciado" className="text-sm text-foreground cursor-pointer">Clientes Agenciados</label>
              </div>
            </div>

            {error && <p className="text-destructive text-xs">{error}</p>}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Criar conta
            </Button>
          </form>

          <p className="text-center text-muted-foreground text-xs mt-4">
            Já tem conta? <Link to="/login" className="text-primary hover:underline">Fazer login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
