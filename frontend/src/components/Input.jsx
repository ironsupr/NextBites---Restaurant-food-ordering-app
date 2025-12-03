import React from 'react';
import { cn } from '../utils/cn';

const Input = React.forwardRef(({ className, label, error, ...props }, ref) => {
    return (
        <div className="w-full">
            {label && (
                <label className="block text-sm font-medium text-secondary mb-1.5">
                    {label}
                </label>
            )}
            <input
                className={cn(
                    'flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200',
                    error && 'border-accent focus:ring-accent/20 focus:border-accent',
                    className
                )}
                ref={ref}
                {...props}
            />
            {error && (
                <p className="mt-1 text-sm text-accent">{error}</p>
            )}
        </div>
    );
});

Input.displayName = 'Input';

export default Input;
