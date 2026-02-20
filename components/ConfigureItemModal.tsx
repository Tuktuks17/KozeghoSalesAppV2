import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Produto, StandardModel, AvailableOption } from '../types';
import { productCatalog } from '../services/productCatalog';
import { calculateLineTotal } from '../services/pricing';

interface ConfigureItemModalProps {
    isOpen: boolean;
    product: Produto | null;
    onClose: () => void;
    onConfirm: (lineItem: any) => void;
}

export const ConfigureItemModal: React.FC<ConfigureItemModalProps> = ({ isOpen, product, onClose, onConfirm }) => {
    const [standardModels, setStandardModels] = useState<StandardModel[]>([]);
    const [availableOptions, setAvailableOptions] = useState<AvailableOption[]>([]);

    // Form State
    const [selectedModelId, setSelectedModelId] = useState<string>('');
    const [qty, setQty] = useState(1);
    const [discount, setDiscount] = useState(0);
    const [selectedOptionCodes, setSelectedOptionCodes] = useState<string[]>([]);

    useEffect(() => {
        if (product && isOpen) {
            // Load specific configuration for this family/product
            const models = productCatalog.getStandardModels(product.family);
            const options = productCatalog.getOptionsForFamily(product.family);

            setStandardModels(models);
            setAvailableOptions(options);

            // Set defaults
            setQty(1);
            setDiscount(0);

            if (models.length > 0) {
                // Default to first model
                setSelectedModelId(models[0].model_id);
            } else {
                setSelectedModelId('');
            }

            // Default selected options
            const defaults = options.filter(o => o.is_default_selected).map(o => o.code);
            setSelectedOptionCodes(defaults);
        }
    }, [product, isOpen]);

    if (!isOpen || !product) return null;

    // Calculations
    const getSelectedModel = () => standardModels.find(m => m.model_id === selectedModelId);

    const basePrice = getSelectedModel()?.base_price_eur || product.preco_base || 0;

    const optionsTotal = selectedOptionCodes.reduce((acc, code) => {
        const opt = availableOptions.find(o => o.code === code);
        return acc + (opt?.priceEUR || 0);
    }, 0);

    const unitPrice = basePrice + optionsTotal;
    // const lineTotal = unitPrice * qty * (1 - discount / 100);
    // Use consistent logic
    const { lineTotal } = calculateLineTotal(qty, basePrice, optionsTotal, discount);

    const handleConfirm = () => {
        const model = getSelectedModel();
        onConfirm({
            produto_id: model ? model.model_id : product.produto_id,
            produto_nome: model ? model.display_name : product.nome_produto,
            standard_model_code: model?.standard_model_code,
            base_price_eur: basePrice,
            quantidade: qty,
            desconto_percent: discount,
            selectedOptionCodes,
            preco_unitario: unitPrice,
            total_linha: lineTotal,
            descricao_linha: product.descricao_curta
        });
        onClose();
    };

    const toggleOption = (code: string) => {
        setSelectedOptionCodes(prev =>
            prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
        );
    };

    return (
        <div className="fixed inset-0 bg-neutral-900/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-scale-in border border-neutral-100">
                {/* Header */}
                <div className="px-8 py-5 border-b border-neutral-100 flex justify-between items-center bg-white">
                    <div>
                        <h3 className="text-xl font-bold text-neutral-900 tracking-tight">Configure Item</h3>
                        <p className="text-sm text-neutral-500">{product.nome_produto}</p>
                    </div>
                    <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600 p-2 rounded-full hover:bg-neutral-50 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-8 overflow-y-auto flex-1 space-y-8">
                    {/* Model Selection */}
                    {standardModels.length > 0 && (
                        <div>
                            <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Standard Model</label>
                            <div className="relative">
                                <select
                                    className="w-full input-field bg-white focus:ring-2 focus:ring-primary-500/20"
                                    value={selectedModelId}
                                    onChange={(e) => setSelectedModelId(e.target.value)}
                                >
                                    {standardModels.map(m => (
                                        <option key={m.model_id} value={m.model_id}>
                                            {m.standard_model_code} – {new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' }).format(m.base_price_eur)}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}

                    {/* Qty & Discount */}
                    <div className="grid grid-cols-2 gap-6">
                        <Input
                            label="Quantity"
                            type="number"
                            min={1}
                            value={qty}
                            onChange={(e: any) => setQty(Math.max(1, parseInt(e.target.value) || 1))}
                        />
                        <Input
                            label="Discount %"
                            type="number"
                            min={0}
                            max={100}
                            value={discount}
                            onChange={(e: any) => setDiscount(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                        />
                    </div>

                    {/* Options */}
                    {availableOptions.length > 0 && (
                        <div>
                            <div className="flex justify-between items-end mb-3">
                                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider">Available Options</label>
                                <span className="text-xs text-neutral-400">Prices in EUR</span>
                            </div>
                            <div className="border border-neutral-200 rounded-xl divide-y divide-neutral-100 max-h-60 overflow-y-auto bg-neutral-50/30">
                                {availableOptions.map(opt => {
                                    const isSelected = selectedOptionCodes.includes(opt.code);
                                    return (
                                        <div
                                            key={opt.code}
                                            className={`flex items-center justify-between px-5 py-3 hover:bg-white transition-colors cursor-pointer group ${isSelected ? 'bg-primary-50/30' : ''}`}
                                            onClick={() => toggleOption(opt.code)}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all duration-200 ${isSelected ? 'bg-primary border-primary text-white shadow-sm' : 'border-neutral-300 bg-white group-hover:border-neutral-400'}`}>
                                                    {isSelected && <Check size={12} strokeWidth={3} />}
                                                </div>
                                                <span className={`text-sm ${isSelected ? 'text-neutral-900 font-bold' : 'text-neutral-600'}`}>{opt.label}</span>
                                            </div>
                                            <span className="text-sm font-medium text-neutral-400">
                                                {opt.priceEUR > 0 ? `+ €${opt.priceEUR.toLocaleString()}` : 'Included'}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-neutral-100 bg-white sticky bottom-0 z-10 flex flex-col gap-4">
                    <div className="flex justify-between items-center px-2">
                        <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Line Total</span>
                        <span className="text-3xl font-bold text-neutral-900 tracking-tight">
                            {new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' }).format(lineTotal)}
                        </span>
                    </div>
                    <Button
                        onClick={handleConfirm}
                        className="w-full text-lg shadow-lg shadow-primary/20"
                        size="lg"
                    >
                        Add Item to Proposal
                    </Button>
                </div>
            </div>
        </div>
    );
};
