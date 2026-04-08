export type ClientType = 'pessoal' | 'agenciado';
export type ClientStatus = 'ativo' | 'alerta' | 'pausado';
export type Platform = 'Meta Ads' | 'Google Ads';
export type Priority = 'alta' | 'media' | 'baixa';

export interface Client {
  id: string;
  name: string;
  type: ClientType;
  status: ClientStatus;
  segment: string;
  platforms: Platform[];
  budget: number;
  contact: string;
  startDate: string;
  lastReviewDate: string | null;
}

export interface Review {
  id: string;
  clientId: string;
  date: string;
  time: string;
  platforms: Platform[];
  priority: Priority;
  done: boolean;
  summary?: string;
}

export type Difficulty = 'facil' | 'media' | 'dificil';

export interface Task {
  id: string;
  clientId: string | null;
  title: string;
  dueDate: string;
  done: boolean;
  difficulty?: Difficulty;
}

export interface Note {
  id: string;
  clientId: string;
  date: string;
  content: string;
}

export interface ReviewHistory {
  id: string;
  clientId: string;
  date: string;
  summary: string;
  platforms: Platform[];
  tags: string[];
}
