import * as React from 'react';
import { clsx } from 'clsx';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost';
}

export const Button: React.FC<ButtonProps> = ({ variant = 'primary', className, ...rest }) => {
  return (
    <button
      className={clsx(
        'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none',
        variant === 'primary' && 'bg-brand text-white hover:bg-blue-500',
        variant === 'ghost' && 'bg-transparent hover:bg-surface',
        className
      )}
      {...rest}
    />
  );
};
