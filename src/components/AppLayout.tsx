import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useStore } from '@/lib/store';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { Zap, LayoutDashboard, ClipboardList, CheckSquare, User, ChevronDown, ChevronRight, Users, Plus, ArrowRight, Settings, LogOut, Sun, Moon, FileText, Wallet } from 'lucide-react';

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation();
  const { getTodayReviews, getOpenTasks } = useStore();
  const { profile, isAdmin, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [pessoalOpen, setPessoalOpen] = useState(false);
  const [agenciadoOpen, setAgenciadoOpen] = useState(false);

  const todayReviews = getTodayReviews();
  const pendingReviews = todayReviews.filter(r => !r.done).length;
  const openTasks = getOpenTasks().length;

  const isActive = (path: string) => location.pathname === path;

  const showPessoal = profile?.hasPessoal ?? true;
  const showAgenciado = profile?.hasAgenciado ?? true;

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <aside className="w-60 min-w-[240px] bg-surface border-r border-border flex flex-col overflow-y-auto">
        <div className="px-5 py-5 border-b border-border">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Zap className="w-4 h-4 text-primary-foreground" />
            </div>
            <div className="font-syne font-extrabold text-[13px] leading-tight">
              <span className="text-foreground">MINHA GESTÃO</span>
              <span className="block text-primary">DE TRÁFEGO</span>
            </div>
          </Link>
        </div>

        <nav className="flex-1 py-3">
          <div className="mb-1">
            <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-[1.5px] px-5 py-2">Menu</p>
            <NavItem to="/" icon={<LayoutDashboard className="w-4 h-4" />} label="Dashboard" active={isActive('/')} />
            <NavItem to="/revisoes" icon={<ClipboardList className="w-4 h-4" />} label="Revisões do Dia" active={isActive('/revisoes')} badge={pendingReviews > 0 ? pendingReviews : undefined} />
            <NavItem to="/tarefas" icon={<CheckSquare className="w-4 h-4" />} label="Tarefas Gerais" active={isActive('/tarefas')} badge={openTasks > 0 ? openTasks : undefined} />
            <NavItem to="/relatorio" icon={<FileText className="w-4 h-4" />} label="Relatório Mensal" active={isActive('/relatorio')} />
          </div>

          <div className="mb-1">
            <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-[1.5px] px-5 py-2 mt-2">Clientes</p>

            {showPessoal && (
              <>
                <button onClick={() => setPessoalOpen(!pessoalOpen)} className="w-full flex items-center gap-2.5 px-5 py-2 text-[13.5px] text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
                  {pessoalOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  <Users className="w-4 h-4" />
                  <span>Clientes Pessoais</span>
                </button>
                {pessoalOpen && (
                  <div className="ml-10">
                    <Link to="/clientes/pessoal" className="flex items-center gap-2 px-3 py-1.5 text-[12.5px] text-muted-foreground hover:text-primary transition-colors">
                      <ArrowRight className="w-3 h-3" /> Ver todos
                    </Link>
                    <Link to="/clientes/novo?tipo=pessoal" className="flex items-center gap-2 px-3 py-1.5 text-[12.5px] text-muted-foreground hover:text-primary transition-colors">
                      <Plus className="w-3 h-3" /> Novo cliente
                    </Link>
                    <Link to="/saldo/pessoal" className="flex items-center gap-2 px-3 py-1.5 text-[12.5px] text-muted-foreground hover:text-primary transition-colors">
                      <Wallet className="w-3 h-3" /> Saldo da carteira
                    </Link>
                  </div>
                )}
              </>
            )}

            {showAgenciado && (
              <>
                <button onClick={() => setAgenciadoOpen(!agenciadoOpen)} className="w-full flex items-center gap-2.5 px-5 py-2 text-[13.5px] text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
                  {agenciadoOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  <Users className="w-4 h-4" />
                  <span>Clientes Agenciados</span>
                </button>
                {agenciadoOpen && (
                  <div className="ml-10">
                    <Link to="/clientes/agenciado" className="flex items-center gap-2 px-3 py-1.5 text-[12.5px] text-muted-foreground hover:text-primary transition-colors">
                      <ArrowRight className="w-3 h-3" /> Ver todos
                    </Link>
                    <Link to="/clientes/novo?tipo=agenciado" className="flex items-center gap-2 px-3 py-1.5 text-[12.5px] text-muted-foreground hover:text-primary transition-colors">
                      <Plus className="w-3 h-3" /> Novo cliente
                    </Link>
                  </div>
                )}
              </>
            )}
          </div>

          {isAdmin && (
            <div className="mb-1">
              <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-[1.5px] px-5 py-2 mt-2">Admin</p>
              <NavItem to="/admin" icon={<Settings className="w-4 h-4" />} label="Configurações" active={isActive('/admin')} />
            </div>
          )}
        </nav>

        <div className="px-5 py-4 border-t border-border">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <User className="w-4 h-4 text-primary" />
            </div>
            <div className="text-[13px] flex-1 min-w-0">
              <p className="text-foreground font-medium truncate">{profile?.name || 'Gestor'}</p>
              <p className="text-muted-foreground text-[11px]">{isAdmin ? 'Admin' : 'Gestor'}</p>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <button
              onClick={signOut}
              className="flex items-center gap-2 px-2 py-1.5 text-[12px] text-muted-foreground hover:text-destructive transition-colors rounded"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sair
            </button>
            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              title={theme === 'dark' ? 'Tema claro' : 'Tema escuro'}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-8">
        {children}
      </main>
    </div>
  );
}

function NavItem({ to, icon, label, active, badge }: { to: string; icon: React.ReactNode; label: string; active: boolean; badge?: number }) {
  return (
    <Link
      to={to}
      className={`flex items-center gap-2.5 px-5 py-2 text-[13.5px] border-l-2 transition-all ${
        active
          ? 'text-primary bg-primary/5 border-l-primary font-medium'
          : 'text-muted-foreground border-l-transparent hover:text-foreground hover:bg-secondary'
      }`}
    >
      {icon}
      <span>{label}</span>
      {badge !== undefined && (
        <span className="ml-auto bg-primary text-primary-foreground font-mono text-[10px] font-medium px-1.5 py-0.5 rounded-full">
          {badge}
        </span>
      )}
    </Link>
  );
}
