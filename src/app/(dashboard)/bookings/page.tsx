import { createServerClient } from '@/lib/supabase/server';
import { BookingsClient } from './BookingsClient';
import { Database } from '@/lib/supabase/types';

type Booking = Database['public']['Tables']['bookings']['Row'] & {
  rooms: Pick<Database['public']['Tables']['rooms']['Row'], 'room_number' | 'room_type'> | null;
  customers: Pick<Database['public']['Tables']['customers']['Row'], 'name' | 'phone' | 'email'> | null;
};

export default async function BookingsPage() {
  const supabase = await createServerClient();
  const { data: bookings, error } = await supabase
    .from('bookings')
    .select(`
      *,
      rooms (
        room_number,
        room_type
      ),
      customers (
        name,
        phone,
        email
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    return <p className="text-red-500 p-4">Error loading bookings: {error.message}</p>;
  }

  return <BookingsClient initialBookings={bookings as Booking[]} />;
} 