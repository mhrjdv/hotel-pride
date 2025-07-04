'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { 
  Save, 
  X, 
  Calendar, 
  Users, 
  Hotel, 
  CreditCard, 
  CheckCircle,
  AlertTriangle,
  Loader2,
  RotateCcw,
  Clock,
  UserX,
  Ban,
  ArrowRightLeft,
  Eye,
  Edit3,
  Info
} from 'lucide-react';
import { getBookingStatusConfig } from '@/lib/utils/hotel';
import { calculateBookingAmount } from '@/lib/utils/gst';
import { toast } from 'sonner';
import { Database } from '@/lib/supabase/types';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

type BookingRow = Database['public']['Tables']['bookings']['Row'] & {
  rooms: Database['public']['Tables']['rooms']['Row'] | null;
  customers: Database['public']['Tables']['customers']['Row'] | null;
  booking_guests?: {
    customers: Database['public']['Tables']['customers']['Row'];
    is_primary: boolean;
  }[];
};

interface BookingEditorProps {
  booking: BookingRow;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (updatedBooking: BookingRow) => void;
}

// Comprehensive validation schema
const bookingEditSchema = z.object({
  room_id: z.string().uuid('Invalid room ID'),
  primary_customer_id: z.string().uuid('Invalid customer ID'),
  check_in_date: z.string(),
  check_out_date: z.string(),
  total_guests: z.number().min(1).max(10),
  adults: z.number().min(1).max(8),
  children: z.number().min(0).max(6),
  room_rate: z.number().min(100).max(50000),
  total_nights: z.number().min(1),
  booking_status: z.enum(['confirmed', 'checked_in', 'checked_out', 'cancelled', 'no_show']),
  payment_status: z.enum(['pending', 'partial', 'paid', 'refunded']),
  gst_mode: z.enum(['inclusive', 'exclusive']),
  booking_source: z.enum(['walk_in', 'phone', 'online', 'agent']),
  special_requests: z.string().max(1000).optional(),
  extra_bed_count: z.number().min(0).max(4),
  extra_bed_rate: z.number().min(0).max(5000),
  custom_rate_applied: z.boolean(),
});

type BookingEditFormData = z.infer<typeof bookingEditSchema>;

export function BookingEditor({ booking, isOpen, onOpenChange, onUpdate }: BookingEditorProps) {
  const supabase = createClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableRooms, setAvailableRooms] = useState<Database['public']['Tables']['rooms']['Row'][]>([]);
  const [availableCustomers, setAvailableCustomers] = useState<Database['public']['Tables']['customers']['Row'][]>([]);
  const [showStatusChangeConfirm, setShowStatusChangeConfirm] = useState(false);
  const [statusChangeDetails, setStatusChangeDetails] = useState<{from: string, to: string, message: string} | null>(null);
  const [isLoadingData, startLoadingTransition] = useTransition();

  const form = useForm<BookingEditFormData>({
    resolver: zodResolver(bookingEditSchema),
    defaultValues: {
      room_id: booking.room_id,
      primary_customer_id: booking.primary_customer_id,
      check_in_date: booking.check_in_date,
      check_out_date: booking.check_out_date,
      total_guests: booking.total_guests,
      adults: booking.adults,
      children: booking.children,
      room_rate: Number(booking.room_rate),
      total_nights: booking.total_nights,
      booking_status: booking.booking_status as any,
      payment_status: booking.payment_status as any,
      gst_mode: (booking.gst_mode as any) || 'inclusive',
      booking_source: booking.booking_source as any,
      special_requests: booking.special_requests || '',
      extra_bed_count: booking.extra_bed_count || 0,
      extra_bed_rate: Number(booking.extra_bed_rate || 0),
      custom_rate_applied: booking.custom_rate_applied || false,
    }
  });

  const watchedValues = form.watch();

  // Calculate pricing in real-time
  const pricing = calculateBookingAmount({
    baseRoomRate: booking.rooms?.current_rate || watchedValues.room_rate,
    customRoomRate: watchedValues.custom_rate_applied ? watchedValues.room_rate : undefined,
    nights: watchedValues.total_nights,
    extraBeds: watchedValues.extra_bed_count > 0 ? {
      quantity: watchedValues.extra_bed_count,
      ratePerBed: watchedValues.extra_bed_rate
    } : undefined,
    gstMode: watchedValues.gst_mode
  });

  // Load data when dialog opens
  useEffect(() => {
    if (isOpen) {
      startLoadingTransition(async () => {
        try {
          const [roomsResult, customersResult] = await Promise.all([
            supabase.from('rooms').select('*').in('status', ['available', 'cleaning']).order('room_number'),
            supabase.from('customers').select('*').order('name')
          ]);

          // Include current room even if not available
          const rooms = roomsResult.data || [];
          if (booking.rooms && !rooms.find(r => r.id === booking.rooms!.id)) {
            rooms.push(booking.rooms);
          }

          setAvailableRooms(rooms);
          setAvailableCustomers(customersResult.data || []);
        } catch (error) {
          console.error('Error loading data:', error);
          toast.error('Failed to load room and customer data');
        }
      });
    }
  }, [isOpen, booking.rooms, booking.room_id]);

  const handleStatusChange = (newStatus: string) => {
    const currentStatus = watchedValues.booking_status;
    
    const statusTransitions: Record<string, Record<string, string>> = {
      confirmed: {
        checked_in: 'Mark guest as checked in? This will update room status to occupied.',
        cancelled: 'Cancel this booking? This action cannot be easily undone.',
        no_show: 'Mark as no-show? Guest did not arrive for their booking.',
        checked_out: 'Mark as checked out? This will skip the check-in process.',
      },
      checked_in: {
        checked_out: 'Check out guest? This will update room status to cleaning.',
        confirmed: 'Revert to confirmed status? Guest will be marked as not checked in.',
        cancelled: 'Cancel booking after check-in? This may require special handling.',
      },
      checked_out: {
        checked_in: 'Re-check in guest? This allows for miss-click correction or guest return.',
        confirmed: 'Revert to confirmed status? This undoes the check-out process.',
        cancelled: 'Cancel completed booking? This may require refund processing.',
      },
      cancelled: {
        confirmed: 'Restore booking? This will reactivate the cancelled booking.',
        checked_in: 'Mark as checked in? This restores and checks in the guest.',
        checked_out: 'Mark as checked out? This completes a previously cancelled booking.',
      },
      no_show: {
        confirmed: 'Restore booking? Guest arrived after being marked as no-show.',
        checked_in: 'Mark as checked in? Guest arrived late.',
        cancelled: 'Cancel no-show booking? This finalizes the cancellation.',
      }
    };

    const message = statusTransitions[currentStatus]?.[newStatus];
    
    if (message) {
      setStatusChangeDetails({ from: currentStatus, to: newStatus, message });
      setShowStatusChangeConfirm(true);
    } else {
      form.setValue('booking_status', newStatus as any);
    }
  };

  const confirmStatusChange = () => {
    if (statusChangeDetails) {
      form.setValue('booking_status', statusChangeDetails.to as any);
      setShowStatusChangeConfirm(false);
      setStatusChangeDetails(null);
    }
  };

  const onSubmit = async (data: BookingEditFormData) => {
    setIsSubmitting(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const updateData = {
        ...data,
        base_amount: pricing.baseAmount,
        gst_amount: pricing.gstAmount,
        total_amount: pricing.totalAmount,
        extra_bed_total: data.extra_bed_count > 0 ? 
          data.extra_bed_count * data.extra_bed_rate * data.total_nights : 0,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
        actual_check_in: data.booking_status === 'checked_in' && booking.booking_status !== 'checked_in' 
          ? new Date().toISOString() 
          : booking.actual_check_in,
        actual_check_out: data.booking_status === 'checked_out' && booking.booking_status !== 'checked_out'
          ? new Date().toISOString()
          : (data.booking_status !== 'checked_out' ? null : booking.actual_check_out)
      };

      const { data: updated, error } = await supabase
        .from('bookings')
        .update(updateData)
        .eq('id', booking.id)
        .select(`
          *,
          rooms (*),
          customers:primary_customer_id (*),
          booking_guests (*, customers (*))
        `)
        .single();

      if (error) throw error;

      toast.success('Booking updated successfully!');
      onUpdate(updated);
      onOpenChange(false);

    } catch (error: any) {
      console.error('Booking update error:', error);
      toast.error(error.message || 'Failed to update booking');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentStatusConfig = getBookingStatusConfig(watchedValues.booking_status);
  const originalStatusConfig = getBookingStatusConfig(booking.booking_status);
  
  const statusOptions = [
    { value: 'confirmed', label: 'Confirmed', icon: '✓', color: 'text-blue-600' },
    { value: 'checked_in', label: 'Checked In', icon: '🏠', color: 'text-green-600' },
    { value: 'checked_out', label: 'Checked Out', icon: '✅', color: 'text-gray-600' },
    { value: 'cancelled', label: 'Cancelled', icon: '❌', color: 'text-red-600' },
    { value: 'no_show', label: 'No Show', icon: '⚠️', color: 'text-orange-600' },
  ];

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl max-h-[95vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0 pb-4">
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit3 className="w-6 h-6" />
                Edit Booking - {booking.booking_number}
              </div>
              <Badge>
                {getBookingStatusConfig(booking.booking_status).label}
              </Badge>
            </DialogTitle>
            <DialogDescription>
              Modify booking details, status, and payment information
            </DialogDescription>
          </DialogHeader>

          {isLoadingData && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">Loading booking data...</span>
            </div>
          )}

          <div className="flex-1 overflow-auto">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Column - Main Details */}
                  <div className="lg:col-span-2 space-y-6">
                    {/* Status Management */}
                    <Card className="border-blue-200">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <ArrowRightLeft className="w-5 h-5" />
                          Status Management
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="booking_status"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Booking Status</FormLabel>
                                <Select value={field.value} onValueChange={handleStatusChange}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {statusOptions.map((option) => (
                                      <SelectItem key={option.value} value={option.value}>
                                        <div className="flex items-center gap-2">
                                          <span>{option.icon}</span>
                                          <span className={option.color}>{option.label}</span>
                                        </div>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="payment_status"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Payment Status</FormLabel>
                                <Select value={field.value} onValueChange={field.onChange}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="partial">Partial</SelectItem>
                                    <SelectItem value="paid">Paid</SelectItem>
                                    <SelectItem value="refunded">Refunded</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        {watchedValues.booking_status !== booking.booking_status && (
                          <Alert className="border-amber-200 bg-amber-50">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription className="text-amber-800">
                              Status will change from <strong>{originalStatusConfig.label}</strong> to{' '}
                              <strong>{currentStatusConfig.label}</strong> when you save.
                            </AlertDescription>
                          </Alert>
                        )}
                      </CardContent>
                    </Card>

                    {/* Room & Dates */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Hotel className="w-5 h-5" />
                          Room & Stay Details
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <FormField
                            control={form.control}
                            name="room_id"
                            render={({ field }) => (
                              <FormItem className="md:col-span-1">
                                <FormLabel>Room</FormLabel>
                                <Select value={field.value} onValueChange={field.onChange}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {availableRooms.map((room) => (
                                      <SelectItem key={room.id} value={room.id}>
                                        {room.room_number} - {room.room_type?.replace('-', ' ')}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="check_in_date"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Check-in Date</FormLabel>
                                <FormControl>
                                  <Input type="date" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="check_out_date"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Check-out Date</FormLabel>
                                <FormControl>
                                  <Input type="date" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <FormField
                            control={form.control}
                            name="total_nights"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Total Nights</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    min="1" 
                                    {...field} 
                                    onChange={(e) => field.onChange(Number(e.target.value))}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="total_guests"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Total Guests</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    min="1" 
                                    max="10"
                                    {...field} 
                                    onChange={(e) => field.onChange(Number(e.target.value))}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="adults"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Adults</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    min="1" 
                                    max="8"
                                    {...field} 
                                    onChange={(e) => field.onChange(Number(e.target.value))}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="children"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Children</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    min="0" 
                                    max="6"
                                    {...field} 
                                    onChange={(e) => field.onChange(Number(e.target.value))}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </CardContent>
                    </Card>

                    {/* Pricing */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <CreditCard className="w-5 h-5" />
                          Pricing & Charges
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-6 items-start">
                          <FormField
                            control={form.control}
                            name="room_rate"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Room Rate (per night)</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    min="100" 
                                    step="50"
                                    {...field} 
                                    onChange={(e) => field.onChange(Number(e.target.value))}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="extra_bed_count"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Extra Beds</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    min="0" 
                                    max="4"
                                    {...field} 
                                    onChange={(e) => field.onChange(Number(e.target.value))}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="extra_bed_rate"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Extra Bed Rate</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    min="0" 
                                    step="50"
                                    {...field} 
                                    onChange={(e) => field.onChange(Number(e.target.value))}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="gst_mode"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>GST Mode</FormLabel>
                                <Select value={field.value} onValueChange={field.onChange}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="inclusive">Inclusive (tax included)</SelectItem>
                                    <SelectItem value="exclusive">Exclusive (tax added)</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="custom_rate_applied"
                            render={({ field }) => (
                              <FormItem className="flex items-center justify-between p-3 border rounded-lg md:col-span-2 h-full">
                                <div>
                                  <FormLabel className="text-base">Custom Rate Applied</FormLabel>
                                  <div className="text-sm text-gray-500">Override standard rate</div>
                                </div>
                                <FormControl>
                                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Right Column */}
                  <div className="lg:col-span-1 space-y-6">
                    {/* Real-time pricing display */}
                    <Card className="sticky top-4">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg">Pricing Breakdown</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <p className="text-gray-600">Base Amount</p>
                          <p className="font-medium">₹{pricing.baseAmount.toLocaleString('en-IN')}</p>
                        </div>
                         <div className="flex justify-between text-sm">
                          <p className="text-gray-600">GST Amount</p>
                          <p className="font-medium">₹{pricing.gstAmount.toLocaleString('en-IN')}</p>
                        </div>
                        <div className="flex justify-between text-sm">
                          <p className="text-gray-600">Extra Beds Total</p>
                          <p className="font-medium">
                            ₹{(watchedValues.extra_bed_count * watchedValues.extra_bed_rate * watchedValues.total_nights).toLocaleString('en-IN')}
                          </p>
                        </div>
                        <Separator />
                        <div className="flex justify-between items-center">
                          <p className="text-gray-800 font-medium text-lg">Total Amount</p>
                          <p className="font-bold text-xl">₹{pricing.totalAmount.toLocaleString('en-IN')}</p>
                        </div>
                      </CardContent>
                    </Card>
                    
                    {/* Other Details */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Users className="w-5 h-5" />
                          Additional Details
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <FormField
                          control={form.control}
                          name="primary_customer_id"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Primary Guest</FormLabel>
                              <Select value={field.value} onValueChange={field.onChange}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {availableCustomers.map((customer) => (
                                    <SelectItem key={customer.id} value={customer.id}>
                                      {customer.name} - {customer.phone}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="booking_source"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Booking Source</FormLabel>
                              <Select value={field.value} onValueChange={field.onChange}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="walk_in">Walk-in</SelectItem>
                                  <SelectItem value="phone">Phone</SelectItem>
                                  <SelectItem value="online">Online</SelectItem>
                                  <SelectItem value="agent">Agent</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="special_requests"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Special Requests</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Any special requests or notes..."
                                  className="min-h-[80px]"
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-4 mt-6 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  
                  <Button
                    type="submit"
                    disabled={isSubmitting || isLoadingData}
                    className="min-w-[120px] md:min-w-[140px]"
                  >
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </DialogContent>
      </Dialog>

      {/* Status Change Confirmation */}
      <Dialog open={showStatusChangeConfirm} onOpenChange={setShowStatusChangeConfirm}>
        <DialogContent className="max-w-lg w-[90vw] md:w-[70vw] lg:w-[50vw]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Confirm Status Change
            </DialogTitle>
          </DialogHeader>
          
          {statusChangeDetails && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">Status Change:</p>
                <div className="flex items-center gap-3">
                  <Badge className={getBookingStatusConfig(statusChangeDetails.from).color}>
                    {getBookingStatusConfig(statusChangeDetails.from).label}
                  </Badge>
                  <ArrowRightLeft className="w-4 h-4 text-gray-400" />
                  <Badge className={getBookingStatusConfig(statusChangeDetails.to).color}>
                    {getBookingStatusConfig(statusChangeDetails.to).label}
                  </Badge>
                </div>
              </div>
              
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  {statusChangeDetails.message}
                </AlertDescription>
              </Alert>

              <div className="flex justify-end gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => setShowStatusChangeConfirm(false)}
                >
                  Cancel
                </Button>
                <Button onClick={confirmStatusChange}>
                  Confirm Change
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
} 