import Link from 'next/link';
import Navbar from '@/components/Navbar';

export const dynamicParams = true;

export function generateStaticParams() {
  return [];
}

export default function RegistrationSuccessPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto text-center">
            <div className="card">
              <div className="text-6xl mb-6">✅</div>
              <h1 className="text-4xl font-bold mb-4 text-green-600">¡Registro Exitoso!</h1>
              <p className="text-lg text-gray-700 mb-6">
                Tu registro ha sido confirmado. Revisa tu correo electrónico para obtener tu código QR.
              </p>

              <div className="bg-blue-50 border border-blue-200 p-6 rounded mb-8 text-left">
                <h2 className="font-bold text-lg mb-3">Próximos Pasos:</h2>
                <ol className="list-decimal list-inside space-y-2 text-gray-700">
                  <li>Revisa tu bandeja de entrada (y carpeta de spam)</li>
                  <li>Abre el correo de confirmación de Doce25</li>
                  <li>Guarda o imprime tu código QR</li>
                  <li>Presenta el QR al llegar al evento</li>
                </ol>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 p-4 rounded mb-8">
                <p className="text-yellow-800 text-sm">
                  <strong>Importante:</strong> Si no recibes el correo en los próximos 5 minutos,
                  verifica tu carpeta de spam o contacta a info@doce25.org
                </p>
              </div>

              <div className="flex gap-4 justify-center">
                <Link href="/events" className="btn-primary">
                  Ver Más Eventos
                </Link>
                <Link href="/" className="btn-secondary">
                  Volver al Inicio
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

