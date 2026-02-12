import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { dynamoDb } from '../../../lib/dynamodb';
import { s3 } from '../../../lib/s3';
import { ses } from '../../../lib/ses';
import { success, error, notFound } from '../../../lib/response';
import { getUserFromEvent, isAdmin } from '../../../lib/auth';
import { validateUUID, validateEmail, Registration, Event } from '@doce25/shared';

const EVENTS_TABLE = process.env.EVENTS_TABLE!;
const REGISTRATIONS_TABLE = process.env.REGISTRATIONS_TABLE!;
const ASSETS_BUCKET = process.env.ASSETS_BUCKET!;

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  try {
    // Check authorization
    const user = getUserFromEvent(event);
    if (!user || !isAdmin(user)) {
      return error('No autorizado. Solo administradores pueden reenviar QR', 403);
    }

    const eventId = event.pathParameters?.eventId;

    if (!eventId || !validateUUID(eventId)) {
      return error('ID de evento inválido');
    }

    // Parse body
    const body = JSON.parse(event.body || '{}');
    const email = body.email;

    if (!email || !validateEmail(email)) {
      return error('Email inválido');
    }

    // Get event
    const eventItem = await dynamoDb.get(EVENTS_TABLE, { event_id: eventId });

    if (!eventItem) {
      return notFound('Evento no encontrado');
    }

    const eventData = eventItem as Event;

    // Get registration
    const registration = await dynamoDb.get(REGISTRATIONS_TABLE, {
      event_id: eventId,
      email: email.toLowerCase(),
    });

    if (!registration) {
      return notFound('Registro no encontrado');
    }

    const reg = registration as Registration;

    // Get QR from S3
    const qrBuffer = await s3.getFile(ASSETS_BUCKET, reg.qr_s3_key);

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
      to: reg.email,
      fullName: reg.fullName,
      eventTitle: eventData.title,
      eventDate,
      qrBuffer,
    });

    return success({
      message: 'Código QR reenviado exitosamente',
    });
  } catch (err) {
    console.error('Error resending QR:', err);
    return error('Error al reenviar el código QR');
  }
};

