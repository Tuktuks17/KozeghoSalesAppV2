import { describe, expect, it } from 'vitest';
import { calculateLineTotal, calculateProposalTotal } from '../services/pricing';

describe('pricing', () => {
  it('calculates a discounted line total with 2-decimal rounding', () => {
    const result = calculateLineTotal(3, 100, 25, 10);
    expect(result.unitPrice).toBe(125);
    expect(result.discountedUnit).toBe(112.5);
    expect(result.lineTotal).toBe(337.5);
  });

  it('calculates proposal total without VAT', () => {
    const totals = calculateProposalTotal([{ total_linha: 100 }, { total_linha: 50 }], 10);
    expect(totals.subtotal).toBe(135);
    expect(totals.vat).toBe(0);
    expect(totals.total).toBe(135);
  });
});
