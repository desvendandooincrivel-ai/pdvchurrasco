
import React, { useState } from 'react';
import { AppState, Product, ProductType, Category, RecipeItem, User, UserRole } from '../types';
import { upsertProduct, deleteProduct } from '../services/storage';
import AdminAuthModal from '../components/AdminAuthModal';

interface ProductsProps {
  state: AppState;
  onUpdateState: () => void;
  currentUser: User;
}

const Products: React.FC<ProductsProps> = ({ state, onUpdateState, currentUser }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [pendingAction, setPendingAction] = useState<{ type: 'save' | 'delete', id?: string } | null>(null);

  const [formData, setFormData] = useState<Omit<Product, 'id'>>({
    name: '',
    category: Category.CARNES,
    price: 0,
    type: ProductType.INDIVIDUAL,
    recipe: [],
    active: true
  });

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({ ...product });
    } else {
      setEditingProduct(null);
      setFormData({
        name: '',
        category: Category.CARNES,
        price: 0,
        type: ProductType.INDIVIDUAL,
        recipe: [],
        active: true
      });
    }
    setIsModalOpen(true);
  };

  const handleRequestSave = () => {
    if (!formData.name || formData.price <= 0) {
      alert("Preencha o nome e preço corretamente.");
      return;
    }
    setPendingAction({ type: 'save' });
  };

  const executeSave = async (authorizer: User) => {
    const productToSave: Product = {
      ...formData,
      id: editingProduct ? editingProduct.id : `prod_${Date.now()}`
    };
    await upsertProduct(currentUser, authorizer, productToSave);
    alert(`Ação autorizada por ${authorizer.name}`);
    await onUpdateState();
    setIsModalOpen(false);
    setPendingAction(null);
  };

  const executeDelete = async (authorizer: User) => {
    if (!pendingAction?.id) return;
    await deleteProduct(currentUser, authorizer, pendingAction.id);
    alert(`Ação autorizada por ${authorizer.name}`);
    await onUpdateState();
    setPendingAction(null);
  };

  const addRecipeItem = () => {
    setFormData(prev => ({
      ...prev,
      recipe: [...prev.recipe, { inventoryItemId: '', quantity: 1 }]
    }));
  };

  const updateRecipeItem = (index: number, field: keyof RecipeItem, value: any) => {
    const newRecipe = [...formData.recipe];
    newRecipe[index] = { ...newRecipe[index], [field]: value };
    setFormData(prev => ({ ...prev, recipe: newRecipe }));
  };

  const removeRecipeItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      recipe: prev.recipe.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Cardápio</h1>
          <p className="text-gray-500">Produtos, Fichas Técnicas e Combos</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-orange-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-orange-700 transition-all shadow-lg"
        >
          + Novo Produto
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {state.products.map(product => (
          <div key={product.id} className={`bg-white rounded-[2rem] border p-6 flex flex-col gap-4 shadow-sm hover:shadow-md transition-all ${!product.active ? 'opacity-50' : ''}`}>
            <div className="flex justify-between items-center">
              <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                product.type === ProductType.INDIVIDUAL ? 'bg-blue-100 text-blue-700' :
                product.type === ProductType.COMBO ? 'bg-purple-100 text-purple-700' : 'bg-orange-100 text-orange-700'
              }`}>
                {product.type}
              </span>
              <span className="text-xs font-bold text-gray-400">{product.category}</span>
            </div>
            <h3 className="text-lg font-black text-gray-800">{product.name}</h3>
            
            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
              <div className="text-[10px] font-black text-gray-400 uppercase mb-2">Resumo de Baixa</div>
              {product.type === ProductType.INDIVIDUAL ? (
                <p className="text-xs text-gray-600 italic">Baixa automática do estoque de: {product.name}</p>
              ) : (
                <ul className="space-y-1">
                  {product.recipe.map((r, i) => {
                    const item = product.type === ProductType.COMBO 
                      ? state.products.find(p => p.id === r.inventoryItemId)
                      : state.inventory.find(inv => inv.id === r.inventoryItemId);
                    return (
                      <li key={i} className="text-xs flex justify-between text-gray-600">
                        <span>{item?.name || 'Item não encontrado'}</span>
                        <span className="font-bold">{r.quantity} un</span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <div className="mt-auto pt-4 flex justify-between items-center border-t border-dashed">
              <span className="text-2xl font-black text-gray-900">R$ {product.price.toFixed(2)}</span>
              <div className="flex gap-2">
                <button onClick={() => handleOpenModal(product)} className="p-2 text-gray-400 hover:text-orange-600 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                </button>
                <button onClick={() => setPendingAction({ type: 'delete', id: product.id })} className="p-2 text-gray-400 hover:text-red-600 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="bg-orange-600 p-8 text-white">
              <h2 className="text-2xl font-black">{editingProduct ? 'Editar Produto' : 'Cadastrar Produto'}</h2>
              <p className="text-orange-100 text-sm">Configure os detalhes e o modo de estoque</p>
            </div>
            
            <div className="p-8 overflow-y-auto space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-xs font-black text-gray-400 uppercase mb-2">Como você define este produto?</label>
                  <div className="grid grid-cols-3 gap-3">
                    {[ProductType.INDIVIDUAL, ProductType.COMPOSTO, ProductType.COMBO].map(type => (
                      <button 
                        key={type}
                        type="button"
                        onClick={() => setFormData({...formData, type, recipe: []})}
                        className={`p-4 rounded-2xl border-2 font-bold text-sm transition-all ${formData.type === type ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-100 text-gray-500 hover:border-gray-200'}`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-black text-gray-400 uppercase mb-2">Nome Comercial</label>
                  <input 
                    type="text"
                    className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl py-3 px-5 focus:border-orange-500 outline-none font-bold"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase mb-2">Preço de Venda</label>
                  <input 
                    type="number"
                    className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl py-3 px-5 focus:border-orange-500 outline-none font-black text-xl"
                    value={formData.price}
                    onChange={e => setFormData({...formData, price: Number(e.target.value)})}
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase mb-2">Categoria</label>
                  <select 
                    className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl py-3 px-5 focus:border-orange-500 outline-none font-bold"
                    value={formData.category}
                    onChange={e => setFormData({...formData, category: e.target.value as Category})}
                  >
                    {Object.values(Category).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
              </div>

              {formData.type !== ProductType.INDIVIDUAL && (
                <div className="pt-6 border-t space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-black text-gray-400 uppercase">
                      {formData.type === ProductType.COMPOSTO ? 'Ficha Técnica (Insumos)' : 'Produtos do Combo'}
                    </label>
                    <button onClick={addRecipeItem} className="text-xs font-black text-orange-600 underline">+ Adicionar Item</button>
                  </div>
                  <div className="space-y-3">
                    {formData.recipe.map((item, index) => (
                      <div key={index} className="flex gap-3 items-center bg-gray-50 p-3 rounded-2xl border border-gray-100">
                        <select 
                          className="flex-1 bg-transparent font-bold text-sm outline-none"
                          value={item.inventoryItemId}
                          onChange={e => updateRecipeItem(index, 'inventoryItemId', e.target.value)}
                        >
                          <option value="">Selecione...</option>
                          {formData.type === ProductType.COMPOSTO ? (
                            state.inventory.map(inv => <option key={inv.id} value={inv.id}>{inv.name}</option>)
                          ) : (
                            state.products.filter(p => p.id !== editingProduct?.id).map(p => <option key={p.id} value={p.id}>{p.name}</option>)
                          )}
                        </select>
                        <input 
                          type="number"
                          className="w-16 bg-white border-2 rounded-xl px-2 py-1 text-center font-bold"
                          value={item.quantity}
                          onChange={e => updateRecipeItem(index, 'quantity', Number(e.target.value))}
                        />
                        <button onClick={() => removeRecipeItem(index)} className="text-red-400 px-2 font-bold">×</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-8 bg-gray-50 border-t flex gap-4 shrink-0">
              <button 
                onClick={handleRequestSave}
                className="flex-1 bg-orange-600 text-white py-4 rounded-2xl font-black text-lg shadow-lg hover:bg-orange-700 transition-all"
              >
                {editingProduct ? 'ATUALIZAR' : 'SALVAR PRODUTO'}
              </button>
              <button onClick={() => setIsModalOpen(false)} className="px-8 py-4 font-black text-gray-400">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {pendingAction && (
        <AdminAuthModal 
          onConfirm={pendingAction.type === 'save' ? executeSave : executeDelete}
          onCancel={() => setPendingAction(null)}
          users={state.users}
          title={pendingAction.type === 'save' ? "Autorizar Alteração" : "Autorizar Exclusão"}
          description={pendingAction.type === 'save' ? "Alterar preços ou produtos exige autorização de um administrador." : "Remover itens do cardápio é uma ação irreversível."}
        />
      )}
    </div>
  );
};

export default Products;
