export const ENV = {
  TESLA_CLIENT_ID: import.meta.env.VITE_TESLA_CLIENT_ID as string,
  TESLA_CLIENT_SECRET: import.meta.env.VITE_TESLA_CLIENT_SECRET as string,
  TESLA_REDIRECT_URI: import.meta.env.VITE_TESLA_REDIRECT_URI as string,
  HASS_URL: import.meta.env.VITE_HASS_URL as string,
  HASS_TOKEN: import.meta.env.VITE_HASS_TOKEN as string,
  API_URL: import.meta.env.VITE_API_URL as string,
  ENV: import.meta.env.VITE_ENV as 'development' | 'production'
};