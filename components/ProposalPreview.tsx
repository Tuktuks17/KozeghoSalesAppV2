
import React from 'react';
import { Proposta, PropostaLinha, Cliente } from '../types';

export const I18N: Record<string, any> = {
    'Portuguese': {
        proposal: 'Proposta',
        date: 'Data da Proposta',
        no: 'Nº Proposta',
        desc: 'Descrição',
        qty: 'Qtd',
        unit: 'Preço Unit.',
        subtotal: 'Subtotal',
        paymentInfo: 'INFO. PAGAMENTO',
        dueBy: 'VENCE EM',
        totalDue: 'TOTAL A PAGAR',
        thanks: 'Obrigado pela preferência!',
        vat: 'IVA (23%)'
    },
    'English': {
        proposal: 'Proposal',
        date: 'Proposal Date',
        no: 'Proposal No.',
        desc: 'Description',
        qty: 'Qty',
        unit: 'Unit Price',
        subtotal: 'Subtotal',
        paymentInfo: 'PAYMENT INFO',
        dueBy: 'DUE BY',
        totalDue: 'TOTAL DUE',
        thanks: 'Thank you for your business!',
        vat: 'VAT (23%)'
    },
    'Spanish': {
        proposal: 'Propuesta',
        date: 'Fecha',
        no: 'Nº Propuesta',
        desc: 'Descripción',
        qty: 'Cant',
        unit: 'Prec. Unit',
        subtotal: 'Subtotal',
        paymentInfo: 'INFO. DE PAGO',
        dueBy: 'VENCE',
        totalDue: 'TOTAL A PAGAR',
        thanks: '¡Gracias por su confianza!',
        vat: 'IVA (23%)'
    },
    'French': {
        proposal: 'Proposition',
        date: 'Date',
        no: 'Nº Proposition',
        desc: 'Description',
        qty: 'Qté',
        unit: 'Prix Unit.',
        subtotal: 'Sous-total',
        paymentInfo: 'INFOS PAIEMENT',
        dueBy: 'ÉCHÉANCE',
        totalDue: 'TOTAL DÛ',
        thanks: 'Merci pour votre confiance !',
        vat: 'TVA (23%)'
    }
};

interface ProposalPreviewProps {
    proposal: Proposta;
    lines: PropostaLinha[];
    client: Cliente;
}

export const ProposalPreview: React.FC<ProposalPreviewProps> = ({ proposal, lines, client }) => {
    const lang = proposal.idioma || 'English';
    const t = I18N[lang] || I18N['English'];

    const fmt = new Intl.NumberFormat(lang === 'Portuguese' ? 'pt-PT' : 'en-IE', {
        style: 'currency',
        currency: proposal.moeda || 'EUR'
    });

    const seller = {
        name: 'Kozegho, Lda',
        address: 'Zona Industrial de Aveiro, Lote 14, 3800-000 Aveiro, Portugal',
        email: 'sales@kozegho.com',
        phone: '+351 234 000 000',
        vat: 'PT 500 000 000',
        iban: 'PT50 0000 0000 0000 0000 0000 0',
        bank: 'Banco Comercial Português',
        website: 'www.kozegho.com'
    };

    return (
        <div className="bg-white p-[15mm] md:p-[20mm] font-sans text-[#1a171e] leading-relaxed min-h-[297mm] flex flex-col box-border shadow-none print:p-[15mm]">
            {/* Header */}
            <div className="flex justify-between items-start mb-12 border-b border-slate-100 pb-8">
                <div>
                    <div className="text-3xl font-black tracking-tighter text-slate-900 mb-1">KOZEGHO</div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest italic">Industrial Solutions</div>
                </div>
                <div className="text-right text-[10px] text-slate-500 space-y-0.5">
                    <div className="font-black text-slate-900 text-xs mb-1">{seller.name}</div>
                    <div>{seller.address}</div>
                    {/* VAT Removed */}
                    <div>{seller.website}</div>
                </div>
            </div>

            {/* Bill To & Meta Section */}
            <div className="grid grid-cols-2 gap-10 mb-12">
                <div>
                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Client / Billing</div>
                    <div className="text-base font-bold text-slate-900 mb-1">{client.nome_empresa || '—'}</div>
                    <div className="text-xs text-slate-500 space-y-1">
                        <div>{client.nome_contacto || '—'}</div>
                        <div className="max-w-[250px]">{client.morada_faturacao || '—'}</div>
                        {/* VAT Removed */}
                    </div>
                </div>
                <div className="flex flex-col items-end">
                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Document Info</div>
                    <div className="bg-slate-50 p-4 rounded-lg w-full max-w-[200px] border border-slate-100">
                        <div className="flex justify-between mb-2">
                            <span className="text-[9px] font-bold text-slate-400 uppercase">{t.no}</span>
                            <span className="text-xs font-black text-slate-900">{proposal.proposta_id || '—'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-[9px] font-bold text-slate-400 uppercase">{t.date}</span>
                            <span className="text-xs font-bold text-slate-700">{new Date(proposal.data_criacao).toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="flex-1">
                <table className="w-full mb-8">
                    <thead>
                        <tr className="border-b-2 border-slate-900">
                            <th className="text-left text-[10px] font-black text-slate-900 uppercase py-3 w-3/5">{t.desc}</th>
                            <th className="text-center text-[10px] font-black text-slate-900 uppercase py-3">{t.qty}</th>
                            <th className="text-right text-[10px] font-black text-slate-900 uppercase py-3">{t.subtotal}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {lines.map((l, i) => (
                            <tr key={i} className="group">
                                <td className="py-4 text-xs">
                                    <div className="font-bold text-slate-900 mb-0.5">{l.produto_nome || '—'}</div>
                                    <div className="text-slate-500 text-[10px] leading-relaxed max-w-[400px]">
                                        {l.selectedOptionsDetails || l.descricao_linha || '—'}
                                    </div>
                                </td>
                                <td className="py-4 text-xs text-center font-medium text-slate-600">{l.quantidade}</td>
                                <td className="py-4 text-xs text-right font-bold text-slate-900">{fmt.format(l.total_linha)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Bottom Summary */}
            <div className="mt-12 pt-8 border-t border-slate-100">
                <div className="grid grid-cols-3 gap-8">
                    <div className="col-span-1">
                        <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">{t.paymentInfo}</div>
                        <div className="text-[10px] text-slate-500 leading-tight space-y-1">
                            <div><strong>Bank:</strong> {seller.bank}</div>
                            <div><strong>IBAN:</strong> {seller.iban}</div>
                            <div><strong>Terms:</strong> {proposal.condicoes_pagamento}</div>
                        </div>
                    </div>
                    <div className="col-span-1 border-x border-slate-50 px-8">
                        <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">{t.dueBy}</div>
                        <div className="text-xs font-black text-slate-900">
                            {proposal.data_validade ? new Date(proposal.data_validade).toLocaleDateString() : '—'}
                        </div>
                        <div className="text-[9px] text-slate-400 mt-1 italic">Vaild for 30 days</div>
                    </div>
                    <div className="col-span-1">
                        <div className="bg-slate-900 text-white p-5 rounded-xl text-right shadow-xl shadow-slate-900/10">
                            <div className="text-[9px] font-bold text-slate-400 uppercase mb-1 tracking-widest">{t.totalDue}</div>
                            <div className="text-2xl font-black">{fmt.format(proposal.total)}</div>
                            {/* VAT Removed */}
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="mt-16 text-center">
                <div className="text-base italic font-serif text-slate-300 mb-3">{t.thanks}</div>
                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                    {seller.email} &bull; {seller.phone}
                </div>
            </div>
        </div>
    );
};
