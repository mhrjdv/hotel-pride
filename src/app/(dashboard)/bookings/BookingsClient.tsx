'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
  RotateCcw,
  MoreHorizontal,
  ChevronUpIcon,
  ChevronDown
} from '@/components/icons';
import { Database } from '@/lib/supabase/types';
import { getBookingStatusConfig } from '@/lib/utils/hotel';
import { toast } from 'sonner';
import { useRouter, useSearchParams } from 'next/navigation';
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

type SortColumn = 'created' | 'booking_number' | 'guest' | 'room' | 'check_in' | 'amount' | 'status';
type SortDirection = 'asc' | 'desc';

export function BookingsClient({ initialBookings }: BookingsClientProps) {
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [bookings, setBookings] = useState<Booking[]>(initialBookings);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>(initialBookings);
  const [loading, setLoading] = useState(initialBookings.length === 0);
  const [showWizard, setShowWizard] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [sortColumn, setSortColumn] = useState<SortColumn>('created');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [editingBookingId, setEditingBookingId] = useState<string | null>(null);
  const [editingBooking, setEditingBooking] = useState<FullBooking | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  // Outstanding-balance checkout dialog state
  const [checkoutBooking, setCheckoutBooking] = useState<Booking | null>(null);
  const [checkoutProcessing, setCheckoutProcessing] = useState(false);

  // Open the wizard directly when arriving from "New booking" elsewhere
  // (e.g. the dashboard) via /bookings?new=1, and honour ?filter=.
  useEffect(() => {
    if (searchParams.get('new') === '1') {
      setEditingBookingId(null);
      setShowWizard(true);
    }
    const f = searchParams.get('filter');
    if (f === 'pending') setPaymentFilter('pending');
    if (f === 'today') setDateFilter('today');
  }, [searchParams]);

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
        (payload: unknown) => {
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

    // Date quick filter
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

    // Date-range filter on check-in date
    if (dateFrom) {
      filtered = filtered.filter(booking => booking.check_in_date >= dateFrom);
    }
    if (dateTo) {
      filtered = filtered.filter(booking => booking.check_in_date <= dateTo);
    }

    // Sorting
    const dir = sortDirection === 'asc' ? 1 : -1;
    const compare = (a: Booking, b: Booking): number => {
      switch (sortColumn) {
        case 'booking_number':
          return a.booking_number.localeCompare(b.booking_number) * dir;
        case 'guest':
          return (a.customers?.name ?? '').localeCompare(b.customers?.name ?? '') * dir;
        case 'room':
          return (a.rooms?.room_number ?? '').localeCompare(b.rooms?.room_number ?? '', undefined, { numeric: true }) * dir;
        case 'check_in':
          return (new Date(a.check_in_date).getTime() - new Date(b.check_in_date).getTime()) * dir;
        case 'amount':
          return (a.total_amount - b.total_amount) * dir;
        case 'status':
          return a.booking_status.localeCompare(b.booking_status) * dir;
        case 'created':
        default:
          return (new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) * dir;
      }
    };
    filtered.sort(compare);

    setFilteredBookings(filtered);
  }, [bookings, searchQuery, statusFilter, dateFilter, paymentFilter, dateFrom, dateTo, sortColumn, sortDirection]);

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const sortIndicator = (column: SortColumn) => {
    if (sortColumn !== column) {
      return <ChevronDown className="w-3.5 h-3.5 text-gray-300" aria-hidden="true" />;
    }
    return sortDirection === 'asc'
      ? <ChevronUpIcon className="w-3.5 h-3.5 text-gray-700" aria-hidden="true" />
      : <ChevronDown className="w-3.5 h-3.5 text-gray-700" aria-hidden="true" />;
  };

  const ariaSort = (column: SortColumn): 'ascending' | 'descending' | 'none' =>
    sortColumn === column ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none';

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

  // Outstanding balance for a booking (defensive: derive from total - paid
  // when due_amount is missing/stale, and never go negative).
  const getDueAmount = (booking: Booking): number => {
    const due = booking.due_amount ?? (booking.total_amount - booking.paid_amount);
    return Math.max(0, due);
  };

  // Persist the actual check-out for a booking. Used directly when nothing is
  // owed, and after settling the balance from the outstanding-balance dialog.
  const performCheckOut = async (bookingId: string): Promise<boolean> => {
    const { error } = await supabase
      .from('bookings')
      .update({
        booking_status: 'checked_out',
        actual_check_out: new Date().toISOString()
      })
      .eq('id', bookingId);

    if (error) {
      toast.error('Failed to check out guest');
      return false;
    }
    toast.success('Guest checked out successfully');
    fetchBookings();
    return true;
  };

  const handleCheckOut = async (bookingId: string) => {
    const booking = bookings.find(b => b.id === bookingId);
    // If we can't resolve the booking or nothing is owed, check out directly.
    if (!booking || getDueAmount(booking) <= 0) {
      await performCheckOut(bookingId);
      return;
    }
    // Balance remaining: ask how to settle before checking out.
    setCheckoutBooking(booking);
  };

  // Settle a remaining balance by recording it as fully paid, then check out.
  // Safe against the DB CHECKs: paid_amount = total_amount, due_amount = 0,
  // total_amount left untouched.
  const handleCollectPayment = async () => {
    if (!checkoutBooking) return;
    const booking = checkoutBooking;
    setCheckoutProcessing(true);
    const { error } = await supabase
      .from('bookings')
      .update({
        paid_amount: booking.total_amount,
        due_amount: 0,
        payment_status: 'paid',
      })
      .eq('id', booking.id);

    if (error) {
      toast.error('Failed to record payment');
      setCheckoutProcessing(false);
      return;
    }
    toast.success(`Payment of ₹${getDueAmount(booking).toLocaleString('en-IN')} collected`);
    const ok = await performCheckOut(booking.id);
    setCheckoutProcessing(false);
    if (ok) setCheckoutBooking(null);
  };

  // Waive the remaining balance: mark it settled and append an auditable note.
  // total_amount is left untouched to keep the base/discount/gst CHECK valid.
  const handleWaiveBalance = async () => {
    if (!checkoutBooking) return;
    const booking = checkoutBooking;
    const due = getDueAmount(booking);
    setCheckoutProcessing(true);
    const waiverNote = `Balance ₹${due.toLocaleString('en-IN')} waived at checkout`;
    const note = booking.special_requests
      ? `${booking.special_requests}\n${waiverNote}`
      : waiverNote;
    const { error } = await supabase
      .from('bookings')
      .update({
        paid_amount: booking.total_amount,
        due_amount: 0,
        payment_status: 'paid',
        special_requests: note,
      })
      .eq('id', booking.id);

    if (error) {
      toast.error('Failed to waive balance');
      setCheckoutProcessing(false);
      return;
    }
    toast.success(`Balance of ₹${due.toLocaleString('en-IN')} waived`);
    const ok = await performCheckOut(booking.id);
    setCheckoutProcessing(false);
    if (ok) setCheckoutBooking(null);
  };

  // Reverse an accidental check-in (back to confirmed) and free the room.
  const handleUndoCheckIn = async (bookingId: string, roomId?: string | null) => {
    const { error } = await supabase
      .from('bookings')
      .update({ booking_status: 'confirmed', actual_check_in: null })
      .eq('id', bookingId);
    if (error) {
      toast.error('Failed to undo check-in');
      return;
    }
    if (roomId) {
      await supabase.from('rooms').update({ status: 'available' }).eq('id', roomId);
    }
    toast.success('Check-in reversed');
    fetchBookings();
  };

  // Reverse an accidental check-out (back to checked-in); the DB trigger
  // re-marks the room as occupied.
  const handleUndoCheckOut = async (bookingId: string) => {
    const { error } = await supabase
      .from('bookings')
      .update({ booking_status: 'checked_in', actual_check_out: null })
      .eq('id', bookingId);
    if (error) {
      toast.error('Failed to undo check-out');
      return;
    }
    toast.success('Check-out reversed');
    fetchBookings();
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

      {/* Bookings List */}
      <Card>
        <CardHeader className="space-y-4">
          <div className="flex flex-row items-center justify-between gap-2">
            <CardTitle>All Bookings ({filteredBookings.length})</CardTitle>
            <Button variant="outline" size="sm" onClick={() => fetchBookings(true)}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>

          {/* Toolbar: search + filters */}
          <div className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-center">
            <div className="relative w-full md:max-w-xs md:flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search bookings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[160px]">
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
              <SelectTrigger className="w-full md:w-[160px]">
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
              <SelectTrigger className="w-full md:w-[160px]">
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

            {/* Check-in date range */}
            <div className="flex items-center gap-2">
              <label htmlFor="booking-date-from" className="text-sm text-gray-600 whitespace-nowrap">
                Check-in from
              </label>
              <Input
                id="booking-date-from"
                type="date"
                aria-label="Check-in date from"
                value={dateFrom}
                max={dateTo || undefined}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-[150px]"
              />
              <label htmlFor="booking-date-to" className="text-sm text-gray-600 whitespace-nowrap">
                to
              </label>
              <Input
                id="booking-date-to"
                type="date"
                aria-label="Check-in date to"
                value={dateTo}
                min={dateFrom || undefined}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-[150px]"
              />
              {(dateFrom || dateTo) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setDateFrom(''); setDateTo(''); }}
                >
                  Clear
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {/* Mobile skeleton */}
              <div className="block lg:hidden space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Card key={i} className="border-l-4 border-l-gray-200">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="h-5 w-32 rounded bg-gray-200 animate-pulse" />
                          <div className="h-4 w-24 rounded bg-gray-200 animate-pulse" />
                        </div>
                        <div className="h-6 w-20 rounded-full bg-gray-200 animate-pulse" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        {Array.from({ length: 4 }).map((__, j) => (
                          <div key={j} className="h-8 rounded bg-gray-200 animate-pulse" />
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Desktop table skeleton */}
              <div className="hidden lg:block">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        {['Booking #', 'Guest', 'Room', 'Dates', 'Amount', 'Status', 'Payment', 'Actions'].map((h) => (
                          <th key={h} className="text-left p-3 font-medium">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <tr key={i} className="border-b">
                          {Array.from({ length: 8 }).map((__, j) => (
                            <td key={j} className="p-3">
                              <div className="h-5 w-full max-w-[120px] rounded bg-gray-200 animate-pulse" />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
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
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-semibold text-base">{booking.booking_number}</h3>
                            <p className="text-sm text-gray-600">{booking.customers?.name}</p>
                          </div>
                          <Badge className={statusConfig.color}>
                            {statusConfig.icon} {statusConfig.label}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs mb-2">
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
                            <p className="font-medium">{new Date(booking.check_in_date).toLocaleDateString('en-IN')}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Check-out</p>
                            <p className="font-medium">{new Date(booking.check_out_date).toLocaleDateString('en-IN')}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
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
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="sm" variant="ghost" className="ml-auto" aria-label="More actions">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleView(booking.id)}>
                                <Eye className="w-4 h-4 mr-2" />
                                View
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEdit(booking.id)}>
                                <Edit className="w-4 h-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              {(canCheckIn || canCheckOut || booking.booking_status === 'checked_in' || booking.booking_status === 'checked_out') && (
                                <DropdownMenuSeparator />
                              )}
                              {canCheckIn && (
                                <DropdownMenuItem onClick={() => handleCheckIn(booking.id)}>
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Check in
                                </DropdownMenuItem>
                              )}
                              {canCheckOut && (
                                <DropdownMenuItem onClick={() => handleCheckOut(booking.id)}>
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Check out
                                </DropdownMenuItem>
                              )}
                              {booking.booking_status === 'checked_in' && (
                                <DropdownMenuItem onClick={() => handleUndoCheckIn(booking.id, booking.room_id)}>
                                  <RotateCcw className="w-4 h-4 mr-2" />
                                  Undo check-in
                                </DropdownMenuItem>
                              )}
                              {booking.booking_status === 'checked_out' && (
                                <DropdownMenuItem onClick={() => handleUndoCheckOut(booking.id)}>
                                  <RotateCcw className="w-4 h-4 mr-2" />
                                  Undo check-out
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
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
                        <th aria-sort={ariaSort('booking_number')} className="text-left p-2 text-sm font-medium">
                          <button type="button" onClick={() => handleSort('booking_number')} className="inline-flex items-center gap-1 hover:text-gray-900">
                            Booking # {sortIndicator('booking_number')}
                          </button>
                        </th>
                        <th aria-sort={ariaSort('guest')} className="text-left p-2 text-sm font-medium">
                          <button type="button" onClick={() => handleSort('guest')} className="inline-flex items-center gap-1 hover:text-gray-900">
                            Guest {sortIndicator('guest')}
                          </button>
                        </th>
                        <th aria-sort={ariaSort('room')} className="text-left p-2 text-sm font-medium">
                          <button type="button" onClick={() => handleSort('room')} className="inline-flex items-center gap-1 hover:text-gray-900">
                            Room {sortIndicator('room')}
                          </button>
                        </th>
                        <th aria-sort={ariaSort('check_in')} className="text-left p-2 text-sm font-medium">
                          <button type="button" onClick={() => handleSort('check_in')} className="inline-flex items-center gap-1 hover:text-gray-900">
                            Dates {sortIndicator('check_in')}
                          </button>
                        </th>
                        <th aria-sort={ariaSort('amount')} className="text-left p-2 text-sm font-medium">
                          <button type="button" onClick={() => handleSort('amount')} className="inline-flex items-center gap-1 hover:text-gray-900">
                            Amount {sortIndicator('amount')}
                          </button>
                        </th>
                        <th aria-sort={ariaSort('status')} className="text-left p-2 text-sm font-medium">
                          <button type="button" onClick={() => handleSort('status')} className="inline-flex items-center gap-1 hover:text-gray-900">
                            Status {sortIndicator('status')}
                          </button>
                        </th>
                        <th className="text-left p-2 text-sm font-medium">Payment</th>
                        <th className="text-left p-2 text-sm font-medium">Actions</th>
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
                            <td className="p-2">
                              <div>
                                <p className="font-medium text-sm">{booking.booking_number}</p>
                                <p className="text-xs text-gray-500">
                                  {new Date(booking.created_at).toLocaleDateString('en-IN')}
                                </p>
                              </div>
                            </td>
                            <td className="p-2">
                              <div>
                                <p className="font-medium text-sm">{booking.customers?.name}</p>
                                <p className="text-xs text-gray-500">{booking.customers?.phone}</p>
                              </div>
                            </td>
                            <td className="p-2">
                              <div>
                                <p className="font-medium text-sm">{booking.rooms?.room_number}</p>
                                <p className="text-xs text-gray-500 capitalize">
                                  {booking.rooms?.room_type?.replace('-', ' ')}
                                </p>
                              </div>
                            </td>
                            <td className="p-2">
                              <div className="text-xs">
                                <p>{new Date(booking.check_in_date).toLocaleDateString('en-IN')}</p>
                                <p className="text-gray-500">to {new Date(booking.check_out_date).toLocaleDateString('en-IN')}</p>
                                <p className="text-gray-500">{booking.total_nights} nights</p>
                              </div>
                            </td>
                            <td className="p-2">
                              <div className="text-xs">
                                <p className="font-medium">₹{booking.total_amount.toLocaleString('en-IN')}</p>
                                <p className="text-gray-500">
                                  Paid: ₹{booking.paid_amount.toLocaleString('en-IN')}
                                </p>
                              </div>
                            </td>
                            <td className="p-2">
                              <Badge className={statusConfig.color}>
                                {statusConfig.icon} {statusConfig.label}
                              </Badge>
                            </td>
                            <td className="p-2">
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
                            <td className="p-2">
                              <div className="flex items-center gap-1">
                                {canCheckIn && (
                                  <Button size="sm" aria-label="Check in" onClick={() => handleCheckIn(booking.id)}>
                                    <CheckCircle className="w-4 h-4" />
                                  </Button>
                                )}
                                {canCheckOut && (
                                  <Button size="sm" variant="outline" onClick={() => handleCheckOut(booking.id)}>
                                    Check Out
                                  </Button>
                                )}
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button size="sm" variant="ghost" aria-label="More actions">
                                      <MoreHorizontal className="w-4 h-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleView(booking.id)}>
                                      <Eye className="w-4 h-4 mr-2" />
                                      View
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleEdit(booking.id)}>
                                      <Edit className="w-4 h-4 mr-2" />
                                      Edit
                                    </DropdownMenuItem>
                                    {(canCheckIn || canCheckOut || booking.booking_status === 'checked_in' || booking.booking_status === 'checked_out') && (
                                      <DropdownMenuSeparator />
                                    )}
                                    {canCheckIn && (
                                      <DropdownMenuItem onClick={() => handleCheckIn(booking.id)}>
                                        <CheckCircle className="w-4 h-4 mr-2" />
                                        Check in
                                      </DropdownMenuItem>
                                    )}
                                    {canCheckOut && (
                                      <DropdownMenuItem onClick={() => handleCheckOut(booking.id)}>
                                        <CheckCircle className="w-4 h-4 mr-2" />
                                        Check out
                                      </DropdownMenuItem>
                                    )}
                                    {booking.booking_status === 'checked_in' && (
                                      <DropdownMenuItem onClick={() => handleUndoCheckIn(booking.id, booking.room_id)}>
                                        <RotateCcw className="w-4 h-4 mr-2" />
                                        Undo check-in
                                      </DropdownMenuItem>
                                    )}
                                    {booking.booking_status === 'checked_out' && (
                                      <DropdownMenuItem onClick={() => handleUndoCheckOut(booking.id)}>
                                        <RotateCcw className="w-4 h-4 mr-2" />
                                        Undo check-out
                                      </DropdownMenuItem>
                                    )}
                                  </DropdownMenuContent>
                                </DropdownMenu>
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

      {/* Outstanding Balance Checkout Dialog */}
      <Dialog
        open={!!checkoutBooking}
        onOpenChange={(open) => {
          if (!open && !checkoutProcessing) setCheckoutBooking(null);
        }}
      >
        <DialogContent showCloseButton={!checkoutProcessing}>
          <DialogHeader>
            <DialogTitle>
              Outstanding balance ₹{checkoutBooking ? getDueAmount(checkoutBooking).toLocaleString('en-IN') : '0'}
            </DialogTitle>
            <DialogDescription>
              {checkoutBooking?.customers?.name
                ? `${checkoutBooking.customers.name} has a balance remaining on booking ${checkoutBooking.booking_number}. `
                : ''}
              Choose how to settle it before checking out.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Total</span>
              <span className="font-medium">
                ₹{checkoutBooking?.total_amount.toLocaleString('en-IN') ?? '0'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Paid</span>
              <span className="font-medium">
                ₹{checkoutBooking?.paid_amount.toLocaleString('en-IN') ?? '0'}
              </span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="text-gray-600">Balance due</span>
              <span className="font-semibold text-red-600">
                ₹{checkoutBooking ? getDueAmount(checkoutBooking).toLocaleString('en-IN') : '0'}
              </span>
            </div>
          </div>

          <DialogFooter className="sm:flex-col sm:items-stretch sm:gap-2">
            <Button onClick={handleCollectPayment} disabled={checkoutProcessing}>
              Collect payment
            </Button>
            <Button
              variant="outline"
              onClick={handleWaiveBalance}
              disabled={checkoutProcessing}
            >
              Waive / discount balance
            </Button>
            <Button
              variant="ghost"
              onClick={() => setCheckoutBooking(null)}
              disabled={checkoutProcessing}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
