import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, FileText } from 'lucide-react';
import { api } from '../services/api';
import { Proposta } from '../types';

const STATUS_CLASS: Record<string, string> = {
    'Won': 'bg-green-50 text-green-700',
    'Lost': 'bg-red-50 text-red-700',
    'Sent': 'bg-blue-50 text-blue-700',
    'Draft': 'bg-slate-100 text-slate-600',
    'Pending Approval': 'bg-yellow-50 text-yellow-700',
    'Approved': 'bg-indigo-50 text-indigo-700',
    'Doc Generated': 'bg-purple-50 text-purple-700',
};

export default function ProposalsPage() {
    const navigate = useNavigate();
    const [proposals, setProposals] = useState<Proposta[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.getPropostas().then(data => {
            setProposals(
                data.sort((a, b) => new Date(b.data_criacao).getTime() - new Date(a.data_criacao).getTime())
            );
            setLoading(false);
        });
    }, []);

    return (
        <div className="max-w-7xl mx-auto pb-20">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Propostas</h1>
                    <p className="text-sm text-slate-500 mt-1">
                        {loading ? '…' : `${proposals.length} proposta${proposals.length !== 1 ? 's' : ''}`}
                    </p>
                </div>
                <button
                    onClick={() => navigate('/create')}
                    className="bg-slate-900 text-white px-5 py-2.5 rounded-lg font-bold text-sm hover:bg-slate-800 flex items-center gap-2 shadow-lg shadow-slate-900/20"
                >
                    <PlusCircle size={18} /> Nova Proposta
                </button>
            </div>

            {loading ? (
                <div className="p-10 text-center text-slate-400">A carregar propostas…</div>
            ) : proposals.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-xl p-16 text-center shadow-sm">
                    <FileText size={40} className="text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500 font-medium">Ainda não existem propostas</p>
                    <p className="text-slate-400 text-sm mt-1">Cria a primeira para começar.</p>
                </div>
            ) : (
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Título / Referência</th>
                                <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Cliente</th>
                                <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Valor</th>
                                <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Data</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {proposals.map(p => (
                                <tr
                                    key={p.internal_id || p.proposta_id}
                                    className="hover:bg-slate-50 cursor-pointer transition-colors"
                                    onClick={() => navigate(`/proposals/${p.internal_id || p.proposta_id}`)}
                                >
                                    <td className="px-6 py-4">
                                        <div className="font-semibold text-slate-900">{p.assunto || '(sem assunto)'}</div>
                                        <div className="text-xs text-slate-400 mt-0.5">{p.proposta_id}</div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-700">{p.cliente_nome || '—'}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${STATUS_CLASS[p.estado] ?? 'bg-slate-100 text-slate-500'}`}>
                                            {p.estado}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right font-medium text-slate-900">
                                        {p.total.toFixed(2)} €
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-500">
                                        {new Date(p.data_criacao).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
