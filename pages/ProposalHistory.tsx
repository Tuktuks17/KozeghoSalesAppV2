import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Menu } from 'lucide-react';
import { api } from '../services/api';
import { Proposta } from '../types';
import { useSidebar } from '../App';

export default function ProposalHistory() {
    const navigate = useNavigate();
    const { toggleMobileSidebar } = useSidebar();
    const [allProposals, setAllProposals] = useState<Proposta[]>([]);
    const [filtered, setFiltered] = useState<Proposta[]>([]);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');

    useEffect(() => {
        const load = async () => {
            const res = await api.getPropostas();
            res.sort((a, b) => new Date(b.data_criacao).getTime() - new Date(a.data_criacao).getTime());
            setAllProposals(res);
            setFiltered(res);
        };
        load();
    }, []);

    useEffect(() => {
        let res = allProposals;
        if (statusFilter !== 'All') {
            res = res.filter(p => p.estado === statusFilter);
        }
        if (search) {
            const s = search.toLowerCase();
            res = res.filter(p => 
                p.cliente_nome.toLowerCase().includes(s) || 
                (p.assunto && p.assunto.toLowerCase().includes(s)) ||
                p.proposta_id.toLowerCase().includes(s)
            );
        }
        setFiltered(res);
    }, [search, statusFilter, allProposals]);

    return (
        <div className="max-w-6xl mx-auto pb-20">
            <div className="flex items-center gap-3 mb-6">
                <button onClick={toggleMobileSidebar} className="md:hidden text-slate-500 hover:text-slate-900 p-1 -ml-1">
                    <Menu size={24} />
                </button>
                <h1 className="text-3xl font-bold text-slate-900">Proposal History</h1>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6 flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 text-slate-400" size={18}/>
                    <input 
                        className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-slate-900 outline-none"
                        placeholder="Search by client, subject or reference..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
                <select 
                    className="border border-slate-200 rounded-lg px-4 py-2 text-sm bg-slate-50"
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                >
                    <option value="All">All Statuses</option>
                    <option value="Draft">Draft</option>
                    <option value="Pending Approval">Pending Approval</option>
                    <option value="Approved">Approved</option>
                    <option value="Sent">Sent</option>
                    <option value="Won">Won</option>
                    <option value="Lost">Lost</option>
                </select>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm min-w-[700px]">
                        <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-500 uppercase text-xs">
                            <tr>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">Reference / Client</th>
                                <th className="px-6 py-4">Subject</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Value</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filtered.map(p => (
                                <tr key={p.proposta_id} onClick={() => navigate(`/proposal/${p.proposta_id}`)} className="hover:bg-slate-50 cursor-pointer transition-colors">
                                    <td className="px-6 py-4 text-slate-600 whitespace-nowrap">{new Date(p.data_criacao).toLocaleDateString()}</td>
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-slate-900">{p.proposta_id}</div>
                                        <div className="text-xs text-slate-500">{p.cliente_nome}</div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-600 max-w-xs truncate">{p.assunto || '-'}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-md text-xs font-bold ${
                                            p.estado === 'Won' ? 'bg-green-100 text-green-700' :
                                            p.estado === 'Sent' ? 'bg-purple-100 text-purple-700' :
                                            p.estado === 'Lost' ? 'bg-red-100 text-red-700' :
                                            'bg-slate-100 text-slate-600'
                                        }`}>{p.estado}</span>
                                    </td>
                                    <td className="px-6 py-4 text-right font-bold text-slate-900">{p.total.toFixed(0)}€</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {filtered.length === 0 && <div className="p-10 text-center text-slate-400">No proposals found.</div>}
            </div>
        </div>
    );
}