
import React from 'react';
import { AppState } from '../types';

interface AuditLogsProps {
  state: AppState;
}

const AuditLogs: React.FC<AuditLogsProps> = ({ state }) => {
  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Log de Auditoria Administrativa</h1>
        <p className="text-gray-500">Rastreabilidade completa: Quem pediu vs. Quem autorizou</p>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest w-48">Data/Hora</th>
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest w-48">Operação</th>
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest w-48">Solicitado por</th>
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest w-48">Autorizado por</th>
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Detalhes da Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y text-sm">
            {state.auditLogs.map(log => (
              <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-5 text-gray-500 tabular-nums font-medium">
                  {new Date(log.timestamp).toLocaleString('pt-BR')}
                </td>
                <td className="px-6 py-5">
                  <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                    log.action.includes('ESTOQUE') ? 'bg-orange-100 text-orange-700' :
                    log.action.includes('CAIXA') ? 'bg-blue-100 text-blue-700' :
                    log.action.includes('EXCLUIR') ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {log.action}
                  </span>
                </td>
                <td className="px-6 py-5">
                  <div className="font-bold text-gray-700 flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-black">{log.solicitedByName.charAt(0)}</div>
                    {log.solicitedByName}
                  </div>
                </td>
                <td className="px-6 py-5">
                  <div className="font-bold text-green-700 flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-[10px] font-black">🛡️</div>
                    {log.authorizedByName}
                  </div>
                </td>
                <td className="px-6 py-5 text-gray-600 font-medium italic">
                  {log.details}
                  {log.newValue && (
                    <div className="mt-1 flex gap-2 items-center">
                      {log.previousValue && <span className="text-[10px] line-through text-gray-400">{log.previousValue}</span>}
                      <span className="text-[10px] font-black text-green-600">→ {log.newValue}</span>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {state.auditLogs.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-24 text-center text-gray-300 font-bold italic">
                  Nenhuma atividade administrativa registrada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AuditLogs;
