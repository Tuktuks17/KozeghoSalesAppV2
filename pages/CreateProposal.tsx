import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
    Search, Plus, X, ArrowLeft, FileText, Menu, AlertCircle, Save, Check, User, Building, Mail, Phone, Globe, Calendar, Briefcase
} from 'lucide-react';
import { api } from '../services/api';
import { Button } from '../components/ui/Button';
import { Input, SearchInput, TextArea } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Cliente, Produto, PropostaLinha, Proposta, StandardModel } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useSidebar } from '../components/AppLayout';
import { ConfigureItemModal } from '../components/ConfigureItemModal';
import { productCatalog } from '../services/productCatalog';
import { calculateProposalTotal } from '../services/pricing';

const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(val);

export default function CreateProposal() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { user } = useAuth();
    const { toggleMobileSidebar } = useSidebar();

    // Core Data
    const [loading, setLoading] = useState(false);
    const [dataLoading, setDataLoading] = useState(true);
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [produtos, setProdutos] = useState<Produto[]>([]);

    // Form State
    const [currentProposalId, setCurrentProposalId] = useState<string>('');
    const [subject, setSubject] = useState('');
    const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);

    // New Client Form State
    const [isCreatingClient, setIsCreatingClient] = useState(false);
    const [newClient, setNewClient] = useState({
        nome_empresa: '', nome_contacto: '', email: '', telefone: '',
        pais: 'Portugal', preferred_language: 'Portuguese', market: 'International'
    });

    const [lines, setLines] = useState<Partial<PropostaLinha>[]>([]);
    const [meta, setMeta] = useState({
        validity: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
        deliveryWeeks: '',
        deliveryConditions: 'Digital Delivery',
        packaging: 'Standard', // Standard | Ocean freight
        paymentTerms: '30 Days Net',
        language: 'English',
        market: 'International' as any,
        notes: ''
    });

    // Modal State
    const [modalProduct, setModalProduct] = useState<Produto | null>(null);
    const [productSearch, setProductSearch] = useState('');

    // Init Logic
    useEffect(() => {
        const load = async () => {
            const [c, p] = await Promise.all([api.getClientes(), api.getProdutos()]);
            setClientes(c);
            setProdutos(p);
            console.log("Catalog items loaded:", p.length);

            const cid = searchParams.get('clientId');
            if (cid) {
                const target = c.find(cl => cl.cliente_id === cid);
                if (target) {
                    setSelectedCliente(target);
                    setMeta(m => ({ ...m, language: target.preferred_language || 'English', market: target.market || 'International' }));
                }
            }
            setDataLoading(false);
        };
        load();
    }, [searchParams]);

    // Totals
    const getTotals = () => {
        // Map to expected structure and ensure numbers
        const calculated = calculateProposalTotal(lines.map(l => ({
            total_linha: l.total_linha || 0
        })));

        // DEV-ONLY check
        console.log("💰 Proposal Check (No VAT):", { lines: lines.length, calculated });

        return calculated;
    };

    const handleCreateClient = async () => {
        if (!newClient.nome_empresa || !newClient.nome_contacto || !newClient.email) {
            alert("Please fill required fields (Company, Contact, Email)"); return;
        }
        setLoading(true);
        try {
            const c: Cliente = {
                cliente_id: 'C-' + Date.now(),
                nome_empresa: newClient.nome_empresa,
                nome_contacto: newClient.nome_contacto,
                email: newClient.email,
                telefone: newClient.telefone,
                pais: newClient.pais,
                preferred_language: newClient.preferred_language as any,
                market: newClient.market as any,
                status: 'Prospect',
                created_from: 'new_proposal_flow',
                nif: '', morada_faturacao: '', morada_entrega: '', segmento: 'General',
                data_criacao: new Date().toISOString(),
                metrics: { total_proposals_created: 0, total_proposals_won: 0, total_value_won: 0, total_value_pipeline: 0, win_rate_percent: 0 }
            };

            const createdClient = await api.createCliente(c);
            setClientes([...clientes, createdClient]);
            setSelectedCliente(createdClient);
            setMeta(m => ({ ...m, language: createdClient.preferred_language, market: createdClient.market }));
            setIsCreatingClient(false);
        } catch (e) {
            console.error(e);
            alert('Error creating client');
        } finally {
            setLoading(false);
        }
    };

    const handleAddLine = (lineItem: any) => {
        setLines([...lines, {
            linha_id: 'L-' + Date.now(),
            ...lineItem
        }]);
    };

    const buildProposalObject = () => {
        if (!user || !selectedCliente) {
            alert("Please select a client first.");
            return null;
        }
        const t = getTotals();
        return {
            proposal: {
                proposta_id: currentProposalId,
                internal_id: currentProposalId || undefined,
                assunto: subject,
                cliente_id: selectedCliente.cliente_id,
                cliente_nome: selectedCliente.nome_empresa,
                cliente_email: selectedCliente.email,
                cliente_telefone: selectedCliente.telefone,
                nif: selectedCliente.nif,
                comercial_email: user.email,
                comercial_nome: user.name,
                estado: 'Draft',
                total: t.total,
                subtotal: t.subtotal,
                iva_percent: 0,
                iva_valor: 0,
                moeda: 'EUR',
                data_criacao: new Date().toISOString(),
                data_validade: meta.validity,
                condicoes_pagamento: meta.paymentTerms,
                condicoes_entrega: meta.deliveryConditions,
                tipo_embalagem: meta.packaging as any,
                prazo_entrega_semanas: Number(meta.deliveryWeeks),
                idioma: meta.language as any,
                mercado: meta.market,
                observacoes_para_cliente: meta.notes,
                observacoes_internas: '',
                resultado: 'Open',
                desconto_global_percent: 0
            } as Proposta,
            lines: lines as PropostaLinha[]
        };
    };

    const handleSave = async (redirect = false) => {
        const data = buildProposalObject();
        if (!data) return;
        setLoading(true);
        try {
            const id = await api.saveProposta(data.proposal, data.lines, true); // true = draft mode usually
            setCurrentProposalId(id);
            if (redirect) {
                const res = await api.generateProposalDocument(id);
                if (res.success) navigate(`/proposal/${id}/document`); // Assuming this route exists or logic is handled
                else alert('Error generating doc: ' + res.error);
            } else {
                alert('Draft saved successfully!');
            }
        } catch (e) { console.error(e); alert('Error saving'); }
        finally { setLoading(false); }
    };

    if (dataLoading) return <div className="h-screen flex items-center justify-center text-slate-500">Loading resources...</div>;

    return (
        <div className="max-w-[1600px] mx-auto min-h-screen pb-32 p-4 md:p-8">
            <ConfigureItemModal
                isOpen={!!modalProduct}
                product={modalProduct}
                onClose={() => setModalProduct(null)}
                onConfirm={handleAddLine}
            />

            {/* Top Bar (Mobile) */}
            <div className="md:hidden flex justify-between items-center mb-6">
                <button onClick={toggleMobileSidebar} className="text-neutral-500"><Menu /></button>
                <div className="font-bold text-neutral-900">New Proposal</div>
                <div className="w-6"></div>
            </div>

            <div className="flex flex-col lg:flex-row gap-8 items-start">

                {/* Left Column: Form Content */}
                <div className="flex-1 w-full space-y-8">

                    {/* Header Section */}
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="pl-0 hover:bg-transparent text-neutral-400 hover:text-neutral-900">
                                <ArrowLeft size={16} className="mr-1" /> Back
                            </Button>
                        </div>
                        <h1 className="text-4xl font-bold text-neutral-900 tracking-tight">New Proposal</h1>
                        <p className="text-neutral-500 mt-2 font-medium flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-green-500"></span>
                            Creating as {user?.name}
                        </p>
                    </div>

                    {/* Section A: Subject */}
                    <Card title="Proposal Details">
                        <Input
                            label="Subject"
                            placeholder="e.g. Q1 Server Upgrade for Acme Corp"
                            value={subject}
                            onChange={(e: any) => setSubject(e.target.value)}
                            className="text-lg"
                        />
                    </Card>

                    {/* Section B: Client */}
                    <Card title="Client Information">
                        {!selectedCliente ? (
                            isCreatingClient ? (
                                <div className="bg-neutral-50/50 rounded-xl p-6 border border-neutral-200 animate-fade-in">
                                    <div className="flex justify-between items-center mb-6 border-b border-neutral-200 pb-4">
                                        <h3 className="font-bold text-neutral-900 flex items-center gap-2">
                                            <Briefcase size={18} className="text-primary" />
                                            New Client Details
                                        </h3>
                                        <Button variant="ghost" size="sm" onClick={() => setIsCreatingClient(false)}>Cancel</Button>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <Input
                                            label="Company Name"
                                            value={newClient.nome_empresa}
                                            onChange={(e: any) => setNewClient({ ...newClient, nome_empresa: e.target.value })}
                                        />
                                        <Input
                                            label="Contact Name"
                                            value={newClient.nome_contacto}
                                            onChange={(e: any) => setNewClient({ ...newClient, nome_contacto: e.target.value })}
                                        />
                                        <Input
                                            label="Email"
                                            type="email"
                                            value={newClient.email}
                                            onChange={(e: any) => setNewClient({ ...newClient, email: e.target.value })}
                                        />
                                        <Input
                                            label="Phone (optional)"
                                            value={newClient.telefone}
                                            onChange={(e: any) => setNewClient({ ...newClient, telefone: e.target.value })}
                                        />
                                        <div>
                                            <label className="block text-xs font-bold text-neutral-500 mb-1.5 uppercase tracking-wider">Language</label>
                                            <select
                                                className="input-field bg-white"
                                                value={newClient.preferred_language}
                                                onChange={e => setNewClient({ ...newClient, preferred_language: e.target.value })}
                                            >
                                                <option>English</option><option>Portuguese</option><option>Spanish</option><option>French</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-neutral-500 mb-1.5 uppercase tracking-wider">Market</label>
                                            <select
                                                className="input-field bg-white"
                                                value={newClient.market}
                                                onChange={e => setNewClient({ ...newClient, market: e.target.value })}
                                            >
                                                <option>International</option><option>National</option>
                                            </select>
                                        </div>
                                        <div className="md:col-span-2 pt-4">
                                            <Button onClick={handleCreateClient} disabled={loading} className="w-full" size="lg">
                                                {loading ? 'Creating...' : 'Create & Select Client'}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="relative">
                                        <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Search Existing Client</label>
                                        <div className="relative">
                                            <Search className="absolute left-4 top-3.5 text-neutral-400 pointer-events-none" size={20} />
                                            <select
                                                className="w-full bg-white border border-neutral-200 rounded-xl pl-12 pr-4 py-3 outline-none appearance-none text-neutral-700 font-medium cursor-pointer focus:ring-2 focus:ring-primary hover:border-neutral-300 transition-colors"
                                                onChange={(e) => {
                                                    const c = clientes.find(cl => cl.cliente_id === e.target.value);
                                                    if (c) {
                                                        setSelectedCliente(c);
                                                        setMeta(m => ({ ...m, language: c.preferred_language || 'English', market: c.market || 'International' }));
                                                    }
                                                }}
                                                defaultValue=""
                                            >
                                                <option value="" disabled>Select a client...</option>
                                                {clientes.map(c => <option key={c.cliente_id} value={c.cliente_id}>{c.nome_empresa} ({c.nome_contacto})</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className="h-px bg-neutral-100 flex-1"></div>
                                        <span className="text-xs font-bold text-neutral-300 uppercase tracking-widest">OR</span>
                                        <div className="h-px bg-neutral-100 flex-1"></div>
                                    </div>

                                    <Button
                                        variant="outline"
                                        onClick={() => setIsCreatingClient(true)}
                                        className="w-full border-dashed border-2 py-8 text-neutral-500 hover:text-neutral-700 hover:border-neutral-400 hover:bg-neutral-50"
                                        leftIcon={<Plus size={20} />}
                                    >
                                        Create New Client
                                    </Button>
                                </div>
                            )
                        ) : (
                            <div className="bg-primary-50/30 border border-primary-100/50 rounded-xl p-5 flex justify-between items-center group hover:border-primary-200 transition-all cursor-default">
                                <div className="flex items-center gap-5">
                                    <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center text-primary font-bold text-lg border border-primary-100">
                                        {selectedCliente.nome_empresa.substring(0, 2).toUpperCase()}
                                    </div>
                                    <div>
                                        <div className="font-bold text-neutral-900 text-lg">{selectedCliente.nome_empresa}</div>
                                        <div className="text-sm text-neutral-500 flex items-center gap-3 mt-1">
                                            <span className="flex items-center gap-1"><User size={14} /> {selectedCliente.nome_contacto}</span>
                                            <span className="w-1 h-1 rounded-full bg-neutral-300"></span>
                                            <span className="flex items-center gap-1"><Mail size={14} /> {selectedCliente.email}</span>
                                        </div>
                                    </div>
                                </div>
                                <Button variant="ghost" onClick={() => setSelectedCliente(null)} className="text-primary hover:text-primary-700 hover:bg-primary-50">Change</Button>
                            </div>
                        )}
                    </Card>

                    {/* Section C: Products */}
                    <Card title="Products & Items" action={
                        <SearchInput
                            placeholder="Search catalog..."
                            value={productSearch}
                            onChange={e => setProductSearch(e.target.value)}
                            className="w-64"
                        />
                    }>
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                {produtos.filter(p => !productSearch || p.nome_produto.toLowerCase().includes(productSearch.toLowerCase()) || p.family.toLowerCase().includes(productSearch.toLowerCase())).map(p => (
                                    <button
                                        key={p.produto_id}
                                        onClick={() => setModalProduct(p)}
                                        className="text-left p-4 border border-neutral-200 rounded-xl hover:border-primary-300 hover:ring-1 hover:ring-primary-300 hover:shadow-md transition-all group bg-white relative overflow-hidden"
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="font-bold text-neutral-800 text-sm group-hover:text-primary transition-colors">{p.nome_produto}</span>
                                        </div>
                                        <div className="text-xs text-neutral-500 line-clamp-2 min-h-[2.5em]">{p.descricao_curta}</div>
                                        <div className="mt-3 text-xs font-bold text-primary flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0">
                                            <Plus size={14} />
                                            {['CS', 'CL-D', 'CSL', 'PD', 'BS', 'BL', 'KDC'].includes(p.family) ? 'Configure Item' : 'Add to Proposal'}
                                        </div>
                                    </button>
                                ))}
                            </div>

                            {lines.length > 0 && (
                                <div className="border border-neutral-200 rounded-xl overflow-hidden shadow-sm">
                                    <table className="w-full text-sm">
                                        <thead className="bg-neutral-50/80 border-b border-neutral-200 text-left">
                                            <tr>
                                                <th className="px-5 py-3 font-semibold text-neutral-500 text-xs uppercase tracking-wider">Item</th>
                                                <th className="px-5 py-3 font-semibold text-neutral-500 text-xs uppercase tracking-wider text-right">Qty</th>
                                                <th className="px-5 py-3 font-semibold text-neutral-500 text-xs uppercase tracking-wider text-right">Price</th>
                                                <th className="px-5 py-3 font-semibold text-neutral-500 text-xs uppercase tracking-wider text-right">Total</th>
                                                <th className="w-10"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-neutral-100 bg-white">
                                            {lines.map((l, idx) => (
                                                <tr key={idx} className="hover:bg-neutral-50/50 transition-colors">
                                                    <td className="px-5 py-4">
                                                        <div className="font-bold text-neutral-900">{l.produto_nome}</div>
                                                        <div className="text-xs text-neutral-500">{l.descricao_linha}</div>
                                                        {l.selectedOptionCodes && l.selectedOptionCodes.length > 0 && (
                                                            <div className="text-xs text-primary-600 mt-1 font-medium bg-primary-50 inline-block px-2 py-0.5 rounded">
                                                                {l.selectedOptionCodes.length} options configured
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-5 py-4 text-right text-neutral-600 font-medium">{l.quantidade}</td>
                                                    <td className="px-5 py-4 text-right text-neutral-500">{formatCurrency(l.preco_unitario || 0)}</td>
                                                    <td className="px-5 py-4 text-right font-bold text-neutral-900">{formatCurrency(l.total_linha || 0)}</td>
                                                    <td className="px-5 py-4 text-right">
                                                        <button onClick={() => setLines(lines.filter((_, i) => i !== idx))} className="text-neutral-300 hover:text-red-500 transition-colors p-1"><X size={16} /></button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot className="bg-neutral-50 border-t border-neutral-200">
                                            <tr>
                                                <td colSpan={3} className="px-5 py-3 text-right font-bold text-neutral-600 text-xs uppercase tracking-wider text-right">Subtotal</td>
                                                <td className="px-5 py-3 text-right font-bold text-neutral-900">{formatCurrency(lines.reduce((acc, l) => acc + (l.total_linha || 0), 0))}</td>
                                                <td></td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* Section D: Details */}
                    <Card title="Terms & Conditions">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <Input
                                label="Validity Date"
                                type="date"
                                value={meta.validity}
                                onChange={(e: any) => setMeta({ ...meta, validity: e.target.value })}
                            />

                            <Input
                                label="Delivery Time (Weeks)"
                                type="number"
                                placeholder="e.g. 2"
                                value={meta.deliveryWeeks}
                                onChange={(e: any) => setMeta({ ...meta, deliveryWeeks: e.target.value })}
                            />

                            <div>
                                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-3">Packaging</label>
                                <div className="flex gap-6">
                                    <label className="flex items-center gap-3 cursor-pointer group">
                                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${meta.packaging === 'Standard' ? 'border-primary bg-primary text-white' : 'border-neutral-300 bg-white group-hover:border-neutral-400'}`}>
                                            {meta.packaging === 'Standard' && <div className="w-2 h-2 bg-white rounded-full" />}
                                        </div>
                                        <input type="radio" name="packaging" checked={meta.packaging === 'Standard'} onChange={() => setMeta({ ...meta, packaging: 'Standard' })} className="hidden" />
                                        <span className="text-sm font-medium text-neutral-700">Standard</span>
                                    </label>
                                    <label className="flex items-center gap-3 cursor-pointer group">
                                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${meta.packaging === 'Ocean freight' ? 'border-primary bg-primary text-white' : 'border-neutral-300 bg-white group-hover:border-neutral-400'}`}>
                                            {meta.packaging === 'Ocean freight' && <div className="w-2 h-2 bg-white rounded-full" />}
                                        </div>
                                        <input type="radio" name="packaging" checked={meta.packaging === 'Ocean freight'} onChange={() => setMeta({ ...meta, packaging: 'Ocean freight' })} className="hidden" />
                                        <span className="text-sm font-medium text-neutral-700">Ocean freight</span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
                            <TextArea
                                label="Delivery Conditions"
                                value={meta.deliveryConditions}
                                onChange={(e: any) => setMeta({ ...meta, deliveryConditions: e.target.value })}
                                className="min-h-[100px]"
                            />
                            <TextArea
                                label="Payment Terms"
                                value={meta.paymentTerms}
                                onChange={(e: any) => setMeta({ ...meta, paymentTerms: e.target.value })}
                                className="min-h-[100px]"
                            />
                        </div>
                    </Card>

                    {/* Section E: Notes */}
                    <Card title="Additional Notes">
                        <TextArea
                            placeholder="Internal notes or extra comments for the client..."
                            value={meta.notes}
                            onChange={(e: any) => setMeta({ ...meta, notes: e.target.value })}
                            className="min-h-[120px]"
                        />
                    </Card>
                </div>

                {/* Right Column: Sticky Summary */}
                <div className="lg:w-[400px] shrink-0">
                    <div className="sticky top-6">
                        <Card noPadding className="shadow-2xl shadow-neutral-200/50 border-neutral-200/80 overflow-hidden">
                            <div className="bg-neutral-900 p-6 text-white">
                                <h2 className="text-lg font-bold mb-1">Proposal Summary</h2>
                                <p className="text-neutral-400 text-sm">Review details before saving</p>
                            </div>

                            <div className="p-6 space-y-6">
                                <div className="space-y-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-neutral-500">Subject</span>
                                        <span className={`font-medium text-right truncate max-w-[180px] ${!subject ? 'text-neutral-300 italic' : 'text-neutral-900'}`}>{subject || '(No subject)'}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-neutral-500">Language</span>
                                        <span className="font-medium text-neutral-900 text-right">{meta.language}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-neutral-500">Market</span>
                                        <span className="font-medium text-neutral-900 text-right">{meta.market}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-neutral-500">Valid until</span>
                                        <span className="font-medium text-neutral-900 text-right">{new Date(meta.validity).toLocaleDateString()}</span>
                                    </div>
                                    {/* <div className="h-px bg-neutral-100 my-2"></div> */}
                                </div>

                                <div className="border-t border-neutral-100 pt-4">
                                    <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2 block">Client</label>
                                    {selectedCliente ? (
                                        <div>
                                            <div className="font-bold text-neutral-900">{selectedCliente.nome_empresa}</div>
                                            <div className="text-xs text-neutral-500">{selectedCliente.nome_contacto}</div>
                                        </div>
                                    ) : (
                                        <div className="text-sm text-neutral-400 italic">No client selected yet</div>
                                    )}
                                </div>

                                <div className="border-t border-neutral-100 pt-4">
                                    <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-3 block">Items ({lines.length})</label>
                                    {lines.length === 0 ? (
                                        <div className="text-center py-4 text-neutral-300 text-sm italic bg-neutral-50 rounded-lg border border-neutral-100 border-dashed">No items added</div>
                                    ) : (
                                        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                            {lines.map((l, i) => (
                                                <div key={i} className="border-b border-neutral-100 pb-3 last:border-0 last:pb-0">
                                                    {/* Main Item */}
                                                    <div className="flex justify-between items-start text-sm mb-1.5 ">
                                                        <span className="text-neutral-800 font-bold truncate max-w-[200px]">
                                                            {l.quantidade}x {l.produto_nome}
                                                        </span>
                                                        <span className="font-bold text-neutral-900">{formatCurrency(l.total_linha || 0)}</span>
                                                    </div>

                                                    {/* Base Price Breakout (Optional, but good for clarity if options exist) */}
                                                    {/* <div className="flex justify-between text-xs text-neutral-400 pl-4 mb-1">
                                                        <span>Base Model</span>
                                                        <span>{formatCurrency(l.base_price_eur || 0)}</span>
                                                    </div> */}

                                                    {/* Options List */}
                                                    {l.selectedOptionCodes && l.selectedOptionCodes.length > 0 && (
                                                        <div className="space-y-1 pl-4 border-l-2 border-neutral-100 ml-1">
                                                            {l.selectedOptionCodes.map(code => {
                                                                const opt = productCatalog.getOption(code);
                                                                return opt ? (
                                                                    <div key={code} className="flex justify-between text-xs text-neutral-500">
                                                                        <span className="truncate max-w-[180px]">+ {opt.label}</span>
                                                                        <span>{opt.priceEUR > 0 ? formatCurrency(opt.priceEUR) : 'incl.'}</span>
                                                                    </div>
                                                                ) : null;
                                                            })}
                                                        </div>
                                                    )}

                                                    {/* Discount display */}
                                                    {l.desconto_percent ? (
                                                        <div className="flex justify-between text-xs text-red-500 pl-4 mt-1 font-medium">
                                                            <span>Discount ({l.desconto_percent}%)</span>
                                                            <span>-{formatCurrency(((l.preco_unitario || 0) * (l.quantidade || 0) * (l.desconto_percent || 0)) / 100)}</span>
                                                        </div>
                                                    ) : null}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="border-t-2 border-dashed border-neutral-200 pt-6 mt-2">
                                    <div className="flex justify-between items-end mb-8">
                                        <span className="font-bold text-neutral-900 text-lg">TOTAL</span>
                                        <span className="text-3xl font-bold text-primary tracking-tight">{formatCurrency(getTotals().total)}</span>
                                    </div>

                                    <div className="space-y-3">
                                        <Button
                                            variant="secondary"
                                            onClick={() => handleSave(false)}
                                            disabled={loading}
                                            className="w-full justify-center"
                                            leftIcon={<Save size={18} />}
                                        >
                                            Save Draft
                                        </Button>
                                        <Button
                                            onClick={() => handleSave(true)}
                                            disabled={loading}
                                            className="w-full justify-center shadow-lg shadow-primary/25"
                                            leftIcon={<FileText size={18} />}
                                            size="lg"
                                        >
                                            {loading ? 'Processing...' : 'Create Document'}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>

            </div>

        </div>
    );
}
