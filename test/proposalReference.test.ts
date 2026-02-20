import { describe, expect, it } from 'vitest';
import { ProposalReferenceEngine } from '../services/proposalReference';

describe('proposalReference', () => {
  it('generates references using MMDD[L][I]K/YY format', () => {
    const ref = ProposalReferenceEngine.generate(new Date('2026-02-20T12:00:00Z'), 'Maria', 2);
    expect(ref).toMatch(/^\d{4}[A-Z][A-Z]K\/\d{2}$/);
    expect(ref).toContain('B');
    expect(ref).toContain('M');
  });

  it('explains valid references and rejects invalid ones', () => {
    const valid = ProposalReferenceEngine.explain('0220AMK/26');
    expect(valid.valid).toBe(true);

    const invalid = ProposalReferenceEngine.explain('invalid');
    expect(invalid.valid).toBe(false);
  });
});
