import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Client, Review, Task, Note, ReviewHistory } from '@/lib/types';

const today = new Date().toISOString().split('T')[0];
const daysAgo = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
};

const initialClients: Client[] = [
  { id: '1', name: 'Loja Bella', type: 'pessoal', status: 'ativo', segment: 'Moda Feminina', platforms: ['Meta Ads', 'Google Ads'], budget: 3000, contact: '(11) 99999-1234', startDate: '2024-08-01', lastReviewDate: today },
  { id: '2', name: 'Dr. Marcos Silva', type: 'pessoal', status: 'ativo', segment: 'Odontologia', platforms: ['Meta Ads'], budget: 2000, contact: '(11) 98888-5678', startDate: '2024-09-15', lastReviewDate: daysAgo(1) },
  { id: '3', name: 'AutoPeças Central', type: 'agenciado', status: 'alerta', segment: 'Automotivo', platforms: ['Google Ads'], budget: 5000, contact: '(21) 97777-4321', startDate: '2024-06-01', lastReviewDate: daysAgo(5) },
  { id: '4', name: 'Pizzaria Napoli', type: 'agenciado', status: 'ativo', segment: 'Alimentação', platforms: ['Meta Ads', 'Google Ads'], budget: 1500, contact: '(31) 96666-8765', startDate: '2024-10-01', lastReviewDate: daysAgo(2) },
  { id: '5', name: 'Studio Fit', type: 'pessoal', status: 'pausado', segment: 'Fitness', platforms: ['Meta Ads'], budget: 1000, contact: '(41) 95555-1111', startDate: '2024-11-01', lastReviewDate: daysAgo(7) },
];

const initialReviews: Review[] = [
  { id: 'r1', clientId: '1', date: today, time: '09:00', platforms: ['Meta Ads', 'Google Ads'], priority: 'alta', done: false },
  { id: 'r2', clientId: '2', date: today, time: '10:30', platforms: ['Meta Ads'], priority: 'media', done: false },
  { id: 'r3', clientId: '3', date: today, time: '11:00', platforms: ['Google Ads'], priority: 'alta', done: true },
  { id: 'r4', clientId: '4', date: today, time: '14:00', platforms: ['Meta Ads', 'Google Ads'], priority: 'baixa', done: false },
  { id: 'r5', clientId: '1', date: today, time: '16:00', platforms: ['Google Ads'], priority: 'media', done: false },
];

const initialTasks: Task[] = [
  { id: 't1', clientId: '1', title: 'Criar novas campanhas de remarketing', dueDate: today, done: false },
  { id: 't2', clientId: '2', title: 'Atualizar criativos do Instagram', dueDate: daysAgo(-2), done: false },
  { id: 't3', clientId: '3', title: 'Revisar palavras-chave negativas', dueDate: today, done: false },
  { id: 't4', clientId: null, title: 'Reunião com equipe de design', dueDate: daysAgo(-1), done: false },
  { id: 't5', clientId: '4', title: 'Configurar conversões no GA4', dueDate: daysAgo(-3), done: true },
];

const initialNotes: Note[] = [
  { id: 'n1', clientId: '1', date: today, content: 'CPA de remarketing caiu 15% após ajuste de público. Continuar monitorando.' },
  { id: 'n2', clientId: '1', date: daysAgo(1), content: 'Reunião com cliente para alinhar novos criativos. Aprovados 3 novos banners.' },
  { id: 'n3', clientId: '2', date: daysAgo(2), content: 'Pausei campanhas de stories por baixo CTR. Testar carrossel na próxima semana.' },
];

const initialHistory: ReviewHistory[] = [
  { id: 'h1', clientId: '1', date: today, summary: 'Ajustei lances de CPA e pausei 2 anúncios de baixo desempenho', platforms: ['Meta Ads'], tags: ['CPA', 'Otimização'] },
  { id: 'h2', clientId: '1', date: daysAgo(1), summary: 'Criei nova campanha de conversão com público lookalike', platforms: ['Meta Ads', 'Google Ads'], tags: ['Campanha nova', 'Lookalike'] },
  { id: 'h3', clientId: '3', date: daysAgo(5), summary: 'Revisão de palavras-chave. Adicionei 15 negativas.', platforms: ['Google Ads'], tags: ['Palavras-chave'] },
];

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch { return fallback; }
}

interface StoreContextType {
  clients: Client[];
  reviews: Review[];
  tasks: Task[];
  notes: Note[];
  history: ReviewHistory[];
  addClient: (c: Omit<Client, 'id' | 'status' | 'lastReviewDate'>) => void;
  updateClient: (c: Client) => void;
  toggleReview: (id: string) => void;
  addReview: (r: Omit<Review, 'id'>) => void;
  toggleTask: (id: string) => void;
  addTask: (t: Omit<Task, 'id'>) => void;
  addNote: (n: Omit<Note, 'id'>) => void;
  updateNote: (n: Note) => void;
  getClientById: (id: string) => Client | undefined;
  getClientName: (id: string | null) => string;
  getTodayReviews: () => Review[];
  getOpenTasks: () => Task[];
  getClientNotes: (clientId: string) => Note[];
  getClientHistory: (clientId: string) => ReviewHistory[];
  getClientTasks: (clientId: string) => Task[];
  getClientsWithoutRecentReview: () => Client[];
}

const StoreContext = createContext<StoreContextType | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [clients, setClients] = useState<Client[]>(() => loadFromStorage('mgt_clients', initialClients));
  const [reviews, setReviews] = useState<Review[]>(() => loadFromStorage('mgt_reviews', initialReviews));
  const [tasks, setTasks] = useState<Task[]>(() => loadFromStorage('mgt_tasks', initialTasks));
  const [notes, setNotes] = useState<Note[]>(() => loadFromStorage('mgt_notes', initialNotes));
  const [history] = useState<ReviewHistory[]>(() => loadFromStorage('mgt_history', initialHistory));

  useEffect(() => { localStorage.setItem('mgt_clients', JSON.stringify(clients)); }, [clients]);
  useEffect(() => { localStorage.setItem('mgt_reviews', JSON.stringify(reviews)); }, [reviews]);
  useEffect(() => { localStorage.setItem('mgt_tasks', JSON.stringify(tasks)); }, [tasks]);
  useEffect(() => { localStorage.setItem('mgt_notes', JSON.stringify(notes)); }, [notes]);

  const addClient = useCallback((c: Omit<Client, 'id' | 'status' | 'lastReviewDate'>) => {
    setClients(prev => [...prev, { ...c, id: crypto.randomUUID(), status: 'ativo', lastReviewDate: null }]);
  }, []);

  const updateClient = useCallback((c: Client) => {
    setClients(prev => prev.map(x => x.id === c.id ? c : x));
  }, []);

  const toggleReview = useCallback((id: string) => {
    setReviews(prev => prev.map(r => r.id === id ? { ...r, done: !r.done } : r));
  }, []);

  const addReview = useCallback((r: Omit<Review, 'id'>) => {
    setReviews(prev => [...prev, { ...r, id: crypto.randomUUID() }]);
  }, []);

  const toggleTask = useCallback((id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
  }, []);

  const addTask = useCallback((t: Omit<Task, 'id'>) => {
    setTasks(prev => [...prev, { ...t, id: crypto.randomUUID() }]);
  }, []);

  const addNote = useCallback((n: Omit<Note, 'id'>) => {
    setNotes(prev => [...prev, { ...n, id: crypto.randomUUID() }]);
  }, []);

  const updateNote = useCallback((n: Note) => {
    setNotes(prev => prev.map(x => x.id === n.id ? n : x));
  }, []);

  const getClientById = useCallback((id: string) => clients.find(c => c.id === id), [clients]);
  const getClientName = useCallback((id: string | null) => {
    if (!id) return 'Geral';
    return clients.find(c => c.id === id)?.name ?? 'Desconhecido';
  }, [clients]);

  const getTodayReviews = useCallback(() => reviews.filter(r => r.date === today), [reviews]);
  const getOpenTasks = useCallback(() => tasks.filter(t => !t.done), [tasks]);
  const getClientNotes = useCallback((clientId: string) => notes.filter(n => n.clientId === clientId).sort((a, b) => b.date.localeCompare(a.date)), [notes]);
  const getClientHistory = useCallback((clientId: string) => history.filter(h => h.clientId === clientId).sort((a, b) => b.date.localeCompare(a.date)), [history]);
  const getClientTasks = useCallback((clientId: string) => tasks.filter(t => t.clientId === clientId), [tasks]);
  const getClientsWithoutRecentReview = useCallback(() => {
    const threeDaysAgo = daysAgo(3);
    return clients.filter(c => c.status === 'ativo' && (!c.lastReviewDate || c.lastReviewDate < threeDaysAgo));
  }, [clients]);

  return (
    <StoreContext.Provider value={{
      clients, reviews, tasks, notes, history,
      addClient, updateClient, toggleReview, addReview, toggleTask, addTask, addNote, updateNote,
      getClientById, getClientName, getTodayReviews, getOpenTasks, getClientNotes, getClientHistory, getClientTasks, getClientsWithoutRecentReview,
    }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
