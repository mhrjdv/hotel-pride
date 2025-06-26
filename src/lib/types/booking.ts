import { Database } from '@/lib/supabase/types';

export type Room = Database['public']['Tables']['rooms']['Row'];
export type Customer = Database['public']['Tables']['customers']['Row'];
export type Booking = Database['public']['Tables']['bookings']['Row'];

export interface BookingData {
  room?: Room;
  checkInDate?: string;
  checkOutDate?: string;
  totalNights?: number;
  totalGuests?: number;
  adults?: number;
  children?: number;
  primaryGuest?: Customer;
  additionalGuests?: Customer[];
  roomRate?: number;
  customRoomRate?: number;
  useCustomRate?: boolean;
  gstMode?: 'inclusive' | 'exclusive' | 'none';
  extraBeds?: {
    quantity: number;
    ratePerBed: number;
  };
  additionalCharges?: { description: string; amount: number }[];
  baseAmount?: number;
  gstAmount?: number;
  totalAmount?: number;
  specialRequests?: string;
  paymentMethod?: 'cash' | 'card' | 'upi' | 'bank_transfer';
  paymentAmount?: number;
  referenceNumber?: string;
  paymentNotes?: string;
  bookingSource?: 'walk_in' | 'phone' | 'online' | 'agent';
} 