import React, { useState } from 'react';
import { pdf } from '@react-pdf/renderer';
import { supabase } from '../services/supabase/client';
import { proposalsRepo } from '../services/repositories/proposalsRepo';
import { api } from '../services/api';
import { ProposalPDFDocument } from '../components/ProposalPDFDocument';

interface UsePDFGenerationReturn {
    generatePDF: (proposalId: string) => Promise<string | null>;
    isGenerating: boolean;
    error: string | null;
}

export function usePDFGeneration(): UsePDFGenerationReturn {
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const generatePDF = async (proposalId: string): Promise<string | null> => {
        setIsGenerating(true);
        setError(null);

        try {
            // 1. Fetch proposal data + client
            const proposalData = await api.getPropostaById(proposalId);
            if (!proposalData) throw new Error('Proposta não encontrada');

            const client = await api.getClienteById(proposalData.proposta.cliente_id);
            if (!client) throw new Error('Cliente não encontrado');

            // 2. Render PDF to Blob using @react-pdf/renderer
            // Cast is required because pdf() types expect ReactElement<DocumentProps>
            // but our wrapper component is a valid Document tree at runtime.
            const element = (
                <ProposalPDFDocument
                    proposal={proposalData.proposta}
                    lines={proposalData.linhas}
                    client={client}
                />
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ) as unknown as Parameters<typeof pdf>[0];
            const blob = await pdf(element).toBlob();

            // 3. Upload to Supabase Storage (bucket: 'proposals')
            const storagePath = `${proposalId}/proposal.pdf`;
            const { error: uploadError } = await supabase.storage
                .from('proposals')
                .upload(storagePath, blob, {
                    contentType: 'application/pdf',
                    upsert: true,
                });

            if (uploadError) throw new Error(`Upload falhou: ${uploadError.message}`);

            // 4. Get public URL
            const { data: urlData } = supabase.storage
                .from('proposals')
                .getPublicUrl(storagePath);

            const publicUrl = urlData.publicUrl;

            // 5. Persist the URL on the proposal row
            await proposalsRepo.updateProposal(proposalId, { pdfUrl: publicUrl });

            return publicUrl;
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Erro ao gerar PDF';
            setError(msg);
            console.error('[usePDFGeneration]', msg, err);
            return null;
        } finally {
            setIsGenerating(false);
        }
    };

    return { generatePDF, isGenerating, error };
}
