import React, { useState, useRef, useMemo } from 'react';
import { AppState, User, MovementType, Product } from '../types';
import { processStockEntry, saveNFe } from '../services/storage';
import { useBarcodeScanner } from '../hooks/useBarcodeScanner';
import { globalProductsAPI } from '../services/globalProductsAPI';

interface StockEntryProps {
  state: AppState;
  onUpdateState: () => void;
  currentUser: User;
}

interface EntryItem {
  barcode?: string;
  name: string;
  quantity: number;
  unitCost?: number;
  status?: 'Existente' | 'Novo'; // Usado na NF-e
}

const StockEntry: React.FC<StockEntryProps> = ({ state, onUpdateState, currentUser }) => {
  const [activeTab, setActiveTab] = useState<'manual' | 'nfe'>('manual');
  
  // -- Estado Manual --
  const [manualItems, setManualItems] = useState<EntryItem[]>([]);
  const [manualSearch, setManualSearch] = useState('');
  const [manualQuantity, setManualQuantity] = useState('');
  const [manualCost, setManualCost] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // -- Estado NF-e --
  const [nfeItems, setNfeItems] = useState<EntryItem[]>([]);
  const [nfeTotal, setNfeTotal] = useState(0);
  const [nfeProvider, setNfeProvider] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // -------------------------
  // FLUXO: ENTRADA MANUAL
  // -------------------------
  const handleScan = async (barcode: string) => {
    // Evita bipar na aba errada
    if (activeTab !== 'manual') return;

    let productName = '';
    
    // 1. Busca Local
    const localProduct = state.products.find(p => p.barcode === barcode);
    if (localProduct) {
      productName = localProduct.name;
    } else {
      // 2. Busca Global
      const globalProduct = await globalProductsAPI.getByBarcode(barcode);
      productName = globalProduct ? globalProduct.nome_padrao : `Produto Desconhecido (${barcode})`;
    }

    setManualSearch(barcode);
    // Em um caso de uso real, talvez abrir um modal aqui se o nome for desconhecido.
    // Para agilidade, vamos auto-preencher para o usuário editar.
    if (!manualItems.find(i => i.barcode === barcode)) {
      setManualItems(prev => [...prev, { barcode, name: productName, quantity: 1 }]);
      setManualSearch('');
    }
  };

  useBarcodeScanner(handleScan);

  const handleManualAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualSearch) return;

    const qty = parseFloat(manualQuantity) || 1;
    const cost = manualCost ? parseFloat(manualCost) : undefined;

    setManualItems(prev => [
      ...prev,
      { barcode: manualSearch, name: manualSearch, quantity: qty, unitCost: cost }
    ]);
    
    setManualSearch('');
    setManualQuantity('');
    setManualCost('');
  };

  const removeManualItem = (index: number) => {
    setManualItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveManual = async () => {
    if (manualItems.length === 0) return;
    setIsProcessing(true);
    try {
      await processStockEntry(currentUser, manualItems, MovementType.ENTRADA);
      onUpdateState();
      setManualItems([]);
      alert("Entrada manual salva com sucesso!");
    } catch (err: any) {
      alert("Erro ao salvar: " + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // -------------------------
  // FLUXO: NF-E (XML)
  // -------------------------
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const parser = new DOMParser();
        const xml = parser.parseFromString(text, "text/xml");

        const getTags = (node: Document | Element, tagName: string) => {
          let els = node.getElementsByTagName(tagName);
          if (els.length === 0) els = node.getElementsByTagNameNS('*', tagName);
          return els;
        };

        const items: EntryItem[] = [];
        const detNodes = getTags(xml, 'det');
        
        let total = 0;
        const emitNode = getTags(xml, 'emit')[0];
        const providerName = emitNode ? (getTags(emitNode, 'xNome')[0]?.textContent || 'Fornecedor Desconhecido') : 'Fornecedor Desconhecido';

        for (let i = 0; i < detNodes.length; i++) {
          const prod = getTags(detNodes[i], 'prod')[0];
          if (!prod) continue;

          const cEAN = getTags(prod, 'cEAN')[0]?.textContent || '';
          const xProd = getTags(prod, 'xProd')[0]?.textContent || '';
          const qCom = parseFloat(getTags(prod, 'qCom')[0]?.textContent || '0');
          const vUnCom = parseFloat(getTags(prod, 'vUnCom')[0]?.textContent || '0');

          total += (qCom * vUnCom);

          // Verificar status
          const barcodeExists = state.products.some(p => p.barcode === cEAN && cEAN !== 'SEM GTIN');
          
          items.push({
            barcode: cEAN === 'SEM GTIN' ? undefined : cEAN,
            name: xProd,
            quantity: qCom,
            unitCost: vUnCom,
            status: barcodeExists ? 'Existente' : 'Novo'
          });
        }

        if (items.length === 0) {
          alert("Não foi possível encontrar itens (tags <det> e <prod>) neste XML. Verifique se é uma NF-e válida.");
          return;
        }

        setNfeItems(items);
        setNfeTotal(total);
        setNfeProvider(providerName);
      } catch (err) {
        alert("Erro ao ler XML. Certifique-se de que é um arquivo válido de NF-e.");
      }
    };
    reader.readAsText(file);
  };

  const handleNfeItemNameChange = (index: number, newName: string) => {
    setNfeItems(prev => prev.map((item, i) => i === index ? { ...item, name: newName.toUpperCase() } : item));
  };

  const handleSaveNFe = async () => {
    if (nfeItems.length === 0) return;
    setIsProcessing(true);
    try {
      const nfeId = `nfe_${Date.now()}`;
      
      await saveNFe(currentUser, {
        id: nfeId,
        provider: nfeProvider,
        emissionDate: Date.now(),
        totalValue: nfeTotal
      });

      await processStockEntry(currentUser, nfeItems, MovementType.NFE, nfeId);
      
      onUpdateState();
      setNfeItems([]);
      setNfeTotal(0);
      setNfeProvider('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      
      alert("NF-e importada e estoque atualizado com sucesso!");
    } catch (err: any) {
      alert("Erro ao importar NF-e: " + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Entrada de Estoque</h1>
          <p className="text-gray-500 font-bold mt-1">Gerencie a entrada de mercadorias no sistema.</p>
        </div>
      </div>

      <div className="flex gap-4 border-b border-gray-200">
        <button 
          onClick={() => setActiveTab('manual')}
          className={`pb-4 px-2 font-black transition-colors ${activeTab === 'manual' ? 'text-orange-600 border-b-2 border-orange-600' : 'text-gray-400 hover:text-gray-600'}`}
        >
          Entrada Manual
        </button>
        <button 
          onClick={() => setActiveTab('nfe')}
          className={`pb-4 px-2 font-black transition-colors ${activeTab === 'nfe' ? 'text-orange-600 border-b-2 border-orange-600' : 'text-gray-400 hover:text-gray-600'}`}
        >
          Importar NF-e (XML)
        </button>
      </div>

      {activeTab === 'manual' && (
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-6">
          <form onSubmit={handleManualAdd} className="flex gap-4 items-end bg-gray-50 p-4 rounded-2xl">
            <div className="flex-1">
              <label className="text-xs font-black text-gray-500 uppercase">Código ou Nome (Bipe aqui)</label>
              <input 
                type="text" 
                value={manualSearch}
                onChange={(e) => setManualSearch(e.target.value)}
                placeholder="Ex: 7891010101010"
                className="w-full mt-1 bg-white border border-gray-200 rounded-xl py-2 px-3 font-bold outline-none focus:border-orange-500"
                required
              />
            </div>
            <div className="w-32">
              <label className="text-xs font-black text-gray-500 uppercase">Qtd</label>
              <input 
                type="number" 
                value={manualQuantity}
                onChange={(e) => setManualQuantity(e.target.value)}
                placeholder="1"
                min="0.01"
                step="0.01"
                className="w-full mt-1 bg-white border border-gray-200 rounded-xl py-2 px-3 font-bold outline-none focus:border-orange-500"
              />
            </div>
            <div className="w-32">
              <label className="text-xs font-black text-gray-500 uppercase">Custo Un.</label>
              <input 
                type="number" 
                value={manualCost}
                onChange={(e) => setManualCost(e.target.value)}
                placeholder="R$ 0,00"
                min="0"
                step="0.01"
                className="w-full mt-1 bg-white border border-gray-200 rounded-xl py-2 px-3 font-bold outline-none focus:border-orange-500"
              />
            </div>
            <button type="submit" className="bg-gray-900 text-white py-2 px-6 rounded-xl font-black hover:bg-gray-800 h-[42px]">
              Adicionar
            </button>
          </form>

          {manualItems.length > 0 && (
            <div className="space-y-4">
              <div className="border border-gray-200 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200 text-xs font-black text-gray-500 uppercase">
                    <tr>
                      <th className="p-4">Produto</th>
                      <th className="p-4">Código (EAN)</th>
                      <th className="p-4 text-center">Quantidade</th>
                      <th className="p-4 text-right">Custo Un.</th>
                      <th className="p-4 text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-bold text-gray-800">
                    {manualItems.map((item, idx) => (
                      <tr key={idx} className="hover:bg-gray-50 transition-colors">
                        <td className="p-4 truncate max-w-[200px]">{item.name}</td>
                        <td className="p-4 text-orange-600">{item.barcode || '-'}</td>
                        <td className="p-4 text-center">{item.quantity}</td>
                        <td className="p-4 text-right">{item.unitCost ? `R$ ${item.unitCost.toFixed(2)}` : '-'}</td>
                        <td className="p-4 text-center">
                          <button onClick={() => removeManualItem(idx)} className="text-gray-400 hover:text-red-500">×</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-end">
                <button 
                  onClick={handleSaveManual}
                  disabled={isProcessing}
                  className="bg-orange-600 text-white py-3 px-8 rounded-xl font-black hover:bg-orange-700 shadow-lg shadow-orange-100 disabled:opacity-50"
                >
                  {isProcessing ? 'PROCESSANDO...' : 'SALVAR ENTRADA MANUAL'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'nfe' && (
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-6">
          <div className="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer relative">
            <input 
              type="file" 
              accept=".xml"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="text-4xl mb-2 opacity-50">📄</div>
            <p className="font-black text-gray-700">Clique ou arraste o XML da NF-e aqui</p>
            <p className="text-sm font-bold text-gray-400 mt-1">O sistema lerá os itens automaticamente</p>
          </div>

          {nfeItems.length > 0 && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="bg-orange-50 text-orange-800 p-4 rounded-xl border border-orange-100 flex justify-between items-center sticky top-0 z-10 shadow-sm">
                <div>
                  <div className="font-black">Fornecedor: {nfeProvider}</div>
                  <div className="text-sm font-bold opacity-80">{nfeItems.length} itens encontrados</div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-2xl font-black">
                    Total: R$ {nfeTotal.toFixed(2)}
                  </div>
                  <button 
                    onClick={handleSaveNFe}
                    disabled={isProcessing}
                    className="bg-emerald-600 text-white py-3 px-8 rounded-xl font-black hover:bg-emerald-700 shadow-lg shadow-emerald-100 disabled:opacity-50"
                  >
                    {isProcessing ? 'PROCESSANDO...' : 'CONFIRMAR ENTRADA'}
                  </button>
                </div>
              </div>

              <div className="border border-gray-200 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200 text-xs font-black text-gray-500 uppercase">
                    <tr>
                      <th className="p-4">Produto (xProd)</th>
                      <th className="p-4">EAN</th>
                      <th className="p-4 text-center">Qtd</th>
                      <th className="p-4 text-right">Custo Un.</th>
                      <th className="p-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-bold text-gray-800">
                    {nfeItems.map((item, idx) => (
                      <tr key={idx} className="hover:bg-gray-50 transition-colors">
                        <td className="p-2 w-1/3">
                          <input 
                            type="text" 
                            value={item.name} 
                            onChange={(e) => handleNfeItemNameChange(idx, e.target.value)}
                            className="w-full bg-white border border-gray-300 rounded-lg py-2 px-3 text-xs font-bold outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all uppercase"
                          />
                        </td>
                        <td className="p-4 text-gray-500">{item.barcode || <span className="text-red-400">SEM GTIN</span>}</td>
                        <td className="p-4 text-center">{item.quantity}</td>
                        <td className="p-4 text-right">R$ {item.unitCost?.toFixed(2)}</td>
                        <td className="p-4 text-center">
                          {item.status === 'Existente' ? (
                            <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-md text-xs font-black">VINCULADO</span>
                          ) : (
                            <span className="bg-sky-100 text-sky-700 px-2 py-1 rounded-md text-xs font-black">NOVO PRODUTO</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StockEntry;
