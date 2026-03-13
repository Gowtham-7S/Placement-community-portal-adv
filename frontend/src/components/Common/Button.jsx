import React from 'react';

const Button = ({
  label,
  onClick,
  variant = 'primary',
  size = 'default',
  disabled = false,
  loading = false,
  fullWidth = false,
  type = 'button',
  children,
}) => {
  const baseClasses = 'inline-flex items-center justify-center border border-transparent rounded-lg font-medium cursor-pointer transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

  const sizeClasses = {
    small: 'h-8 px-3 py-1 text-sm',
    default: 'h-10 px-4 py-2 text-sm',
    large: 'h-12 px-6 py-3 text-base',
  };

  const variantClasses = {
    primary: 'bg-primary text-white hover:bg-purple-700 focus:ring-primary',
    secondary: 'bg-slate-600 text-white hover:bg-slate-700 focus:ring-slate-600',
    outline: 'border-primary text-primary bg-transparent hover:bg-primary hover:text-white focus:ring-primary',
    success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-600',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-600',
  };

  const widthClass = fullWidth ? 'w-full' : '';

  const className = `${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${widthClass}`;

  return (
    <button
      className={className}
      onClick={onClick}
      disabled={disabled || loading}
      type={type}
    >
      {loading && (
        <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
      )}
      {children || label}
    </button>
  );
};

export default Button;
