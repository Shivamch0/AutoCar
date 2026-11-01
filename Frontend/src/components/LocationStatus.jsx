import React, { useState } from 'react';
import { MapPin, Navigation, AlertTriangle, RefreshCw, CheckCircle2 } from 'lucide-react';

const PRESET_CITIES = [
  { name: 'San Francisco (Downtown)', lat: 37.7749, lng: -122.4194 },
  { name: 'San Francisco (Mission)', lat: 37.7599, lng: -122.4148 },
  { name: 'Oakland (East Bay)', lat: 37.8044, lng: -122.2712 },
  { name: 'San Jose (Silicon Valley)', lat: 37.3382, lng: -121.8863 },
  { name: 'New York (Midtown)', lat: 40.7549, lng: -73.9840 },
  { name: 'London (Central)', lat: 51.5074, lng: -0.1278 }
];

export default function LocationStatus({
  locationState, // 'prompt' | 'requesting' | 'granted' | 'denied' | 'unavailable'
  userCoords,
  onDetectLocation,
  onSelectManualCoords
}) {
  const [customLat, setCustomLat] = useState('');
  const [customLng, setCustomLng] = useState('');
  const [showManualForm, setShowManualForm] = useState(false);

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    const lat = parseFloat(customLat);
    const lng = parseFloat(customLng);
    if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      onSelectManualCoords(lat, lng, 'Custom Coordinates');
      setShowManualForm(false);
    }
  };

  // State 1: Permission Not Requested Yet
  if (locationState === 'prompt') {
    return (
      <div className="bg-gradient-to-r from-sky-500/10 via-sky-500/5 to-transparent border border-sky-200 dark:border-sky-800/60 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-sky-500 text-white rounded-xl shadow-sm">
            <Navigation className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100">
              Find Garages Near Your Current Location
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              We need browser geolocation permission to calculate exact travel distances and show real-time routes.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={onDetectLocation}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
          >
            <Navigation className="w-4 h-4" />
            <span>Detect My Location</span>
          </button>
          <button
            onClick={() => setShowManualForm(!showManualForm)}
            className="px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-medium rounded-lg transition-colors"
          >
            Choose City
          </button>
        </div>
      </div>
    );
  }

  // State 2: Requesting / Detecting GPS
  if (locationState === 'requesting') {
    return (
      <div className="bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 rounded-xl p-4 flex items-center gap-3 text-sky-800 dark:text-sky-300">
        <RefreshCw className="w-5 h-5 animate-spin text-sky-600 dark:text-sky-400" />
        <div className="text-xs">
          <span className="font-semibold">Acquiring GPS fix via Browser Geolocation API...</span>
          <p className="text-sky-600 dark:text-sky-400">Please approve the location permission prompt in your browser.</p>
        </div>
      </div>
    );
  }

  // State 3: Permission Denied or Unavailable
  if (locationState === 'denied' || locationState === 'unavailable') {
    return (
      <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl p-4 space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-500 text-white rounded-lg">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-semibold text-xs text-rose-900 dark:text-rose-200">
                {locationState === 'denied' ? 'Location Permission Denied' : 'Location Service Unavailable'}
              </h4>
              <p className="text-xs text-rose-700 dark:text-rose-400">
                You can retry permission or select a demo city preset below.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onDetectLocation}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry Detection</span>
            </button>
          </div>
        </div>

        {/* Fallback City Selection */}
        <div className="pt-2 border-t border-rose-200 dark:border-rose-900/50">
          <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1.5">
            Manual Location Fallback:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {PRESET_CITIES.map((c) => (
              <button
                key={c.name}
                onClick={() => onSelectManualCoords(c.lat, c.lng, c.name)}
                className="px-2.5 py-1 text-xs rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-sky-500 hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // State 4: Location Granted & Active
  return (
    <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2 text-xs">
      <div className="flex items-center gap-2">
        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
        <span className="text-slate-600 dark:text-slate-400">Current Position:</span>
        <span className="font-semibold text-slate-900 dark:text-slate-100">
          {userCoords?.label || `${userCoords?.latitude.toFixed(4)}°, ${userCoords?.longitude.toFixed(4)}°`}
        </span>
        {userCoords?.isFallback && (
          <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 text-[10px] font-semibold">
            Manual Fallback
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        {/* City Quick Switcher */}
        <select
          onChange={(e) => {
            const city = PRESET_CITIES.find((c) => c.name === e.target.value);
            if (city) onSelectManualCoords(city.lat, city.lng, city.name);
          }}
          className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md px-2 py-1 text-xs text-slate-700 dark:text-slate-300"
          value={userCoords?.label || ''}
        >
          <option value="">Switch Location Preset...</option>
          {PRESET_CITIES.map((c) => (
            <option key={c.name} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>

        <button
          onClick={onDetectLocation}
          title="Refresh GPS Detection"
          className="p-1 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

