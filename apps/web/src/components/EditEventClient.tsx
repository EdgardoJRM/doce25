'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { adminApi, publicApi } from '@/lib/api';
import { isAdmin } from '@/lib/auth';
import { Event, EventStatus } from '@doce25/shared';

export default function EditEventClient() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.eventId as string;

  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [event, setEvent] = useState<Event | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    startDateTime: '',
    endDateTime: '',
    capacity: 50,
    status: 'draft' as EventStatus,
    waiverRequired: true,
  });

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
      loadEvent();
    } catch (error) {
      router.push('/auth/login');
    }
  }

  async function loadEvent() {
    try {
      setLoading(true);
      const data = await publicApi.getEvent(eventId);
      const evt = data as Event;
      setEvent(evt);

      // Convert ISO to datetime-local format
      const startLocal = new Date(evt.startDateTime).toISOString().slice(0, 16);
      const endLocal = new Date(evt.endDateTime).toISOString().slice(0, 16);

      setFormData({
        title: evt.title,
        description: evt.description,
        location: evt.location,
        startDateTime: startLocal,
        endDateTime: endLocal,
        capacity: evt.capacity,
        status: evt.status,
        waiverRequired: evt.waiverRequired,
      });
    } catch (err: any) {
      setError(err.message || 'Error al cargar el evento');
    } finally {
      setLoading(false);
    }
  }

  function updateFormData(field: string, value: any) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const data = {
        ...formData,
        startDateTime: new Date(formData.startDateTime).toISOString(),
        endDateTime: new Date(formData.endDateTime).toISOString(),
      };

      await adminApi.updateEvent(eventId, data);
      router.push('/admin/events');
    } catch (err: any) {
      setError(err.message || 'Error al actualizar el evento');
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-gray-50">
          <div className="container mx-auto px-4 py-8">
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          </div>
        </main>
      </>
    );
  }

  if (!authorized || !event) {
    return null;
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">Editar Evento</h1>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded mb-6">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="card">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Título del Evento <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="input"
                    value={formData.title}
                    onChange={(e) => updateFormData('title', e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Descripción <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    className="input"
                    rows={5}
                    value={formData.description}
                    onChange={(e) => updateFormData('description', e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Ubicación <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="input"
                    value={formData.location}
                    onChange={(e) => updateFormData('location', e.target.value)}
                    required
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2">
                      Fecha y Hora de Inicio <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      className="input"
                      value={formData.startDateTime}
                      onChange={(e) => updateFormData('startDateTime', e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2">
                      Fecha y Hora de Fin <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      className="input"
                      value={formData.endDateTime}
                      onChange={(e) => updateFormData('endDateTime', e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Capacidad <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    className="input"
                    value={formData.capacity}
                    onChange={(e) => updateFormData('capacity', parseInt(e.target.value))}
                    required
                    min="1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Estado <span className="text-red-500">*</span>
                  </label>
                  <select
                    className="select"
                    value={formData.status}
                    onChange={(e) => updateFormData('status', e.target.value as EventStatus)}
                  >
                    <option value="draft">Borrador</option>
                    <option value="published">Publicado</option>
                    <option value="closed">Cerrado</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Solo eventos "Publicados" son visibles al público
                  </p>
                </div>

                <div>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="checkbox mr-2"
                      checked={formData.waiverRequired}
                      onChange={(e) => updateFormData('waiverRequired', e.target.checked)}
                    />
                    <span className="text-sm font-semibold">
                      Requiere Relevo de Responsabilidad
                    </span>
                  </label>
                </div>
              </div>

              <div className="flex gap-4 mt-8">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="btn-secondary flex-1"
                  disabled={submitting}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-primary flex-1" disabled={submitting}>
                  {submitting ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </>
  );
}

