import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { v4 as uuidv4 } from 'uuid';
import { dynamoDb } from '../../../lib/dynamodb';
import { success, error } from '../../../lib/response';
import { getUserFromEvent, isAdmin } from '../../../lib/auth';
import {
  validateCreateEventInput,
  ValidationError,
  CreateEventInput,
  Event,
  WAIVER_VERSION,
} from '@doce25/shared';

const EVENTS_TABLE = process.env.EVENTS_TABLE!;

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  try {
    // Check authorization
    const user = getUserFromEvent(event);
    if (!user || !isAdmin(user)) {
      return error('No autorizado. Solo administradores pueden crear eventos', 403);
    }

    // Parse and validate input
    let input: CreateEventInput;
    try {
      input = JSON.parse(event.body || '{}');
      validateCreateEventInput(input);
    } catch (err) {
      if (err instanceof ValidationError) {
        return error(err.message);
      }
      return error('Datos de evento inválidos');
    }

    // Create event
    const now = new Date().toISOString();
    const eventData: Event = {
      event_id: uuidv4(),
      title: input.title,
      description: input.description,
      location: input.location,
      startDateTime: input.startDateTime,
      endDateTime: input.endDateTime,
      capacity: input.capacity,
      status: 'draft',
      waiverRequired: input.waiverRequired,
      waiverVersion: WAIVER_VERSION,
      createdAt: now,
      updatedAt: now,
    };

    await dynamoDb.put(EVENTS_TABLE, eventData);

    return success(eventData, 201);
  } catch (err) {
    console.error('Error creating event:', err);
    return error('Error al crear el evento');
  }
};

