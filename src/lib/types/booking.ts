import { Database } from '@/lib/supabase/types';

export type Room = Database['public']['Tables']['rooms']['Row'];
export type Customer = Database['public']['Tables']['customers']['Row'];
export type Booking = Database['public']['Tables']['bookings']['Row'];

export interface BookingData {
  // Booking & Room Details
  bookingId?: string;
  roomId?: string;
  roomNumber?: string;
  roomType?: 'double-bed-deluxe' | 'vip' | 'executive-3bed';
  checkInDate?: string;
  checkInTime?: string;
  checkOutDate?: string;
  checkOutTime?: string;
  totalNights?: number;
  
  // Guest Details
  customerId?: string;
  primaryGuestName?: string;
  adults?: number;
  children?: number;
  totalGuests?: number;

  // Pricing Details
  rate?: number;
  acPreference?: boolean;
  isGstInclusive?: boolean;
  gstRate?: number; // e.g., 0.12 for 12%
  extraBeds?: {
    quantity: number;
    ratePerBed: number;
  };
  discount?: {
    amount: number;
    reason: string;
  };
  
  // Payment Details
  paymentAmount?: number;
  paymentNotes?: string;
  
  // Payment & Charge Details
  useCustomRate?: boolean;
  customRoomRate?: number;
  additionalCharges?: { description: string; amount: number }[];
  gstMode?: 'inclusive' | 'exclusive' | 'none';
  baseAmount?: number;
  specialRequests?: string;
  paymentMethod?: 'cash' | 'card' | 'upi' | 'bank_transfer';
  referenceNumber?: string;
  
  // Final Calculation
  subTotal?: number;
  gstAmount?: number;
  totalAmount?: number;
  
  // Relational Objects
  room?: Room;
  primaryGuest?: Customer;
  additionalGuests?: Customer[];
  customer?: Customer;
} 