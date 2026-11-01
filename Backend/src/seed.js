import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Garage from './models/Garage.js';
import Booking from './models/Booking.js';
import Notification from './models/Notification.js';
import { ROLES, SERVICE_CATEGORIES } from './config/constants.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/autonear';

// Realistic sample garages (San Francisco Bay Area metro cluster for realistic testing)
// GeoJSON coordinates are in [longitude, latitude] order!
const demoGaragesData = [
  {
    name: '[DEMO] Apex Performance & Auto Care',
    address: {
      street: '450 Mission Street',
      city: 'San Francisco',
      state: 'CA',
      postalCode: '94105'
    },
    location: {
      type: 'Point',
      coordinates: [-122.3982, 37.7901] // [lng, lat]
    },
    contactPhone: '+1 (415) 555-0101',
    email: 'contact@apexautocare.demo',
    rating: 4.9,
    reviewsCount: 142,
    isAvailable: true,
    capacity: { totalBays: 6, activeBays: 5 },
    currentOccupancy: 2,
    services: [
      { name: 'Full Synthetic Oil Change', category: 'Oil & Filter Change', price: 79.99, durationMinutes: 45, description: 'Premium OEM synthetic oil and high-efficiency filter.' },
      { name: 'Comprehensive Engine Diagnostics', category: 'Engine Diagnostics', price: 120.0, durationMinutes: 60, description: 'OBD-II live ECU telemetry and sensor analysis.' },
      { name: 'Ceramic Brake Pad Replacement', category: 'Brake Repair', price: 240.0, durationMinutes: 90, description: 'Front/rear ceramic pads and rotor inspection.' }
    ]
  },
  {
    name: '[DEMO] Mission Bay Precision Motors',
    address: {
      street: '1200 4th St',
      city: 'San Francisco',
      state: 'CA',
      postalCode: '94158'
    },
    location: {
      type: 'Point',
      coordinates: [-122.3912, 37.7715] // [lng, lat] ~2.2 km south
    },
    contactPhone: '+1 (415) 555-0102',
    email: 'service@missionbaymotors.demo',
    rating: 4.7,
    reviewsCount: 98,
    isAvailable: true,
    capacity: { totalBays: 4, activeBays: 4 },
    currentOccupancy: 1,
    services: [
      { name: 'EV & Hybrid Battery Health Check', category: 'Battery & Electrical', price: 95.0, durationMinutes: 60, description: 'High-voltage cell health and inverter test.' },
      { name: 'Climate System Recharge & Flush', category: 'Air Conditioning', price: 149.0, durationMinutes: 75, description: 'R-134a/R-1234yf leak test and compressor recharge.' },
      { name: 'Standard Maintenance Service', category: 'General Service', price: 110.0, durationMinutes: 60, description: 'Multi-point inspection and fluid top-off.' }
    ]
  },
  {
    name: '[DEMO] Presidio Green Auto Works',
    address: {
      street: '2100 Lombard St',
      city: 'San Francisco',
      state: 'CA',
      postalCode: '94123'
    },
    location: {
      type: 'Point',
      coordinates: [-122.4371, 37.7997] // [lng, lat] ~3.6 km west
    },
    contactPhone: '+1 (415) 555-0103',
    email: 'info@presidiogreen.demo',
    rating: 4.8,
    reviewsCount: 115,
    isAvailable: true,
    capacity: { totalBays: 5, activeBays: 4 },
    currentOccupancy: 3,
    services: [
      { name: 'Precision Wheel Alignment & Balance', category: 'Tire Replacement & Balancing', price: 135.0, durationMinutes: 60, description: 'Laser 4-wheel alignment and high-speed balancing.' },
      { name: 'Premium Ceramic Coating', category: 'Bodywork & Detailing', price: 299.0, durationMinutes: 180, description: 'Exterior paint decontamination and hydrophobic coating.' },
      { name: 'Standard Oil & Filter Service', category: 'Oil & Filter Change', price: 65.0, durationMinutes: 40, description: 'Engine oil replacement with multi-point check.' }
    ]
  },
  {
    name: '[DEMO] Sunset District Fleet & Service Hub',
    address: {
      street: '1850 19th Ave',
      city: 'San Francisco',
      state: 'CA',
      postalCode: '94122'
    },
    location: {
      type: 'Point',
      coordinates: [-122.4764, 37.7529] // [lng, lat] ~7.5 km southwest
    },
    contactPhone: '+1 (415) 555-0104',
    email: 'hub@sunsetsf.demo',
    rating: 4.6,
    reviewsCount: 84,
    isAvailable: true,
    capacity: { totalBays: 8, activeBays: 7 },
    currentOccupancy: 4,
    services: [
      { name: 'Complete Brake System Overhaul', category: 'Brake Repair', price: 380.0, durationMinutes: 120, description: 'Calipers, fluid flush, rotors and pads.' },
      { name: 'Engine Diagnostic & Tune-up', category: 'Engine Diagnostics', price: 160.0, durationMinutes: 90, description: 'Spark plugs, intake cleaning and ECU calibration.' },
      { name: 'Heavy Duty 4-Tire Replacement', category: 'Tire Replacement & Balancing', price: 520.0, durationMinutes: 90, description: 'Set of all-season tires with road hazard warranty.' }
    ]
  },
  {
    name: '[DEMO] Oakland Bay Auto Specialists',
    address: {
      street: '2201 Broadway',
      city: 'Oakland',
      state: 'CA',
      postalCode: '94612'
    },
    location: {
      type: 'Point',
      coordinates: [-122.2685, 37.8122] // [lng, lat] ~12 km east across the Bay
    },
    contactPhone: '+1 (510) 555-0105',
    email: 'contact@oaklandbayauto.demo',
    rating: 4.9,
    reviewsCount: 204,
    isAvailable: true,
    capacity: { totalBays: 6, activeBays: 6 },
    currentOccupancy: 2,
    services: [
      { name: 'General Fleet Multi-Point Inspection', category: 'General Service', price: 85.0, durationMinutes: 50, description: 'Thorough suspension, electrical, and powertrain check.' },
      { name: 'AC Refrigerant Service', category: 'Air Conditioning', price: 130.0, durationMinutes: 60, description: 'Evacuation and high-precision gas recharge.' },
      { name: 'Performance Brake Service', category: 'Brake Repair', price: 210.0, durationMinutes: 75, description: 'Slotted rotor installation and high-temp fluid flush.' }
    ]
  },
  {
    name: '[DEMO] Silicon Valley Rapid Lube & Repair',
    address: {
      street: '150 S First St',
      city: 'San Jose',
      state: 'CA',
      postalCode: '95113'
    },
    location: {
      type: 'Point',
      coordinates: [-121.8893, 37.3352] // [lng, lat] ~65 km southeast
    },
    contactPhone: '+1 (408) 555-0106',
    email: 'sv@rapidrepair.demo',
    rating: 4.5,
    reviewsCount: 76,
    isAvailable: true,
    capacity: { totalBays: 4, activeBays: 3 },
    currentOccupancy: 1,
    services: [
      { name: 'Express 15-Minute Oil Service', category: 'Oil & Filter Change', price: 59.0, durationMinutes: 20, description: 'Quick pit-stop style synthetic blend service.' },
      { name: 'Alternator & Starter Replacement', category: 'Battery & Electrical', price: 280.0, durationMinutes: 120, description: 'OEM replacement with 2-year warranty.' }
    ]
  }
];

export async function seedDatabase() {
  try {
    console.log('[Seed] Connecting to MongoDB at', MONGODB_URI);
    await mongoose.connect(MONGODB_URI);
    console.log('[Seed] Connected.');

    // Clear existing demo data
    console.log('[Seed] Cleaning up previous demo data...');
    await Booking.deleteMany({});
    await Notification.deleteMany({});
    await Garage.deleteMany({ name: { $regex: '^\\[DEMO\\]' } });
    await User.deleteMany({ email: { $in: ['customer@autonear.demo', 'owner@autonear.demo', 'admin@autonear.demo'] } });

    // 1. Create Demo Users
    console.log('[Seed] Creating demo accounts...');
    const customer = await User.create({
      name: 'Demo Customer',
      email: 'customer@autonear.demo',
      password: 'password123',
      role: ROLES.CUSTOMER,
      phone: '+1 (555) 019-9001'
    });

    const owner = await User.create({
      name: 'Demo Garage Owner',
      email: 'owner@autonear.demo',
      password: 'password123',
      role: ROLES.GARAGE_OWNER,
      phone: '+1 (555) 019-9002'
    });

    const admin = await User.create({
      name: 'Demo System Admin',
      email: 'admin@autonear.demo',
      password: 'admin123',
      role: ROLES.ADMIN,
      phone: '+1 (555) 019-9003'
    });

    // 2. Insert Garages with GeoJSON Points
    console.log('[Seed] Inserting GeoJSON garages...');
    const insertedGarages = [];
    for (let i = 0; i < demoGaragesData.length; i++) {
      const gData = { ...demoGaragesData[i] };
      if (i === 0) {
        gData.ownerId = owner._id;
        gData.edgeAgentId = 'agent_sf_apex_01';
      }
      const garage = await Garage.create(gData);
      insertedGarages.push(garage);
    }

    // Link owner to their primary garage
    owner.garageId = insertedGarages[0]._id;
    await owner.save();

    // 3. Create sample booking
    console.log('[Seed] Creating sample bookings...');
    const sampleBooking = await Booking.create({
      bookingNumber: 'BK-DEMO-2026A',
      customer: customer._id,
      garage: insertedGarages[0]._id,
      service: insertedGarages[0].services[0],
      scheduledTime: new Date(Date.now() + 24 * 3600 * 1000), // tomorrow
      vehicleDetails: {
        make: 'Tesla',
        model: 'Model 3',
        year: 2023,
        licensePlate: 'DEMO-789'
      },
      status: 'confirmed',
      statusHistory: [
        {
          status: 'confirmed',
          timestamp: new Date(),
          changedBy: 'Seed System',
          note: 'Sample verified appointment.'
        }
      ],
      totalAmount: insertedGarages[0].services[0].price,
      notes: 'Please check tire pressure as well.'
    });

    // 4. Sample notification
    await Notification.create({
      recipient: customer._id,
      title: 'Welcome to AutoNear!',
      message: 'Explore nearby verified garages using real-time maps and edge optimization.',
      type: 'system',
      data: { sample: true }
    });

    console.log('\n--- Seed Complete! ---');
    console.log(`Inserted ${insertedGarages.length} demo garages with GeoJSON coordinates.`);
    console.log('Demo Credentials:');
    console.log('Customer: customer@autonear.demo / password123');
    console.log('Garage Owner: owner@autonear.demo / password123');
    console.log('Admin: admin@autonear.demo / admin123');

    await mongoose.disconnect();
    return { success: true, count: insertedGarages.length };
  } catch (error) {
    console.error('[Seed Error]:', error);
    await mongoose.disconnect();
    throw error;
  }
}

// If invoked directly from CLI
if (process.argv[1]?.endsWith('seed.js')) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

