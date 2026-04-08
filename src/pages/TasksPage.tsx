import { useState, useMemo } from 'react';
import { useStore } from '@/lib/store';
import { Difficulty } from '@/lib/types';
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { DatePicker } from '@/components/ui/date-picker';
import { DifficultyBadge, DifficultySelector } from '@/components/Badges';
import PinGate from '@/components/PinGate';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

type ClientTypeTab = 'agenciado' | 'pessoal';

function TasksContent({ clientType }: { clientType: ClientTypeTab }) {
  const { tasks, toggleTask, addTask, deleteTask, getClientName, clients } = useStore();
  const [showForm, setShowForm] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  const clientIds = useMemo(() => {
    const filtered = clients.filter(c => c.type === clientType);
    return new Set(filtered.map(c => c.id));
  }, [clients, clientType]);

  const filteredClients = useMemo(() => clients.filter(c => c.type === clientType), [clients, clientType]);

  const { pending, completed } = useMemo(() => {
    const relevant = [...tasks]
      .filter(t => {
        if (!t.clientId) return true;
        return clientIds.has(t.clientId);
      })
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
    return {
      pending: relevant.filter(t => !t.done),
      completed: relevant.filter(t => t.done),
    };
  }, [tasks, clientIds]);

  const renderTask = (t: any) => {
    const isDueToday = t.dueDate === today && !t.done;
    const isOverdue = t.dueDate < today && !t.done;
    return (
      <div key={t.id} className={`flex items-center gap-3 p-4 rounded-lg bg-card border transition-colors ${isDueToday || isOverdue ? 'border-danger/40' : 'border-border'}`}>
        <input type="checkbox" checked={t.done} onChange={() => toggleTask(t.id)} className="w-4 h-4 rounded accent-primary cursor-pointer" />
        <span className={`text-sm flex-1 ${t.done ? 'line-through text-muted-foreground' : ''}`}>{t.title}</span>
        <span className="text-[12px] text-muted-foreground">{getClientName(t.clientId)}</span>
        <DifficultyBadge difficulty={t.difficulty} />
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
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-syne font-bold">Tarefas Gerais</h1>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
          <Plus className="w-4 h-4" /> Nova Tarefa
        </button>
      </div>

      {showForm && <NewTaskForm clients={filteredClients} onAdd={(t) => { addTask(t); setShowForm(false); }} onCancel={() => setShowForm(false)} />}

      <div className="space-y-2">
        {pending.map(renderTask)}
        {pending.length === 0 && <p className="text-muted-foreground text-sm">Nenhuma tarefa pendente.</p>}
      </div>

      {completed.length > 0 && (
        <div className="mt-6">
          <button
            onClick={() => setShowCompleted(!showCompleted)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3"
          >
            {showCompleted ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            Concluídas ({completed.length})
          </button>
          {showCompleted && (
            <div className="space-y-2 opacity-70">
              {completed.map(renderTask)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function TasksPage() {
  const { clients } = useStore();
  const [clientType, setClientType] = useState<ClientTypeTab>('agenciado');

  const agenciados = clients.filter(c => c.type === 'agenciado' && c.status === 'ativo');
  const pessoais = clients.filter(c => c.type === 'pessoal' && c.status === 'ativo');

  return (
    <div>
      <div className="flex gap-1 bg-secondary rounded-lg p-1 mb-6 w-fit">
        <button onClick={() => setClientType('agenciado')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${clientType === 'agenciado' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
          Agenciados ({agenciados.length})
        </button>
        <button onClick={() => setClientType('pessoal')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${clientType === 'pessoal' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
          Pessoais ({pessoais.length})
        </button>
      </div>

      {clientType === 'pessoal' ? (
        <PinGate>
          <TasksContent clientType="pessoal" />
        </PinGate>
      ) : (
        <TasksContent clientType="agenciado" />
      )}
    </div>
  );
}

function NewTaskForm({ clients, onAdd, onCancel }: { clients: any[]; onAdd: (t: any) => void; onCancel: () => void }) {
  const [title, setTitle] = useState('');
  const [clientId, setClientId] = useState<string | null>(null);
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [difficulty, setDifficulty] = useState<Difficulty | undefined>(undefined);

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
      <div>
        <label className="text-[12px] text-muted-foreground block mb-1">Dificuldade</label>
        <DifficultySelector value={difficulty} onChange={setDifficulty} />
      </div>
      <div className="flex gap-2">
        <button onClick={() => { if (title) onAdd({ title, clientId, dueDate, done: false, difficulty }); }} className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors">Salvar</button>
        <button onClick={onCancel} className="px-4 py-2 bg-surface2 text-muted-foreground rounded-md text-sm hover:text-foreground transition-colors">Cancelar</button>
      </div>
    </div>
  );
}

function formatDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}
