import React from 'react';

interface Option {
    id: string;
    label: string;
}

interface SegmentedControlProps {
    options: Option[];
    value: string;
    onChange: (value: any) => void;
    className?: string;
    size?: 'sm' | 'md';
}

export const SegmentedControl = ({ options, value, onChange, className = '', size = 'md' }: SegmentedControlProps) => {
    const btnClass = size === 'sm' ? 'px-3 py-1 text-[10px]' : 'px-4 py-1.5 text-xs';

    return (
        <div className={`flex bg-neutral-100 p-1 rounded-full ${className}`}>
            {options.map(opt => (
                <button
                    key={opt.id}
                    onClick={() => onChange(opt.id)}
                    className={`
                        ${btnClass} font-semibold rounded-full transition-all duration-200
                        ${value === opt.id
                            ? 'bg-white text-neutral-900 shadow-sm shadow-neutral-200'
                            : 'text-neutral-500 hover:text-neutral-700 hover:bg-neutral-200/50'
                        }
                    `}
                >
                    {opt.label}
                </button>
            ))}
        </div>
    );
};
