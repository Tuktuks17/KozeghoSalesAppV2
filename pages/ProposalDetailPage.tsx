import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit2, FileDown } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Proposta, PropostaLinha } from '../types';

const DetailRow = ({ label, value }: { label: string; value?: React.ReactNode }) => (
    <div className="flex justify-between py-3 border-b border-slate-50 last:border-0">
        <span className="text-sm text-slate-500">{label}</span>
        <span className="text-sm font-medium text-slate-900 text-right max-w-[60%]">{value || '—'}</span>
    </div>
);

const STATUS_COLORS: Record<string, string> = {
    'Draft': 'bg-slate-100 text-slate-600',
    'Pending Approval': 'bg-yellow-50 text-yellow-700',
    'Approved': 'bg-blue-50 text-blue-700',
    'Sent': 'bg-indigo-50 text-indigo-700',
    'Won': 'bg-green-50 text-green-700',
    'Lost': 'bg-red-50 text-red-700',
    'Doc Generated': 'bg-purple-50 text-purple-700',
};

const StatusBadge = ({ status }: { status: string }) => (
    <span className={`px-3 py-1 rounded-full text-sm font-bold ${STATUS_COLORS[status] ?? 'bg-slate-100 text-slate-600'}`}>
        {status}
    </span>
);

export default function ProposalDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<{ proposta: Proposta; linhas: PropostaLinha[] } | null>(null);

    useEffect(() => {
        if (!id) return;
        api.getPropostaById(id).then(res => {
            setData(res);
            setLoading(false);
        });
    }, [id]);

    if (loading) return <div className="p-10 text-center text-slate-400">A carregar proposta…</div>;
    if (!data) return <div className="p-10 text-center text-slate-500">Proposta não encontrada.</div>;

    const { proposta, linhas } = data;
    const proposalId = proposta.internal_id || proposta.proposta_id;

    // Edit visible if user owns the proposal and it is still in Draft
    const canEdit = proposta.comercial_email === user?.email && proposta.estado === 'Draft';

    return (
        <div className="max-w-5xl mx-auto pb-20">
            <button
                onClick={() => navigate('/proposals')}
                className="flex items-center text-slate-500 hover:text-slate-900 text-sm mb-6 transition-colors"
            >
                <ArrowLeft size={16} className="mr-1" /> Voltar às Propostas
            </button>

            {/* Header card */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm mb-6">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                    <div>
                        <div className="flex flex-wrap items-center gap-3 mb-2">
                            <h1 className="text-2xl font-bold text-slate-900">
                                {proposta.assunto || '(sem assunto)'}
                            </h1>
                            <StatusBadge status={proposta.estado} />
                        </div>
                        <p className="text-xs text-slate-400 mb-1">Ref: {proposta.proposta_id}</p>
                        <p className="text-sm text-slate-500">
                            Cliente:{' '}
                            <span className="font-medium text-slate-900">{proposta.cliente_nome}</span>
                        </p>
                    </div>

                    <div className="flex gap-2 shrink-0">
                        {canEdit && (
                            <button
                                onClick={() => navigate(`/proposal/${proposalId}`)}
                                className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-4 py-2 rounded-lg font-medium flex items-center gap-2 text-sm transition-colors"
                            >
                                <Edit2 size={16} /> Editar
                            </button>
                        )}

                        {/* PDF — placeholder, disabled */}
                        <div className="relative group">
                            <button
                                disabled
                                className="bg-slate-100 text-slate-400 px-4 py-2 rounded-lg font-medium flex items-center gap-2 text-sm cursor-not-allowed select-none"
                            >
                                <FileDown size={16} /> Gerar PDF
                            </button>
                            <div className="absolute bottom-full right-0 mb-2 px-3 py-1.5 bg-neutral-900 text-white text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-10 transition-opacity shadow-lg">
                                Em breve
                                <div className="absolute top-full right-4 w-2 h-2 bg-neutral-900 rotate-45 -translate-y-1" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Details grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                    <h2 className="font-bold text-slate-900 mb-4">Detalhes</h2>
                    <DetailRow label="Resultado" value={proposta.resultado} />
                    <DetailRow
                        label="Validade"
                        value={proposta.data_validade ? new Date(proposta.data_validade).toLocaleDateString() : undefined}
                    />
                    <DetailRow label="Moeda" value={proposta.moeda} />
                    <DetailRow label="Idioma" value={proposta.idioma} />
                    <DetailRow label="Mercado" value={proposta.mercado} />
                    <DetailRow label="Cond. Pagamento" value={proposta.condicoes_pagamento} />
                    <DetailRow label="Cond. Entrega" value={proposta.condicoes_entrega} />
                    <DetailRow
                        label="Prazo Entrega"
                        value={proposta.prazo_entrega_semanas ? `${proposta.prazo_entrega_semanas} semanas` : undefined}
                    />
                    <DetailRow label="Comercial" value={proposta.comercial_nome} />
                    <DetailRow
                        label="Criado em"
                        value={new Date(proposta.data_criacao).toLocaleString()}
                    />
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                    <h2 className="font-bold text-slate-900 mb-4">Resumo Financeiro</h2>
                    <DetailRow label="Subtotal" value={`${proposta.subtotal.toFixed(2)} €`} />
                    <DetailRow label="Desconto Global" value={`${proposta.desconto_global_percent}%`} />
                    <div className="flex justify-between pt-4 mt-2 border-t border-slate-200">
                        <span className="text-base font-bold text-slate-900">Total</span>
                        <span className="text-base font-bold text-slate-900">
                            {proposta.total.toFixed(2)} €
                        </span>
                    </div>
                </div>
            </div>

            {/* Lines table */}
            {linhas.length > 0 && (
                <div className="mt-6 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                    <div className="px-6 py-4 border-b border-slate-200">
                        <h2 className="font-bold text-slate-900">Linhas da Proposta</h2>
                    </div>
                    <table className="w-full text-left">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">Produto</th>
                                <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase text-right">Qtd</th>
                                <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase text-right">Preço Unit.</th>
                                <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase text-right">Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {linhas.map(linha => (
                                <tr key={linha.linha_id}>
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-slate-900">{linha.produto_nome}</div>
                                        {linha.descricao_linha && (
                                            <div className="text-xs text-slate-400">{linha.descricao_linha}</div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right text-sm text-slate-700">{linha.quantidade}</td>
                                    <td className="px-6 py-4 text-right text-sm text-slate-700">
                                        {linha.preco_unitario.toFixed(2)} €
                                    </td>
                                    <td className="px-6 py-4 text-right font-medium text-slate-900">
                                        {linha.total_linha.toFixed(2)} €
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Notes */}
            {(proposta.observacoes_para_cliente || proposta.observacoes_internas) && (
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {proposta.observacoes_para_cliente && (
                        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                            <h3 className="font-bold text-slate-900 mb-3">Notas para o Cliente</h3>
                            <p className="text-sm text-slate-600 leading-relaxed">
                                {proposta.observacoes_para_cliente}
                            </p>
                        </div>
                    )}
                    {proposta.observacoes_internas && (
                        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                            <h3 className="font-bold text-slate-900 mb-3">Notas Internas</h3>
                            <p className="text-sm text-slate-600 leading-relaxed">
                                {proposta.observacoes_internas}
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
