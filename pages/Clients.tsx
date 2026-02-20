import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSidebar } from '../components/AppLayout';
import { api } from '../services/api';
import { Cliente } from '../types';
import { Menu, Plus, ArrowRight } from 'lucide-react';
import { SearchInput } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { SegmentedControl } from '../components/ui/SegmentedControl';

const StatusBadge = ({ status }: { status: string }) => {
    const variants: any = {
        'Lead': 'neutral',
        'Prospect': 'warning',
        'Active Client': 'success',
        'Inactive Client': 'neutral'
    };
    return <Badge variant={variants[status] || 'neutral'}>{status}</Badge>;
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

    const filterOptions = [
        { id: 'All', label: 'All' },
        { id: 'Active Client', label: 'Active' },
        { id: 'Prospect', label: 'Prospects' },
        { id: 'Lead', label: 'Leads' },
        { id: 'Inactive Client', label: 'Inactive' }
    ];

    return (
        <div className="max-w-7xl mx-auto pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
                <div className="w-full md:w-auto">
                    <div className="flex items-center gap-3">
                        <button onClick={toggleMobileSidebar} className="md:hidden text-neutral-500 hover:text-neutral-900 p-1 -ml-1">
                            <Menu size={24} />
                        </button>
                        <h1 className="text-3xl font-bold text-neutral-900 tracking-tight">Clients</h1>
                    </div>
                    <p className="text-neutral-500 mt-2 font-medium">Manage relationships and track interactions.</p>

                    {/* Mobile Button Position */}
                    <div className="md:hidden mt-4 w-full">
                        <Button onClick={() => navigate('/clients/new')} leftIcon={<Plus size={18} />} className="w-full shadow-lg shadow-primary/20">
                            Add Client
                        </Button>
                    </div>
                </div>

                {/* Desktop Button Position */}
                <div className="hidden md:block">
                    <Button onClick={() => navigate('/clients/new')} leftIcon={<Plus size={18} />} className="shadow-lg shadow-primary/20">
                        Add Client
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 items-center mb-6">
                <div className="relative w-full md:w-96">
                    <SearchInput
                        placeholder="Search company, name or email..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="shadow-sm"
                    />
                </div>
                <div className="w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
                    <SegmentedControl
                        options={filterOptions}
                        value={statusFilter}
                        onChange={setStatusFilter}
                    />
                </div>
            </div>

            {/* List */}
            {loading ? (
                <div className="text-center py-20 text-neutral-400">Loading clients...</div>
            ) : filteredClients.length === 0 ? (
                <Card className="text-center py-20 text-neutral-400 border-dashed bg-neutral-50/50">
                    No clients found matching your search.
                </Card>
            ) : (
                <Card noPadding className="border-neutral-200/60 shadow-card">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left min-w-[700px]">
                            <thead className="bg-neutral-50/50 border-b border-neutral-100 font-semibold text-neutral-500 text-xs uppercase tracking-wider">
                                <tr>
                                    <th className="px-6 py-4 font-medium">Company / Contact</th>
                                    <th className="px-6 py-4 font-medium">Status</th>
                                    <th className="px-6 py-4 font-medium">Last Activity</th>
                                    <th className="px-6 py-4 w-10"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-50">
                                {filteredClients.map(client => (
                                    <tr
                                        key={client.cliente_id}
                                        onClick={() => navigate(`/client/${client.cliente_id}`)}
                                        className="hover:bg-neutral-50/80 cursor-pointer transition-colors group"
                                    >
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center text-primary-600 font-bold text-sm">
                                                    {client.nome_empresa.substring(0, 2).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-neutral-900 group-hover:text-primary transition-colors">{client.nome_empresa}</div>
                                                    <div className="text-sm text-neutral-500 font-medium">{client.nome_contacto} • {client.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <StatusBadge status={client.status} />
                                        </td>
                                        <td className="px-6 py-5 text-sm text-neutral-500 font-medium">
                                            {client.last_contact_date ? new Date(client.last_contact_date).toLocaleDateString() : '-'}
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <ArrowRight size={18} className="text-neutral-300 group-hover:text-primary transition-colors" />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}
        </div>
    );
}
