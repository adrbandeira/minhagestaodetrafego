import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Client, Review, Task, Note, ReviewHistory } from '@/lib/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

const today = new Date().toISOString().split('T')[0];
const daysAgo = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
};

async function getCurrentUserId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}

function mapClient(row: any): Client {
  return {
    id: row.id, name: row.name, type: row.type, status: row.status,
    segment: row.segment, platforms: row.platforms || [], budget: Number(row.budget),
    contact: row.contact, startDate: row.start_date || '', lastReviewDate: row.last_review_date || null,
  };
}

function mapReview(row: any): Review {
  return {
    id: row.id, clientId: row.client_id, date: row.date, time: row.time,
    platforms: row.platforms || [], priority: row.priority, done: row.done, summary: row.summary,
  };
}

function mapTask(row: any): Task {
  return { id: row.id, clientId: row.client_id, title: row.title, dueDate: row.due_date, done: row.done };
}

function mapNote(row: any): Note {
  return { id: row.id, clientId: row.client_id, date: row.date, content: row.content };
}

function mapHistory(row: any): ReviewHistory {
  return {
    id: row.id, clientId: row.client_id, date: row.date, summary: row.summary,
    platforms: row.platforms || [], tags: row.tags || [],
  };
}

interface StoreContextType {
  clients: Client[];
  reviews: Review[];
  tasks: Task[];
  notes: Note[];
  history: ReviewHistory[];
  loading: boolean;
  addClient: (c: Omit<Client, 'id' | 'status' | 'lastReviewDate'>) => void;
  updateClient: (c: Client) => void;
  toggleReview: (id: string) => void;
  addReview: (r: Omit<Review, 'id'>) => void;
  toggleTask: (id: string) => void;
  addTask: (t: Omit<Task, 'id'>) => void;
  addNote: (n: Omit<Note, 'id'>) => void;
  updateNote: (n: Note) => void;
  deleteClient: (id: string) => void;
  deleteTask: (id: string) => void;
  deleteNote: (id: string) => void;
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
  const [clients, setClients] = useState<Client[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [history, setHistory] = useState<ReviewHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAll() {
      setLoading(true);
      const [cRes, rRes, tRes, nRes, hRes] = await Promise.all([
        supabase.from('clients').select('*'),
        supabase.from('reviews').select('*'),
        supabase.from('tasks').select('*'),
        supabase.from('notes').select('*'),
        supabase.from('review_history').select('*'),
      ]);
      if (cRes.data) setClients(cRes.data.map(mapClient));
      if (rRes.data) setReviews(rRes.data.map(mapReview));
      if (tRes.data) setTasks(tRes.data.map(mapTask));
      if (nRes.data) setNotes(nRes.data.map(mapNote));
      if (hRes.data) setHistory(hRes.data.map(mapHistory));
      setLoading(false);
    }
    fetchAll();
  }, []);

  const addClient = useCallback(async (c: Omit<Client, 'id' | 'status' | 'lastReviewDate'>) => {
    const userId = await getCurrentUserId();
    if (!userId) return;
    const { data, error } = await supabase.from('clients').insert({
      name: c.name, type: c.type, segment: c.segment, platforms: c.platforms,
      budget: c.budget, contact: c.contact, start_date: c.startDate, status: 'ativo', user_id: userId,
    }).select().single();
    if (data && !error) setClients(prev => [...prev, mapClient(data)]);
  }, []);

  const updateClient = useCallback(async (c: Client) => {
    const { data, error } = await supabase.from('clients').update({
      name: c.name, type: c.type, status: c.status, segment: c.segment,
      platforms: c.platforms, budget: c.budget, contact: c.contact,
      start_date: c.startDate, last_review_date: c.lastReviewDate,
    }).eq('id', c.id).select().single();
    if (data && !error) setClients(prev => prev.map(x => x.id === c.id ? mapClient(data) : x));
  }, []);

  const toggleReview = useCallback(async (id: string) => {
    const review = reviews.find(r => r.id === id);
    if (!review) return;
    const newDone = !review.done;
    const { error } = await supabase.from('reviews').update({ done: newDone }).eq('id', id);
    if (!error) setReviews(prev => prev.map(r => r.id === id ? { ...r, done: newDone } : r));
  }, [reviews]);

  const addReview = useCallback(async (r: Omit<Review, 'id'>) => {
    const userId = await getCurrentUserId();
    if (!userId) return;
    const { data, error } = await supabase.from('reviews').insert({
      client_id: r.clientId, date: r.date, time: r.time, platforms: r.platforms,
      priority: r.priority, done: r.done, user_id: userId,
    }).select().single();
    if (data && !error) setReviews(prev => [...prev, mapReview(data)]);
  }, []);

  const toggleTask = useCallback(async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    const newDone = !task.done;
    const { error } = await supabase.from('tasks').update({ done: newDone }).eq('id', id);
    if (!error) setTasks(prev => prev.map(t => t.id === id ? { ...t, done: newDone } : t));
  }, [tasks]);

  const addTask = useCallback(async (t: Omit<Task, 'id'>) => {
    const userId = await getCurrentUserId();
    if (!userId) return;
    const { data, error } = await supabase.from('tasks').insert({
      client_id: t.clientId, title: t.title, due_date: t.dueDate, done: t.done, user_id: userId,
    }).select().single();
    if (data && !error) setTasks(prev => [...prev, mapTask(data)]);
  }, []);

  const addNote = useCallback(async (n: Omit<Note, 'id'>) => {
    const userId = await getCurrentUserId();
    if (!userId) return;
    const { data, error } = await supabase.from('notes').insert({
      client_id: n.clientId, date: n.date, content: n.content, user_id: userId,
    }).select().single();
    if (data && !error) setNotes(prev => [...prev, mapNote(data)]);
  }, []);

  const updateNote = useCallback(async (n: Note) => {
    const { data, error } = await supabase.from('notes').update({ content: n.content }).eq('id', n.id).select().single();
    if (data && !error) setNotes(prev => prev.map(x => x.id === n.id ? mapNote(data) : x));
  }, []);

  const deleteClient = useCallback(async (id: string) => {
    const { error } = await supabase.from('clients').delete().eq('id', id);
    if (!error) setClients(prev => prev.filter(c => c.id !== id));
  }, []);

  const deleteTask = useCallback(async (id: string) => {
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (!error) setTasks(prev => prev.filter(t => t.id !== id));
  }, []);

  const deleteNote = useCallback(async (id: string) => {
    const { error } = await supabase.from('notes').delete().eq('id', id);
    if (!error) setNotes(prev => prev.filter(n => n.id !== id));
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
      clients, reviews, tasks, notes, history, loading,
      addClient, updateClient, toggleReview, addReview, toggleTask, addTask, addNote, updateNote, deleteClient, deleteTask, deleteNote,
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
