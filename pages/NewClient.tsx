
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Building, User, Mail, Phone, Globe, MapPin } from 'lucide-react';
import { api } from '../services/api';
import { Cliente } from '../types';

const Section = ({ title, children }: any) => (
    <div className="mb-8">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">{title}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {children}
        </div>
    </div>
);

const Input = ({ label, icon: Icon, ...props }: any) => (
    <div className="w-full">
        {label && <label className="block text-xs font-bold text-slate-700 mb-1.5">{label}</label>}
        <div className="relative">
            {Icon && <Icon size={16} className="absolute left-3 top-3 text-slate-400" />}
            <input
                className={`w-full border border-slate-200 rounded-lg py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all placeholder:text-slate-300 ${Icon ? 'pl-10 pr-3' : 'px-3'}`}
                {...props}
            />
        </div>
    </div>
);

const Select = ({ label, options, ...props }: any) => (
    <div className="w-full">
        {label && <label className="block text-xs font-bold text-slate-700 mb-1.5">{label}</label>}
        <select className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white" {...props}>
            {options.map((o: string) => <option key={o} value={o}>{o}</option>)}
        </select>
    </div>
);

export default function NewClient() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState<Partial<Cliente>>({
        status: 'Lead',
        pais: 'Portugal',
        preferred_language: 'Portuguese',
        market: 'International',
        metrics: { total_proposals_created: 0, total_proposals_won: 0, total_value_won: 0, total_value_pipeline: 0, win_rate_percent: 0 }
    });

    // Auto-set language based on country
    useEffect(() => {
        if (!form.pais) return;
        const p = form.pais.toLowerCase().trim();
        let lang: any = 'English';
        if (p === 'portugal') lang = 'Portuguese';
        else if (p === 'spain' || p === 'espanha') lang = 'Spanish';
        else lang = 'English'; // Default

        // Only override if the user hasn't manually set it? For now, we update it reactively.
        setForm(prev => ({ ...prev, preferred_language: lang }));
    }, [form.pais]);

    const handleChange = (field: string, value: any) => {
        setForm(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async () => {
        if (!form.nome_empresa || !form.nome_contacto || !form.email) {
            alert("Please fill in the required fields: Company, Contact Name, and Email.");
            return;
        }
        setLoading(true);

        // Remove local ID generation. Let the repo handle it or return the full object.
        const payload: Cliente = {
            ...form,
            // The repo will handle metrics and created_from if needed, 
            // but here we pass what we have.
            metrics: { total_proposals_created: 0, total_proposals_won: 0, total_value_won: 0, total_value_pipeline: 0, win_rate_percent: 0 },
            created_from: 'clients_screen'
        } as Cliente;

        const createdClient = await api.createCliente(payload);
        setLoading(false);

        if (createdClient && createdClient.cliente_id) {
            navigate(`/client/${createdClient.cliente_id}`);
        } else {
            console.error("Failed to create client or no ID returned.");
            // Optionally stay on page or show error
        }
    };

    return (
        <div className="max-w-4xl mx-auto pb-20">
            {/* Header */}
            <div className="sticky top-0 z-30 bg-slate-50/95 backdrop-blur py-4 border-b border-slate-200 mb-8 flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/clients')} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                        <ArrowLeft size={20} className="text-slate-500" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Add New Client</h1>
                        <p className="text-xs text-slate-500">Create a new client record in the CRM</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button onClick={() => navigate('/clients')} className="px-4 py-2 text-slate-600 font-medium text-sm hover:bg-slate-200 rounded-lg">Cancel</button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="bg-slate-900 text-white px-6 py-2 rounded-lg font-bold text-sm hover:bg-slate-800 flex items-center gap-2 shadow-lg shadow-slate-900/20"
                    >
                        {loading ? 'Saving...' : <><Save size={18} /> Save Client</>}
                    </button>
                </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm">
                <Section title="Primary Info (Required)">
                    <Input
                        label="Company Name" icon={Building} placeholder="e.g. Acme Corp"
                        value={form.nome_empresa || ''} onChange={(e: any) => handleChange('nome_empresa', e.target.value)} autoFocus
                    />
                    <Input
                        label="Contact Name" icon={User} placeholder="e.g. John Doe"
                        value={form.nome_contacto || ''} onChange={(e: any) => handleChange('nome_contacto', e.target.value)}
                    />
                    <Input
                        label="Email" icon={Mail} type="email" placeholder="john@acme.com"
                        value={form.email || ''} onChange={(e: any) => handleChange('email', e.target.value)}
                    />
                    <Input
                        label="Phone" icon={Phone} placeholder="+1 234 567 890"
                        value={form.telefone || ''} onChange={(e: any) => handleChange('telefone', e.target.value)}
                    />
                </Section>

                <div className="h-px bg-slate-100 my-8"></div>

                <Section title="Company Details">
                    <Input
                        label="Website" icon={Globe} placeholder="www.acme.com"
                        value={form.website || ''} onChange={(e: any) => handleChange('website', e.target.value)}
                    />
                    <Input
                        label="Tax ID (NIF)" placeholder="Tax ID / VAT Number"
                        value={form.nif || ''} onChange={(e: any) => handleChange('nif', e.target.value)}
                    />
                    <Input
                        label="Industry" placeholder="e.g. Technology, Retail..."
                        value={form.segmento || ''} onChange={(e: any) => handleChange('segmento', e.target.value)}
                    />
                    <Input
                        label="Company Size" placeholder="e.g. 50-100 employees"
                        value={form.company_size || ''} onChange={(e: any) => handleChange('company_size', e.target.value)}
                    />
                </Section>

                <div className="h-px bg-slate-100 my-8"></div>

                <Section title="Address & Status">
                    <div className="md:col-span-2">
                        <Input
                            label="Billing Address" icon={MapPin} placeholder="Full address..."
                            value={form.morada_faturacao || ''} onChange={(e: any) => handleChange('morada_faturacao', e.target.value)}
                        />
                    </div>
                    <Input
                        label="Country" placeholder="Country"
                        value={form.pais || ''} onChange={(e: any) => handleChange('pais', e.target.value)}
                    />

                    <Select
                        label="Preferred Proposal Language"
                        options={['Portuguese', 'English', 'Spanish', 'French']}
                        value={form.preferred_language} onChange={(e: any) => handleChange('preferred_language', e.target.value)}
                    />

                    <Select
                        label="Market"
                        options={['National', 'International']}
                        value={form.market} onChange={(e: any) => handleChange('market', e.target.value)}
                    />

                    <Select
                        label="Client Status"
                        options={['Lead', 'Prospect', 'Active Client', 'Inactive Client']}
                        value={form.status} onChange={(e: any) => handleChange('status', e.target.value)}
                    />
                </Section>

                <div className="h-px bg-slate-100 my-8"></div>

                <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Internal Notes</label>
                    <textarea
                        className="w-full border border-slate-200 rounded-lg px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 min-h-[120px]"
                        placeholder="Add any initial notes about this client..."
                        value={form.notes || ''}
                        onChange={(e: any) => handleChange('notes', e.target.value)}
                    />
                </div>
            </div>
        </div>
    );
}
