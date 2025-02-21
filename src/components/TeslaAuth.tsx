import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { TeslaAPI } from '../services/tesla';
import { Car, AlertCircle } from 'lucide-react';

export function TeslaAuth() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const code = searchParams.get('code');
  const error = searchParams.get('error_description');

  useEffect(() => {
    async function handleTeslaAuth() {
      if (code) {
        try {
          await TeslaAPI.getInstance().authenticate(code);
          // Redirect to dashboard after successful authentication
          navigate('/', { replace: true });
        } catch (error) {
          console.error('Tesla authentication failed:', error);
          // Stay on the auth page but display the error
        }
      }
    }

    handleTeslaAuth();
  }, [code, navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-yellow-50">
        <div className="bg-white p-8 rounded-xl shadow-md max-w-md w-full">
          <div className="flex flex-col items-center text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Authentication Failed</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!code) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-yellow-50">
        <div className="bg-white p-8 rounded-xl shadow-md max-w-md w-full">
          <div className="flex flex-col items-center text-center">
            <Car className="h-12 w-12 text-green-500 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Connect Your Tesla</h2>
            <p className="text-gray-600 mb-6">
              Click below to connect your Tesla account and enable smart charging features.
            </p>
            <a
              href={`https://auth.tesla.com/oauth2/v3/authorize?client_id=${
                import.meta.env.VITE_TESLA_CLIENT_ID
              }&redirect_uri=${encodeURIComponent(
                import.meta.env.VITE_TESLA_REDIRECT_URI
              )}&response_type=code&scope=openid offline_access vehicle_device_data vehicle_cmds vehicle_charging_cmds`}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              Connect Tesla Account
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-yellow-50">
      <div className="bg-white p-8 rounded-xl shadow-md max-w-md w-full">
        <div className="flex flex-col items-center text-center">
          <Car className="h-12 w-12 text-green-500 mb-4 animate-pulse" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Connecting to Tesla</h2>
          <p className="text-gray-600">Please wait while we connect your Tesla account...</p>
        </div>
      </div>
    </div>
  );
}