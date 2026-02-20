import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, CheckCircle, FileText, Send } from 'lucide-react';
import { api } from '../services/api';
import { Proposta, PropostaLinha } from '../types';

const StatusBadge = ({ estado }: { estado: string }) => {
    const colors: any = { 
        'Draft': 'bg-slate-100 text-slate-600', 
        'Pending Approval': 'bg-orange-100 text-orange-700', 
        'Approved': 'bg-blue-100 text-blue-700', 
        'Sent': 'bg-purple-100 text-purple-700', 
        'Won': 'bg-green-100 text-green-700', 
        'Lost': 'bg-red-100 text-red-700' 
    };
    return <span className={`px-3 py-1 rounded-full text-sm font-bold ${colors[estado] || 'bg-gray-100'}`}>{estado}</span>;
};

export default function ProposalDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [data, setData] = useState<{ proposta: Proposta, linhas: PropostaLinha[] } | null>(null);
    const [lostReason, setLostReason] = useState('');
    const [showLostModal, setShowLostModal] = useState(false);

    useEffect(() => { if(id) loadData(id); }, [id]);

    const loadData = async (propId: string) => {
        const res = await api.getPropostaById(propId);
        setData(res);
        setLoading(false);
    };

    const handleStatusChange = async (newEstado: any, newResultado: any, extras: any = {}) => {
        if(!data) return;
        const proposalId = data.proposta.internal_id || data.proposta.proposta_id;
        await api.updatePropostaEstado(proposalId, newEstado, newResultado, 
            { ...extras, data_resultado: newResultado === 'Won' || newResultado === 'Lost' ? new Date().toISOString() : undefined }
        );
        loadData(proposalId);
    };

    const handleGenerateAndSend = async () => {
        if(!data) return;
        setGenerating(true);
        const proposalId = data.proposta.internal_id || data.proposta.proposta_id;
        await api.gerarEEnviarProposta(proposalId);
        await loadData(proposalId);
        setGenerating(false);
    };

    const handleLostConfirm = async () => {
        await handleStatusChange('Lost', 'Lost', { motivo_perda: lostReason });
        setShowLostModal(false);
    };

    if (loading) return <div className="p-10 text-center text-slate-500">Loading details...</div>;
    if (!data) return <div className="p-10 text-center">Proposal not found.</div>;

    const { proposta, linhas } = data;

    return (
        <div className="space-y-6 pb-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <button onClick={() => navigate('/')} className="flex items-center text-slate-500 hover:text-slate-900 text-sm mb-2">
                        <ArrowLeft size={16} className="mr-1"/> Back to Dashboard
                    </button>
                    <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                        {proposta.cliente_nome}
                        <StatusBadge estado={proposta.estado} />
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">
                        ID: {proposta.proposta_id} • Created {new Date(proposta.data_criacao).toLocaleDateString('en-GB')}
                    </p>
                </div>
                <div className="flex gap-2">
                    {proposta.estado === 'Pending Approval' && (
                        <button onClick={() => handleStatusChange('Approved', 'Open', { data_aprovacao: new Date().toISOString() })} className="btn bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-lg font-medium flex items-center">
                            <CheckCircle size={18} className="mr-2"/> Approve Internally
                        </button>
                    )}
                    {proposta.estado === 'Approved' && (
                        <button onClick={handleGenerateAndSend} disabled={generating} className="btn bg-slate-900 text-white hover:bg-slate-800 px-4 py-2 rounded-lg font-medium flex items-center">
                            {generating ? 'Processing...' : <><Send size={18} className="mr-2"/> Send by Email</>}
                        </button>
                    )}
                    {proposta.link_pdf_proposta && (
                        <a href={proposta.link_pdf_proposta} target="_blank" rel="noreferrer" className="btn border border-slate-300 text-slate-700 hover:bg-slate-50 px-4 py-2 rounded-lg font-medium flex items-center">
                            <FileText size={18} className="mr-2"/> View PDF
                        </a>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200"><h3 className="font-bold text-slate-700">Items</h3></div>
                        <table className="w-full text-sm text-left">
                            <thead>
                                <tr className="text-slate-500 border-b border-slate-100">
                                    <th className="px-6 py-3 font-medium">Product</th>
                                    <th className="px-6 py-3 font-medium text-right">Qty</th>
                                    <th className="px-6 py-3 font-medium text-right">Price</th>
                                    <th className="px-6 py-3 font-medium text-right">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {linhas.map(l => (
                                    <tr key={l.linha_id}>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-slate-900">{l.produto_nome}</div>
                                            {l.extras && <div className="text-slate-500 text-xs italic mt-1">{l.extras}</div>}
                                        </td>
                                        <td className="px-6 py-4 text-right">{l.quantidade}</td>
                                        <td className="px-6 py-4 text-right">{l.preco_unitario.toFixed(2)}€</td>
                                        <td className="px-6 py-4 text-right font-medium">{l.total_linha.toFixed(2)}€</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-slate-50/50">
                                <tr className="border-t border-slate-200">
                                    <td colSpan={3} className="px-6 py-4 text-right font-bold text-lg text-slate-900">Total</td>
                                    <td className="px-6 py-4 text-right font-bold text-lg text-slate-900">{proposta.total.toFixed(2)}€</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
                <div className="space-y-6">
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Client</h3>
                        <div className="font-medium text-slate-900">{proposta.cliente_nome}</div>
                        <div className="text-sm text-slate-500 mt-1">{proposta.cliente_email}</div>
                        <button onClick={() => navigate(`/client/${proposta.cliente_id}`)} className="text-xs text-blue-600 font-bold mt-3 hover:underline">View Client CRM Profile</button>
                    </div>

                    {proposta.resultado === 'Open' && proposta.estado === 'Sent' && (
                         <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Close Deal</h3>
                            <div className="grid grid-cols-2 gap-3">
                                <button onClick={() => handleStatusChange('Won', 'Won')} className="p-4 border border-green-200 bg-green-50 rounded-lg hover:bg-green-100 text-green-700 font-bold">Won</button>
                                <button onClick={() => setShowLostModal(true)} className="p-4 border border-red-200 bg-red-50 rounded-lg hover:bg-red-100 text-red-700 font-bold">Lost</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {showLostModal && (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md">
                        <h3 className="font-bold text-lg mb-4">Mark as Lost</h3>
                        <label className="text-sm font-bold text-slate-700">Reason for loss</label>
                        <textarea className="w-full border border-slate-200 rounded-lg p-3 mt-2 mb-4 text-sm" rows={3} value={lostReason} onChange={e => setLostReason(e.target.value)} placeholder="Price too high, competitor..."/>
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setShowLostModal(false)} className="px-4 py-2 text-slate-600 rounded-lg font-medium">Cancel</button>
                            <button onClick={handleLostConfirm} className="px-4 py-2 bg-red-600 text-white rounded-lg font-bold">Confirm Loss</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
