import React from 'react';

interface BrandLogoProps {
  className?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ className = 'h-10 w-10' }) => {
  return (
    <img
      src="/logo.svg"
      alt="BuildHomeWork Logo"
      className={`shrink-0 select-none ${className}`}
    />
  );
};

