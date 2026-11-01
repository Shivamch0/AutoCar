import Garage from '../models/Garage.js';
import { kmToMeters, metersToKm } from '../utils/geoUtils.js';
import { broadcastGarageAvailability } from '../sockets/socketManager.js';

export async function getNearbyGarages(req, res, next) {
  try {
    const { latitude, longitude } = req.geoCoords;
    const radiusKm = req.radiusKm || 15;
    const radiusMeters = kmToMeters(radiusKm);

    const { category, minRating, isAvailable, search, page = 1, limit = 20, sortBy = 'distance' } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    // Build optional match filters
    const matchFilter = {};

    if (category && category !== 'All') {
      matchFilter['services.category'] = category;
    }

    if (minRating) {
      matchFilter.rating = { $gte: parseFloat(minRating) };
    }

    if (isAvailable !== undefined) {
      matchFilter.isAvailable = isAvailable === 'true';
    }

    if (search && search.trim() !== '') {
      matchFilter.name = { $regex: search.trim(), $options: 'i' };
    }

    const pipeline = [
      {
        $geoNear: {
          near: {
            type: 'Point',
            coordinates: [longitude, latitude] // [lng, lat]
          },
          distanceField: 'distanceMeters',
          maxDistance: radiusMeters,
          spherical: true,
          query: matchFilter
        }
      }
    ];

    // Sorting stage
    if (sortBy === 'rating') {
      pipeline.push({ $sort: { rating: -1, distanceMeters: 1 } });
    } else if (sortBy === 'price_asc') {
      pipeline.push({ $sort: { 'services.price': 1, distanceMeters: 1 } });
    } else {
      // Default: sort by proximity (already handled by $geoNear)
      pipeline.push({ $sort: { distanceMeters: 1 } });
    }

    // Count total matches
    const countPipeline = [...pipeline, { $count: 'total' }];
    const countResult = await Garage.aggregate(countPipeline);
    const totalCount = countResult.length > 0 ? countResult[0].total : 0;

    // Apply pagination
    pipeline.push({ $skip: skip }, { $limit: limitNum });

    const results = await Garage.aggregate(pipeline);

    // Format output with distanceKm and distanceMeters
    const garages = results.map((g) => ({
      ...g,
      distanceKm: metersToKm(g.distanceMeters),
      distanceMeters: Math.round(g.distanceMeters)
    }));

    res.json({
      success: true,
      data: garages,
      meta: {
        total: totalCount,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(totalCount / limitNum),
        radiusKm,
        center: {
          // Provide rounded/approximate center for UI confirmation without precision leakage
          lat: Math.round(latitude * 10000) / 10000,
          lng: Math.round(longitude * 10000) / 10000
        }
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function getAllGarages(req, res, next) {
  try {
    const { category, minRating, isAvailable, search, page = 1, limit = 20 } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10)));
    const filter = {};

    if (category && category !== 'All') {
      filter['services.category'] = category;
    }
    if (minRating) {
      filter.rating = { $gte: parseFloat(minRating) };
    }
    if (isAvailable !== undefined) {
      filter.isAvailable = isAvailable === 'true';
    }
    if (search && search.trim() !== '') {
      filter.name = { $regex: search.trim(), $options: 'i' };
    }

    const total = await Garage.countDocuments(filter);
    const garages = await Garage.find(filter)
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean();

    res.json({
      success: true,
      data: garages,
      meta: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function getGarageById(req, res, next) {
  try {
    const garage = await Garage.findById(req.params.id);
    if (!garage) {
      return res.status(404).json({ success: false, message: 'Garage not found' });
    }

    res.json({
      success: true,
      data: garage
    });
  } catch (err) {
    next(err);
  }
}

export async function createGarage(req, res, next) {
  try {
    const garageData = req.body;
    if (req.user && req.user.role === 'garage_owner') {
      garageData.ownerId = req.user._id;
    }

    const garage = await Garage.create(garageData);
    res.status(201).json({
      success: true,
      data: garage
    });
  } catch (err) {
    next(err);
  }
}

export async function updateGarageAvailability(req, res, next) {
  try {
    const { id } = req.params;
    const { isAvailable, activeBays, currentOccupancy } = req.body;

    const garage = await Garage.findById(id);
    if (!garage) {
      return res.status(404).json({ success: false, message: 'Garage not found' });
    }

    if (isAvailable !== undefined) garage.isAvailable = isAvailable;
    if (activeBays !== undefined) garage.capacity.activeBays = activeBays;
    if (currentOccupancy !== undefined) garage.currentOccupancy = currentOccupancy;

    await garage.save();

    const payload = {
      garageId: garage._id,
      isAvailable: garage.isAvailable,
      activeBays: garage.capacity.activeBays,
      currentOccupancy: garage.currentOccupancy,
      timestamp: new Date().toISOString()
    };

    // Emit live Socket.IO update
    broadcastGarageAvailability(garage._id.toString(), payload);

    res.json({
      success: true,
      data: garage
    });
  } catch (err) {
    next(err);
  }
}

