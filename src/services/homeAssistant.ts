import axios, { AxiosError } from 'axios';

export class HomeAssistantAPI {
  private static instance: HomeAssistantAPI;
  private baseURL: string | null = null;
  private token: string | null = null;

  private constructor() {}

  static getInstance(): HomeAssistantAPI {
    if (!HomeAssistantAPI.instance) {
      HomeAssistantAPI.instance = new HomeAssistantAPI();
    }
    return HomeAssistantAPI.instance;
  }

  updateConfig(baseURL: string, token: string) {
    this.baseURL = baseURL;
    this.token = token;
  }

  private validateConfig(): void {
    if (!this.baseURL || !this.token) {
      throw new Error('Home Assistant configuration is missing');
    }
  }

  async getSolarData() {
    try {
      this.validateConfig();
      
      const response = await axios.get(`${this.baseURL}/api/states`, {
        headers: {
          Authorization: `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        timeout: 5000 // 5 second timeout
      });

      // Filter for solar-related entities
      return response.data.filter((entity: any) => 
        entity.entity_id.startsWith('sensor.solar_power') || 
        entity.entity_id.startsWith('sensor.grid_power')
      );
    } catch (error) {
      if ((error as AxiosError).code === 'ECONNABORTED') {
        throw new Error('Connection timeout');
      }
      if ((error as AxiosError).response?.status === 401) {
        throw new Error('Invalid authentication token');
      }
      throw error;
    }
  }
}