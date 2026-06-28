'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Search,
  Snowflake,
  Wind,
  Loader2,
  AlertCircle,
  Check,
  BedDouble,
  Users as UsersIcon,
  RotateCw,
} from '@/components/icons';
import { createClient } from '@/lib/supabase/client';

import { BookingData } from '@/lib/types/booking';
import { useLogger } from '@/lib/utils/logger';
import { Database } from '@/lib/supabase/types';

type RoomTable = Database['public']['Tables']['rooms']['Row'];

// Default value, can be moved to hotel config later
const DEFAULT_EXTRA_BED_RATE = 500;

interface RoomSelectionProps {
  bookingData: BookingData;
  onDataChange: (data: Partial<BookingData>) => void;
  customerId?: string;
}

const TIME_OPTIONS: { value: string; label: string }[] = [
  '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00',
  '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00', '23:00',
].map((value) => {
  const [h] = value.split(':');
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const display = hour % 12 === 0 ? 12 : hour % 12;
  return { value, label: `${String(display).padStart(2, '0')}:00 ${ampm}` };
});

const getRoomTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    'double-bed-deluxe': 'Double Bed Deluxe',
    'executive-3bed': 'Executive 3-Bed',
    'vip': 'VIP Suite',
  };
  return labels[type] || type;
};

const computeNights = (checkIn?: string, checkOut?: string): number => {
  if (!checkIn || !checkOut) return 1;
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(1, diffDays);
};

const getRoomRate = (room: RoomTable, acPreference: boolean): number =>
  acPreference ? (room.ac_rate ?? room.current_rate) : (room.non_ac_rate ?? room.current_rate);

const RoomSelection: React.FC<RoomSelectionProps> = ({ bookingData, onDataChange }) => {
  const { info, error: logError, bookingAction } = useLogger('RoomSelection');
  const [availableRooms, setAvailableRooms] = useState<RoomTable[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<RoomTable | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [defaultsSet, setDefaultsSet] = useState(false);
  const [search, setSearch] = useState('');
  const today = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Create Supabase client only once to avoid recreating on every render (prevents effect loops)
  const supabase = useMemo(() => createClient(), []);

  // Set default values only once when component mounts
  useEffect(() => {
    if (defaultsSet) return;

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const defaultData: Partial<BookingData> = {};

    if (!bookingData.checkInDate) defaultData.checkInDate = today;
    if (!bookingData.checkOutDate) defaultData.checkOutDate = tomorrow.toISOString().split('T')[0];
    if (!bookingData.checkInTime) defaultData.checkInTime = '14:00';
    if (!bookingData.checkOutTime) defaultData.checkOutTime = '12:00';
    if (!bookingData.roomType) defaultData.roomType = 'double-bed-deluxe';
    if (!bookingData.adults) defaultData.adults = 1;
    if (!bookingData.children) defaultData.children = 0;
    if (!bookingData.totalGuests) defaultData.totalGuests = 1;
    if (bookingData.acPreference === undefined) defaultData.acPreference = false;

    if (Object.keys(defaultData).length > 0) {
      defaultData.totalNights = computeNights(
        defaultData.checkInDate ?? bookingData.checkInDate,
        defaultData.checkOutDate ?? bookingData.checkOutDate,
      );
      onDataChange(defaultData);
    }
    setDefaultsSet(true);
  }, [defaultsSet, bookingData, onDataChange, today]);

  const { checkInDate, checkInTime, checkOutDate, checkOutTime, roomType } = bookingData;

  const fetchAvailableRooms = useCallback(async () => {
    if (!checkInDate || !checkInTime || !checkOutDate || !checkOutTime || !roomType) {
      setAvailableRooms([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setFetchError(null);

    try {
      const formatTime = (time: string) =>
        time.includes(':') && time.split(':').length === 2 ? `${time}:00` : time;

      const params = {
        p_check_in_date: checkInDate,
        p_check_in_time: formatTime(checkInTime),
        p_check_out_date: checkOutDate,
        p_check_out_time: formatTime(checkOutTime),
        p_room_type: roomType,
      };

      const { data, error } = await supabase.rpc('get_available_rooms', params);

      if (error) {
        logError('Failed to fetch available rooms', error);
        setFetchError(error.message || 'Failed to fetch available rooms.');
        setAvailableRooms([]);
      } else {
        const fetchedRooms = (data as RoomTable[]) || [];
        info(`Fetched ${fetchedRooms.length} rooms`);
        setAvailableRooms(fetchedRooms);
      }
    } catch (err) {
      logError('Unexpected error fetching rooms', err);
      setFetchError('An unexpected error occurred while fetching rooms.');
      setAvailableRooms([]);
    } finally {
      setIsLoading(false);
    }
  }, [checkInDate, checkInTime, checkOutDate, checkOutTime, roomType, supabase, info, logError]);

  // Debounced refetch when params change so rapid edits don't spam the RPC.
  const fetchRef = useRef(fetchAvailableRooms);
  fetchRef.current = fetchAvailableRooms;

  useEffect(() => {
    if (!defaultsSet) return;
    if (!checkInDate || !checkInTime || !checkOutDate || !checkOutTime || !roomType) return;

    setIsLoading(true);
    const handle = setTimeout(() => {
      fetchRef.current();
    }, 300);

    return () => clearTimeout(handle);
  }, [defaultsSet, checkInDate, checkInTime, checkOutDate, checkOutTime, roomType]);

  // Clear the selected room if it is no longer in the available list.
  useEffect(() => {
    if (isLoading) return;
    if (bookingData.roomId && availableRooms.length > 0 && !availableRooms.some((r) => r.id === bookingData.roomId)) {
      onDataChange({
        roomId: undefined,
        roomNumber: undefined,
        room: undefined,
        rate: 0,
        extraBeds: { quantity: 0, ratePerBed: 0 },
      });
      setSelectedRoom(null);
    }
  }, [availableRooms, bookingData.roomId, isLoading, onDataChange]);

  // Keep the selectedRoom object in sync with roomId.
  useEffect(() => {
    if (bookingData.roomId && availableRooms.length > 0) {
      setSelectedRoom(availableRooms.find((r) => r.id === bookingData.roomId) || null);
    } else {
      setSelectedRoom(null);
    }
  }, [bookingData.roomId, availableRooms]);

  const handleDateChange = (field: 'checkInDate' | 'checkOutDate', value: string) => {
    const updatedData: Partial<BookingData> = { [field]: value };

    if (field === 'checkInDate' && bookingData.checkOutDate && new Date(value) > new Date(bookingData.checkOutDate)) {
      updatedData.checkOutDate = value;
    }

    const checkIn = field === 'checkInDate' ? value : bookingData.checkInDate;
    const checkOut = updatedData.checkOutDate ?? (field === 'checkOutDate' ? value : bookingData.checkOutDate);
    updatedData.totalNights = computeNights(checkIn, checkOut);

    onDataChange(updatedData);
  };

  const handleTimeChange = (field: 'checkInTime' | 'checkOutTime', value: string) => {
    onDataChange({ [field]: value });
  };

  const handleRoomTypeChange = (value: string) => {
    bookingAction('Room Type Changed');
    onDataChange({
      roomType: value as BookingData['roomType'],
      roomId: undefined,
      roomNumber: undefined,
      room: undefined,
      rate: 0,
    });
  };

  const handleRoomChange = (roomId: string) => {
    const room = availableRooms.find((r) => r.id === roomId);
    if (!room) return;

    bookingAction(`Room ${room.room_number} Selected`);
    setSelectedRoom(room);

    const acPreference = bookingData.acPreference || false;
    onDataChange({
      roomId: room.id,
      roomNumber: room.room_number,
      room,
      rate: getRoomRate(room, acPreference),
      extraBeds: { quantity: 0, ratePerBed: DEFAULT_EXTRA_BED_RATE },
    });
  };

  const handleACPreferenceChange = (acPreference: boolean) => {
    if (selectedRoom) {
      onDataChange({ acPreference, rate: getRoomRate(selectedRoom, acPreference) });
    } else {
      onDataChange({ acPreference });
    }
  };

  const handleGuestCountChange = (field: 'adults' | 'children', value: number) => {
    const safeValue = Number.isNaN(value) ? 0 : value;
    const updatedData: Partial<BookingData> = { [field]: safeValue };
    const adults = field === 'adults' ? safeValue : (bookingData.adults || 1);
    const children = field === 'children' ? safeValue : (bookingData.children || 0);
    updatedData.totalGuests = adults + children;
    onDataChange(updatedData);
  };

  const handleExtraBedQuantityChange = (quantity: number) => {
    if (!selectedRoom) return;
    if (quantity < 0 || Number.isNaN(quantity)) return;
    onDataChange({
      extraBeds: {
        quantity,
        ratePerBed: bookingData.extraBeds?.ratePerBed || DEFAULT_EXTRA_BED_RATE,
      },
    });
  };

  const handleExtraBedRateChange = (rate: number) => {
    if (rate < 0 || Number.isNaN(rate)) return;
    onDataChange({
      extraBeds: {
        quantity: bookingData.extraBeds?.quantity || 0,
        ratePerBed: rate,
      },
    });
  };

  const acPreference = bookingData.acPreference || false;
  const totalGuests = (bookingData.adults || 1) + (bookingData.children || 0);

  const filteredRooms = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return availableRooms;
    return availableRooms.filter((r) => r.room_number.toLowerCase().includes(q));
  }, [availableRooms, search]);

  const maxExtraBeds = selectedRoom ? Math.max(0, selectedRoom.max_occupancy - totalGuests) : 0;
  const showExtraBeds = !!selectedRoom && !!selectedRoom.allow_extra_bed && maxExtraBeds > 0;

  return (
    <div className="space-y-5">
      {/* Stay details mini-form */}
      <section className="rounded-lg border bg-card p-4 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-foreground">Stay Details</h2>
          {bookingData.totalNights ? (
            <Badge variant="secondary" className="text-xs">
              {bookingData.totalNights} night{bookingData.totalNights > 1 ? 's' : ''}
            </Badge>
          ) : null}
        </div>

        {/* Row 1: dates & times */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="space-y-1.5">
            <Label htmlFor="check-in-date" className="text-xs">Check-in Date</Label>
            <Input
              id="check-in-date"
              type="date"
              min={today}
              value={bookingData.checkInDate || ''}
              onChange={(e) => handleDateChange('checkInDate', e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="check-in-time" className="text-xs">Check-in Time</Label>
            <Select value={bookingData.checkInTime || ''} onValueChange={(v) => handleTimeChange('checkInTime', v)}>
              <SelectTrigger id="check-in-time" className="w-full">
                <SelectValue placeholder="Time" />
              </SelectTrigger>
              <SelectContent>
                {TIME_OPTIONS.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="check-out-date" className="text-xs">Check-out Date</Label>
            <Input
              id="check-out-date"
              type="date"
              min={bookingData.checkInDate || today}
              value={bookingData.checkOutDate || ''}
              onChange={(e) => handleDateChange('checkOutDate', e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="check-out-time" className="text-xs">Check-out Time</Label>
            <Select value={bookingData.checkOutTime || ''} onValueChange={(v) => handleTimeChange('checkOutTime', v)}>
              <SelectTrigger id="check-out-time" className="w-full">
                <SelectValue placeholder="Time" />
              </SelectTrigger>
              <SelectContent>
                {TIME_OPTIONS.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Row 2: room type, AC toggle, guests */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="space-y-1.5">
            <Label htmlFor="room-type" className="text-xs">Room Type</Label>
            <Select value={bookingData.roomType || ''} onValueChange={handleRoomTypeChange}>
              <SelectTrigger id="room-type" className="w-full">
                <SelectValue placeholder="Room type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="double-bed-deluxe">Double Bed Deluxe</SelectItem>
                <SelectItem value="executive-3bed">Executive 3-Bed</SelectItem>
                <SelectItem value="vip">VIP Suite</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">AC Preference</Label>
            <div className="inline-flex h-9 w-full overflow-hidden rounded-md border" role="group" aria-label="AC preference">
              <button
                type="button"
                aria-pressed={!acPreference}
                onClick={() => handleACPreferenceChange(false)}
                className={`flex flex-1 items-center justify-center gap-1 text-xs font-medium transition-colors ${
                  !acPreference ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground hover:bg-muted'
                }`}
              >
                <Wind className="h-3.5 w-3.5" aria-hidden="true" />
                Non-AC
              </button>
              <button
                type="button"
                aria-pressed={acPreference}
                onClick={() => handleACPreferenceChange(true)}
                className={`flex flex-1 items-center justify-center gap-1 text-xs font-medium transition-colors ${
                  acPreference ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground hover:bg-muted'
                }`}
              >
                <Snowflake className="h-3.5 w-3.5" aria-hidden="true" />
                AC
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="adults" className="text-xs">Adults</Label>
            <Input
              id="adults"
              type="number"
              min={1}
              max={10}
              value={bookingData.adults ?? 1}
              onChange={(e) => handleGuestCountChange('adults', parseInt(e.target.value, 10))}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="children" className="text-xs">Children</Label>
            <Input
              id="children"
              type="number"
              min={0}
              max={10}
              value={bookingData.children ?? 0}
              onChange={(e) => handleGuestCountChange('children', parseInt(e.target.value, 10))}
            />
          </div>
        </div>
      </section>

      {/* Available rooms */}
      <section className="rounded-lg border bg-card p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-foreground">
            Available Rooms
            {!isLoading && availableRooms.length > 0 ? (
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                {filteredRooms.length} of {availableRooms.length}
              </span>
            ) : null}
          </h2>
          <div className="relative w-full sm:w-48">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              type="search"
              aria-label="Search rooms by number"
              placeholder="Search room #"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 pl-8"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-2" aria-busy="true" aria-live="polite">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex animate-pulse items-center justify-between rounded-md border p-3">
                <div className="space-y-2">
                  <div className="h-3 w-24 rounded bg-muted" />
                  <div className="h-2.5 w-32 rounded bg-muted" />
                </div>
                <div className="h-4 w-16 rounded bg-muted" />
              </div>
            ))}
            <div className="flex items-center justify-center gap-2 pt-1 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              Loading available rooms…
            </div>
          </div>
        ) : fetchError ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <AlertCircle className="h-8 w-8 text-destructive" aria-hidden="true" />
            <div>
              <p className="text-sm font-medium text-foreground">Could not load rooms</p>
              <p className="mt-1 text-xs text-muted-foreground">{fetchError}</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => fetchAvailableRooms()}>
              <RotateCw className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
              Retry
            </Button>
          </div>
        ) : availableRooms.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <AlertCircle className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
            <p className="text-sm font-medium text-foreground">No rooms available</p>
            <p className="text-xs text-muted-foreground">Try different dates, times, or room type.</p>
          </div>
        ) : filteredRooms.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            No rooms match &ldquo;{search}&rdquo;.
          </div>
        ) : (
          <ul className="max-h-72 space-y-1.5 overflow-y-auto pr-0.5" role="listbox" aria-label="Available rooms">
            {filteredRooms.map((room) => {
              const isSelected = selectedRoom?.id === room.id;
              const rate = getRoomRate(room, acPreference);
              const fitsGuests = room.max_occupancy >= totalGuests;
              return (
                <li key={room.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleRoomChange(room.id)}
                    className={`flex w-full items-center gap-3 rounded-md border p-2.5 text-left transition-colors ${
                      isSelected
                        ? 'border-primary bg-primary/5 ring-1 ring-primary'
                        : 'hover:border-muted-foreground/40 hover:bg-muted/50'
                    }`}
                  >
                    <div
                      className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border ${
                        isSelected ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground/30'
                      }`}
                      aria-hidden="true"
                    >
                      {isSelected && <Check className="h-3 w-3" />}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-foreground">Room {room.room_number}</span>
                        <span className="truncate text-xs text-muted-foreground">{getRoomTypeLabel(room.room_type)}</span>
                      </div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <UsersIcon className="h-3 w-3" aria-hidden="true" />
                          Max {room.max_occupancy}
                        </span>
                        {room.allow_extra_bed && (
                          <Badge variant="outline" className="h-4 px-1 text-[10px] font-normal">
                            <BedDouble className="mr-0.5 h-2.5 w-2.5" aria-hidden="true" />
                            Extra bed
                          </Badge>
                        )}
                        {!fitsGuests && (
                          <span className="text-[10px] font-medium text-amber-600">Over capacity</span>
                        )}
                      </div>
                    </div>

                    <div className="flex-shrink-0 text-right">
                      <div className="text-sm font-semibold text-foreground">₹{rate}</div>
                      <div className="text-[10px] text-muted-foreground">/night</div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Selected room summary */}
      {selectedRoom && (
        <section className="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" aria-hidden="true" />
              <span className="text-sm font-semibold text-foreground">
                Room {selectedRoom.room_number} · {getRoomTypeLabel(selectedRoom.room_type)}
              </span>
            </div>
            <div className="text-right">
              <div className="text-sm font-semibold text-foreground">
                ₹{((bookingData.rate || 0) * (bookingData.totalNights || 1)).toFixed(0)}
              </div>
              <div className="text-[10px] text-muted-foreground">
                ₹{bookingData.rate || 0} × {bookingData.totalNights || 1} night{(bookingData.totalNights || 1) > 1 ? 's' : ''}
              </div>
            </div>
          </div>

          {totalGuests > selectedRoom.max_occupancy && (
            <p className="flex items-center gap-1.5 text-xs font-medium text-amber-600">
              <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
              {totalGuests} guests exceed this room&rsquo;s max occupancy of {selectedRoom.max_occupancy}.
            </p>
          )}

          {showExtraBeds && (
            <div className="grid grid-cols-2 gap-3 border-t pt-3">
              <div className="space-y-1.5">
                <Label htmlFor="extra-bed-quantity" className="text-xs">
                  Extra Beds <span className="text-muted-foreground">(max {maxExtraBeds})</span>
                </Label>
                <Input
                  id="extra-bed-quantity"
                  type="number"
                  min={0}
                  max={maxExtraBeds}
                  value={bookingData.extraBeds?.quantity || 0}
                  onChange={(e) => handleExtraBedQuantityChange(parseInt(e.target.value, 10))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="extra-bed-rate" className="text-xs">Rate / Bed (₹)</Label>
                <Input
                  id="extra-bed-rate"
                  type="number"
                  min={0}
                  step="0.01"
                  value={bookingData.extraBeds?.ratePerBed ?? DEFAULT_EXTRA_BED_RATE}
                  onChange={(e) => handleExtraBedRateChange(parseFloat(e.target.value))}
                />
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
};

export default RoomSelection;
