'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { 
  Loader2, 
  Calendar, 
  Users, 
  Hotel, 
  Wifi, 
  Tv, 
  Car, 
  Coffee, 
  Snowflake, 
  Wind, 
  IndianRupee, 
  Settings,
  Bed,
  Plus,
  Minus,
  Info
} from 'lucide-react';
import { toast } from 'sonner';
import { calculateBookingAmount, formatBookingCalculation, GSTMode } from '@/lib/utils/gst';
import { Room, BookingData } from '@/lib/types/booking';

interface RoomSelectionProps {
  data: BookingData;
  onDataChange: (data: Partial<BookingData>) => void;
}

const roomTypeLabels = {
  'ac-2bed': 'AC 2-Bed Room',
  'non-ac-2bed': 'Non-AC 2-Bed Room',
  'ac-3bed': 'AC 3-Bed Room',
  'non-ac-3bed': 'Non-AC 3-Bed Room',
  'vip-ac': 'VIP AC Suite',
  'vip-non-ac': 'VIP Non-AC Suite'
};

const amenityIcons = {
  'Air Conditioning': Snowflake,
  'Television': Tv,
  'Wi-Fi': Wifi,
  'Parking': Car,
  'Coffee': Coffee,
  'Fan': Wind
};

const gstModeLabels = {
  'inclusive': 'GST Inclusive (12% included in price)',
  'exclusive': 'GST Exclusive (12% added to price)',
  'none': 'No GST (Tax-free booking)'
};

export function RoomSelection({ data, onDataChange }: RoomSelectionProps) {
  const supabase = createClient();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchingRooms, setSearchingRooms] = useState(false);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

  // Search for available rooms when dates change
  useEffect(() => {
    if (data.checkInDate && data.checkOutDate) {
      const checkIn = new Date(data.checkInDate);
      const checkOut = new Date(data.checkOutDate);
      if (checkOut > checkIn) {
        searchAvailableRooms(data.checkInDate, data.checkOutDate);
      } else {
        setAvailableRooms([]); // Clear if dates are invalid
      }
    }
  }, [data.checkInDate, data.checkOutDate]);

  // Recalculate pricing when relevant data changes
  useEffect(() => {
    if (data.room && data.totalNights) {
      updatePricing();
    }
  }, [
    data.room,
    data.totalNights,
    data.roomRate,
    data.customRoomRate,
    data.useCustomRate,
    data.gstMode,
    data.extraBeds,
    data.additionalCharges
  ]);

  const searchAvailableRooms = async (startDate: string, endDate: string) => {
    if (!startDate || !endDate) return;

    setSearchingRooms(true);
    setAvailableRooms([]);

    const { data: available, error } = await supabase.rpc('get_available_rooms', {
      start_date: startDate,
      end_date: endDate
    });

    if (error) {
      toast.error('Failed to check room availability');
      console.error('Error checking availability:', error);
    } else {
      setAvailableRooms(available || []);
    }
    
    setSearchingRooms(false);
  };

  const updatePricing = () => {
    if (!data.room || !data.totalNights) return;

    const calculation = calculateBookingAmount({
      baseRoomRate: data.room.current_rate,
      customRoomRate: data.useCustomRate ? data.customRoomRate : undefined,
      nights: data.totalNights,
      extraBeds: data.extraBeds,
      additionalCharges: data.additionalCharges,
      gstMode: data.gstMode || 'inclusive'
    });

    onDataChange({
      baseAmount: calculation.baseAmount,
      gstAmount: calculation.gstAmount,
      totalAmount: calculation.totalAmount
    });
  };

  const calculateNights = (checkIn: string, checkOut: string) => {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const handleDateChange = (field: 'checkInDate' | 'checkOutDate', value: string) => {
    const updates: Partial<BookingData> = { [field]: value };
    
    if (field === 'checkInDate' && data.checkOutDate) {
      const nights = calculateNights(value, data.checkOutDate);
      updates.totalNights = nights;
    } else if (field === 'checkOutDate' && data.checkInDate) {
      const nights = calculateNights(data.checkInDate, value);
      updates.totalNights = nights;
    }

    onDataChange(updates);
  };

  const handleGuestChange = (adults: number, children: number) => {
    onDataChange({
      adults,
      children,
      totalGuests: adults + children
    });
  };

  const handleRoomSelect = (room: Room) => {
    onDataChange({
      room,
      roomRate: room.current_rate,
      gstMode: data.gstMode || 'inclusive'
    });
  };

  const handleCustomRateToggle = (useCustom: boolean) => {
    const updates: Partial<BookingData> = {
      useCustomRate: useCustom
    };

    if (useCustom && !data.customRoomRate) {
      updates.customRoomRate = data.roomRate || data.room?.current_rate || 0;
    }

    onDataChange(updates);
  };

  const handleExtraBedChange = (field: 'quantity' | 'ratePerBed', value: number) => {
    const currentExtraBeds = data.extraBeds || { quantity: 0, ratePerBed: 0 };
    const updatedExtraBeds = {
      ...currentExtraBeds,
      [field]: value
    };

    onDataChange({
      extraBeds: updatedExtraBeds
    });
  };

  const addAdditionalCharge = () => {
    const currentCharges = data.additionalCharges || [];
    onDataChange({
      additionalCharges: [...currentCharges, { description: '', amount: 0 }]
    });
  };

  const updateAdditionalCharge = (index: number, field: 'description' | 'amount', value: string | number) => {
    const currentCharges = data.additionalCharges || [];
    const updatedCharges = currentCharges.map((charge, i) => 
      i === index ? { ...charge, [field]: value } : charge
    );
    onDataChange({
      additionalCharges: updatedCharges
    });
  };

  const removeAdditionalCharge = (index: number) => {
    const currentCharges = data.additionalCharges || [];
    onDataChange({
      additionalCharges: currentCharges.filter((_, i) => i !== index)
    });
  };

  // Allow back-dating (past dates)
  const minDate = '2020-01-01'; // Allow reasonable back-dating

  // Calculate pricing display
  const pricingCalculation = data.room && data.totalNights ? calculateBookingAmount({
    baseRoomRate: data.room.current_rate,
    customRoomRate: data.useCustomRate ? data.customRoomRate : undefined,
    nights: data.totalNights,
    extraBeds: data.extraBeds,
    additionalCharges: data.additionalCharges,
    gstMode: data.gstMode || 'inclusive'
  }) : null;

  const formattedPricing = pricingCalculation ? formatBookingCalculation(pricingCalculation) : null;

  return (
    <div className="space-y-6">
      {/* Date and Guest Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Stay Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="checkIn">Check-in Date</Label>
              <Input
                id="checkIn"
                type="date"
                value={data.checkInDate || ''}
                min={minDate}
                onChange={(e) => handleDateChange('checkInDate', e.target.value)}
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">Back-dating allowed for corrections</p>
            </div>
            <div>
              <Label htmlFor="checkOut">Check-out Date</Label>
              <Input
                id="checkOut"
                type="date"
                value={data.checkOutDate || ''}
                min={data.checkInDate || minDate}
                onChange={(e) => handleDateChange('checkOutDate', e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="adults">Adults</Label>
              <Select 
                value={data.adults?.toString() || '1'}
                onValueChange={(value) => handleGuestChange(parseInt(value), data.children || 0)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6].map(num => (
                    <SelectItem key={num} value={num.toString()}>{num}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="children">Children</Label>
              <Select 
                value={data.children?.toString() || '0'}
                onValueChange={(value) => handleGuestChange(data.adults || 1, parseInt(value))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[0, 1, 2, 3, 4].map(num => (
                    <SelectItem key={num} value={num.toString()}>{num}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="source">Booking Source</Label>
              <Select 
                value={data.bookingSource || 'walk_in'}
                onValueChange={(value: any) => onDataChange({ bookingSource: value })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="walk_in">Walk-in</SelectItem>
                  <SelectItem value="phone">Phone</SelectItem>
                  <SelectItem value="online">Online</SelectItem>
                  <SelectItem value="agent">Agent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {data.checkInDate && data.checkOutDate && data.totalNights && (
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>{data.totalNights}</strong> night{data.totalNights > 1 ? 's' : ''} •
                <strong> {data.totalGuests}</strong> guest{data.totalGuests > 1 ? 's' : ''}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Room Selection */}
      {data.checkInDate && data.checkOutDate && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Hotel className="w-5 h-5" />
              Available Rooms ({availableRooms.length})
              {searchingRooms && <Loader2 className="w-4 h-4 animate-spin" />}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              </div>
            ) : availableRooms.length === 0 ? (
              <div className="text-center py-8 text-gray-600">
                <Hotel className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-lg font-medium mb-2">No rooms available</p>
                <p>Please try different dates or contact reception for assistance.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {availableRooms.map((room) => (
                  <Card
                    key={room.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      data.room?.id === room.id ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                    }`}
                    onClick={() => handleRoomSelect(room)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{room.room_number}</CardTitle>
                        <Badge variant="outline" className="capitalize">
                          {roomTypeLabels[room.room_type as keyof typeof roomTypeLabels]}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Rate per night</span>
                        <span className="text-lg font-bold text-green-600">
                          ₹{room.current_rate.toLocaleString('en-IN')}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Max occupancy</span>
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {room.max_occupancy} guests
                        </span>
                      </div>

                      {room.amenities && room.amenities.length > 0 && (
                        <div>
                          <p className="text-sm text-gray-600 mb-2">Amenities</p>
                          <div className="flex flex-wrap gap-2">
                            {room.amenities.slice(0, 3).map((amenity, index) => {
                              const IconComponent = amenityIcons[amenity as keyof typeof amenityIcons];
                              return (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {IconComponent && <IconComponent className="w-3 h-3 mr-1" />}
                                  {amenity}
                                </Badge>
                              );
                            })}
                            {room.amenities.length > 3 && (
                              <Badge variant="secondary" className="text-xs">
                                +{room.amenities.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}

                      {data.room?.id === room.id && (
                        <div className="text-sm text-emerald-600 font-medium">
                          ✓ Selected Room
                        </div>
                      )}

                      {data.room?.id !== room.id && (
                        <div className="pt-2 border-t">
                          <Badge className="w-full justify-center bg-blue-600">
                            Select This Room
                          </Badge>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Pricing Configuration */}
      {data.room && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <IndianRupee className="w-5 h-5" />
                Pricing Configuration
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
              >
                <Settings className="w-4 h-4 mr-2" />
                {showAdvancedOptions ? 'Hide' : 'Show'} Advanced Options
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* GST Configuration */}
            <div>
              <Label className="text-base font-medium">GST Configuration</Label>
              <div className="mt-2 space-y-3">
                {Object.entries(gstModeLabels).map(([mode, label]) => (
                  <div key={mode} className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id={`gst-${mode}`}
                      name="gstMode"
                      value={mode}
                      checked={data.gstMode === mode || (!data.gstMode && mode === 'inclusive')}
                      onChange={() => onDataChange({ gstMode: mode as GSTMode })}
                      className="text-blue-600"
                    />
                    <Label htmlFor={`gst-${mode}`} className="text-sm cursor-pointer">
                      {label}
                    </Label>
                  </div>
                ))}
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Info className="w-4 h-4 text-amber-600 mt-0.5" />
                    <div className="text-sm text-amber-800">
                      <p className="font-medium">GST Information:</p>
                      <p>• Inclusive: 12% GST is included in the displayed price</p>
                      <p>• Exclusive: 12% GST will be added to the displayed price</p>
                      <p>• None: No GST will be applied (for special cases)</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Custom Room Rate */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <Label className="text-base font-medium">Room Rate Override</Label>
                <div className="flex items-center space-x-2">
                  <Label htmlFor="custom-rate-toggle" className="text-sm">Use custom rate</Label>
                  <Switch
                    id="custom-rate-toggle"
                    checked={data.useCustomRate || false}
                    onCheckedChange={handleCustomRateToggle}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-gray-600">Default Rate (per night)</Label>
                  <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                    <span className="text-lg font-semibold">₹{data.room.current_rate.toLocaleString('en-IN')}</span>
                  </div>
                </div>
                {data.useCustomRate && (
                  <div>
                    <Label htmlFor="customRate" className="text-sm text-gray-600">Custom Rate (per night)</Label>
                    <Input
                      id="customRate"
                      type="number"
                      min="0"
                      step="1"
                      value={data.customRoomRate || ''}
                      onChange={(e) => onDataChange({ customRoomRate: parseFloat(e.target.value) || 0 })}
                      className="mt-1"
                      placeholder="Enter custom rate"
                    />
                  </div>
                )}
              </div>
            </div>

            {showAdvancedOptions && (
              <>
                <Separator />

                {/* Extra Beds */}
                <div>
                  <Label className="text-base font-medium flex items-center gap-2">
                    <Bed className="w-4 h-4" />
                    Extra Beds
                  </Label>
                  <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="extraBedQty" className="text-sm text-gray-600">Quantity</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleExtraBedChange('quantity', Math.max(0, (data.extraBeds?.quantity || 0) - 1))}
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        <Input
                          id="extraBedQty"
                          type="number"
                          min="0"
                          max="3"
                          value={data.extraBeds?.quantity || 0}
                          onChange={(e) => handleExtraBedChange('quantity', parseInt(e.target.value) || 0)}
                          className="text-center"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleExtraBedChange('quantity', Math.min(3, (data.extraBeds?.quantity || 0) + 1))}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="extraBedRate" className="text-sm text-gray-600">Rate per bed (per night)</Label>
                      <Input
                        id="extraBedRate"
                        type="number"
                        min="0"
                        step="1"
                        value={data.extraBeds?.ratePerBed || 0}
                        onChange={(e) => handleExtraBedChange('ratePerBed', parseFloat(e.target.value) || 0)}
                        className="mt-1"
                        placeholder="₹0 (can be free)"
                      />
                    </div>
                  </div>
                  {data.extraBeds && data.extraBeds.quantity > 0 && (
                    <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-800">
                        {data.extraBeds.quantity} extra bed{data.extraBeds.quantity > 1 ? 's' : ''} × 
                        ₹{data.extraBeds.ratePerBed.toLocaleString('en-IN')} × 
                        {data.totalNights} night{data.totalNights && data.totalNights > 1 ? 's' : ''} = 
                        <strong> ₹{((data.extraBeds.quantity * data.extraBeds.ratePerBed * (data.totalNights || 0))).toLocaleString('en-IN')}</strong>
                      </p>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Additional Charges */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <Label className="text-base font-medium">Additional Charges</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addAdditionalCharge}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Charge
                    </Button>
                  </div>
                  
                  {data.additionalCharges && data.additionalCharges.length > 0 && (
                    <div className="space-y-3">
                      {data.additionalCharges.map((charge, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Input
                            placeholder="Description (e.g., Food, Laundry)"
                            value={charge.description}
                            onChange={(e) => updateAdditionalCharge(index, 'description', e.target.value)}
                            className="flex-1"
                          />
                          <Input
                            type="number"
                            min="0"
                            step="1"
                            placeholder="Amount"
                            value={charge.amount || ''}
                            onChange={(e) => updateAdditionalCharge(index, 'amount', parseFloat(e.target.value) || 0)}
                            className="w-32"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeAdditionalCharge(index)}
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Pricing Summary */}
            {formattedPricing && (
              <>
                <Separator />
                <div>
                  <Label className="text-base font-medium">Pricing Summary</Label>
                  <div className="mt-3 space-y-2 bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between text-sm">
                      <span>Room charges ({data.totalNights} nights)</span>
                      <span>{formattedPricing.roomCharges}</span>
                    </div>
                    
                    {formattedPricing.extraBedCharges && (
                      <div className="flex justify-between text-sm">
                        <span>Extra bed charges</span>
                        <span>{formattedPricing.extraBedCharges}</span>
                      </div>
                    )}
                    
                    {formattedPricing.additionalCharges && (
                      <div className="flex justify-between text-sm">
                        <span>Additional charges</span>
                        <span>{formattedPricing.additionalCharges}</span>
                      </div>
                    )}
                    
                    <div className="flex justify-between text-sm font-medium border-t pt-2">
                      <span>Subtotal</span>
                      <span>{formattedPricing.subtotal}</span>
                    </div>
                    
                    {formattedPricing.showGST && (
                      <div className="flex justify-between text-sm">
                        <span>GST (12%)</span>
                        <span>{formattedPricing.gstAmount}</span>
                      </div>
                    )}
                    
                    <div className="flex justify-between text-lg font-bold border-t pt-2">
                      <span>Total Amount</span>
                      <span className="text-green-600">{formattedPricing.grandTotal}</span>
                    </div>
                    
                    <div className="text-xs text-gray-500">
                      GST Mode: {gstModeLabels[formattedPricing.gstMode]}
                    </div>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Special Requests */}
      {data.room && (
        <Card>
          <CardHeader>
            <CardTitle>Special Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Any special requests or preferences (optional)"
              value={data.specialRequests || ''}
              onChange={(e) => onDataChange({ specialRequests: e.target.value })}
              className="min-h-[100px]"
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
} 