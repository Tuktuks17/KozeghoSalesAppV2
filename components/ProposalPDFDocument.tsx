import React from 'react';
import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';
import { Proposta, PropostaLinha, Cliente } from '../types';
import { I18N } from './ProposalPreview';

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const S = StyleSheet.create({
    page: {
        fontFamily: 'Helvetica',
        fontSize: 10,
        color: '#1a171e',
        paddingTop: 40,
        paddingBottom: 40,
        paddingHorizontal: 48,
        flexDirection: 'column',
    },

    // --- Header ---
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
        paddingBottom: 20,
        marginBottom: 24,
    },
    logoText: {
        fontSize: 22,
        fontFamily: 'Helvetica-Bold',
        color: '#0f172a',
        letterSpacing: 1,
    },
    logoSub: {
        fontSize: 7,
        color: '#94a3b8',
        letterSpacing: 1.5,
        marginTop: 2,
    },
    sellerBlock: {
        alignItems: 'flex-end',
    },
    sellerName: {
        fontSize: 8,
        fontFamily: 'Helvetica-Bold',
        color: '#0f172a',
        marginBottom: 2,
    },
    sellerDetail: {
        fontSize: 7,
        color: '#64748b',
        textAlign: 'right',
    },

    // --- Bill To & Meta ---
    meta: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 24,
    },
    section: {
        flex: 1,
    },
    sectionRight: {
        alignItems: 'flex-end',
        width: 160,
    },
    sectionLabel: {
        fontSize: 7,
        fontFamily: 'Helvetica-Bold',
        color: '#94a3b8',
        letterSpacing: 1.2,
        textTransform: 'uppercase',
        marginBottom: 6,
    },
    clientName: {
        fontSize: 11,
        fontFamily: 'Helvetica-Bold',
        color: '#0f172a',
        marginBottom: 3,
    },
    clientDetail: {
        fontSize: 8,
        color: '#64748b',
        marginBottom: 2,
    },
    infoBox: {
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 6,
        padding: 10,
        width: 160,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    infoKey: {
        fontSize: 7,
        fontFamily: 'Helvetica-Bold',
        color: '#94a3b8',
        textTransform: 'uppercase',
    },
    infoValue: {
        fontSize: 8,
        fontFamily: 'Helvetica-Bold',
        color: '#0f172a',
    },

    // --- Table ---
    tableHeader: {
        flexDirection: 'row',
        borderBottomWidth: 2,
        borderBottomColor: '#0f172a',
        paddingBottom: 6,
        marginBottom: 4,
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
        paddingVertical: 8,
    },
    colDesc: { flex: 3 },
    colQty: { width: 40, textAlign: 'center' },
    colTotal: { width: 80, textAlign: 'right' },
    thText: {
        fontSize: 7,
        fontFamily: 'Helvetica-Bold',
        color: '#0f172a',
        textTransform: 'uppercase',
    },
    tdProductName: {
        fontSize: 9,
        fontFamily: 'Helvetica-Bold',
        color: '#0f172a',
        marginBottom: 2,
    },
    tdProductDesc: {
        fontSize: 7,
        color: '#64748b',
    },
    tdQty: {
        fontSize: 9,
        color: '#475569',
        textAlign: 'center',
    },
    tdTotal: {
        fontSize: 9,
        fontFamily: 'Helvetica-Bold',
        color: '#0f172a',
        textAlign: 'right',
    },

    // --- Bottom Summary ---
    summary: {
        flexDirection: 'row',
        borderTopWidth: 1,
        borderTopColor: '#e2e8f0',
        paddingTop: 20,
        marginTop: 16,
    },
    summaryCol: { flex: 1 },
    summaryColMid: {
        flex: 1,
        borderLeftWidth: 1,
        borderRightWidth: 1,
        borderColor: '#f1f5f9',
        paddingHorizontal: 16,
    },
    summaryColRight: { width: 160 },
    totalBox: {
        backgroundColor: '#0f172a',
        borderRadius: 8,
        padding: 14,
        alignItems: 'flex-end',
    },
    totalLabel: {
        fontSize: 7,
        fontFamily: 'Helvetica-Bold',
        color: '#94a3b8',
        letterSpacing: 1.5,
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    totalValue: {
        fontSize: 18,
        fontFamily: 'Helvetica-Bold',
        color: '#ffffff',
    },
    paymentLabel: {
        fontSize: 7,
        fontFamily: 'Helvetica-Bold',
        color: '#94a3b8',
        letterSpacing: 1.2,
        textTransform: 'uppercase',
        marginBottom: 6,
    },
    paymentDetail: {
        fontSize: 8,
        color: '#64748b',
        marginBottom: 2,
    },
    paymentDetailBold: {
        fontSize: 8,
        fontFamily: 'Helvetica-Bold',
        color: '#0f172a',
    },

    // --- Footer ---
    footer: {
        marginTop: 32,
        alignItems: 'center',
    },
    footerThanks: {
        fontSize: 10,
        color: '#cbd5e1',
        marginBottom: 6,
        fontFamily: 'Helvetica-Oblique',
    },
    footerContact: {
        fontSize: 7,
        fontFamily: 'Helvetica-Bold',
        color: '#94a3b8',
        letterSpacing: 2,
        textTransform: 'uppercase',
    },
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const seller = {
    name: 'Kozegho, Lda',
    address: 'Zona Industrial de Aveiro, Lote 14, 3800-000 Aveiro',
    website: 'www.kozegho.com',
    email: 'sales@kozegho.com',
    phone: '+351 234 000 000',
    bank: 'Banco Comercial Português',
    iban: 'PT50 0000 0000 0000 0000 0000 0',
};

const formatCurrency = (value: number, currency = 'EUR'): string =>
    `${value.toFixed(2)} ${currency}`;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
interface Props {
    proposal: Proposta;
    lines: PropostaLinha[];
    client: Cliente;
}

export const ProposalPDFDocument: React.FC<Props> = ({ proposal, lines, client }) => {
    const lang = proposal.idioma || 'English';
    const t = I18N[lang] || I18N['English'];
    const currency = proposal.moeda || 'EUR';

    return (
        <Document
            title={`Proposta ${proposal.proposta_id}`}
            author={seller.name}
            subject={proposal.assunto || proposal.proposta_id}
        >
            <Page size="A4" style={S.page}>

                {/* ── Header ── */}
                <View style={S.header}>
                    <View>
                        <Text style={S.logoText}>KOZEGHO</Text>
                        <Text style={S.logoSub}>Industrial Solutions</Text>
                    </View>
                    <View style={S.sellerBlock}>
                        <Text style={S.sellerName}>{seller.name}</Text>
                        <Text style={S.sellerDetail}>{seller.address}</Text>
                        <Text style={S.sellerDetail}>{seller.website}</Text>
                    </View>
                </View>

                {/* ── Bill To + Doc Info ── */}
                <View style={S.meta}>
                    <View style={S.section}>
                        <Text style={S.sectionLabel}>Client / Billing</Text>
                        <Text style={S.clientName}>{client.nome_empresa || '—'}</Text>
                        <Text style={S.clientDetail}>{client.nome_contacto || '—'}</Text>
                        <Text style={S.clientDetail}>{client.morada_faturacao || '—'}</Text>
                    </View>
                    <View style={S.sectionRight}>
                        <Text style={S.sectionLabel}>Document Info</Text>
                        <View style={S.infoBox}>
                            <View style={S.infoRow}>
                                <Text style={S.infoKey}>{t.no}</Text>
                                <Text style={S.infoValue}>{proposal.proposta_id || '—'}</Text>
                            </View>
                            <View style={{ ...S.infoRow, marginBottom: 0 }}>
                                <Text style={S.infoKey}>{t.date}</Text>
                                <Text style={S.infoValue}>
                                    {new Date(proposal.data_criacao).toLocaleDateString()}
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* ── Table ── */}
                <View>
                    {/* Table header */}
                    <View style={S.tableHeader}>
                        <View style={S.colDesc}>
                            <Text style={S.thText}>{t.desc}</Text>
                        </View>
                        <View style={S.colQty}>
                            <Text style={S.thText}>{t.qty}</Text>
                        </View>
                        <View style={S.colTotal}>
                            <Text style={S.thText}>{t.subtotal}</Text>
                        </View>
                    </View>

                    {/* Table rows */}
                    {lines.map((line, i) => (
                        <View key={i} style={S.tableRow}>
                            <View style={S.colDesc}>
                                <Text style={S.tdProductName}>{line.produto_nome || '—'}</Text>
                                {(line.selectedOptionsDetails || line.descricao_linha) ? (
                                    <Text style={S.tdProductDesc}>
                                        {line.selectedOptionsDetails || line.descricao_linha}
                                    </Text>
                                ) : null}
                            </View>
                            <View style={S.colQty}>
                                <Text style={S.tdQty}>{line.quantidade}</Text>
                            </View>
                            <View style={S.colTotal}>
                                <Text style={S.tdTotal}>
                                    {formatCurrency(line.total_linha, currency)}
                                </Text>
                            </View>
                        </View>
                    ))}
                </View>

                {/* ── Bottom Summary ── */}
                <View style={S.summary}>
                    {/* Payment info */}
                    <View style={S.summaryCol}>
                        <Text style={S.paymentLabel}>{t.paymentInfo}</Text>
                        <Text style={S.paymentDetail}>
                            <Text style={S.paymentDetailBold}>Bank: </Text>
                            {seller.bank}
                        </Text>
                        <Text style={S.paymentDetail}>
                            <Text style={S.paymentDetailBold}>IBAN: </Text>
                            {seller.iban}
                        </Text>
                        <Text style={S.paymentDetail}>
                            <Text style={S.paymentDetailBold}>Terms: </Text>
                            {proposal.condicoes_pagamento || '—'}
                        </Text>
                    </View>

                    {/* Due by */}
                    <View style={S.summaryColMid}>
                        <Text style={S.paymentLabel}>{t.dueBy}</Text>
                        <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: '#0f172a' }}>
                            {proposal.data_validade
                                ? new Date(proposal.data_validade).toLocaleDateString()
                                : '—'}
                        </Text>
                        <Text style={{ fontSize: 7, color: '#94a3b8', marginTop: 3 }}>
                            Valid for 30 days
                        </Text>
                    </View>

                    {/* Total box */}
                    <View style={S.summaryColRight}>
                        <View style={S.totalBox}>
                            <Text style={S.totalLabel}>{t.totalDue}</Text>
                            <Text style={S.totalValue}>
                                {formatCurrency(proposal.total, currency)}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* ── Footer ── */}
                <View style={S.footer}>
                    <Text style={S.footerThanks}>{t.thanks}</Text>
                    <Text style={S.footerContact}>
                        {seller.email}  •  {seller.phone}
                    </Text>
                </View>

            </Page>
        </Document>
    );
};
