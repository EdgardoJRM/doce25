import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { dynamoDb } from '../../../lib/dynamodb';
import { success, error, notFound } from '../../../lib/response';
import { getUserFromEvent, isAdmin } from '../../../lib/auth';
import {
  validateUUID,
  validateUpdateEventInput,
  ValidationError,
  UpdateEventInput,
  Event,
} from '@doce25/shared';

const EVENTS_TABLE = process.env.EVENTS_TABLE!;

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  try {
    // Check authorization
    const user = getUserFromEvent(event);
    if (!user || !isAdmin(user)) {
      return error('No autorizado. Solo administradores pueden actualizar eventos', 403);
    }

    const eventId = event.pathParameters?.eventId;

    if (!eventId || !validateUUID(eventId)) {
      return error('ID de evento inválido');
    }

    // Parse and validate input
    let input: UpdateEventInput;
    try {
      input = JSON.parse(event.body || '{}');
      validateUpdateEventInput(input);
    } catch (err) {
      if (err instanceof ValidationError) {
        return error(err.message);
      }
      return error('Datos de actualización inválidos');
    }

    // Check if event exists
    const existingEvent = await dynamoDb.get(EVENTS_TABLE, { event_id: eventId });

    if (!existingEvent) {
      return notFound('Evento no encontrado');
    }

    // Build update expression
    const updateParts: string[] = [];
    const expressionAttributeValues: Record<string, any> = {};
    const expressionAttributeNames: Record<string, string> = {};

    if (input.title !== undefined) {
      updateParts.push('title = :title');
      expressionAttributeValues[':title'] = input.title;
    }

    if (input.description !== undefined) {
      updateParts.push('description = :description');
      expressionAttributeValues[':description'] = input.description;
    }

    if (input.location !== undefined) {
      updateParts.push('#location = :location');
      expressionAttributeValues[':location'] = input.location;
      expressionAttributeNames['#location'] = 'location';
    }

    if (input.startDateTime !== undefined) {
      updateParts.push('startDateTime = :startDateTime');
      expressionAttributeValues[':startDateTime'] = input.startDateTime;
    }

    if (input.endDateTime !== undefined) {
      updateParts.push('endDateTime = :endDateTime');
      expressionAttributeValues[':endDateTime'] = input.endDateTime;
    }

    if (input.capacity !== undefined) {
      updateParts.push('capacity = :capacity');
      expressionAttributeValues[':capacity'] = input.capacity;
    }

    if (input.status !== undefined) {
      updateParts.push('#status = :status');
      expressionAttributeValues[':status'] = input.status;
      expressionAttributeNames['#status'] = 'status';
    }

    if (input.waiverRequired !== undefined) {
      updateParts.push('waiverRequired = :waiverRequired');
      expressionAttributeValues[':waiverRequired'] = input.waiverRequired;
    }

    // Always update updatedAt
    updateParts.push('updatedAt = :updatedAt');
    expressionAttributeValues[':updatedAt'] = new Date().toISOString();

    if (updateParts.length === 1) {
      // Only updatedAt, nothing to update
      return error('No hay cambios para actualizar');
    }

    const updateExpression = 'SET ' + updateParts.join(', ');

    // Update event
    const updated = await dynamoDb.update(
      EVENTS_TABLE,
      { event_id: eventId },
      updateExpression,
      expressionAttributeValues,
      Object.keys(expressionAttributeNames).length > 0 ? expressionAttributeNames : undefined
    );

    return success(updated as Event);
  } catch (err) {
    console.error('Error updating event:', err);
    return error('Error al actualizar el evento');
  }
};

