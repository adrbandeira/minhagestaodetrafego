import { useState } from 'react';
import { useStore } from '@/lib/store';
import { Plus, Trash2 } from 'lucide-react';
import { DatePicker } from '@/components/ui/date-picker';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export default function ClientTasks({ clientId }: { clientId: string }) {
  const { getClientTasks, toggleTask, addTask, deleteTask } = useStore();
  const tasks = getClientTasks(clientId);
  const today = new Date().toISOString().split('T')[0];
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState(today);

  const handleAdd = () => {
    if (title) {
      addTask({ title, clientId, dueDate, done: false });
      setTitle('');
      setShowForm(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-syne font-bold text-sm">Tarefas do Cliente</h3>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-1 px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-[12px] font-medium hover:bg-primary/90 transition-colors">
          <Plus className="w-3 h-3" /> Nova Tarefa
        </button>
      </div>

      {showForm && (
        <div className="bg-card border border-border rounded-lg p-4 mb-4 flex gap-3 items-end">
          <div className="flex-1">
            <label className="text-[12px] text-muted-foreground block mb-1">Tarefa</label>
            <input value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-surface2 border border-border rounded-md px-3 py-2 text-sm text-foreground" />
          </div>
          <div>
            <label className="text-[12px] text-muted-foreground block mb-1">Prazo</label>
            <DatePicker value={dueDate} onChange={setDueDate} className="w-full bg-surface2 border-border" />
          </div>
          <button onClick={handleAdd} className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium">Salvar</button>
        </div>
      )}

      <div className="space-y-2">
        {tasks.map(t => {
          const isDueToday = t.dueDate === today && !t.done;
          return (
            <div key={t.id} className={`flex items-center gap-3 p-3 rounded-lg bg-card border ${isDueToday ? 'border-danger/40' : 'border-border'}`}>
              <input type="checkbox" checked={t.done} onChange={() => toggleTask(t.id)} className="w-4 h-4 rounded accent-primary cursor-pointer" />
              <span className={`text-sm flex-1 ${t.done ? 'line-through text-muted-foreground' : ''}`}>{t.title}</span>
              <span className={`text-[11px] font-mono ${isDueToday ? 'text-danger' : 'text-muted-foreground'}`}>
                {new Date(t.dueDate + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
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
        {tasks.length === 0 && <p className="text-muted-foreground text-sm">Nenhuma tarefa para este cliente.</p>}
      </div>
    </div>
  );
}
