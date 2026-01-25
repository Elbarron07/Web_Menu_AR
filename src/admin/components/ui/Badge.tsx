import type { HTMLAttributes } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'success' | 'warning' | 'info' | 'neutral' | 'error';
  size?: 'sm' | 'md';
  trend?: 'up' | 'down';
  children: React.ReactNode;
}

export const Badge = ({ variant = 'neutral', size = 'sm', trend, children, className = '', ...props }: BadgeProps) => {
  const baseClasses = 'inline-flex items-center gap-1 font-semibold rounded-full';
  
  const variantClasses = {
    success: 'bg-green-50 text-green-700 border border-green-200',
    warning: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
    info: 'bg-blue-50 text-blue-700 border border-blue-200',
    neutral: 'bg-gray-50 text-gray-700 border border-gray-200',
    error: 'bg-red-50 text-red-700 border border-red-200',
  };
  
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
  };
  
  const getTrendIcon = () => {
    if (!trend) return null;
    const iconClass = 'w-3 h-3';
    return trend === 'up' ? <TrendingUp className={iconClass} /> : <TrendingDown className={iconClass} />;
  };
  
  const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;
  
  return (
    <span className={classes} {...props}>
      {getTrendIcon()}
      {children}
    </span>
  );
};
