export interface TeslaAuthResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

export interface TeslaVehicle {
  id: string;
  vehicle_id: number;
  vin: string;
  display_name: string;
  state: string;
  battery_level: number;
  charging_state: string;
}