import React from 'react';
import { Search, SlidersHorizontal, Check, ArrowUpDown } from 'lucide-react';

const SERVICE_CATEGORIES = [
  'All',
  'General Service',
  'Oil & Filter Change',
  'Brake Repair',
  'Tire Replacement & Balancing',
  'Engine Diagnostics',
  'Battery & Electrical',
  'Air Conditioning',
  'Bodywork & Detailing'
];

const RADIUS_OPTIONS = [5, 10, 15, 25, 50];

export default function FilterBar({
  filters,
  onFilterChange,
  totalResults = 0,
  isClientEdgeFiltered = false
}) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs space-y-3">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search garages by name..."
            value={filters.search}
            onChange={(e) => onFilterChange('search', e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        {/* Category selector */}
        <div className="w-full md:w-56">
          <select
            value={filters.category}
            onChange={(e) => onFilterChange('category', e.target.value)}
            className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            {SERVICE_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat === 'All' ? 'All Service Types' : cat}
              </option>
            ))}
          </select>
        </div>

        {/* Sort selector */}
        <div className="w-full md:w-44">
          <select
            value={filters.sortBy}
            onChange={(e) => onFilterChange('sortBy', e.target.value)}
            className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="distance">Sort: Nearest First</option>
            <option value="rating">Sort: Highest Rating</option>
            <option value="price_asc">Sort: Lowest Price</option>
          </select>
        </div>
      </div>

      {/* Second row: Radius presets & Availability toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-slate-500 dark:text-slate-400 font-medium">Search Radius:</span>
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg">
            {RADIUS_OPTIONS.map((r) => (
              <button
                key={r}
                onClick={() => onFilterChange('radiusKm', r)}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                  filters.radiusKm === r
                    ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                {r} km
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer select-none text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={filters.isAvailable}
              onChange={(e) => onFilterChange('isAvailable', e.target.checked)}
              className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 border-slate-300 dark:border-slate-700 dark:bg-slate-800"
            />
            <span>Open & Available Now</span>
          </label>

          <div className="text-slate-400 dark:text-slate-500">
            <span>{totalResults} garages match</span>
            {isClientEdgeFiltered && (
              <span className="ml-1.5 px-1.5 py-0.5 rounded text-[10px] bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 font-semibold">
                Client Edge Filtered
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

