import * as React from 'react';
import { clsx } from 'clsx';

export interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const TextArea = React.forwardRef<HTMLTextAreaElement, TextAreaProps>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={clsx('w-full rounded-lg bg-surface/60 border border-surface focus:border-brand focus:ring-2 focus:ring-brand px-3 py-2 text-sm outline-none resize-y min-h-[120px]', className)}
    {...props}
  />
));
TextArea.displayName = 'TextArea';
