import React from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

export const Home: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="text-center py-12">
        <h1 className="text-4xl font-extrabold text-white tracking-tight sm:text-5xl">
          Estructura Frontend Lista
        </h1>
        <p className="mt-4 text-lg text-zinc-400 max-w-2xl mx-auto">
          Stack base configurado con React, TypeScript, Vite y Tailwind CSS. Listo para llenar con tus vistas y lógica.
        </p>
        <div className="mt-6 flex justify-center gap-4">
          <Button variant="primary">Comenzar a Programar</Button>
          <Button variant="outline">Documentación</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card title="📦 Componentes UI">
          <p className="text-sm text-zinc-400">
            Guarda en <code>src/components/ui/</code> botones, modales, cards e inputs reutilizables.
          </p>
        </Card>
        <Card title="🌐 Servicios & API">
          <p className="text-sm text-zinc-400">
            Conecta tu backend en <code>src/services/api.ts</code> separando la lógica de la UI.
          </p>
        </Card>
        <Card title="⚡ Estado & Hooks">
          <p className="text-sm text-zinc-400">
            Añade custom hooks en <code>src/hooks/</code> y estado global en <code>src/context/</code>.
          </p>
        </Card>
      </div>
    </div>
  );
};
