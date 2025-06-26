/**
 * Hotel Operations Utilities
 * Common functions for managing hotel operations, room status, and bookings
 */

import { addDays, differenceInDays, format } from 'date-fns';
import { Database } from '../supabase/types';

// Type aliases for better readability
type Room = Database['public']['Tables']['rooms']['Row'];
type Booking = Database['public']['Tables']['bookings']['Row'];
type Customer = Database['public']['Tables']['customers']['Row'];

export interface RoomAvailability {
  room: Room;
  isAvailable: boolean;
  currentBooking?: Booking;
  nextBooking?: Booking;
}

/**
 * Generate a unique booking number
 * Format: BK-YYYYMMDD-XXXX (e.g., BK-20241215-0001)
 */
export function generateBookingNumber(): string {
  const today = new Date();
  const dateStr = format(today, 'yyyyMMdd');
  const randomSuffix = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
  return `BK-${dateStr}-${randomSuffix}`;
}

/**
 * Calculate the number of nights between check-in and check-out dates
 * @param checkIn - Check-in date
 * @param checkOut - Check-out date
 * @returns Number of nights
 */
export function calculateNights(checkIn: string | Date, checkOut: string | Date): number {
  const checkInDate = typeof checkIn === 'string' ? new Date(checkIn) : checkIn;
  const checkOutDate = typeof checkOut === 'string' ? new Date(checkOut) : checkOut;
  
  return differenceInDays(checkOutDate, checkInDate);
}

/**
 * Check if two date ranges overlap
 * @param start1 - Start of first range
 * @param end1 - End of first range
 * @param start2 - Start of second range
 * @param end2 - End of second range
 * @returns True if ranges overlap
 */
export function dateRangesOverlap(
  start1: Date,
  end1: Date,
  start2: Date,
  end2: Date
): boolean {
  return start1 < end2 && start2 < end1;
}

/**
 * Get room type display name with proper formatting
 * @param roomType - Room type from database
 * @returns Formatted display name
 */
export function getRoomTypeDisplay(roomType: Room['room_type']): string {
  const typeMap: Record<Room['room_type'], string> = {
    'ac-2bed': 'AC 2-Bed',
    'non-ac-2bed': 'Non-AC 2-Bed',
    'ac-3bed': 'AC 3-Bed',
    'non-ac-3bed': 'Non-AC 3-Bed',
    'vip-ac': 'VIP AC Suite',
    'vip-non-ac': 'VIP Non-AC Suite'
  };
  
  return typeMap[roomType] || roomType;
}

/**
 * Get room status display configuration
 * @param status - Room status from database
 * @returns Status configuration with colors and icons
 */
export function getRoomStatusConfig(status: Room['status']) {
  const statusConfig = {
    available: {
      label: 'Available',
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      text: 'text-emerald-800',
      icon: '✅',
      description: 'Ready for new guests'
    },
    occupied: {
      label: 'Occupied',
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-800',
      icon: '🏠',
      description: 'Currently occupied by guests'
    },
    cleaning: {
      label: 'Cleaning',
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      text: 'text-amber-800',
      icon: '🧹',
      description: 'Being cleaned and prepared'
    },
    maintenance: {
      label: 'Maintenance',
      bg: 'bg-orange-50',
      border: 'border-orange-200',
      text: 'text-orange-800',
      icon: '🔧',
      description: 'Under maintenance or repair'
    },
    blocked: {
      label: 'Blocked',
      bg: 'bg-gray-50',
      border: 'border-gray-200',
      text: 'text-gray-800',
      icon: '🚫',
      description: 'Temporarily unavailable'
    }
  };
  
  return statusConfig[status] || statusConfig.available;
}

/**
 * Get payment status display configuration
 * @param status - Payment status from database
 * @returns Status configuration with colors and labels
 */
export function getPaymentStatusConfig(status: Booking['payment_status']) {
  const statusConfig = {
    pending: {
      label: 'Pending',
      color: 'bg-amber-50 border-amber-200 text-amber-800',
      icon: '⏳'
    },
    partial: {
      label: 'Partial',
      color: 'bg-blue-50 border-blue-200 text-blue-800',
      icon: '💰'
    },
    paid: {
      label: 'Paid',
      color: 'bg-emerald-50 border-emerald-200 text-emerald-800',
      icon: '✅'
    },
    refunded: {
      label: 'Refunded',
      color: 'bg-red-50 border-red-200 text-red-800',
      icon: '↩️'
    }
  };
  
  return statusConfig[status] || statusConfig.pending;
}

/**
 * Get booking status configuration for display
 * @param status - Booking status
 * @returns Status configuration with label, color, and icon
 */
export function getBookingStatusConfig(status: string) {
  const configs = {
    confirmed: {
      label: 'Confirmed',
      color: 'bg-blue-100 text-blue-800',
      icon: '✓',
      description: 'Booking confirmed, awaiting check-in'
    },
    checked_in: {
      label: 'Checked In',
      color: 'bg-green-100 text-green-800',
      icon: '🏠',
      description: 'Guest has checked in'
    },
    checked_out: {
      label: 'Checked Out',
      color: 'bg-gray-100 text-gray-800',
      icon: '✅',
      description: 'Guest has checked out'
    },
    cancelled: {
      label: 'Cancelled',
      color: 'bg-red-100 text-red-800',
      icon: '❌',
      description: 'Booking cancelled'
    },
    no_show: {
      label: 'No Show',
      color: 'bg-orange-100 text-orange-800',
      icon: '⚠️',
      description: 'Guest did not show up'
    },
    pending: {
      label: 'Pending',
      color: 'bg-yellow-100 text-yellow-800',
      icon: '⏳',
      description: 'Booking pending confirmation'
    }
  };

  return configs[status as keyof typeof configs] || {
    label: status,
    color: 'bg-gray-100 text-gray-800',
    icon: '❓',
    description: 'Unknown status'
  };
}

/**
 * Get Indian ID type display name
 * @param idType - ID type from database
 * @returns Formatted display name
 */
export function getIdTypeDisplay(idType: Customer['id_type']): string {
  const typeMap: Record<Customer['id_type'], string> = {
    aadhaar: 'Aadhaar Card',
    pan: 'PAN Card',
    passport: 'Passport',
    driving_license: 'Driving License',
    voter_id: 'Voter ID'
  };
  
  return typeMap[idType] || idType;
}

/**
 * Format Indian phone number for display
 * @param phone - Phone number
 * @returns Formatted phone number
 */
export function formatPhoneNumber(phone: string): string {
  // Remove +91 if present and format as +91 XXXXX XXXXX
  const cleanNumber = phone.replace(/^\+91/, '');
  if (cleanNumber.length === 10) {
    return `+91 ${cleanNumber.slice(0, 5)} ${cleanNumber.slice(5)}`;
  }
  return phone;
}

/**
 * Validate Indian phone number format
 * @param phone - Phone number to validate
 * @returns True if valid
 */
export function isValidIndianPhone(phone: string): boolean {
  const phoneRegex = /^\+91[6-9]\d{9}$/;
  return phoneRegex.test(phone);
}

/**
 * Generate date range for reports and filtering
 * @param period - Period type
 * @returns Date range object
 */
export function generateDateRange(period: 'today' | 'week' | 'month' | 'year') {
  const today = new Date();
  const startOfDay = new Date(today);
  startOfDay.setHours(0, 0, 0, 0);
  
  switch (period) {
    case 'today':
      return {
        start: startOfDay,
        end: new Date(today.setHours(23, 59, 59, 999))
      };
    case 'week':
      const startOfWeek = new Date(startOfDay);
      startOfWeek.setDate(today.getDate() - today.getDay());
      return {
        start: startOfWeek,
        end: addDays(startOfWeek, 6)
      };
    case 'month':
      return {
        start: new Date(today.getFullYear(), today.getMonth(), 1),
        end: new Date(today.getFullYear(), today.getMonth() + 1, 0)
      };
    case 'year':
      return {
        start: new Date(today.getFullYear(), 0, 1),
        end: new Date(today.getFullYear(), 11, 31)
      };
    default:
      return { start: startOfDay, end: today };
  }
}

/**
 * Calculate occupancy rate
 * @param totalRooms - Total number of rooms
 * @param occupiedRooms - Number of occupied rooms
 * @returns Occupancy rate as percentage
 */
export function calculateOccupancyRate(totalRooms: number, occupiedRooms: number): number {
  if (totalRooms === 0) return 0;
  return Math.round((occupiedRooms / totalRooms) * 100);
}

/**
 * Generate room amenities list for display
 * @param amenities - Array of amenity strings
 * @returns Formatted amenities list
 */
export function formatAmenities(amenities: string[] | null): string {
  if (!amenities || amenities.length === 0) {
    return 'Basic amenities';
  }
  
  return amenities.join(', ');
}

/**
 * Check if a date is in the past
 * @param date - Date to check
 * @returns True if date is in the past
 */
export function isDateInPast(date: string | Date): boolean {
  const checkDate = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return checkDate < today;
}

/**
 * Get next available room number for a specific type
 * @param existingRooms - Array of existing rooms
 * @param roomType - Type of room
 * @returns Next available room number
 */
export function getNextRoomNumber(existingRooms: Room[], roomType: Room['room_type']): string {
  const typePrefix: Record<Room['room_type'], string> = {
    'ac-2bed': 'A2',
    'non-ac-2bed': 'N2',
    'ac-3bed': 'A3',
    'non-ac-3bed': 'N3',
    'vip-ac': 'V',
    'vip-non-ac': 'VN'
  };
  
  const prefix = typePrefix[roomType];
  const existingNumbers = existingRooms
    .filter(room => room.room_number.startsWith(prefix))
    .map(room => parseInt(room.room_number.replace(prefix, '')) || 0);
  
  const nextNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1;
  return `${prefix}${nextNumber.toString().padStart(2, '0')}`;
} 