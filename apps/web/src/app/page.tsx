import Link from 'next/link';
import Navbar from '@/components/Navbar';

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-primary to-primary-700 text-white py-20">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-5xl font-bold mb-4">Bienvenido a Doce25 Events</h1>
            <p className="text-xl mb-8 max-w-2xl mx-auto">
              Únete a nuestras actividades de limpieza de playas y conservación marina.
              Juntos podemos hacer la diferencia.
            </p>
            <Link href="/events" className="btn-primary inline-block bg-white text-primary hover:bg-gray-100">
              Ver Eventos Disponibles
            </Link>
          </div>
        </div>

        {/* Info Section */}
        <div className="container mx-auto px-4 py-16">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="card text-center">
              <div className="text-4xl mb-4">🌊</div>
              <h3 className="text-xl font-bold mb-2">Limpieza de Playas</h3>
              <p className="text-gray-600">
                Participa en nuestras actividades de limpieza y ayuda a mantener nuestras costas limpias.
              </p>
            </div>

            <div className="card text-center">
              <div className="text-4xl mb-4">🐢</div>
              <h3 className="text-xl font-bold mb-2">Conservación Marina</h3>
              <p className="text-gray-600">
                Aprende sobre la vida marina y cómo podemos proteger nuestros océanos.
              </p>
            </div>

            <div className="card text-center">
              <div className="text-4xl mb-4">🤝</div>
              <h3 className="text-xl font-bold mb-2">Comunidad</h3>
              <p className="text-gray-600">
                Conoce a personas comprometidas con el medio ambiente y haz nuevos amigos.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gray-100 py-16">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">¿Listo para hacer la diferencia?</h2>
            <p className="text-lg text-gray-700 mb-8 max-w-2xl mx-auto">
              Registrarte es fácil y rápido. Solo necesitas completar un formulario simple
              y recibirás tu código QR por correo electrónico.
            </p>
            <Link href="/events" className="btn-primary inline-block">
              Explorar Eventos
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="mb-2">Doce25 (Tortuga Club PR, Inc.)</p>
          <p className="text-gray-400 text-sm">
            <a href="https://doce25.org" target="_blank" rel="noopener noreferrer" className="hover:text-white">
              doce25.org
            </a>
            {' | '}
            <a href="mailto:info@doce25.org" className="hover:text-white">
              info@doce25.org
            </a>
          </p>
        </div>
      </footer>
    </>
  );
}

