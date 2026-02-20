import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSidebar } from '../components/AppLayout';
import { api } from '../services/api';
import { Proposta } from '../types';
import { Menu } from 'lucide-react';
import { SearchInput } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';

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

    const getStatusVariant = (status: string) => {
        switch (status) {
            case 'Won': return 'success';
            case 'Sent': return 'primary'; // Purple in old, Primary (Green) or generic in new? Let's stick to Green/Primary for Sent if positive, or Neutral. Sent is usually neutral/blue. Let's map to existing variants. 'primary' is Green in our system. Let's use 'neutral' or make sure Badge has 'info'. Our Badge has: success, warning, error, neutral, primary. 'Sent' -> 'primary' seems okay or 'neutral'. Let's use 'primary' for Sent and 'success' for Won.
            case 'Lost': return 'error';
            case 'Draft': return 'neutral';
            case 'Pending Approval': return 'warning';
            default: return 'neutral';
        }
    };

    return (
        <div className="max-w-7xl mx-auto pb-20">
            <div className="flex items-center gap-3 mb-8">
                <button onClick={toggleMobileSidebar} className="md:hidden text-neutral-500 hover:text-neutral-900 p-1 -ml-1">
                    <Menu size={24} />
                </button>
                <h1 className="text-3xl font-bold text-neutral-900 tracking-tight">Proposal History</h1>
            </div>

            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1">
                    <SearchInput
                        placeholder="Search by client, subject or reference..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="shadow-sm"
                    />
                </div>
                <div className="w-full md:w-48">
                    <select
                        className="input-field h-full cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%236B7280%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:12px_12px] bg-[right_1rem_center] bg-no-repeat"
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                    >
                        <option value="All">All Statuses</option>
                        <option value="Draft">Draft</option>
                        <option value="Pending Approval">Pending</option>
                        <option value="Approved">Approved</option>
                        <option value="Sent">Sent</option>
                        <option value="Won">Won</option>
                        <option value="Lost">Lost</option>
                    </select>
                </div>
            </div>

            <Card noPadding className="border-neutral-200/60 shadow-card">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm min-w-[800px]">
                        <thead className="bg-neutral-50/50 border-b border-neutral-100 font-semibold text-neutral-500 text-xs uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-4 font-medium">Date</th>
                                <th className="px-6 py-4 font-medium">Reference / Client</th>
                                <th className="px-6 py-4 font-medium">Subject</th>
                                <th className="px-6 py-4 font-medium">Status</th>
                                <th className="px-6 py-4 font-medium text-right">Value</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-50">
                            {filtered.map(p => (
                                <tr key={p.internal_id || p.proposta_id} onClick={() => navigate(`/proposal/${p.internal_id || p.proposta_id}`)} className="hover:bg-neutral-50/80 cursor-pointer transition-colors group">
                                    <td className="px-6 py-5 text-neutral-500 whitespace-nowrap font-medium text-xs">{new Date(p.data_criacao).toLocaleDateString()}</td>
                                    <td className="px-6 py-5">
                                        <div className="font-bold text-neutral-900 group-hover:text-primary transition-colors">{p.proposta_id}</div>
                                        <div className="text-xs text-neutral-500 mt-0.5 font-medium">{p.cliente_nome}</div>
                                    </td>
                                    <td className="px-6 py-5 text-neutral-600 max-w-xs truncate font-medium">{p.assunto || '-'}</td>
                                    <td className="px-6 py-5">
                                        <Badge variant={getStatusVariant(p.estado) as any}>{p.estado}</Badge>
                                    </td>
                                    <td className="px-6 py-5 text-right font-bold text-neutral-900">{p.total.toFixed(0)}€</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {filtered.length === 0 && <div className="p-12 text-center text-neutral-400 italic">No proposals found matching your criteria.</div>}
            </Card>
        </div>
    );
}
