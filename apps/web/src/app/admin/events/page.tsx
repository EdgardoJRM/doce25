'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { adminApi } from '@/lib/api';
import { isAdmin } from '@/lib/auth';
import { Event } from '@doce25/shared';

export default function AdminEventsPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<Event[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkAuthorization();
  }, []);

  async function checkAuthorization() {
    try {
      const isAuth = await isAdmin();
      if (!isAuth) {
        router.push('/auth/login');
        return;
      }
      setAuthorized(true);
      loadEvents();
    } catch (error) {
      router.push('/auth/login');
    }
  }

  async function loadEvents() {
    try {
      setLoading(true);
      const data = await adminApi.getEvents();
      setEvents(data as Event[]);
    } catch (err: any) {
      setError(err.message || 'Error al cargar eventos');
    } finally {
      setLoading(false);
    }
  }

  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('es-PR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function getStatusBadge(status: string) {
    const styles = {
      draft: 'bg-gray-200 text-gray-800',
      published: 'bg-green-200 text-green-800',
      closed: 'bg-red-200 text-red-800',
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${styles[status as keyof typeof styles]}`}>
        {status === 'draft' ? 'Borrador' : status === 'published' ? 'Publicado' : 'Cerrado'}
      </span>
    );
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-gray-50">
          <div className="container mx-auto px-4 py-8">
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              <p className="mt-4 text-gray-600">Cargando...</p>
            </div>
          </div>
        </main>
      </>
    );
  }

  if (!authorized) {
    return null;
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">Administrar Eventos</h1>
            <Link href="/admin/events/new" className="btn-primary">
              + Crear Evento
            </Link>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {events.length === 0 ? (
            <div className="card text-center py-12">
              <p className="text-xl text-gray-600 mb-4">No hay eventos creados</p>
              <Link href="/admin/events/new" className="btn-primary inline-block">
                Crear Primer Evento
              </Link>
            </div>
          ) : (
            <div className="card">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">Título</th>
                      <th className="text-left py-3 px-4">Fecha</th>
                      <th className="text-left py-3 px-4">Estado</th>
                      <th className="text-left py-3 px-4">Capacidad</th>
                      <th className="text-left py-3 px-4">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {events.map((event) => (
                      <tr key={event.event_id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 font-semibold">{event.title}</td>
                        <td className="py-3 px-4 text-sm">{formatDate(event.startDateTime)}</td>
                        <td className="py-3 px-4">{getStatusBadge(event.status)}</td>
                        <td className="py-3 px-4 text-sm">{event.capacity}</td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            <Link
                              href={`/admin/events/${event.event_id}`}
                              className="text-primary hover:underline text-sm"
                            >
                              Editar
                            </Link>
                            <Link
                              href={`/admin/events/${event.event_id}/registrations`}
                              className="text-primary hover:underline text-sm"
                            >
                              Registros
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}

