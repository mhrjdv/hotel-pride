'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Calendar, 
 
  Hotel, 
  Snowflake, 
  Wind,
  Loader2,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';
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

const getRoomTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    'double-bed-deluxe': 'Double Bed Deluxe',
    'executive-3bed': 'Executive 3-Bed',
    'vip': 'VIP Suite'
  };
  return labels[type] || type;
};

const RoomSelection: React.FC<RoomSelectionProps> = ({ bookingData, onDataChange }) => {
  const { info, error: logError, bookingAction } = useLogger('RoomSelection');
  const [availableRooms, setAvailableRooms] = useState<RoomTable[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<RoomTable | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [defaultsSet, setDefaultsSet] = useState(false);
  const today = new Date().toISOString().split('T')[0];

  // Create Supabase client only once to avoid recreating on every render (prevents effect loops)
  const supabase = React.useMemo(() => createClient(), []);

  // Set default values only once when component mounts
  useEffect(() => {
    if (defaultsSet) return;
    
    const now = new Date();
    const tomorrow = new Date(now);
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
      const checkIn = new Date(defaultData.checkInDate || bookingData.checkInDate!);
      const checkOut = new Date(defaultData.checkOutDate || bookingData.checkOutDate!);
      const diffTime = Math.abs(checkOut.getTime() - checkIn.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      defaultData.totalNights = Math.max(1, diffDays);
      onDataChange(defaultData);
    }
    setDefaultsSet(true);
  }, [defaultsSet, bookingData, onDataChange, today]);

  const fetchAvailableRooms = useCallback(async () => {
    const { checkInDate, checkInTime, checkOutDate, checkOutTime, roomType } = bookingData;
    if (!checkInDate || !checkInTime || !checkOutDate || !checkOutTime || !roomType) {
      setAvailableRooms([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    info('Fetching available rooms');

    try {
      const { data, error } = await supabase.rpc('get_available_rooms', {
        p_check_in_date: checkInDate,
        p_check_in_time: checkInTime,
        p_check_out_date: checkOutDate,
        p_check_out_time: checkOutTime,
        p_room_type: roomType,
      });

      if (error) {
        logError('Failed to fetch available rooms', error);
        toast.error('Failed to fetch available rooms. Please try again.');
        setAvailableRooms([]);
      } else {
        const fetchedRooms = data as RoomTable[];
        info('Successfully fetched rooms');
        setAvailableRooms(fetchedRooms || []);
      }
    } catch (err) {
      logError('Unexpected error fetching rooms', err);
      toast.error('An unexpected error occurred while fetching rooms.');
      setAvailableRooms([]);
    } finally {
      setIsLoading(false);
    }
  }, [
    bookingData.checkInDate,
    bookingData.checkInTime,
    bookingData.checkOutDate,
    bookingData.checkOutTime,
    bookingData.roomType,
  ]);

  // Trigger room fetch when relevant booking parameters change and defaults are set
  useEffect(() => {
    if (!defaultsSet) return;
    fetchAvailableRooms();
    // We rely on explicit booking data deps to prevent logger function re-creations from causing loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    defaultsSet,
    bookingData.checkInDate,
    bookingData.checkInTime,
    bookingData.checkOutDate,
    bookingData.checkOutTime,
    bookingData.roomType,
  ]);

  // Effect to handle clearing the selected room if it becomes unavailable
  useEffect(() => {
    if (isLoading) return;

    if (bookingData.roomId && availableRooms.length > 0 && !availableRooms.some(r => r.id === bookingData.roomId)) {
      onDataChange({ 
        roomId: undefined,
        roomNumber: undefined,
        room: undefined,
        rate: 0,
        extraBeds: { quantity: 0, ratePerBed: 0 }
      });
      setSelectedRoom(null);
    }
  }, [availableRooms, bookingData.roomId, isLoading, onDataChange]);

  // Effect to update the selected room object when the roomId changes
  useEffect(() => {
    if (bookingData.roomId && availableRooms.length > 0) {
      const room = availableRooms.find(r => r.id === bookingData.roomId);
      setSelectedRoom(room || null);
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
    const checkOut = field === 'checkOutDate' ? value : bookingData.checkOutDate;

    if (checkIn && checkOut) {
      const start = new Date(checkIn);
      const end = new Date(checkOut);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      updatedData.totalNights = Math.max(1, diffDays);
    }

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
    const room = availableRooms.find(r => r.id === roomId);
    if (room) {
      bookingAction(`Room ${room.room_number} Selected`);
      setSelectedRoom(room);
      
      // Calculate rate based on AC preference
      const acPreference = bookingData.acPreference || false;
      const rate = acPreference ? (room.ac_rate || room.current_rate) : (room.non_ac_rate || room.current_rate);
      
      onDataChange({
        roomId: room.id,
        roomNumber: room.room_number,
        room: room,
        rate: rate,
        extraBeds: { quantity: 0, ratePerBed: DEFAULT_EXTRA_BED_RATE }
      });
    }
  };

  const handleACPreferenceChange = (acPreference: boolean) => {
    if (selectedRoom) {
      const rate = acPreference ? (selectedRoom.ac_rate || selectedRoom.current_rate) : (selectedRoom.non_ac_rate || selectedRoom.current_rate);
      onDataChange({
        acPreference,
        rate: rate
      });
    } else {
      onDataChange({ acPreference });
    }
  };

  const handleGuestCountChange = (field: 'adults' | 'children', value: number) => {
    const updatedData: Partial<BookingData> = { [field]: value };
    const adults = field === 'adults' ? value : (bookingData.adults || 1);
    const children = field === 'children' ? value : (bookingData.children || 0);
    updatedData.totalGuests = adults + children;
    onDataChange(updatedData);
  };

  const handleExtraBedQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedRoom) return;
    
    const quantity = parseInt(e.target.value, 10) || 0;
    const currentTotalGuests = (bookingData.adults || 1) + (bookingData.children || 0);
    
    if (quantity >= 0 && (currentTotalGuests + quantity) <= selectedRoom.max_occupancy) {
      onDataChange({
        extraBeds: {
          quantity: quantity,
          ratePerBed: bookingData.extraBeds?.ratePerBed || DEFAULT_EXTRA_BED_RATE,
        },
      });
    } else {
      toast.warning(`Maximum occupancy for this room (${selectedRoom.max_occupancy}) exceeded.`);
    }
  };

  const handleExtraBedRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rate = parseFloat(e.target.value) || 0;
    if (rate >= 0) {
      onDataChange({
        extraBeds: {
          quantity: bookingData.extraBeds?.quantity || 0,
          ratePerBed: rate,
        },
      });
    }
  };

  const renderExtraBedInputs = () => {
    if (!selectedRoom || !selectedRoom.allow_extra_bed) {
      return null;
    }

    const currentTotalGuests = (bookingData.adults || 1) + (bookingData.children || 0);
    const maxExtraBeds = selectedRoom.max_occupancy - currentTotalGuests;

    return (
      <div className="grid grid-cols-2 gap-4 mt-4 p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
        <h3 className="col-span-2 text-lg font-semibold text-gray-800 dark:text-gray-200">Extra Bed Details</h3>
        <p className="col-span-2 text-sm text-gray-600 dark:text-gray-400 -mt-2">
          This room allows for up to {maxExtraBeds} extra beds.
        </p>
        <div className="space-y-2">
          <Label htmlFor="extra-bed-quantity">Number of Extra Beds</Label>
          <Input
            id="extra-bed-quantity"
            type="number"
            min="0"
            max={maxExtraBeds}
            value={bookingData.extraBeds?.quantity || 0}
            onChange={handleExtraBedQuantityChange}
            className="w-full"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="extra-bed-rate">Rate per Extra Bed (₹)</Label>
          <Input
            id="extra-bed-rate"
            type="number"
            min="0"
            step="0.01"
            value={bookingData.extraBeds?.ratePerBed || DEFAULT_EXTRA_BED_RATE}
            onChange={handleExtraBedRateChange}
            className="w-full"
          />
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Date and Time Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Check-in & Check-out Details
          </CardTitle>
          <CardDescription>
            Select your preferred check-in and check-out dates and times
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="check-in-date">Check-in Date</Label>
              <Input
                id="check-in-date"
                type="date"
                min={today}
                value={bookingData.checkInDate || ''}
                onChange={(e) => handleDateChange('checkInDate', e.target.value)}
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="check-in-time">Check-in Time</Label>
              <Select value={bookingData.checkInTime || ''} onValueChange={(value) => handleTimeChange('checkInTime', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="08:00">08:00 AM</SelectItem>
                  <SelectItem value="09:00">09:00 AM</SelectItem>
                  <SelectItem value="10:00">10:00 AM</SelectItem>
                  <SelectItem value="11:00">11:00 AM</SelectItem>
                  <SelectItem value="12:00">12:00 PM</SelectItem>
                  <SelectItem value="13:00">01:00 PM</SelectItem>
                  <SelectItem value="14:00">02:00 PM</SelectItem>
                  <SelectItem value="15:00">03:00 PM</SelectItem>
                  <SelectItem value="16:00">04:00 PM</SelectItem>
                  <SelectItem value="17:00">05:00 PM</SelectItem>
                  <SelectItem value="18:00">06:00 PM</SelectItem>
                  <SelectItem value="19:00">07:00 PM</SelectItem>
                  <SelectItem value="20:00">08:00 PM</SelectItem>
                  <SelectItem value="21:00">09:00 PM</SelectItem>
                  <SelectItem value="22:00">10:00 PM</SelectItem>
                  <SelectItem value="23:00">11:00 PM</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="check-out-date">Check-out Date</Label>
              <Input
                id="check-out-date"
                type="date"
                min={bookingData.checkInDate || today}
                value={bookingData.checkOutDate || ''}
                onChange={(e) => handleDateChange('checkOutDate', e.target.value)}
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="check-out-time">Check-out Time</Label>
              <Select value={bookingData.checkOutTime || ''} onValueChange={(value) => handleTimeChange('checkOutTime', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="08:00">08:00 AM</SelectItem>
                  <SelectItem value="09:00">09:00 AM</SelectItem>
                  <SelectItem value="10:00">10:00 AM</SelectItem>
                  <SelectItem value="11:00">11:00 AM</SelectItem>
                  <SelectItem value="12:00">12:00 PM</SelectItem>
                  <SelectItem value="13:00">01:00 PM</SelectItem>
                  <SelectItem value="14:00">02:00 PM</SelectItem>
                  <SelectItem value="15:00">03:00 PM</SelectItem>
                  <SelectItem value="16:00">04:00 PM</SelectItem>
                  <SelectItem value="17:00">05:00 PM</SelectItem>
                  <SelectItem value="18:00">06:00 PM</SelectItem>
                  <SelectItem value="19:00">07:00 PM</SelectItem>
                  <SelectItem value="20:00">08:00 PM</SelectItem>
                  <SelectItem value="21:00">09:00 PM</SelectItem>
                  <SelectItem value="22:00">10:00 PM</SelectItem>
                  <SelectItem value="23:00">11:00 PM</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {bookingData.totalNights && (
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Total nights: {bookingData.totalNights}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Guest Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Hotel className="w-5 h-5" />
            Guest Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="adults">Adults</Label>
              <Input
                id="adults"
                type="number"
                min="1"
                max="10"
                value={bookingData.adults || 1}
                onChange={(e) => handleGuestCountChange('adults', parseInt(e.target.value) || 1)}
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="children">Children</Label>
              <Input
                id="children"
                type="number"
                min="0"
                max="10"
                value={bookingData.children || 0}
                onChange={(e) => handleGuestCountChange('children', parseInt(e.target.value) || 0)}
                className="w-full"
              />
            </div>
          </div>
          
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Total guests: {bookingData.totalGuests || 1}
          </div>
        </CardContent>
      </Card>

      {/* Room Type Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Hotel className="w-5 h-5" />
            Room Type & Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="room-type">Room Type</Label>
            <Select value={bookingData.roomType || ''} onValueChange={handleRoomTypeChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select room type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="double-bed-deluxe">Double Bed Deluxe</SelectItem>
                <SelectItem value="executive-3bed">Executive 3-Bed</SelectItem>
                <SelectItem value="vip">VIP Suite</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label>AC Preference</Label>
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="ac-preference"
                  checked={!bookingData.acPreference}
                  onChange={() => handleACPreferenceChange(false)}
                  className="w-4 h-4"
                />
                <span className="flex items-center gap-1">
                  <Wind className="w-4 h-4" />
                  Non-AC
                </span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="ac-preference"
                  checked={bookingData.acPreference || false}
                  onChange={() => handleACPreferenceChange(true)}
                  className="w-4 h-4"
                />
                <span className="flex items-center gap-1">
                  <Snowflake className="w-4 h-4" />
                  AC
                </span>
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Available Rooms */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Hotel className="w-5 h-5" />
            Available Rooms
          </CardTitle>
          <CardDescription>
            Select from available rooms based on your preferences
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              <span>Loading available rooms...</span>
            </div>
          ) : availableRooms.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>No rooms available for the selected criteria.</p>
              <p className="text-sm mt-2">Please try different dates or room type.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableRooms.map((room) => (
                <div
                  key={room.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    selectedRoom?.id === room.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleRoomChange(room.id)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">Room {room.room_number}</h3>
                    {selectedRoom?.id === room.id && (
                      <CheckCircle className="w-5 h-5 text-blue-500" />
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {getRoomTypeLabel(room.room_type)}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">
                      Max occupancy: {room.max_occupancy}
                    </span>
                    <span className="font-semibold">
                      ₹{bookingData.acPreference ? (room.ac_rate || room.current_rate) : (room.non_ac_rate || room.current_rate)}/night
                    </span>
                  </div>
                  {room.amenities && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {room.amenities.slice(0, 3).map((amenity, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {amenity}
                        </Badge>
                      ))}
                      {room.amenities.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{room.amenities.length - 3} more
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Selected Room Details */}
      {selectedRoom && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              Selected Room Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold mb-2">Room {selectedRoom.room_number}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  {getRoomTypeLabel(selectedRoom.room_type)}
                </p>
                <p className="text-sm mb-2">
                  Maximum occupancy: {selectedRoom.max_occupancy} guests
                </p>
                <div className="text-lg font-semibold text-blue-600">
                  ₹{bookingData.rate || 0}/night
                </div>
              </div>
              <div>
                {selectedRoom.amenities && (
                  <div>
                    <h4 className="font-medium mb-2">Amenities:</h4>
                    <div className="flex flex-wrap gap-1">
                      {selectedRoom.amenities.map((amenity, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {amenity}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <Separator />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2">Stay Duration:</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {bookingData.totalNights} night(s)
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-2">Base Amount:</h4>
                <p className="text-lg font-semibold">
                  ₹{((bookingData.rate || 0) * (bookingData.totalNights || 1)).toFixed(2)}
                </p>
              </div>
            </div>

            {renderExtraBedInputs()}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RoomSelection; 