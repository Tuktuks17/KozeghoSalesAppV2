export const calculateLineTotal = (
    quantity: number,
    basePrice: number,
    optionsPrice: number,
    discountPercent: number
) => {
    const unitPrice = basePrice + optionsPrice;
    const discountedUnit = unitPrice * (1 - discountPercent / 100);
    // Kozegho Business Rule: Round line total to 2 decimals
    const lineTotal = Number((discountedUnit * quantity).toFixed(2));

    return {
        unitPrice,
        discountedUnit,
        lineTotal
    };
};

export const calculateProposalTotal = (lines: { total_linha: number, iva_percent?: number }[], globalDiscountPercent: number = 0) => {
    // Sum of rounded line totals
    const subtotal = lines.reduce((acc, l) => acc + (l.total_linha || 0), 0);

    // Apply global discount if any (usually applied on lines, but just in case)
    const discountedSubtotal = subtotal * (1 - globalDiscountPercent / 100);

    // VAT - Removed as per requirement (A)
    const vat = 0;

    // Total is just the subtotal (already rounded)
    const total = Number(discountedSubtotal.toFixed(2));

    return {
        subtotal: discountedSubtotal,
        vat,
        total
    };
};
