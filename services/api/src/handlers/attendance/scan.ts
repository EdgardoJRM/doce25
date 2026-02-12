import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { dynamoDb } from '../../lib/dynamodb';
import { success, error, notFound, conflict } from '../../lib/response';
import { getUserFromEvent, isStaffOrAdmin } from '../../lib/auth';
import {
  validateScanPayload,
  ValidationError,
  ScanPayload,
  Registration,
  ScanResponse,
} from '@doce25/shared';

const REGISTRATIONS_TABLE = process.env.REGISTRATIONS_TABLE!;

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  try {
    // Check authorization
    const user = getUserFromEvent(event);
    if (!user || !isStaffOrAdmin(user)) {
      return error('No autorizado', 403);
    }

    // Parse and validate input
    let payload: ScanPayload;
    try {
      payload = JSON.parse(event.body || '{}');
      validateScanPayload(payload);
    } catch (err) {
      if (err instanceof ValidationError) {
        return error(err.message);
      }
      return error('Datos de escaneo inválidos');
    }

    // Get registration
    const registration = await dynamoDb.get(REGISTRATIONS_TABLE, {
      event_id: payload.event_id,
      email: payload.email.toLowerCase(),
    });

    if (!registration) {
      return notFound('Registro no encontrado');
    }

    const reg = registration as Registration;

    // Validate token
    if (reg.qr_token !== payload.token) {
      return error('Código QR inválido', 400);
    }

    // Check if already scanned
    if (reg.scanned) {
      return conflict('Este código QR ya fue escaneado anteriormente');
    }

    // Update registration as scanned
    const now = new Date().toISOString();
    await dynamoDb.update(
      REGISTRATIONS_TABLE,
      {
        event_id: payload.event_id,
        email: payload.email.toLowerCase(),
      },
      'SET scanned = :scanned, scannedAt = :scannedAt, scannedBy = :scannedBy',
      {
        ':scanned': true,
        ':scannedAt': now,
        ':scannedBy': user.email,
      }
    );

    const response: ScanResponse = {
      success: true,
      message: 'Asistencia registrada exitosamente',
      timestamp: now,
      registration: {
        fullName: reg.fullName,
        email: reg.email,
      },
    };

    return success(response);
  } catch (err) {
    console.error('Error scanning attendance:', err);
    return error('Error al procesar el escaneo');
  }
};

