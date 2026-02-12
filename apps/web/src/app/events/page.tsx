'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { publicApi } from '@/lib/api';
import { Event } from '@doce25/shared';

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadEvents();
  }, []);

  async function loadEvents() {
    try {
      setLoading(true);
      const data = await publicApi.getEvents();
      setEvents(data as Event[]);
    } catch (err: any) {
      setError(err.message || 'Error al cargar eventos');
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

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold mb-8">Eventos Disponibles</h1>

          {loading && (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              <p className="mt-4 text-gray-600">Cargando eventos...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {!loading && !error && events.length === 0 && (
            <div className="card text-center py-12">
              <p className="text-xl text-gray-600">No hay eventos disponibles en este momento.</p>
              <p className="text-gray-500 mt-2">Vuelve pronto para ver nuevos eventos.</p>
            </div>
          )}

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <div key={event.event_id} className="card hover:shadow-xl transition-shadow">
                <h2 className="text-2xl font-bold mb-2">{event.title}</h2>
                <p className="text-gray-600 mb-4 line-clamp-3">{event.description}</p>
                
                <div className="space-y-2 mb-4 text-sm">
                  <div className="flex items-start">
                    <span className="mr-2">📅</span>
                    <span>{formatDate(event.startDateTime)}</span>
                  </div>
                  <div className="flex items-start">
                    <span className="mr-2">📍</span>
                    <span>{event.location}</span>
                  </div>
                  <div className="flex items-start">
                    <span className="mr-2">👥</span>
                    <span>Capacidad: {event.capacity} personas</span>
                  </div>
                </div>

                <Link
                  href={`/events/${event.event_id}`}
                  className="btn-primary block text-center"
                >
                  Ver Detalles y Registrarse
                </Link>
              </div>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}

