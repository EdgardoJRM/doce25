'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { BrowserQRCodeReader } from '@zxing/browser';
import Navbar from '@/components/Navbar';
import { staffApi } from '@/lib/api';
import { isStaffOrAdmin } from '@/lib/auth';
import { ScanResponse } from '@doce25/shared';

export default function ScannerPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ScanResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserQRCodeReader | null>(null);

  useEffect(() => {
    checkAuthorization();
    return () => {
      stopScanning();
    };
  }, []);

  async function checkAuthorization() {
    try {
      const isAuth = await isStaffOrAdmin();
      if (!isAuth) {
        router.push('/auth/login');
        return;
      }
      setAuthorized(true);
    } catch (error) {
      router.push('/auth/login');
    } finally {
      setLoading(false);
    }
  }

  async function startScanning() {
    setError(null);
    setResult(null);
    setScanning(true);

    try {
      if (!readerRef.current) {
        readerRef.current = new BrowserQRCodeReader();
      }

      const reader = readerRef.current;

      await reader.decodeFromVideoDevice(
        undefined,
        videoRef.current!,
        async (result, error) => {
          if (result) {
            await handleQRCode(result.getText());
          }
        }
      );
    } catch (err: any) {
      setError('Error al acceder a la cámara: ' + err.message);
      setScanning(false);
    }
  }

  function stopScanning() {
    // Stop video stream if active
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setScanning(false);
  }

  async function handleQRCode(qrText: string) {
    stopScanning();

    try {
      const qrData = JSON.parse(qrText);
      const { event_id, email, token } = qrData;

      if (!event_id || !email || !token) {
        setError('Código QR inválido: formato incorrecto');
        return;
      }

      const response = await staffApi.scanAttendance({ event_id, email, token });
      setResult(response as ScanResponse);
    } catch (err: any) {
      if (err.message.includes('ya fue escaneado')) {
        setError('⚠️ Este código QR ya fue escaneado anteriormente');
      } else if (err.message.includes('no encontrado')) {
        setError('❌ Registro no encontrado');
      } else if (err.message.includes('inválido')) {
        setError('❌ Código QR inválido');
      } else {
        setError('Error: ' + err.message);
      }
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
              <p className="mt-4 text-gray-600">Verificando autorización...</p>
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
          <div className="max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">Scanner de Asistencia</h1>

            {!scanning && !result && !error && (
              <div className="card text-center">
                <div className="text-6xl mb-4">📷</div>
                <h2 className="text-2xl font-bold mb-4">Escanear Código QR</h2>
                <p className="text-gray-600 mb-6">
                  Presiona el botón para activar la cámara y escanear el código QR del participante.
                </p>
                <button onClick={startScanning} className="btn-primary">
                  Activar Cámara
                </button>
              </div>
            )}

            {scanning && (
              <div className="card">
                <h2 className="text-xl font-bold mb-4">Escanea el Código QR</h2>
                <div className="relative bg-black rounded overflow-hidden mb-4">
                  <video
                    ref={videoRef}
                    className="w-full"
                    style={{ maxHeight: '400px' }}
                  />
                  <div className="absolute inset-0 border-4 border-primary opacity-50 pointer-events-none">
                    <div className="absolute inset-8 border-2 border-white"></div>
                  </div>
                </div>
                <p className="text-center text-sm text-gray-600 mb-4">
                  Centra el código QR dentro del marco
                </p>
                <button onClick={stopScanning} className="btn-secondary w-full">
                  Cancelar
                </button>
              </div>
            )}

            {result && (
              <div className="card">
                <div className="text-center mb-6">
                  <div className="text-6xl mb-4">✅</div>
                  <h2 className="text-2xl font-bold text-green-600 mb-2">
                    Asistencia Registrada
                  </h2>
                  <p className="text-gray-600">
                    {new Date(result.timestamp).toLocaleString('es-PR')}
                  </p>
                </div>

                {result.registration && (
                  <div className="bg-green-50 border border-green-200 p-4 rounded mb-6">
                    <p className="text-sm text-gray-600">Participante</p>
                    <p className="font-bold text-lg">{result.registration.fullName}</p>
                    <p className="text-sm text-gray-600 mt-2">{result.registration.email}</p>
                  </div>
                )}

                <button
                  onClick={() => {
                    setResult(null);
                    setError(null);
                  }}
                  className="btn-primary w-full"
                >
                  Escanear Siguiente
                </button>
              </div>
            )}

            {error && (
              <div className="card">
                <div className="text-center mb-6">
                  <div className="text-6xl mb-4">❌</div>
                  <h2 className="text-2xl font-bold text-red-600 mb-2">Error</h2>
                </div>

                <div className="bg-red-50 border border-red-200 p-4 rounded mb-6">
                  <p className="text-red-800">{error}</p>
                </div>

                <button
                  onClick={() => {
                    setError(null);
                    setResult(null);
                  }}
                  className="btn-primary w-full"
                >
                  Intentar Nuevamente
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}

