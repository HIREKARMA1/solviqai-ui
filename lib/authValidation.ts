import { sanitizePhoneInput, validateEmail, validatePassword, validatePhone } from '@/lib/utils';

export type AuthField =
  | 'name'
  | 'lastName'
  | 'email'
  | 'phone'
  | 'password'
  | 'confirmPassword'
  | 'terms';

export interface RegisterFormValues {
  name: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  agreedToTerms: boolean;
}

export type FieldErrorMap = Partial<Record<AuthField, string>>;

const NAME_LETTERS = 'A-Za-z\\u00C0-\\u024F\\u0900-\\u097F\\u0B00-\\u0B7F';
const DISALLOWED_NAME_CHARS = new RegExp(`[^${NAME_LETTERS} '\\u2019\\-]`);
const PERSON_NAME = new RegExp(
  `^[${NAME_LETTERS}]+(?:[ '\\u2019\\-][${NAME_LETTERS}]+)*$`
);

export const AUTH_MESSAGES = {
  nameRequired: 'Name is required.',
  nameInvalid: 'Please enter a valid name. Numbers and special characters are not allowed.',
  nameTooShort: 'Name must be at least 2 characters.',
  nameTooLong: 'Name must be at most 255 characters.',
  lastNameInvalid: 'Please enter a valid last name. Numbers and special characters are not allowed.',
  lastNameTooShort: 'Last name must be at least 2 characters.',
  lastNameTooLong: 'Last name must be at most 255 characters.',
  emailRequired: 'Email is required.',
  emailInvalid: 'Please enter a valid email address.',
  phoneInvalid: 'Please enter a valid phone number.',
  passwordRequired: 'Password is required.',
  passwordInvalid:
    'Password must be at least 8 characters with uppercase, lowercase, digit, and special character.',
  confirmRequired: 'Please confirm your password.',
  confirmMismatch: 'Passwords do not match.',
  termsRequired: 'Please agree to the Terms & Conditions.',
} as const;

export function hasDisallowedNameChars(value: string): boolean {
  return DISALLOWED_NAME_CHARS.test(value);
}

export function isValidPersonName(value: string): boolean {
  const trimmed = value.trim();
  return trimmed.length >= 2 && trimmed.length <= 255 && PERSON_NAME.test(trimmed);
}

function nameFieldError(value: string, required: boolean, label: 'name' | 'lastName'): string {
  const trimmed = value.trim();
  const messages = label === 'name'
    ? {
        required: AUTH_MESSAGES.nameRequired,
        invalid: AUTH_MESSAGES.nameInvalid,
        tooShort: AUTH_MESSAGES.nameTooShort,
        tooLong: AUTH_MESSAGES.nameTooLong,
      }
    : {
        required: '',
        invalid: AUTH_MESSAGES.lastNameInvalid,
        tooShort: AUTH_MESSAGES.lastNameTooShort,
        tooLong: AUTH_MESSAGES.lastNameTooLong,
      };

  if (!trimmed) return required ? messages.required : '';
  if (hasDisallowedNameChars(value) || !PERSON_NAME.test(trimmed)) return messages.invalid;
  if (trimmed.length < 2) return messages.tooShort;
  if (trimmed.length > 255) return messages.tooLong;
  return '';
}

export function getEmailError(email: string): string {
  if (!email.trim()) return AUTH_MESSAGES.emailRequired;
  if (!validateEmail(email.trim())) return AUTH_MESSAGES.emailInvalid;
  return '';
}

export function getPasswordError(password: string): string {
  if (!password) return AUTH_MESSAGES.passwordRequired;
  if (!validatePassword(password)) return AUTH_MESSAGES.passwordInvalid;
  return '';
}

export function getPhoneError(phone: string): string {
  if (!phone.trim()) return '';
  if (sanitizePhoneInput(phone.trim()) !== phone.trim() || !validatePhone(phone)) {
    return AUTH_MESSAGES.phoneInvalid;
  }
  return '';
}

export function getRegisterErrors(values: RegisterFormValues): Record<AuthField, string> {
  return {
    name: nameFieldError(values.name, true, 'name'),
    lastName: nameFieldError(values.lastName, false, 'lastName'),
    email: getEmailError(values.email),
    phone: getPhoneError(values.phone),
    password: getPasswordError(values.password),
    confirmPassword: !values.confirmPassword
      ? AUTH_MESSAGES.confirmRequired
      : values.confirmPassword !== values.password
        ? AUTH_MESSAGES.confirmMismatch
        : '',
    terms: values.agreedToTerms ? '' : AUTH_MESSAGES.termsRequired,
  };
}

export function getLoginErrors(email: string, password: string): { email: string; password: string } {
  return {
    email: getEmailError(email),
    password: password ? '' : AUTH_MESSAGES.passwordRequired,
  };
}

export function classifyAuthServerError(message: string): 'email' | 'phone' | 'password' | 'form' {
  const lower = message.toLowerCase();

  if (
    lower.includes('already logged in') ||
    lower.includes('inactive') ||
    lower.includes('unexpected') ||
    lower.includes('traceback')
  ) {
    return 'form';
  }
  if (lower.includes('phone')) return 'phone';
  if (lower.includes('password')) return 'password';
  if (
    lower.includes('email') ||
    lower.includes('not registered') ||
    lower.includes('not found') ||
    lower.includes('sign up')
  ) {
    return 'email';
  }
  return 'form';
}

export function publicAuthError(message: string, fallback: string): string {
  const text = message?.trim() ?? '';
  const lower = text.toLowerCase();
  const internal =
    !text ||
    lower.includes('unexpected') ||
    lower.includes('traceback') ||
    lower.includes('sqlalchemy') ||
    lower.includes('exception') ||
    lower.includes('internal server') ||
    lower.includes('failed to register') ||
    lower.includes('login failed');

  return internal ? fallback : text;
}
