'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { adminApi, publicApi } from '@/lib/api';
import { isAdmin } from '@/lib/auth';
import { Event, Registration } from '@doce25/shared';

export default function EventRegistrationsClient() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.eventId as string;

  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState<Event | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [filteredRegistrations, setFilteredRegistrations] = useState<Registration[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchEmail, setSearchEmail] = useState('');
  const [exporting, setExporting] = useState(false);
  const [resendingQR, setResendingQR] = useState<string | null>(null);

  useEffect(() => {
    checkAuthorization();
  }, []);

  useEffect(() => {
    filterRegistrations();
  }, [searchEmail, registrations]);

  async function checkAuthorization() {
    try {
      const isAuth = await isAdmin();
      if (!isAuth) {
        router.push('/auth/login');
        return;
      }
      setAuthorized(true);
      loadData();
    } catch (error) {
      router.push('/auth/login');
    }
  }

  async function loadData() {
    try {
      setLoading(true);
      const [eventData, registrationsData] = await Promise.all([
        publicApi.getEvent(eventId),
        adminApi.getRegistrations(eventId),
      ]);

      setEvent(eventData as Event);
      const regs = (registrationsData as any).registrations || [];
      setRegistrations(regs);
      setFilteredRegistrations(regs);
    } catch (err: any) {
      setError(err.message || 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  }

  function filterRegistrations() {
    if (!searchEmail.trim()) {
      setFilteredRegistrations(registrations);
      return;
    }

    const filtered = registrations.filter((reg) =>
      reg.email.toLowerCase().includes(searchEmail.toLowerCase())
    );
    setFilteredRegistrations(filtered);
  }

  async function handleExport() {
    try {
      setExporting(true);
      const result = await adminApi.exportRegistrations(eventId);
      const exportData = result as any;
      window.open(exportData.url, '_blank');
    } catch (err: any) {
      alert('Error al exportar: ' + err.message);
    } finally {
      setExporting(false);
    }
  }

  async function handleResendQR(email: string) {
    if (!confirm(`¿Reenviar código QR a ${email}?`)) {
      return;
    }

    try {
      setResendingQR(email);
      await adminApi.resendQR(eventId, email);
      alert('Código QR reenviado exitosamente');
    } catch (err: any) {
      alert('Error al reenviar QR: ' + err.message);
    } finally {
      setResendingQR(null);
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

  const scannedCount = registrations.filter((r) => r.scanned).length;
  const percentageScanned = registrations.length > 0 
    ? Math.round((scannedCount / registrations.length) * 100)
    : 0;

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <Link href="/admin/events" className="text-primary hover:underline mb-4 inline-block">
            ← Volver a Eventos
          </Link>

          <h1 className="text-3xl font-bold mb-2">{event.title}</h1>
          <p className="text-gray-600 mb-6">Registros y Asistencia</p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          {/* Stats */}
          <div className="grid md:grid-cols-4 gap-4 mb-8">
            <div className="card">
              <p className="text-sm text-gray-600">Total Registrados</p>
              <p className="text-3xl font-bold">{registrations.length}</p>
            </div>
            <div className="card">
              <p className="text-sm text-gray-600">Capacidad</p>
              <p className="text-3xl font-bold">{event.capacity}</p>
            </div>
            <div className="card">
              <p className="text-sm text-gray-600">Asistieron</p>
              <p className="text-3xl font-bold text-green-600">{scannedCount}</p>
            </div>
            <div className="card">
              <p className="text-sm text-gray-600">% Asistencia</p>
              <p className="text-3xl font-bold text-primary">{percentageScanned}%</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-4 mb-6">
            <input
              type="text"
              className="input flex-1 min-w-[200px]"
              placeholder="Buscar por email..."
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
            />
            <button onClick={handleExport} className="btn-primary" disabled={exporting}>
              {exporting ? 'Exportando...' : '📥 Exportar CSV'}
            </button>
          </div>

          {/* Registrations Table */}
          <div className="card">
            {filteredRegistrations.length === 0 ? (
              <p className="text-center py-8 text-gray-600">
                {searchEmail ? 'No se encontraron registros con ese email' : 'No hay registros aún'}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-2">Nombre</th>
                      <th className="text-left py-3 px-2">Email</th>
                      <th className="text-left py-3 px-2">Edad</th>
                      <th className="text-left py-3 px-2">Ciudad</th>
                      <th className="text-left py-3 px-2">Asistencia</th>
                      <th className="text-left py-3 px-2">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRegistrations.map((reg) => (
                      <tr key={reg.registration_id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-2 font-semibold">{reg.fullName}</td>
                        <td className="py-3 px-2">{reg.email}</td>
                        <td className="py-3 px-2">{reg.ageRange}</td>
                        <td className="py-3 px-2">{reg.city}</td>
                        <td className="py-3 px-2">
                          {reg.scanned ? (
                            <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                              ✓ Escaneado
                            </span>
                          ) : (
                            <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">
                              Pendiente
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-2">
                          <button
                            onClick={() => handleResendQR(reg.email)}
                            className="text-primary hover:underline text-xs"
                            disabled={resendingQR === reg.email}
                          >
                            {resendingQR === reg.email ? 'Enviando...' : 'Reenviar QR'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}

