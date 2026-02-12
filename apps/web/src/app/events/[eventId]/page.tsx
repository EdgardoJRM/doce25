'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { publicApi } from '@/lib/api';
import { Event } from '@doce25/shared';

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.eventId as string;

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadEvent();
  }, [eventId]);

  async function loadEvent() {
    try {
      setLoading(true);
      const data = await publicApi.getEvent(eventId);
      setEvent(data as Event);
    } catch (err: any) {
      setError(err.message || 'Error al cargar el evento');
    } finally {
      setLoading(false);
    }
  }

  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('es-PR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-gray-50">
          <div className="container mx-auto px-4 py-8">
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              <p className="mt-4 text-gray-600">Cargando evento...</p>
            </div>
          </div>
        </main>
      </>
    );
  }

  if (error || !event) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-gray-50">
          <div className="container mx-auto px-4 py-8">
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded mb-4">
              {error || 'Evento no encontrado'}
            </div>
            <Link href="/events" className="btn-secondary inline-block">
              ← Volver a Eventos
            </Link>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <Link href="/events" className="text-primary hover:underline mb-4 inline-block">
            ← Volver a Eventos
          </Link>

          <div className="card max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold mb-4">{event.title}</h1>

            <div className="space-y-4 mb-8">
              <div className="flex items-start">
                <span className="text-2xl mr-3">📅</span>
                <div>
                  <p className="font-semibold">Fecha y Hora</p>
                  <p className="text-gray-700">{formatDate(event.startDateTime)}</p>
                  <p className="text-sm text-gray-500">
                    Hasta: {formatDate(event.endDateTime)}
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <span className="text-2xl mr-3">📍</span>
                <div>
                  <p className="font-semibold">Ubicación</p>
                  <p className="text-gray-700">{event.location}</p>
                </div>
              </div>

              <div className="flex items-start">
                <span className="text-2xl mr-3">👥</span>
                <div>
                  <p className="font-semibold">Capacidad</p>
                  <p className="text-gray-700">{event.capacity} personas</p>
                </div>
              </div>
            </div>

            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-3">Descripción</h2>
              <p className="text-gray-700 whitespace-pre-line">{event.description}</p>
            </div>

            {event.waiverRequired && (
              <div className="bg-yellow-50 border border-yellow-200 p-4 rounded mb-8">
                <p className="text-yellow-800">
                  ⚠️ Este evento requiere que aceptes un relevo de responsabilidad durante el registro.
                </p>
              </div>
            )}

            <div className="bg-primary-50 border border-primary-200 p-6 rounded mb-8">
              <h3 className="font-bold text-lg mb-2">¿Qué debo traer?</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                <li>Ropa cómoda y zapatos cerrados</li>
                <li>Protector solar</li>
                <li>Agua para mantenerte hidratado</li>
                <li>Gorra o sombrero</li>
                <li>Actitud positiva y ganas de ayudar</li>
              </ul>
            </div>

            <div className="flex gap-4">
              <Link
                href={`/events/${event.event_id}/register`}
                className="btn-primary flex-1 text-center"
              >
                Registrarse Ahora
              </Link>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

