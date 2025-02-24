import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTeslaApi } from '../hooks/useTeslaApi';
import { Battery, AlertCircle, Car, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';

export function VehicleStats() {
  const { teslaApi, isAuthenticated } = useTeslaApi();
  const { data: vehicles, isLoading, error, isError } = useQuery({
    queryKey: ['vehicles'],
    queryFn: () => teslaApi.getVehicles(),
    retry: 1,
    enabled: isAuthenticated,
  });

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6 animate-pulse">
        <div className="h-20 bg-gray-200 rounded"></div>
      </div>
    );
  }

  if (isError) {
    const errorMessage = (error as Error)?.message;
    const isAuthError = errorMessage === 'Not authenticated';

    return (
      <div className="bg-white rounded-xl shadow-md p-8">
        <div className="flex flex-col items-center justify-center text-center">
          <Car className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {isAuthError ? 'No Vehicle Connected' : 'Unable to Connect to Vehicle'}
          </h3>
          <p className="text-gray-500 mb-6">
            {isAuthError 
              ? 'Connect your Tesla account to start managing your vehicle charging'
              : 'There was an error connecting to the Tesla API. Please try again.'}
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

  if (!vehicles || vehicles.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-md p-8">
        <div className="flex flex-col items-center justify-center text-center">
          <AlertCircle className="h-12 w-12 text-yellow-500 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Vehicles Found</h3>
          <p className="text-gray-500 mb-6">
            No vehicles were found in your Tesla account. Make sure your vehicle is added to your Tesla account.
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

  const vehicle = vehicles?.[0]; // Show first vehicle for now
  const batteryPercentage = vehicle?.charge_state?.battery_level;
  const isCharging = vehicle?.charge_state?.charging_state === 'Charging';

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm font-medium text-gray-600">Vehicle Status</p>
          <div className="flex items-center">
            <p className="text-2xl font-bold text-blue-600">
              {vehicle.id} {/* TODO: Add display name to vehicle data */}
            </p>
          </div>
        </div>
        <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
          <Battery className={`h-6 w-6 ${isCharging ? 'text-green-600' : 'text-blue-600'}`} />
        </div>
      </div>
      <div className="mt-2">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-500">Battery Level</span>
          <span className="text-sm font-medium text-gray-900">{batteryPercentage}%</span>
        </div>
        <div className="h-2 bg-gray-200 rounded">
          <div 
            className={`h-2 rounded transition-all duration-500 ${
              isCharging ? 'bg-green-500' : 'bg-blue-500'
            }`}
            style={{ width: `${batteryPercentage}%` }}
          ></div>
        </div>
        <p className="mt-2 text-sm text-gray-600">
          {isCharging ? 'Currently charging' : 'Not charging'}
        </p>
      </div>
    </div>
  );
}
