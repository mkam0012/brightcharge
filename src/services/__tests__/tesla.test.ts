import { describe, it, expect, beforeEach, vi } from 'vitest';
import axios, { AxiosError } from 'axios';
import { TeslaAPI } from '../tesla';
import { ENV } from '../../config/environment';
import type { TeslaAuthResponse, TeslaVehicle } from '../../types/tesla';

// Mock axios and environment variables
vi.mock('axios');
vi.mock('../../config/environment', () => ({
  ENV: {
    TESLA_CLIENT_ID: 'test_client_id',
    TESLA_CLIENT_SECRET: 'test_client_secret',
    TESLA_REDIRECT_URI: 'https://test.example.com/callback'
  }
}));

// Create a properly typed mock using Vitest's types
const mockedAxios = vi.mocked(axios, true);

describe('TeslaAPI', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
    // Reset the singleton instance
    (TeslaAPI as any).instance = undefined;
  });

  describe('getPartnerToken', () => {
    const mockPartnerResponse = {
      access_token: 'partner_token',
      token_type: 'Bearer',
      expires_in: 3600
    };

    it('should get partner token successfully', async () => {
      mockedAxios.post.mockResolvedValueOnce({ data: mockPartnerResponse });

      const api = TeslaAPI.getInstance();
      const token = await api.getPartnerToken();

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://fleet-auth.prd.vn.cloud.tesla.com/oauth2/v3/token',
        {
          grant_type: 'client_credentials',
          client_id: ENV.TESLA_CLIENT_ID,
          client_secret: ENV.TESLA_CLIENT_SECRET,
          audience: 'https://fleet-api.prd.na.vn.cloud.tesla.com',
          scope: 'openid user_data vehicle_device_data vehicle_cmds vehicle_charging_cmds'
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      expect(token).toBe(mockPartnerResponse.access_token);
    });

    it('should reuse existing partner token if available', async () => {
      mockedAxios.post.mockResolvedValueOnce({ data: mockPartnerResponse });

      const api = TeslaAPI.getInstance();
      const token1 = await api.getPartnerToken();
      const token2 = await api.getPartnerToken();

      expect(mockedAxios.post).toHaveBeenCalledTimes(1);
      expect(token1).toBe(token2);
    });

    it('should throw error on partner token failure', async () => {
      const mockError = new AxiosError();
      mockError.response = {
        status: 400,
        data: { error_description: 'Invalid client credentials' },
        statusText: 'Bad Request',
        headers: {},
        config: {} as any
      };
      mockedAxios.post.mockRejectedValueOnce(mockError);

      const api = TeslaAPI.getInstance();
      await expect(api.getPartnerToken()).rejects.toThrow('Invalid client credentials');
    });
  });

  describe('registerPartnerAccount', () => {
    const mockPartnerResponse = {
      access_token: 'partner_token',
      token_type: 'Bearer',
      expires_in: 3600
    };

    it('should register partner account successfully', async () => {
      mockedAxios.post
        .mockResolvedValueOnce({ data: mockPartnerResponse }) // For getPartnerToken
        .mockResolvedValueOnce({}); // For registerPartnerAccount

      const api = TeslaAPI.getInstance();
      await api.registerPartnerAccount();

      expect(mockedAxios.post).toHaveBeenCalledTimes(2);
      expect(mockedAxios.post).toHaveBeenLastCalledWith(
        'https://fleet-api.prd.na.vn.cloud.tesla.com/api/1/partner_accounts',
        {},
        {
          headers: {
            Authorization: `Bearer ${mockPartnerResponse.access_token}`,
            'Content-Type': 'application/json'
          }
        }
      );
    });

    it('should throw error on registration failure', async () => {
      const mockError = new AxiosError();
      mockError.response = {
        status: 400,
        data: { error_description: 'Registration failed' },
        statusText: 'Bad Request',
        headers: {},
        config: {} as any
      };
      
      mockedAxios.post
        .mockResolvedValueOnce({ data: mockPartnerResponse }) // For getPartnerToken
        .mockRejectedValueOnce(mockError);

      const api = TeslaAPI.getInstance();
      await expect(api.registerPartnerAccount()).rejects.toThrow('Registration failed');
    });
  });

  describe('authenticate', () => {
    const mockCode = 'test_auth_code';
    const mockAuthResponse: TeslaAuthResponse = {
      access_token: 'test_access_token',
      refresh_token: 'test_refresh_token',
      expires_in: 3600,
      token_type: 'Bearer'
    };

    it('should authenticate successfully with valid code', async () => {
      mockedAxios.post.mockResolvedValueOnce({ data: mockAuthResponse });

      const api = TeslaAPI.getInstance();
      const response = await api.authenticate(mockCode);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://fleet-auth.prd.vn.cloud.tesla.com/oauth2/v3/token',
        {
          grant_type: 'authorization_code',
          client_id: ENV.TESLA_CLIENT_ID,
          client_secret: ENV.TESLA_CLIENT_SECRET,
          code: mockCode,
          redirect_uri: ENV.TESLA_REDIRECT_URI
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      expect(response).toEqual(mockAuthResponse);
    });

    it('should throw error on authentication failure', async () => {
      const mockError = new AxiosError();
      mockError.response = {
        status: 400,
        data: { error_description: 'Invalid authorization code' },
        statusText: 'Bad Request',
        headers: {},
        config: {} as any
      };
      mockedAxios.post.mockRejectedValueOnce(mockError);

      const api = TeslaAPI.getInstance();
      await expect(api.authenticate(mockCode)).rejects.toThrow('Invalid authorization code');
    });
  });

  describe('getVehicles', () => {
    const mockVehicles: TeslaVehicle[] = [
      {
        id: '12345',
        vehicle_id: 98765,
        vin: 'TEST123456789',
        display_name: 'Test Model 3',
        state: 'online',
        battery_level: 75,
        charging_state: 'Charging'
      }
    ];

    it('should fetch vehicles when authenticated', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: { response: mockVehicles } });

      const api = TeslaAPI.getInstance();
      // Manually set access token for testing
      (api as any).accessToken = 'test_token';
      (api as any).tokenExpiry = Date.now() + 3600000; // Set expiry to 1 hour from now

      const vehicles = await api.getVehicles();

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://fleet-api.prd.na.vn.cloud.tesla.com/api/1/vehicles',
        {
          headers: {
            Authorization: 'Bearer test_token',
            'Content-Type': 'application/json'
          }
        }
      );

      expect(vehicles).toEqual(mockVehicles);
    });

    it('should throw error when not authenticated', async () => {
      const api = TeslaAPI.getInstance();
      // Ensure no access token is set
      (api as any).accessToken = null;

      await expect(api.getVehicles()).rejects.toThrow('Not authenticated');
    });

    it('should attempt to refresh token when expired', async () => {
      const api = TeslaAPI.getInstance();
      // Set expired token
      (api as any).accessToken = 'expired_token';
      (api as any).refreshToken = 'refresh_token';
      (api as any).tokenExpiry = Date.now() - 1000; // Set expiry to the past

      const mockRefreshResponse: TeslaAuthResponse = {
        access_token: 'new_token',
        refresh_token: 'new_refresh_token',
        expires_in: 3600,
        token_type: 'Bearer'
      };

      mockedAxios.post.mockResolvedValueOnce({ data: mockRefreshResponse });
      mockedAxios.get.mockResolvedValueOnce({ data: { response: mockVehicles } });

      await api.getVehicles();

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://fleet-auth.prd.vn.cloud.tesla.com/oauth2/v3/token',
        {
          grant_type: 'refresh_token',
          client_id: ENV.TESLA_CLIENT_ID,
          client_secret: ENV.TESLA_CLIENT_SECRET,
          refresh_token: 'refresh_token'
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    });

    it('should handle API errors gracefully', async () => {
      const mockError = new AxiosError();
      mockError.response = {
        status: 400,
        data: { error_description: 'Invalid request' },
        statusText: 'Bad Request',
        headers: {},
        config: {} as any
      };
      mockedAxios.get.mockRejectedValueOnce(mockError);

      const api = TeslaAPI.getInstance();
      (api as any).accessToken = 'test_token';
      (api as any).tokenExpiry = Date.now() + 3600000; // Set expiry to 1 hour from now

      await expect(api.getVehicles()).rejects.toThrow();
    });
  });
});
