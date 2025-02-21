import React, { useState, useEffect } from 'react';
import { Home, ExternalLink, Settings as SettingsIcon, X, CheckCircle, Pencil, Car } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { HomeAssistantAPI } from '../services/homeAssistant';
import { TeslaAPI } from '../services/tesla';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useNavigate } from 'react-router-dom';

export function Settings() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [hassUrl, setHassUrl] = useLocalStorage('HASS_URL', '');
  const [hassToken, setHassToken] = useLocalStorage('HASS_TOKEN', '');
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [testError, setTestError] = useState<string | null>(null);
  const [testSuccess, setTestSuccess] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [lastTestedUrl, setLastTestedUrl] = useState('');
  const [teslaError, setTeslaError] = useState<string | null>(null);

  // Check initial connection status
  useEffect(() => {
    if (hassUrl && hassToken) {
      HomeAssistantAPI.getInstance().updateConfig(hassUrl, hassToken);
      testConnection().then(() => {
        setTestSuccess(true);
        setLastTestedUrl(hassUrl);
      }).catch(() => {
        setTestSuccess(false);
      });
    }
  }, []);

  // Update HomeAssistantAPI config when URL or token changes
  useEffect(() => {
    if (hassUrl && hassToken) {
      HomeAssistantAPI.getInstance().updateConfig(hassUrl, hassToken);
      // Reset success state if URL changes from last tested
      if (hassUrl !== lastTestedUrl) {
        setTestSuccess(false);
      }
    }
  }, [hassUrl, hassToken, lastTestedUrl]);

  const { refetch: testConnection } = useQuery({
    queryKey: ['testHassConnection'],
    queryFn: async () => {
      try {
        const api = HomeAssistantAPI.getInstance();
        const data = await api.getSolarData();
        return data;
      } catch (error) {
        throw error;
      }
    },
    enabled: false, // Don't run automatically
    retry: 1, // Only retry once
  });

  const handleTestConnection = async () => {
    if (!hassUrl || !hassToken) {
      setTestError('Please fill in both URL and token fields');
      return;
    }

    setIsTestingConnection(true);
    setTestError(null);
    setTestSuccess(false);

    try {
      await testConnection();
      setTestSuccess(true);
      setLastTestedUrl(hassUrl);
      setIsExpanded(false); // Collapse the card on successful connection
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['solarData'] });
      // Navigate to dashboard after successful connection
      setTimeout(() => {
        navigate('/');
      }, 1500);
    } catch (error) {
      setTestError((error as Error).message);
      console.error('Connection test failed:', error);
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value.trim();
    setHassUrl(newUrl);
    // Reset success state if URL changes
    if (newUrl !== lastTestedUrl) {
      setTestSuccess(false);
      setTestError(null);
    }
  };

  const handleTokenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHassToken(e.target.value.trim());
    setTestSuccess(false);
    setTestError(null);
  };

  const generateRandomState = () => {
    const array = new Uint32Array(2);
    crypto.getRandomValues(array);
    return Array.from(array, dec => dec.toString(16)).join('');
  };

  const handleTeslaConnect = async () => {
    setTeslaError(null);
    try {
      // First get partner token and register
      const teslaApi = TeslaAPI.getInstance();
      await teslaApi.getPartnerToken();
      await teslaApi.registerPartnerAccount();

      // Then proceed with OAuth flow
      const teslaAuthUrl = `https://auth.tesla.com/oauth2/v3/authorize?client_id=${
        import.meta.env.VITE_TESLA_CLIENT_ID
      }&redirect_uri=${encodeURIComponent(
        import.meta.env.VITE_TESLA_REDIRECT_URI
      )}&response_type=code&scope=openid%20offline_access%20vehicle_device_data%20vehicle_cmds%20vehicle_charging_cmds&state=${generateRandomState()}`;
      
      window.location.href = teslaAuthUrl;
    } catch (error) {
      console.error('Failed to initialize Tesla connection:', error);
      setTeslaError(error instanceof Error ? error.message : 'Failed to initialize Tesla connection');
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <SettingsIcon className="h-6 w-6 text-gray-400" />
      </div>

      <div className="space-y-6">
        {/* Home Assistant Configuration */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div 
            className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Home className="h-6 w-6 text-blue-500" />
                <h2 className="text-lg font-semibold text-gray-900">Home Assistant Connection</h2>
                {testSuccess ? (
                  <div className="flex items-center space-x-1 text-green-600">
                    <CheckCircle className="h-5 w-5" />
                    <span className="text-sm">Connected</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-1 text-red-500">
                    <X className="h-5 w-5" />
                    <span className="text-sm">Not connected</span>
                  </div>
                )}
              </div>
              <Pencil 
                className="h-4 w-4 text-gray-400 hover:text-gray-600"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded(true);
                }}
              />
            </div>
            {testSuccess && !isExpanded && (
              <p className="mt-2 text-sm text-gray-500">
                Connected to: {lastTestedUrl}
              </p>
            )}
          </div>

          {isExpanded && (
            <div className="px-6 pb-6 space-y-4">
              <div>
                <label htmlFor="hassUrl" className="block text-sm font-medium text-gray-700">
                  Home Assistant URL
                </label>
                <div className="mt-1">
                  <input
                    type="url"
                    id="hassUrl"
                    className="shadow-sm focus:ring-green-500 focus:border-green-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    placeholder="https://your-instance.nabu.casa"
                    value={hassUrl}
                    onChange={handleUrlChange}
                  />
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  Your Home Assistant URL (e.g., Nabu Casa URL)
                </p>
              </div>

              <div>
                <label htmlFor="hassToken" className="block text-sm font-medium text-gray-700">
                  Long-Lived Access Token
                </label>
                <div className="mt-1">
                  <input
                    type="password"
                    id="hassToken"
                    className="shadow-sm focus:ring-green-500 focus:border-green-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    value={hassToken}
                    onChange={handleTokenChange}
                  />
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  Generate a long-lived access token in Home Assistant under your profile
                </p>
              </div>

              {testError && (
                <div className="rounded-md bg-red-50 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <X className="h-5 w-5 text-red-400" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">Connection Error</h3>
                      <p className="text-sm text-red-700 mt-1">{testError}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-3">
                <a
                  href="https://www.home-assistant.io/docs/authentication/#your-account-profile"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  How to get a token
                  <ExternalLink className="ml-2 h-4 w-4" />
                </a>
                <button
                  onClick={handleTestConnection}
                  disabled={isTestingConnection}
                  className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ${
                    isTestingConnection ? 'opacity-75 cursor-not-allowed' : ''
                  }`}
                >
                  {isTestingConnection ? 'Testing...' : 'Test Connection'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Tesla Integration */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Car className="h-6 w-6 text-blue-500" />
                <h2 className="text-lg font-semibold text-gray-900">Tesla Integration</h2>
              </div>
            </div>
            <p className="mt-2 text-sm text-gray-500">
              Connect your Tesla account to enable smart charging features
            </p>
            <div className="mt-4 space-y-4">
              {teslaError && (
                <div className="rounded-md bg-red-50 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <X className="h-5 w-5 text-red-400" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">Connection Error</h3>
                      <p className="text-sm text-red-700 mt-1">{teslaError}</p>
                    </div>
                  </div>
                </div>
              )}
              <button
                onClick={handleTeslaConnect}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Car className="h-4 w-4 mr-2" />
                Connect Tesla Account
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
