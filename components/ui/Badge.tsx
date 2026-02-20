import React from 'react';

interface BadgeProps {
    variant?: 'success' | 'warning' | 'error' | 'neutral' | 'primary';
    dot?: boolean;
    className?: string;
    children?: React.ReactNode;
}

export const Badge = ({ className = '', variant = 'neutral', dot = false, children, ...props }: BadgeProps) => {
    const variants = {
        success: "bg-primary-50 text-primary-700 border-primary-100",
        warning: "bg-orange-50 text-orange-700 border-orange-100",
        error: "bg-red-50 text-red-700 border-red-100",
        neutral: "bg-neutral-100 text-neutral-600 border-neutral-200",
        primary: "bg-primary-50 text-primary-700 border-primary-100"
    };

    return (
        <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${variants[variant]} ${className}`}
            {...props}
        >
            {dot && <span className={`w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-60`} />}
            {children}
        </span>
    );
};
