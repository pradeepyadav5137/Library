/**
 * Backend password strength validator for admin passwords.
 * Enforces: min 8 chars, 1 uppercase, 1 lowercase, 1 digit, 1 special character.
 */

export const PASSWORD_RULES = {
  minLength: 8,
  requireUppercase: /[A-Z]/,
  requireLowercase: /[a-z]/,
  requireDigit: /[0-9]/,
  requireSpecial: /[^A-Za-z0-9]/,
};

/**
 * Validates a password against the strength policy.
 * @param {string} password
 * @returns {{ valid: boolean, message?: string }}
 */
export const validatePassword = (password) => {
  if (!password || typeof password !== 'string') {
    return { valid: false, message: 'Password is required' };
  }

  if (password.length < PASSWORD_RULES.minLength) {
    return { valid: false, message: `Password must be at least ${PASSWORD_RULES.minLength} characters long` };
  }

  if (!PASSWORD_RULES.requireUppercase.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter' };
  }

  if (!PASSWORD_RULES.requireLowercase.test(password)) {
    return { valid: false, message: 'Password must contain at least one lowercase letter' };
  }

  if (!PASSWORD_RULES.requireDigit.test(password)) {
    return { valid: false, message: 'Password must contain at least one digit' };
  }

  if (!PASSWORD_RULES.requireSpecial.test(password)) {
    return { valid: false, message: 'Password must contain at least one special character' };
  }

  return { valid: true };
};
