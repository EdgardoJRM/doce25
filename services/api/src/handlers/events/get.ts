import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { dynamoDb } from '../../lib/dynamodb';
import { success, error, notFound } from '../../lib/response';
import { validateUUID } from '@doce25/shared';

const EVENTS_TABLE = process.env.EVENTS_TABLE!;

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  try {
    const eventId = event.pathParameters?.eventId;

    if (!eventId || !validateUUID(eventId)) {
      return error('ID de evento inválido');
    }

    const item = await dynamoDb.get(EVENTS_TABLE, { event_id: eventId });

    if (!item) {
      return notFound('Evento no encontrado');
    }

    // Only return if published (public endpoint)
    if (item.status !== 'published') {
      return notFound('Evento no encontrado');
    }

    return success(item);
  } catch (err) {
    console.error('Error getting event:', err);
    return error('Error al obtener el evento');
  }
};

