import axios, { AxiosInstance } from 'axios';
import { ENV } from '../config/environment';

interface TeslaAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  audience: string;
}

export interface TeslaTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

export interface VehicleData {
  id: string;
  vehicle_id: number;
  charge_state: {
    battery_level: number;
    charging_state: string;
    charge_limit_soc: number;
    charge_current_request: number;
  };
}

export class TeslaApiService {
  private api: AxiosInstance;
  private tokens: TeslaTokens | null = null;
  private static readonly TESLA_API_BASE = 'https://fleet-api.prd.na.vn.cloud.tesla.com/api/1';
  private static readonly TESLA_AUTH_BASE = 'https://auth.tesla.com/oauth2/v3';
  private static readonly DEFAULT_AUDIENCE = 'https://fleet-api.prd.na.vn.cloud.tesla.com';

  constructor() {
    this.api = axios.create({
      baseURL: TeslaApiService.TESLA_API_BASE,
    });

    // Add token interceptor
    this.api.interceptors.request.use(async (config) => {
      if (this.tokens?.access_token) {
        config.headers.Authorization = `Bearer ${this.tokens.access_token}`;
      }
      return config;
    });
  }

  // Generate OAuth authorization URL
  public getAuthUrl(): string {
    const state = crypto.randomUUID();
    const scope = 'openid vehicle_device_data vehicle_cmds vehicle_charging_commands';
    
    console.log('Tesla Client ID:', ENV.TESLA_CLIENT_ID);
    console.log('Tesla Redirect URI:', ENV.TESLA_REDIRECT_URI);
    
    const params = new URLSearchParams({
      client_id: ENV.TESLA_CLIENT_ID,
      redirect_uri: ENV.TESLA_REDIRECT_URI,
      response_type: 'code',
      scope,
      state,
      audience: TeslaApiService.DEFAULT_AUDIENCE,
    });

    return `${TeslaApiService.TESLA_AUTH_BASE}/authorize?${params.toString()}`;
  }

  // Exchange authorization code for tokens
  public async getTokensFromCode(code: string): Promise<TeslaTokens> {
    const response = await axios.post(`${TeslaApiService.TESLA_AUTH_BASE}/token`, {
      grant_type: 'authorization_code',
      client_id: ENV.TESLA_CLIENT_ID,
      client_secret: ENV.TESLA_CLIENT_SECRET,
      code,
      redirect_uri: ENV.TESLA_REDIRECT_URI,
      audience: TeslaApiService.DEFAULT_AUDIENCE,
    });

    const tokens = response.data as TeslaTokens;
    this.tokens = tokens;
    return tokens;
  }

  // Refresh access token using refresh token
  public async refreshToken(refreshToken: string): Promise<TeslaTokens> {
    const response = await axios.post(`${TeslaApiService.TESLA_AUTH_BASE}/token`, {
      grant_type: 'refresh_token',
      client_id: ENV.TESLA_CLIENT_ID,
      refresh_token: refreshToken,
    });

    const tokens = response.data as TeslaTokens;
    this.tokens = tokens;
    return tokens;
  }

  // Get list of user's vehicles
  public async getVehicles(): Promise<any[]> {
    const response = await this.api.get('/vehicles');
    return response.data;
  }

  // Get detailed vehicle data
  public async getVehicleData(vehicleId: string): Promise<VehicleData> {
    const response = await this.api.get(`/vehicles/${vehicleId}/vehicle_data`);
    return response.data;
  }

  // Start charging
  public async startCharging(vehicleId: string): Promise<void> {
    await this.api.post(`/vehicles/${vehicleId}/command/charge_start`);
  }

  // Stop charging
  public async stopCharging(vehicleId: string): Promise<void> {
    await this.api.post(`/vehicles/${vehicleId}/command/charge_stop`);
  }

  // Set charging limit
  public async setChargingLimit(vehicleId: string, limit: number): Promise<void> {
    await this.api.post(`/vehicles/${vehicleId}/command/set_charge_limit`, {
      percent: limit,
    });
  }

  // Set charging amps
  public async setChargingAmps(vehicleId: string, amps: number): Promise<void> {
    await this.api.post(`/vehicles/${vehicleId}/command/set_charging_amps`, {
      charging_amps: amps,
    });
  }
}
