
export interface ReferenceComponents {
    month: string;
    day: string;
    year_short: string;
    sequence_letter: string;
    sales_rep_initial: string;
    company_letter: 'K';
}

export const ProposalReferenceEngine = {
    /**
     * Generates a Kozegho proposal reference.
     * Format: MMDD[L][SellerInitial]K/YY
     * L = Sequence Letter (A, B, C...) based on sequenceOfDay (1, 2, 3...)
     */
    generate: (date: Date, salesRepName: string, sequenceOfDay: number): string => {
        // 1. Date Components
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const yearShort = String(date.getFullYear()).slice(-2);

        // 2. Sequence Letter (1=A, 2=B, ..., 26=Z)
        const seqNum = Math.max(1, Math.min(26, sequenceOfDay));
        const sequenceLetter = String.fromCharCode(64 + seqNum); // 65 is A

        // 3. Seller Initial
        const initial = salesRepName.trim().charAt(0).toUpperCase();

        // 4. Construct
        return `${month}${day}${sequenceLetter}${initial}K/${yearShort}`;
    },

    /**
     * Explains a reference string by breaking it down.
     */
    explain: (reference: string) => {
        // Regex: 2 digits (MM), 2 digits (DD), 1 letter (Seq), 1 letter (Initial), K, /, 2 digits (YY)
        const regex = /^(\d{2})(\d{2})([A-Z])([A-Z])K\/(\d{2})$/;
        const match = reference.match(regex);

        if (!match) {
            return { valid: false, error: "Invalid format. Expected MMDD[L][I]K/YY" };
        }

        const [_, mm, dd, seq, init, yy] = match;

        return {
            valid: true,
            components: {
                month: mm,
                day: dd,
                sequence_letter: seq,
                sales_rep_initial: init,
                year_short: yy
            },
            human_readable: `Proposal #${seq.charCodeAt(0) - 64} of the day (${dd}/${mm}/20${yy}) by Sales Rep '${init}'`
        };
    }
};
