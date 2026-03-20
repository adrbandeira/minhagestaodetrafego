import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, X, CheckCircle2, FileText, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  data: any;
  read: boolean;
  created_at: string;
}

export default function NotificationBell() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const unread = notifications.filter(n => !n.read).length;

  useEffect(() => {
    if (!user) return;
    fetchNotifications();
  }, [user]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function fetchNotifications() {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);
    if (data) setNotifications(data as Notification[]);
  }

  async function markAsRead(id: string) {
    await supabase.from('notifications').update({ read: true }).eq('id', id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }

  async function markAllRead() {
    const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
    if (unreadIds.length === 0) return;
    await supabase.from('notifications').update({ read: true }).in('id', unreadIds);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }

  function formatTime(dateStr: string) {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffH = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffH < 1) return 'Agora';
    if (diffH < 24) return `${diffH}h atrás`;
    const diffD = Math.floor(diffH / 24);
    if (diffD === 1) return 'Ontem';
    return `${diffD}d atrás`;
  }

  function renderData(data: any) {
    if (!data || data.date === undefined) return null;
    return (
      <div className="flex gap-3 mt-2 text-[10px]">
        {data.reviews && (
          <span className={`px-2 py-0.5 rounded-full ${data.reviews.done === data.reviews.total && data.reviews.total > 0 ? 'bg-primary/10 text-primary' : 'bg-secondary text-muted-foreground'}`}>
            Revisões {data.reviews.done}/{data.reviews.total}
          </span>
        )}
        {data.tasks && (
          <span className={`px-2 py-0.5 rounded-full ${data.tasks.done === data.tasks.total && data.tasks.total > 0 ? 'bg-primary/10 text-primary' : 'bg-secondary text-muted-foreground'}`}>
            Tarefas {data.tasks.done}/{data.tasks.total}
          </span>
        )}
        {data.notes > 0 && (
          <span className="px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
            {data.notes} nota(s)
          </span>
        )}
      </div>
    );
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
      >
        <Bell className="w-4.5 h-4.5" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-primary text-primary-foreground text-[9px] font-bold w-4.5 h-4.5 rounded-full flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-[380px] bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <h3 className="text-sm font-syne font-bold">Notificações</h3>
            <div className="flex items-center gap-2">
              {unread > 0 && (
                <button onClick={markAllRead} className="text-[11px] text-primary hover:underline">
                  Marcar todas como lidas
                </button>
              )}
              <button onClick={() => setOpen(false)} className="p-1 text-muted-foreground hover:text-foreground">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <ScrollArea className="max-h-[400px]">
            {notifications.length === 0 ? (
              <div className="py-12 text-center">
                <Bell className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Nenhuma notificação</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {notifications.map(n => (
                  <div
                    key={n.id}
                    className={`px-4 py-3 cursor-pointer transition-colors hover:bg-secondary/50 ${!n.read ? 'bg-primary/5' : ''}`}
                    onClick={() => {
                      markAsRead(n.id);
                      if (n.type === 'daily_report' && n.data?.date) {
                        setOpen(false);
                        navigate(`/relatorios?date=${n.data.date}`);
                      }
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 p-1.5 rounded-lg ${n.type === 'daily_report' ? 'bg-primary/10' : 'bg-secondary'}`}>
                        {n.type === 'daily_report' ? <FileText className="w-3.5 h-3.5 text-primary" /> : <Bell className="w-3.5 h-3.5 text-muted-foreground" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className={`text-xs font-medium truncate ${!n.read ? 'text-foreground' : 'text-muted-foreground'}`}>
                            {n.title}
                          </p>
                          <span className="text-[10px] text-muted-foreground shrink-0 flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" />
                            {formatTime(n.created_at)}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{n.body}</p>
                        {renderData(n.data)}
                      </div>
                      {!n.read && <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
