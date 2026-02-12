import QRCode from 'qrcode';
import { QRData } from '@doce25/shared';

export async function generateQRCode(data: QRData): Promise<Buffer> {
  const jsonString = JSON.stringify(data);
  const buffer = await QRCode.toBuffer(jsonString, {
    errorCorrectionLevel: 'M',
    type: 'png',
    width: 400,
    margin: 2,
  });
  return buffer;
}

