import * as React from 'react';
import { clsx } from 'clsx';

export const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...rest }) => (
  <div className={clsx('rounded-xl bg-surface p-5 shadow-soft border border-surface/70', className)} {...rest} />
);

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({ className, ...rest }) => (
  <h2 className={clsx('text-lg font-semibold mb-2', className)} {...rest} />
);

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({ className, ...rest }) => (
  <p className={clsx('text-sm text-gray-300', className)} {...rest} />
);
