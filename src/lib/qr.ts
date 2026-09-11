import QRCode from 'qrcode';

export function generateNfcPayload(slug: string, baseUrl = 'https://bintangreview.id'): string {
  const cleanBase = baseUrl.replace(/\/+$/, '');
  return `${cleanBase}/r/${slug}`;
}

export async function generateQrSvgString(url: string): Promise<string> {
  return await QRCode.toString(url, {
    type: 'svg',
    margin: 2,
    color: {
      dark: '#0f172a',
      light: '#ffffff',
    },
    errorCorrectionLevel: 'H',
  });
}

export async function generateQrDataUrl(url: string): Promise<string> {
  return await QRCode.toDataURL(url, {
    width: 1024,
    margin: 2,
    color: {
      dark: '#0f172a',
      light: '#ffffff',
    },
    errorCorrectionLevel: 'H',
  });
}
