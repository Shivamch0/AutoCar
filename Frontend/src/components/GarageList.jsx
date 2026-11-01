import React from 'react';
import { Star, MapPin, Phone, ShieldCheck, Clock, Calendar, CheckCircle, ChevronRight, AlertCircle } from 'lucide-react';

export default function GarageList({
  garages = [],
  loading = false,
  selectedGarage,
  onSelectGarage,
  onBookGarage,
  onResetFilters
}) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 animate-pulse space-y-3"
          >
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-2/3"></div>
            <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-1/2"></div>
            <div className="flex gap-2">
              <div className="h-6 bg-slate-100 dark:bg-slate-800 rounded w-20"></div>
              <div className="h-6 bg-slate-100 dark:bg-slate-800 rounded w-24"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (garages.length === 0) {
    return (
      <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 dark:border-slate-800 space-y-3">
        <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div>
          <h4 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">No Garages Found</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto mt-1">
            No auto repair centers matched your current radius or filter criteria. Try increasing the search radius or selecting a different location.
          </p>
        </div>
        {onResetFilters && (
          <button
            onClick={onResetFilters}
            className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-semibold transition-colors"
          >
            Reset Filters
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3 max-h-[580px] overflow-y-auto pr-1">
      {garages.map((garage) => {
        const isSelected = selectedGarage?._id === garage._id;
        const availableBays = Math.max(0, (garage.capacity?.activeBays || 4) - (garage.currentOccupancy || 0));

        return (
          <div
            key={garage._id}
            onClick={() => onSelectGarage(garage)}
            className={`p-4 rounded-xl border transition-all cursor-pointer ${
              isSelected
                ? 'bg-sky-50/70 dark:bg-sky-950/40 border-sky-500 ring-2 ring-sky-500/20 shadow-md'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <span>{garage.name}</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                  <span>
                    {garage.address?.street}, {garage.address?.city}
                  </span>
                </p>
              </div>

              {/* Rating badge */}
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-300 font-bold text-xs shrink-0">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                <span>{(garage.rating || 4.5).toFixed(1)}</span>
                <span className="text-[10px] text-amber-600/70 font-normal">({garage.reviewsCount || 40})</span>
              </div>
            </div>

            {/* Distance & Availability Meta */}
            <div className="flex items-center gap-3 mt-3 text-xs">
              <span className="font-semibold text-sky-700 dark:text-sky-400 bg-sky-100 dark:bg-sky-950 px-2 py-0.5 rounded">
                {garage.distanceKm !== undefined ? `${garage.distanceKm} km away` : 'Nearby'}
              </span>

              <span
                className={`flex items-center gap-1 px-2 py-0.5 rounded font-medium text-[11px] ${
                  garage.isAvailable && availableBays > 0
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-400'
                }`}
              >
                <Clock className="w-3 h-3" />
                <span>
                  {garage.isAvailable && availableBays > 0
                    ? `${availableBays} / ${garage.capacity?.activeBays || 4} Bays Open`
                    : 'High Demand'}
                </span>
              </span>

              {garage.edgeAgentId && (
                <span
                  title="Connected to local Garage-Side Edge Computing Agent"
                  className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300"
                >
                  ⚡ Edge Agent Synced
                </span>
              )}
            </div>

            {/* Services preview */}
            {garage.services && garage.services.length > 0 && (
              <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap gap-1.5">
                {garage.services.slice(0, 3).map((s, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                  >
                    <span>{s.name}</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">${s.price}</span>
                  </span>
                ))}
              </div>
            )}

            {/* Action footer */}
            <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="text-[11px] text-slate-400 dark:text-slate-500">
                Hours: {garage.operatingHours?.open || '08:00'} - {garage.operatingHours?.close || '19:00'}
              </span>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectGarage(garage);
                  if (onBookGarage) onBookGarage(garage);
                }}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
              >
                <span>Book Appointment</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

