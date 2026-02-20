
import { Proposta, PropostaLinha, Cliente, User } from '../types';

interface DocModel {
    ref: string;
    date: string;
    validUntil: string;
    language: string;
    currency: string;
    
    seller: {
        name: string;
        address: string;
        email: string;
        phone: string;
        vat: string;
        iban: string;
        bank: string;
        website: string;
    };
    
    client: {
        name: string;
        company: string;
        vat: string;
        address: string;
        email: string;
    };
    
    items: Array<{
        description: string;
        qty: number;
        unitPrice: number;
        total: number;
    }>;
    
    totals: {
        subtotal: number;
        tax: number;
        total: number;
    };
    
    paymentTerms: string;
}

const I18N: Record<string, any> = {
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
        thanks: 'Obrigado!',
        vat: 'IVA'
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
        thanks: 'Thank you!',
        vat: 'VAT'
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
        thanks: '¡Gracias!',
        vat: 'IVA'
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
        thanks: 'Merci !',
        vat: 'TVA'
    }
};

const escapeHtml = (value: string): string =>
    value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');

const safeText = (value: string | number | undefined | null): string =>
    escapeHtml(String(value ?? ''));

const safeMultiline = (value: string | undefined | null): string =>
    safeText(value).replace(/\n/g, '<br>');

export const mapProposalToDocModel = (proposal: Proposta, client: Cliente, lines: PropostaLinha[], user: User): DocModel => {
    return {
        ref: proposal.proposta_id,
        date: new Date(proposal.data_criacao).toLocaleDateString(),
        validUntil: proposal.data_validade ? new Date(proposal.data_validade).toLocaleDateString() : '—',
        language: proposal.idioma || 'English',
        currency: proposal.moeda || 'EUR',
        
        seller: {
            name: 'Kozegho, Lda',
            address: 'Zona Industrial de Aveiro, Lote 14\n3800-000 Aveiro, Portugal',
            email: user.email,
            phone: '+351 234 000 000',
            vat: 'PT 500 000 000',
            iban: 'PT50 0000 0000 0000 0000 0000 0',
            bank: 'Banco Comercial Português',
            website: 'www.kozegho.com'
        },
        
        client: {
            name: client.nome_contacto,
            company: client.nome_empresa,
            vat: client.nif || '—',
            address: client.morada_faturacao || '—',
            email: client.email
        },
        
        items: lines.map(l => ({
            description: `${l.produto_nome}${l.selectedOptionsDetails ? `\n(${l.selectedOptionsDetails})` : ''}`,
            qty: l.quantidade,
            unitPrice: l.preco_unitario,
            total: l.total_linha
        })),
        
        totals: {
            subtotal: proposal.subtotal,
            tax: proposal.iva_valor,
            total: proposal.total
        },
        
        paymentTerms: proposal.condicoes_pagamento || '30 Days Net'
    };
};

export const renderProposalHtml = (data: DocModel): string => {
    const t = I18N[data.language] || I18N['English'];
    const fmt = new Intl.NumberFormat(data.language === 'Portuguese' ? 'pt-PT' : 'en-IE', { 
        style: 'currency', 
        currency: data.currency 
    });

    const itemsHtml = data.items.length > 0
        ? data.items.map(item => `
                    <tr>
                        <td><div class="item-desc">${safeMultiline(item.description)}</div></td>
                        <td class="col-qty">${safeText(item.qty)}</td>
                        <td class="col-unit">${fmt.format(item.unitPrice)}</td>
                        <td class="col-total">${fmt.format(item.total)}</td>
                    </tr>
                `).join('')
        : `
                    <tr>
                        <td><div class="item-desc">-</div></td>
                        <td class="col-qty">0</td>
                        <td class="col-unit">${fmt.format(0)}</td>
                        <td class="col-total">${fmt.format(0)}</td>
                    </tr>
                `;

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        @page { size: A4; margin: 0; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            color: #1a1a1a;
            line-height: 1.4;
            margin: 0;
            padding: 0;
            background: #fff;
            -webkit-print-color-adjust: exact;
        }
        .page {
            width: 210mm;
            min-height: 297mm;
            padding: 20mm;
            margin: auto;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
        }
        
        /* Layout Grid */
        header { display: flex; justify-content: space-between; margin-bottom: 40px; }
        .brand { font-size: 24px; font-weight: 800; letter-spacing: -0.02em; }
        .seller-info { text-align: right; font-size: 10px; color: #666; }
        
        .client-block { margin-bottom: 40px; }
        .client-label { font-size: 10px; font-weight: bold; color: #999; margin-bottom: 4px; text-transform: uppercase; }
        .client-name { font-size: 16px; font-weight: bold; }
        .client-details { font-size: 12px; color: #444; }

        .meta-line { 
            display: flex; 
            border-top: 1px solid #e6e6e6; 
            border-bottom: 1px solid #e6e6e6; 
            padding: 12px 0; 
            margin-bottom: 40px;
        }
        .meta-item { flex: 1; }
        .meta-label { font-size: 9px; font-weight: bold; color: #999; text-transform: uppercase; }
        .meta-value { font-size: 12px; font-weight: bold; }

        table { width: 100%; border-collapse: collapse; margin-bottom: auto; }
        th { text-align: left; font-size: 10px; color: #999; text-transform: uppercase; padding: 10px 0; border-bottom: 1px solid #e6e6e6; }
        td { padding: 12px 0; border-bottom: 1px solid #f2f2f2; font-size: 12px; vertical-align: top; }
        .col-qty { width: 50px; text-align: center; }
        .col-unit { width: 100px; text-align: right; }
        .col-total { width: 100px; text-align: right; font-weight: bold; }
        .item-desc { white-space: pre-wrap; }

        .summary-section { 
            display: grid; 
            grid-template-columns: 1.5fr 1fr 1.5fr; 
            gap: 20px; 
            padding-top: 40px;
            margin-top: 40px;
            border-top: 1px solid #e6e6e6;
        }
        .summary-block h4 { font-size: 9px; font-weight: bold; color: #999; margin: 0 0 8px 0; text-transform: uppercase; }
        .summary-content { font-size: 11px; color: #444; }
        
        .total-due-box { 
            background: #fdf2f2; 
            padding: 15px; 
            border-radius: 4px;
            text-align: right;
        }
        .total-due-box h4 { color: #b91c1c; }
        .total-value { font-size: 24px; font-weight: 800; color: #b91c1c; }

        footer { 
            margin-top: 60px; 
            text-align: center; 
            border-top: 1px solid #f2f2f2; 
            padding-top: 20px;
        }
        .thanks { font-family: Georgia, serif; font-style: italic; font-size: 18px; margin-bottom: 10px; }
        .contacts { font-size: 10px; color: #999; }
        
        @media print {
            body { margin: 0; }
            .page { box-shadow: none; margin: 0; }
        }
    </style>
</head>
<body>
    <div class="page">
        <header>
            <div class="brand">KOZEGHO</div>
            <div class="seller-info">
                <strong>${safeText(data.seller.name)}</strong><br>
                ${safeMultiline(data.seller.address)}<br>
                VAT: ${safeText(data.seller.vat)}
            </div>
        </header>

        <div class="client-block">
            <div class="client-label">Bill To</div>
            <div class="client-name">${safeText(data.client.company)}</div>
            <div class="client-details">
                Attn: ${safeText(data.client.name)}<br>
                ${safeMultiline(data.client.address)}<br>
                VAT: ${safeText(data.client.vat)}
            </div>
        </div>

        <div class="meta-line">
            <div class="meta-item">
                <div class="meta-label">${t.date}</div>
                <div class="meta-value">${safeText(data.date)}</div>
            </div>
            <div class="meta-item">
                <div class="meta-label">${t.no}</div>
                <div class="meta-value">${safeText(data.ref)}</div>
            </div>
        </div>

        <table>
            <thead>
                <tr>
                    <th>${t.desc}</th>
                    <th class="col-qty">${t.qty}</th>
                    <th class="col-unit">${t.unit}</th>
                    <th class="col-total">${t.subtotal}</th>
                </tr>
            </thead>
            <tbody>
                ${itemsHtml}
            </tbody>
        </table>

        <div class="summary-section">
            <div class="summary-block">
                <h4>${t.paymentInfo}</h4>
                <div class="summary-content">
                    Bank: ${safeText(data.seller.bank)}<br>
                    IBAN: ${safeText(data.seller.iban)}<br>
                    Terms: ${safeText(data.paymentTerms)}
                </div>
            </div>
            <div class="summary-block">
                <h4>${t.dueBy}</h4>
                <div class="summary-content">
                    <strong>${safeText(data.validUntil)}</strong>
                </div>
            </div>
            <div class="summary-block total-due-box">
                <h4>${t.totalDue}</h4>
                <div class="total-value">${fmt.format(data.totals.total)}</div>
                <div style="font-size: 9px; color: #b91c1c; opacity: 0.7; margin-top: 4px;">
                    Inc. ${t.vat} (23%): ${fmt.format(data.totals.tax)}
                </div>
            </div>
        </div>

        <footer>
            <div class="thanks">${t.thanks}</div>
            <div class="contacts">
                ${safeText(data.seller.email)} &nbsp;•&nbsp; ${safeText(data.seller.phone)} &nbsp;•&nbsp; ${safeText(data.seller.website)}
            </div>
        </footer>
    </div>
</body>
</html>
    `;
};
