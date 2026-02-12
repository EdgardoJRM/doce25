'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { publicApi } from '@/lib/api';
import {
  Event,
  RegistrationInput,
  AgeRange,
  Gender,
  City,
  Organization,
  AGE_RANGES,
  GENDERS,
  CITIES,
  ORGANIZATIONS,
  WAIVER_SECTIONS,
  WaiverAcceptances,
} from '@doce25/shared';

type Step = 1 | 2 | 3 | 4;

export default function RegisterClient() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.eventId as string;

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState<Step>(1);

  // Form data
  const [formData, setFormData] = useState<Partial<RegistrationInput>>({
    email: '',
    fullName: '',
    phone: '',
    ageRange: undefined,
    gender: undefined,
    city: undefined,
    organization: undefined,
    organizationOther: '',
    waiver: {
      acceptances: {
        s8: false,
        s9: false,
        s10: false,
        s11: false,
        s12: false,
        s13: false,
        s14: false,
        s15: false,
        s16: false,
        s17: false,
        s18: false,
      },
      signatureName: '',
      signedDate: '',
      minorFields: undefined,
    },
  });

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

  function updateFormData(field: string, value: any) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  function updateWaiverData(field: string, value: any) {
    setFormData((prev) => ({
      ...prev,
      waiver: { ...prev.waiver!, [field]: value },
    }));
  }

  function updateAcceptance(section: keyof WaiverAcceptances, value: boolean) {
    setFormData((prev) => ({
      ...prev,
      waiver: {
        ...prev.waiver!,
        acceptances: {
          ...prev.waiver!.acceptances,
          [section]: value,
        },
      },
    }));
  }

  function acceptAllWaiverSections() {
    const allAccepted: WaiverAcceptances = {
      s8: true,
      s9: true,
      s10: true,
      s11: true,
      s12: true,
      s13: true,
      s14: true,
      s15: true,
      s16: true,
      s17: true,
      s18: true,
    };
    updateWaiverData('acceptances', allAccepted);
  }

  function validateStep1(): boolean {
    if (!formData.email || !formData.email.includes('@')) {
      setError('Email inválido');
      return false;
    }
    if (!formData.fullName || !formData.fullName.includes(',')) {
      setError('Nombre completo debe estar en formato "Apellidos, Nombre"');
      return false;
    }
    if (!formData.ageRange) {
      setError('Selecciona tu rango de edad');
      return false;
    }
    if (!formData.gender) {
      setError('Selecciona tu género');
      return false;
    }
    if (!formData.city) {
      setError('Selecciona tu ciudad');
      return false;
    }
    if (!formData.organization) {
      setError('Selecciona tu organización');
      return false;
    }
    if (formData.organization === 'Otra' && !formData.organizationOther) {
      setError('Especifica el nombre de la organización');
      return false;
    }
    return true;
  }

  function validateStep2(): boolean {
    const acceptances = formData.waiver?.acceptances;
    if (!acceptances) return false;

    const allAccepted = Object.values(acceptances).every((v) => v === true);
    if (!allAccepted) {
      setError('Debes aceptar todas las secciones del relevo');
      return false;
    }
    return true;
  }

  function validateStep3(): boolean {
    if (!formData.waiver?.signatureName || formData.waiver.signatureName.trim().length < 2) {
      setError('Nombre de firma requerido');
      return false;
    }
    if (!formData.waiver?.signedDate) {
      setError('Fecha de firma requerida');
      return false;
    }

    // Check minor fields
    if (formData.ageRange === 'Menor de 17 años') {
      const minorFields = formData.waiver.minorFields;
      if (!minorFields?.minorName || minorFields.minorName.trim().length < 2) {
        setError('Nombre del menor requerido');
        return false;
      }
      if (!minorFields?.guardianRelationship || minorFields.guardianRelationship.trim().length < 2) {
        setError('Relación con el tutor requerida');
        return false;
      }
      if (!minorFields?.guardianPhone || minorFields.guardianPhone.trim().length < 10) {
        setError('Teléfono del tutor requerido');
        return false;
      }
    }

    return true;
  }

  function nextStep() {
    setError(null);

    if (currentStep === 1) {
      if (!validateStep1()) return;
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (!validateStep2()) return;
      setCurrentStep(3);
    } else if (currentStep === 3) {
      if (!validateStep3()) return;
      setCurrentStep(4);
    }
  }

  function prevStep() {
    setError(null);
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as Step);
    }
  }

  async function handleSubmit() {
    setError(null);
    setSubmitting(true);

    try {
      await publicApi.registerForEvent(eventId, formData);
      router.push(`/events/${eventId}/success`);
    } catch (err: any) {
      setError(err.message || 'Error al procesar el registro');
      setSubmitting(false);
    }
  }

  const isMinor = formData.ageRange === 'Menor de 17 años';

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

  if (!event) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-gray-50">
          <div className="container mx-auto px-4 py-8">
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
              Evento no encontrado
            </div>
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
          <div className="max-w-3xl mx-auto">
            <h1 className="text-3xl font-bold mb-2">Registro para {event.title}</h1>
            <p className="text-gray-600 mb-6">Completa los siguientes pasos para registrarte</p>

            {/* Progress Bar */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                {[1, 2, 3, 4].map((step) => (
                  <div key={step} className="flex-1">
                    <div
                      className={`h-2 rounded ${
                        step <= currentStep ? 'bg-primary' : 'bg-gray-300'
                      }`}
                    />
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-sm">
                <span className={currentStep >= 1 ? 'text-primary font-semibold' : 'text-gray-500'}>
                  Información
                </span>
                <span className={currentStep >= 2 ? 'text-primary font-semibold' : 'text-gray-500'}>
                  Relevo
                </span>
                <span className={currentStep >= 3 ? 'text-primary font-semibold' : 'text-gray-500'}>
                  Firma
                </span>
                <span className={currentStep >= 4 ? 'text-primary font-semibold' : 'text-gray-500'}>
                  Confirmar
                </span>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded mb-6">
                {error}
              </div>
            )}

            <div className="card">
              {/* Step 1: Participant Info */}
              {currentStep === 1 && (
                <div>
                  <h2 className="text-2xl font-bold mb-6">Información del Participante</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold mb-2">
                        Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        className="input"
                        value={formData.email}
                        onChange={(e) => updateFormData('email', e.target.value)}
                        placeholder="tu@email.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold mb-2">
                        Nombre Completo <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        className="input"
                        value={formData.fullName}
                        onChange={(e) => updateFormData('fullName', e.target.value)}
                        placeholder="Apellidos, Nombre"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Formato: Apellidos, Nombre (ejemplo: González Rivera, Juan)
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold mb-2">Teléfono (opcional)</label>
                      <input
                        type="tel"
                        className="input"
                        value={formData.phone}
                        onChange={(e) => updateFormData('phone', e.target.value)}
                        placeholder="787-123-4567"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold mb-2">
                        Rango de Edad <span className="text-red-500">*</span>
                      </label>
                      <select
                        className="select"
                        value={formData.ageRange || ''}
                        onChange={(e) => updateFormData('ageRange', e.target.value as AgeRange)}
                      >
                        <option value="">Selecciona...</option>
                        {AGE_RANGES.map((range) => (
                          <option key={range} value={range}>
                            {range}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold mb-2">
                        Género <span className="text-red-500">*</span>
                      </label>
                      <select
                        className="select"
                        value={formData.gender || ''}
                        onChange={(e) => updateFormData('gender', e.target.value as Gender)}
                      >
                        <option value="">Selecciona...</option>
                        {GENDERS.map((gender) => (
                          <option key={gender} value={gender}>
                            {gender}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold mb-2">
                        Ciudad <span className="text-red-500">*</span>
                      </label>
                      <select
                        className="select"
                        value={formData.city || ''}
                        onChange={(e) => updateFormData('city', e.target.value as City)}
                      >
                        <option value="">Selecciona...</option>
                        {CITIES.map((city) => (
                          <option key={city} value={city}>
                            {city}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold mb-2">
                        Organización <span className="text-red-500">*</span>
                      </label>
                      <select
                        className="select"
                        value={formData.organization || ''}
                        onChange={(e) =>
                          updateFormData('organization', e.target.value as Organization)
                        }
                      >
                        <option value="">Selecciona...</option>
                        {ORGANIZATIONS.map((org) => (
                          <option key={org} value={org}>
                            {org}
                          </option>
                        ))}
                      </select>
                    </div>

                    {formData.organization === 'Otra' && (
                      <div>
                        <label className="block text-sm font-semibold mb-2">
                          Especifica la Organización <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          className="input"
                          value={formData.organizationOther}
                          onChange={(e) => updateFormData('organizationOther', e.target.value)}
                          placeholder="Nombre de la organización"
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end mt-8">
                    <button onClick={nextStep} className="btn-primary">
                      Siguiente →
                    </button>
                  </div>
                </div>
              )}

              {/* Step 2: Waiver Sections */}
              {currentStep === 2 && (
                <div>
                  <h2 className="text-2xl font-bold mb-4">Relevo de Responsabilidad</h2>
                  <p className="text-gray-600 mb-6">
                    Por favor, lee y acepta cada sección del relevo de responsabilidad.
                  </p>

                  <button
                    onClick={acceptAllWaiverSections}
                    className="btn-secondary mb-6 w-full"
                  >
                    ✓ Aceptar Todas las Secciones
                  </button>

                  <div className="space-y-6 max-h-96 overflow-y-auto pr-2">
                    {Object.entries(WAIVER_SECTIONS).map(([key, section]) => (
                      <div key={key} className="border border-gray-200 rounded p-4">
                        <h3 className="font-bold text-lg mb-2">{section.title}</h3>
                        <p className="text-sm text-gray-700 mb-3">{section.content}</p>
                        <label className="flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            className="checkbox mr-2"
                            checked={
                              formData.waiver?.acceptances[key as keyof WaiverAcceptances] || false
                            }
                            onChange={(e) =>
                              updateAcceptance(key as keyof WaiverAcceptances, e.target.checked)
                            }
                          />
                          <span className="text-sm font-semibold">Acepto esta sección</span>
                        </label>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between mt-8">
                    <button onClick={prevStep} className="btn-secondary">
                      ← Anterior
                    </button>
                    <button onClick={nextStep} className="btn-primary">
                      Siguiente →
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Signature */}
              {currentStep === 3 && (
                <div>
                  <h2 className="text-2xl font-bold mb-6">
                    {isMinor ? 'Firma del Padre/Madre/Tutor' : 'Firma del Participante'}
                  </h2>

                  {isMinor && (
                    <div className="bg-yellow-50 border border-yellow-200 p-4 rounded mb-6">
                      <p className="text-yellow-800 font-semibold">
                        ⚠️ Como el participante es menor de 17 años, el padre/madre o tutor legal
                        debe completar esta sección.
                      </p>
                    </div>
                  )}

                  <div className="space-y-4">
                    {isMinor && (
                      <>
                        <div>
                          <label className="block text-sm font-semibold mb-2">
                            Nombre del Menor <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            className="input"
                            value={formData.waiver?.minorFields?.minorName || ''}
                            onChange={(e) =>
                              updateWaiverData('minorFields', {
                                ...formData.waiver?.minorFields,
                                minorName: e.target.value,
                              })
                            }
                            placeholder="Nombre completo del menor"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold mb-2">
                            Relación con el Menor <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            className="input"
                            value={formData.waiver?.minorFields?.guardianRelationship || ''}
                            onChange={(e) =>
                              updateWaiverData('minorFields', {
                                ...formData.waiver?.minorFields,
                                guardianRelationship: e.target.value,
                              })
                            }
                            placeholder="Ej: Padre, Madre, Tutor Legal"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold mb-2">
                            Teléfono del Tutor <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="tel"
                            className="input"
                            value={formData.waiver?.minorFields?.guardianPhone || ''}
                            onChange={(e) =>
                              updateWaiverData('minorFields', {
                                ...formData.waiver?.minorFields,
                                guardianPhone: e.target.value,
                              })
                            }
                            placeholder="787-123-4567"
                          />
                        </div>
                      </>
                    )}

                    <div>
                      <label className="block text-sm font-semibold mb-2">
                        {isMinor ? 'Nombre del Tutor (como aparece en identificación)' : 'Tu Nombre Completo (como aparece en identificación)'}{' '}
                        <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        className="input"
                        value={formData.waiver?.signatureName || ''}
                        onChange={(e) => updateWaiverData('signatureName', e.target.value)}
                        placeholder="Nombre completo"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Al escribir tu nombre, certificas que has leído y aceptas todos los términos
                        del relevo de responsabilidad.
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold mb-2">
                        Fecha <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        className="input"
                        value={formData.waiver?.signedDate || ''}
                        onChange={(e) => updateWaiverData('signedDate', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="flex justify-between mt-8">
                    <button onClick={prevStep} className="btn-secondary">
                      ← Anterior
                    </button>
                    <button onClick={nextStep} className="btn-primary">
                      Siguiente →
                    </button>
                  </div>
                </div>
              )}

              {/* Step 4: Confirm */}
              {currentStep === 4 && (
                <div>
                  <h2 className="text-2xl font-bold mb-6">Confirmar Registro</h2>

                  <div className="space-y-4 bg-gray-50 p-4 rounded">
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="font-semibold">{formData.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Nombre</p>
                      <p className="font-semibold">{formData.fullName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Edad</p>
                      <p className="font-semibold">{formData.ageRange}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Ciudad</p>
                      <p className="font-semibold">{formData.city}</p>
                    </div>
                  </div>

                  <div className="bg-green-50 border border-green-200 p-4 rounded mt-6">
                    <p className="text-green-800">
                      ✓ Al confirmar, recibirás un correo electrónico con tu código QR único.
                      Presenta este código al llegar al evento.
                    </p>
                  </div>

                  <div className="flex justify-between mt-8">
                    <button onClick={prevStep} className="btn-secondary" disabled={submitting}>
                      ← Anterior
                    </button>
                    <button
                      onClick={handleSubmit}
                      className="btn-primary"
                      disabled={submitting}
                    >
                      {submitting ? 'Procesando...' : 'Confirmar Registro ✓'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

