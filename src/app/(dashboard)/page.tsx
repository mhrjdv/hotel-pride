import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { DashboardClient } from './DashboardClient';
import { startOfToday, endOfToday, formatISO } from 'date-fns';

async function getStats(supabase: any) {
  const today = new Date();
  const startOfTodayISO = formatISO(startOfToday(today));
  const endOfTodayISO = formatISO(endOfToday(today));

  // Simplified and combined queries for efficiency
  const { count: occupiedRooms, error: occupiedError } = await supabase
    .from('rooms')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'occupied');

  const { count: todayCheckIns, error: checkInsError } = await supabase
    .from('bookings')
    .select('*', { count: 'exact', head: true })
    .gte('check_in_date', startOfTodayISO.split('T')[0])
    .lte('check_in_date', endOfTodayISO.split('T')[0])
    .neq('status', 'cancelled');

  const { count: todayCheckOuts, error: checkOutsError } = await supabase
    .from('bookings')
    .select('*', { count: 'exact', head: true })
    .gte('check_out_date', startOfTodayISO.split('T')[0])
    .lte('check_out_date', endOfTodayISO.split('T')[0])
    .eq('status', 'checked_out');

  const { data: revenueData, error: revenueError } = await supabase
    .from('payments')
    .select('amount')
    .gte('created_at', startOfTodayISO)
    .lte('created_at', endOfTodayISO)
    .eq('payment_status', 'paid');
    
  const todayRevenue = revenueData?.reduce((sum: number, p: { amount: number }) => sum + p.amount, 0) || 0;
  
  const { count: pendingPayments, error: pendingPaymentsError } = await supabase
    .from('bookings')
    .select('*', { count: 'exact', head: true })
    .in('payment_status', ['pending', 'partial'])
    .neq('status', 'cancelled');

  // Log errors if any for debugging
  if (occupiedError || checkInsError || checkOutsError || revenueError || pendingPaymentsError) {
    console.error({ occupiedError, checkInsError, checkOutsError, revenueError, pendingPaymentsError });
  }

  return {
    totalRooms: 18, // As per project specs
    occupiedRooms: occupiedRooms || 0,
    availableRooms: 18 - (occupiedRooms || 0),
    todayCheckIns: todayCheckIns || 0,
    todayCheckOuts: todayCheckOuts || 0,
    todayRevenue,
    pendingPayments: pendingPayments || 0,
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

  const stats = await getStats(supabase);

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-1">
          Welcome back, {profile?.full_name || profile?.email}!
        </h1>
        <p className="text-gray-600">
          Here's your real-time overview of the hotel's status today.
        </p>
      </div>
      <DashboardClient stats={stats} />
    </>
  );
}
