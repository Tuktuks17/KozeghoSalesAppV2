import React from 'react';

interface CardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
    children: React.ReactNode;
    title?: React.ReactNode;
    action?: React.ReactNode;
    noPadding?: boolean;
    bodyClassName?: string;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
    ({ className = '', children, title, action, noPadding = false, bodyClassName = '', ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={`bg-white rounded-3xl shadow-card border border-neutral-100/80 overflow-hidden ${noPadding ? '' : 'p-6'} ${className}`}
                {...props}
            >
                {(title || action) && (
                    <div className={`flex items-center justify-between gap-4 ${noPadding ? 'p-6 pb-4' : 'mb-4'}`}>
                        <h3 className="text-base font-bold text-neutral-900">{title}</h3>
                        {action}
                    </div>
                )}
                <div className={bodyClassName}>
                    {children}
                </div>
            </div>
        );
    }
);
Card.displayName = 'Card';
