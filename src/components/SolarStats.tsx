import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { HomeAssistantAPI } from '../services/homeAssistant';
import { Zap, Power, ArrowDown, ArrowUp, AlertCircle, WifiOff, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';

export function SolarStats() {
  const { data: solarData, isLoading, error, isError } = useQuery({
    queryKey: ['solarData'],
    queryFn: () => HomeAssistantAPI.getInstance().getSolarData(),
    refetchInterval: 30000, // Refresh every 30 seconds
    retry: 2, // Retry failed requests twice
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2].map((i) => (
          <div key={i} className="bg-white rounded-xl shadow-md p-6 animate-pulse">
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    const errorMessage = (error as Error)?.message;
    const isConfigMissing = errorMessage === 'Home Assistant configuration is missing';

    return (
      <div className="bg-white rounded-xl shadow-md p-8">
        <div className="flex flex-col items-center justify-center text-center">
          <Power className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {isConfigMissing ? 'Solar Inverter Not Connected' : 'Unable to Connect to Solar Inverter'}
          </h3>
          <p className="text-gray-500 mb-6">
            {isConfigMissing 
              ? 'Connect your Home Assistant to start monitoring your solar production'
              : 'There was an error connecting to Home Assistant. Please check your configuration.'}
          </p>
          <Link
            to="/settings"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            <Settings className="h-4 w-4 mr-2" />
            Go to Settings
          </Link>
        </div>
      </div>
    );
  }

  if (!solarData || solarData.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-md p-8">
        <div className="flex flex-col items-center justify-center text-center">
          <AlertCircle className="h-12 w-12 text-yellow-500 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Solar Data Available</h3>
          <p className="text-gray-500 mb-6">
            Unable to find solar power sensors in Home Assistant
          </p>
          <Link
            to="/settings"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            <Settings className="h-4 w-4 mr-2" />
            Check Settings
          </Link>
        </div>
      </div>
    );
  }

  const solarProduction = solarData.find((entity: any) => 
    entity.entity_id === 'sensor.solar_power'
  )?.state;

  const gridPower = solarData.find((entity: any) => 
    entity.entity_id === 'sensor.grid_power'
  )?.state;

  // If either value is missing, show error
  if (!solarProduction || !gridPower) {
    return (
      <div className="bg-white rounded-xl shadow-md p-8">
        <div className="flex flex-col items-center justify-center text-center">
          <AlertCircle className="h-12 w-12 text-yellow-500 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Solar Sensors Not Found</h3>
          <p className="text-gray-500 mb-6">
            Could not find sensor.solar_power or sensor.grid_power in Home Assistant
          </p>
          <Link
            to="/settings"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            <Settings className="h-4 w-4 mr-2" />
            Check Settings
          </Link>
        </div>
      </div>
    );
  }

  const solarValue = parseFloat(solarProduction);
  const gridValue = parseFloat(gridPower);
  const isExporting = gridValue < 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-medium text-gray-600">Solar Production</p>
            <div className="flex items-center">
              <p className="text-2xl font-bold text-green-600">{Math.abs(solarValue).toFixed(1)} kW</p>
              <Zap className="h-5 w-5 text-yellow-500 ml-2" />
            </div>
          </div>
          <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
            <Power className="h-6 w-6 text-green-600" />
          </div>
        </div>
        <div className="mt-2">
          <div className="h-2 bg-gray-200 rounded">
            <div 
              className="h-2 bg-green-500 rounded transition-all duration-500" 
              style={{ width: `${Math.min((solarValue / 5) * 100, 100)}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-500 mt-1">Max capacity: 5 kW</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-medium text-gray-600">Grid Power</p>
            <div className="flex items-center">
              <p className="text-2xl font-bold text-blue-600">
                {Math.abs(gridValue).toFixed(1)} kW
              </p>
              {isExporting ? (
                <ArrowUp className="h-5 w-5 text-green-500 ml-2" />
              ) : (
                <ArrowDown className="h-5 w-5 text-orange-500 ml-2" />
              )}
            </div>
          </div>
          <div className={`h-12 w-12 rounded-full flex items-center justify-center ${
            isExporting ? 'bg-green-100' : 'bg-orange-100'
          }`}>
            <Power className={`h-6 w-6 ${
              isExporting ? 'text-green-600' : 'text-orange-600'
            }`} />
          </div>
        </div>
        <p className={`text-sm ${
          isExporting ? 'text-green-600' : 'text-orange-600'
        }`}>
          {isExporting ? 'Exporting to grid' : 'Importing from grid'}
        </p>
      </div>
    </div>
  );
}