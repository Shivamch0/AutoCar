import mongoose from 'mongoose';
import { SERVICE_CATEGORIES } from '../config/constants.js';

const serviceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { 
    type: String, 
    required: true,
    enum: SERVICE_CATEGORIES
  },
  price: { type: Number, required: true, min: 0 },
  durationMinutes: { type: Number, required: true, default: 60 },
  description: { type: String, default: '' }
});

const garageSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Garage name is required'],
      trim: true
    },
    address: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, default: '' },
      postalCode: { type: String, default: '' }
    },
    // GeoJSON Point: [longitude, latitude]
    location: {
      type: {
        type: String,
        enum: ['Point'],
        required: true,
        default: 'Point'
      },
      coordinates: {
        type: [Number],
        required: true,
        validate: {
          validator: function (val) {
            return (
              Array.isArray(val) &&
              val.length === 2 &&
              val[0] >= -180 &&
              val[0] <= 180 && // longitude
              val[1] >= -90 &&
              val[1] <= 90     // latitude
            );
          },
          message: 'Coordinates must be valid [longitude, latitude] numbers.'
        }
      }
    },
    contactPhone: { type: String, default: '' },
    email: { type: String, default: '' },
    rating: { type: Number, default: 4.5, min: 1, max: 5 },
    reviewsCount: { type: Number, default: 0 },
    isAvailable: { type: Boolean, default: true },
    capacity: {
      totalBays: { type: Number, default: 4, min: 1 },
      activeBays: { type: Number, default: 4, min: 0 }
    },
    currentOccupancy: { type: Number, default: 0, min: 0 },
    services: [serviceSchema],
    operatingHours: {
      open: { type: String, default: '08:00' },
      close: { type: String, default: '19:00' },
      days: {
        type: [String],
        default: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
      }
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    edgeAgentId: {
      type: String,
      default: null,
      index: true
    },
    lastEdgeSync: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

// 2dsphere index for MongoDB geospatial queries
garageSchema.index({ location: '2dsphere' });
garageSchema.index({ 'services.category': 1 });
garageSchema.index({ isAvailable: 1 });

export default mongoose.model('Garage', garageSchema);

