import { Injectable } from '@nestjs/common';

@Injectable()
export class PhoneNormalizationUtil {
  /**
   * Normalizes a phone number to a standard E.164-like format (only digits, with country code).
   * For MVP, assumes Brazilian numbers (+55) if no country code is present.
   * Handles (11) 99999-9999 -> 5511999999999
   */
  static normalize(phone: string): string {
    if (!phone) return '';
    
    // Remove all non-numeric characters
    let cleaned = phone.replace(/\D/g, '');
    
    // If it's a typical BR mobile number without country code (e.g., 11999999999 - 11 digits)
    if (cleaned.length === 10 || cleaned.length === 11) {
      cleaned = `55${cleaned}`;
    }
    
    return cleaned;
  }
}
