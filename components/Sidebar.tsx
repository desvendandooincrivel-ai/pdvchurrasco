
import React from 'react';
import { User, UserRole } from '../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser: User;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, currentUser, onLogout }) => {
  const menuItems = [
    { id: 'pos', label: 'Caixa / PDV', icon: '🛒', roles: [UserRole.ADMIN, UserRole.CAIXA] },
    { id: 'inventory', label: 'Estoque', icon: '📦', roles: [UserRole.ADMIN, UserRole.CAIXA] },
    { id: 'products', label: 'Produtos', icon: '🍢', roles: [UserRole.ADMIN, UserRole.CAIXA] },
    { id: 'reports', label: 'Relatórios', icon: '📊', roles: [UserRole.ADMIN, UserRole.CAIXA] },
    { id: 'users', label: 'Usuários', icon: '👥', roles: [UserRole.ADMIN] },
    { id: 'audit', label: 'Auditoria', icon: '🛡️', roles: [UserRole.ADMIN] },
  ];

  const filteredItems = menuItems.filter(item => item.roles.includes(currentUser.role));

  return (
    <div className="w-64 bg-slate-900 text-white flex flex-col h-screen sticky top-0">
      <div className="p-6 text-2xl font-bold border-b border-slate-800 text-orange-500">
        🍢 ChurrasControl
      </div>
      <nav className="flex-1 mt-6">
        {filteredItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center px-6 py-4 transition-colors ${
              activeTab === item.id 
                ? 'bg-orange-600 text-white' 
                : 'hover:bg-slate-800 text-slate-400'
            }`}
          >
            <span className="text-xl mr-3">{item.icon}</span>
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </nav>
      <div className="p-6 border-t border-slate-800">
        <div className="text-[10px] font-bold text-slate-500 uppercase mb-1">Logado como:</div>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-orange-600 flex items-center justify-center font-bold text-xs">
            {currentUser.name.charAt(0)}
          </div>
          <div className="flex flex-col truncate">
            <span className="font-bold text-sm truncate">{currentUser.name}</span>
            <span className="text-[10px] text-slate-400">{currentUser.role}</span>
          </div>
        </div>
        <button 
          onClick={onLogout}
          className="mt-4 w-full py-2 text-xs font-bold text-red-400 hover:text-red-300 border border-slate-800 rounded hover:bg-slate-800 transition-all"
        >
          Sair do Sistema
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
