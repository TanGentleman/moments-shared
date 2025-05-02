import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'default' | 'destructive' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    children, 
    className = '', 
    variant = 'default', 
    size = 'default',
    ...props 
  }, ref) => {
    const variantClasses = {
      default: 'bg-purple-600 text-white hover:bg-purple-700',
      destructive: 'bg-red-600 text-white hover:bg-red-700',
      outline: 'bg-transparent border border-gray-300 hover:bg-gray-100',
      ghost: 'bg-transparent hover:bg-gray-100'
    };

    const sizeClasses = {
      default: 'h-10 py-2 px-4',
      sm: 'h-8 px-3 text-sm',
      lg: 'h-12 px-6'
    };

    return (
      <button
        ref={ref}
        className={`inline-flex items-center justify-center rounded-md font-medium transition-colors 
          disabled:opacity-50 disabled:pointer-events-none
          ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button'; 