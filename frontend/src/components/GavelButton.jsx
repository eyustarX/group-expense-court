import React, { useState } from 'react';

export default function GavelButton({ children, onClick, disabled, className = '', variant = 'gold' }) {
  const [banging, setBanging] = useState(false);

  const handleClick = (e) => {
    setBanging(true);
    setTimeout(() => setBanging(false), 300);
    if (onClick) onClick(e);
  };

  const baseStyle =
    'inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg font-serif font-bold transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    gold: 'bg-[#c59b27] hover:bg-[#e0b84c] text-[#0d1b2a] border border-[#a27b1a]',
    navy: 'bg-[#1b263b] hover:bg-[#0d1b2a] text-[#f8f5ee] border border-[#c59b27]/40',
    wood: 'bg-[#412211] hover:bg-[#5a3018] text-[#f8f5ee] border border-[#8a4b24]',
  };

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={handleClick}
      className={`${baseStyle} ${variants[variant] || variants.gold} ${className} ${
        banging ? 'rotate-[-6deg] scale-105' : ''
      }`}
    >
      <span className={`text-xl transition-transform ${banging ? 'rotate-[45deg]' : ''}`}>🔨</span>
      <span>{children}</span>
    </button>
  );
}
