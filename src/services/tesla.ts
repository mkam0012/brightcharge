import axios, { AxiosError } from 'axios';
import { ENV } from '../config/environment';
import type { TeslaAuthResponse, TeslaVehicle } from '../types/tesla';

export const TESLA_API_BASE = 'https://fleet-api.prd.na.vn.cloud.tesla.com';
export const TESLA_AUTH_BASE = 'https://fleet-auth.prd.vn.cloud.tesla.com';

export class TeslaAPI {
  private static instance: TeslaAPI;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private tokenExpiry: number | null = null;
  private partnerToken: string = '';

  private constructor() {}

  static getInstance(): TeslaAPI {
    if (!TeslaAPI.instance) {
      TeslaAPI.instance = new TeslaAPI();
    }
    return TeslaAPI.instance;
  }

  private isTokenExpired(): boolean {
    if (!this.tokenExpiry) return true;
    // Consider token expired 5 minutes before actual expiry
    return Date.now() >= (this.tokenExpiry - 5 * 60 * 1000);
  }

  async getPartnerToken(): Promise<string> {
    if (this.partnerToken) return this.partnerToken;

    try {
      const response = await axios.post(`${TESLA_AUTH_BASE}/oauth2/v3/token`, {
        grant_type: 'client_credentials',
        client_id: ENV.TESLA_CLIENT_ID,
        client_secret: ENV.TESLA_CLIENT_SECRET,
        audience: TESLA_API_BASE,
        scope: 'openid user_data vehicle_device_data vehicle_cmds vehicle_charging_cmds'
      });

      this.partnerToken = response.data.access_token;
      return this.partnerToken;
    } catch (error) {
      console.error('Failed to get partner token:', error);
      throw this.handleError(error as AxiosError);
    }
  }

  async registerPartnerAccount(): Promise<void> {
    try {
      const partnerToken = await this.getPartnerToken();
      
      await axios.post(`${TESLA_API_BASE}/api/1/partner_accounts`, {}, {
        headers: {
          Authorization: `Bearer ${partnerToken}`
        }
      });
    } catch (error) {
      console.error('Failed to register partner account:', error);
      throw this.handleError(error as AxiosError);
    }
  }

  async authenticate(code: string): Promise<TeslaAuthResponse> {
    try {
      const response = await axios.post<TeslaAuthResponse>(`${TESLA_AUTH_BASE}/oauth2/v3/token`, {
        grant_type: 'authorization_code',
        client_id: ENV.TESLA_CLIENT_ID,
        client_secret: ENV.TESLA_CLIENT_SECRET,
        code,
        redirect_uri: ENV.TESLA_REDIRECT_URI
      });

      this.accessToken = response.data.access_token;
      this.refreshToken = response.data.refresh_token;
      this.tokenExpiry = Date.now() + (response.data.expires_in * 1000);

      return response.data;
    } catch (error) {
      console.error('Tesla authentication failed:', error);
      throw this.handleError(error as AxiosError);
    }
  }

  async refreshAccessToken(): Promise<void> {
    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await axios.post<TeslaAuthResponse>(`${TESLA_AUTH_BASE}/oauth2/v3/token`, {
        grant_type: 'refresh_token',
        client_id: ENV.TESLA_CLIENT_ID,
        client_secret: ENV.TESLA_CLIENT_SECRET,
        refresh_token: this.refreshToken
      });

      this.accessToken = response.data.access_token;
      this.refreshToken = response.data.refresh_token;
      this.tokenExpiry = Date.now() + (response.data.expires_in * 1000);
    } catch (error) {
      console.error('Token refresh failed:', error);
      // Clear tokens on refresh failure
      this.accessToken = null;
      this.refreshToken = null;
      this.tokenExpiry = null;
      throw this.handleError(error as AxiosError);
    }
  }

  async getVehicles(): Promise<TeslaVehicle[]> {
    if (!this.accessToken) {
      throw new Error('Not authenticated');
    }

    if (this.isTokenExpired()) {
      await this.refreshAccessToken();
    }

    try {
      const response = await axios.get(`${TESLA_API_BASE}/api/1/vehicles`, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`
        }
      });

      return response.data.response;
    } catch (error) {
      console.error('Failed to fetch vehicles:', error);
      throw this.handleError(error as AxiosError);
    }
  }

  private handleError(error: AxiosError): Error {
    if (error.response?.data) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      const data = error.response.data as any;
      if (typeof data === 'string') {
        return new Error(data);
      }
      // Handle both error_description and message fields, with proper type checking
      if (typeof data === 'object') {
        const errorMessage = data.error_description || data.message || JSON.stringify(data);
        return new Error(errorMessage);
      }
      return new Error('API request failed with unknown error format');
    } else if (error.request) {
      // The request was made but no response was received
      return new Error('No response from Tesla API');
    } else {
      // Something happened in setting up the request that triggered an Error
      return new Error(error.message || 'Unknown error occurred');
    }
  }
}
