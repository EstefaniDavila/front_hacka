import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-zinc-800 bg-zinc-950 py-6 mt-auto">
      <div className="max-w-7xl mx-auto px-4 text-center text-sm text-zinc-500">
        © {new Date().getFullYear()} MiProyecto Frontend. Creado con Vite, React y Tailwind CSS.
      </div>
    </footer>
  );
};
