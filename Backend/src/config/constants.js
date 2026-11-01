export const ROLES = {
  CUSTOMER: 'customer',
  GARAGE_OWNER: 'garage_owner',
  ADMIN: 'admin'
};

export const BOOKING_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

export const SERVICE_CATEGORIES = [
  'General Service',
  'Oil & Filter Change',
  'Brake Repair',
  'Tire Replacement & Balancing',
  'Engine Diagnostics',
  'Battery & Electrical',
  'Air Conditioning',
  'Bodywork & Detailing'
];

export const SOCKET_EVENTS = {
  BOOKING_CREATED: 'booking:created',
  BOOKING_UPDATED: 'booking:updated',
  BOOKING_CANCELLED: 'booking:cancelled',
  GARAGE_AVAILABILITY_UPDATED: 'garage:availabilityUpdated',
  NOTIFICATION_NEW: 'notification:new',
  FOG_STATUS_UPDATED: 'fog:statusUpdated'
};

export const DEFAULT_SEARCH_RADIUS_KM = 15;
export const MAX_SEARCH_RADIUS_KM = 50;

