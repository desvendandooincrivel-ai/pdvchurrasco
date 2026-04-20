import React, { useState, useEffect, useRef } from 'react';

interface BarcodeScannerModalProps {
  barcode: string;
  initialName?: string;
  isOpen: boolean;
  onSave: (name: string, price: number, cost?: number) => void;
  onCancel: () => void;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  barcode,
  initialName,
  isOpen,
  onSave,
  onCancel
}) => {
  const [name, setName] = useState(initialName || '');
  const [price, setPrice] = useState('');
  const [cost, setCost] = useState('');
  const nameInputRef = useRef<HTMLInputElement>(null);
  const priceInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setName(initialName || '');
      setPrice('');
      setCost('');
      
      // Auto-focus logic
      setTimeout(() => {
        if (initialName) {
          priceInputRef.current?.focus();
        } else {
          nameInputRef.current?.focus();
        }
      }, 100);
    }
  }, [isOpen, initialName, barcode]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price) return;
    onSave(name, parseFloat(price), cost ? parseFloat(cost) : undefined);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onCancel();
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 animate-in fade-in duration-200"
      onKeyDown={handleKeyDown}
    >
      <div className="bg-white p-8 rounded-3xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center gap-4 mb-6">
          <div className="bg-orange-100 p-3 rounded-2xl">
            <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm14 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"></path>
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-black text-gray-900">Novo Produto</h2>
            <p className="text-sm font-bold text-gray-400">Código: <span className="text-orange-500">{barcode}</span></p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="text-xs font-black text-gray-500 uppercase tracking-wider mb-1 block">Nome do Produto</label>
            <input
              ref={nameInputRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value.toUpperCase())}
              className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl py-3 px-4 text-gray-900 font-bold outline-none focus:border-orange-500 focus:bg-white transition-all uppercase"
              placeholder="EX: CERVEJA LATA 350ML"
              required
            />
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-xs font-black text-gray-500 uppercase tracking-wider mb-1 block">Preço (R$)</label>
              <input
                ref={priceInputRef}
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl py-3 px-4 text-gray-900 font-black text-xl outline-none focus:border-orange-500 focus:bg-white transition-all"
                placeholder="0.00"
                required
              />
            </div>
            <div className="flex-1">
              <label className="text-xs font-black text-gray-500 uppercase tracking-wider mb-1 block">Custo (Opcional)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl py-3 px-4 text-gray-900 font-bold outline-none focus:border-gray-400 focus:bg-white transition-all"
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="flex gap-3 mt-8">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-gray-100 text-gray-500 py-4 rounded-xl font-black hover:bg-gray-200 transition-all"
            >
              CANCELAR
            </button>
            <button
              type="submit"
              className="flex-[2] bg-orange-600 text-white py-4 rounded-xl font-black hover:bg-orange-700 shadow-lg shadow-orange-200 transition-all"
            >
              SALVAR E ADICIONAR
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
