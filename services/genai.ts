import { GoogleGenAI } from '@google/genai';
import { Proposta, PropostaLinha } from '../types';

const buildFallbackEmail = (proposal: Proposta) => {
  return `Dear ${proposal.cliente_nome},\n\nPlease find attached proposal ${proposal.proposta_id}.\n\nBest regards,\n${proposal.comercial_nome || 'Kozegho Team'}`;
};

export const hasGeminiApiKey = () => Boolean(import.meta.env.VITE_GEMINI_API_KEY);

export const generateProposalEmailBody = async (
  proposal: Proposta,
  lines: PropostaLinha[],
): Promise<string> => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    return buildFallbackEmail(proposal);
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const itemsList = lines
      .map((line) => `- ${line.produto_nome} (Qty: ${line.quantidade})`)
      .join('\n');

    const prompt = [
      'Write a professional sales email for a proposal.',
      `Client: ${proposal.cliente_nome}`,
      `Proposal reference: ${proposal.proposta_id}`,
      `Total value: ${proposal.total} EUR`,
      `Items:\n${itemsList || '- (no items)'}`,
      'Language: English',
      'Tone: concise and professional',
      'Do not include a subject line.',
    ].join('\n');

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: prompt,
    });

    return response.text || buildFallbackEmail(proposal);
  } catch (error) {
    console.warn('Falling back to static email body because GenAI request failed.');
    return buildFallbackEmail(proposal);
  }
};
