
import React, { useState } from 'react';
import { User, UserRole } from '../types';

interface AdminAuthModalProps {
  onConfirm: (authorizer: User) => void;
  onCancel: () => void;
  users: User[];
  title: string;
  description?: string;
}

const AdminAuthModal: React.FC<AdminAuthModalProps> = ({ onConfirm, onCancel, users, title, description }) => {
  const [selectedAdminId, setSelectedAdminId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const admins = users.filter(u => u.role === UserRole.ADMIN);

  const handleConfirm = () => {
    const admin = admins.find(u => u.id === selectedAdminId && u.password === password);
    if (admin) {
      onConfirm(admin);
    } else {
      setError('Credenciais administrativas inválidas.');
      setPassword('');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[200] flex items-center justify-center p-4">
      <div className="bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="bg-red-600 p-8 text-white text-center">
          <div className="bg-white/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🛡️</span>
          </div>
          <h2 className="text-2xl font-black uppercase tracking-tight">{title}</h2>
          <p className="opacity-80 text-xs mt-2 font-medium">
            {description || "Esta ação é sensível e requer autorização de um administrador logado."}
          </p>
        </div>
        
        <div className="p-8 space-y-5">
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">Selecione o Administrador</label>
            <select 
              className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl py-3 px-4 font-bold outline-none focus:border-red-500 transition-all"
              value={selectedAdminId}
              onChange={e => setSelectedAdminId(e.target.value)}
            >
              <option value="">Escolha um responsável...</option>
              {admins.map(admin => (
                <option key={admin.id} value={admin.id}>{admin.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">Senha Administrativa</label>
            <input 
              type="password"
              placeholder="••••••••"
              className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl py-3 px-4 text-center text-xl font-black outline-none focus:border-red-500 transition-all"
              value={password}
              onChange={e => { setPassword(e.target.value); setError(''); }}
              onKeyDown={e => e.key === 'Enter' && handleConfirm()}
            />
            {error && <p className="text-red-500 text-center text-xs mt-3 font-bold animate-pulse">{error}</p>}
          </div>

          <div className="flex flex-col gap-3 pt-2">
            <button 
              onClick={handleConfirm}
              disabled={!selectedAdminId || !password}
              className="w-full bg-red-600 text-white py-4 rounded-2xl font-black hover:bg-red-700 transition-all shadow-xl shadow-red-100 disabled:opacity-50 disabled:shadow-none"
            >
              AUTORIZAR AÇÃO
            </button>
            <button 
              onClick={onCancel}
              className="w-full text-gray-400 font-bold py-2 text-sm hover:text-gray-600 transition-colors"
            >
              Cancelar e Voltar
            </button>
          </div>
        </div>
        <div className="bg-gray-50 p-4 text-center border-t border-gray-100">
           <p className="text-[9px] text-gray-400 font-black uppercase tracking-[0.2em]">Protocolo de Segurança Ativo</p>
        </div>
      </div>
    </div>
  );
};

export default AdminAuthModal;
