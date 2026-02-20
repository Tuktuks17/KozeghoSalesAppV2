import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import CreateProposal from '../pages/CreateProposal';
import { Cliente, Produto } from '../types';

const mockClient: Cliente = {
  cliente_id: 'C-1',
  nome_empresa: 'Acme Corp',
  nome_contacto: 'Ana Silva',
  nif: '123456789',
  email: 'ana@acme.com',
  telefone: '+351111111111',
  morada_faturacao: 'Rua 1',
  morada_entrega: 'Rua 1',
  pais: 'Portugal',
  segmento: 'Industry',
  data_criacao: new Date().toISOString(),
  status: 'Prospect',
  preferred_language: 'English',
  market: 'International',
};

const mockProduct: Produto = {
  produto_id: 'CS',
  referencia: 'CS',
  nome_produto: 'Powder Polymer Preparation System',
  descricao_curta: 'CS Series',
  descricao_detalhada: '',
  preco_base: 1000,
  moeda: 'EUR',
  iva_percent: 23,
  tipo: 'Equipment',
  variantes_possiveis: [],
  ativo: true,
  family: 'CS',
  optionCodes: [],
};

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { email: 'sales@kozegho.com', name: 'Sales User', photoUrl: '' },
    isAuthenticated: true,
    isLoading: false,
  }),
}));

vi.mock('../services/api', () => ({
  api: {
    getClientes: vi.fn(async () => [mockClient]),
    getProdutos: vi.fn(async () => [mockProduct]),
    createCliente: vi.fn(async (payload: Cliente) => payload),
    saveProposta: vi.fn(async () => 'P-1'),
    generateProposalDocument: vi.fn(async () => ({ success: true })),
  },
}));

describe('CreateProposal', () => {
  it('renders and adds one line item through modal configuration', async () => {
    render(
      <MemoryRouter initialEntries={['/create']}>
        <CreateProposal />
      </MemoryRouter>,
    );

    await screen.findByText('Proposal Details');

    const productCardTitle = await screen.findByText('Powder Polymer Preparation System');
    await userEvent.click(productCardTitle.closest('button')!);

    await screen.findByRole('heading', { name: 'Configure Item' });
    await userEvent.click(screen.getByRole('button', { name: 'Add Item to Proposal' }));

    await waitFor(() => {
      expect(screen.getByText(/Items \(1\)/)).toBeInTheDocument();
    });
  });
});
