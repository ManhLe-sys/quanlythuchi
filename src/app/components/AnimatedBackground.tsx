'use client';

import { useEffect, useState } from 'react';

export function AnimatedBackground() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return null;
  }

  return (
    <div className="animated-background">
      <div className="nebula" />
      <div className="dots-grid" />
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />
      <div className="glow-line" />
      <div className="glow-line" />
      <div className="glow-line" />
      <div className="glow-line" />
      <div className="particle-container">
        <div className="particle" />
        <div className="particle" />
        <div className="particle" />
        <div className="particle" />
        <div className="particle" />
      </div>
    </div>
  );
} 