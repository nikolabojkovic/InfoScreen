import { Injectable } from '@angular/core';

export interface ParsedQrBill {
  recipient: string;
  amount: number;
  currency: string;
  account: string;
  referenceNumber: string;
  paymentCode: string;
  paymentPurpose: string;
  description: string;
}

@Injectable({ providedIn: 'root' })
export class QrParserService {
  /**
   * Parses a Serbian NBS IPS QR code string from a bill.
   * Format uses pipe-delimited key:value pairs, e.g.:
   *   K:PR|V:01|C:1|R:265000000012345678|N:Recipient Name|I:RSD1500.00|...
   *
   * Also handles:
   * - Serbian fiscal receipt verification URLs (suf.purs.gov.rs)
   * - JSON format QR codes
   * - Plain text QR codes with amount patterns
   */
  parse(raw: string): ParsedQrBill | null {
    if (!raw || typeof raw !== 'string') return null;

    // Try URL format (Serbian fiscal receipt verification)
    if (raw.startsWith('http://') || raw.startsWith('https://')) {
      return this.parseUrl(raw);
    }

    // Try NBS IPS format (pipe-delimited)
    if (raw.includes('|') && raw.includes(':')) {
      return this.parseNbsIps(raw);
    }

    // Try JSON format (some modern apps)
    if (raw.trim().startsWith('{')) {
      return this.parseJson(raw);
    }

    // Fallback: try to extract amount from plain text
    return this.parsePlainText(raw);
  }

  private parseNbsIps(raw: string): ParsedQrBill | null {
    const fields = new Map<string, string>();

    for (const part of raw.split('|')) {
      const colonIdx = part.indexOf(':');
      if (colonIdx > 0) {
        const key = part.substring(0, colonIdx).trim().toUpperCase();
        const value = part.substring(colonIdx + 1).trim();
        fields.set(key, value);
      }
    }

    // Extract amount from I field (format: RSD1500.00 or just 1500.00)
    let amount = 0;
    let currency = 'RSD';
    const amountField = fields.get('I') || fields.get('A') || '';
    if (amountField) {
      const amountMatch = amountField.match(/([A-Z]{3})?(\d+(?:[.,]\d+)?)/);
      if (amountMatch) {
        currency = amountMatch[1] || 'RSD';
        amount = parseFloat(amountMatch[2].replace(',', '.'));
      }
    }

    const recipient = fields.get('N') || fields.get('P') || '';
    const account = fields.get('R') || '';
    const referenceNumber = fields.get('RO') || fields.get('RF') || '';
    const paymentCode = fields.get('SF') || '';
    const paymentPurpose = fields.get('S') || fields.get('P') || '';

    if (!amount && !recipient) return null;

    return {
      recipient,
      amount,
      currency,
      account,
      referenceNumber,
      paymentCode,
      paymentPurpose,
      description: this.buildDescription(recipient, paymentPurpose, referenceNumber),
    };
  }

  private parseJson(raw: string): ParsedQrBill | null {
    try {
      const obj = JSON.parse(raw);
      const amount = parseFloat(obj.amount || obj.iznos || obj.total || '0');
      const recipient = obj.recipient || obj.primalac || obj.name || '';

      if (!amount && !recipient) return null;

      return {
        recipient,
        amount,
        currency: obj.currency || obj.valuta || 'RSD',
        account: obj.account || obj.racun || '',
        referenceNumber: obj.reference || obj.pozivNaBroj || '',
        paymentCode: obj.paymentCode || obj.sifraPlacanja || '',
        paymentPurpose: obj.purpose || obj.svrha || '',
        description: this.buildDescription(
          recipient,
          obj.purpose || obj.svrha || '',
          obj.reference || obj.pozivNaBroj || ''
        ),
      };
    } catch {
      return null;
    }
  }

  private parsePlainText(raw: string): ParsedQrBill | null {
    // Try to find an amount pattern
    const amountMatch = raw.match(/(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2}))\s*(?:RSD|din)?/i);
    if (!amountMatch) return null;

    const amount = parseFloat(amountMatch[1].replace(/\./g, '').replace(',', '.'));
    if (!amount || amount <= 0) return null;

    return {
      recipient: '',
      amount,
      currency: 'RSD',
      account: '',
      referenceNumber: '',
      paymentCode: '',
      paymentPurpose: '',
      description: `QR scan: ${raw.substring(0, 80)}`,
    };
  }

  private parseUrl(raw: string): ParsedQrBill | null {
    try {
      const url = new URL(raw);

      // Serbian fiscal receipt verification URL (suf.purs.gov.rs)
      if (url.hostname.includes('purs.gov.rs') || url.hostname.includes('suf.purs')) {
        const vl = url.searchParams.get('vl') || '';
        return this.decodeFiscalReceipt(vl);
      }

      // Generic URL QR code
      return {
        recipient: url.hostname,
        amount: 0,
        currency: 'RSD',
        account: '',
        referenceNumber: '',
        paymentCode: '',
        paymentPurpose: '',
        description: `QR: ${raw.substring(0, 80)}`,
      };
    } catch {
      return null;
    }
  }

  /**
   * Decodes the base64-encoded `vl` parameter from Serbian fiscal receipt QR codes.
   * Binary format (e-Fiskalizacija):
   *   Byte 0:     version (uint8)
   *   Bytes 1-8:  ESIR JID (ASCII, 8 chars)
   *   Bytes 9-16: PFR JID (ASCII, 8 chars)
   *   Bytes 17-20: totalCounter (uint32 LE)
   *   Bytes 21-24: transactionTypeCounter (uint32 LE)
   *   Bytes 25-32: totalAmount (uint64 LE, in 1/10000 RSD)
   *   Bytes 33-40: dateAndTime (uint64 BE, Unix timestamp in ms)
   */
  private decodeFiscalReceipt(vl: string): ParsedQrBill {
    try {
      const binaryStr = atob(vl);
      const bytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }
      const dataView = new DataView(bytes.buffer);

      const requestedBy = String.fromCharCode(...bytes.slice(1, 9));
      const signedBy = String.fromCharCode(...bytes.slice(9, 17));
      const totalCounter = dataView.getUint32(17, true);
      const amountLow = dataView.getUint32(25, true);
      const amountHigh = dataView.getUint32(29, true);
      const totalAmount = (amountHigh * 0x100000000 + amountLow) / 10000;
      const receiptNumber = `${requestedBy}-${signedBy}-${totalCounter}`;

      return {
        recipient: 'Фискални рачун',
        amount: Math.round(totalAmount * 100) / 100,
        currency: 'RSD',
        account: '',
        referenceNumber: receiptNumber,
        paymentCode: '',
        paymentPurpose: 'Fiscal receipt',
        description: `Fiscal receipt ${receiptNumber}`,
      };
    } catch {
      return {
        recipient: 'Фискални рачун',
        amount: 0,
        currency: 'RSD',
        account: '',
        referenceNumber: vl.substring(0, 30),
        paymentCode: '',
        paymentPurpose: 'Fiscal receipt',
        description: 'Fiscal receipt',
      };
    }
  }

  private buildDescription(recipient: string, purpose: string, reference: string): string {
    const parts: string[] = [];
    if (recipient) parts.push(recipient);
    if (purpose) parts.push(purpose);
    if (reference) parts.push(`ref: ${reference}`);
    return parts.join(' - ') || 'QR scanned bill';
  }
}
