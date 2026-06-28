'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Hotel, BedDouble, CalendarCheck, CalendarX2, IndianRupee, Wallet, Plus, ArrowRight } from '@/components/icons';
import { Database } from '@/lib/supabase/types';

type Room = Database['public']['Tables']['rooms']['Row'];

type DashboardStats = {
  totalRooms: number;
  occupiedRooms: number;
  availableRooms: number;
  todayCheckIns: number;
  todayCheckOuts: number;
  todayRevenue: number;
  pendingPayments: number;
};

type DashboardClientProps = {
  stats: DashboardStats;
  initialRooms: Room[];
};

const formatINR = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

export function DashboardClient({ stats, initialRooms }: DashboardClientProps) {
  const router = useRouter();

  // Derive real room-status counts from the actual rooms.
  const roomCounts = useMemo(() => {
    const c = { available: 0, occupied: 0, cleaning: 0, maintenance: 0, blocked: 0 } as Record<string, number>;
    for (const r of initialRooms) c[r.status] = (c[r.status] ?? 0) + 1;
    return c;
  }, [initialRooms]);

  const cards = [
    { label: 'Total Rooms', value: String(stats.totalRooms), icon: Hotel },
    { label: 'Available', value: String(roomCounts.available), icon: BedDouble },
    { label: "Today's Revenue", value: formatINR(stats.todayRevenue), icon: IndianRupee },
    { label: 'Check-ins Today', value: String(stats.todayCheckIns), icon: CalendarCheck },
    { label: 'Check-outs Today', value: String(stats.todayCheckOuts), icon: CalendarX2 },
    { label: 'Pending Payments', value: String(stats.pendingPayments), icon: Wallet },
  ];

  const statusPills = [
    { label: 'Available', value: roomCounts.available, cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    { label: 'Occupied', value: roomCounts.occupied, cls: 'bg-rose-50 text-rose-700 border-rose-200' },
    { label: 'Cleaning', value: roomCounts.cleaning, cls: 'bg-amber-50 text-amber-700 border-amber-200' },
    { label: 'Maintenance', value: roomCounts.maintenance, cls: 'bg-slate-50 text-slate-700 border-slate-200' },
  ];

  return (
    <div className="space-y-6">
      {/* Quick actions */}
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => router.push('/bookings?new=1')}>
          <Plus className="mr-2 h-4 w-4" /> New booking
        </Button>
        <Button variant="outline" onClick={() => router.push('/rooms')}>
          View rooms
        </Button>
        <Button variant="outline" onClick={() => router.push('/bookings?filter=pending')}>
          Payments due
        </Button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        {cards.map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{label}</span>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="mt-2 text-2xl font-bold">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Room status overview */}
      <Card>
        <CardContent className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">Room status</h2>
            <Button variant="ghost" size="sm" onClick={() => router.push('/rooms')}>
              Manage rooms <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {statusPills.map((s) => (
              <span key={s.label} className={`rounded-full border px-3 py-1 text-sm font-medium ${s.cls}`}>
                {s.label}: {s.value}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
