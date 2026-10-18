'use client';

import React from 'react';
import { cn } from '../../lib/utils';
import { CgSpinner } from 'react-icons/cg';

export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  color?: string;
}

export function Spinner({ size = 'md', className, color = 'text-indigo-600' }: SpinnerProps) {
  const sizes = {
    sm: 'w-4 h-4 text-base',
    md: 'w-6 h-6 text-xl',
    lg: 'w-8 h-8 text-2xl',
    xl: 'w-12 h-12 text-4xl',
  };

  return <CgSpinner className={cn('animate-spin', sizes[size], color, className)} />;
}

export function PageLoader({ text = 'লোড হচ্ছে...' }: { text?: string }) {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-4 p-8">
      <Spinner size="xl" />
      <p className="text-sm font-medium text-slate-500 animate-pulse">{text}</p>
    </div>
  );
}

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded-xl bg-slate-200/80', className)}
      {...props}
    />
  );
}

export const Loader = Spinner;
export default Spinner;

