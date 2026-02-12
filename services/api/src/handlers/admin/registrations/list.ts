import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { dynamoDb } from '../../../lib/dynamodb';
import { success, error, notFound } from '../../../lib/response';
import { getUserFromEvent, isAdmin } from '../../../lib/auth';
import { validateUUID, Registration } from '@doce25/shared';

const EVENTS_TABLE = process.env.EVENTS_TABLE!;
const REGISTRATIONS_TABLE = process.env.REGISTRATIONS_TABLE!;

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  try {
    // Check authorization
    const user = getUserFromEvent(event);
    if (!user || !isAdmin(user)) {
      return error('No autorizado. Solo administradores pueden acceder', 403);
    }

    const eventId = event.pathParameters?.eventId;

    if (!eventId || !validateUUID(eventId)) {
      return error('ID de evento inválido');
    }

    // Check if event exists
    const eventItem = await dynamoDb.get(EVENTS_TABLE, { event_id: eventId });

    if (!eventItem) {
      return notFound('Evento no encontrado');
    }

    // Get all registrations for this event
    const registrations = await dynamoDb.query(
      REGISTRATIONS_TABLE,
      'event_id = :event_id',
      { ':event_id': eventId }
    );

    // Sort by createdAt descending
    const sortedRegistrations = (registrations as Registration[]).sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    // Support email search filter
    const emailFilter = event.queryStringParameters?.email;
    let filteredRegistrations = sortedRegistrations;

    if (emailFilter) {
      filteredRegistrations = sortedRegistrations.filter((reg) =>
        reg.email.toLowerCase().includes(emailFilter.toLowerCase())
      );
    }

    return success({
      eventId,
      total: filteredRegistrations.length,
      registrations: filteredRegistrations,
    });
  } catch (err) {
    console.error('Error listing registrations:', err);
    return error('Error al obtener registros');
  }
};

