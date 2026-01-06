
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, User, Building, ArrowRight, Menu } from 'lucide-react';
import { api } from '../services/api';
import { Cliente } from '../types';
import { useSidebar } from '../App';

const StatusBadge = ({ status }: { status: string }) => {
    const colors: any = {
        'Lead': 'bg-blue-50 text-blue-600',
        'Prospect': 'bg-yellow-50 text-yellow-600',
        'Active Client': 'bg-green-50 text-green-600',
        'Inactive Client': 'bg-slate-100 text-slate-500'
    };
    return <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[status] || 'bg-slate-100'}`}>{status}</span>;
};

export default function Clients() {
    const navigate = useNavigate();
    const { toggleMobileSidebar } = useSidebar();
    const [clients, setClients] = useState<Cliente[]>([]);
    const [filteredClients, setFilteredClients] = useState<Cliente[]>([]);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            const res = await api.getClientes();
            setClients(res);
            setFilteredClients(res);
            setLoading(false);
        };
        load();
    }, []);

    useEffect(() => {
        let res = clients;
        if (statusFilter !== 'All') {
            res = res.filter(c => c.status === statusFilter);
        }
        if (search) {
            const s = search.toLowerCase();
            res = res.filter(c => 
                c.nome_empresa.toLowerCase().includes(s) || 
                c.nome_contacto.toLowerCase().includes(s) ||
                c.email.toLowerCase().includes(s)
            );
        }
        setFilteredClients(res);
    }, [search, statusFilter, clients]);

    return (
        <div className="max-w-6xl mx-auto pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
                <div className="w-full md:w-auto">
                    <div className="flex items-center gap-3">
                        <button onClick={toggleMobileSidebar} className="md:hidden text-slate-500 hover:text-slate-900 p-1 -ml-1">
                            <Menu size={24} />
                        </button>
                        <h1 className="text-3xl font-bold text-slate-900">Clients</h1>
                    </div>
                    <p className="text-slate-500 mt-1">Manage relationships and track interactions.</p>

                    {/* Mobile Button Position */}
                    <div className="md:hidden mt-4 w-full">
                         <button 
                            onClick={() => navigate('/clients/new')}
                            className="bg-slate-900 text-white px-4 py-2 rounded-lg font-medium hover:bg-slate-800 flex items-center justify-center gap-2 transition-all shadow-lg shadow-slate-900/20 w-full md:w-auto"
                        >
                            <Plus size={18} /> Add Client
                        </button>
                    </div>
                </div>

                {/* Desktop Button Position */}
                <button 
                    onClick={() => navigate('/clients/new')}
                    className="hidden md:flex bg-slate-900 text-white px-4 py-2 rounded-lg font-medium hover:bg-slate-800 items-center gap-2 transition-all shadow-lg shadow-slate-900/20"
                >
                    <Plus size={18} /> Add Client
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6 shadow-sm">
                <div className="flex flex-col md:flex-row gap-4 items-center">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
                        <input 
                            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-slate-900 focus:outline-none"
                            placeholder="Search company, name or email..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2 overflow-x-auto w-full pb-1 md:pb-0">
                        {['All', 'Active Client', 'Prospect', 'Lead', 'Inactive Client'].map(st => (
                            <button
                                key={st}
                                onClick={() => setStatusFilter(st)}
                                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                                    statusFilter === st 
                                    ? 'bg-slate-900 text-white' 
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                            >
                                {st}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* List */}
            {loading ? (
                <div className="text-center py-20 text-slate-400">Loading clients...</div>
            ) : filteredClients.length === 0 ? (
                <div className="text-center py-20 text-slate-400 bg-white rounded-xl border border-slate-200 border-dashed">
                    No clients found.
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left min-w-[600px]">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4 font-medium text-slate-500 text-xs uppercase tracking-wider">Company / Contact</th>
                                    <th className="px-6 py-4 font-medium text-slate-500 text-xs uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 font-medium text-slate-500 text-xs uppercase tracking-wider">Last Activity</th>
                                    <th className="px-6 py-4 w-10"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredClients.map(client => (
                                    <tr 
                                        key={client.cliente_id} 
                                        onClick={() => navigate(`/client/${client.cliente_id}`)}
                                        className="hover:bg-slate-50 cursor-pointer transition-colors group"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                                                    <Building size={20} />
                                                </div>
                                                <div>
                                                    <div className="font-bold text-slate-900">{client.nome_empresa}</div>
                                                    <div className="text-sm text-slate-500">{client.nome_contacto} • {client.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <StatusBadge status={client.status} />
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-500">
                                            {client.last_contact_date ? new Date(client.last_contact_date).toLocaleDateString() : '-'}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <ArrowRight size={18} className="text-slate-300 group-hover:text-slate-600 transition-colors" />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
