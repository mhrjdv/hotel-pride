'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { 
  Loader2, 
  Calendar, 
  Hotel, 
  IndianRupee, 
  ChevronDown,
  ChevronUp,
  Snowflake,
  Tv,
  Wifi,
  Wind,
  ParkingSquare,
  Coffee,
} from 'lucide-react';
import { toast } from 'sonner';
import { calculateBookingAmount, formatBookingCalculation, GSTMode } from '@/lib/utils/gst';
import { Room, BookingData } from '@/lib/types/booking';

interface RoomSelectionProps {
  data: BookingData;
  onDataChange: (data: Partial<BookingData>) => void;
}

const amenityIcons: { [key: string]: React.ElementType } = {
  'Air Conditioning': Snowflake,
  'Television': Tv,
  'Wi-Fi': Wifi,
  'Fan': Wind,
  'Parking': ParkingSquare,
  'Coffee': Coffee,
};

const getRoomTypeLabel = (type: string) => {
  const labels: { [key: string]: string } = {
    'ac-2bed': 'AC 2-Bed Room',
    'non-ac-2bed': 'Non-AC 2-Bed Room',
    'ac-3bed': 'AC 3-Bed Room',
    'non-ac-3bed': 'Non-AC 3-Bed Room',
    'vip-ac': 'VIP AC Suite',
    'vip-non-ac': 'VIP Non-AC Suite'
  };
  return labels[type] || type;
}


export function RoomSelection({ data, onDataChange }: RoomSelectionProps) {
  const supabase = createClient();
  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
  const [searchingRooms, setSearchingRooms] = useState(false);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (data.checkInDate && data.checkOutDate) {
      const checkIn = new Date(data.checkInDate);
      const checkOut = new Date(data.checkOutDate);
      if (checkOut >= checkIn) {
        searchAvailableRooms(data.checkInDate, data.checkOutDate);
      } else {
        setAvailableRooms([]);
        onDataChange({ room: undefined }); // Clear selected room if dates are invalid
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.checkInDate, data.checkOutDate]);
  
  const searchAvailableRooms = async (startDate: string, endDate: string) => {
    if (!startDate || !endDate) return;

    setSearchingRooms(true);
    setAvailableRooms([]);
    onDataChange({ room: undefined }); // Clear previous selection

    const { data: available, error } = await supabase.rpc('get_available_rooms', {
      start_date: startDate,
      end_date: endDate
    });

    if (error) {
      toast.error('Failed to check room availability');
      console.error('Error checking availability:', error);
    } else {
      setAvailableRooms(available || []);
      if (available && available.length > 0) {
        toast.success(`Found ${available.length} available room(s).`);
      } else {
        toast.info('No rooms available for the selected dates.');
      }
    }
    
    setSearchingRooms(false);
  };

  const calculateNights = (checkIn: string, checkOut: string) => {
    if (!checkIn || !checkOut) return 0;
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diffTime = end.getTime() - start.getTime();
    const calcDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    // Same-day stay counts as 1 night
    if (calcDays <= 0) return 1;
    return calcDays;
  };

  const handleDateChange = (field: 'checkInDate' | 'checkOutDate', value: string) => {
    const otherField = field === 'checkInDate' ? 'checkOutDate' : 'checkInDate';
    const checkIn = field === 'checkInDate' ? value : data.checkInDate || '';
    const checkOut = field === 'checkOutDate' ? value : data.checkOutDate || '';
    
    const nights = calculateNights(checkIn, checkOut);
    
    onDataChange({ [field]: value, totalNights: nights });
  };

  const handleRoomSelect = (roomId: string) => {
    const selectedRoom = availableRooms.find(r => r.id === roomId);
    if (selectedRoom) {
      onDataChange({
        room: selectedRoom,
        roomRate: selectedRoom.current_rate,
        useCustomRate: false, // Reset custom rate on new room selection
        gstMode: data.gstMode || 'inclusive'
      });
    }
  };

  const selectedRoom = useMemo(() => data.room, [data.room]);

  const pricingCalculation = useMemo(() => {
    if (!selectedRoom || !data.totalNights) return null;
    return calculateBookingAmount({
      baseRoomRate: selectedRoom.current_rate,
      customRoomRate: data.useCustomRate ? data.customRoomRate : undefined,
      nights: data.totalNights,
      extraBeds: data.extraBeds,
      additionalCharges: data.additionalCharges,
      gstMode: data.gstMode || 'inclusive'
    });
  }, [
    selectedRoom,
    data.totalNights,
    data.useCustomRate,
    data.customRoomRate,
    data.extraBeds,
    data.additionalCharges,
    data.gstMode
  ]);
  
  useEffect(() => {
    if (pricingCalculation) {
      onDataChange({
        baseAmount: pricingCalculation.baseAmount,
        gstAmount: pricingCalculation.gstAmount,
        totalAmount: pricingCalculation.totalAmount,
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pricingCalculation]);

  const formattedPricing = pricingCalculation ? formatBookingCalculation(pricingCalculation) : null;

  const summaryItems = useMemo(() => {
    if (!formattedPricing || !data.totalNights) return [];

    const items = [
      { label: `Room Charges (${data.totalNights} nights)`, value: formattedPricing.roomCharges, isBold: false },
    ];

    if (formattedPricing.extraBedCharges) {
      items.push({ label: 'Extra Bed Charges', value: formattedPricing.extraBedCharges, isBold: false });
    }
    if (formattedPricing.additionalCharges) {
      items.push({ label: 'Additional Charges', value: formattedPricing.additionalCharges, isBold: false });
    }

    items.push({ label: 'Subtotal', value: formattedPricing.subtotal, isBold: true });
    
    if (formattedPricing.showGST) {
      items.push({ label: `GST (12%)`, value: formattedPricing.gstAmount, isBold: false });
    }

    return items;
  }, [formattedPricing, data.totalNights]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
      {/* Left Column: Selections */}
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Calendar className="w-6 h-6 text-blue-600" />
              <span>Select Dates & Room</span>
            </CardTitle>
            <CardDescription>
              Choose check-in and check-out dates to find available rooms.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="checkInDate">Check-in Date</Label>
              <Input
                id="checkInDate"
                type="date"
                value={data.checkInDate || ''}
                onChange={(e) => handleDateChange('checkInDate', e.target.value)}
                min={today}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="checkOutDate">Check-out Date</Label>
              <Input
                id="checkOutDate"
                type="date"
                value={data.checkOutDate || ''}
                onChange={(e) => handleDateChange('checkOutDate', e.target.value)}
                min={data.checkInDate || today}
                className="mt-1"
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="availableRooms">Available Rooms</Label>
              <Select
                value={selectedRoom?.id || ''}
                onValueChange={handleRoomSelect}
                disabled={searchingRooms || availableRooms.length === 0}
              >
                <SelectTrigger id="availableRooms" className="mt-1">
                  <SelectValue placeholder={
                    searchingRooms 
                      ? "Searching..." 
                      : (data.checkInDate && data.checkOutDate)
                        ? "Select an available room"
                        : "Please select dates first"
                  } />
                </SelectTrigger>
                <SelectContent>
                  {searchingRooms ? (
                    <div className="flex items-center justify-center p-4">
                      <Loader2 className="w-5 h-5 animate-spin" />
                    </div>
                  ) : (
                    availableRooms.map(room => (
                      <SelectItem key={room.id} value={room.id}>
                        Room {room.room_number} ({getRoomTypeLabel(room.room_type)}) - ₹{room.current_rate}/night
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {selectedRoom && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Hotel className="w-6 h-6 text-blue-600" />
                <span>Room Details: {selectedRoom.room_number}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
               <div className="flex justify-between items-center">
                 <p className="text-lg font-semibold">{getRoomTypeLabel(selectedRoom.room_type)}</p>
                 <Badge variant="secondary" className="text-base">Max Occupancy: {selectedRoom.max_occupancy}</Badge>
               </div>
               <Separator className="my-4" />
               <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {(selectedRoom.amenities as string[])?.map(amenity => {
                    const Icon = amenityIcons[amenity];
                    return (
                      <div key={amenity} className="flex items-center gap-2 text-sm">
                        {Icon && <Icon className="w-4 h-4 text-gray-600" />}
                        <span>{amenity}</span>
                      </div>
                    );
                })}
               </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between cursor-pointer" onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}>
            <div>
              <CardTitle className="text-xl">Pricing & Options</CardTitle>
              <CardDescription>Configure rates, GST, and extra charges.</CardDescription>
            </div>
            {showAdvancedOptions ? <ChevronUp /> : <ChevronDown />}
          </CardHeader>
          {showAdvancedOptions && (
            <CardContent className="space-y-6 pt-6">
                <div className="flex items-center space-x-2">
                    <Switch
                        id="customRate"
                        checked={!!data.useCustomRate}
                        onCheckedChange={(checked) => onDataChange({
                            useCustomRate: checked,
                            customRoomRate: checked ? selectedRoom?.current_rate || 0 : undefined
                        })}
                        disabled={!selectedRoom}
                    />
                    <Label htmlFor="customRate" className="text-base">Use Custom Room Rate</Label>
                </div>

                {data.useCustomRate && (
                    <div className="grid gap-2">
                        <Label htmlFor="customRoomRate">Custom Rate (per night)</Label>
                        <Input
                            id="customRoomRate"
                            type="number"
                            value={data.customRoomRate || ''}
                            onChange={(e) => onDataChange({ customRoomRate: parseFloat(e.target.value) || 0 })}
                            disabled={!selectedRoom}
                        />
                    </div>
                )}
                <Separator/>
                 <div>
                    <Label>GST Mode</Label>
                    <Select
                        value={data.gstMode || 'inclusive'}
                        onValueChange={(value: GSTMode) => onDataChange({ gstMode: value })}
                    >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="inclusive">Inclusive (12% in price)</SelectItem>
                            <SelectItem value="exclusive">Exclusive (12% added)</SelectItem>
                            <SelectItem value="none">No GST</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </CardContent>
          )}
        </Card>
      </div>

      {/* Right Column: Pricing Summary */}
      <div className="lg:col-span-1 space-y-6">
        <Card className="sticky top-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <IndianRupee className="w-6 h-6 text-green-600" />
              <span>Booking Summary</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedRoom && data.totalNights ? (
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Room</span>
                  <span className="font-medium">#{selectedRoom.room_number}</span>
                </div>
                <div className="flex justify-between">
                  <span>Duration</span>
                  <span className="font-medium">{data.totalNights} Night(s)</span>
                </div>
                <Separator />
                {formattedPricing && (
                  <div className="space-y-2 text-sm">
                    {summaryItems.map((item, index) => (
                      <div key={index} className="flex justify-between">
                        <span>{item.label}</span>
                        <span className={item.isBold ? 'font-bold' : ''}>{item.value}</span>
                      </div>
                    ))}
                  </div>
                )}
                <Separator />
                 <div className="flex justify-between text-lg font-bold">
                    <span>Total Amount</span>
                    <span>{pricingCalculation ? `₹${pricingCalculation.totalAmount.toFixed(2)}` : 'N/A'}</span>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-10">
                <p>Select dates and a room to see the price summary.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}