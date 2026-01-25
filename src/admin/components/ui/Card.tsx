import { forwardRef } from 'react';
import type { HTMLAttributes } from 'react';
import { motion } from 'framer-motion';

interface CardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onAnimationStart' | 'onDrag' | 'onDragEnd' | 'onDragStart'> {
  variant?: 'default' | 'elevated' | 'glass';
  padding?: 'sm' | 'md' | 'lg';
  hover?: boolean;
  children: React.ReactNode;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ variant = 'default', padding = 'md', hover = false, children, className = '', ...props }, ref) => {
    const baseClasses = 'bg-white rounded-2xl transition-all';
    
    const variantClasses = {
      default: 'shadow-sm border border-gray-100',
      elevated: 'shadow-md border border-gray-100',
      glass: 'bg-white/70 backdrop-blur-xl border border-white/30 shadow-lg',
    };
    
    const paddingClasses = {
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8',
    };
    
    const classes = `${baseClasses} ${variantClasses[variant]} ${paddingClasses[padding]} ${className}`;
    
    const Component = hover ? motion.div : 'div';
    const motionProps = hover ? {
      whileHover: { y: -4, shadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' },
      transition: { duration: 0.2 }
    } : {};
    
    return (
      <Component
        ref={ref}
        className={classes}
        {...motionProps}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

Card.displayName = 'Card';
