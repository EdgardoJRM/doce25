import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { v4 as uuidv4 } from 'uuid';
import { createHash } from 'crypto';
import { dynamoDb } from '../../lib/dynamodb';
import { s3 } from '../../lib/s3';
import { ses } from '../../lib/ses';
import { generateQRCode } from '../../lib/qrcode';
import { success, error, notFound, conflict } from '../../lib/response';
import {
  validateUUID,
  validateRegistrationInput,
  ValidationError,
  RegistrationInput,
  Event,
  Registration,
  WAIVER_VERSION,
} from '@doce25/shared';

const EVENTS_TABLE = process.env.EVENTS_TABLE!;
const REGISTRATIONS_TABLE = process.env.REGISTRATIONS_TABLE!;
const ASSETS_BUCKET = process.env.ASSETS_BUCKET!;

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  try {
    const eventId = event.pathParameters?.eventId;

    if (!eventId || !validateUUID(eventId)) {
      return error('ID de evento inválido');
    }

    // Parse and validate input
    let input: RegistrationInput;
    try {
      input = JSON.parse(event.body || '{}');
      validateRegistrationInput(input);
    } catch (err) {
      if (err instanceof ValidationError) {
        return error(err.message);
      }
      return error('Datos de registro inválidos');
    }

    // Get event
    const eventItem = await dynamoDb.get(EVENTS_TABLE, { event_id: eventId });

    if (!eventItem) {
      return notFound('Evento no encontrado');
    }

    const eventData = eventItem as Event;

    // Check if event is published
    if (eventData.status !== 'published') {
      return error('El evento no está abierto para registro');
    }

    // Check if event is full
    const registrations = await dynamoDb.query(
      REGISTRATIONS_TABLE,
      'event_id = :event_id',
      { ':event_id': eventId }
    );

    if (registrations.length >= eventData.capacity) {
      return conflict('El evento ha alcanzado su capacidad máxima');
    }

    // Check if user already registered
    const existingRegistration = await dynamoDb.get(REGISTRATIONS_TABLE, {
      event_id: eventId,
      email: input.email.toLowerCase(),
    });

    if (existingRegistration) {
      return conflict('Ya estás registrado para este evento');
    }

    // Validate waiver if required
    if (eventData.waiverRequired && !input.waiver) {
      return error('Este evento requiere aceptar el relevo de responsabilidad');
    }

    // Generate QR token
    const qrToken = uuidv4();
    const registrationId = uuidv4();

    // Generate QR code
    const qrData = {
      event_id: eventId,
      email: input.email.toLowerCase(),
      token: qrToken,
    };

    const qrBuffer = await generateQRCode(qrData);

    // Upload QR to S3
    const emailHash = createHash('sha256').update(input.email.toLowerCase()).digest('hex');
    const qrKey = `qrs/${eventId}/${emailHash}.png`;

    await s3.uploadFile(ASSETS_BUCKET, qrKey, qrBuffer, 'image/png');

    // Get client IP and User Agent
    const ipAddress = event.requestContext.http.sourceIp;
    const userAgent = event.requestContext.http.userAgent;

    // Create registration record
    const now = new Date().toISOString();
    const registration: Registration = {
      event_id: eventId,
      email: input.email.toLowerCase(),
      registration_id: registrationId,
      fullName: input.fullName,
      phone: input.phone,
      ageRange: input.ageRange,
      gender: input.gender,
      city: input.city,
      organization: input.organization,
      organizationOther: input.organizationOther,
      waiver: {
        waiverRequired: eventData.waiverRequired,
        waiverVersion: WAIVER_VERSION,
        acceptances: input.waiver.acceptances,
        signatureName: input.waiver.signatureName,
        signedDate: input.waiver.signedDate,
        acceptedAt: now,
        ipAddress,
        userAgent,
        minorFields: input.waiver.minorFields,
      },
      qr_token: qrToken,
      qr_s3_key: qrKey,
      scanned: false,
      createdAt: now,
    };

    // Save registration
    await dynamoDb.put(REGISTRATIONS_TABLE, registration);

    // Send email with QR as attachment
    const eventDate = new Date(eventData.startDateTime).toLocaleString('es-PR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    await ses.sendQREmail({
      to: input.email,
      fullName: input.fullName,
      eventTitle: eventData.title,
      eventDate,
      qrBuffer,
    });

    return success(
      {
        message: 'Registro exitoso. Revisa tu correo electrónico para tu código QR.',
        registration_id: registrationId,
      },
      201
    );
  } catch (err) {
    console.error('Error registering for event:', err);
    return error('Error al procesar el registro');
  }
};

