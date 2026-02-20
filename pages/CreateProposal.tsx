
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
    Search, Plus, X, ArrowRight, ArrowLeft, CheckCircle, FileText, Menu, AlertCircle
} from 'lucide-react';
import { api } from '../services/api';
import { Cliente, Produto, PropostaLinha, Proposta, AvailableOption, StandardModel } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useSidebar } from '../App';
import { productCatalog } from '../services/productCatalog';

// UI Components
const StepIndicator = ({ step, current }: { step: number, current: number }) => {
    const isCompleted = step < current;
    const isCurrent = step === current;

    return (
        <div className={`flex flex-col items-center flex-1 relative ${isCurrent ? 'text-primary' : isCompleted ? 'text-primary/70' : 'text-slate-300'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm mb-2 z-10 
                ${isCurrent ? 'bg-primary text-white shadow-lg shadow-primary/30 ring-4 ring-white' :
                    isCompleted ? 'bg-primary/20 text-primary' : 'bg-slate-100 text-slate-400'}`}>
                {isCompleted ? <CheckCircle size={16} /> : step + 1}
            </div>
            <span className="text-xs font-bold uppercase tracking-wider">{['Client', 'Basics', 'Items', 'Review'][step]}</span>
            {step < 3 && (
                <div className={`absolute top-4 left-1/2 w-full h-[2px] -z-0 ${isCompleted ? 'bg-primary/30' : 'bg-slate-100'}`}></div>
            )}
        </div>
    );
};

const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(val);

const CONFIGURABLE_FAMILIES = ['CS', 'CL-D', 'CSL', 'PD', 'BS', 'BL', 'KDC', 'TCP', 'TCI', 'TCC', 'TPP', 'DEP', 'AMR-S', 'AMR-T', 'APL', 'ATL', 'AFL'];

export default function CreateProposal() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { user } = useAuth();
    const { toggleMobileSidebar } = useSidebar();

    // Steps: 0=Client, 1=Basics, 2=Items, 3=Review
    const [currentStep, setCurrentStep] = useState(0);

    const [loading, setLoading] = useState(false);
    const [dataLoading, setDataLoading] = useState(true);
    const [draftSaving, setDraftSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);

    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [produtos, setProdutos] = useState<Produto[]>([]);

    // State
    const [currentProposalId, setCurrentProposalId] = useState<string>('');
    const [subject, setSubject] = useState('');
    const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
    const [showNewClientForm, setShowNewClientForm] = useState(false);

    const [newClient, setNewClient] = useState({
        name: '', email: '', company: '', phone: '', country: '',
        language: 'English', market: 'International' as any, internal_notes: ''
    });

    const [lines, setLines] = useState<Partial<PropostaLinha>[]>([]);
    const [meta, setMeta] = useState({
        validity: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
        deliveryWeeks: '',
        deliveryConditions: 'Digital Delivery',
        packaging: 'Standard',
        paymentTerms: '30 Days Net',
        language: 'English',
        market: 'International' as any,
        notes: ''
    });

    // Item Config Modals
    const [productSearch, setProductSearch] = useState('');
    const [modalProduct, setModalProduct] = useState<Produto | null>(null);
    const [selectedStandardModel, setSelectedStandardModel] = useState<StandardModel | null>(null);
    const [availableStandardModels, setAvailableStandardModels] = useState<StandardModel[]>([]);
    const [modalLine, setModalLine] = useState({ qty: 1, discount: 0, extras: '', notes: '', selectedOptions: [] as string[] });
    const [availableOptions, setAvailableOptions] = useState<AvailableOption[]>([]);

    // Init Logic
    useEffect(() => {
        const load = async () => {
            const [c, p] = await Promise.all([api.getClientes(), api.getProdutos()]);
            setClientes(c);
            setProdutos(p);
            const cid = searchParams.get('clientId');
            if (cid) {
                const target = c.find(cl => cl.cliente_id === cid);
                if (target) {
                    setSelectedCliente(target);
                    // auto-next if valid
                    setMeta(m => ({ ...m, language: target.preferred_language || 'English', market: target.market || 'International' }));
                }
            }
            setDataLoading(false);
        };
        load();
    }, [searchParams]);

    // Calculate totals helper
    const getTotals = () => {
        const subtotal = lines.reduce((acc, l) => acc + (l.total_linha || 0), 0);
        const vat = subtotal * 0.23;
        return { subtotal, vat, total: subtotal + vat };
    };

    const handleCreateClient = async () => {
        if (!newClient.company || !newClient.name || !newClient.email) {
            alert("Please fill required fields"); return;
        }
        setLoading(true);
        const c: Cliente = {
            cliente_id: 'C-' + Date.now(),
            nome_empresa: newClient.company,
            nome_contacto: newClient.name,
            email: newClient.email,
            telefone: newClient.phone,
            pais: newClient.country,
            preferred_language: newClient.language as any,
            market: newClient.market,
            status: 'Prospect',
            notes: newClient.internal_notes,
            created_from: 'new_proposal_flow',
            nif: '', morada_faturacao: '', morada_entrega: '', segmento: 'General',
            data_criacao: new Date().toISOString()
        };

        try {
            await api.createCliente(c); // API handles persistence (DB or Sheets)
            setClientes([...clientes, c]);
            setSelectedCliente(c);
            setMeta(m => ({ ...m, language: c.preferred_language, market: c.market }));
            setShowNewClientForm(false);
        } catch (e) { console.error(e); alert('Error creating client'); }
        finally { setLoading(false); }
    };

    // Item Config Logic ... (Same as before, abbreviated/preserved)
    useEffect(() => {
        if (modalProduct) {
            if (CONFIGURABLE_FAMILIES.includes(modalProduct.family)) {
                const options = productCatalog.getOptionsForFamily(modalProduct.family);
                setAvailableOptions(options);
                const models = productCatalog.getStandardModels(modalProduct.family);
                setAvailableStandardModels(models);
                setSelectedStandardModel(models.length > 0 ? models[0] : null);
                const defaults = options.filter(o => o.is_default_selected).map(o => o.code);
                setModalLine(prev => ({ ...prev, selectedOptions: defaults, qty: 1, discount: 0, extras: '', notes: '' }));
            } else {
                setAvailableOptions(productCatalog.getOptionsForModel(modalProduct));
                setAvailableStandardModels([]);
                setSelectedStandardModel(null);
                setModalLine(prev => ({ ...prev, selectedOptions: [], qty: 1, discount: 0, extras: '', notes: '' }));
            }
        }
    }, [modalProduct]);

    const handleAddLine = () => {
        if (!modalProduct) return;
        let basePrice = modalProduct.preco_base;
        let pName = modalProduct.nome_produto;
        let pId = modalProduct.produto_id;
        let smCode = undefined;
        if (CONFIGURABLE_FAMILIES.includes(modalProduct.family) && selectedStandardModel) {
            basePrice = selectedStandardModel.base_price_eur;
            pName = selectedStandardModel.display_name;
            pId = selectedStandardModel.model_id;
            smCode = selectedStandardModel.standard_model_code;
        }

        // Price Calc
        const optionsPrice = modalLine.selectedOptions.reduce((acc, code) => {
            const opt = productCatalog.getOption(code);
            // Handle Bundles etc
            return acc + (opt?.priceEUR || 0);
        }, 0);
        const unitPrice = basePrice + optionsPrice;
        const total = unitPrice * modalLine.qty * (1 - modalLine.discount / 100);

        setLines([...lines, {
            linha_id: 'L-' + Date.now(),
            produto_id: pId,
            produto_nome: pName,
            descricao_linha: modalProduct.descricao_curta,
            preco_unitario: unitPrice,
            base_price_eur: basePrice,
            quantidade: modalLine.qty,
            desconto_percent: modalLine.discount,
            extras: modalLine.extras,
            notas_linha: modalLine.notes,
            total_linha: total,
            selectedOptionCodes: modalLine.selectedOptions,
            standard_model_code: smCode
        }]);
        setModalProduct(null);
    };

    const buildProposalObject = () => {
        if (!user || !selectedCliente) return null;
        const t = getTotals();
        return {
            proposal: {
                proposta_id: currentProposalId,
                assunto: subject,
                cliente_id: selectedCliente.cliente_id,
                cliente_nome: selectedCliente.nome_empresa,
                cliente_email: selectedCliente.email,
                cliente_telefone: selectedCliente.telefone, // Ensure parity
                nif: selectedCliente.nif,
                comercial_email: user.email,
                comercial_nome: user.name,
                status: 'Draft',
                total: t.total,
                subtotal: t.subtotal,
                iva_percent: 23,
                iva_valor: t.vat,
                moeda: 'EUR',
                data_criacao: new Date().toISOString(),
                data_validade: meta.validity,
                condicoes_pagamento: meta.paymentTerms,
                condicoes_entrega: meta.deliveryConditions,
                tipo_embalagem: meta.packaging,
                prazo_entrega_semanas: Number(meta.deliveryWeeks),
                idioma: meta.language,
                mercado: meta.market,
                observacoes_para_cliente: meta.notes
            } as Proposta,
            lines: lines as PropostaLinha[]
        };
    };

    const handleSave = async (redirect = false) => {
        const data = buildProposalObject();
        if (!data) return;
        setDraftSaving(true);
        try {
            const id = await api.saveProposta(data.proposal, data.lines, true);
            setCurrentProposalId(id);
            setLastSaved(new Date());
            if (redirect) {
                // Generate Doc Logic
                setLoading(true);
                const res = await api.generateProposalDocument(id);
                if (res.success) navigate(`/proposal/${id}/document`);
                else alert('Error: ' + res.error);
            }
        } catch (e) { console.error(e); alert('Error saving'); }
        finally { setDraftSaving(false); setLoading(false); }
    };

    if (dataLoading) return <div className="h-screen flex items-center justify-center">Loading...</div>;

    return (
        <div className="max-w-5xl mx-auto min-h-screen pb-20">
            {/* Header */}
            <div className="sticky top-0 z-30 bg-neutral-100/95 backdrop-blur pt-6 pb-4 border-b border-gray-200 mb-8">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                        <button onClick={toggleMobileSidebar} className="md:hidden text-gray-500"><Menu /></button>
                        <h1 className="text-2xl font-bold text-gray-900">New Proposal</h1>
                    </div>
                    <div className="flex items-center gap-3">
                        {lastSaved && <span className="text-xs text-gray-500 hidden sm:block">Saved {lastSaved.toLocaleTimeString()}</span>}
                        <button onClick={() => handleSave(false)} className="btn-secondary text-sm">Save Draft</button>
                    </div>
                </div>

                {/* Stepper */}
                <div className="flex px-4 md:px-20">
                    {[0, 1, 2, 3].map(i => <StepIndicator key={i} step={i} current={currentStep} />)}
                </div>
            </div>

            {/* Content */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-10 min-h-[500px] relative animate-fade-in">

                {currentStep === 0 && (
                    <div className="max-w-2xl mx-auto space-y-8">
                        <div className="text-center">
                            <h2 className="text-xl font-bold text-gray-900">Select a Client</h2>
                            <p className="text-sm text-gray-500 mt-1">Who is this proposal for?</p>
                        </div>

                        {!selectedCliente ? (
                            <div className="space-y-4">
                                <div className="relative">
                                    <Search className="absolute left-4 top-3.5 text-gray-400" size={20} />
                                    <select
                                        className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-primary appearance-none text-base"
                                        onChange={(e) => {
                                            const c = clientes.find(cl => cl.cliente_id === e.target.value);
                                            if (c) {
                                                setSelectedCliente(c);
                                                setMeta(prev => ({ ...prev, language: c.preferred_language || 'English', market: c.market || 'International' }));
                                            }
                                        }}
                                        defaultValue=""
                                    >
                                        <option value="" disabled>Search clients...</option>
                                        {clientes.map(c => <option key={c.cliente_id} value={c.cliente_id}>{c.nome_empresa}</option>)}
                                    </select>
                                </div>
                                <div className="relative flex py-2 items-center">
                                    <div className="flex-grow border-t border-gray-100"></div>
                                    <span className="flex-shrink-0 mx-4 text-gray-300 text-xs uppercase">or</span>
                                    <div className="flex-grow border-t border-gray-100"></div>
                                </div>
                                <button onClick={() => setShowNewClientForm(true)} className="w-full py-4 border-2 border-dashed border-gray-200 rounded-xl text-gray-500 font-medium hover:border-primary hover:text-primary transition-all flex flex-col items-center gap-2">
                                    <Plus size={24} /> <span>Create New Client</span>
                                </button>

                                {showNewClientForm && (
                                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                                        <div className="bg-white rounded-2xl p-6 w-full max-w-md">
                                            <h3 className="text-lg font-bold mb-4">New Client</h3>
                                            <div className="space-y-3">
                                                <input className="input-field" placeholder="Company Name" value={newClient.company} onChange={e => setNewClient({ ...newClient, company: e.target.value })} />
                                                <input className="input-field" placeholder="Contact Name" value={newClient.name} onChange={e => setNewClient({ ...newClient, name: e.target.value })} />
                                                <input className="input-field" placeholder="Email" value={newClient.email} onChange={e => setNewClient({ ...newClient, email: e.target.value })} />
                                                <div className="flex gap-2 justify-end mt-4">
                                                    <button onClick={() => setShowNewClientForm(false)} className="btn-secondary">Cancel</button>
                                                    <button onClick={handleCreateClient} disabled={loading} className="btn-primary">Create Client</button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="bg-primary/5 border border-primary/10 rounded-xl p-6 flex justify-between items-center">
                                <div>
                                    <h3 className="font-bold text-gray-900 text-lg">{selectedCliente.nome_empresa}</h3>
                                    <p className="text-gray-600">{selectedCliente.nome_contacto}</p>
                                    <p className="text-sm text-gray-400">{selectedCliente.email}</p>
                                </div>
                                <button onClick={() => setSelectedCliente(null)} className="text-sm text-primary font-bold hover:underline">Change</button>
                            </div>
                        )}
                    </div>
                )}

                {currentStep === 1 && (
                    <div className="max-w-2xl mx-auto space-y-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Proposal Subject</label>
                            <input className="input-field text-lg" placeholder="e.g. Q3 Server Upgrade" value={subject} onChange={e => setSubject(e.target.value)} autoFocus />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Validity</label>
                                <input type="date" className="input-field" value={meta.validity} onChange={e => setMeta({ ...meta, validity: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Language</label>
                                <select className="input-field" value={meta.language} onChange={e => setMeta({ ...meta, language: e.target.value as any })}>
                                    <option>English</option><option>Portuguese</option><option>Spanish</option><option>French</option>
                                </select>
                            </div>
                        </div>
                    </div>
                )}

                {currentStep === 2 && (
                    <div className="space-y-6">
                        {/* List Items */}
                        {lines.length > 0 ? (
                            <div className="border border-gray-200 rounded-xl overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50 text-gray-500 border-b border-gray-200">
                                        <tr><th className="px-4 py-2 text-left">Item</th><th className="px-4 py-2 text-right">Qty</th><th className="px-4 py-2 text-right">Total</th><th></th></tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {lines.map((l, idx) => (
                                            <tr key={idx}>
                                                <td className="px-4 py-3"><div className="font-bold">{l.produto_nome}</div><div className="text-xs text-gray-400">{l.descricao_linha}</div></td>
                                                <td className="px-4 py-3 text-right">{l.quantidade}</td>
                                                <td className="px-4 py-3 text-right font-bold">{formatCurrency(l.total_linha || 0)}</td>
                                                <td className="px-4 py-3 text-right"><button onClick={() => { const n = [...lines]; n.splice(idx, 1); setLines(n); }} className="text-red-400 hover:text-red-600"><X size={16} /></button></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-gray-500">No items added yet.</div>
                        )}

                        <div className="pt-4 border-t border-gray-100">
                            <div className="flex gap-2 mb-4">
                                <Search className="text-gray-400" />
                                <input className="w-full text-sm outline-none" placeholder="Search catalog..." value={productSearch} onChange={e => setProductSearch(e.target.value)} />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 h-64 overflow-y-auto">
                                {produtos.filter(p => !productSearch || p.nome_produto.toLowerCase().includes(productSearch.toLowerCase())).map(p => (
                                    <button key={p.produto_id} onClick={() => setModalProduct(p)} className="p-3 border border-gray-200 rounded-lg text-left hover:border-primary hover:shadow-md transition-all">
                                        <div className="font-bold text-sm text-gray-900">{p.nome_produto}</div>
                                        <div className="flex justify-between mt-2 text-xs">
                                            <span className="text-gray-500">{p.family}</span>
                                            <span className="font-bold text-primary">{p.preco_base ? formatCurrency(p.preco_base) : 'Conf.'}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Config Modal (Simplified for brevity but functional) */}
                        {modalProduct && (
                            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                                <div className="bg-white rounded-2xl p-6 w-full max-w-lg">
                                    <h3 className="text-lg font-bold mb-4">Add {modalProduct.nome_produto}</h3>
                                    <div className="space-y-4">
                                        <div className="flex gap-4">
                                            <div className="flex-1">
                                                <label className="text-xs font-bold text-gray-500">Qty</label>
                                                <input type="number" className="input-field" value={modalLine.qty} onChange={e => setModalLine({ ...modalLine, qty: Number(e.target.value) })} />
                                            </div>
                                            <div className="flex-1">
                                                <label className="text-xs font-bold text-gray-500">Discount %</label>
                                                <input type="number" className="input-field" value={modalLine.discount} onChange={e => setModalLine({ ...modalLine, discount: Number(e.target.value) })} />
                                            </div>
                                        </div>
                                        <button onClick={handleAddLine} className="btn-primary w-full">Add to Proposal</button>
                                        <button onClick={() => setModalProduct(null)} className="text-center w-full text-sm text-gray-400 mt-2">Cancel</button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {currentStep === 3 && (
                    <div className="space-y-6">
                        <div className="bg-primary/5 rounded-xl p-6 border border-primary/10">
                            <div className="flex justify-between items-end">
                                <div>
                                    <h3 className="font-bold text-lg text-gray-900">Total Value</h3>
                                    <p className="text-sm text-gray-500">{lines.length} items</p>
                                </div>
                                <div className="text-3xl font-bold text-primary">{formatCurrency(getTotals().total)}</div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2"><label className="block text-sm font-bold text-gray-700 mb-1">Notes for Client</label><textarea className="input-field min-h-[100px]" value={meta.notes} onChange={e => setMeta({ ...meta, notes: e.target.value })} /></div>
                            <div className="col-span-2 border-t border-gray-100 pt-4"><label className="block text-sm font-bold text-gray-700 mb-1">Delivery Conditions</label><textarea className="input-field" value={meta.deliveryConditions} onChange={e => setMeta({ ...meta, deliveryConditions: e.target.value })} /></div>
                        </div>
                    </div>
                )}

            </div>

            {/* Navigation Footer */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 md:pl-72 z-20">
                <div className="max-w-5xl mx-auto flex justify-between items-center">
                    <button
                        onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                        disabled={currentStep === 0}
                        className="btn-secondary flex items-center gap-2 disabled:opacity-50"
                    >
                        <ArrowLeft size={16} /> Back
                    </button>

                    <div className="flex gap-2">
                        {currentStep === 3 ? (
                            <button onClick={() => handleSave(true)} disabled={loading} className="btn-primary flex items-center gap-2 shadow-lg shadow-primary/20">
                                {loading ? 'Generating...' : 'Finalize & Create PDF'} <FileText size={18} />
                            </button>
                        ) : (
                            <button
                                onClick={() => {
                                    // Validation
                                    if (currentStep === 0 && !selectedCliente) { alert('Select a client'); return; }
                                    if (currentStep === 1 && !subject) { alert('Enter a subject'); return; }
                                    if (currentStep === 2 && lines.length === 0) { alert('Add at least one item'); return; }
                                    setCurrentStep(currentStep + 1);
                                }}
                                className="btn-primary flex items-center gap-2"
                            >
                                Next Step <ArrowRight size={16} />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
