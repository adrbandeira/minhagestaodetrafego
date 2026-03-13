import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '@/lib/store';
import { PlatformBadge, StatusChip, TypeChip } from '@/components/Badges';
import { ArrowLeft, StickyNote, History, CheckSquare, Info, Wallet, Plus } from 'lucide-react';
import { useState } from 'react';
import ClientNotes from '@/components/ClientNotes';
import ClientHistory from '@/components/ClientHistory';
import ClientTasks from '@/components/ClientTasks';
import ClientInfo from '@/components/ClientInfo';
import ClientAdBalances from '@/components/ClientAdBalances';
import ClientReviewForm from '@/components/ClientReviewForm';

const tabs = ['Anotações', 'Histórico de Revisões', 'Tarefas', 'Verba', 'Informações'] as const;

const tabIcons: Record<typeof tabs[number], React.ReactNode> = {
  'Anotações': <StickyNote className="w-3.5 h-3.5" />,
  'Histórico de Revisões': <History className="w-3.5 h-3.5" />,
  'Tarefas': <CheckSquare className="w-3.5 h-3.5" />,
  'Verba': <Wallet className="w-3.5 h-3.5" />,
  'Informações': <Info className="w-3.5 h-3.5" />,
};

export default function ClientProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getClientById } = useStore();
  const [activeTab, setActiveTab] = useState<typeof tabs[number]>('Anotações');
  const [showReviewForm, setShowReviewForm] = useState(false);

  const client = getClientById(id!);
  if (!client) return <div className="text-muted-foreground">Cliente não encontrado.</div>;

  const initials = client.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const colors = ['bg-primary', 'bg-meta', 'bg-warn', 'bg-google', 'bg-danger'];
  const bgColor = colors[client.name.length % colors.length];

  return (
    <div>
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm mb-4 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Voltar
      </button>

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-xl ${bgColor} flex items-center justify-center text-lg font-syne font-bold text-primary-foreground`}>
            {initials}
          </div>
          <div>
            <h1 className="text-xl font-syne font-bold flex items-center gap-2">
              {client.name}
              <StatusChip status={client.status} />
              <TypeChip type={client.type} />
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[12px] text-muted-foreground">{client.segment}</span>
              {client.platforms.map(p => <PlatformBadge key={p} platform={p} />)}
            </div>
          </div>
        </div>
        <button onClick={() => setShowReviewForm(!showReviewForm)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
          <Plus className="w-4 h-4" /> Nova Revisão
        </button>
      </div>

      {showReviewForm && (
        <div className="mb-6">
          <ClientReviewForm clientId={client.id} onClose={() => setShowReviewForm(false)} />
        </div>
      )}

      <div className="flex border-b border-border mb-6">
        {tabs.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 ${activeTab === tab ? 'text-primary border-primary' : 'text-muted-foreground border-transparent hover:text-foreground'}`}>
            {tabIcons[tab]}
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'Anotações' && <ClientNotes clientId={client.id} />}
      {activeTab === 'Histórico de Revisões' && <ClientHistory clientId={client.id} />}
      {activeTab === 'Tarefas' && <ClientTasks clientId={client.id} />}
      {activeTab === 'Verba' && <ClientAdBalances clientId={client.id} platforms={client.platforms} />}
      {activeTab === 'Informações' && <ClientInfo client={client} />}
    </div>
  );
}
