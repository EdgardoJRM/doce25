import {
  RegistrationInput,
  CreateEventInput,
  UpdateEventInput,
  ScanPayload,
  EventStatus,
} from './types';
import { AGE_RANGES, GENDERS, CITIES, ORGANIZATIONS } from './constants';

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

// Email validation
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// UUID validation
export function validateUUID(uuid: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

// Date validation
export function validateISODate(dateString: string): boolean {
  const date = new Date(dateString);
  return !isNaN(date.getTime()) && dateString === date.toISOString();
}

// Full name validation (must be "Apellidos, Nombre" format)
export function validateFullName(fullName: string): boolean {
  const parts = fullName.split(',');
  return parts.length === 2 && parts[0].trim().length > 0 && parts[1].trim().length > 0;
}

// Validate all waiver acceptances are true
export function validateWaiverAcceptances(acceptances: Record<string, boolean> | any): boolean {
  const requiredSections = ['s8', 's9', 's10', 's11', 's12', 's13', 's14', 's15', 's16', 's17', 's18'];
  return requiredSections.every((section) => acceptances[section] === true);
}

// Registration validation
export function validateRegistrationInput(input: RegistrationInput): void {
  // Email
  if (!input.email || !validateEmail(input.email)) {
    throw new ValidationError('Email inválido');
  }

  // Full name
  if (!input.fullName || !validateFullName(input.fullName)) {
    throw new ValidationError('Nombre completo debe estar en formato "Apellidos, Nombre"');
  }

  // Age range
  if (!input.ageRange || !AGE_RANGES.includes(input.ageRange)) {
    throw new ValidationError('Rango de edad inválido');
  }

  // Gender
  if (!input.gender || !GENDERS.includes(input.gender)) {
    throw new ValidationError('Género inválido');
  }

  // City
  if (!input.city || !CITIES.includes(input.city)) {
    throw new ValidationError('Ciudad inválida');
  }

  // Organization
  if (!input.organization || !ORGANIZATIONS.includes(input.organization)) {
    throw new ValidationError('Organización inválida');
  }

  // Organization other (if "Otra" selected)
  if (input.organization === 'Otra') {
    if (!input.organizationOther || input.organizationOther.trim().length < 2) {
      throw new ValidationError('Debe especificar el nombre de la organización');
    }
  }

  // Waiver validations
  if (!input.waiver) {
    throw new ValidationError('Datos del relevo requeridos');
  }

  // Validate all acceptances are true
  if (!validateWaiverAcceptances(input.waiver.acceptances)) {
    throw new ValidationError('Debe aceptar todas las secciones del relevo');
  }

  // Signature name
  if (!input.waiver.signatureName || input.waiver.signatureName.trim().length < 2) {
    throw new ValidationError('Nombre de firma requerido');
  }

  // Signed date
  if (!input.waiver.signedDate) {
    throw new ValidationError('Fecha de firma requerida');
  }

  // Minor fields validation
  if (input.ageRange === 'Menor de 17 años') {
    if (!input.waiver.minorFields) {
      throw new ValidationError('Datos del tutor requeridos para menores de edad');
    }

    const { minorName, guardianRelationship, guardianPhone } = input.waiver.minorFields;

    if (!minorName || minorName.trim().length < 2) {
      throw new ValidationError('Nombre del menor requerido');
    }

    if (!guardianRelationship || guardianRelationship.trim().length < 2) {
      throw new ValidationError('Relación con el tutor requerida');
    }

    if (!guardianPhone || guardianPhone.trim().length < 10) {
      throw new ValidationError('Teléfono del tutor requerido');
    }
  }
}

// Event validation
export function validateCreateEventInput(input: CreateEventInput): void {
  if (!input.title || input.title.trim().length < 3) {
    throw new ValidationError('Título debe tener al menos 3 caracteres');
  }

  if (!input.description || input.description.trim().length < 10) {
    throw new ValidationError('Descripción debe tener al menos 10 caracteres');
  }

  if (!input.location || input.location.trim().length < 3) {
    throw new ValidationError('Ubicación debe tener al menos 3 caracteres');
  }

  if (!input.startDateTime || !validateISODate(input.startDateTime)) {
    throw new ValidationError('Fecha de inicio inválida');
  }

  if (!input.endDateTime || !validateISODate(input.endDateTime)) {
    throw new ValidationError('Fecha de fin inválida');
  }

  const start = new Date(input.startDateTime);
  const end = new Date(input.endDateTime);

  if (end <= start) {
    throw new ValidationError('La fecha de fin debe ser posterior a la fecha de inicio');
  }

  if (!Number.isInteger(input.capacity) || input.capacity < 1) {
    throw new ValidationError('Capacidad debe ser un número entero mayor a 0');
  }

  if (typeof input.waiverRequired !== 'boolean') {
    throw new ValidationError('waiverRequired debe ser un booleano');
  }
}

export function validateUpdateEventInput(input: UpdateEventInput): void {
  if (input.title !== undefined && input.title.trim().length < 3) {
    throw new ValidationError('Título debe tener al menos 3 caracteres');
  }

  if (input.description !== undefined && input.description.trim().length < 10) {
    throw new ValidationError('Descripción debe tener al menos 10 caracteres');
  }

  if (input.location !== undefined && input.location.trim().length < 3) {
    throw new ValidationError('Ubicación debe tener al menos 3 caracteres');
  }

  if (input.startDateTime !== undefined && !validateISODate(input.startDateTime)) {
    throw new ValidationError('Fecha de inicio inválida');
  }

  if (input.endDateTime !== undefined && !validateISODate(input.endDateTime)) {
    throw new ValidationError('Fecha de fin inválida');
  }

  if (input.capacity !== undefined) {
    if (!Number.isInteger(input.capacity) || input.capacity < 1) {
      throw new ValidationError('Capacidad debe ser un número entero mayor a 0');
    }
  }

  if (input.status !== undefined) {
    const validStatuses: EventStatus[] = ['draft', 'published', 'closed'];
    if (!validStatuses.includes(input.status)) {
      throw new ValidationError('Estado inválido');
    }
  }

  if (input.waiverRequired !== undefined && typeof input.waiverRequired !== 'boolean') {
    throw new ValidationError('waiverRequired debe ser un booleano');
  }
}

// Scan validation
export function validateScanPayload(payload: ScanPayload): void {
  if (!payload.event_id || !validateUUID(payload.event_id)) {
    throw new ValidationError('event_id inválido');
  }

  if (!payload.email || !validateEmail(payload.email)) {
    throw new ValidationError('Email inválido');
  }

  if (!payload.token || !validateUUID(payload.token)) {
    throw new ValidationError('Token inválido');
  }
}

