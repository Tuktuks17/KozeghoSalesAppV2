import { CLIENT_STATUS_VALUES, PROPOSAL_RESULT_VALUES, PROPOSAL_STATUS_VALUES, type ClienteStatus, type EstadoProposta, type ResultadoProposta } from '../types';

const clientStatusMap: Record<string, ClienteStatus> = {
  lead: 'Lead',
  prospect: 'Prospect',
  'active client': 'Active Client',
  activeclient: 'Active Client',
  'inactive client': 'Inactive Client',
  inactiveclient: 'Inactive Client',
};

const proposalStatusSet = new Set<string>(PROPOSAL_STATUS_VALUES);
const proposalResultSet = new Set<string>(PROPOSAL_RESULT_VALUES);

export const normalizeClientStatus = (value?: string): ClienteStatus => {
  const normalized = (value || '').trim().toLowerCase();
  return clientStatusMap[normalized] || 'Lead';
};

export const normalizeProposalStatus = (value?: string): EstadoProposta => {
  if (value && proposalStatusSet.has(value)) {
    return value as EstadoProposta;
  }
  return 'Draft';
};

export const normalizeProposalResult = (value?: string): ResultadoProposta => {
  if (value && proposalResultSet.has(value)) {
    return value as ResultadoProposta;
  }
  return 'Open';
};
