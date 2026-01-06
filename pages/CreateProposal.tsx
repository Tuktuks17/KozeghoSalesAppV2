
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
    Search, Plus, X, FileText, Check, AlertCircle, Menu, Save, FilePlus
} from 'lucide-react';
import { api, clienteToSheetsRow } from '../services/api';
import { postToSheets } from '../services/sheetsApi';
import { Cliente, Produto, PropostaLinha, Proposta, AvailableOption, StandardModel } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useSidebar } from '../App';
import { productCatalog } from '../services/productCatalog';

const Section = ({ title, children, className = '' }: any) => (
    <div className={`mb-8 ${className}`}>
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">{title}</h3>
        {children}
    </div>
);

const Input = ({ label, ...props }: any) => (
    <div className="w-full">
        {label && <label className="block text-xs font-bold text-slate-700 mb-1.5">{label}</label>}
        <input className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all placeholder:text-slate-300" {...props} />
    </div>
);

const TextArea = ({ label, ...props }: any) => (
    <div className="w-full">
        {label && <label className="block text-xs font-bold text-slate-700 mb-1.5">{label}</label>}
        <textarea className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all placeholder:text-slate-300 min-h-[100px]" {...props} />
    </div>
);

const formatCurrency = (val: number) => 
  new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(val);

const CONFIGURABLE_FAMILIES = ['CS', 'CL-D', 'CSL', 'PD', 'BS', 'BL', 'KDC', 'TCP', 'TCI', 'TCC', 'TPP', 'DEP', 'AMR-S', 'AMR-T', 'APL', 'ATL', 'AFL'];

const LANGUAGE_LABELS: Record<string, string> = {
    'English': 'English',
    'Portuguese': 'Portuguese',
    'Spanish': 'Spanish',
    'French': 'French'
};

export default function CreateProposal() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { user } = useAuth();
    const { toggleMobileSidebar } = useSidebar();
    const [loading, setLoading] = useState(false); // For Create Doc action
    const [draftSaving, setDraftSaving] = useState(false); // For Save Draft action
    const [dataLoading, setDataLoading] = useState(true);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    
    // Master Data
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [produtos, setProdutos] = useState<Produto[]>([]);

    // Form State
    const [currentProposalId, setCurrentProposalId] = useState<string>(''); // Track ID after first save
    const [subject, setSubject] = useState('');
    const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
    const [showNewClientForm, setShowNewClientForm] = useState(false);
    
    const [newClient, setNewClient] = useState({ 
        name: '', 
        email: '', 
        company: '', 
        phone: '',
        country: '',
        language: 'English' as 'Portuguese' | 'English' | 'Spanish' | 'French',
        market: 'International' as 'National' | 'International',
        internal_notes: ''
    });
    
    // Auto-update language when country changes in inline form
    useEffect(() => {
        if (!newClient.country) return;
        const p = newClient.country.toLowerCase().trim();
        let lang: any = 'English';
        if (p === 'portugal') lang = 'Portuguese';
        else if (p === 'spain' || p === 'espanha') lang = 'Spanish';
        
        setNewClient(prev => ({ ...prev, language: lang }));
    }, [newClient.country]);


    const [lines, setLines] = useState<Partial<PropostaLinha>[]>([]);
    const [meta, setMeta] = useState({
        validity: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
        deliveryWeeks: '',
        deliveryConditions: 'Digital Delivery' as string,
        packaging: 'Standard' as 'Standard' | 'Ocean freight',
        paymentTerms: '30 Days Net',
        language: 'English' as 'Portuguese' | 'English' | 'Spanish' | 'French',
        market: 'International' as 'National' | 'International',
        notes: ''
    });

    // Modal State
    const [productSearch, setProductSearch] = useState('');
    const [modalProduct, setModalProduct] = useState<Produto | null>(null);
    
    // Configurable Item State
    const [selectedStandardModel, setSelectedStandardModel] = useState<StandardModel | null>(null);
    const [availableStandardModels, setAvailableStandardModels] = useState<StandardModel[]>([]);

    // Modal Config State
    const [modalLine, setModalLine] = useState({ 
        qty: 1, 
        discount: 0, 
        extras: '', 
        notes: '',
        selectedOptions: [] as string[] // Array of option codes
    });
    const [availableOptions, setAvailableOptions] = useState<AvailableOption[]>([]);

    // Initial load
    useEffect(() => {
        const load = async () => {
            const [c, p] = await Promise.all([api.getClientes(), api.getProdutos()]);
            setClientes(c);
            setProdutos(p);
            
            // Check for clientId in URL
            const clientIdFromUrl = searchParams.get('clientId');
            if (clientIdFromUrl) {
                const targetClient = c.find(client => client.cliente_id === clientIdFromUrl);
                if (targetClient) {
                    setSelectedCliente(targetClient);
                    setMeta(prev => ({
                        ...prev,
                        language: targetClient.preferred_language || 'English',
                        market: targetClient.market || 'International'
                    }));
                }
            }
            
            setDataLoading(false);
        };
        load();
    }, [searchParams]);

    // Config Modal Logic
    useEffect(() => {
        if (modalProduct) {
            // Handle Configurable Families
            if (CONFIGURABLE_FAMILIES.includes(modalProduct.family)) {
                const options = productCatalog.getOptionsForFamily(modalProduct.family);
                setAvailableOptions(options);
                const models = productCatalog.getStandardModels(modalProduct.family);
                setAvailableStandardModels(models);
                setSelectedStandardModel(models.length > 0 ? models[0] : null);
                
                // Set defaults
                const defaultOptions = options.filter(o => o.is_default_selected).map(o => o.code);
                setModalLine(prev => ({ ...prev, selectedOptions: defaultOptions, qty: 1, discount: 0, extras: '', notes: '' }));
            } else {
                // Standard items or other families
                setAvailableOptions(productCatalog.getOptionsForModel(modalProduct));
                setAvailableStandardModels([]);
                setSelectedStandardModel(null);
                setModalLine(prev => ({ ...prev, selectedOptions: [], qty: 1, discount: 0, extras: '', notes: '' }));
            }
        }
    }, [modalProduct]);

  const handleCreateClient = async () => {
    if (!newClient.company || !newClient.name || !newClient.email) {
        alert("Please fill in required fields: Company, Contact, Email.");
        return;
    }

    setLoading(true);

    const c: Cliente = {
        cliente_id: 'C-' + Date.now(),
        nome_empresa: newClient.company,
        nome_contacto: newClient.name,
        email: newClient.email,
        telefone: newClient.phone,
        pais: newClient.country,

        // New fields mapping
        preferred_language: newClient.language,
        market: newClient.market,
        status: 'Prospect', // Force Prospect in this flow
        notes: newClient.internal_notes,
        created_from: 'new_proposal_flow',

        nif: 'N/A',
        morada_faturacao: 'N/A',
        morada_entrega: 'N/A',
        segmento: 'General',
        data_criacao: new Date().toISOString(),
        metrics: {
            total_proposals_created: 0,
            total_proposals_won: 0,
            total_value_won: 0,
            total_value_pipeline: 0,
            win_rate_percent: 0,
        },
    };

    try {
        // 1) Cria o cliente no "mock DB" / estado interno
        await api.createCliente(c);

        // 2) Garante que este fluxo também sincroniza o cliente para a Google Sheet "Clients"
        const row = clienteToSheetsRow(c);
        await postToSheets('Clients', row);

        // 3) Atualiza o estado local da página
        setClientes([...clientes, c]);
        setSelectedCliente(c);

        // Auto-populate proposal meta based on new client
        setMeta((prev) => ({
            ...prev,
            language: c.preferred_language || 'English',
            market: c.market || 'International',
        }));

        setShowNewClientForm(false);
    } catch (error) {
        console.error('Erro ao criar cliente a partir do ecrã New Proposal:', error);
        alert('Ocorreu um erro ao criar o cliente. Verifica a consola e os logs do Apps Script.');
    } finally {
        setLoading(false);
    }
};


    const getOptionPrice = (optionCode: string, model: StandardModel | null) => {
        const opt = productCatalog.getOption(optionCode);
        if (!opt) return 0;
        if (opt.code === 'DEP_BUND' && model) {
            return model.bund_price_eur || 0;
        }
        return opt.priceEUR;
    };

    const getLineTotals = (basePrice: number, qty: number, discount: number, optionCodes: string[], model: StandardModel | null) => {
        const optionsPrice = optionCodes.reduce((acc, code) => {
            return acc + getOptionPrice(code, model);
        }, 0);
        
        const unitPrice = basePrice + optionsPrice;
        const totalNet = unitPrice * qty;
        const totalAfterDiscount = totalNet * (1 - discount / 100);
        
        return { unitPrice, totalAfterDiscount };
    };

    const handleAddLine = () => {
        if(!modalProduct) return;
        
        let basePrice = modalProduct.preco_base;
        let productName = modalProduct.nome_produto;
        let productId = modalProduct.produto_id;
        let description = modalProduct.descricao_curta;
        let standardModelCode = undefined;

        if (CONFIGURABLE_FAMILIES.includes(modalProduct.family) && selectedStandardModel) {
            basePrice = selectedStandardModel.base_price_eur;
            productName = selectedStandardModel.display_name;
            productId = selectedStandardModel.model_id;
            standardModelCode = selectedStandardModel.standard_model_code;
        }

        const { unitPrice, totalAfterDiscount } = getLineTotals(
            basePrice, 
            modalLine.qty, 
            modalLine.discount, 
            modalLine.selectedOptions,
            selectedStandardModel
        );

        const selectedOptionsDetails = availableOptions
            .filter(o => modalLine.selectedOptions.includes(o.code))
            .map(o => `${o.label}`)
            .join(', ');

        setLines([...lines, {
            linha_id: 'L-'+Date.now(),
            produto_id: productId,
            produto_nome: productName,
            descricao_linha: description,
            preco_unitario: unitPrice,
            base_price_eur: basePrice,
            quantidade: modalLine.qty,
            desconto_percent: modalLine.discount,
            extras: modalLine.extras,
            notas_linha: modalLine.notes,
            total_linha: totalAfterDiscount,
            selectedOptionCodes: modalLine.selectedOptions,
            selectedOptionsDetails: selectedOptionsDetails,
            standard_model_code: standardModelCode
        }]);
        setModalProduct(null);
        setModalLine({ qty: 1, discount: 0, extras: '', notes: '', selectedOptions: [] });
        setSelectedStandardModel(null);
    };

    const handleRemoveLine = (idx: number) => {
        const n = [...lines];
        n.splice(idx, 1);
        setLines(n);
    };

    const toggleOption = (code: string) => {
        setModalLine(prev => {
            const exists = prev.selectedOptions.includes(code);
            return {
                ...prev,
                selectedOptions: exists 
                    ? prev.selectedOptions.filter(c => c !== code)
                    : [...prev.selectedOptions, code]
            };
        });
    };

    const getTotals = () => {
        const subtotal = lines.reduce((acc, l) => acc + (l.total_linha || 0), 0);
        const vat = subtotal * 0.23;
        return { subtotal, vat, total: subtotal + vat };
    };

    const getCurrentBasePrice = () => {
        if (CONFIGURABLE_FAMILIES.includes(modalProduct?.family || '') && selectedStandardModel) {
            return selectedStandardModel.base_price_eur;
        }
        return modalProduct?.preco_base || 0;
    };

    const modalCalculatedPrice = modalProduct ? getLineTotals(getCurrentBasePrice(), modalLine.qty, modalLine.discount, modalLine.selectedOptions, selectedStandardModel).totalAfterDiscount : 0;

    // Helper to build Proposal Object
    const buildProposalObject = (): { proposal: Proposta, lines: PropostaLinha[] } | null => {
        if (!user) return null;
        if (!selectedCliente) return null;

        const totals = getTotals();
        
        const p: Proposta = {
            proposta_id: currentProposalId, 
            assunto: subject,
            data_criacao: new Date().toISOString(),
            data_validade: new Date(meta.validity).toISOString(),
            estado: 'Draft',
            resultado: 'Open',
            comercial_email: user.email,
            comercial_nome: user.name,
            cliente_id: selectedCliente.cliente_id,
            cliente_nome: selectedCliente.nome_empresa,
            cliente_email: selectedCliente.email,
            nif: selectedCliente.nif,
            moeda: 'EUR',
            condicoes_pagamento: meta.paymentTerms,
            condicoes_entrega: meta.deliveryConditions,
            prazo_entrega_semanas: Number(meta.deliveryWeeks),
            tipo_embalagem: meta.packaging,
            desconto_global_percent: 0,
            subtotal: totals.subtotal,
            iva_percent: 23,
            iva_valor: totals.vat,
            total: totals.total,
            idioma: meta.language,
            mercado: meta.market,
            observacoes_internas: '',
            observacoes_para_cliente: meta.notes
        };

        const pl = lines.map(l => ({ ...l, proposta_id: currentProposalId } as PropostaLinha));
        return { proposal: p, lines: pl };
    }

    const handleSaveDraft = async () => {
    const data = buildProposalObject();
    if (!data) {
        alert("Please select a client first.");
        return;
    }

    try {
        setDraftSaving(true);

        const newId = await api.saveProposta(data.proposal, data.lines, true);

        setCurrentProposalId(newId);   // guarda o ID gerado
        setLastSaved(new Date());      // atualiza o “Last saved”
    } catch (err) {
        console.error('Erro ao guardar rascunho:', err);
        alert('Ocorreu um erro ao guardar o rascunho. Abre a consola do preview para ver os detalhes.');
    } finally {
        // ESTE finally garante que o botão nunca fica preso
        setDraftSaving(false);
    }
};


    const handleCreateDocument = async () => {
        const data = buildProposalObject();
        if (!data) {
            alert("Please fill in required fields.");
            return;
        }
        if (lines.length === 0) {
            alert("Please add at least one item.");
            return;
        }

        setLoading(true);
        // 1. Save Proposal (Draft or Update)
        const newId = await api.saveProposta(data.proposal, data.lines, true); 
        
        // 2. Trigger Document Generation
        const res = await api.generateProposalDocument(newId);
        
        setLoading(false);
        
        if (res.success) {
            // 3. Redirect to Document Page
            navigate(`/proposal/${newId}/document`);
        } else {
            alert("Error generating document: " + res.error);
        }
    };

    if (dataLoading) return <div className="flex h-screen justify-center items-center text-slate-400">Initializing...</div>;

    return (
        <div className="max-w-6xl mx-auto min-h-screen pb-32">
            <div className="sticky top-0 z-30 bg-slate-50/95 backdrop-blur pt-4 pb-4 border-b border-slate-200 mb-8 flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <button onClick={toggleMobileSidebar} className="md:hidden text-slate-500 hover:text-slate-900 p-1 -ml-1">
                         <Menu size={24} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                            New Proposal
                            {currentProposalId && <span className="text-sm font-normal text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">{currentProposalId}</span>}
                        </h1>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                            <span>{user?.name}</span>
                            {draftSaving && <><span className="text-slate-300">•</span><span className="text-blue-500 animate-pulse">Saving Draft...</span></>}
                            {!draftSaving && lastSaved && <><span className="text-slate-300">•</span><span>Draft saved {lastSaved.toLocaleTimeString()}</span></>}
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-10">
                    <Section title="Proposal Subject">
                        <Input 
                            placeholder="E.g., Q1 Server Upgrade for Acme Corp" 
                            value={subject}
                            onChange={(e: any) => setSubject(e.target.value)}
                            autoFocus
                        />
                    </Section>

                    <Section title="Client">
                        {!selectedCliente ? (
                            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                                {!showNewClientForm ? (
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 mb-1.5">Search Existing Client</label>
                                            <div className="relative">
                                                <Search className="absolute left-3 top-3 text-slate-400" size={18} />
                                                <select 
                                                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-slate-900 appearance-none text-sm"
                                                    onChange={(e) => {
                                                        const c = clientes.find(cl => cl.cliente_id === e.target.value);
                                                        if(c) {
                                                            setSelectedCliente(c);
                                                            // Auto-populate proposal meta based on existing client
                                                            setMeta(prev => ({
                                                                ...prev,
                                                                language: c.preferred_language || 'English',
                                                                market: c.market || 'International'
                                                            }));
                                                        }
                                                    }}
                                                    defaultValue=""
                                                >
                                                    <option value="" disabled>Select a client...</option>
                                                    {clientes.map(c => (
                                                        <option key={c.cliente_id} value={c.cliente_id}>{c.nome_empresa}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                        <div className="relative flex py-2 items-center">
                                            <div className="flex-grow border-t border-slate-100"></div>
                                            <span className="flex-shrink-0 mx-4 text-slate-300 text-xs uppercase">or</span>
                                            <div className="flex-grow border-t border-slate-100"></div>
                                        </div>
                                        <button onClick={() => setShowNewClientForm(true)} className="w-full py-2.5 border border-dashed border-slate-300 rounded-lg text-slate-600 font-medium text-sm hover:border-slate-900 hover:text-slate-900 transition-all flex items-center justify-center gap-2">
                                            <Plus size={16}/> Create New Client
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-4 animate-fade-in">
                                        <div className="flex justify-between items-center mb-2">
                                            <h4 className="font-bold text-slate-900">New Client Details</h4>
                                            <button onClick={() => setShowNewClientForm(false)}><X size={18} className="text-slate-400 hover:text-slate-900"/></button>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <Input label="Company Name" value={newClient.company} onChange={(e:any) => setNewClient({...newClient, company: e.target.value})}/>
                                            <Input label="Contact Name" value={newClient.name} onChange={(e:any) => setNewClient({...newClient, name: e.target.value})}/>
                                            <Input label="Email" type="email" value={newClient.email} onChange={(e:any) => setNewClient({...newClient, email: e.target.value})}/>
                                            <Input label="Phone (optional)" value={newClient.phone} onChange={(e:any) => setNewClient({...newClient, phone: e.target.value})}/>
                                            
                                            {/* Country Input removed from UI */}
                                            
                                            {/* Language - Auto-filled but editable */}
                                            <div>
                                                <label className="block text-xs font-bold text-slate-700 mb-1.5">Preferred Proposal Language</label>
                                                <select 
                                                    className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
                                                    value={newClient.language}
                                                    onChange={(e: any) => setNewClient({...newClient, language: e.target.value})}
                                                >
                                                    <option value="Portuguese">Portuguese</option>
                                                    <option value="English">English</option>
                                                    <option value="Spanish">Spanish</option>
                                                    <option value="French">French</option>
                                                </select>
                                            </div>

                                            {/* Market */}
                                            <div>
                                                <label className="block text-xs font-bold text-slate-700 mb-1.5">Market</label>
                                                <select 
                                                    className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
                                                    value={newClient.market}
                                                    onChange={(e: any) => setNewClient({...newClient, market: e.target.value})}
                                                >
                                                    <option value="National">National</option>
                                                    <option value="International">International</option>
                                                </select>
                                            </div>
                                        </div>
                                        <button onClick={handleCreateClient} disabled={loading} className="w-full bg-slate-900 text-white py-2.5 rounded-lg font-medium text-sm hover:bg-slate-800 mt-2">
                                            {loading ? 'Creating...' : 'Create & Select Client'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="bg-white border border-slate-200 rounded-xl p-4 flex justify-between items-center shadow-sm">
                                <div>
                                    <p className="font-bold text-slate-900">{selectedCliente.nome_empresa}</p>
                                    <p className="text-sm text-slate-500">{selectedCliente.nome_contacto} • {selectedCliente.email}</p>
                                </div>
                                <button onClick={() => setSelectedCliente(null)} className="text-xs text-blue-600 hover:underline font-medium">Change</button>
                            </div>
                        )}
                    </Section>

                    <Section title="Products & Items">
                        {lines.length > 0 && (
                            <div className="mb-6 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                                        <tr>
                                            <th className="px-4 py-3">Product</th>
                                            <th className="px-4 py-3 text-right">Qty</th>
                                            <th className="px-4 py-3 text-right">Unit Price</th>
                                            <th className="px-4 py-3 text-right">Total</th>
                                            <th className="px-4 py-3 w-10"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {lines.map((l, idx) => (
                                            <tr key={idx} className="group">
                                                <td className="px-4 py-3">
                                                    <div className="font-medium text-slate-900">{l.produto_nome}</div>
                                                    <div className="text-xs text-slate-500">{l.descricao_linha}</div>
                                                    {l.selectedOptionsDetails && <div className="text-xs text-blue-600 mt-1 italic">{l.selectedOptionsDetails}</div>}
                                                </td>
                                                <td className="px-4 py-3 text-right">{l.quantidade}</td>
                                                <td className="px-4 py-3 text-right">{l.preco_unitario?.toFixed(2)}€</td>
                                                <td className="px-4 py-3 text-right font-medium">{l.total_linha?.toFixed(2)}€</td>
                                                <td className="px-4 py-3 text-right">
                                                    <button onClick={() => handleRemoveLine(idx)} className="text-slate-300 hover:text-red-500"><X size={16}/></button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-4">
                                <Search size={18} className="text-slate-400"/>
                                <input 
                                    className="bg-transparent border-none focus:ring-0 text-sm w-full placeholder:text-slate-400"
                                    placeholder="Search catalog by name, code or description..."
                                    value={productSearch}
                                    onChange={e => setProductSearch(e.target.value)}
                                />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-2">
                                {produtos.filter(p => 
                                    p.nome_produto.toLowerCase().includes(productSearch.toLowerCase()) || 
                                    p.descricao_curta.toLowerCase().includes(productSearch.toLowerCase()) ||
                                    p.referencia.toLowerCase().includes(productSearch.toLowerCase())
                                ).map(p => (
                                    <button 
                                        key={p.produto_id}
                                        onClick={() => setModalProduct(p)}
                                        className="bg-white p-3 rounded-lg border border-slate-200 hover:border-blue-400 hover:shadow-sm text-left transition-all group flex flex-col h-full justify-between"
                                    >
                                        <div>
                                            <div className="flex justify-between items-start">
                                                <div className="font-bold text-slate-800 text-sm">{p.nome_produto}</div>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{p.family}</span>
                                            </div>
                                            <div className="text-xs text-slate-500 line-clamp-2 mt-1">{p.descricao_curta}</div>
                                        </div>
                                        <div className="flex justify-between items-end mt-3">
                                            <span className="text-blue-600 font-bold text-sm">{p.preco_base > 0 ? p.preco_base + '€' : 'Configurable'}</span>
                                            <span className="bg-slate-100 text-slate-600 text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">Configure</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </Section>

                    <Section title="Proposal Details">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Input label="Validity Date" type="date" value={meta.validity} onChange={(e:any) => setMeta({...meta, validity: e.target.value})}/>
                            
                            {/* Language Selector Removed - Driven by Client */}
                            
                            <div className="md:col-span-2 grid grid-cols-2 gap-6">
                                <Input label="Delivery Time (Weeks)" type="number" placeholder="e.g. 2" value={meta.deliveryWeeks} onChange={(e:any) => setMeta({...meta, deliveryWeeks: e.target.value})}/>
                                <div className="space-y-1.5">
                                    <label className="block text-xs font-bold text-slate-700">Packaging</label>
                                    <div className="flex gap-4 pt-1">
                                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                                            <input type="radio" name="pack" checked={meta.packaging === 'Standard'} onChange={() => setMeta({...meta, packaging: 'Standard'})}/>
                                            Standard
                                        </label>
                                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                                            <input type="radio" name="pack" checked={meta.packaging === 'Ocean freight'} onChange={() => setMeta({...meta, packaging: 'Ocean freight'})}/>
                                            Ocean freight
                                        </label>
                                    </div>
                                </div>
                            </div>
                            <div className="md:col-span-2">
                                <TextArea label="Delivery Conditions" value={meta.deliveryConditions} onChange={(e:any) => setMeta({...meta, deliveryConditions: e.target.value})}/>
                            </div>
                            <div className="md:col-span-2">
                                <TextArea label="Payment Terms" value={meta.paymentTerms} onChange={(e:any) => setMeta({...meta, paymentTerms: e.target.value})}/>
                            </div>
                        </div>
                    </Section>
                    <Section title="Additional Notes">
                        <TextArea placeholder="Internal notes or extra comments for the client..." value={meta.notes} onChange={(e:any) => setMeta({...meta, notes: e.target.value})}/>
                    </Section>
                </div>
                <div className="lg:col-span-1">
                    <div className="sticky top-24 space-y-6">
                        <div className="bg-white rounded-xl shadow-lg shadow-slate-200/50 border border-slate-200 p-6">
                            <h3 className="font-bold text-slate-900 mb-6 text-lg">
                                Summary
                            </h3>

                            {/* 1. PROPOSAL INFO BLOCK */}
                            <div className="space-y-2 mb-6 text-sm">
                                <div className="flex justify-between items-start gap-2">
                                    <span className="text-slate-500 shrink-0">Subject</span>
                                    <span className="font-medium text-slate-900 text-right truncate">
                                        {subject || <span className="text-slate-300 italic">(No subject)</span>}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-500">Language</span>
                                    <span className="font-medium text-slate-900">{LANGUAGE_LABELS[meta.language]}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-500">Market</span>
                                    <span className="font-medium text-slate-900">{meta.market}</span>
                                </div>
                                {meta.validity && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-slate-500">Valid until</span>
                                        <span className="font-medium text-slate-900">{new Date(meta.validity).toLocaleDateString('en-GB')}</span>
                                    </div>
                                )}
                                {meta.deliveryWeeks && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-slate-500">Delivery time</span>
                                        <span className="font-medium text-slate-900">{meta.deliveryWeeks} weeks</span>
                                    </div>
                                )}
                                {meta.deliveryConditions && (
                                    <div className="flex justify-between items-start gap-2">
                                        <span className="text-slate-500 shrink-0">Delivery cond.</span>
                                        <span className="font-medium text-slate-900 text-right truncate" title={meta.deliveryConditions}>
                                            {meta.deliveryConditions}
                                        </span>
                                    </div>
                                )}
                                {meta.paymentTerms && (
                                    <div className="flex justify-between items-start gap-2">
                                        <span className="text-slate-500 shrink-0">Payment terms</span>
                                        <span className="font-medium text-slate-900 text-right truncate" title={meta.paymentTerms}>
                                            {meta.paymentTerms}
                                        </span>
                                    </div>
                                )}
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-500">Packaging</span>
                                    <span className="font-medium text-slate-900">{meta.packaging}</span>
                                </div>
                            </div>

                            <div className="border-b border-slate-100 mb-6"></div>

                            {/* 2. CLIENT INFO BLOCK */}
                            <div className="mb-6">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Client</h4>
                                {selectedCliente ? (
                                    <div className="text-sm space-y-0.5">
                                        <div className="font-bold text-slate-900">{selectedCliente.nome_empresa}</div>
                                        <div className="text-slate-600">{selectedCliente.nome_contacto}</div>
                                        <div className="text-slate-500 text-xs">{selectedCliente.email}</div>
                                    </div>
                                ) : (
                                    <div className="text-sm text-slate-400 italic">No client selected yet</div>
                                )}
                            </div>

                            <div className="border-b border-slate-100 mb-6"></div>

                            {/* 3. ITEMS & TOTAL */}
                            <div className="space-y-4 mb-6">
                                {lines.length === 0 && <div className="text-sm text-slate-400 italic text-center py-2">No items added yet</div>}
                                {lines.map((l, i) => {
                                    const baseTotal = (l.base_price_eur || l.preco_unitario || 0) * (l.quantidade || 1);
                                    // Find options and calculate their cost using dynamic pricing logic if needed
                                    const lineOptions = l.selectedOptionCodes ? l.selectedOptionCodes.map(c => productCatalog.getOption(c)) : [];
                                    
                                    let summaryModel: StandardModel | undefined;
                                    if (l.produto_id) {
                                         for (const fam of CONFIGURABLE_FAMILIES) {
                                             const m = productCatalog.getStandardModels(fam as any).find(mod => mod.model_id === l.produto_id);
                                             if (m) { summaryModel = m; break; }
                                         }
                                    }

                                    return (
                                        <div key={i} className="text-sm">
                                            <div className="flex justify-between font-bold text-slate-900">
                                                <span>{l.produto_nome} x{l.quantidade}</span>
                                                <span>{formatCurrency(baseTotal)}</span>
                                            </div>
                                            {lineOptions.map(opt => {
                                                const price = getOptionPrice(opt?.code || '', summaryModel || null);
                                                return (
                                                    <div key={opt?.code} className="flex justify-between text-slate-500 pl-3 text-xs mt-1">
                                                        <span>+ {opt?.label}</span>
                                                        <span>{formatCurrency(price * (l.quantidade || 1))}</span>
                                                    </div>
                                                );
                                            })}
                                            {/* Optional item total line */}
                                            {lineOptions.length > 0 && (
                                                 <div className="flex justify-between text-slate-400 text-xs mt-1 border-t border-dashed border-slate-100 pt-1">
                                                    <span>Item total</span>
                                                    <span>{formatCurrency(l.total_linha || 0)}</span>
                                                 </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                            <div className="border-t border-slate-200 pt-4 mt-4">
                                <div className="flex justify-between items-end">
                                    <span className="font-bold text-slate-900 text-lg">TOTAL</span>
                                    <span className="font-bold text-slate-900 text-2xl">{formatCurrency(getTotals().subtotal)}</span>
                                </div>
                                {meta.market === 'National' && (
                                    <div className="mt-2 text-xs text-slate-400 text-right">
                                        VAT (IVA) is not included in the prices shown.
                                    </div>
                                )}
                            </div>
                            
                            {/* ACTION BUTTONS */}
                            <div className="flex flex-col gap-3 mt-6">
                                <button 
                                    onClick={handleSaveDraft}
                                    disabled={draftSaving}
                                    className="w-full bg-white border border-slate-300 text-slate-700 py-3 rounded-xl font-bold text-sm hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                                >
                                    {draftSaving ? 'Saving...' : <><Save size={18}/> Save Draft</>}
                                </button>
                                <button 
                                    onClick={handleCreateDocument}
                                    disabled={loading}
                                    className="w-full bg-slate-900 text-white py-3.5 rounded-xl font-bold text-sm hover:bg-slate-800 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-slate-900/10 flex items-center justify-center gap-2"
                                >
                                    {loading ? 'Generating...' : <><FilePlus size={18}/> Create Proposal Document</>}
                                </button>
                            </div>
                        </div>
                        <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                            <div className="flex gap-2 items-start">
                                <AlertCircle size={16} className="text-blue-500 mt-0.5"/>
                                <div className="text-xs text-blue-800 leading-relaxed">
                                    <strong>Pro Tip:</strong> Creating the document will lock the initial values but you can still edit the document content before sending.
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal Component (unchanged) */}
            {modalProduct && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center shrink-0">
                            <h3 className="font-bold text-slate-800">
                                {CONFIGURABLE_FAMILIES.includes(modalProduct.family) ? 'Configure Item' : 'Configure Item'}
                            </h3>
                            <button onClick={() => setModalProduct(null)}><X size={20} className="text-slate-400 hover:text-slate-900"/></button>
                        </div>
                        
                        <div className="p-6 space-y-6 overflow-y-auto">
                            <div>
                                {/* Header for Configurable families */}
                                {CONFIGURABLE_FAMILIES.includes(modalProduct.family) ? (
                                    <>
                                        <div className="text-sm font-bold text-slate-900 mb-1">
                                            {modalProduct.family === 'CS' ? 'Powder Polymer Preparation System – CS Configuration' :
                                             modalProduct.family === 'CL-D' ? 'Emulsion Polymer Preparation System – CL-D Configuration' : 
                                             modalProduct.family === 'CSL' ? 'Powder/Emulsion Polymer Preparation System – CSL Configuration' :
                                             modalProduct.family === 'PD' ? 'In Line Dilution Panel – PD Configuration' :
                                             modalProduct.family === 'BS' ? 'Powder Dilution System – BS Configuration' :
                                             modalProduct.family === 'BL' ? 'Liquids Dilution System – BL Configuration' :
                                             modalProduct.family === 'KDC' ? 'Chlorine Dioxide Generator – KDC Configuration' :
                                             modalProduct.family === 'TCP' ? 'Standard Storage with Cylindrical Roof – TCP Configuration' :
                                             modalProduct.family === 'TCI' ? 'Sloping Bottom Tanks with Cylindrical Roof and Rising Floor – TCI Configuration' :
                                             modalProduct.family === 'TCC' ? 'Conical Bottom Tanks – TCC Configuration' :
                                             modalProduct.family === 'TPP' ? 'Preparation Tanks with Flat Cylinder Tops – TPP Configuration' :
                                             modalProduct.family === 'DEP' ? 'Rotomoulding Tank – DEP Configuration' :
                                             modalProduct.family === 'AMR-S' ? 'Fast Mixers – AMR-S Configuration' :
                                             modalProduct.family === 'AMR-T' ? 'Fast Mixers – AMR-T Configuration' :
                                             modalProduct.family === 'APL' ? 'Slow Mixers – APL Configuration' :
                                             modalProduct.family === 'ATL' ? 'High Efficiency Mixers – ATL Configuration' :
                                             modalProduct.family === 'AFL' ? 'Flocculation Mixers – AFL Configuration' :
                                             'Product Configuration'}
                                        </div>
                                        
                                        {/* Standard Model Dropdown */}
                                        <div className="mt-4 mb-4">
                                            <label className="block text-xs font-bold text-slate-700 mb-1.5">Standard Model</label>
                                            <select 
                                                className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
                                                value={selectedStandardModel?.model_id || ''}
                                                onChange={(e) => {
                                                    const m = availableStandardModels.find(x => x.model_id === e.target.value);
                                                    setSelectedStandardModel(m || null);
                                                }}
                                            >
                                                {availableStandardModels.map(m => (
                                                    <option key={m.model_id} value={m.model_id}>
                                                        {`${m.standard_model_code} – ${formatCurrency(m.base_price_eur)}`}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="text-sm font-bold text-slate-900">{modalProduct.nome_produto}</div>
                                        <div className="text-xs text-slate-500">{modalProduct.descricao_curta}</div>
                                        <div className="text-xs text-slate-400 mt-1">{modalProduct.descricao_detalhada}</div>
                                    </>
                                )}
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <Input label="Quantity" type="number" min="1" value={modalLine.qty} onChange={(e:any) => setModalLine({...modalLine, qty: Number(e.target.value)})}/>
                                <Input label="Discount %" type="number" min="0" max="100" value={modalLine.discount} onChange={(e:any) => setModalLine({...modalLine, discount: Number(e.target.value)})}/>
                            </div>

                            {/* Available Options Section */}
                            {availableOptions.length > 0 && (
                                <div>
                                    <div className="mb-2">
                                        <h4 className="font-bold text-slate-800 text-sm">
                                            {CONFIGURABLE_FAMILIES.includes(modalProduct.family) ? `Available options (${modalProduct.family} series)` : 'Available Options'}
                                        </h4>
                                        <p className="text-[10px] text-slate-500">Select options to include. Prices in EUR.</p>
                                    </div>
                                    <div className="space-y-2 bg-slate-50 p-3 rounded-lg border border-slate-100">
                                        {availableOptions.map(opt => {
                                            const price = getOptionPrice(opt.code, selectedStandardModel);
                                            return (
                                                <label key={opt.code} className="flex items-start gap-3 cursor-pointer hover:bg-white p-1.5 rounded transition-colors">
                                                    <input 
                                                        type="checkbox" 
                                                        className="mt-0.5"
                                                        checked={modalLine.selectedOptions.includes(opt.code)}
                                                        onChange={() => toggleOption(opt.code)}
                                                    />
                                                    <div className="flex-1 flex justify-between text-xs">
                                                        <span className="text-slate-700 font-medium">{opt.label}</span>
                                                        <span className="text-slate-500 font-bold whitespace-nowrap">+ {formatCurrency(price)}</span>
                                                    </div>
                                                </label>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            <TextArea label="Extras / Customization" placeholder="Describe any custom requirements..." value={modalLine.extras} onChange={(e:any) => setModalLine({...modalLine, extras: e.target.value})}/>
                            <TextArea label="Internal Notes" placeholder="Notes for this line..." value={modalLine.notes} onChange={(e:any) => setModalLine({...modalLine, notes: e.target.value})}/>
                        </div>

                        <div className="p-4 border-t border-slate-100 bg-slate-50 shrink-0">
                             <div className="flex justify-between items-center mb-3 px-2">
                                <span className="text-xs font-bold text-slate-500 uppercase">Line Total</span>
                                <span className="text-lg font-bold text-blue-600">{modalCalculatedPrice.toFixed(2)}€</span>
                             </div>
                            <button onClick={handleAddLine} className="w-full bg-slate-900 text-white py-3 rounded-lg font-bold text-sm hover:bg-slate-800 transition-all">
                                Add Item
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
