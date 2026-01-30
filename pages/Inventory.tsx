
import React, { useState } from 'react';
import { AppState, InventoryItem, User, UserRole } from '../types';
import { updateInventoryManual } from '../services/storage';
import AdminAuthModal from '../components/AdminAuthModal';

interface InventoryProps {
  state: AppState;
  onUpdateState: () => void;
  currentUser: User;
}

const Inventory: React.FC<InventoryProps> = ({ state, onUpdateState, currentUser }) => {
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<number>(0);
  const [pendingUpdate, setPendingUpdate] = useState<string | null>(null);

  const handleSaveRequest = (id: string) => {
    if (editValue < 0) {
      alert("A quantidade em estoque não pode ser negativa.");
      return;
    }
    setPendingUpdate(id);
  };

  const executeStockUpdate = async (authorizer: User) => {
    if (!pendingUpdate) return;
    try {
      await updateInventoryManual(currentUser, authorizer, pendingUpdate, editValue);
      alert(`Ajuste autorizado por ${authorizer.name}`);
      await onUpdateState();
      setIsEditing(null);
      setPendingUpdate(null);
    } catch (error: any) {
      alert(error.message);
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Controle de Estoque</h1>
          <p className="text-gray-500">Gerencie seus insumos e espetinhos em estoque</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Item</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Qtd Atual</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Qtd Mínima</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Status</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {state.inventory.map(item => {
              const isLow = item.quantity <= item.minQuantity;
              return (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-800">{item.name}</td>
                  <td className="px-6 py-4 text-gray-600">
                    {isEditing === item.id ? (
                      <input 
                        type="number"
                        min="0"
                        className="w-24 border rounded px-2 py-1 focus:ring-2 focus:ring-orange-500 outline-none font-bold"
                        value={editValue}
                        onChange={(e) => setEditValue(Number(e.target.value))}
                        autoFocus
                      />
                    ) : (
                      <span className="font-bold">{item.quantity} {item.unit}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-500">{item.minQuantity} {item.unit}</td>
                  <td className="px-6 py-4">
                    {isLow ? (
                      <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full">ESTOQUE BAIXO</span>
                    ) : (
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">OK</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {isEditing === item.id ? (
                      <div className="flex justify-end gap-2">
                         <button 
                          onClick={() => handleSaveRequest(item.id)}
                          className="bg-orange-600 text-white px-3 py-1 rounded-lg text-sm font-bold hover:bg-orange-700"
                        >Salvar</button>
                        <button 
                          onClick={() => setIsEditing(null)}
                          className="bg-gray-200 text-gray-600 px-3 py-1 rounded-lg text-sm font-bold hover:bg-gray-300"
                        >Cancelar</button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => {
                          setIsEditing(item.id);
                          setEditValue(item.quantity);
                        }}
                        className="text-orange-600 font-bold hover:underline"
                      >Ajustar</button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {pendingUpdate && (
        <AdminAuthModal 
          onConfirm={executeStockUpdate}
          onCancel={() => setPendingUpdate(null)}
          users={state.users}
          title="Autorizar Ajuste de Estoque"
          description="Ajustes manuais de quantidade devem ser autorizados para evitar perdas ou desvios."
        />
      )}
    </div>
  );
};

export default Inventory;
