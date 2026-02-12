import { SESClient, SendEmailCommand, SendRawEmailCommand } from '@aws-sdk/client-ses';

const sesClient = new SESClient({});

const FROM_EMAIL = process.env.FROM_EMAIL || 'info@doce25.org';

export interface EmailParams {
  to: string;
  subject: string;
  htmlBody: string;
  textBody?: string;
}

export interface EmailWithAttachmentParams {
  to: string;
  subject: string;
  htmlBody: string;
  textBody: string;
  attachments: Array<{
    filename: string;
    content: Buffer;
    contentType: string;
  }>;
}

function createRawEmail(params: EmailWithAttachmentParams): string {
  const boundary = `----=_Part_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  const attachmentBoundary = `----=_Attachment_${Date.now()}_${Math.random().toString(36).substring(7)}`;

  let rawEmail = '';
  
  // Headers
  rawEmail += `From: ${FROM_EMAIL}\r\n`;
  rawEmail += `To: ${params.to}\r\n`;
  rawEmail += `Subject: ${params.subject}\r\n`;
  rawEmail += `MIME-Version: 1.0\r\n`;
  rawEmail += `Content-Type: multipart/mixed; boundary="${boundary}"\r\n\r\n`;

  // Body wrapper
  rawEmail += `--${boundary}\r\n`;
  rawEmail += `Content-Type: multipart/alternative; boundary="${attachmentBoundary}"\r\n\r\n`;

  // Plain text part
  rawEmail += `--${attachmentBoundary}\r\n`;
  rawEmail += `Content-Type: text/plain; charset=UTF-8\r\n`;
  rawEmail += `Content-Transfer-Encoding: 7bit\r\n\r\n`;
  rawEmail += `${params.textBody}\r\n\r\n`;

  // HTML part
  rawEmail += `--${attachmentBoundary}\r\n`;
  rawEmail += `Content-Type: text/html; charset=UTF-8\r\n`;
  rawEmail += `Content-Transfer-Encoding: 7bit\r\n\r\n`;
  rawEmail += `${params.htmlBody}\r\n\r\n`;

  rawEmail += `--${attachmentBoundary}--\r\n`;

  // Attachments
  for (const attachment of params.attachments) {
    rawEmail += `--${boundary}\r\n`;
    rawEmail += `Content-Type: ${attachment.contentType}; name="${attachment.filename}"\r\n`;
    rawEmail += `Content-Transfer-Encoding: base64\r\n`;
    rawEmail += `Content-Disposition: attachment; filename="${attachment.filename}"\r\n\r\n`;
    rawEmail += attachment.content.toString('base64').match(/.{1,76}/g)?.join('\r\n') || '';
    rawEmail += `\r\n\r\n`;
  }

  rawEmail += `--${boundary}--\r\n`;

  return rawEmail;
}

export const ses = {
  async sendEmail(params: EmailParams) {
    const command = new SendEmailCommand({
      Source: FROM_EMAIL,
      Destination: {
        ToAddresses: [params.to],
      },
      Message: {
        Subject: {
          Data: params.subject,
          Charset: 'UTF-8',
        },
        Body: {
          Html: {
            Data: params.htmlBody,
            Charset: 'UTF-8',
          },
          Text: params.textBody
            ? {
                Data: params.textBody,
                Charset: 'UTF-8',
              }
            : undefined,
        },
      },
    });

    return await sesClient.send(command);
  },

  async sendEmailWithAttachment(params: EmailWithAttachmentParams) {
    const rawEmail = createRawEmail(params);
    
    const command = new SendRawEmailCommand({
      RawMessage: {
        Data: Buffer.from(rawEmail),
      },
    });

    return await sesClient.send(command);
  },

  async sendQREmail(params: {
    to: string;
    fullName: string;
    eventTitle: string;
    eventDate: string;
    qrBuffer: Buffer;
  }) {
    const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirmación de Registro - ${params.eventTitle}</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #0066cc; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="margin: 0;">Doce25</h1>
    <p style="margin: 10px 0 0 0;">Beach Cleanup Event</p>
  </div>
  
  <div style="background-color: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 8px 8px;">
    <h2 style="color: #0066cc; margin-top: 0;">¡Registro Confirmado!</h2>
    
    <p>Hola <strong>${params.fullName}</strong>,</p>
    
    <p>Tu registro para <strong>${params.eventTitle}</strong> ha sido confirmado exitosamente.</p>
    
    <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 2px solid #0066cc;">
      <p style="margin-top: 0;"><strong>Fecha del Evento:</strong> ${params.eventDate}</p>
      <p><strong>Tu Código QR:</strong></p>
      <p style="font-size: 14px; color: #666; text-align: center;">
        El código QR está adjunto a este email como <strong>qr-code.png</strong>
      </p>
      <p style="font-size: 14px; color: #666; margin-bottom: 0;">
        <strong>Importante:</strong> Presenta este código QR al llegar al evento. Puedes mostrarlo desde tu dispositivo móvil o imprimirlo.
      </p>
    </div>
    
    <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
      <p style="margin: 0; font-size: 14px;">
        <strong>Recuerda:</strong>
      </p>
      <ul style="margin: 10px 0 0 0; padding-left: 20px; font-size: 14px;">
        <li>Llegar 15 minutos antes del inicio</li>
        <li>Traer protector solar y agua</li>
        <li>Usar ropa cómoda y zapatos cerrados</li>
        <li>Seguir las instrucciones del personal</li>
      </ul>
    </div>
    
    <p style="margin-top: 30px; font-size: 14px; color: #666;">
      Si tienes alguna pregunta, no dudes en contactarnos en <a href="mailto:info@doce25.org" style="color: #0066cc;">info@doce25.org</a>
    </p>
    
    <p style="font-size: 14px; color: #666;">
      ¡Gracias por ser parte del cambio!<br>
      <strong>Equipo Doce25</strong>
    </p>
  </div>
  
  <div style="text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #999;">
    <p>Doce25 (Tortuga Club PR, Inc.)<br>
    <a href="https://doce25.org" style="color: #0066cc;">doce25.org</a></p>
  </div>
</body>
</html>
    `;

    const textBody = `
Confirmación de Registro - ${params.eventTitle}

Hola ${params.fullName},

Tu registro para ${params.eventTitle} ha sido confirmado exitosamente.

Fecha del Evento: ${params.eventDate}

Tu Código QR está adjunto a este email como "qr-code.png"

IMPORTANTE: Presenta este código QR al llegar al evento. Puedes mostrarlo desde tu dispositivo móvil o imprimirlo. El QR está en el archivo adjunto de este correo.

RECUERDA:
- Llegar 15 minutos antes del inicio
- Traer protector solar y agua
- Usar ropa cómoda y zapatos cerrados
- Seguir las instrucciones del personal

Si tienes alguna pregunta, no dudes en contactarnos en info@doce25.org

¡Gracias por ser parte del cambio!
Equipo Doce25

Doce25 (Tortuga Club PR, Inc.)
https://doce25.org
    `;

    try {
      // Send email with QR as attachment
      return await this.sendEmailWithAttachment({
        to: params.to,
        subject: `Confirmación de Registro - ${params.eventTitle}`,
        htmlBody,
        textBody,
        attachments: [
          {
            filename: 'qr-code.png',
            content: params.qrBuffer,
            contentType: 'image/png',
          },
        ],
      });
    } catch (error) {
      console.error('Error sending email with attachment:', error);
      // Fallback: send email without attachment but with instructions
      const fallbackHtml = htmlBody.replace(
        'El código QR está adjunto a este email como <strong>qr-code.png</strong>',
        '<span style="color: #d9534f;">No pudimos adjuntar el QR. Por favor contacta a info@doce25.org para recibir tu código.</span>'
      );
      const fallbackText = textBody.replace(
        'Tu Código QR está adjunto a este email como "qr-code.png"',
        'Hubo un error al adjuntar tu código QR. Por favor contacta a info@doce25.org para recibirlo.'
      );
      
      return await this.sendEmail({
        to: params.to,
        subject: `Confirmación de Registro - ${params.eventTitle}`,
        htmlBody: fallbackHtml,
        textBody: fallbackText,
      });
    }
  },
};

