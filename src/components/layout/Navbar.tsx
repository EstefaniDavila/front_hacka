import React from 'react';

export const Navbar: React.FC = () => {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-800 bg-zinc-950/80 backdrop-blur">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2 font-bold text-lg text-white">
          <span className="text-blue-500">⚡</span> MiProyecto
        </div>
        <nav className="flex items-center gap-6 text-sm text-zinc-400">
          <a href="#" className="hover:text-white transition">Inicio</a>
          <a href="#" className="hover:text-white transition">Explorar</a>
          <a href="#" className="hover:text-white transition">Acerca</a>
        </nav>
      </div>
    </header>
  );
};
