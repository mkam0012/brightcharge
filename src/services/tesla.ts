import axios from 'axios';
import { ENV } from '../config/environment';
import type { TeslaAuthResponse, TeslaVehicle } from '../types/tesla';

const TESLA_API_BASE = 'https://fleet-api.prd.na.vn.cloud.tesla.com';

export class TeslaAPI {
  private static instance: TeslaAPI;
  private accessToken: string | null = null;

  private constructor() {}

  static getInstance(): TeslaAPI {
    if (!TeslaAPI.instance) {
      TeslaAPI.instance = new TeslaAPI();
    }
    return TeslaAPI.instance;
  }

  async authenticate(code: string): Promise<TeslaAuthResponse> {
    const response = await axios.post(`${TESLA_API_BASE}/oauth2/v3/token`, {
      grant_type: 'authorization_code',
      client_id: ENV.TESLA_CLIENT_ID,
      client_secret: ENV.TESLA_CLIENT_SECRET,
      code,
      redirect_uri: ENV.TESLA_REDIRECT_URI
    });

    this.accessToken = response.data.access_token;
    return response.data;
  }

  async getVehicles(): Promise<TeslaVehicle[]> {
    if (!this.accessToken) throw new Error('Not authenticated');

    const response = await axios.get(`${TESLA_API_BASE}/api/1/vehicles`, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`
      }
    });

    return response.data.response;
  }
}