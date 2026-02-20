import React from 'react';
import { Search } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    icon?: React.ReactNode;
    fullWidth?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className = '', label, error, icon, fullWidth = true, ...props }, ref) => {
        return (
            <div className={`${fullWidth ? 'w-full' : ''} flex flex-col gap-1.5`}>
                {label && <label className="text-xs font-semibold text-neutral-700 ml-1">{label}</label>}
                <div className="relative group">
                    {icon && (
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 group-focus-within:text-neutral-600 transition-colors pointer-events-none">
                            {icon}
                        </div>
                    )}
                    <input
                        ref={ref}
                        className={`
              ${fullWidth ? 'w-full' : ''} 
              ${icon ? 'pl-9' : 'pl-3.5'} 
              pr-3.5 py-3
              bg-white text-neutral-900 border border-neutral-200 
              rounded-xl text-sm font-medium transition-all duration-200
              placeholder:text-neutral-400 placeholder:font-normal
              focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary
              disabled:bg-neutral-50 disabled:text-neutral-400
              ${error ? 'border-red-300 focus:ring-red-100 focus:border-red-400' : ''}
              ${className}
            `}
                        {...props}
                    />
                </div>
                {error && <p className="text-xs text-red-500 ml-1">{error}</p>}
            </div>
        );
    }
);
Input.displayName = 'Input';

export const SearchInput = React.forwardRef<HTMLInputElement, Omit<InputProps, 'icon'>>(
    (props, ref) => <Input ref={ref} icon={<Search size={16} />} placeholder="Search..." {...props} />
);
SearchInput.displayName = 'SearchInput';

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    error?: string;
    fullWidth?: boolean;
}

export const TextArea = React.forwardRef<HTMLTextAreaElement, TextAreaProps>(
    ({ className = '', label, error, fullWidth = true, ...props }, ref) => {
        return (
            <div className={`${fullWidth ? 'w-full' : ''} flex flex-col gap-1.5`}>
                {label && <label className="text-xs font-semibold text-neutral-700 ml-1">{label}</label>}
                <div className="relative group">
                    <textarea
                        ref={ref}
                        className={`
              ${fullWidth ? 'w-full' : ''} 
              px-4 py-3
              bg-white text-neutral-900 border border-neutral-200 
              rounded-xl text-sm font-medium transition-all duration-200
              placeholder:text-neutral-400 placeholder:font-normal
              focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary
              disabled:bg-neutral-50 disabled:text-neutral-400
              resize-y min-h-[100px]
              ${error ? 'border-red-300 focus:ring-red-100 focus:border-red-400' : ''}
              ${className}
            `}
                        {...props}
                    />
                </div>
                {error && <p className="text-xs text-red-500 ml-1">{error}</p>}
            </div>
        );
    }
);
TextArea.displayName = 'TextArea';
