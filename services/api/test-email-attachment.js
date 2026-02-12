/**
 * Script de test para validar el envío de email con QR attachment
 * 
 * Uso:
 *   node test-email-attachment.js <email-destino>
 * 
 * Ejemplo:
 *   node test-email-attachment.js test@example.com
 * 
 * Requisitos:
 *   - AWS credentials configuradas
 *   - SES configurado y email verificado
 *   - Variables de entorno cargadas (.env)
 */

const { SESClient, SendRawEmailCommand } = require('@aws-sdk/client-ses');
const QRCode = require('qrcode');

async function testEmailWithAttachment(toEmail) {
  console.log('🧪 Test de Email con QR Attachment');
  console.log('================================\n');

  if (!toEmail) {
    console.error('❌ Error: Debe proporcionar un email de destino');
    console.log('Uso: node test-email-attachment.js <email@example.com>');
    process.exit(1);
  }

  console.log(`📧 Destino: ${toEmail}`);
  console.log('📝 Generando QR de prueba...');

  // Generate test QR
  const testQRData = {
    event_id: 'test-event-123',
    email: toEmail,
    token: 'test-token-456',
  };

  const qrBuffer = await QRCode.toBuffer(JSON.stringify(testQRData), {
    errorCorrectionLevel: 'M',
    type: 'png',
    width: 400,
    margin: 2,
  });

  console.log(`✅ QR generado (${qrBuffer.length} bytes)`);

  // Create raw email
  const fromEmail = process.env.FROM_EMAIL || 'info@doce25.org';
  const boundary = `----=_Part_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  const attachmentBoundary = `----=_Attachment_${Date.now()}_${Math.random().toString(36).substring(7)}`;

  let rawEmail = '';
  
  // Headers
  rawEmail += `From: ${fromEmail}\r\n`;
  rawEmail += `To: ${toEmail}\r\n`;
  rawEmail += `Subject: TEST - Confirmacion de Registro\r\n`;
  rawEmail += `MIME-Version: 1.0\r\n`;
  rawEmail += `Content-Type: multipart/mixed; boundary="${boundary}"\r\n\r\n`;

  // Body wrapper
  rawEmail += `--${boundary}\r\n`;
  rawEmail += `Content-Type: multipart/alternative; boundary="${attachmentBoundary}"\r\n\r\n`;

  // Plain text
  rawEmail += `--${attachmentBoundary}\r\n`;
  rawEmail += `Content-Type: text/plain; charset=UTF-8\r\n`;
  rawEmail += `Content-Transfer-Encoding: 7bit\r\n\r\n`;
  rawEmail += `Este es un email de prueba con QR adjunto.\n\n`;
  rawEmail += `El codigo QR esta en el archivo adjunto "qr-code.png"\r\n\r\n`;

  // HTML
  rawEmail += `--${attachmentBoundary}\r\n`;
  rawEmail += `Content-Type: text/html; charset=UTF-8\r\n`;
  rawEmail += `Content-Transfer-Encoding: 7bit\r\n\r\n`;
  rawEmail += `<html><body>`;
  rawEmail += `<h2>Email de Prueba</h2>`;
  rawEmail += `<p>Tu codigo QR esta adjunto como <strong>qr-code.png</strong></p>`;
  rawEmail += `</body></html>\r\n\r\n`;

  rawEmail += `--${attachmentBoundary}--\r\n`;

  // Attachment
  rawEmail += `--${boundary}\r\n`;
  rawEmail += `Content-Type: image/png; name="qr-code.png"\r\n`;
  rawEmail += `Content-Transfer-Encoding: base64\r\n`;
  rawEmail += `Content-Disposition: attachment; filename="qr-code.png"\r\n\r\n`;
  rawEmail += qrBuffer.toString('base64').match(/.{1,76}/g).join('\r\n');
  rawEmail += `\r\n\r\n`;

  rawEmail += `--${boundary}--\r\n`;

  console.log('\n📤 Enviando email via SES...');

  // Send via SES
  const sesClient = new SESClient({ region: process.env.AWS_REGION || 'us-east-1' });
  
  try {
    const command = new SendRawEmailCommand({
      RawMessage: {
        Data: Buffer.from(rawEmail),
      },
    });

    const result = await sesClient.send(command);
    
    console.log('\n✅ Email enviado exitosamente!');
    console.log(`📋 Message ID: ${result.MessageId}`);
    console.log('\n🔍 Verifica tu bandeja de entrada (y spam)');
    console.log('   - El email debe incluir attachment "qr-code.png"');
    console.log('   - El QR debe ser legible desde cualquier lector');
    console.log('   - Debe funcionar en Gmail, iOS Mail, Outlook, etc.\n');

  } catch (error) {
    console.error('\n❌ Error al enviar email:', error.message);
    console.error('\nPosibles causas:');
    console.error('  - Email no verificado en SES');
    console.error('  - SES en sandbox mode');
    console.error('  - Credenciales AWS incorrectas');
    console.error('  - Region incorrecta\n');
    process.exit(1);
  }
}

// Run test
const emailArg = process.argv[2];
testEmailWithAttachment(emailArg).catch(console.error);

