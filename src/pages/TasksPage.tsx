import { useState } from 'react';
import { useStore } from '@/lib/store';
import { Plus, Trash2 } from 'lucide-react';
import { DatePicker } from '@/components/ui/date-picker';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export default function TasksPage() {
  const { tasks, toggleTask, addTask, deleteTask, getClientName, clients } = useStore();
  const [showForm, setShowForm] = useState(false);

  const today = new Date().toISOString().split('T')[0];
  const sorted = [...tasks].sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    return a.dueDate.localeCompare(b.dueDate);
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-syne font-bold">Tarefas Gerais</h1>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
          <Plus className="w-4 h-4" /> Nova Tarefa
        </button>
      </div>

      {showForm && <NewTaskForm clients={clients} onAdd={(t) => { addTask(t); setShowForm(false); }} onCancel={() => setShowForm(false)} />}

      <div className="space-y-2">
        {sorted.map(t => {
          const isDueToday = t.dueDate === today && !t.done;
          const isOverdue = t.dueDate < today && !t.done;
          return (
            <div key={t.id} className={`flex items-center gap-3 p-4 rounded-lg bg-card border transition-colors ${isDueToday || isOverdue ? 'border-danger/40' : 'border-border'}`}>
              <input type="checkbox" checked={t.done} onChange={() => toggleTask(t.id)} className="w-4 h-4 rounded accent-primary cursor-pointer" />
              <span className={`text-sm flex-1 ${t.done ? 'line-through text-muted-foreground' : ''}`}>{t.title}</span>
              <span className="text-[12px] text-muted-foreground">{getClientName(t.clientId)}</span>
              <span className={`text-[11px] font-mono ${isDueToday ? 'text-danger font-medium' : isOverdue ? 'text-danger' : 'text-muted-foreground'}`}>
                {formatDate(t.dueDate)}
              </span>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button className="p-1 text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Excluir tarefa</AlertDialogTitle>
                    <AlertDialogDescription>Tem certeza que deseja excluir esta tarefa?</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={() => deleteTask(t.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          );
        })}
        {tasks.length === 0 && <p className="text-muted-foreground text-sm">Nenhuma tarefa cadastrada.</p>}
      </div>
    </div>
  );
}

function NewTaskForm({ clients, onAdd, onCancel }: { clients: any[]; onAdd: (t: any) => void; onCancel: () => void }) {
  const [title, setTitle] = useState('');
  const [clientId, setClientId] = useState<string | null>(null);
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);

  return (
    <div className="bg-card border border-border rounded-lg p-5 mb-4 space-y-4">
      <div>
        <label className="text-[12px] text-muted-foreground block mb-1">Título</label>
        <input value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-surface2 border border-border rounded-md px-3 py-2 text-sm text-foreground" placeholder="Descrição da tarefa..." />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-[12px] text-muted-foreground block mb-1">Cliente (opcional)</label>
          <select value={clientId || ''} onChange={e => setClientId(e.target.value || null)} className="w-full bg-surface2 border border-border rounded-md px-3 py-2 text-sm text-foreground">
            <option value="">Geral</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[12px] text-muted-foreground block mb-1">Vencimento</label>
          <DatePicker value={dueDate} onChange={setDueDate} className="w-full bg-surface2 border-border" />
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={() => { if (title) onAdd({ title, clientId, dueDate, done: false }); }} className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors">Salvar</button>
        <button onClick={onCancel} className="px-4 py-2 bg-surface2 text-muted-foreground rounded-md text-sm hover:text-foreground transition-colors">Cancelar</button>
      </div>
    </div>
  );
}

function formatDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}
