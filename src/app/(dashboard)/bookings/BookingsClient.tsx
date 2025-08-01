'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BookingWizard } from '@/components/bookings/BookingWizard';
import { BookingEditor } from '@/components/bookings/BookingEditor';
import { 
  Plus, 
  Search, 
  Calendar, 
  Eye,
  Edit,
  CheckCircle,
  RefreshCw,
  MoreHorizontal
} from 'lucide-react';
import { Database } from '@/lib/supabase/types';
import { getBookingStatusConfig } from '@/lib/utils/hotel';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Booking as BookingType } from '@/lib/types/booking';

type Booking = Database['public']['Tables']['bookings']['Row'] & {
  rooms: Pick<Database['public']['Tables']['rooms']['Row'], 'room_number' | 'room_type'> | null;
  customers: Pick<Database['public']['Tables']['customers']['Row'], 'name' | 'phone' | 'email'> | null;
};

type FullBooking = Database['public']['Tables']['bookings']['Row'] & {
  rooms: Database['public']['Tables']['rooms']['Row'] | null;
  customers: Database['public']['Tables']['customers']['Row'] | null;
  booking_guests?: {
    customers: Database['public']['Tables']['customers']['Row'];
    is_primary: boolean;
  }[];
};

interface BookingsClientProps {
  initialBookings: Booking[];
}

export function BookingsClient({ initialBookings }: BookingsClientProps) {
  const supabase = createClient();
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>(initialBookings);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>(initialBookings);
  const [loading, setLoading] = useState(initialBookings.length === 0);
  const [showWizard, setShowWizard] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [editingBookingId, setEditingBookingId] = useState<string | null>(null);
  const [editingBooking, setEditingBooking] = useState<FullBooking | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);

  const fetchBookings = useCallback(async (isRefetch = false) => {
    if (isRefetch) {
      setLoading(true);
    }
    const { data, error } = await supabase
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
      toast.error('Failed to load bookings');
      console.error('Error fetching bookings:', error);
    } else {
      setBookings(data || []);
    }
    if (isRefetch) {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    if (initialBookings.length === 0) {
      fetchBookings(true);
    }

    const channel = supabase
      .channel('realtime-bookings')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bookings' },
        (payload) => {
          console.log('Booking change received!', payload);
          toast.info('Booking list has been updated.');
          fetchBookings();
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, fetchBookings, initialBookings.length]);

  const filterBookings = useCallback(() => {
    let filtered = [...bookings];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(booking => 
        booking.booking_number.toLowerCase().includes(query) ||
        booking.customers?.name.toLowerCase().includes(query) ||
        booking.customers?.phone.includes(query) ||
        booking.rooms?.room_number.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(booking => booking.booking_status === statusFilter);
    }

    // Payment filter
    if (paymentFilter !== 'all') {
      filtered = filtered.filter(booking => booking.payment_status === paymentFilter);
    }

    // Date filter
    if (dateFilter !== 'all') {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      
      filtered = filtered.filter(booking => {
        switch (dateFilter) {
          case 'today':
            return booking.check_in_date === todayStr || booking.check_out_date === todayStr;
          case 'upcoming':
            return booking.check_in_date > todayStr;
          case 'current':
            return booking.check_in_date <= todayStr && booking.check_out_date >= todayStr;
          case 'past':
            return booking.check_out_date < todayStr;
          default:
            return true;
        }
      });
    }

    setFilteredBookings(filtered);
  }, [bookings, searchQuery, statusFilter, dateFilter, paymentFilter]);

  useEffect(() => {
    filterBookings();
  }, [filterBookings]);

  const handleBookingComplete = (booking: BookingType) => {
    setShowWizard(false);
    setEditingBookingId(null);
    fetchBookings();
    toast.success(`Booking ${booking.booking_number} created successfully!`);
  };

  const handleBookingUpdate = (updatedBooking: FullBooking) => {
    setShowEditDialog(false);
    setEditingBooking(null);
    fetchBookings();
    toast.success(`Booking ${updatedBooking.booking_number} updated successfully!`);
  };

  const handleCheckIn = async (bookingId: string) => {
    const { error } = await supabase
      .from('bookings')
      .update({
        booking_status: 'checked_in',
        actual_check_in: new Date().toISOString()
      })
      .eq('id', bookingId);

    if (error) {
      toast.error('Failed to check in guest');
    } else {
      toast.success('Guest checked in successfully');
      fetchBookings();
    }
  };

  const handleCheckOut = async (bookingId: string) => {
    const { error } = await supabase
      .from('bookings')
      .update({
        booking_status: 'checked_out',
        actual_check_out: new Date().toISOString()
      })
      .eq('id', bookingId);

    if (error) {
      toast.error('Failed to check out guest');
    } else {
      toast.success('Guest checked out successfully');
      fetchBookings();
    }
  };

  const getQuickStats = () => {
    const today = new Date().toISOString().split('T')[0];
    
    return {
      total: bookings.length,
      confirmed: bookings.filter(b => b.booking_status === 'confirmed').length,
      checkedIn: bookings.filter(b => b.booking_status === 'checked_in').length,
      todayCheckIns: bookings.filter(b => b.check_in_date === today && b.booking_status === 'confirmed').length,
      todayCheckOuts: bookings.filter(b => b.check_out_date === today && b.booking_status === 'checked_in').length,
      pendingPayments: bookings.filter(b => b.payment_status === 'pending' || b.payment_status === 'partial').length
    };
  };

  const stats = getQuickStats();

  const openNewBookingWizard = () => {
    setEditingBookingId(null);
    setShowWizard(true);
  };

  const handleEdit = async (bookingId: string) => {
    // Fetch full booking details for editing
    const { data: fullBooking, error } = await supabase
      .from('bookings')
      .select(`
        *,
        rooms (*),
        customers (*),
        booking_guests (*, customers (*))
      `)
      .eq('id', bookingId)
      .single();

    if (error) {
      toast.error('Failed to load booking details');
      console.error('Error fetching booking:', error);
      return;
    }

    setEditingBooking(fullBooking);
    setShowEditDialog(true);
  };

  const handleView = (bookingId: string) => {
    router.push(`/bookings/${bookingId}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Booking Management</h1>
          <p className="text-gray-600 mt-1">Manage reservations, check-ins, and payments</p>
        </div>
        <Button onClick={openNewBookingWizard}>
          <Plus className="w-4 h-4 mr-2" />
          New Booking
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
            <p className="text-sm text-gray-600">Total Bookings</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{stats.confirmed}</p>
            <p className="text-sm text-gray-600">Confirmed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-purple-600">{stats.checkedIn}</p>
            <p className="text-sm text-gray-600">Checked In</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-orange-600">{stats.todayCheckIns}</p>
            <p className="text-sm text-gray-600">Today Check-ins</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-teal-600">{stats.todayCheckOuts}</p>
            <p className="text-sm text-gray-600">Today Check-outs</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-red-600">{stats.pendingPayments}</p>
            <p className="text-sm text-gray-600">Pending Payments</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search bookings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Booking Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="checked_in">Checked In</SelectItem>
                <SelectItem value="checked_out">Checked Out</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="no_show">No Show</SelectItem>
              </SelectContent>
            </Select>

            <Select value={paymentFilter} onValueChange={setPaymentFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Payment Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Payments</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
              </SelectContent>
            </Select>

            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Date Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Dates</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="upcoming">Upcoming</SelectItem>
                <SelectItem value="current">Current Stay</SelectItem>
                <SelectItem value="past">Past</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Bookings List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>All Bookings ({filteredBookings.length})</CardTitle>
          <Button variant="outline" size="sm" onClick={() => fetchBookings(true)}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="text-center py-8 text-gray-600">
              <Calendar className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-lg font-medium mb-2">No bookings found</p>
              <p>Try adjusting your filters or create a new booking</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Mobile View */}
              <div className="block lg:hidden space-y-4">
                {filteredBookings.map((booking) => {
                  const statusConfig = getBookingStatusConfig(booking.booking_status);
                  const canCheckIn = booking.booking_status === 'confirmed' && 
                    booking.check_in_date <= new Date().toISOString().split('T')[0];
                  const canCheckOut = booking.booking_status === 'checked_in';
                  
                  return (
                    <Card key={booking.id} className="border-l-4 border-l-blue-500">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-semibold text-lg">{booking.booking_number}</h3>
                            <p className="text-gray-600">{booking.customers?.name}</p>
                          </div>
                          <Badge className={statusConfig.color}>
                            {statusConfig.icon} {statusConfig.label}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                          <div>
                            <p className="text-gray-600">Room</p>
                            <p className="font-medium">{booking.rooms?.room_number}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Amount</p>
                            <p className="font-medium">₹{booking.total_amount.toLocaleString('en-IN')}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Check-in</p>
                            <p className="font-medium">{new Date(booking.check_in_date).toLocaleDateString()}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Check-out</p>
                            <p className="font-medium">{new Date(booking.check_out_date).toLocaleDateString()}</p>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          {canCheckIn && (
                            <Button size="sm" onClick={() => handleCheckIn(booking.id)}>
                              Check In
                            </Button>
                          )}
                          {canCheckOut && (
                            <Button size="sm" variant="outline" onClick={() => handleCheckOut(booking.id)}>
                              Check Out
                            </Button>
                          )}
                          <Button size="sm" variant="ghost" onClick={() => handleView(booking.id)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleEdit(booking.id)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Desktop Table View */}
              <div className="hidden lg:block">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3 font-medium">Booking #</th>
                        <th className="text-left p-3 font-medium">Guest</th>
                        <th className="text-left p-3 font-medium">Room</th>
                        <th className="text-left p-3 font-medium">Dates</th>
                        <th className="text-left p-3 font-medium">Amount</th>
                        <th className="text-left p-3 font-medium">Status</th>
                        <th className="text-left p-3 font-medium">Payment</th>
                        <th className="text-left p-3 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBookings.map((booking) => {
                        const statusConfig = getBookingStatusConfig(booking.booking_status);
                        const canCheckIn = booking.booking_status === 'confirmed' && 
                          booking.check_in_date <= new Date().toISOString().split('T')[0];
                        const canCheckOut = booking.booking_status === 'checked_in';
                        
                        return (
                          <tr key={booking.id} className="border-b hover:bg-gray-50">
                            <td className="p-3">
                              <div>
                                <p className="font-medium">{booking.booking_number}</p>
                                <p className="text-sm text-gray-500">
                                  {new Date(booking.created_at).toLocaleDateString()}
                                </p>
                              </div>
                            </td>
                            <td className="p-3">
                              <div>
                                <p className="font-medium">{booking.customers?.name}</p>
                                <p className="text-sm text-gray-500">{booking.customers?.phone}</p>
                              </div>
                            </td>
                            <td className="p-3">
                              <div>
                                <p className="font-medium">{booking.rooms?.room_number}</p>
                                <p className="text-sm text-gray-500 capitalize">
                                  {booking.rooms?.room_type?.replace('-', ' ')}
                                </p>
                              </div>
                            </td>
                            <td className="p-3">
                              <div className="text-sm">
                                <p>{new Date(booking.check_in_date).toLocaleDateString()}</p>
                                <p className="text-gray-500">to {new Date(booking.check_out_date).toLocaleDateString()}</p>
                                <p className="text-gray-500">{booking.total_nights} nights</p>
                              </div>
                            </td>
                            <td className="p-3">
                              <div className="text-sm">
                                <p className="font-medium">₹{booking.total_amount.toLocaleString('en-IN')}</p>
                                <p className="text-gray-500">
                                  Paid: ₹{booking.paid_amount.toLocaleString('en-IN')}
                                </p>
                              </div>
                            </td>
                            <td className="p-3">
                              <Badge className={statusConfig.color}>
                                {statusConfig.icon} {statusConfig.label}
                              </Badge>
                            </td>
                            <td className="p-3">
                              <Badge 
                                variant={
                                  booking.payment_status === 'paid' ? 'default' :
                                  booking.payment_status === 'partial' ? 'secondary' :
                                  'outline'
                                }
                              >
                                {booking.payment_status}
                              </Badge>
                            </td>
                            <td className="p-3">
                              <div className="flex gap-1">
                                {canCheckIn && (
                                  <Button size="sm" onClick={() => handleCheckIn(booking.id)}>
                                    <CheckCircle className="w-4 h-4" />
                                  </Button>
                                )}
                                {canCheckOut && (
                                  <Button size="sm" variant="outline" onClick={() => handleCheckOut(booking.id)}>
                                    Check Out
                                  </Button>
                                )}
                                <Button size="sm" variant="ghost" onClick={() => handleView(booking.id)}>
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => handleEdit(booking.id)}>
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button size="sm" variant="ghost">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Booking Wizard Dialog */}
      <BookingWizard
        isOpen={showWizard}
        bookingId={editingBookingId || undefined}
        onOpenChange={setShowWizard}
        onComplete={handleBookingComplete}
        onCancel={() => { setShowWizard(false); setEditingBookingId(null); }}
      />

      {/* Booking Editor Dialog */}
      {editingBooking && (
        <BookingEditor
          booking={editingBooking}
          isOpen={showEditDialog}
          onOpenChange={setShowEditDialog}
          onUpdate={handleBookingUpdate}
        />
      )}
    </div>
  );
} 