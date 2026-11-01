import React from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import { useSocket } from '../context/SocketContext.jsx';
import LiveStatusBadge from './LiveStatusBadge.jsx';
import {
  Car,
  Moon,
  Sun,
  Bell,
  Activity,
  Layers,
  MapPin,
  UserCheck,
  LogOut,
  Cpu
} from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, onOpenNotifications }) {
  const { user, logout, switchDemoRole, isAuthenticated } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { unreadCount } = useSocket();

  return (
    <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-cyan-500 text-white shadow-md shadow-sky-500/20">
              <Car className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-sky-600 to-cyan-600 bg-clip-text text-transparent dark:from-sky-400 dark:to-cyan-400">
                  AutoNear
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300">
                  Fog & Edge
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
                Geospatial Discovery & Real-Time Booking
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center space-x-1 sm:space-x-2">
            <button
              onClick={() => setActiveTab('explore')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'explore'
                  ? 'bg-sky-500 text-white shadow-sm shadow-sky-500/25'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <MapPin className="w-4 h-4" />
              <span>Explore Garages</span>
            </button>

            <button
              onClick={() => setActiveTab('benchmark')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'benchmark'
                  ? 'bg-sky-500 text-white shadow-sm shadow-sky-500/25'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>Fog vs Edge Benchmark</span>
            </button>

            <button
              onClick={() => setActiveTab('architecture')}
              className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'architecture'
                  ? 'bg-sky-500 text-white shadow-sm shadow-sky-500/25'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Cpu className="w-4 h-4" />
              <span>Architecture</span>
            </button>
          </nav>

          {/* Right Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Live Socket/Polling Status Badge */}
            <LiveStatusBadge />

            {/* Notification Bell */}
            <button
              onClick={onOpenNotifications}
              className="relative p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="View notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 flex items-center justify-center min-w-[16px] h-4 px-1 text-[10px] font-bold text-white bg-rose-500 rounded-full animate-bounce">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Toggle theme"
            >
              {isDark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-600" />}
            </button>

            {/* Demo User Switcher */}
            <div className="hidden lg:flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg text-xs">
              <span className="text-slate-400 px-1 font-medium">Demo:</span>
              <button
                onClick={() => switchDemoRole('customer')}
                className={`px-2 py-0.5 rounded font-medium transition-colors ${
                  user?.role === 'customer'
                    ? 'bg-white dark:bg-slate-700 shadow-xs text-sky-600 dark:text-sky-400'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Customer
              </button>
              <button
                onClick={() => switchDemoRole('owner')}
                className={`px-2 py-0.5 rounded font-medium transition-colors ${
                  user?.role === 'garage_owner'
                    ? 'bg-white dark:bg-slate-700 shadow-xs text-sky-600 dark:text-sky-400'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Owner
              </button>
              <button
                onClick={() => switchDemoRole('admin')}
                className={`px-2 py-0.5 rounded font-medium transition-colors ${
                  user?.role === 'admin'
                    ? 'bg-white dark:bg-slate-700 shadow-xs text-sky-600 dark:text-sky-400'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Admin
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

