import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { dynamoDb } from '../../../lib/dynamodb';
import { success, error } from '../../../lib/response';
import { getUserFromEvent, isAdmin } from '../../../lib/auth';
import { Event } from '@doce25/shared';

const EVENTS_TABLE = process.env.EVENTS_TABLE!;

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  try {
    // Check authorization
    const user = getUserFromEvent(event);
    if (!user || !isAdmin(user)) {
      return error('No autorizado. Solo administradores pueden acceder', 403);
    }

    // Get all events (no filter by status for admin)
    const items = await dynamoDb.scan(EVENTS_TABLE);

    // Sort by createdAt descending
    const events = (items as Event[]).sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return success(events);
  } catch (err) {
    console.error('Error listing admin events:', err);
    return error('Error al obtener eventos');
  }
};

