import React from 'react';

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  onClick?: () => void;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  children,
  className = '',
  disabled,
  type = 'button',
  onClick
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-base transition-all duration-200 focus:outline-none focus:ring-4 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variantClasses = {
    primary: 'bg-brandBlue-500 hover:bg-brandBlue-700 text-white shadow-sm focus:ring-brandBlue-100',
    secondary: 'bg-neutral-100 hover:bg-neutral-300 text-neutral-700 border border-neutral-300 focus:ring-neutral-100',
    ghost: 'text-brandBlue-500 hover:bg-brandBlue-50 focus:ring-brandBlue-100',
    danger: 'bg-danger hover:bg-red-700 text-white shadow-sm focus:ring-red-100'
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-5 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;

  return (
    <button
      className={classes}
      disabled={disabled || loading}
      type={type}
      onClick={onClick}
    >
      {loading && (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2 animate-spin" />
      )}
      {children}
    </button>
  );
};

export default Button;
