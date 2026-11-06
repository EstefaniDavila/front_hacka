import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { Home } from './pages/Home';
import { AppProvider } from './context/AppContext';

export function App() {
  return (
    <AppProvider>
      <div className="min-h-screen flex flex-col bg-zinc-950 text-zinc-100 antialiased selection:bg-blue-600 selection:text-white">
        <Navbar />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8">
          <Home />
        </main>
        <Footer />
      </div>
    </AppProvider>
  );
}

export default App;
