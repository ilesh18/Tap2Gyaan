import crypto from 'crypto';

// In-memory store for OTPs (For production, use Redis or DB with TTL)
const otpStore = new Map();

/**
 * Generate a cryptographically secure 6-digit OTP
 */
export const generateOTP = (email) => {
  const otp = crypto.randomInt(100000, 999999).toString();
  const expiresAt = Date.now() + (parseInt(process.env.OTP_EXPIRY_MINUTES || 10) * 60 * 1000);
  
  otpStore.set(email, {
    code: otp,
    expiresAt,
    attempts: 0
  });
  
  return otp;
};

/**
 * Verify an OTP code
 */
export const verifyOTP = (email, submittedOTP) => {
  const record = otpStore.get(email);
  
  if (!record) {
    return { valid: false, message: 'OTP not found or has expired. Please request a new one.' };
  }
  
  // Rate limiting attempts to prevent brute force
  const maxAttempts = parseInt(process.env.MAX_OTP_ATTEMPTS || 5);
  if (record.attempts >= maxAttempts) {
    otpStore.delete(email); // Lock out
    return { valid: false, message: 'Maximum attempts reached. Please request a new OTP.' };
  }
  
  // Check expiry
  if (Date.now() > record.expiresAt) {
    otpStore.delete(email);
    return { valid: false, message: 'OTP has expired.' };
  }
  
  // Check validity
  if (record.code === submittedOTP) {
    // Valid! Clean up.
    otpStore.delete(email);
    return { valid: true };
  } else {
    // Invalid
    record.attempts += 1;
    otpStore.set(email, record);
    return { valid: false, message: `Invalid OTP code. ${maxAttempts - record.attempts} attempts remaining.` };
  }
};
