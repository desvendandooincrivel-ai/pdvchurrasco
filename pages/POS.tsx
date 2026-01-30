
import React, { useState, useMemo } from 'react';
import { AppState, Product, SaleItem, PaymentMethod, Sale, User } from '../types';
import { processSale, calculateTotalRequirement } from '../services/storage';

interface POSProps {
  state: AppState;
  onUpdateState: () => void;
  currentUser: User;
}

const POS: React.FC<POSProps> = ({ state, onUpdateState, currentUser }) => {
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('Tudo');
  const [isFinishing, setIsFinishing] = useState(false);
  
  // Estados para o fluxo de pagamento
  const [paymentStep, setPaymentStep] = useState<'main' | 'cash' | 'card'>('main');
  const [receivedAmount, setReceivedAmount] = useState<string>('');

  const activeRegister = state.cashRegisters.find(r => r.status === 'open');
  const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  
  const change = useMemo(() => {
    const received = parseFloat(receivedAmount) || 0;
    return Math.max(0, received - total);
  }, [receivedAmount, total]);

  const categories = ['Tudo', ...Array.from(new Set(state.products.map(p => p.category)))];

  const filteredProducts = useMemo(() => {
    // Apenas produtos ativos aparecem no PDV
    const activeProducts = state.products.filter(p => p.active);
    return selectedCategory === 'Tudo' 
      ? activeProducts 
      : activeProducts.filter(p => p.category === selectedCategory);
  }, [state.products, selectedCategory]);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.productId === product.id);
      if (existing) {
        return prev.map(item => 
          item.productId === product.id 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      }
      return [...prev, {
        productId: product.id,
        productName: product.name,
        quantity: 1,
        price: product.price
      }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.productId !== productId));
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.productId === productId) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const resetPayment = () => {
    setIsFinishing(false);
    setPaymentStep('main');
    setReceivedAmount('');
  };

  const handleFinishSale = async (method: PaymentMethod) => {
    if (!activeRegister) return;
    if (cart.length === 0) return;

    // Validação de Dinheiro
    if (method === PaymentMethod.MONEY) {
      const received = parseFloat(receivedAmount) || 0;
      if (received < total) {
        alert("O valor recebido é menor que o total da venda!");
        return;
      }
    }

    // Check availability locally first
    const requirements = await calculateTotalRequirement(cart);
    for (const [id, needed] of Object.entries(requirements)) {
        const item = state.inventory.find(i => i.id === id);
        if (!item || item.quantity < needed) {
            alert(`Estoque insuficiente para "${item?.name || 'Insumo'}".`);
            return;
        }
    }

    const newSale: Sale = {
      id: `sale_${Date.now()}`,
      timestamp: Date.now(),
      items: cart,
      total,
      paymentMethod: method,
      cashRegisterId: activeRegister.id,
      amountReceived: method === PaymentMethod.MONEY ? parseFloat(receivedAmount) : undefined,
      change: method === PaymentMethod.MONEY ? change : undefined
    };

    try {
      await processSale(currentUser, newSale);
      onUpdateState();
      setCart([]);
      resetPayment();
      alert('Venda finalizada com sucesso!');
    } catch (error: any) {
      alert(error.message || 'Erro ao processar venda.');
    }
  };

  return (
    <div className="flex flex-1 gap-6 p-6 overflow-hidden">
      {/* Products Grid */}
      <div className="flex-[3] flex flex-col gap-4">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-black transition-all ${
                selectedCategory === cat 
                  ? 'bg-orange-600 text-white shadow-lg shadow-orange-100' 
                  : 'bg-white border text-gray-500 hover:bg-gray-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 overflow-y-auto">
          {filteredProducts.map(product => (
            <button
              key={product.id}
              onClick={() => addToCart(product)}
              className="bg-white p-5 rounded-3xl border border-gray-100 hover:shadow-xl hover:border-orange-200 transition-all text-left flex flex-col gap-2 group"
            >
              <div className="text-[10px] font-black text-orange-500 uppercase tracking-widest">{product.category}</div>
              <div className="font-bold text-gray-800 line-clamp-2 h-10 group-hover:text-orange-600 transition-colors">{product.name}</div>
              <div className="text-xl font-black text-gray-900 mt-auto">
                R$ {product.price.toFixed(2)}
              </div>
            </button>
          ))}
          {filteredProducts.length === 0 && (
            <div className="col-span-full py-20 text-center text-gray-400 font-bold italic">Nenhum produto ativo nesta categoria</div>
          )}
        </div>
      </div>

      {/* Cart Sidebar */}
      <div className="flex-[1.2] bg-white rounded-3xl border border-gray-100 shadow-sm flex flex-col">
        <div className="p-6 border-b font-black text-gray-800 flex justify-between items-center bg-gray-50/50">
          <span>Pedido Atual</span>
          <span className="bg-white border text-orange-600 px-3 py-1 rounded-full text-xs">{cart.reduce((a, b) => a + b.quantity, 0)} itens</span>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-300 gap-4">
              <span className="text-6xl grayscale opacity-50">🍢</span>
              <p className="font-bold text-sm">Carrinho vazio</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.productId} className="flex flex-col gap-3 p-4 bg-gray-50 rounded-2xl border border-transparent hover:border-orange-100 transition-all">
                <div className="flex justify-between font-bold text-sm">
                  <span className="truncate pr-2">{item.productName}</span>
                  <button onClick={() => removeFromCart(item.productId)} className="text-gray-300 hover:text-red-500 transition-colors">×</button>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3 bg-white border rounded-xl p-1">
                    <button onClick={() => updateQuantity(item.productId, -1)} className="w-8 h-8 rounded-lg text-gray-400 hover:bg-gray-100 font-bold">-</button>
                    <span className="font-black w-4 text-center text-sm">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.productId, 1)} className="w-8 h-8 rounded-lg text-gray-400 hover:bg-gray-100 font-bold">+</button>
                  </div>
                  <span className="font-black text-gray-900">R$ {(item.price * item.quantity).toFixed(2)}</span>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-6 bg-white border-t space-y-4">
          <div className="flex justify-between text-2xl font-black text-gray-900 mb-2">
            <span>Total</span>
            <span className="text-orange-600">R$ {total.toFixed(2)}</span>
          </div>

          {!activeRegister ? (
            <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-xs font-black text-center uppercase tracking-widest">
              🔒 Caixa Fechado
            </div>
          ) : !isFinishing ? (
            <button
              disabled={cart.length === 0}
              onClick={() => setIsFinishing(true)}
              className="w-full bg-orange-600 text-white py-4 rounded-2xl font-black hover:bg-orange-700 disabled:bg-gray-100 disabled:text-gray-400 transition-all shadow-lg shadow-orange-100"
            >
              FECHAR PEDIDO
            </button>
          ) : (
            <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
              {paymentStep === 'main' && (
                <>
                  <div className="text-[10px] font-black text-gray-400 uppercase text-center mb-1">Método de Pagamento</div>
                  <div className="grid grid-cols-1 gap-2">
                    <button 
                      onClick={() => setPaymentStep('cash')}
                      className="bg-emerald-600 text-white py-3 rounded-xl font-black hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
                    >💵 DINHEIRO</button>
                    <button 
                      onClick={() => handleFinishSale(PaymentMethod.PIX)}
                      className="bg-sky-600 text-white py-3 rounded-xl font-black hover:bg-sky-700 transition-all flex items-center justify-center gap-2"
                    >📱 PIX</button>
                    <button 
                      onClick={() => setPaymentStep('card')}
                      className="bg-indigo-600 text-white py-3 rounded-xl font-black hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                    >💳 CARTÃO</button>
                    <button 
                      onClick={() => setIsFinishing(false)}
                      className="text-gray-400 py-1 text-xs font-bold w-full text-center hover:text-gray-600"
                    >Cancelar</button>
                  </div>
                </>
              )}

              {paymentStep === 'cash' && (
                <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 space-y-3">
                  <div>
                    <label className="text-[10px] font-black text-emerald-600 uppercase">Valor Recebido</label>
                    <input 
                      type="number"
                      autoFocus
                      className="w-full bg-white border-2 border-emerald-200 rounded-xl py-2 px-3 text-lg font-black outline-none focus:border-emerald-500"
                      value={receivedAmount}
                      onChange={(e) => setReceivedAmount(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="flex justify-between items-center text-emerald-700">
                    <span className="text-xs font-bold">Troco:</span>
                    <span className="text-xl font-black">R$ {change.toFixed(2)}</span>
                  </div>
                  <button 
                    disabled={!receivedAmount || parseFloat(receivedAmount) < total}
                    onClick={() => handleFinishSale(PaymentMethod.MONEY)}
                    className="w-full bg-emerald-600 text-white py-3 rounded-xl font-black hover:bg-emerald-700 disabled:opacity-50"
                  >
                    FINALIZAR VENDA
                  </button>
                  <button 
                    onClick={() => setPaymentStep('main')}
                    className="w-full text-emerald-600 text-xs font-bold"
                  >Voltar</button>
                </div>
              )}

              {paymentStep === 'card' && (
                <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100 space-y-3">
                  <div className="text-[10px] font-black text-indigo-600 uppercase text-center">Selecione o Tipo de Cartão</div>
                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      onClick={() => handleFinishSale(PaymentMethod.CREDIT)}
                      className="bg-indigo-600 text-white py-3 rounded-xl font-black hover:bg-indigo-700"
                    >CRÉDITO</button>
                    <button 
                      onClick={() => handleFinishSale(PaymentMethod.DEBIT)}
                      className="bg-indigo-500 text-white py-3 rounded-xl font-black hover:bg-indigo-600"
                    >DÉBITO</button>
                  </div>
                  <button 
                    onClick={() => setPaymentStep('main')}
                    className="w-full text-indigo-600 text-xs font-bold"
                  >Voltar</button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default POS;
