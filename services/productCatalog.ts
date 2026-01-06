
import { Produto, AvailableOption, ProductFamily, StandardModel } from '../types';

// Helper to create models easily
const createModel = (
    family: ProductFamily,
    code: string,
    basePriceEUR: number,
    details: any = {}
): Produto => {
    return {
        produto_id: code.replace(/\s+/g, '-'),
        referencia: code,
        nome_produto: code,
        descricao_curta: details.desc || `${family} Series System`,
        descricao_detalhada: details.tech || '',
        preco_base: basePriceEUR,
        moeda: 'EUR',
        iva_percent: 23,
        tipo: 'Equipment',
        variantes_possiveis: [],
        ativo: true,
        family: family,
        optionCodes: details.optionCodes || []
    };
};

// --- CATALOG DATA ---

const MODELS: Produto[] = [
    // --- CS Series (Powder Polymer Preparation Systems) ---
    {
        produto_id: 'CS',
        referencia: 'CS',
        nome_produto: 'Powder Polymer Preparation System',
        descricao_curta: 'CS Series',
        descricao_detalhada: 'Automatic powder polymer preparation systems, CS standard models.',
        preco_base: 0, // Configurable
        moeda: 'EUR',
        iva_percent: 23,
        tipo: 'Equipment',
        variantes_possiveis: [],
        ativo: true,
        family: 'CS',
        optionCodes: []
    },

    // --- CL-D Series (Emulsion Polymer Preparation System) ---
    {
        produto_id: 'CL-D',
        referencia: 'CL-D',
        nome_produto: 'Emulsion Polymer Preparation System',
        descricao_curta: 'CL-D Series',
        descricao_detalhada: 'Automatic emulsion polymer preparation systems, CL-D standard models.',
        preco_base: 0, // Configurable
        moeda: 'EUR',
        iva_percent: 23,
        tipo: 'Equipment',
        variantes_possiveis: [],
        ativo: true,
        family: 'CL-D',
        optionCodes: []
    },

    // --- CSL Series (Powder/Emulsion Polymer Preparation Systems) ---
    {
        produto_id: 'CSL',
        referencia: 'CSL',
        nome_produto: 'Powder/Emulsion Polymer Preparation System',
        descricao_curta: 'CSL Series',
        descricao_detalhada: 'Automatic powder/emulsion polymer preparation systems, CSL standard models.',
        preco_base: 0, // Configurable
        moeda: 'EUR',
        iva_percent: 23,
        tipo: 'Equipment',
        variantes_possiveis: [],
        ativo: true,
        family: 'CSL',
        optionCodes: []
    },

    // --- PD Series (In Line Dilution Panel) ---
    {
        produto_id: 'PD',
        referencia: 'PD',
        nome_produto: 'In Line Dilution Panel',
        descricao_curta: 'PD Series',
        descricao_detalhada: 'Automatic in-line dilution panels, PD standard models.',
        preco_base: 0, // Configurable
        moeda: 'EUR',
        iva_percent: 23,
        tipo: 'Equipment',
        variantes_possiveis: [],
        ativo: true,
        family: 'PD',
        optionCodes: []
    },

    // --- BS Series (Powder Dilution Systems) ---
    {
        produto_id: 'BS',
        referencia: 'BS',
        nome_produto: 'Powder Dilution System',
        descricao_curta: 'BS Series',
        descricao_detalhada: 'Automatic powder dilution systems, BS standard models.',
        preco_base: 0, // Configurable
        moeda: 'EUR',
        iva_percent: 23,
        tipo: 'Equipment',
        variantes_possiveis: [],
        ativo: true,
        family: 'BS',
        optionCodes: []
    },

    // --- BL Series (Liquids Dilution Systems) ---
    {
        produto_id: 'BL',
        referencia: 'BL',
        nome_produto: 'Liquids Dilution System',
        descricao_curta: 'BL Series',
        descricao_detalhada: 'Automatic liquids dilution systems, BL standard models.',
        preco_base: 0, // Configurable
        moeda: 'EUR',
        iva_percent: 23,
        tipo: 'Equipment',
        variantes_possiveis: [],
        ativo: true,
        family: 'BL',
        optionCodes: []
    },

    // --- KDC Series (Chlorine Dioxide Generator) ---
    {
        produto_id: 'KDC',
        referencia: 'KDC',
        nome_produto: 'Chlorine Dioxide Generator',
        descricao_curta: 'KDC Series',
        descricao_detalhada: 'Chlorine dioxide generator systems, KDC standard models.',
        preco_base: 0, // Configurable
        moeda: 'EUR',
        iva_percent: 23,
        tipo: 'Equipment',
        variantes_possiveis: [],
        ativo: true,
        family: 'KDC',
        optionCodes: []
    },

    // --- TCP Series (Standard Storage with Cylindrical Roof) ---
    {
        produto_id: 'TCP',
        referencia: 'TCP',
        nome_produto: 'Standard Storage with Cylindrical Roof',
        descricao_curta: 'TCP Series',
        descricao_detalhada: 'Standard storage tanks with cylindrical roof.',
        preco_base: 0, // Configurable
        moeda: 'EUR',
        iva_percent: 23,
        tipo: 'Equipment',
        variantes_possiveis: [],
        ativo: true,
        family: 'TCP',
        optionCodes: []
    },

    // --- TCI Series (Sloping Bottom Tanks) ---
    {
        produto_id: 'TCI',
        referencia: 'TCI',
        nome_produto: 'Sloping Bottom Tanks',
        descricao_curta: 'TCI Series',
        descricao_detalhada: 'Sloping bottom tanks with cylindrical roof and rising floor.',
        preco_base: 0, // Configurable
        moeda: 'EUR',
        iva_percent: 23,
        tipo: 'Equipment',
        variantes_possiveis: [],
        ativo: true,
        family: 'TCI',
        optionCodes: []
    },

    // --- TCC Series (Conical Bottom Tanks) ---
    {
        produto_id: 'TCC',
        referencia: 'TCC',
        nome_produto: 'Conical Bottom Tanks',
        descricao_curta: 'TCC Series',
        descricao_detalhada: 'Conical bottom storage tanks.',
        preco_base: 0, // Configurable
        moeda: 'EUR',
        iva_percent: 23,
        tipo: 'Equipment',
        variantes_possiveis: [],
        ativo: true,
        family: 'TCC',
        optionCodes: []
    },

    // --- TPP Series (Preparation Tanks with Flat Cylinder Tops) ---
    {
        produto_id: 'TPP',
        referencia: 'TPP',
        nome_produto: 'Preparation Tanks with Flat Cylinder Tops',
        descricao_curta: 'TPP Series',
        descricao_detalhada: 'Preparation tanks with flat cylinder tops.',
        preco_base: 0, // Configurable
        moeda: 'EUR',
        iva_percent: 23,
        tipo: 'Equipment',
        variantes_possiveis: [],
        ativo: true,
        family: 'TPP',
        optionCodes: []
    },

    // --- DEP Series (Rotomoulding Tank) ---
    {
        produto_id: 'DEP',
        referencia: 'DEP',
        nome_produto: 'Rotomoulding Tank',
        descricao_curta: 'DEP Series',
        descricao_detalhada: 'Rotomoulding storage tanks with optional bund.',
        preco_base: 0, // Configurable
        moeda: 'EUR',
        iva_percent: 23,
        tipo: 'Equipment',
        variantes_possiveis: [],
        ativo: true,
        family: 'DEP',
        optionCodes: []
    },

    // --- AMR-S Series (Fast Mixers – Single-Phase) ---
    {
        produto_id: 'AMR-S',
        referencia: 'AMR-S',
        nome_produto: 'Fast Mixers – Single-Phase',
        descricao_curta: 'AMR-S Series',
        descricao_detalhada: 'Fast mixers, single-phase models AMR-S with PP propeller.',
        preco_base: 0, // Configurable
        moeda: 'EUR',
        iva_percent: 23,
        tipo: 'Equipment',
        variantes_possiveis: [],
        ativo: true,
        family: 'AMR-S',
        optionCodes: []
    },

    // --- AMR-T Series (Fast Mixers – Three-Phase) ---
    {
        produto_id: 'AMR-T',
        referencia: 'AMR-T',
        nome_produto: 'Fast Mixers – Three-Phase',
        descricao_curta: 'AMR-T Series',
        descricao_detalhada: 'Fast mixers, three-phase models AMR-T with PP propeller.',
        preco_base: 0, // Configurable
        moeda: 'EUR',
        iva_percent: 23,
        tipo: 'Equipment',
        variantes_possiveis: [],
        ativo: true,
        family: 'AMR-T',
        optionCodes: []
    },

    // --- APL Series (Slow Mixers) ---
    {
        produto_id: 'APL',
        referencia: 'APL',
        nome_produto: 'Slow Mixers',
        descricao_curta: 'APL Series',
        descricao_detalhada: 'Slow mixers, APL standard models with stainless steel shaft and propeller.',
        preco_base: 0, // Configurable
        moeda: 'EUR',
        iva_percent: 23,
        tipo: 'Equipment',
        variantes_possiveis: [],
        ativo: true,
        family: 'APL',
        optionCodes: []
    },

    // --- ATL Series (High Efficiency Mixers) ---
    {
        produto_id: 'ATL',
        referencia: 'ATL',
        nome_produto: 'High Efficiency Mixers',
        descricao_curta: 'ATL Series',
        descricao_detalhada: 'High efficiency mixers, ATL standard models with stainless steel shaft and propeller.',
        preco_base: 0, // Configurable
        moeda: 'EUR',
        iva_percent: 23,
        tipo: 'Equipment',
        variantes_possiveis: [],
        ativo: true,
        family: 'ATL',
        optionCodes: []
    },

    // --- AFL Series (Flocculation Mixers) ---
    {
        produto_id: 'AFL',
        referencia: 'AFL',
        nome_produto: 'Flocculation Mixers',
        descricao_curta: 'AFL Series',
        descricao_detalhada: 'Flocculation mixers, AFL standard models with stainless steel shaft and propeller.',
        preco_base: 0, // Configurable
        moeda: 'EUR',
        iva_percent: 23,
        tipo: 'Equipment',
        variantes_possiveis: [],
        ativo: true,
        family: 'AFL',
        optionCodes: []
    }
];

const STANDARD_MODELS: StandardModel[] = [
    // CS Models
    { model_id: 'CS_600', family_code: 'CS', standard_model_code: 'CS 600', display_name: 'CS 600', base_price_eur: 12590 },
    { model_id: 'CS_1100', family_code: 'CS', standard_model_code: 'CS 1100', display_name: 'CS 1100', base_price_eur: 12940 },
    { model_id: 'CS_1500', family_code: 'CS', standard_model_code: 'CS 1500', display_name: 'CS 1500', base_price_eur: 13750 },
    { model_id: 'CS_1900', family_code: 'CS', standard_model_code: 'CS 1900', display_name: 'CS 1900', base_price_eur: 15480 },
    { model_id: 'CS_3000', family_code: 'CS', standard_model_code: 'CS 3000', display_name: 'CS 3000', base_price_eur: 17680 },
    { model_id: 'CS_4200', family_code: 'CS', standard_model_code: 'CS 4200', display_name: 'CS 4200', base_price_eur: 19760 },
    { model_id: 'CS_5600', family_code: 'CS', standard_model_code: 'CS 5600', display_name: 'CS 5600', base_price_eur: 21260 },
    { model_id: 'CS_9000', family_code: 'CS', standard_model_code: 'CS 9000', display_name: 'CS 9000', base_price_eur: 28880 },

    // CL-D Models
    { model_id: 'CLD_600', family_code: 'CL-D', standard_model_code: 'CL-D 600', display_name: 'CL-D 600', base_price_eur: 11500 },
    { model_id: 'CLD_1100', family_code: 'CL-D', standard_model_code: 'CL-D 1100', display_name: 'CL-D 1100', base_price_eur: 12020 },
    { model_id: 'CLD_1500', family_code: 'CL-D', standard_model_code: 'CL-D 1500', display_name: 'CL-D 1500', base_price_eur: 13060 },
    { model_id: 'CLD_1900', family_code: 'CL-D', standard_model_code: 'CL-D 1900', display_name: 'CL-D 1900', base_price_eur: 14670 },
    { model_id: 'CLD_3000', family_code: 'CL-D', standard_model_code: 'CL-D 3000', display_name: 'CL-D 3000', base_price_eur: 17390 },
    { model_id: 'CLD_4200', family_code: 'CL-D', standard_model_code: 'CL-D 4200', display_name: 'CL-D 4200', base_price_eur: 23730 },

    // CSL Models
    { model_id: 'CSL_600', family_code: 'CSL', standard_model_code: 'CSL 600', display_name: 'CSL 600', base_price_eur: 15250 },
    { model_id: 'CSL_1100', family_code: 'CSL', standard_model_code: 'CSL 1100', display_name: 'CSL 1100', base_price_eur: 15770 },
    { model_id: 'CSL_1500', family_code: 'CSL', standard_model_code: 'CSL 1500', display_name: 'CSL 1500', base_price_eur: 16520 },
    { model_id: 'CSL_1900', family_code: 'CSL', standard_model_code: 'CSL 1900', display_name: 'CSL 1900', base_price_eur: 18720 },
    { model_id: 'CSL_3000', family_code: 'CSL', standard_model_code: 'CSL 3000', display_name: 'CSL 3000', base_price_eur: 21270 },
    { model_id: 'CSL_4200', family_code: 'CSL', standard_model_code: 'CSL 4200', display_name: 'CSL 4200', base_price_eur: 23800 },
    { model_id: 'CSL_5600', family_code: 'CSL', standard_model_code: 'CSL 5600', display_name: 'CSL 5600', base_price_eur: 24840 },

    // PD Models
    { model_id: 'PD_2000', family_code: 'PD', standard_model_code: 'PD 2000', display_name: 'PD 2000', base_price_eur: 1910 },
    { model_id: 'PD_4000', family_code: 'PD', standard_model_code: 'PD 4000', display_name: 'PD 4000', base_price_eur: 2030 },
    { model_id: 'PD_5000', family_code: 'PD', standard_model_code: 'PD 5000', display_name: 'PD 5000', base_price_eur: 2030 },
    { model_id: 'PD_12000', family_code: 'PD', standard_model_code: 'PD 12000', display_name: 'PD 12000', base_price_eur: 2080 },

    // BS Models
    { model_id: 'BS_300', family_code: 'BS', standard_model_code: 'BS 300', display_name: 'BS 300', base_price_eur: 7560 },
    { model_id: 'BS_600', family_code: 'BS', standard_model_code: 'BS 600', display_name: 'BS 600', base_price_eur: 7560 },
    { model_id: 'BS_1000', family_code: 'BS', standard_model_code: 'BS 1000', display_name: 'BS 1000', base_price_eur: 7970 },
    { model_id: 'BS_1500', family_code: 'BS', standard_model_code: 'BS 1500', display_name: 'BS 1500', base_price_eur: 8670 },
    { model_id: 'BS_2000', family_code: 'BS', standard_model_code: 'BS 2000', display_name: 'BS 2000', base_price_eur: 9350 },

    // BL Models
    { model_id: 'BL_300', family_code: 'BL', standard_model_code: 'BL 300', display_name: 'BL 300', base_price_eur: 6880 },
    { model_id: 'BL_600', family_code: 'BL', standard_model_code: 'BL 600', display_name: 'BL 600', base_price_eur: 7300 },
    { model_id: 'BL_1000', family_code: 'BL', standard_model_code: 'BL 1000', display_name: 'BL 1000', base_price_eur: 7740 },
    { model_id: 'BL_1500', family_code: 'BL', standard_model_code: 'BL 1500', display_name: 'BL 1500', base_price_eur: 8380 },
    { model_id: 'BL_2000', family_code: 'BL', standard_model_code: 'BL 2000', display_name: 'BL 2000', base_price_eur: 8900 },

    // KDC Models
    { model_id: 'KDC_80', family_code: 'KDC', standard_model_code: 'KDC 80', display_name: 'KDC 80', base_price_eur: 6620 },
    { model_id: 'KDC_160', family_code: 'KDC', standard_model_code: 'KDC 160', display_name: 'KDC 160', base_price_eur: 6620 },
    { model_id: 'KDC_360', family_code: 'KDC', standard_model_code: 'KDC 360', display_name: 'KDC 360', base_price_eur: 6620 },
    { model_id: 'KDC_480', family_code: 'KDC', standard_model_code: 'KDC 480', display_name: 'KDC 480', base_price_eur: 7630 },
    { model_id: 'KDC_680', family_code: 'KDC', standard_model_code: 'KDC 680', display_name: 'KDC 680', base_price_eur: 8090 },

    // TCP Models
    { model_id: 'TCP_1100', family_code: 'TCP', standard_model_code: 'TCP 1100', display_name: 'TCP 1100', base_price_eur: 1100 },
    { model_id: 'TCP_1700', family_code: 'TCP', standard_model_code: 'TCP 1700', display_name: 'TCP 1700', base_price_eur: 1510 },
    { model_id: 'TCP_2500', family_code: 'TCP', standard_model_code: 'TCP 2500', display_name: 'TCP 2500', base_price_eur: 2030 },
    { model_id: 'TCP_4000', family_code: 'TCP', standard_model_code: 'TCP 4000', display_name: 'TCP 4000', base_price_eur: 3070 },
    { model_id: 'TCP_5700', family_code: 'TCP', standard_model_code: 'TCP 5700', display_name: 'TCP 5700', base_price_eur: 3930 },
    { model_id: 'TCP_7200', family_code: 'TCP', standard_model_code: 'TCP 7200', display_name: 'TCP 7200', base_price_eur: 4910 },
    { model_id: 'TCP_8600', family_code: 'TCP', standard_model_code: 'TCP 8600', display_name: 'TCP 8600', base_price_eur: 5950 },
    { model_id: 'TCP_10100', family_code: 'TCP', standard_model_code: 'TCP 10100', display_name: 'TCP 10100', base_price_eur: 7970 },
    { model_id: 'TCP_13400', family_code: 'TCP', standard_model_code: 'TCP 13400', display_name: 'TCP 13400', base_price_eur: 8490 },
    { model_id: 'TCP_15300', family_code: 'TCP', standard_model_code: 'TCP 15300', display_name: 'TCP 15300', base_price_eur: 9980 },
    { model_id: 'TCP_17200', family_code: 'TCP', standard_model_code: 'TCP 17200', display_name: 'TCP 17200', base_price_eur: 11730 },
    { model_id: 'TCP_20400', family_code: 'TCP', standard_model_code: 'TCP 20400', display_name: 'TCP 20400', base_price_eur: 13630 },
    { model_id: 'TCP_25800', family_code: 'TCP', standard_model_code: 'TCP 25800', display_name: 'TCP 25800', base_price_eur: 17390 },
    { model_id: 'TCP_31800', family_code: 'TCP', standard_model_code: 'TCP 31800', display_name: 'TCP 31800', base_price_eur: 20510 },

    // TCI Models
    { model_id: 'TCI_1000', family_code: 'TCI', standard_model_code: 'TCI 1000', display_name: 'TCI 1000', base_price_eur: 1390 },
    { model_id: 'TCI_1600', family_code: 'TCI', standard_model_code: 'TCI 1600', display_name: 'TCI 1600', base_price_eur: 1910 },
    { model_id: 'TCI_2300', family_code: 'TCI', standard_model_code: 'TCI 2300', display_name: 'TCI 2300', base_price_eur: 2490 },
    { model_id: 'TCI_3800', family_code: 'TCI', standard_model_code: 'TCI 3800', display_name: 'TCI 3800', base_price_eur: 3640 },
    { model_id: 'TCI_5400', family_code: 'TCI', standard_model_code: 'TCI 5400', display_name: 'TCI 5400', base_price_eur: 4620 },
    { model_id: 'TCI_6800', family_code: 'TCI', standard_model_code: 'TCI 6800', display_name: 'TCI 6800', base_price_eur: 5840 },
    { model_id: 'TCI_8200', family_code: 'TCI', standard_model_code: 'TCI 8200', display_name: 'TCI 8200', base_price_eur: 6880 },
    { model_id: 'TCI_9600', family_code: 'TCI', standard_model_code: 'TCI 9600', display_name: 'TCI 9600', base_price_eur: 9190 },
    { model_id: 'TCI_12800', family_code: 'TCI', standard_model_code: 'TCI 12800', display_name: 'TCI 12800', base_price_eur: 9940 },
    { model_id: 'TCI_14500', family_code: 'TCI', standard_model_code: 'TCI 14500', display_name: 'TCI 14500', base_price_eur: 11440 },
    { model_id: 'TCI_16400', family_code: 'TCI', standard_model_code: 'TCI 16400', display_name: 'TCI 16400', base_price_eur: 13460 },

    // TCC Models
    { model_id: 'TCC_700', family_code: 'TCC', standard_model_code: 'TCC 700', display_name: 'TCC 700', base_price_eur: 1250 },
    { model_id: 'TCC_1100', family_code: 'TCC', standard_model_code: 'TCC 1100', display_name: 'TCC 1100', base_price_eur: 1870 },
    { model_id: 'TCC_1700', family_code: 'TCC', standard_model_code: 'TCC 1700', display_name: 'TCC 1700', base_price_eur: 2370 },
    { model_id: 'TCC_2700', family_code: 'TCC', standard_model_code: 'TCC 2700', display_name: 'TCC 2700', base_price_eur: 3630 },
    { model_id: 'TCC_3800', family_code: 'TCC', standard_model_code: 'TCC 3800', display_name: 'TCC 3800', base_price_eur: 4510 },
    { model_id: 'TCC_4800', family_code: 'TCC', standard_model_code: 'TCC 4800', display_name: 'TCC 4800', base_price_eur: 5990 },
    { model_id: 'TCC_5700', family_code: 'TCC', standard_model_code: 'TCC 5700', display_name: 'TCC 5700', base_price_eur: 6980 },

    // TPP Models
    { model_id: 'TPP_130', family_code: 'TPP', standard_model_code: 'TPP 130', display_name: 'TPP 130', base_price_eur: 370 },
    { model_id: 'TPP_320', family_code: 'TPP', standard_model_code: 'TPP 320', display_name: 'TPP 320', base_price_eur: 540 },
    { model_id: 'TPP_600', family_code: 'TPP', standard_model_code: 'TPP 600', display_name: 'TPP 600', base_price_eur: 680 },
    { model_id: 'TPP_1100', family_code: 'TPP', standard_model_code: 'TPP 1100', display_name: 'TPP 1100', base_price_eur: 920 },
    { model_id: 'TPP_1700', family_code: 'TPP', standard_model_code: 'TPP 1700', display_name: 'TPP 1700', base_price_eur: 1560 },
    { model_id: 'TPP_2500', family_code: 'TPP', standard_model_code: 'TPP 2500', display_name: 'TPP 2500', base_price_eur: 2080 },
    { model_id: 'TPP_4000', family_code: 'TPP', standard_model_code: 'TPP 4000', display_name: 'TPP 4000', base_price_eur: 3240 },
    { model_id: 'TPP_5700', family_code: 'TPP', standard_model_code: 'TPP 5700', display_name: 'TPP 5700', base_price_eur: 4050 },

    // DEP Models
    { model_id: 'DEP_100', family_code: 'DEP', standard_model_code: 'DEP 100', display_name: 'DEP 100', base_price_eur: 120, bund_price_eur: 380 },
    { model_id: 'DEP_200', family_code: 'DEP', standard_model_code: 'DEP 200', display_name: 'DEP 200', base_price_eur: 170, bund_price_eur: 620 },
    { model_id: 'DEP_500', family_code: 'DEP', standard_model_code: 'DEP 500', display_name: 'DEP 500', base_price_eur: 290, bund_price_eur: 720 },
    { model_id: 'DEP_1200', family_code: 'DEP', standard_model_code: 'DEP 1200', display_name: 'DEP 1200', base_price_eur: 620, bund_price_eur: 790 },

    // AMR-S Models
    { model_id: 'AMR-S_1260', family_code: 'AMR-S', standard_model_code: 'AMR-S 1260', display_name: 'AMR-S 1260', base_price_eur: 620 },
    { model_id: 'AMR-S_1280', family_code: 'AMR-S', standard_model_code: 'AMR-S 1280', display_name: 'AMR-S 1280', base_price_eur: 630 },
    { model_id: 'AMR-S_14100', family_code: 'AMR-S', standard_model_code: 'AMR-S 14100', display_name: 'AMR-S 14100', base_price_eur: 810 },
    { model_id: 'AMR-S_14120', family_code: 'AMR-S', standard_model_code: 'AMR-S 14120', display_name: 'AMR-S 14120', base_price_eur: 810 },
    { model_id: 'AMR-S_16120', family_code: 'AMR-S', standard_model_code: 'AMR-S 16120', display_name: 'AMR-S 16120', base_price_eur: 830 },
    { model_id: 'AMR-S_16140', family_code: 'AMR-S', standard_model_code: 'AMR-S 16140', display_name: 'AMR-S 16140', base_price_eur: 910 },

    // AMR-T Models
    { model_id: 'AMR-T_1260', family_code: 'AMR-T', standard_model_code: 'AMR-T 1260', display_name: 'AMR-T 1260', base_price_eur: 600 },
    { model_id: 'AMR-T_1280', family_code: 'AMR-T', standard_model_code: 'AMR-T 1280', display_name: 'AMR-T 1280', base_price_eur: 620 },
    { model_id: 'AMR-T_14100', family_code: 'AMR-T', standard_model_code: 'AMR-T 14100', display_name: 'AMR-T 14100', base_price_eur: 770 },
    { model_id: 'AMR-T_14120', family_code: 'AMR-T', standard_model_code: 'AMR-T 14120', display_name: 'AMR-T 14120', base_price_eur: 800 },
    { model_id: 'AMR-T_16120', family_code: 'AMR-T', standard_model_code: 'AMR-T 16120', display_name: 'AMR-T 16120', base_price_eur: 810 },
    { model_id: 'AMR-T_16140', family_code: 'AMR-T', standard_model_code: 'AMR-T 16140', display_name: 'AMR-T 16140', base_price_eur: 910 },

    // APL Models
    { model_id: 'APL_200', family_code: 'APL', standard_model_code: 'APL 200', display_name: 'APL 200', base_price_eur: 1330 },
    { model_id: 'APL_350', family_code: 'APL', standard_model_code: 'APL 350', display_name: 'APL 350', base_price_eur: 1450 },
    { model_id: 'APL_500', family_code: 'APL', standard_model_code: 'APL 500', display_name: 'APL 500', base_price_eur: 1620 },
    { model_id: 'APL_550', family_code: 'APL', standard_model_code: 'APL 550', display_name: 'APL 550', base_price_eur: 2720 },
    { model_id: 'APL_700', family_code: 'APL', standard_model_code: 'APL 700', display_name: 'APL 700', base_price_eur: 3240 },

    // ATL Models
    { model_id: 'ATL_600', family_code: 'ATL', standard_model_code: 'ATL 600', display_name: 'ATL 600', base_price_eur: 2720 },
    { model_id: 'ATL_850', family_code: 'ATL', standard_model_code: 'ATL 850', display_name: 'ATL 850', base_price_eur: 2830 },
    { model_id: 'ATL_1000', family_code: 'ATL', standard_model_code: 'ATL 1000', display_name: 'ATL 1000', base_price_eur: 6420 },
    { model_id: 'ATL_1200', family_code: 'ATL', standard_model_code: 'ATL 1200', display_name: 'ATL 1200', base_price_eur: 7450 },
    { model_id: 'ATL_1400', family_code: 'ATL', standard_model_code: 'ATL 1400', display_name: 'ATL 1400', base_price_eur: 8550 },
    { model_id: 'ATL_1800', family_code: 'ATL', standard_model_code: 'ATL 1800', display_name: 'ATL 1800', base_price_eur: 9820 },

    // AFL Models
    { model_id: 'AFL_500', family_code: 'AFL', standard_model_code: 'AFL 500', display_name: 'AFL 500', base_price_eur: 1970 },
    { model_id: 'AFL_600', family_code: 'AFL', standard_model_code: 'AFL 600', display_name: 'AFL 600', base_price_eur: 2830 },
    { model_id: 'AFL_800', family_code: 'AFL', standard_model_code: 'AFL 800', display_name: 'AFL 800', base_price_eur: 3070 },
    { model_id: 'AFL_1000', family_code: 'AFL', standard_model_code: 'AFL 1000', display_name: 'AFL 1000', base_price_eur: 4160 },
    { model_id: 'AFL_1200', family_code: 'AFL', standard_model_code: 'AFL 1200', display_name: 'AFL 1200', base_price_eur: 5720 },
    { model_id: 'AFL_1400', family_code: 'AFL', standard_model_code: 'AFL 1400', display_name: 'AFL 1400', base_price_eur: 6240 },
    { model_id: 'AFL_1600', family_code: 'AFL', standard_model_code: 'AFL 1600', display_name: 'AFL 1600', base_price_eur: 6990 },
    { model_id: 'AFL_2000', family_code: 'AFL', standard_model_code: 'AFL 2000', display_name: 'AFL 2000', base_price_eur: 9010 },
];

const SHARED_TANK_OPTIONS: any[] = [
    // Accessories
    { suffix: '_ACC_INDIRECT_EXTERNAL_LEVEL', label: 'Indirect external level', priceEUR: 1220 },
    { suffix: '_ACC_CONTACTS_INDIRECT_LEVEL', label: 'Contacts for indirect external level', priceEUR: 180 },
    { suffix: '_ACC_GRADUATED_SCALE', label: 'Graduated scale', priceEUR: 550 },
    { suffix: '_ACC_LADDER_4M', label: 'Vertical ladders with back protection – 4 m', priceEUR: 1970 },
    { suffix: '_ACC_LADDER_4M_WALKWAY', label: 'Vertical ladders with back protection – 4 m with walkways', priceEUR: 5490 },
    { suffix: '_ACC_LADDER_5M', label: 'Vertical ladders with back protection – 5 m', priceEUR: 2140 },
    { suffix: '_ACC_LADDER_5M_WALKWAY', label: 'Vertical ladders with back protection – 5 m with walkways', priceEUR: 5610 },
    // Thread connections
    { suffix: '_THREAD_1_2_DN20', label: 'Thread connection F/M ½" (DN20)', priceEUR: 90 },
    { suffix: '_THREAD_3_4_DN25', label: 'Thread connection F/M ¾" (DN25)', priceEUR: 100 },
    { suffix: '_THREAD_1_DN32', label: 'Thread connection F/M 1" (DN32)', priceEUR: 100 },
    { suffix: '_THREAD_1_1_4_DN40', label: 'Thread connection F/M 1¼" (DN40)', priceEUR: 110 },
    { suffix: '_THREAD_1_1_2_DN50', label: 'Thread connection F/M 1½" (DN50)', priceEUR: 140 },
    { suffix: '_THREAD_2_DN63', label: 'Thread connection F/M 2" (DN63)', priceEUR: 140 },
    // Flanged connections
    { suffix: '_FLANGE_DN15', label: 'Flange DN15', priceEUR: 100 },
    { suffix: '_FLANGE_DN20', label: 'Flange DN20', priceEUR: 120 },
    { suffix: '_FLANGE_DN25', label: 'Flange DN25', priceEUR: 130 },
    { suffix: '_FLANGE_DN32', label: 'Flange DN32', priceEUR: 140 },
    { suffix: '_FLANGE_DN40', label: 'Flange DN40', priceEUR: 150 },
    { suffix: '_FLANGE_DN50', label: 'Flange DN50', priceEUR: 160 },
    { suffix: '_FLANGE_DN65', label: 'Flange DN65', priceEUR: 180 },
    { suffix: '_FLANGE_DN80', label: 'Flange DN80', priceEUR: 200 },
    { suffix: '_FLANGE_DN100', label: 'Flange DN100', priceEUR: 210 },
];

const generateTankOptions = (families: ProductFamily[]): AvailableOption[] => {
    const options: AvailableOption[] = [];
    families.forEach(fam => {
        SHARED_TANK_OPTIONS.forEach(opt => {
            options.push({
                code: `${fam}${opt.suffix}`,
                label: opt.label,
                priceEUR: opt.priceEUR,
                families: [fam]
            });
        });
    });
    return options;
};

const TANK_FAMILIES: ProductFamily[] = ['TCP', 'TCI', 'TCC', 'TPP', 'DEP'];
const TANK_OPTIONS = generateTankOptions(TANK_FAMILIES);

const OPTIONS: AvailableOption[] = [
    // --- CS Available Options ---
    { code: 'CS_POWER_SUPPLY_400VAC', label: 'Power supply – 400 VAC / 3ph + PE without neutral', priceEUR: 1000, families: ['CS'] },
    { code: 'CS_DRAINAGE_DISCHARGE_PIPE', label: 'Drainage and discharge pipe', priceEUR: 410, families: ['CS'] },
    { code: 'CS_3RD_AGITATOR_SMALL', label: '3rd agitator Ø 200 mm, 350 mm, 500 mm', priceEUR: 1580, families: ['CS'] },
    { code: 'CS_3RD_AGITATOR_550', label: '3rd agitator Ø 550 mm', priceEUR: 2490, families: ['CS'] },
    { code: 'CS_HOPPER_100L', label: 'Hopper of 100 L', priceEUR: 810, families: ['CS'] },
    { code: 'CS_HOPPER_200L', label: 'Hopper of 200 L', priceEUR: 1110, families: ['CS'] },
    { code: 'CS_PROFIBUS', label: 'Profibus', priceEUR: 1630, families: ['CS'] },

    // --- CL-D Options ---
    { code: 'CLD_POWER_SUPPLY_400VAC', label: 'Power supply – 400 VAC / 3ph + PE without neutral', priceEUR: 1000, families: ['CL-D'] },
    { code: 'CLD_DRAINAGE_DISCHARGE_PIPE', label: 'Drainage and discharge pipe', priceEUR: 410, families: ['CL-D'] },
    { code: 'CLD_2ND_AGITATOR_SMALL', label: '2nd agitator Ø 200 mm, 350 mm, 500 mm', priceEUR: 1580, families: ['CL-D'] },
    { code: 'CLD_2ND_AGITATOR_550', label: '2nd agitator Ø 550 mm', priceEUR: 2490, families: ['CL-D'] },
    { code: 'CLD_PROFIBUS', label: 'Profibus', priceEUR: 1630, families: ['CL-D'] },

    // --- CSL Options ---
    { code: 'CSL_POWER_SUPPLY_400VAC', label: 'Power supply – 400 VAC / 3ph + PE without neutral', priceEUR: 1000, families: ['CSL'] },
    { code: 'CSL_DRAINAGE_DISCHARGE_PIPE', label: 'Drainage and discharge pipe', priceEUR: 410, families: ['CSL'] },
    { code: 'CSL_3RD_AGITATOR_SMALL', label: '3rd agitator Ø 200 mm, 350 mm, 500 mm', priceEUR: 1580, families: ['CSL'] },
    { code: 'CSL_3RD_AGITATOR_550', label: '3rd agitator Ø 550 mm', priceEUR: 2490, families: ['CSL'] },
    { code: 'CSL_HOPPER_100L', label: 'Hopper of 100 L', priceEUR: 810, families: ['CSL'] },
    { code: 'CSL_HOPPER_200L', label: 'Hopper of 200 L', priceEUR: 1110, families: ['CSL'] },
    { code: 'CSL_PROFIBUS', label: 'Profibus', priceEUR: 1580, families: ['CSL'] },

    // --- PD Options ---
    { code: 'PD_SPARE_PARTS_REPAIR_KIT', label: 'Spare parts repair kit – includes solenoid coil', priceEUR: 180, families: ['PD'] },

    // --- BS Options ---
    { code: 'BS_POWER_SUPPLY_400VAC', label: 'Power supply – 400 VAC / 3ph + PE without neutral', priceEUR: 1000, families: ['BS'] },
    { code: 'BS_DOUBLE_DECK', label: 'Double deck', priceEUR: 210, families: ['BS'] },
    { code: 'BS_POWDER_SENSOR_LEVEL', label: 'Powder sensor level', priceEUR: 410, families: ['BS'] },
    { code: 'BS_HEATING_ELEMENT', label: 'Heating element', priceEUR: 1000, families: ['BS'] },
    { code: 'BS_HOPPER_100L', label: 'Hopper of 100 L', priceEUR: 810, families: ['BS'] },
    { code: 'BS_HOPPER_200L', label: 'Hopper of 200 L', priceEUR: 1110, families: ['BS'] },

    // --- BL Options ---
    { code: 'BL_POWER_SUPPLY_400VAC', label: 'Power supply – 400 VAC / 3ph + PE without neutral', priceEUR: 1000, families: ['BL'] },
    { code: 'BL_DOUBLE_DECK', label: 'Double deck', priceEUR: 210, families: ['BL'] },
    { code: 'BL_PULSE_FLOWMETER', label: 'Pulse flowmeter', priceEUR: 370, families: ['BL'] },

    // --- KDC Options ---
    { code: 'KDC_PH_MEASUREMENT', label: 'With pH measurement', priceEUR: 690, families: ['KDC'] },
    { code: 'KDC_CLO2_MEASUREMENT', label: 'With ClO₂ measurement', priceEUR: 1220, families: ['KDC'] },
    { code: 'KDC_BOOSTER_PUMP', label: 'With booster pump', priceEUR: 1280, families: ['KDC'] },
    { code: 'KDC_STANDARD_WALL', label: 'Standard wall mounting', priceEUR: 0, families: ['KDC'], is_default_selected: true },
    { code: 'KDC_PEDESTAL', label: 'Pedestal support', priceEUR: 210, families: ['KDC'] },

    // --- Tank Options (Generated) ---
    ...TANK_OPTIONS,

    // --- DEP Specific Options ---
    { code: 'DEP_BUND', label: 'Bund (secondary containment)', priceEUR: 0, families: ['DEP'] } // Price is dynamic based on model
];

export const productCatalog = {
    getModels: () => [...MODELS],
    getOptionsForModel: (model: Produto) => {
        return OPTIONS.filter(opt => 
            opt.families.includes(model.family) || 
            model.optionCodes.includes(opt.code)
        );
    },
    getOptionsForFamily: (family: ProductFamily) => {
        return OPTIONS.filter(o => o.families.includes(family));
    },
    getStandardModels: (family: ProductFamily) => {
        return STANDARD_MODELS.filter(m => m.family_code === family);
    },
    getOption: (code: string) => {
        return OPTIONS.find(o => o.code === code);
    }
};