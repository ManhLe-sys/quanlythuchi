"use client";

import { useEffect, useState } from 'react';

interface ToastProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}

export function Toast({ message, type, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      onClose();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = type === 'success' 
    ? 'bg-gradient-to-r from-[#3E503C] to-[#7F886A]' 
    : 'bg-gradient-to-r from-[#FF6F3D] to-[#ff835c]';

  return isVisible ? (
    <div className={`fixed bottom-4 right-4 ${bgColor}
      px-6 py-3 rounded-lg shadow-lg
      animate-fade-in-up z-50 backdrop-blur-sm
      border border-white/10`}
    >
      <span>{message}</span>
      <button onClick={() => setIsVisible(false)} 
        className="ml-4 text-white/80 hover:text-white transition-colors">
        ×
      </button>
    </div>
  ) : null;
} 