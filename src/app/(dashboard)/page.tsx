import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { DashboardClient } from './DashboardClient';

type SupabaseServerClient = Awaited<ReturnType<typeof createServerClient>>;

async function getStats(supabase: SupabaseServerClient) {
  const today = new Date();
  const startOfTodayISO = new Date(today.setHours(0, 0, 0, 0)).toISOString();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();

  // Simplified and combined queries for efficiency
  const { count: occupiedRooms, error: occupiedError } = await supabase
    .from('rooms')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'occupied');

  const { count: todayCheckIns, error: checkInsError } = await supabase
    .from('bookings')
    .select('*', { count: 'exact', head: true })
    .eq('check_in_date', startOfTodayISO.split('T')[0])
    .neq('booking_status', 'cancelled');

  const { count: todayCheckOuts, error: checkOutsError } = await supabase
    .from('bookings')
    .select('*', { count: 'exact', head: true })
    .eq('check_out_date', startOfTodayISO.split('T')[0])
    .eq('booking_status', 'checked_out');

  const { data: revenueData, error: revenueError } = await supabase
    .from('bookings')
    .select('paid_amount')
    .gte('created_at', startOfMonth)
    .in('payment_status', ['paid', 'partial']);

  const monthRevenue = revenueData?.reduce((sum: number, p: { paid_amount: number }) => sum + p.paid_amount, 0) || 0;
  
  const { data: todayRevenueData, error: todayRevenueError } = await supabase
    .from('bookings')
    .select('paid_amount')
    .gte('created_at', startOfTodayISO)
    .in('payment_status', ['paid', 'partial']);
    
  const todayRevenue = todayRevenueData?.reduce((sum: number, p: { paid_amount: number }) => sum + p.paid_amount, 0) || 0;

  const { count: pendingPayments, error: pendingPaymentsError } = await supabase
    .from('bookings')
    .select('*', { count: 'exact', head: true })
    .in('payment_status', ['pending', 'partial'])
    .neq('booking_status', 'cancelled');

  const { count: totalBookings, error: totalBookingsError } = await supabase
    .from('bookings')
    .select('*', { count: 'exact', head: true })
    .neq('booking_status', 'cancelled');

  const errors: Record<string, unknown> = {};
  if (occupiedError) errors.occupiedError = occupiedError;
  if (checkInsError) errors.checkInsError = checkInsError;
  if (checkOutsError) errors.checkOutsError = checkOutsError;
  if (revenueError) errors.revenueError = revenueError;
  if (todayRevenueError) errors.todayRevenueError = todayRevenueError;
  if (pendingPaymentsError) errors.pendingPaymentsError = pendingPaymentsError;
  if (totalBookingsError) errors.totalBookingsError = totalBookingsError;

  if (Object.keys(errors).length > 0) {
    console.error("Dashboard Stats Errors:", errors);
  }

  const totalRooms = 18; // As per project specs
  const occupiedCount = occupiedRooms || 0;

  return {
    totalRooms,
    occupiedRooms: occupiedCount,
    availableRooms: totalRooms - occupiedCount,
    todayCheckIns: todayCheckIns || 0,
    todayCheckOuts: todayCheckOuts || 0,
    todayRevenue,
    pendingPayments: pendingPayments || 0,
    totalBookings: totalBookings || 0,
    checkInsToday: todayCheckIns || 0,
    checkOutsToday: todayCheckOuts || 0,
    revenue: monthRevenue,
    occupancyRate: totalRooms > 0 ? (occupiedCount / totalRooms) * 100 : 0,
  };
}

export default async function HotelDashboardPage() {
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email')
    .eq('id', user.id)
    .single();

  const [stats, { data: rooms, error: roomsError }] = await Promise.all([
    getStats(supabase),
    supabase.from('rooms').select('*').order('room_number', { ascending: true })
  ]);

  if (roomsError) {
    // Handle error appropriately
    console.error("Error fetching rooms for dashboard:", roomsError);
  }

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-1">
          Welcome back, {profile?.full_name || profile?.email}!
        </h1>
        <p className="text-gray-600">
          Here&apos;s your real-time overview of the hotel&apos;s status today.
        </p>
      </div>
      <DashboardClient stats={stats} initialRooms={rooms || []} />
    </>
  );
}
