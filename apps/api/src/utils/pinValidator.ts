import crypto from 'crypto';

const WEAK_PINS = ['1234', '0000', '1111', '2222', '3333', '4444', '5555', '6666', '7777', '8888', '9999'];

export interface PinValidationResult {
  valid: boolean;
  error?: string;
  errorCode?: string;
}

export function validateAdminPIN(pin: unknown): PinValidationResult {
  if (!pin || typeof pin !== 'string' || pin.length < 4) {
    return { valid: false, error: 'Security PIN required (min 4 digits)', errorCode: 'PIN_REQUIRED' };
  }
  if (WEAK_PINS.includes(pin)) {
    return { valid: false, error: 'PIN too weak — choose a stronger PIN', errorCode: 'WEAK_PIN' };
  }
  const expectedPin = process.env.ADMIN_MINT_PIN;
  if (!expectedPin) {
    return { valid: false, error: 'ADMIN_MINT_PIN is not configured', errorCode: 'PIN_NOT_CONFIGURED' };
  }
  const pinBuf = Buffer.from(pin);
  const expectedBuf = Buffer.from(expectedPin);
  if (pinBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(pinBuf, expectedBuf)) {
    return { valid: false, error: 'Invalid security PIN', errorCode: 'INVALID_PIN' };
  }
  return { valid: true };
}
