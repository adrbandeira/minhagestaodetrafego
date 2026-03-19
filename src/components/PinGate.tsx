import { useState, createContext, useContext } from 'react';
import { Lock } from 'lucide-react';

const PinContext = createContext<{ unlocked: boolean; unlock: () => void }>({ unlocked: false, unlock: () => {} });

export function PessoalPinProvider({ children }: { children: React.ReactNode }) {
  const [unlocked, setUnlocked] = useState(false);
  return (
    <PinContext.Provider value={{ unlocked, unlock: () => setUnlocked(true) }}>
      {children}
    </PinContext.Provider>
  );
}

export function usePessoalPin() {
  return useContext(PinContext);
}

export default function PinGate({ children }: { children: React.ReactNode }) {
  const { unlocked, unlock } = usePessoalPin();
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState(false);

  const handleUnlock = () => {
    if (pin === '1010') {
      unlock();
      setPinError(false);
    } else {
      setPinError(true);
    }
  };

  if (unlocked) return <>{children}</>;

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
      <div className="bg-card border border-border rounded-lg p-8 max-w-sm w-full text-center">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Lock className="w-6 h-6 text-primary" />
        </div>
        <h2 className="font-syne font-bold text-lg mb-2">Área Protegida</h2>
        <p className="text-sm text-muted-foreground mb-6">Digite o PIN para acessar os clientes pessoais.</p>
        <div className="flex gap-2">
          <input
            type="password"
            maxLength={4}
            value={pin}
            onChange={e => { setPin(e.target.value); setPinError(false); }}
            onKeyDown={e => e.key === 'Enter' && handleUnlock()}
            placeholder="PIN"
            className={`flex-1 bg-secondary border rounded-md px-4 py-2.5 text-center text-lg font-mono tracking-[0.5em] focus:outline-none focus:ring-1 focus:ring-primary ${pinError ? 'border-destructive' : 'border-border'}`}
          />
          <button onClick={handleUnlock} className="px-5 py-2.5 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors">
            Entrar
          </button>
        </div>
        {pinError && <p className="text-destructive text-xs mt-2">PIN incorreto</p>}
      </div>
    </div>
  );
}
