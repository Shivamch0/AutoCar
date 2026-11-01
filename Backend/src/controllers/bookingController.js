import Booking from '../models/Booking.js';
import Garage from '../models/Garage.js';
import Notification from '../models/Notification.js';
import { BOOKING_STATUS } from '../config/constants.js';
import {
  broadcastBookingCreated,
  broadcastBookingUpdated,
  broadcastBookingCancelled,
  broadcastNotification,
  broadcastGarageAvailability
} from '../sockets/socketManager.js';

export async function createBooking(req, res, next) {
  try {
    const {
      garageId,
      service,
      scheduledTime,
      vehicleDetails,
      notes,
      idempotencyKey,
      fogAssisted
    } = req.body;

    // Idempotency check: if key provided and already processed, return existing booking
    if (idempotencyKey) {
      const existing = await Booking.findOne({ idempotencyKey }).populate('garage', 'name address location contactPhone');
      if (existing) {
        return res.status(200).json({
          success: true,
          data: existing,
          isDuplicate: true,
          message: 'Retrieved existing booking for idempotency key.'
        });
      }
    }

    // Customer ID from authenticated user or fallback guest user
    const customerId = req.user ? req.user._id : req.body.customerId;
    if (!customerId) {
      return res.status(400).json({ success: false, message: 'Customer identifier is required.' });
    }

    const garage = await Garage.findById(garageId);
    if (!garage) {
      return res.status(404).json({ success: false, message: 'Garage not found.' });
    }

    if (!garage.isAvailable) {
      return res.status(400).json({
        success: false,
        message: 'Garage is currently marked unavailable for new bookings.'
      });
    }

    // Authoritative Concurrency & Capacity Constraint Check
    // Calculate 1-hour window around scheduled time
    const bookingTime = new Date(scheduledTime);
    const windowStart = new Date(bookingTime.getTime() - 45 * 60 * 1000);
    const windowEnd = new Date(bookingTime.getTime() + 45 * 60 * 1000);

    const activeBookingsCount = await Booking.countDocuments({
      garage: garageId,
      status: { $in: [BOOKING_STATUS.CONFIRMED, BOOKING_STATUS.IN_PROGRESS] },
      scheduledTime: { $gte: windowStart, $lte: windowEnd }
    });

    const activeBays = garage.capacity?.activeBays || 4;
    if (activeBookingsCount >= activeBays) {
      return res.status(409).json({
        success: false,
        message: `Capacity limit reached for selected time slot (${activeBookingsCount}/${activeBays} bays booked). Please choose another slot.`
      });
    }

    const bookingNumber = `BK-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    // Create booking
    const booking = await Booking.create({
      bookingNumber,
      customer: customerId,
      garage: garageId,
      service: {
        name: service.name,
        category: service.category,
        price: service.price,
        durationMinutes: service.durationMinutes || 60
      },
      scheduledTime: bookingTime,
      vehicleDetails,
      status: BOOKING_STATUS.CONFIRMED, // Authoritatively confirmed by central backend
      statusHistory: [
        {
          status: BOOKING_STATUS.CONFIRMED,
          timestamp: new Date(),
          changedBy: req.isFogService ? 'FogNode Service' : 'Cloud Backend',
          note: fogAssisted ? 'Booking routed via Regional Fog Node' : 'Direct Cloud Booking'
        }
      ],
      fogAssisted: !!fogAssisted,
      idempotencyKey,
      totalAmount: service.price,
      notes: notes || ''
    });

    // Populate garage details for response
    await booking.populate('garage', 'name address location contactPhone capacity currentOccupancy');

    // Create customer notification
    const customerNotification = await Notification.create({
      recipient: customerId,
      title: 'Booking Confirmed!',
      message: `Your appointment for ${service.name} at ${garage.name} is confirmed for ${bookingTime.toLocaleString()}.`,
      type: 'booking_confirmed',
      data: { bookingId: booking._id, bookingNumber: booking.bookingNumber }
    });

    // Fire Socket.IO real-time events
    broadcastBookingCreated(booking);
    broadcastNotification(customerId.toString(), customerNotification);

    // Update garage occupancy count
    garage.currentOccupancy = Math.min(garage.capacity.totalBays, (garage.currentOccupancy || 0) + 1);
    await garage.save();
    broadcastGarageAvailability(garageId.toString(), {
      garageId,
      isAvailable: garage.isAvailable,
      activeBays: garage.capacity.activeBays,
      currentOccupancy: garage.currentOccupancy,
      timestamp: new Date().toISOString()
    });

    res.status(201).json({
      success: true,
      data: booking,
      message: 'Booking authoritatively confirmed by Cloud Backend.'
    });
  } catch (err) {
    next(err);
  }
}

export async function getMyBookings(req, res, next) {
  try {
    const userId = req.user._id;
    let query = {};

    if (req.user.role === 'garage_owner') {
      const garage = await Garage.findOne({ ownerId: userId });
      if (garage) {
        query.garage = garage._id;
      } else {
        return res.json({ success: true, data: [] });
      }
    } else if (req.user.role === 'admin') {
      query = {}; // Admin can see all
    } else {
      query.customer = userId;
    }

    const bookings = await Booking.find(query)
      .populate('garage', 'name address location contactPhone rating')
      .populate('customer', 'name email phone')
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      data: bookings
    });
  } catch (err) {
    next(err);
  }
}

export async function getBookingById(req, res, next) {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('garage', 'name address location contactPhone')
      .populate('customer', 'name email phone');

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    res.json({
      success: true,
      data: booking
    });
  } catch (err) {
    next(err);
  }
}

export async function updateBookingStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status, note } = req.body;

    if (!Object.values(BOOKING_STATUS).includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid booking status.' });
    }

    const booking = await Booking.findById(id).populate('garage', 'name address contactPhone');
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    // Role check: customer can only cancel
    if (req.user.role === 'customer') {
      if (booking.customer.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: 'Forbidden.' });
      }
      if (status !== BOOKING_STATUS.CANCELLED) {
        return res.status(400).json({ success: false, message: 'Customers can only cancel appointments.' });
      }
    }

    const oldStatus = booking.status;
    booking.status = status;
    booking.statusHistory.push({
      status,
      timestamp: new Date(),
      changedBy: req.user ? req.user.name : 'System',
      note: note || `Status changed from ${oldStatus} to ${status}`
    });

    await booking.save();

    // Notification
    const notif = await Notification.create({
      recipient: booking.customer,
      title: `Booking Status: ${status.toUpperCase()}`,
      message: `Your booking #${booking.bookingNumber} at ${booking.garage?.name || 'Garage'} is now ${status}.`,
      type: 'status_update',
      data: { bookingId: booking._id, status }
    });

    if (status === BOOKING_STATUS.CANCELLED) {
      broadcastBookingCancelled(booking);
    } else {
      broadcastBookingUpdated(booking);
    }
    broadcastNotification(booking.customer.toString(), notif);

    res.json({
      success: true,
      data: booking
    });
  } catch (err) {
    next(err);
  }
}

