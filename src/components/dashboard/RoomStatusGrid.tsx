'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { getRoomStatusConfig } from '@/lib/utils/hotel';
import { Database } from '@/lib/supabase/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, User, Phone, Calendar, ArrowRight } from '@/components/icons';

type Room = Database['public']['Tables']['rooms']['Row'];
type RoomStatus = Room['status'];

type ActiveBooking = {
  bookingNumber: string;
  checkIn: string;
  checkOut: string;
  guestName: string | null;
  guestPhone: string | null;
};

const STATUS_DOT: Record<RoomStatus, string> = {
  available: 'bg-emerald-500',
  occupied: 'bg-red-500',
  cleaning: 'bg-amber-500',
  maintenance: 'bg-orange-500',
  blocked: 'bg-gray-400',
};

const LEGEND: { label: string; status: RoomStatus }[] = [
  { label: 'Available', status: 'available' },
  { label: 'Occupied', status: 'occupied' },
  { label: 'Cleaning', status: 'cleaning' },
  { label: 'Maintenance', status: 'maintenance' },
];

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

type RoomStatusGridProps = {
  rooms: Room[];
};

export function RoomStatusGrid({ rooms }: RoomStatusGridProps) {
  const router = useRouter();

  const [activeRoom, setActiveRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState<ActiveBooking | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sortedRooms = useMemo(
    () =>
      [...rooms].sort((a, b) =>
        a.room_number.localeCompare(b.room_number, undefined, { numeric: true })
      ),
    [rooms]
  );

  const openOccupant = async (room: Room) => {
    setActiveRoom(room);
    setBooking(null);
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { data, error: queryError } = await supabase
      .from('bookings')
      .select('booking_number, check_in_date, check_out_date, customers(name, phone)')
      .eq('room_id', room.id)
      .eq('booking_status', 'checked_in')
      .order('check_in_date', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (queryError) {
      setError('Could not load booking details.');
    } else if (data) {
      const customerRel = data.customers as
        | { name: string | null; phone: string | null }
        | { name: string | null; phone: string | null }[]
        | null;
      const customer = Array.isArray(customerRel) ? customerRel[0] ?? null : customerRel;
      setBooking({
        bookingNumber: data.booking_number,
        checkIn: data.check_in_date,
        checkOut: data.check_out_date,
        guestName: customer?.name ?? null,
        guestPhone: customer?.phone ?? null,
      });
    }
    setLoading(false);
  };

  const handleRoomClick = (room: Room) => {
    if (room.status === 'available') {
      router.push(`/bookings?new=1&room=${encodeURIComponent(room.room_number)}`);
      return;
    }
    if (room.status === 'occupied') {
      void openOccupant(room);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-6 gap-2 sm:grid-cols-9 lg:grid-cols-12">
        {sortedRooms.map((room) => {
          const config = getRoomStatusConfig(room.status);
          const interactive = room.status === 'available' || room.status === 'occupied';
          const actionHint =
            room.status === 'available'
              ? 'start a booking'
              : room.status === 'occupied'
                ? 'view occupant'
                : config.label.toLowerCase();
          return (
            <button
              key={room.id}
              type="button"
              onClick={() => handleRoomClick(room)}
              disabled={!interactive}
              aria-label={`Room ${room.room_number}, ${config.label}${
                interactive ? `. Click to ${actionHint}` : ''
              }`}
              title={`Room ${room.room_number} · ${config.label}`}
              className={`flex aspect-square flex-col items-center justify-center rounded-lg border ${config.bg} ${config.border} ${config.text} transition focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 ${
                interactive ? 'cursor-pointer hover:scale-105' : 'cursor-default opacity-80'
              }`}
            >
              <span className="text-xs font-bold leading-none">{room.room_number}</span>
              <span className={`mt-1 h-1.5 w-1.5 rounded-full ${STATUS_DOT[room.status]}`} aria-hidden />
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 border-t pt-3">
        {LEGEND.map((l) => (
          <div key={l.status} className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className={`h-3 w-3 rounded-sm ${STATUS_DOT[l.status]}`} aria-hidden />
            {l.label}
          </div>
        ))}
      </div>

      <Dialog open={!!activeRoom} onOpenChange={(open) => !open && setActiveRoom(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Room {activeRoom?.room_number}</DialogTitle>
            <DialogDescription>Current occupancy details</DialogDescription>
          </DialogHeader>

          {loading ? (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading booking…
            </div>
          ) : error ? (
            <p className="py-6 text-sm text-destructive">{error}</p>
          ) : booking ? (
            <div className="space-y-3 py-2 text-sm">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{booking.guestName ?? 'Unknown guest'}</span>
              </div>
              {booking.guestPhone ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  <span>{booking.guestPhone}</span>
                </div>
              ) : null}
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>
                  {formatDate(booking.checkIn)} → {formatDate(booking.checkOut)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">Booking #{booking.bookingNumber}</p>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => router.push('/bookings')}
              >
                View bookings <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          ) : (
            <p className="py-6 text-sm text-muted-foreground">No active booking.</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
