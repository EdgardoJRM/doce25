import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { dynamoDb } from '../../../lib/dynamodb';
import { s3 } from '../../../lib/s3';
import { success, error, notFound } from '../../../lib/response';
import { getUserFromEvent, isAdmin } from '../../../lib/auth';
import { validateUUID, Registration } from '@doce25/shared';

const EVENTS_TABLE = process.env.EVENTS_TABLE!;
const REGISTRATIONS_TABLE = process.env.REGISTRATIONS_TABLE!;
const ASSETS_BUCKET = process.env.ASSETS_BUCKET!;

function escapeCSV(value: any): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function generateCSV(registrations: Registration[]): string {
  const headers = [
    'Registration ID',
    'Email',
    'Full Name',
    'Phone',
    'Age Range',
    'Gender',
    'City',
    'Organization',
    'Organization Other',
    'Waiver Version',
    'Signature Name',
    'Signed Date',
    'Minor Name',
    'Guardian Relationship',
    'Guardian Phone',
    'Scanned',
    'Scanned At',
    'Scanned By',
    'Created At',
    'IP Address',
    'User Agent',
  ];

  const rows = registrations.map((reg) => [
    escapeCSV(reg.registration_id),
    escapeCSV(reg.email),
    escapeCSV(reg.fullName),
    escapeCSV(reg.phone || ''),
    escapeCSV(reg.ageRange),
    escapeCSV(reg.gender),
    escapeCSV(reg.city),
    escapeCSV(reg.organization),
    escapeCSV(reg.organizationOther || ''),
    escapeCSV(reg.waiver?.waiverVersion || ''),
    escapeCSV(reg.waiver?.signatureName || ''),
    escapeCSV(reg.waiver?.signedDate || ''),
    escapeCSV(reg.waiver?.minorFields?.minorName || ''),
    escapeCSV(reg.waiver?.minorFields?.guardianRelationship || ''),
    escapeCSV(reg.waiver?.minorFields?.guardianPhone || ''),
    escapeCSV(reg.scanned ? 'Yes' : 'No'),
    escapeCSV(reg.scannedAt || ''),
    escapeCSV(reg.scannedBy || ''),
    escapeCSV(reg.createdAt),
    escapeCSV(reg.waiver?.ipAddress || ''),
    escapeCSV(reg.waiver?.userAgent || ''),
  ]);

  return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
}

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  try {
    // Check authorization
    const user = getUserFromEvent(event);
    if (!user || !isAdmin(user)) {
      return error('No autorizado. Solo administradores pueden exportar', 403);
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

    // Generate CSV
    const csv = generateCSV(registrations as Registration[]);
    const csvBuffer = Buffer.from(csv, 'utf-8');

    // Upload to S3
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const csvKey = `exports/${eventId}/registrations-${timestamp}.csv`;

    await s3.uploadFile(ASSETS_BUCKET, csvKey, csvBuffer, 'text/csv');

    // Generate pre-signed URL (15 minutes)
    const csvUrl = await s3.getSignedUrl(ASSETS_BUCKET, csvKey, 900);

    return success({
      url: csvUrl,
      filename: `registrations-${timestamp}.csv`,
      totalRecords: registrations.length,
    });
  } catch (err) {
    console.error('Error exporting registrations:', err);
    return error('Error al exportar registros');
  }
};

