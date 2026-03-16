export const DEFAULT_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{12,64}$/;
export const DEFAULT_PASSWORD_MESSAGE = '12-64자, 대소문자·숫자·특수문자 포함';

export function getPasswordPolicyRegex(pattern?: string | null) {
  if (!pattern) {
    return DEFAULT_PASSWORD_REGEX;
  }

  try {
    return new RegExp(pattern);
  } catch {
    return DEFAULT_PASSWORD_REGEX;
  }
}
