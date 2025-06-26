"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { getBookingStatusConfig } from '@/lib/utils/hotel';
import { Database } from '@/lib/supabase/types';
import { ArrowLeft } from 'lucide-react';

interface Props {
  booking: Database['public']['Tables']['bookings']['Row'] & {
    rooms: Database['public']['Tables']['rooms']['Row'] | null;
    customers: Database['public']['Tables']['customers']['Row'] | null;
    booking_guests?: {
      customers: Database['public']['Tables']['customers']['Row'];
      is_primary: boolean;
    }[];
  };
}

export default function BookingDetailsClient({ booking }: Props) {
  const router = useRouter();
  const statusConfig = getBookingStatusConfig(booking.booking_status);

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => router.back()} className="flex items-center gap-2">
        <ArrowLeft className="w-4 h-4" /> Back to Bookings
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Booking #{booking.booking_number}</span>
            <Badge className={statusConfig.color}>
              {statusConfig.icon} {statusConfig.label}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-gray-600">Guest</p>
              <p className="font-medium">{booking.customers?.name}</p>
              <p className="text-gray-500 text-sm">{booking.customers?.phone}</p>
            </div>
            <div>
              <p className="text-gray-600">Room</p>
              <p className="font-medium">{booking.rooms?.room_number}</p>
              <p className="text-gray-500 text-sm capitalize">{booking.rooms?.room_type?.replace('-', ' ')}</p>
            </div>
            <div>
              <p className="text-gray-600">Stay</p>
              <p className="font-medium">
                {new Date(booking.check_in_date).toLocaleDateString()} to {new Date(booking.check_out_date).toLocaleDateString()}
              </p>
              <p className="text-gray-500 text-sm">{booking.total_nights} nights</p>
            </div>
            <div>
              <p className="text-gray-600">Amount</p>
              <p className="font-medium">₹{booking.total_amount.toLocaleString('en-IN')}</p>
              <p className="text-gray-500 text-sm">Paid: ₹{booking.paid_amount.toLocaleString('en-IN')}</p>
            </div>
          </div>

          {booking.booking_guests && booking.booking_guests.length > 0 && (
            <div>
              <p className="text-gray-600 mb-2">Additional Guests</p>
              <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                {booking.booking_guests
                  .filter((g) => !g.is_primary)
                  .map((g) => (
                    <li key={g.customers.id}>{g.customers.name}</li>
                  ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 