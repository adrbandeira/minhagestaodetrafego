import { useState } from 'react';
import { useStore } from '@/lib/store';
import { Plus } from 'lucide-react';

export default function ClientNotes({ clientId }: { clientId: string }) {
  const { getClientNotes, addNote, updateNote } = useStore();
  const notes = getClientNotes(clientId);
  const [selectedNote, setSelectedNote] = useState(notes[0] || null);
  const [editContent, setEditContent] = useState(selectedNote?.content || '');
  const today = new Date().toISOString().split('T')[0];

  const handleNew = () => {
    const existing = notes.find(n => n.date === today);
    if (existing) {
      setSelectedNote(existing);
      setEditContent(existing.content);
    } else {
      addNote({ clientId, date: today, content: '' });
      // Will be available after re-render; for now set empty
      setSelectedNote(null);
      setEditContent('');
    }
  };

  const handleSave = () => {
    if (selectedNote) {
      updateNote({ ...selectedNote, content: editContent });
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left: note list */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-syne font-bold text-sm">Anotações</h3>
          <button onClick={handleNew} className="flex items-center gap-1 px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-[12px] font-medium hover:bg-primary/90 transition-colors">
            <Plus className="w-3 h-3" /> Hoje
          </button>
        </div>
        <div className="space-y-2">
          {notes.map(n => (
            <div
              key={n.id}
              onClick={() => { setSelectedNote(n); setEditContent(n.content); }}
              className={`p-3 rounded-lg cursor-pointer transition-colors border ${selectedNote?.id === n.id ? 'bg-primary/5 border-primary/30' : 'bg-card border-border hover:bg-surface2/50'}`}
            >
              <p className="text-[11px] font-mono text-muted-foreground mb-1">{formatDate(n.date)}</p>
              <p className="text-sm text-foreground line-clamp-2">{n.content || 'Sem conteúdo'}</p>
            </div>
          ))}
          {notes.length === 0 && <p className="text-muted-foreground text-sm">Nenhuma anotação ainda.</p>}
        </div>
      </div>

      {/* Right: editor */}
      <div>
        {selectedNote ? (
          <div className="bg-card border border-border rounded-lg p-5">
            <p className="text-[12px] font-mono text-muted-foreground mb-3">{formatDate(selectedNote.date)}</p>
            <textarea
              value={editContent}
              onChange={e => setEditContent(e.target.value)}
              className="w-full bg-surface2 border border-border rounded-md px-3 py-2 text-sm text-foreground min-h-[200px] resize-y focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="Escreva suas anotações aqui..."
            />
            <button onClick={handleSave} className="mt-3 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors">
              Salvar
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
            Selecione ou crie uma anotação
          </div>
        )}
      </div>
    </div>
  );
}

function formatDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
