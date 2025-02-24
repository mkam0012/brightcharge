import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTeslaApi } from '../hooks/useTeslaApi';
import { Car, AlertCircle, Loader } from 'lucide-react';

export function TeslaAuth() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const code = searchParams.get('code');
  const stateParam = searchParams.get('state');

  const { handleAuthCallback } = useTeslaApi();

  useEffect(() => {
    async function handleTeslaAuth() {
      if (!code) return;

      try {
        await handleAuthCallback(code);
        navigate('/', { replace: true });
      } catch (err) {
        console.error('Tesla authentication failed:', err);
        setError(err instanceof Error ? err.message : 'Authentication failed');
      }
    }

    handleTeslaAuth();
  }, [code, navigate, handleAuthCallback]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-yellow-50">
        <div className="bg-white p-8 rounded-xl shadow-md max-w-md w-full">
          <div className="flex flex-col items-center text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Authentication Failed</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => navigate('/settings')}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              Return to Settings
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-yellow-50">
      <div className="bg-white p-8 rounded-xl shadow-md max-w-md w-full">
        <div className="flex flex-col items-center text-center">
          <div className="relative">
            <Car className="h-12 w-12 text-green-500 mb-4" />
            <Loader className="h-12 w-12 text-green-500 absolute top-0 left-0 animate-spin" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Connecting to Tesla</h2>
          <p className="text-gray-600">Please wait while we connect your Tesla account...</p>
        </div>
      </div>
    </div>
  );
}
