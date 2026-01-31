
import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import POS from './pages/POS';
import Inventory from './pages/Inventory';
import Products from './pages/Products';
import Reports from './pages/Reports';
import Users from './pages/Users';
import AuditLogs from './pages/AuditLogs';
import AdminAuthModal from './components/AdminAuthModal';
import UpdateNotification from './components/UpdateNotification';
import { AppState, User, UserRole } from './types';
import { loadState, openRegister, closeRegister } from './services/storage';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('pos');
  const [state, setState] = useState<AppState | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loginData, setLoginData] = useState({ name: '', password: '' });
  const [loginError, setLoginError] = useState('');

  const [showOpenModal, setShowOpenModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [pendingRegisterAction, setPendingRegisterAction] = useState<'open' | 'close' | null>(null);
  const [initialBalance, setInitialBalance] = useState<string>("0");

  const refreshData = useCallback(async () => {
    const freshState = await loadState();
    setState(freshState);
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!state) return;
    const user = state.users.find(u => u.name === loginData.name && u.password === loginData.password);
    if (user) {
      setCurrentUser(user);
      setLoginError('');
      setLoginData({ name: '', password: '' });
    } else {
      setLoginError('Usuário ou senha inválidos.');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setActiveTab('pos');
  };

  if (!state) return (
    <div className="h-screen flex items-center justify-center bg-slate-950 text-white font-bold text-2xl">
      Sincronizando Banco Local...
    </div>
  );

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 p-6">
        <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl animate-in fade-in zoom-in-95">
          <div className="text-center mb-10">
            <div className="text-4xl mb-2">🍢</div>
            <h1 className="text-2xl font-black text-white">ChurrasControl</h1>
            <p className="text-slate-500 text-sm">Acesso Restrito ao Sistema</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2 tracking-widest">Usuário</label>
              <input
                type="text"
                className="w-full bg-slate-800 border-2 border-slate-700 rounded-2xl py-3 px-4 text-white focus:border-orange-600 outline-none transition-all font-bold"
                value={loginData.name}
                onChange={e => setLoginData({ ...loginData, name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2 tracking-widest">Senha</label>
              <input
                type="password"
                className="w-full bg-slate-800 border-2 border-slate-700 rounded-2xl py-3 px-4 text-white focus:border-orange-600 outline-none transition-all font-bold"
                value={loginData.password}
                onChange={e => setLoginData({ ...loginData, password: e.target.value })}
              />
            </div>
            {loginError && <p className="text-red-400 text-xs font-bold text-center animate-bounce">{loginError}</p>}
            <button
              type="submit"
              className="w-full bg-orange-600 text-white py-4 rounded-2xl font-black hover:bg-orange-700 transition-all shadow-lg shadow-orange-950"
            >
              ENTRAR NO SISTEMA
            </button>
          </form>
        </div>
      </div>
    );
  }

  const activeRegister = state.cashRegisters.find(r => r.status === 'open');

  const handleOpenRegisterExecute = async (authorizer: User) => {
    const amount = parseFloat(initialBalance) || 0;
    await openRegister(currentUser, authorizer, amount);
    await refreshData();
    setShowOpenModal(false);
    setPendingRegisterAction(null);
    setInitialBalance("0");
    alert(`Caixa aberto com autorização de ${authorizer.name}`);
  };

  const handleCloseRegisterExecute = async (authorizer: User) => {
    await closeRegister(currentUser, authorizer);
    await refreshData();
    setShowCloseModal(false);
    setPendingRegisterAction(null);
    alert(`Caixa encerrado com autorização de ${authorizer.name}`);
  };

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      <main className="flex-1 overflow-y-auto max-h-screen flex flex-col">
        <header className="bg-white border-b px-8 py-4 sticky top-0 z-10 flex justify-between items-center shrink-0">
          <div className="font-medium text-gray-500">
            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
          <div className="flex items-center gap-4">
            {activeRegister ? (
              <div className="flex items-center gap-3">
                <div className="flex flex-col items-end">
                  <span className="text-[10px] font-black text-green-600 uppercase tracking-widest">Caixa Aberto</span>
                  <span className="text-xs text-gray-400 font-bold">Desde {new Date(activeRegister.openingTime).toLocaleTimeString('pt-BR')}</span>
                </div>
                <button
                  onClick={() => setShowCloseModal(true)}
                  className="bg-red-50 text-red-600 border border-red-200 px-3 py-1 rounded-lg text-sm font-black hover:bg-red-100 transition-colors"
                >
                  Encerrar Turno
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowOpenModal(true)}
                className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-black hover:bg-green-700 transition-all shadow-lg shadow-green-100"
              >
                Abrir Novo Caixa
              </button>
            )}
            <UpdateNotification />
          </div>
        </header>

        <div className="flex-1 relative overflow-hidden flex flex-col">
          {activeTab === 'pos' && <POS state={state} onUpdateState={refreshData} currentUser={currentUser} />}
          {activeTab === 'inventory' && <Inventory state={state} onUpdateState={refreshData} currentUser={currentUser} />}
          {activeTab === 'products' && <Products state={state} onUpdateState={refreshData} currentUser={currentUser} />}
          {activeTab === 'reports' && <Reports state={state} currentUser={currentUser} />}
          {activeTab === 'users' && currentUser.role === UserRole.ADMIN && <Users state={state} onUpdateState={refreshData} currentUser={currentUser} />}
          {activeTab === 'audit' && currentUser.role === UserRole.ADMIN && <AuditLogs state={state} />}
        </div>
      </main>

      {showOpenModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl">
            <div className="bg-green-600 p-8 text-white text-center">
              <h2 className="text-2xl font-black">ABERTURA DE CAIXA</h2>
              <p className="text-green-100 text-xs mt-1">Informe o saldo inicial para começar o turno</p>
            </div>
            <div className="p-8 space-y-6">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest text-center">Fundo de Caixa (R$)</label>
                <input
                  type="number"
                  autoFocus
                  className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl py-4 px-4 text-3xl font-black text-center focus:border-green-500 outline-none"
                  value={initialBalance}
                  onChange={(e) => setInitialBalance(e.target.value)}
                />
              </div>
              <button
                onClick={() => setPendingRegisterAction('open')}
                className="w-full bg-green-600 text-white py-5 rounded-2xl font-black text-lg shadow-xl shadow-green-100"
              >
                PROSSEGUIR PARA AUTORIZAÇÃO
              </button>
              <button onClick={() => setShowOpenModal(false)} className="w-full text-gray-400 py-1 font-bold">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {showCloseModal && activeRegister && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="bg-red-600 p-8 text-white text-center">
              <h2 className="text-2xl font-black">FECHAMENTO DE TURNO</h2>
              <p className="text-red-100 text-xs mt-1">Confira o resumo das vendas antes de encerrar</p>
            </div>
            <div className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="bg-gray-50 p-6 rounded-3xl border">
                  <div className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Entrada</div>
                  <div className="text-2xl font-black">R$ {activeRegister.initialBalance.toFixed(2)}</div>
                </div>
                <div className="bg-green-50 p-6 rounded-3xl border border-green-100">
                  <div className="text-[10px] text-green-600 font-black uppercase tracking-widest mb-1">Vendas do Turno</div>
                  <div className="text-2xl font-black text-green-700">R$ {state.sales.filter(s => s.cashRegisterId === activeRegister.id).reduce((acc, s) => acc + s.total, 0).toFixed(2)}</div>
                </div>
              </div>
              <button
                onClick={() => setPendingRegisterAction('close')}
                className="w-full bg-red-600 text-white py-5 rounded-2xl font-black text-lg shadow-xl shadow-red-100"
              >
                AUTORIZAR FECHAMENTO
              </button>
              <button onClick={() => setShowCloseModal(false)} className="w-full text-gray-400 py-1 font-bold">Voltar ao PDV</button>
            </div>
          </div>
        </div>
      )}

      {pendingRegisterAction && (
        <AdminAuthModal
          onConfirm={pendingRegisterAction === 'open' ? handleOpenRegisterExecute : handleCloseRegisterExecute}
          onCancel={() => setPendingRegisterAction(null)}
          users={state.users}
          title={pendingRegisterAction === 'open' ? "Autorizar Abertura" : "Autorizar Fechamento"}
          description="Operações de caixa requerem autorização expressa do gerente."
        />
      )}

    </div>
  );
};

export default App;
