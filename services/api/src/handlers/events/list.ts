import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { dynamoDb } from '../../lib/dynamodb';
import { success, error } from '../../lib/response';
import { Event } from '@doce25/shared';

const EVENTS_TABLE = process.env.EVENTS_TABLE!;

export const handler: APIGatewayProxyHandlerV2 = async () => {
  try {
    // Get all published events
    const items = await dynamoDb.scan(
      EVENTS_TABLE,
      '#status = :status',
      {
        ':status': 'published',
      }
    );

    // Sort by startDateTime descending
    const events = (items as Event[]).sort((a, b) => {
      return new Date(b.startDateTime).getTime() - new Date(a.startDateTime).getTime();
    });

    return success(events);
  } catch (err) {
    console.error('Error listing events:', err);
    return error('Error al obtener eventos');
  }
};

