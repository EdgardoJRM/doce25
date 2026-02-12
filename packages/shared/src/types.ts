// Event Types
export type EventStatus = 'draft' | 'published' | 'closed';

export interface Event {
  event_id: string;
  title: string;
  description: string;
  location: string;
  startDateTime: string; // ISO 8601
  endDateTime: string; // ISO 8601
  capacity: number;
  status: EventStatus;
  waiverRequired: boolean;
  waiverVersion: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEventInput {
  title: string;
  description: string;
  location: string;
  startDateTime: string;
  endDateTime: string;
  capacity: number;
  waiverRequired: boolean;
}

export interface UpdateEventInput {
  title?: string;
  description?: string;
  location?: string;
  startDateTime?: string;
  endDateTime?: string;
  capacity?: number;
  status?: EventStatus;
  waiverRequired?: boolean;
}

// Registration Types
export type AgeRange =
  | 'Menor de 17 años'
  | '18-24 años'
  | '25-34 años'
  | '35-44 años'
  | '45-54 años'
  | '55-64 años'
  | '65+ años';

export type Gender = 'Masculino' | 'Femenino' | 'No binario' | 'Prefiero no decir';

export type City =
  | 'San Juan'
  | 'Bayamón'
  | 'Carolina'
  | 'Ponce'
  | 'Caguas'
  | 'Guaynabo'
  | 'Mayagüez'
  | 'Trujillo Alto'
  | 'Arecibo'
  | 'Aguadilla'
  | 'Fajardo'
  | 'Humacao'
  | 'Vega Baja'
  | 'Cabo Rojo'
  | 'Isabela'
  | 'Rincón'
  | 'Dorado'
  | 'Luquillo'
  | 'Otro';

export type Organization =
  | 'Doce25'
  | 'Universidad de Puerto Rico'
  | 'Organización comunitaria'
  | 'Empresa privada'
  | 'Gobierno de PR'
  | 'ONG ambiental'
  | 'Escuela o colegio'
  | 'Iglesia o grupo religioso'
  | 'Independiente'
  | 'Otra';

export interface MinorFields {
  minorName: string;
  guardianRelationship: string;
  guardianPhone: string;
}

export interface WaiverAcceptances {
  s8: boolean;
  s9: boolean;
  s10: boolean;
  s11: boolean;
  s12: boolean;
  s13: boolean;
  s14: boolean;
  s15: boolean;
  s16: boolean;
  s17: boolean;
  s18: boolean;
}

export interface WaiverData {
  waiverRequired: boolean;
  waiverVersion: string;
  acceptances: WaiverAcceptances;
  signatureName: string;
  signedDate: string;
  acceptedAt: string;
  ipAddress?: string;
  userAgent?: string;
  minorFields?: MinorFields;
}

export interface Registration {
  event_id: string;
  email: string;
  registration_id: string;
  fullName: string;
  phone?: string;
  ageRange: AgeRange;
  gender: Gender;
  city: City;
  organization: Organization;
  organizationOther?: string;
  waiver: WaiverData;
  qr_token: string;
  qr_s3_key: string;
  scanned: boolean;
  scannedAt?: string;
  scannedBy?: string;
  createdAt: string;
}

export interface RegistrationInput {
  email: string;
  fullName: string;
  phone?: string;
  ageRange: AgeRange;
  gender: Gender;
  city: City;
  organization: Organization;
  organizationOther?: string;
  waiver: {
    acceptances: WaiverAcceptances;
    signatureName: string;
    signedDate: string;
    minorFields?: MinorFields;
  };
}

// Scan Types
export interface ScanPayload {
  event_id: string;
  email: string;
  token: string;
}

export interface ScanResponse {
  success: boolean;
  message: string;
  timestamp: string;
  registration?: {
    fullName: string;
    email: string;
  };
}

// QR Types
export interface QRData {
  event_id: string;
  email: string;
  token: string;
}

// API Response Types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total?: number;
  nextKey?: string;
}

