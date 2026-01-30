
import React, { useMemo, useState, useEffect } from 'react';
import { 
  AppState, PaymentMethod, User, UserRole
} from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Cell, PieChart, Pie 
} from 'recharts';
import AdminAuthModal from '../components/AdminAuthModal';

interface ReportsProps {
  state: AppState;
  currentUser: User;
}

const COLORS = ['#ea580c', '#0891b2', '#2563eb', '#16a34a', '#9333ea', '#6366f1'];

const Reports: React.FC<ReportsProps> = ({ state, currentUser }) => {
  const [reportType, setReportType] = useState<'daily' | 'monthly' | 'yearly'>('daily');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7));
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [isAuthorized, setIsAuthorized] = useState(currentUser.role === UserRole.ADMIN);
  const [showAuthModal, setShowAuthModal] = useState(!isAuthorized);

  const filteredData = useMemo(() => {
    if (!isAuthorized) return { sales: [], totalRevenue: 0, bestSellers: [], pieData: [], movements: [] };

    let sales = state.sales || [];
    let movements = state.movements || [];

    if (reportType === 'daily') {
      const startOfDay = new Date(selectedDate).getTime();
      const endOfDay = startOfDay + (24 * 60 * 60 * 1000);
      sales = sales.filter(s => s.timestamp >= startOfDay && s.timestamp < endOfDay);
      movements = movements.filter(m => m.timestamp >= startOfDay && m.timestamp < endOfDay);
    } else if (reportType === 'monthly') {
      const [year, month] = selectedMonth.split('-').map(Number);
      const startOfMonth = new Date(year, month - 1, 1).getTime();
      const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999).getTime();
      sales = sales.filter(s => s.timestamp >= startOfMonth && s.timestamp < endOfMonth);
      movements = movements.filter(m => m.timestamp >= startOfMonth && m.timestamp < endOfMonth);
    } else if (reportType === 'yearly') {
      const startOfYear = new Date(selectedYear, 0, 1).getTime();
      const endOfYear = new Date(selectedYear, 11, 31, 23, 59, 59, 999).getTime();
      sales = sales.filter(s => s.timestamp >= startOfYear && s.timestamp < endOfYear);
      movements = movements.filter(m => m.timestamp >= startOfYear && m.timestamp < endOfYear);
    }

    const totalRevenue = sales.reduce((acc, s) => acc + s.total, 0);
    
    const itemCounts: Record<string, { qty: number, cat: string }> = {};
    sales.forEach(s => {
      s.items.forEach(item => {
        const prod = state.products.find(p => p.id === item.productId);
        const cat = prod ? prod.category : 'Outros';
        if (!itemCounts[item.productName]) {
          itemCounts[item.productName] = { qty: 0, cat };
        }
        itemCounts[item.productName].qty += item.quantity;
      });
    });

    const bestSellers = Object.entries(itemCounts)
      .map(([name, data]) => ({ name, count: data.qty, category: data.cat }))
      .sort((a, b) => b.count - a.count);

    const paymentStats = {
      [PaymentMethod.MONEY]: sales.filter(s => s.paymentMethod === PaymentMethod.MONEY).reduce((acc, s) => acc + s.total, 0),
      [PaymentMethod.PIX]: sales.filter(s => s.paymentMethod === PaymentMethod.PIX).reduce((acc, s) => acc + s.total, 0),
      [PaymentMethod.CREDIT]: sales.filter(s => s.paymentMethod === PaymentMethod.CREDIT).reduce((acc, s) => acc + s.total, 0),
      [PaymentMethod.DEBIT]: sales.filter(s => s.paymentMethod === PaymentMethod.DEBIT).reduce((acc, s) => acc + s.total, 0),
    };

    const pieData = Object.entries(paymentStats)
      .map(([name, value]) => ({ name, value }))
      .filter(item => item.value > 0);

    return { sales, totalRevenue, bestSellers, pieData, movements };
  }, [state, reportType, selectedDate, selectedMonth, selectedYear, isAuthorized]);

  if (!isAuthorized) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-20 text-center bg-gray-50">
        <div className="bg-white p-12 rounded-[3rem] shadow-2xl border border-gray-100 max-w-md">
          <span className="text-6xl mb-6 block">📊</span>
          <h2 className="text-2xl font-black text-gray-800 mb-4">Relatórios Bloqueados</h2>
          <p className="text-gray-500 font-medium mb-8">
            O acesso a dados financeiros e de estoque é restrito. Solicite a um administrador para visualizar estas informações.
          </p>
          <button 
            onClick={() => setShowAuthModal(true)}
            className="bg-orange-600 text-white px-8 py-4 rounded-2xl font-black hover:bg-orange-700 transition-all shadow-xl shadow-orange-100"
          >
            SOLICITAR ACESSO
          </button>
        </div>
        {showAuthModal && (
          <AdminAuthModal 
            onConfirm={() => setIsAuthorized(true)}
            onCancel={() => setShowAuthModal(false)}
            users={state.users}
            title="Acesso aos Relatórios"
            description="Um administrador deve autorizar a visualização do painel estratégico."
          />
        )}
      </div>
    );
  }

  const generatePDF = () => {
    // @ts-ignore
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const title = `Relatório ${reportType === 'daily' ? 'Diário' : reportType === 'monthly' ? 'Mensal' : 'Anual'}`;
    const period = reportType === 'daily' ? selectedDate : reportType === 'monthly' ? selectedMonth : selectedYear.toString();

    doc.setFontSize(20);
    doc.text("ChurrasControl - Relatório Administrativo", 14, 20);
    doc.setFontSize(12);
    doc.text(`${title} - Período: ${period}`, 14, 30);
    doc.text(`Gerado em: ${new Date().toLocaleString()}`, 14, 36);

    doc.setFontSize(14);
    doc.text("Resumo Financeiro", 14, 48);
    doc.setFontSize(10);
    doc.text(`Total Vendido: R$ ${filteredData.totalRevenue.toFixed(2)}`, 14, 55);

    // @ts-ignore
    doc.autoTable({
      startY: 95,
      head: [['Produto', 'Categoria', 'Quantidade']],
      body: filteredData.bestSellers.map(b => [b.name, b.category, b.count]),
      theme: 'striped',
      headStyles: { fillColor: [234, 88, 12] }
    });

    doc.save(`Relatorio_${reportType}_${period}.pdf`);
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-800">Relatórios Estratégicos</h1>
          <p className="text-gray-500">Auditoria completa de vendas e estoque</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 bg-white p-2 rounded-2xl border shadow-sm">
          <select 
            className="bg-gray-50 border rounded-xl px-3 py-2 text-sm font-bold outline-none"
            value={reportType}
            onChange={(e) => setReportType(e.target.value as any)}
          >
            <option value="daily">Diário</option>
            <option value="monthly">Mensal</option>
            <option value="yearly">Anual</option>
          </select>

          {reportType === 'daily' && (
            <input 
              type="date" 
              className="bg-gray-50 border rounded-xl px-3 py-2 text-sm outline-none font-bold"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          )}

          <button 
            onClick={generatePDF}
            className="bg-orange-600 text-white px-4 py-2 rounded-xl text-sm font-black hover:bg-orange-700 transition-all flex items-center gap-2"
          >
            📥 Exportar PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border shadow-sm">
          <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Faturamento Total</div>
          <div className="text-3xl font-black text-orange-600">R$ {filteredData.totalRevenue.toFixed(2)}</div>
        </div>
        <div className="bg-white p-6 rounded-3xl border shadow-sm">
          <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Vendas Realizadas</div>
          <div className="text-3xl font-black text-gray-800">{filteredData.sales.length}</div>
        </div>
        <div className="bg-white p-6 rounded-3xl border shadow-sm">
          <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Média por Venda</div>
          <div className="text-3xl font-black text-gray-800">
            R$ {filteredData.sales.length > 0 ? (filteredData.totalRevenue / filteredData.sales.length).toFixed(2) : '0.00'}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-3xl border shadow-sm min-h-[400px]">
          <h3 className="font-black text-gray-400 text-xs uppercase mb-6">Desempenho por Produto</h3>
          <div className="h-[300px]">
            {filteredData.bestSellers.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={filteredData.bestSellers.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" fontSize={10} hide />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#ea580c" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-300 italic text-sm">Sem dados para exibir</div>
            )}
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl border shadow-sm flex flex-col min-h-[400px]">
          <h3 className="font-black text-gray-400 text-xs uppercase mb-6">Meios de Pagamento</h3>
          <div className="flex-1 h-[300px]">
            {filteredData.pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={filteredData.pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {filteredData.pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val: number) => `R$ ${val.toFixed(2)}`} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-300 italic text-sm">Sem dados para exibir</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
