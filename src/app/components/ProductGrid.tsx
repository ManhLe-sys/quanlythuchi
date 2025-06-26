'use client';

import { ReactNode, useEffect, useState } from 'react';

interface ProductGridProps {
  children: ReactNode;
}

export function ProductGrid({ children }: ProductGridProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div 
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
      suppressHydrationWarning
    >
      {children}
    </div>
  );
}

export function ProductCard({ children }: ProductGridProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div 
      className="relative overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl shadow-lg"
      suppressHydrationWarning
    >
      <div 
        className="absolute inset-0 bg-white/10 backdrop-blur-xl"
        suppressHydrationWarning
      >
        {children}
      </div>
    </div>
  );
} 