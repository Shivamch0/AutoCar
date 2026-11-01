import mongoose from 'mongoose';
import { BOOKING_STATUS } from '../config/constants.js';

const bookingSchema = new mongoose.Schema(
  {
    bookingNumber: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    garage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Garage',
      required: true
    },
    service: {
      name: { type: String, required: true },
      category: { type: String, required: true },
      price: { type: Number, required: true },
      durationMinutes: { type: Number, default: 60 }
    },
    scheduledTime: {
      type: Date,
      required: true
    },
    vehicleDetails: {
      make: { type: String, required: true },
      model: { type: String, required: true },
      year: { type: Number, default: 2022 },
      licensePlate: { type: String, default: '' }
    },
    status: {
      type: String,
      enum: Object.values(BOOKING_STATUS),
      default: BOOKING_STATUS.PENDING
    },
    statusHistory: [
      {
        status: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
        changedBy: { type: String, default: 'System' },
        note: { type: String, default: '' }
      }
    ],
    fogAssisted: {
      type: Boolean,
      default: false
    },
    idempotencyKey: {
      type: String,
      index: true,
      sparse: true
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0
    },
    notes: {
      type: String,
      default: ''
    }
  },
  { timestamps: true }
);

bookingSchema.index({ garage: 1, scheduledTime: 1 });
bookingSchema.index({ customer: 1, createdAt: -1 });

export default mongoose.model('Booking', bookingSchema);

