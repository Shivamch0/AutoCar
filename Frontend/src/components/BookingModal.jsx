import React, { useState } from 'react';
import { bookingsApi } from '../services/api.js';
import { fogClient } from '../services/fogClient.js';
import { useAuth } from '../context/AuthContext.jsx';
import { X, Calendar, Clock, Car, CheckCircle2, AlertTriangle, ShieldCheck, Cpu } from 'lucide-react';

export default function BookingModal({ garage, onClose, onBookingSuccess }) {
  const { user } = useAuth();

  const services = garage.services || [
    { name: 'Standard Maintenance Service', category: 'General Service', price: 99.0, durationMinutes: 60 }
  ];

  const [selectedService, setSelectedService] = useState(services[0]);
  const [scheduledDate, setScheduledDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [scheduledTime, setScheduledTime] = useState('10:00');
  const [vehicleMake, setVehicleMake] = useState('Toyota');
  const [vehicleModel, setVehicleModel] = useState('RAV4');
  const [vehicleYear, setVehicleYear] = useState('2022');
  const [licensePlate, setLicensePlate] = useState('CA-7XYZ89');
  const [notes, setNotes] = useState('');
  const [routingMode, setRoutingMode] = useState('cloud'); // 'cloud' | 'fog'

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [bookingResult, setBookingResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}:00`);
    const idempotencyKey = `idemp_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    const bookingPayload = {
      garageId: garage._id,
      service: selectedService,
      scheduledTime: scheduledDateTime.toISOString(),
      vehicleDetails: {
        make: vehicleMake,
        model: vehicleModel,
        year: parseInt(vehicleYear, 10),
        licensePlate
      },
      notes,
      idempotencyKey,
      customerId: user?._id || '672000000000000000000099'
    };

    try {
      let responseData = null;

      if (routingMode === 'fog') {
        // Route through Regional Fog Node
        const fogRes = await fogClient.createBooking(bookingPayload);
        responseData = fogRes.data;
      } else {
        // Route directly to Authoritative Cloud Backend
        const cloudRes = await bookingsApi.create(bookingPayload);
        responseData = cloudRes.data;
      }

      setBookingResult(responseData);
      if (onBookingSuccess) {
        onBookingSuccess(responseData.data || responseData);
      }
    } catch (err) {
      console.error('[Booking Error]:', err);
      const errMsg =
        err.response?.data?.message ||
        err.message ||
        'Booking submission failed. Please verify availability and try again.';
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
              Book Appointment
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {garage.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          {bookingResult ? (
            /* Booking Confirmation View */
            <div className="text-center py-4 space-y-4">
              <div
                className={`w-14 h-14 mx-auto rounded-full flex items-center justify-center ${
                  bookingResult.pending
                    ? 'bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400'
                    : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400'
                }`}
              >
                {bookingResult.pending ? (
                  <Clock className="w-8 h-8" />
                ) : (
                  <CheckCircle2 className="w-8 h-8" />
                )}
              </div>

              <div>
                <h4 className="font-bold text-base text-slate-900 dark:text-slate-100">
                  {bookingResult.pending ? 'Awaiting Confirmation' : 'Appointment Confirmed!'}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
                  {bookingResult.message ||
                    'Your appointment has been registered and scheduled authoritatively.'}
                </p>
              </div>

              {/* Confirmation Details Card */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl text-left text-xs space-y-2 border border-slate-200 dark:border-slate-700">
                <div className="flex justify-between">
                  <span className="text-slate-500">Booking Reference:</span>
                  <span className="font-mono font-bold text-sky-600 dark:text-sky-400">
                    {bookingResult.data?.bookingNumber || bookingResult.queueId || 'BK-PENDING'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Service:</span>
                  <span className="font-semibold">{selectedService.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Date & Time:</span>
                  <span>{scheduledDate} at {scheduledTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Price:</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">
                    ${selectedService.price}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Routing Mode:</span>
                  <span className="font-medium">
                    {bookingResult.fog?.routedViaFog ? 'Fog Node Forwarded' : 'Direct Cloud Authoritative'}
                  </span>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-full py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
              >
                Done
              </button>
            </div>
          ) : (
            /* Booking Form */
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {error && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-lg text-rose-800 dark:text-rose-300 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Service Selection */}
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Select Service
                </label>
                <div className="space-y-1.5">
                  {services.map((svc, i) => (
                    <div
                      key={i}
                      onClick={() => setSelectedService(svc)}
                      className={`p-2.5 rounded-lg border cursor-pointer flex items-center justify-between transition-all ${
                        selectedService.name === svc.name
                          ? 'border-sky-500 bg-sky-50/70 dark:bg-sky-950/40 text-sky-900 dark:text-sky-200 font-semibold'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div>
                        <div>{svc.name}</div>
                        <div className="text-[11px] font-normal text-slate-500">
                          {svc.category} • {svc.durationMinutes || 60} mins
                        </div>
                      </div>
                      <span className="font-bold text-slate-900 dark:text-slate-100">
                        ${svc.price}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    required
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Preferred Time
                  </label>
                  <select
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="09:00">09:00 AM</option>
                    <option value="10:00">10:00 AM</option>
                    <option value="11:30">11:30 AM</option>
                    <option value="13:30">01:30 PM</option>
                    <option value="15:00">03:00 PM</option>
                    <option value="16:30">04:30 PM</option>
                  </select>
                </div>
              </div>

              {/* Vehicle Details */}
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="font-semibold text-slate-700 dark:text-slate-300 block">
                  Vehicle Information
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Make (e.g. Tesla)"
                    required
                    value={vehicleMake}
                    onChange={(e) => setVehicleMake(e.target.value)}
                    className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                  />
                  <input
                    type="text"
                    placeholder="Model (e.g. Model 3)"
                    required
                    value={vehicleModel}
                    onChange={(e) => setVehicleModel(e.target.value)}
                    className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                  />
                  <input
                    type="number"
                    placeholder="Year"
                    value={vehicleYear}
                    onChange={(e) => setVehicleYear(e.target.value)}
                    className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                  />
                  <input
                    type="text"
                    placeholder="License Plate"
                    value={licensePlate}
                    onChange={(e) => setLicensePlate(e.target.value)}
                    className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg uppercase"
                  />
                </div>
              </div>

              {/* Routing Architecture Selector */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Dispatch Architecture Routing:
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRoutingMode('cloud')}
                    className={`p-2 rounded-lg border text-left transition-all ${
                      routingMode === 'cloud'
                        ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/50 text-sky-900 dark:text-sky-300 font-semibold'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <div className="font-bold flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-sky-600" />
                      <span>Direct Cloud</span>
                    </div>
                    <div className="text-[10px] text-slate-500">Authoritative Cloud API</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRoutingMode('fog')}
                    className={`p-2 rounded-lg border text-left transition-all ${
                      routingMode === 'fog'
                        ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/50 text-sky-900 dark:text-sky-300 font-semibold'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <div className="font-bold flex items-center gap-1">
                      <Cpu className="w-3.5 h-3.5 text-violet-600" />
                      <span>Fog Forwarded</span>
                    </div>
                    <div className="text-[10px] text-slate-500">Via Regional Fog Node</div>
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-2.5 bg-sky-600 hover:bg-sky-700 disabled:bg-sky-400 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span>Authorizing Appointment...</span>
                ) : (
                  <span>Confirm Booking (${selectedService.price})</span>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

