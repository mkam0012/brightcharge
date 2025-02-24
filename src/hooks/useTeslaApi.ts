import { useState } from 'react';
import { TeslaApiService, VehicleData } from '../services/teslaApi';

interface UseTeslaApiState {
  isAuthenticated: boolean;
  isLoading: boolean;
  vehicles: VehicleData[];
  error: Error | null;
}

export function useTeslaApi() {
  const [state, setState] = useState<UseTeslaApiState>({
    isAuthenticated: false,
    isLoading: true,
    vehicles: [],
    error: null,
  });

  const [teslaApi] = useState(() => new TeslaApiService());

  // Handle OAuth callback
  const handleAuthCallback = async (code: string) => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      await teslaApi.getTokensFromCode(code);
      const vehicles = await teslaApi.getVehicles();
      setState({
        isAuthenticated: true,
        isLoading: false,
        vehicles,
        error: null,
      });
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error as Error,
      }));
    }
  };

  // Smart charging control based on solar production
  const manageCharging = async (
    vehicleId: string,
    solarProduction: number,
    batteryLevel: number
  ) => {
    try {
      const vehicle = await teslaApi.getVehicleData(vehicleId);
      
      // Example logic for solar-based charging
      if (solarProduction > 2000 && batteryLevel < 90) { // 2kW threshold
        if (vehicle.charge_state.charging_state !== 'Charging') {
          await teslaApi.startCharging(vehicleId);
          
          // Adjust charging amps based on solar production
          const chargingAmps = Math.floor(solarProduction / 240); // Assuming 240V
          await teslaApi.setChargingAmps(vehicleId, chargingAmps);
        }
      } else if (solarProduction < 1500 && vehicle.charge_state.charging_state === 'Charging') {
        await teslaApi.stopCharging(vehicleId);
      }
    } catch (error) {
      console.error('Error managing charging:', error);
      throw error;
    }
  };

  return {
    ...state,
    teslaApi,
    handleAuthCallback,
    manageCharging,
    getAuthUrl: () => teslaApi.getAuthUrl(),
  };
}
