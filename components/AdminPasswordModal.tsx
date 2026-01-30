
import React, { useState } from 'react';
import { User, UserRole } from '../types';

interface AdminPasswordModalProps {
  onConfirm: () => void;
  onCancel: () => void;
  users: User[];
  title?: string;
}

const AdminPasswordModal: React.FC<AdminPasswordModalProps> = ({ onConfirm, onCancel, users, title = "Ação Restrita" }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleConfirm = () => {
    // Busca qualquer admin que tenha essa senha
    const admin = users.find(u => u.role === UserRole.ADMIN && u.password === password);
    if (admin) {
      onConfirm();
    } else {
      setError('Senha de administrador incorreta.');
      setPassword('');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="bg-red-600 p-6 text-white text-center">
          <span className="text-3xl mb-2 block">🔒</span>
          <h2 className="text-xl font-bold">{title}</h2>
          <p className="opacity-80 text-xs mt-1">Esta ação exige confirmação de um Administrador</p>
        </div>
        <div className="p-8 space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Senha do Administrador</label>
            <input 
              type="password"
              autoFocus
              className={`w-full bg-gray-50 border-2 rounded-2xl py-3 px-4 text-center text-xl font-black outline-none transition-all ${error ? 'border-red-300' : 'border-gray-100 focus:border-red-500'}`}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
            />
            {error && <p className="text-red-500 text-center text-xs mt-2 font-bold">{error}</p>}
          </div>
          <div className="flex flex-col gap-2">
            <button 
              onClick={handleConfirm}
              className="w-full bg-red-600 text-white py-3 rounded-2xl font-black hover:bg-red-700 transition-colors"
            >
              CONFIRMAR
            </button>
            <button 
              onClick={onCancel}
              className="w-full text-gray-400 font-bold py-1 text-sm"
            >
              Voltar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPasswordModal;
