"use client";

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useRouter } from 'next/navigation';
import { getBookingStatusConfig } from '@/lib/utils/hotel';
import { Database } from '@/lib/supabase/types';
import { BookingEditor } from '@/components/bookings/BookingEditor';
import { 
  ArrowLeft, 
  Edit3, 
  CheckCircle, 
  RotateCcw, 
  UserX, 
  Ban,
  AlertTriangle,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Users,
  Hotel,
  CreditCard,
  FileText,
  Printer,
  RefreshCw,
  ArrowRightLeft,
} from 'lucide-react';
import { toast } from 'sonner';

type BookingRow = Database['public']['Tables']['bookings']['Row'] & {
  rooms: Database['public']['Tables']['rooms']['Row'] | null;
  customers: Database['public']['Tables']['customers']['Row'] | null;
  booking_guests?: {
    customers: Database['public']['Tables']['customers']['Row'];
    is_primary: boolean;
  }[];
};

type BookingStatus = Database['public']['Enums']['booking_status'];

interface Props {
  booking: BookingRow;
}

export default function BookingDetailsClient({ booking: initialBooking }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const [booking, setBooking] = useState(initialBooking);
  const [showEditor, setShowEditor] = useState(false);
  const [showStatusConfirm, setShowStatusConfirm] = useState(false);
  const [statusChangeDetails, setStatusChangeDetails] = useState<{status: BookingStatus, message: string} | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const statusConfig = getBookingStatusConfig(booking.booking_status);

  // Quick status change handlers
  const requestStatusChange = (newStatus: BookingStatus, message: string) => {
    setStatusChangeDetails({ status: newStatus, message });
    setShowStatusConfirm(true);
  };

  const handleQuickStatusChange = async () => {
    if (!statusChangeDetails) return;

    setIsUpdatingStatus(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const updateData: Database['public']['Tables']['bookings']['Update'] = {
        booking_status: statusChangeDetails.status,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      };

      // Set actual check-in/out times based on status
      if (statusChangeDetails.status === 'checked_in' && booking.booking_status !== 'checked_in') {
        updateData.actual_check_in = new Date().toISOString();
      } else if (statusChangeDetails.status === 'checked_out' && booking.booking_status !== 'checked_out') {
        updateData.actual_check_out = new Date().toISOString();
      } else if (statusChangeDetails.status !== 'checked_out') {
        updateData.actual_check_out = null;
      }

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

      setBooking(updated);
      toast.success(`Booking status updated to ${getBookingStatusConfig(statusChangeDetails.status).label}`);
      setShowStatusConfirm(false);
      setStatusChangeDetails(null);

    } catch (error: unknown) {
      console.error('Status update error:', error);
      if (error instanceof Error) {
        toast.error(error.message || 'Failed to update booking status');
      } else {
        toast.error('An unknown error occurred while updating status.');
      }
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Handle booking update from editor
  const handleBookingUpdate = (updatedBooking: BookingRow) => {
    setBooking(updatedBooking);
    toast.success('Booking updated successfully!');
  };

  // Get available quick actions based on current status
  const getQuickActions = () => {
    const actions = [];
    
    switch (booking.booking_status) {
      case 'confirmed':
        actions.push({
          label: 'Check In',
          icon: CheckCircle,
          variant: 'default' as const,
          onClick: () => requestStatusChange('checked_in', 'Mark guest as checked in? This will update room status to occupied.')
        });
        actions.push({
          label: 'No Show',
          icon: UserX,
          variant: 'outline' as const,
          onClick: () => requestStatusChange('no_show', 'Mark as no-show? Guest did not arrive for their booking.')
        });
        actions.push({
          label: 'Cancel',
          icon: Ban,
          variant: 'destructive' as const,
          onClick: () => requestStatusChange('cancelled', 'Cancel this booking? This action may require refund processing.')
        });
        break;

      case 'checked_in':
        actions.push({
          label: 'Check Out',
          icon: CheckCircle,
          variant: 'default' as const,
          onClick: () => requestStatusChange('checked_out', 'Check out guest? This will update room status to cleaning.')
        });
        actions.push({
          label: 'Revert to Confirmed',
          icon: RotateCcw,
          variant: 'outline' as const,
          onClick: () => requestStatusChange('confirmed', 'Revert to confirmed status? Guest will be marked as not checked in.')
        });
        break;

      case 'checked_out':
        actions.push({
          label: 'Re-Check In',
          icon: RefreshCw,
          variant: 'default' as const,
          onClick: () => requestStatusChange('checked_in', 'Re-check in guest? This allows for miss-click correction or guest return.')
        });
        actions.push({
          label: 'Revert to Confirmed',
          icon: RotateCcw,
          variant: 'outline' as const,
          onClick: () => requestStatusChange('confirmed', 'Revert to confirmed status? This undoes the check-out process.')
        });
        break;

      case 'cancelled':
        actions.push({
          label: 'Restore Booking',
          icon: RefreshCw,
          variant: 'default' as const,
          onClick: () => requestStatusChange('confirmed', 'Restore booking? This will reactivate the cancelled booking.')
        });
        actions.push({
          label: 'Check In',
          icon: CheckCircle,
          variant: 'outline' as const,
          onClick: () => requestStatusChange('checked_in', 'Mark as checked in? This restores and checks in the guest.')
        });
        break;

      case 'no_show':
        actions.push({
          label: 'Mark Arrived',
          icon: CheckCircle,
          variant: 'default' as const,
          onClick: () => requestStatusChange('checked_in', 'Mark as checked in? Guest arrived late.')
        });
        actions.push({
          label: 'Restore Booking',
          icon: RotateCcw,
          variant: 'outline' as const,
          onClick: () => requestStatusChange('confirmed', 'Restore booking? Guest arrived after being marked as no-show.')
        });
        break;
    }

    return actions;
  };

  const quickActions = getQuickActions();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.back()} className="flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Back to Bookings
        </Button>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Printer className="w-4 h-4 mr-2" />
            Print Receipt
          </Button>
          <Button onClick={() => setShowEditor(true)} className="flex items-center gap-2">
            <Edit3 className="w-4 h-4" />
            Edit Booking
          </Button>
        </div>
      </div>

      {/* Status & Quick Actions */}
      <Card className="border-2 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span>Booking #{booking.booking_number}</span>
              <Badge className={statusConfig.color}>
                {statusConfig.icon} {statusConfig.label}
              </Badge>
            </div>
            <div className="flex gap-2">
              {quickActions.map((action, index) => (
                <Button
                  key={index}
                  variant={action.variant}
                  size="sm"
                  onClick={action.onClick}
                  className="flex items-center gap-2"
                >
                  <action.icon className="w-4 h-4" />
                  {action.label}
                </Button>
              ))}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-600">
            {statusConfig.description}
            {booking.actual_check_in && (
              <span className="ml-2">• Checked in: {new Date(booking.actual_check_in).toLocaleString()}</span>
            )}
            {booking.actual_check_out && (
              <span className="ml-2">• Checked out: {new Date(booking.actual_check_out).toLocaleString()}</span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Booking Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Guest Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Guest Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-600">Primary Guest</p>
              <p className="font-medium text-lg">{booking.customers?.name}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 flex items-center gap-1">
                  <Phone className="w-3 h-3" />
                  Phone
                </p>
                <p className="font-medium">{booking.customers?.phone}</p>
              </div>
              
              {booking.customers?.email && (
                <div>
                  <p className="text-sm text-gray-600 flex items-center gap-1">
                    <Mail className="w-3 h-3" />
                    Email
                  </p>
                  <p className="font-medium">{booking.customers.email}</p>
                </div>
              )}
            </div>

            {booking.customers?.address_line1 && (
              <div>
                <p className="text-sm text-gray-600 flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  Address
                </p>
                <p className="font-medium">
                  {booking.customers.address_line1}
                  {booking.customers.city && `, ${booking.customers.city}`}
                  {booking.customers.state && `, ${booking.customers.state}`}
                  {booking.customers.pin_code && ` - ${booking.customers.pin_code}`}
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Total Guests</p>
                <p className="font-medium">{booking.total_guests}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Adults / Children</p>
                <p className="font-medium">{booking.adults} / {booking.children}</p>
              </div>
            </div>

            {booking.booking_guests && booking.booking_guests.length > 0 && (
              <div>
                <p className="text-sm text-gray-600 mb-2">Additional Guests</p>
                <ul className="space-y-1">
                  {booking.booking_guests
                    .filter((g) => !g.is_primary)
                    .map((g, index) => (
                      <li key={index} className="text-sm p-2 bg-gray-50 rounded">
                        {g.customers.name}
                      </li>
                    ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Room & Stay Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Hotel className="w-5 h-5" />
              Room & Stay Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-600">Room</p>
              <p className="font-medium text-lg">{booking.rooms?.room_number}</p>
              <p className="text-sm text-gray-500 capitalize">
                {booking.rooms?.room_type?.replace('-', ' ')}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Check-in
                </p>
                <p className="font-medium">
                  {new Date(booking.check_in_date).toLocaleDateString('en-IN', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
              
              <div>
                <p className="text-sm text-gray-600 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Check-out
                </p>
                <p className="font-medium">
                  {new Date(booking.check_out_date).toLocaleDateString('en-IN', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Total Nights</p>
                <p className="font-medium">{booking.total_nights}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Booking Source</p>
                <p className="font-medium capitalize">{booking.booking_source?.replace('_', ' ')}</p>
              </div>
            </div>

            {booking.extra_bed_count && booking.extra_bed_count > 0 && (
              <div>
                <p className="text-sm text-gray-600">Extra Beds</p>
                <p className="font-medium">
                  {booking.extra_bed_count} bed{booking.extra_bed_count > 1 ? 's' : ''} @ ₹{booking.extra_bed_rate}/night
                </p>
              </div>
            )}

            {booking.special_requests && (
              <div>
                <p className="text-sm text-gray-600 flex items-center gap-1">
                  <FileText className="w-3 h-3" />
                  Special Requests
                </p>
                <p className="font-medium p-2 bg-gray-50 rounded text-sm">
                  {booking.special_requests}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Billing Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Billing Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-gray-600">Room Rate</p>
              <p className="font-medium">₹{Number(booking.room_rate).toLocaleString('en-IN')}/night</p>
              {booking.custom_rate_applied && (
                <Badge variant="secondary" className="text-xs mt-1">Custom Rate</Badge>
              )}
            </div>

            <div>
              <p className="text-sm text-gray-600">Base Amount</p>
              <p className="font-medium">₹{Number(booking.base_amount).toLocaleString('en-IN')}</p>
            </div>

            <div>
              <p className="text-sm text-gray-600">GST ({booking.gst_mode === 'inclusive' ? 'Incl' : 'Excl'})</p>
              <p className="font-medium">₹{Number(booking.gst_amount).toLocaleString('en-IN')}</p>
            </div>

            <div>
              <p className="text-sm text-gray-600 font-medium">Total Amount</p>
              <p className="font-bold text-xl">₹{Number(booking.total_amount).toLocaleString('en-IN')}</p>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600">Payment Status</p>
                <Badge 
                  variant={
                    booking.payment_status === 'paid' ? 'default' :
                    booking.payment_status === 'partial' ? 'secondary' :
                    'outline'
                  }
                  className="mt-1"
                >
                  {booking.payment_status}
                </Badge>
              </div>
              
              <div>
                <p className="text-sm text-gray-600">Paid Amount</p>
                <p className="font-medium">₹{Number(booking.paid_amount).toLocaleString('en-IN')}</p>
              </div>

              <div>
                <p className="text-sm text-gray-600">Due Amount</p>
                <p className="font-medium">₹{Number(booking.due_amount).toLocaleString('en-IN')}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Booking Editor Dialog */}
      <BookingEditor 
        booking={booking}
        isOpen={showEditor}
        onOpenChange={setShowEditor}
        onUpdate={handleBookingUpdate}
      />

      {/* Status Change Confirmation Dialog */}
      <Dialog open={showStatusConfirm} onOpenChange={setShowStatusConfirm}>
        <DialogContent className="max-w-lg w-[90vw] md:w-[70vw] lg:w-[50vw]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Confirm Status Change
            </DialogTitle>
            <DialogDescription>
              {statusChangeDetails?.message}
            </DialogDescription>
          </DialogHeader>
          
          {statusChangeDetails && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">Status Change:</p>
                <div className="flex items-center gap-3">
                  <Badge className={statusConfig.color}>
                    {statusConfig.label}
                  </Badge>
                  <ArrowRightLeft className="w-4 h-4 text-gray-400" />
                  <Badge className={getBookingStatusConfig(statusChangeDetails.status).color}>
                    {getBookingStatusConfig(statusChangeDetails.status).label}
                  </Badge>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => setShowStatusConfirm(false)}
                  disabled={isUpdatingStatus}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleQuickStatusChange}
                  disabled={isUpdatingStatus}
                >
                  {isUpdatingStatus && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
                  Confirm Change
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} 