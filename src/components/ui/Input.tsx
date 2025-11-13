import * as React from 'react';
import { clsx } from 'clsx';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={clsx('w-full rounded-lg bg-surface/60 border border-surface focus:border-brand focus:ring-2 focus:ring-brand px-3 py-2 text-sm outline-none', className)}
    {...props}
  />
));
Input.displayName = 'Input';
