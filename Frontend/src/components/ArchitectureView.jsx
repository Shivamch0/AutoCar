import React from 'react';
import { Layers, Cpu, Server, Database, Radio, ShieldCheck, Wifi, ArrowRight } from 'lucide-react';

export default function ArchitectureView() {
  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
        <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Layers className="w-5 h-5 text-sky-500" />
          <span>AutoNear System Architecture & Topology</span>
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-3xl">
          AutoNear distributes computing across 4 tiers: Client-Edge (Browser), Regional Fog Node, Garage-Side Edge Agent, and Authoritative Cloud Backend with MongoDB geospatial indexing.
        </p>

        {/* Distributed Topology Diagram Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          {/* Tier 1: Client Edge */}
          <div className="p-4 rounded-xl border border-sky-200 dark:border-sky-900 bg-sky-50/50 dark:bg-sky-950/20 space-y-2">
            <div className="flex items-center gap-2 font-bold text-xs text-sky-900 dark:text-sky-300">
              <Cpu className="w-4 h-4 text-sky-600" />
              <span>1. Client Edge</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400">
              Browser Geolocation API + Leaflet OSM tiles.
            </p>
            <ul className="text-[11px] text-slate-500 list-disc list-inside space-y-1">
              <li>Client-side Haversine distance</li>
              <li>Instant local dataset ranking</li>
              <li>Session storage TTL cache</li>
            </ul>
          </div>

          {/* Tier 2: Fog Node */}
          <div className="p-4 rounded-xl border border-violet-200 dark:border-violet-900 bg-violet-50/50 dark:bg-violet-950/20 space-y-2">
            <div className="flex items-center gap-2 font-bold text-xs text-violet-900 dark:text-violet-300">
              <Layers className="w-4 h-4 text-violet-600" />
              <span>2. Regional Fog Node</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400">
              Persistent Node.js service (Port 4100).
            </p>
            <ul className="text-[11px] text-slate-500 list-disc list-inside space-y-1">
              <li>Regional discovery caching</li>
              <li>Availability TTL cache</li>
              <li>Durable offline pending queue</li>
            </ul>
          </div>

          {/* Tier 3: Garage Edge Agent */}
          <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/20 space-y-2">
            <div className="flex items-center gap-2 font-bold text-xs text-emerald-900 dark:text-emerald-300">
              <Radio className="w-4 h-4 text-emerald-600" />
              <span>3. Garage Edge Agent</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400">
              Local station microservice (Port 4200).
            </p>
            <ul className="text-[11px] text-slate-500 list-disc list-inside space-y-1">
              <li>Service-bay occupancy monitor</li>
              <li>Simulated IoT sensor telemetry</li>
              <li>Offline buffer & sync resolution</li>
            </ul>
          </div>

          {/* Tier 4: Authoritative Cloud */}
          <div className="p-4 rounded-xl border border-indigo-200 dark:border-indigo-900 bg-indigo-50/50 dark:bg-indigo-950/20 space-y-2">
            <div className="flex items-center gap-2 font-bold text-xs text-indigo-900 dark:text-indigo-300">
              <Database className="w-4 h-4 text-indigo-600" />
              <span>4. Cloud & MongoDB</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400">
              Authoritative Central Store (Port 5000 / Vercel).
            </p>
            <ul className="text-[11px] text-slate-500 list-disc list-inside space-y-1">
              <li>MongoDB 2dsphere GeoJSON index</li>
              <li>Authoritative booking concurrency</li>
              <li>Socket.IO + Polling fallback</li>
            </ul>
          </div>
        </div>

        {/* Vercel vs Persistent Deployment Matrix */}
        <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-3">
            Vercel Serverless Architecture & Real-Time Strategy
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold">
                <tr>
                  <th className="p-3">Component</th>
                  <th className="p-3">Local Persistent Host</th>
                  <th className="p-3">Vercel Deployment</th>
                  <th className="p-3">Fallback Strategy</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-600 dark:text-slate-400">
                <tr>
                  <td className="p-3 font-semibold text-slate-900 dark:text-slate-100">Frontend SPA</td>
                  <td className="p-3">Vite Dev Server (Port 5173)</td>
                  <td className="p-3">Vercel Static Edge Build</td>
                  <td className="p-3">Client-Edge IndexedDB/sessionStorage caching</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-slate-900 dark:text-slate-100">REST API</td>
                  <td className="p-3">Express (src/server.js)</td>
                  <td className="p-3">Serverless Handler (api/index.js)</td>
                  <td className="p-3">Cached Mongoose connection promise across lambdas</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-slate-900 dark:text-slate-100">Real-Time Updates</td>
                  <td className="p-3">Persistent Socket.IO Server</td>
                  <td className="p-3">Short-Interval HTTP Polling (10s)</td>
                  <td className="p-3">Automatic graceful fallback if WebSocket transport drops</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-slate-900 dark:text-slate-100">Fog Node (Port 4100)</td>
                  <td className="p-3">Independent Process</td>
                  <td className="p-3">Persistent Edge Host / Raspberry Pi</td>
                  <td className="p-3">REST direct fallback to Cloud if Fog is unreachable</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

