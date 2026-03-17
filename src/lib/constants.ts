export const ACCESS_TOKEN_COOKIE = 'psycho_access_token';
export const REFRESH_TOKEN_COOKIE = 'psycho_refresh_token';
export const USER_ID_COOKIE = 'psycho_user_id';

const isProduction = process.env.NODE_ENV === 'production';

function requireEnv(name: string, fallback?: string) {
  const value = process.env[name] ?? fallback;
  if (value) {
    return value;
  }

  throw new Error(`${name} is required${isProduction ? ' in production' : ''}.`);
}

export const BACKEND_API_URL = requireEnv(
  'BACKEND_API_URL',
  isProduction ? undefined : 'http://localhost:8080',
);
export const BACKEND_REFRESH_COOKIE_NAME = requireEnv(
  'BACKEND_REFRESH_COOKIE_NAME',
  isProduction ? undefined : 'refresh_token',
);
