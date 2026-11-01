import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Star, MapPin, Wrench, Clock, ShieldCheck, ChevronRight } from 'lucide-react';
import { useTheme } from '../context/ThemeContext.jsx';

// Custom User Location Pulsing DivIcon
const createUserIcon = () =>
  L.divIcon({
    className: 'custom-user-marker',
    html: `<div class="user-marker-pulse"></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10]
  });

// Custom Garage Marker DivIcon
const createGarageIcon = (garage, isSelected = false) => {
  const isAvailable = garage.isAvailable;
  const bgColor = isSelected ? '#0284c7' : isAvailable ? '#10b981' : '#f59e0b';
  const scale = isSelected ? 'transform: scale(1.2); z-index: 1000;' : '';

  const html = `
    <div style="display: flex; flex-direction: column; align-items: center; cursor: pointer; ${scale}">
      <div style="background-color: ${bgColor}; color: white; padding: 4px 8px; border-radius: 9999px; font-size: 11px; font-weight: 700; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2); border: 2px solid white; display: flex; align-items: center; gap: 4px; white-space: nowrap;">
        <span>★ ${(garage.rating || 4.5).toFixed(1)}</span>
      </div>
      <div style="width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 6px solid ${bgColor}; margin-top: -1px;"></div>
    </div>
  `;

  return L.divIcon({
    className: 'custom-garage-marker',
    html,
    iconSize: [60, 36],
    iconAnchor: [30, 36]
  });
};

// Map Pan / Zoom Controller
function MapController({ center, selectedGarage, radiusKm }) {
  const map = useMap();

  useEffect(() => {
    // Invalidate size to ensure clean render after container transitions
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 200);
    return () => clearTimeout(timer);
  }, [map]);

  useEffect(() => {
    if (selectedGarage?.location?.coordinates) {
      const [lng, lat] = selectedGarage.location.coordinates;
      map.flyTo([lat, lng], 14, { duration: 1.2 });
    } else if (center) {
      map.flyTo([center.latitude, center.longitude], 12, { duration: 1.0 });
    }
  }, [selectedGarage, center, map]);

  return null;
}

export default function GarageMap({
  garages = [],
  userCoords,
  selectedGarage,
  onSelectGarage,
  onBookGarage,
  radiusKm = 15
}) {
  const { isDark } = useTheme();

  // Default initial center: San Francisco Bay Area (or user coords)
  const defaultCenter = userCoords
    ? [userCoords.latitude, userCoords.longitude]
    : [37.7749, -122.4194];

  // OpenStreetMap tile layer (standard with mandatory OSM copyright attribution)
  const osmUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
  const osmAttribution =
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors | AutoNear Fog & Edge';

  return (
    <div className="relative w-full h-[380px] sm:h-[450px] lg:h-[520px] rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm">
      <MapContainer
        center={defaultCenter}
        zoom={12}
        scrollWheelZoom={true}
        className="w-full h-full"
      >
        <TileLayer url={osmUrl} attribution={osmAttribution} />

        <MapController
          center={userCoords}
          selectedGarage={selectedGarage}
          radiusKm={radiusKm}
        />

        {/* Customer Location Marker + Search Radius Circle */}
        {userCoords && (
          <>
            <Marker
              position={[userCoords.latitude, userCoords.longitude]}
              icon={createUserIcon()}
            >
              <Popup>
                <div className="p-1 text-xs">
                  <span className="font-bold text-slate-800">Your Current Position</span>
                  <p className="text-slate-500 text-[10px]">
                    {userCoords.label || `${userCoords.latitude.toFixed(4)}, ${userCoords.longitude.toFixed(4)}`}
                  </p>
                </div>
              </Popup>
            </Marker>

            <Circle
              center={[userCoords.latitude, userCoords.longitude]}
              radius={radiusKm * 1000}
              pathOptions={{
                color: '#0284c7',
                fillColor: '#38bdf8',
                fillOpacity: 0.08,
                weight: 1.5,
                dashArray: '4, 6'
              }}
            />
          </>
        )}

        {/* Garage Markers */}
        {garages.map((garage) => {
          if (!garage.location?.coordinates || garage.location.coordinates.length < 2) {
            return null;
          }
          const [lng, lat] = garage.location.coordinates;
          const isSelected = selectedGarage?._id === garage._id;

          return (
            <Marker
              key={garage._id}
              position={[lat, lng]}
              icon={createGarageIcon(garage, isSelected)}
              eventHandlers={{
                click: () => onSelectGarage(garage)
              }}
            >
              <Popup>
                <div className="p-2 min-w-[210px] text-xs space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-bold text-slate-900 leading-snug">{garage.name}</h4>
                    <span className="shrink-0 flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 font-bold text-[11px] border border-amber-200">
                      ★ {(garage.rating || 4.5).toFixed(1)}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-500">
                    {garage.address?.street}, {garage.address?.city}
                  </p>

                  <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100">
                    <span className="text-slate-600 font-medium">
                      {garage.distanceKm ? `~${garage.distanceKm} km away` : 'Nearby'}
                    </span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                        garage.isAvailable
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {garage.isAvailable
                        ? `${garage.capacity?.activeBays || 4} Bays Open`
                        : 'Fully Booked'}
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      onSelectGarage(garage);
                      if (onBookGarage) onBookGarage(garage);
                    }}
                    className="w-full mt-2 py-1.5 px-3 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-md text-xs flex items-center justify-center gap-1 transition-colors"
                  >
                    <span>Book Service</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Floating Map Legend */}
      <div className="absolute bottom-3 left-3 z-[1000] bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-[11px] shadow-sm flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span>
          <span className="text-slate-600 dark:text-slate-300">You</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
          <span className="text-slate-600 dark:text-slate-300">Available</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
          <span className="text-slate-600 dark:text-slate-300">Busy</span>
        </div>
      </div>
    </div>
  );
}

