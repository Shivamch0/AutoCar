import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar.jsx';
import LocationStatus from './components/LocationStatus.jsx';
import FilterBar from './components/FilterBar.jsx';
import GarageMap from './components/GarageMap.jsx';
import GarageList from './components/GarageList.jsx';
import BookingModal from './components/BookingModal.jsx';
import NotificationCenter from './components/NotificationCenter.jsx';
import BenchmarkDashboard from './components/BenchmarkDashboard.jsx';
import ArchitectureView from './components/ArchitectureView.jsx';

import { garagesApi } from './services/api.js';
import { fogClient } from './services/fogClient.js';
import {
  validateClientCoordinates,
  filterGaragesAtClientEdge,
  cacheResultsAtClientEdge,
  getCachedResultsAtClientEdge
} from './edge/browserEdge.js';
import { useSocket } from './context/SocketContext.jsx';
import { useAuth } from './context/AuthContext.jsx';

export default function App() {
  const { user } = useAuth();
  const { latestAvailabilityEvent } = useSocket();

  // Active Main Tab: 'explore' | 'benchmark' | 'architecture'
  const [activeTab, setActiveTab] = useState('explore');

  // Geolocation & User Coordinates State
  // Initial state is 'prompt' to respect Requirement 1: "Request location only after permission or explicit user action"
  const [locationState, setLocationState] = useState('prompt');
  const [userCoords, setUserCoords] = useState(null);

  // Search & Filter State
  const [filters, setFilters] = useState({
    search: '',
    category: 'All',
    radiusKm: 15,
    isAvailable: false,
    sortBy: 'distance'
  });

  // Garages Data State
  const [rawGarages, setRawGarages] = useState([]);
  const [displayedGarages, setDisplayedGarages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedGarage, setSelectedGarage] = useState(null);
  const [isClientEdgeFiltered, setIsClientEdgeFiltered] = useState(false);

  // Modals & Panels
  const [bookingGarage, setBookingGarage] = useState(null);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // 1. Explicit User Geolocation Request (Browser Geolocation API)
  const detectLocation = () => {
    if (!navigator.geolocation) {
      setLocationState('unavailable');
      return;
    }

    setLocationState('requesting');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        if (validateClientCoordinates(latitude, longitude)) {
          setUserCoords({
            latitude,
            longitude,
            accuracy,
            label: 'Detected via GPS',
            isFallback: false
          });
          setLocationState('granted');
        } else {
          setLocationState('unavailable');
        }
      },
      (error) => {
        console.warn('[Geolocation Error]:', error.message);
        if (error.code === error.PERMISSION_DENIED) {
          setLocationState('denied');
        } else {
          setLocationState('unavailable');
        }
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    );
  };

  // 2. Manual Location Fallback Selection
  const selectManualCoords = (lat, lng, label) => {
    setUserCoords({
      latitude: lat,
      longitude: lng,
      label,
      isFallback: true
    });
    setLocationState('granted');
  };

  // 3. Fetch Garages: tries Fog Node first (if accessible) or falls back to Cloud API
  const fetchNearbyGarages = useCallback(async () => {
    if (!userCoords) return;
    setLoading(true);

    const queryParams = {
      lat: userCoords.latitude,
      lng: userCoords.longitude,
      radiusKm: filters.radiusKm,
      category: filters.category,
      sortBy: filters.sortBy
    };

    // Check client-edge cache first to prevent redundant requests
    const cacheKey = `${userCoords.latitude.toFixed(2)}_${userCoords.longitude.toFixed(2)}_${filters.radiusKm}_${filters.category}_${filters.sortBy}`;
    const clientCached = getCachedResultsAtClientEdge(cacheKey);

    if (clientCached && !clientCached.isStale) {
      setRawGarages(clientCached.data);
      setLoading(false);
      setIsClientEdgeFiltered(true);
      return;
    }

    try {
      let data = [];
      // Try Fog Node regional cache
      try {
        const fogRes = await fogClient.getNearby(queryParams);
        if (fogRes.data?.data) {
          data = fogRes.data.data;
        }
      } catch (fogErr) {
        // Fall back cleanly to Authoritative Cloud API
        const cloudRes = await garagesApi.getNearby(queryParams);
        data = cloudRes.data.data || [];
      }

      setRawGarages(data);
      cacheResultsAtClientEdge(cacheKey, data);
      setIsClientEdgeFiltered(false);
    } catch (err) {
      console.error('[Fetch Garages Error]:', err);
      // Fallback: try getAll
      try {
        const fallbackRes = await garagesApi.getAll({});
        setRawGarages(fallbackRes.data.data || []);
      } catch (e) {
        setRawGarages([]);
      }
    } finally {
      setLoading(false);
    }
  }, [userCoords, filters.radiusKm, filters.category, filters.sortBy]);

  // Refetch when location or major filter changes
  useEffect(() => {
    if (userCoords) {
      fetchNearbyGarages();
    }
  }, [userCoords, filters.radiusKm, filters.category, filters.sortBy, fetchNearbyGarages]);

  // 4. Client-Edge Instant Filtering & Ranking
  useEffect(() => {
    let filtered = filterGaragesAtClientEdge(rawGarages, userCoords, {
      radiusKm: filters.radiusKm,
      category: filters.category,
      onlyAvailable: filters.isAvailable,
      sortBy: filters.sortBy
    });

    if (filters.search && filters.search.trim() !== '') {
      const term = filters.search.toLowerCase();
      filtered = filtered.filter((g) => g.name.toLowerCase().includes(term));
    }

    setDisplayedGarages(filtered);
  }, [rawGarages, userCoords, filters]);

  // 5. Handle Live Real-Time Availability Updates from Socket.IO / Polling
  useEffect(() => {
    if (latestAvailabilityEvent) {
      setRawGarages((prev) =>
        prev.map((g) => {
          if (g._id === latestAvailabilityEvent.garageId) {
            return {
              ...g,
              isAvailable: latestAvailabilityEvent.isAvailable,
              currentOccupancy: latestAvailabilityEvent.currentOccupancy,
              capacity: {
                ...g.capacity,
                activeBays: latestAvailabilityEvent.activeBays || g.capacity?.activeBays
              }
            };
          }
          return g;
        })
      );
    }
  }, [latestAvailabilityEvent]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleResetFilters = () => {
    setFilters({
      search: '',
      category: 'All',
      radiusKm: 25,
      isAvailable: false,
      sortBy: 'distance'
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {activeTab === 'explore' && (
          <div className="space-y-4">
            {/* Location Status / Permission Banner */}
            <LocationStatus
              locationState={locationState}
              userCoords={userCoords}
              onDetectLocation={detectLocation}
              onSelectManualCoords={selectManualCoords}
            />

            {/* Filter Bar */}
            <FilterBar
              filters={filters}
              onFilterChange={handleFilterChange}
              totalResults={displayedGarages.length}
              isClientEdgeFiltered={isClientEdgeFiltered}
            />

            {/* Responsive Map & List Synchronized View */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Map View */}
              <div className="lg:col-span-7 xl:col-span-8 order-1 lg:order-1">
                <GarageMap
                  garages={displayedGarages}
                  userCoords={userCoords}
                  selectedGarage={selectedGarage}
                  onSelectGarage={setSelectedGarage}
                  onBookGarage={(g) => setBookingGarage(g)}
                  radiusKm={filters.radiusKm}
                />
              </div>

              {/* List View */}
              <div className="lg:col-span-5 xl:col-span-4 order-2 lg:order-2">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Nearby Auto Care Centers
                  </h3>
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                    {displayedGarages.length} locations
                  </span>
                </div>

                <GarageList
                  garages={displayedGarages}
                  loading={loading}
                  selectedGarage={selectedGarage}
                  onSelectGarage={setSelectedGarage}
                  onBookGarage={(g) => setBookingGarage(g)}
                  onResetFilters={handleResetFilters}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'benchmark' && (
          <BenchmarkDashboard userCoords={userCoords} />
        )}

        {activeTab === 'architecture' && (
          <ArchitectureView />
        )}
      </main>

      {/* Booking Modal */}
      {bookingGarage && (
        <BookingModal
          garage={bookingGarage}
          onClose={() => setBookingGarage(null)}
          onBookingSuccess={(booking) => {
            // Success handler
          }}
        />
      )}

      {/* Notifications Drawer */}
      <NotificationCenter
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
      />
    </div>
  );
}

