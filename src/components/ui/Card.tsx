import React from 'react';

interface CardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ title, children, className = '' }) => {
  return (
    <div className={`bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-lg ${className}`}>
      {title && <h3 className="text-lg font-semibold text-white mb-3">{title}</h3>}
      {children}
    </div>
  );
};
