import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Sun, LineChart, Menu } from 'lucide-react';
import { SolarStats } from './components/SolarStats';
import { VehicleStats } from './components/VehicleStats';
import { Settings } from './components/Settings';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-yellow-50">
          {/* Navigation */}
          <nav className="bg-white shadow-md">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between h-16">
                <div className="flex items-center">
                  <Link to="/" className="flex items-center">
                    <div className="relative w-8 h-8">
                      <Sun className="absolute inset-0 text-orange-400" strokeWidth={1.5} fill="orange" />
                    </div>
                    <span className="ml-2 text-xl font-bold text-green-700">BrightCharge</span>
                  </Link>
                </div>
                <div className="hidden md:flex items-center space-x-4">
                  <Link to="/" className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-green-600">
                    Dashboard
                  </Link>
                  <Link to="/vehicles" className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-green-600">
                    Vehicles
                  </Link>
                  <Link to="/analytics" className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-green-600">
                    Analytics
                  </Link>
                  <Link to="/settings" className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-green-600">
                    Settings
                  </Link>
                </div>
                <div className="md:hidden flex items-center">
                  <Menu className="h-6 w-6 text-gray-700" />
                </div>
              </div>
            </div>
          </nav>
          
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Routes>
              <Route path="/settings" element={<Settings />} />
              <Route path="/" element={
                <div className="space-y-8">
                  {/* Hero Section */}
                  <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-green-800 mb-4">
                      Smart EV Charging Dashboard
                    </h1>
                    <p className="text-xl text-gray-600">
                      Optimize your charging with solar power
                    </p>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                      <SolarStats />
                    </div>
                    <div className="lg:col-span-1">
                      <VehicleStats />
                    </div>
                  </div>

                  {/* Energy Savings */}
                  <div className="bg-white rounded-xl shadow-md p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Energy Savings</p>
                        <p className="text-2xl font-bold text-green-600">$127.50</p>
                      </div>
                      <LineChart className="h-8 w-8 text-green-500" />
                    </div>
                    <p className="mt-2 text-sm text-green-500">↑ 12% this month</p>
                  </div>

                  {/* Solar Production Chart Placeholder */}
                  <div className="bg-white rounded-xl shadow-md p-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Solar Production</h2>
                    <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                      <p className="text-gray-500">Solar production chart will be displayed here</p>
                    </div>
                  </div>
                </div>
              } />
            </Routes>
          </main>

          {/* Footer */}
          <footer className="bg-white border-t mt-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <div className="flex justify-between items-center">
                <p className="text-gray-500 text-sm">© 2025 BrightCharge. All rights reserved.</p>
                <div className="flex space-x-6">
                  <a href="#" className="text-gray-500 hover:text-green-600 text-sm">Privacy Policy</a>
                  <a href="#" className="text-gray-500 hover:text-green-600 text-sm">Terms of Service</a>
                  <a href="#" className="text-gray-500 hover:text-green-600 text-sm">Contact</a>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </Router>
    </QueryClientProvider>
  );
}

export default App;