import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
    size?: 'sm' | 'md' | 'lg' | 'icon';
    isLoading?: boolean;
    leftIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className = '', variant = 'primary', size = 'md', isLoading, leftIcon, children, disabled, ...props }, ref) => {

        const baseStyles = "inline-flex items-center justify-center font-bold tracking-wide transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-60 disabled:cursor-not-allowed rounded-full";

        const variants = {
            primary: "bg-primary text-white hover:bg-primary-hover shadow-soft hover:shadow-lg hover:-translate-y-0.5 border border-transparent",
            secondary: "bg-white text-neutral-700 border border-neutral-200 hover:bg-neutral-50 hover:text-neutral-900 hover:border-neutral-300 shadow-sm",
            ghost: "bg-transparent text-neutral-500 hover:bg-neutral-100/50 hover:text-neutral-900",
            danger: "bg-red-50 text-red-600 hover:bg-red-100 border border-transparent",
            outline: "bg-transparent border border-neutral-200 text-neutral-600 hover:border-neutral-300 hover:bg-neutral-50"
        };

        const sizes = {
            sm: "text-xs px-3 py-1.5 gap-1.5 h-8",
            md: "text-sm px-4 py-2.5 gap-2 h-10",
            lg: "text-base px-6 py-3 gap-2.5 h-12",
            icon: "p-2 h-10 w-10"
        };

        return (
            <button
                ref={ref}
                className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
                disabled={disabled || isLoading}
                {...props}
            >
                {isLoading && <Loader2 className="animate-spin" size={size === 'sm' ? 14 : 18} />}
                {!isLoading && leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
                {children}
            </button>
        );
    }
);
Button.displayName = 'Button';
