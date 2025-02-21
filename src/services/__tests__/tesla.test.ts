import { describe, it, expect, beforeEach, vi } from 'vitest';
import axios, { AxiosError } from 'axios';
import { TeslaAPI } from '../tesla';
import { ENV } from '../../config/environment';
import type { TeslaAuthResponse, TeslaVehicle } from '../../types/tesla';

// Mock axios
vi.mock('axios');

// Create a properly typed mock using Vitest's types
const mockedAxios = vi.mocked(axios, true);

describe('TeslaAPI', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
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
        'https://fleet-api.prd.na.vn.cloud.tesla.com/oauth2/v3/token',
        {
          grant_type: 'authorization_code',
          client_id: ENV.TESLA_CLIENT_ID,
          client_secret: ENV.TESLA_CLIENT_SECRET,
          code: mockCode,
          redirect_uri: ENV.TESLA_REDIRECT_URI
        }
      );

      expect(response).toEqual(mockAuthResponse);
    });

    it('should throw error on authentication failure', async () => {
      const mockError = new AxiosError('Invalid authorization code');
      mockedAxios.post.mockRejectedValueOnce(mockError);

      const api = TeslaAPI.getInstance();
      await expect(api.authenticate(mockCode)).rejects.toThrow();
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
            Authorization: 'Bearer test_token'
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
        'https://fleet-api.prd.na.vn.cloud.tesla.com/oauth2/v3/token',
        {
          grant_type: 'refresh_token',
          client_id: ENV.TESLA_CLIENT_ID,
          client_secret: ENV.TESLA_CLIENT_SECRET,
          refresh_token: 'refresh_token'
        }
      );
    });

    it('should handle API errors gracefully', async () => {
      const mockError = new AxiosError(
        'API request failed',
        'ERROR',
        undefined,
        undefined,
        {
          status: 400,
          data: { error_description: 'Invalid request' }
        } as any
      );
      mockedAxios.get.mockRejectedValueOnce(mockError);

      const api = TeslaAPI.getInstance();
      (api as any).accessToken = 'test_token';
      (api as any).tokenExpiry = Date.now() + 3600000; // Set expiry to 1 hour from now

      await expect(api.getVehicles()).rejects.toThrow();
    });
  });
});