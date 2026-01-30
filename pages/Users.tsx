
import React, { useState } from 'react';
import { AppState, User, UserRole } from '../types';
import { upsertUser, deleteUser } from '../services/storage';

interface UsersProps {
  state: AppState;
  onUpdateState: () => void;
  currentUser: User;
}

const Users: React.FC<UsersProps> = ({ state, onUpdateState, currentUser }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({ name: '', password: '' });

  const handleOpenModal = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setFormData({ name: user.name, password: user.password });
    } else {
      setEditingUser(null);
      setFormData({ name: '', password: '' });
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.password) {
      alert("Preencha todos os campos.");
      return;
    }

    const userToSave: User = {
      id: editingUser ? editingUser.id : `u_${Date.now()}`,
      name: formData.name,
      password: formData.password,
      role: editingUser ? editingUser.role : UserRole.CAIXA // Apenas ADMIN pode criar CAIXA
    };

    try {
      await upsertUser(currentUser, userToSave);
      await onUpdateState();
      setIsModalOpen(false);
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleDelete = async (userId: string) => {
    if (window.confirm("Deseja realmente excluir este usuário?")) {
      try {
        await deleteUser(currentUser, userId);
        await onUpdateState();
      } catch (error: any) {
        alert(error.message);
      }
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Gestão de Usuários</h1>
          <p className="text-gray-500">Controle o acesso da sua equipe de caixas</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-orange-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-orange-700 transition-colors"
        >
          + Novo Operador
        </button>
      </div>

      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Nome</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Perfil</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">ID</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {state.users.map(u => (
              <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 font-bold text-gray-700">{u.name}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${
                    u.role === UserRole.ADMIN ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-6 py-4 text-xs text-gray-400 font-mono">{u.id}</td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-3">
                    <button 
                      onClick={() => handleOpenModal(u)}
                      className="text-orange-600 font-bold text-sm hover:underline"
                    >Editar</button>
                    {u.id !== currentUser.id && (
                      <button 
                        onClick={() => handleDelete(u.id)}
                        className="text-red-400 font-bold text-sm hover:underline"
                      >Excluir</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl">
            <div className="bg-orange-600 p-6 text-white text-center">
              <h2 className="text-xl font-bold">{editingUser ? 'Editar Usuário' : 'Novo Operador'}</h2>
            </div>
            <div className="p-8 space-y-6">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Nome Completo</label>
                <input 
                  type="text"
                  className="w-full border-2 border-gray-100 rounded-xl py-3 px-4 focus:border-orange-500 outline-none"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Senha de Acesso</label>
                <input 
                  type="password"
                  className="w-full border-2 border-gray-100 rounded-xl py-3 px-4 focus:border-orange-500 outline-none"
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                />
              </div>
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                <p className="text-[10px] text-blue-600 font-bold uppercase mb-1">Perfil de Acesso</p>
                <p className="text-sm font-bold text-blue-800">
                  {editingUser ? editingUser.role : 'CAIXA (Perfil Fixo)'}
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <button 
                  onClick={handleSave}
                  className="w-full bg-orange-600 text-white py-3 rounded-2xl font-black"
                >SALVAR</button>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="w-full text-gray-400 py-1 font-bold text-sm"
                >Cancelar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
