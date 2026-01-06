
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer, Mail, Sparkles, Download, X, CheckCircle } from 'lucide-react';
import { api } from '../services/api';
import { Proposta, PropostaLinha, Cliente } from '../types';
import { ProposalPreview } from '../components/ProposalPreview';

export default function ProposalDocument() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [proposal, setProposal] = useState<Proposta | null>(null);
    const [lines, setLines] = useState<PropostaLinha[]>([]);
    const [client, setClient] = useState<Cliente | null>(null);
    
    // Email Modal
    const [showEmailModal, setShowEmailModal] = useState(false);
    const [emailData, setEmailData] = useState({
        to: '',
        cc: '',
        subject: '',
        body: ''
    });
    const [aiGenerating, setAiGenerating] = useState(false);

    useEffect(() => {
        if (id) loadData(id);
    }, [id]);

    const loadData = async (propId: string) => {
        try {
            const res = await api.getPropostaById(propId);
            if (res) {
                setProposal(res.proposta);
                setLines(res.linhas);
                const c = await api.getClienteById(res.proposta.cliente_id);
                if (c) setClient(c);

                setEmailData(prev => ({
                    ...prev,
                    to: res.proposta.cliente_email,
                    cc: res.proposta.comercial_email,
                    subject: `Proposta ${res.proposta.proposta_id} - Kozegho Solutions`
                }));
            }
        } catch (err) {
            console.error("Error loading document data:", err);
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const handleGenerateEmailBody = async () => {
        if (!proposal) return;
        setAiGenerating(true);
        const body = await api.generateEmailBodyAI(proposal, lines);
        setEmailData(prev => ({ ...prev, body }));
        setAiGenerating(false);
    };

    const handleSendEmail = () => {
        if (!proposal) return;
        // Modo 1: Professional Mailto (Fallback Seguro)
        const mailtoUrl = `mailto:${emailData.to}?cc=${emailData.cc}&subject=${encodeURIComponent(emailData.subject)}&body=${encodeURIComponent(
            emailData.body + "\n\n[Nota: Por favor anexe o PDF gerado anteriormente a este email]"
        )}`;
        window.location.href = mailtoUrl;
        setShowEmailModal(false);
    };

    if (loading) return (
        <div className="h-screen flex flex-col items-center justify-center text-slate-400">
            <div className="w-12 h-12 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin mb-4"></div>
            <p className="font-medium animate-pulse">A preparar documento...</p>
        </div>
    );

    // FALLSAFE: Se os dados falharem, não mostra ecrã branco.
    if (!proposal || !client) return (
        <div className="p-20 text-center flex flex-col items-center gap-4">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center">
                <X size={32} />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Erro ao carregar proposta</h2>
            <p className="text-slate-500 max-w-xs">Não foi possível obter os dados para gerar o preview. Verifique a ligação à internet.</p>
            <button onClick={() => navigate(-1)} className="text-blue-600 font-bold hover:underline">Voltar atrás</button>
        </div>
    );

    return (
        <div className="min-h-screen flex flex-col bg-slate-100">
            {/* Header - Oculto na Impressão */}
            <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0 sticky top-0 z-50 print:hidden">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(`/proposal/${id}`)} className="text-slate-500 hover:text-slate-800 p-2 hover:bg-slate-50 rounded-full transition-colors">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-lg font-bold text-slate-900 leading-tight">Document Preview</h1>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{proposal.proposta_id}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={handlePrint}
                        className="px-4 py-2 bg-white text-slate-700 hover:bg-slate-50 rounded-lg text-sm font-bold flex items-center gap-2 border border-slate-200 transition-all shadow-sm"
                    >
                        <Download size={16}/> Generate PDF
                    </button>
                    <button 
                        onClick={() => setShowEmailModal(true)}
                        className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-bold flex items-center gap-2 transition-all shadow-lg shadow-slate-900/10"
                    >
                        <Mail size={16}/> Send Email
                    </button>
                </div>
            </div>

            {/* Print Area Style */}
            <style>{`
                @media print {
                    @page { size: A4; margin: 0; }
                    body { background: white !important; margin: 0; padding: 0; }
                    .print-container { padding: 0 !important; width: 210mm; margin: 0 !important; box-shadow: none !important; }
                    .print:hidden { display: none !important; }
                    .no-print { display: none !important; }
                }
            `}</style>

            {/* Preview Container */}
            <div className="flex-1 overflow-auto p-4 md:p-12 flex justify-center print:p-0 print:block">
                <div className="print-container w-full max-w-[210mm] bg-white shadow-2xl shadow-slate-200 rounded-sm mb-20 print:shadow-none print:m-0 print:rounded-none">
                    <ProposalPreview proposal={proposal} lines={lines} client={client} />
                </div>
            </div>

            {/* Email Modal */}
            {showEmailModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 print:hidden">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="font-bold text-lg text-slate-900">Prepare Proposal Email</h3>
                            <button onClick={() => setShowEmailModal(false)} className="text-slate-400 hover:text-slate-600 p-2">
                                <X size={20}/>
                            </button>
                        </div>
                        
                        <div className="p-6 space-y-4 overflow-y-auto flex-1">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">To</label>
                                    <input 
                                        className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-slate-900 outline-none bg-slate-50 focus:bg-white transition-all"
                                        value={emailData.to}
                                        onChange={e => setEmailData({...emailData, to: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">CC</label>
                                    <input 
                                        className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-slate-900 outline-none bg-slate-50 focus:bg-white transition-all"
                                        value={emailData.cc}
                                        onChange={e => setEmailData({...emailData, cc: e.target.value})}
                                    />
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Subject</label>
                                <input 
                                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-slate-900 outline-none font-bold text-slate-900 bg-slate-50 focus:bg-white transition-all"
                                    value={emailData.subject}
                                    onChange={e => setEmailData({...emailData, subject: e.target.value})}
                                />
                            </div>

                            <div>
                                <div className="flex justify-between items-end mb-1.5">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Message Body</label>
                                    <button 
                                        onClick={handleGenerateEmailBody}
                                        disabled={aiGenerating}
                                        className="text-[10px] text-blue-600 font-black uppercase tracking-widest flex items-center gap-1 hover:underline disabled:opacity-50"
                                    >
                                        <Sparkles size={10}/> 
                                        {aiGenerating ? 'A redigir...' : 'Escrever com IA'}
                                    </button>
                                </div>
                                <textarea 
                                    className="w-full border border-slate-200 rounded-xl px-4 py-4 text-sm focus:ring-2 focus:ring-slate-900 outline-none min-h-[180px] leading-relaxed bg-slate-50 focus:bg-white transition-all"
                                    value={emailData.body}
                                    onChange={e => setEmailData({...emailData, body: e.target.value})}
                                    placeholder="Escreva a mensagem ou use o botão de IA..."
                                />
                            </div>
                        </div>

                        <div className="px-6 py-5 border-t border-slate-50 bg-slate-50/50 flex justify-end gap-3 rounded-b-2xl">
                            <button 
                                onClick={() => setShowEmailModal(false)}
                                className="px-5 py-2.5 text-slate-500 font-bold text-sm hover:text-slate-800 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={handleSendEmail}
                                className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-black text-sm hover:bg-slate-800 shadow-xl shadow-slate-900/20 flex items-center gap-2 transition-all active:scale-95"
                            >
                                <Mail size={16}/> Abrir Email
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
