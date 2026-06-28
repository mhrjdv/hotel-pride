'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { motion } from 'framer-motion';
import {
  BarChart3,
  TrendingUp,
  Users,
  Bed,
  IndianRupee,
  Receipt,
  Calendar,
  Download,
  RefreshCw,
  Building2,
  Percent,
  ArrowUpRight,
  ArrowDownRight,
  Star,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText,
  ChevronDown,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// ─── Types ────────────────────────────────────────────────────────────────────

type Booking = {
  id: string;
  booking_number: string;
  room_id: string;
  primary_customer_id: string;
  check_in_date: string;
  check_out_date: string;
  total_nights: number;
  room_rate: number;
  base_amount: number;
  gst_amount: number;
  total_amount: number;
  paid_amount: number;
  due_amount: number;
  payment_status: string;
  booking_status: string;
  booking_source: string;
  created_at: string;
  rooms?: { room_number: string; room_type: string; has_ac: boolean } | null;
  customers?: { name: string; phone: string; email?: string } | null;
};

type Room = {
  id: string;
  room_number: string;
  room_type: string;
  has_ac: boolean;
  base_rate: number;
  status: string;
};

type Invoice = {
  id: string;
  invoice_number: string;
  invoice_date: string;
  customer_name: string;
  total_amount: number;
  total_tax: number;
  paid_amount: number;
  balance_amount: number;
  payment_status: string;
  status: string;
  created_at: string;
};

type Period = 'today' | 'week' | 'month' | 'quarter' | 'year';

// ─── Period helper (called once, result memoised in component) ────────────────

function getPeriodRange(period: Period): { start: string; end: string; label: string } {
  const now = new Date();
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  let start = new Date(now);
  let label = '';

  switch (period) {
    case 'today':
      start.setHours(0, 0, 0, 0);
      label = 'Today';
      break;
    case 'week':
      start.setDate(now.getDate() - 6);
      start.setHours(0, 0, 0, 0);
      label = 'Last 7 Days';
      break;
    case 'month':
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      label = 'This Month';
      break;
    case 'quarter': {
      const q = Math.floor(now.getMonth() / 3);
      start = new Date(now.getFullYear(), q * 3, 1);
      label = `Q${q + 1} ${now.getFullYear()}`;
      break;
    }
    case 'year':
      start = new Date(now.getFullYear(), 0, 1);
      label = String(now.getFullYear());
      break;
  }
  return { start: start.toISOString(), end: end.toISOString(), label };
}

// ─── CSV export helper ────────────────────────────────────────────────────────

function downloadCSV(filename: string, rows: string[][]): void {
  const csv = rows
    .map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Formatting helpers ───────────────────────────────────────────────────────

const fmt = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});
const formatINR = (n: number) => fmt.format(n);
const formatNum = (n: number) => n.toLocaleString('en-IN');

// ─── Small visual components ──────────────────────────────────────────────────

function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="h-full rounded-full"
        style={{ backgroundColor: color }}
      />
    </div>
  );
}

function MiniBarChart({ data, color }: { data: number[]; color: string }) {
  if (!data.length) return null;
  const max = Math.max(...data, 1);
  return (
    <div className="flex items-end gap-0.5 h-10">
      {data.map((val, i) => (
        <motion.div
          key={i}
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ delay: i * 0.025, duration: 0.35, ease: 'easeOut' }}
          style={{
            height: `${(val / max) * 100}%`,
            backgroundColor: color,
            flex: 1,
            minHeight: val > 0 ? 2 : 0,
            borderRadius: '2px 2px 0 0',
            transformOrigin: 'bottom',
            opacity: 0.65 + (i / data.length) * 0.35,
          }}
        />
      ))}
    </div>
  );
}

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color,
  miniData,
}: {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ElementType;
  trend?: number;
  color: string;
  miniData?: number[];
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      <Card className="overflow-hidden border-0 shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="p-2 rounded-xl" style={{ backgroundColor: `${color}1a` }}>
              <Icon className="w-5 h-5" style={{ color }} />
            </div>
            {trend !== undefined && (
              <div
                className={`flex items-center gap-0.5 text-xs font-medium px-2 py-1 rounded-full ${
                  trend >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                }`}
              >
                {trend >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {Math.abs(trend)}%
              </div>
            )}
          </div>
          <p className="text-2xl font-bold text-gray-900 mb-0.5 truncate">{value}</p>
          <p className="text-sm text-gray-500 font-medium">{title}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
          {miniData && miniData.length > 1 && (
            <div className="mt-3">
              <MiniBarChart data={miniData} color={color} />
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ─── Export dropdown ──────────────────────────────────────────────────────────

function ExportMenu({
  onExport,
}: {
  onExport: (type: 'summary' | 'bookings' | 'invoices' | 'rooms' | 'guests') => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const items: { key: 'summary' | 'bookings' | 'invoices' | 'rooms' | 'guests'; label: string }[] = [
    { key: 'summary', label: 'Summary Report' },
    { key: 'bookings', label: 'Bookings CSV' },
    { key: 'invoices', label: 'Invoices CSV' },
    { key: 'rooms', label: 'Room Performance CSV' },
    { key: 'guests', label: 'Guest Leaderboard CSV' },
  ];

  return (
    <div className="relative" ref={ref}>
      <Button
        variant="outline"
        size="sm"
        className="gap-1.5"
        onClick={() => setOpen((o) => !o)}
      >
        <Download className="w-4 h-4" />
        Export
        <ChevronDown className="w-3 h-3" />
      </Button>
      {open && (
        <div className="absolute right-0 mt-1 w-52 bg-white rounded-lg shadow-lg border border-gray-100 z-50 overflow-hidden">
          {items.map((item) => (
            <button
              key={item.key}
              onClick={() => { onExport(item.key); setOpen(false); }}
              className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors"
            >
              <FileText className="w-3.5 h-3.5 text-gray-400" />
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ReportsPage() {
  // Stable client reference
  const supabase = useMemo(() => createClient(), []);

  const [period, setPeriod] = useState<Period>('month');
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch all data in parallel
  const fetchData = useCallback(async () => {
    setLoading(true);
    const [bRes, rRes, iRes] = await Promise.all([
      supabase
        .from('bookings')
        .select('*, rooms(room_number,room_type,has_ac), customers(name,phone,email)')
        .order('created_at', { ascending: false }),
      supabase.from('rooms').select('*').order('room_number', { ascending: true }),
      supabase.from('invoices').select('*').order('created_at', { ascending: false }),
    ]);
    if (bRes.data) setBookings(bRes.data as Booking[]);
    if (rRes.data) setRooms(rRes.data as Room[]);
    if (iRes.data) setInvoices(iRes.data as Invoice[]);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Single-pass analytics ───────────────────────────────────────────────────
  // Everything is derived in one useMemo to avoid repeated array traversals.

  const { start: startStr, end: endStr, label: periodLabel } = useMemo(
    () => getPeriodRange(period),
    [period]
  );

  const analytics = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    // ── Single O(n) pass over bookings ────────────────────────────────────────
    let totalRevenue = 0;
    let totalRevenueAllTime = 0;
    let totalGst = 0;
    let totalBaseAmount = 0;
    let totalDue = 0;
    let totalNights = 0;
    let activeBookings = 0;
    let pendingPayments = 0;

    const byStatus: Record<string, number> = { confirmed: 0, checked_in: 0, checked_out: 0, cancelled: 0, no_show: 0 };
    const bySource: Record<string, number> = {};
    const byRoomType: Record<string, number> = {};
    const customerMap: Record<string, { name: string; phone: string; revenue: number; bookings: number }> = {};
    const roomMap: Record<string, { room: string; type: string; revenue: number; nights: number; bookings: number }> = {};

    // Trend buckets
    const trendDays = period === 'today'
      ? Array(now.getHours() + 1).fill(0)
      : period === 'week'
      ? Array(7).fill(0)
      : period === 'month'
      ? Array(new Date(year, month + 1, 0).getDate()).fill(0)
      : Array(12).fill(0);

    // Pre-build day-label index for week mode
    const weekLabels: string[] = [];
    if (period === 'week') {
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        weekLabels.push(d.toISOString().split('T')[0]);
      }
    }

    const periodBookings: Booking[] = [];
    const customerIds = new Set<string>();
    const qStart = Math.floor(month / 3) * 3;

    for (const b of bookings) {
      const paid = b.paid_amount || 0;
      const due = b.due_amount || 0;
      const gst = b.gst_amount || 0;
      const base = b.base_amount || 0;
      const nights = b.total_nights || 0;
      const bDate = new Date(b.created_at);

      totalRevenueAllTime += paid;
      customerIds.add(b.primary_customer_id);

      if (b.booking_status === 'checked_in') activeBookings++;

      // Customer leaderboard (all-time)
      const cName = b.customers?.name || 'Unknown';
      const cPhone = b.customers?.phone || '';
      const cKey = cName + '|' + cPhone;
      if (!customerMap[cKey]) customerMap[cKey] = { name: cName, phone: cPhone, revenue: 0, bookings: 0 };
      customerMap[cKey].revenue += paid;
      customerMap[cKey].bookings++;

      // Room leaderboard (all-time)
      const rKey = b.rooms?.room_number || b.room_id;
      if (!roomMap[rKey]) roomMap[rKey] = { room: rKey, type: b.rooms?.room_type || '', revenue: 0, nights: 0, bookings: 0 };
      roomMap[rKey].revenue += paid;
      roomMap[rKey].nights += nights;
      roomMap[rKey].bookings++;

      // Trend data (all-time for year/quarter, period-filtered for others)
      if (period === 'today') {
        const todayStr = now.toISOString().split('T')[0];
        if (b.created_at.startsWith(todayStr)) {
          const h = bDate.getHours();
          if (h < trendDays.length) trendDays[h] += paid;
        }
      } else if (period === 'week') {
        const ds = b.created_at.split('T')[0];
        const idx = weekLabels.indexOf(ds);
        if (idx !== -1) trendDays[idx] += paid;
      } else if (period === 'month') {
        if (bDate.getFullYear() === year && bDate.getMonth() === month) {
          trendDays[bDate.getDate() - 1] += paid;
        }
      } else if (period === 'quarter') {
        if (bDate.getFullYear() === year) {
          const m = bDate.getMonth();
          if (m >= qStart && m < qStart + 3) trendDays[m - qStart] += paid;
        }
      } else {
        // year
        if (bDate.getFullYear() === year) {
          trendDays[bDate.getMonth()] += paid;
        }
      }

      // Period-scoped aggregations
      if (b.created_at >= startStr && b.created_at <= endStr) {
        periodBookings.push(b);
        totalRevenue += paid;
        totalGst += gst;
        totalBaseAmount += base;
        totalDue += due;
        totalNights += nights;
        if (b.payment_status === 'pending' || b.payment_status === 'partial') pendingPayments++;
        byStatus[b.booking_status] = (byStatus[b.booking_status] || 0) + 1;
        const src = b.booking_source || 'walk_in';
        bySource[src] = (bySource[src] || 0) + 1;
        const rt = b.rooms?.room_type || 'unknown';
        byRoomType[rt] = (byRoomType[rt] || 0) + paid;
      }
    }

    const totalBookings = periodBookings.length;
    const avgNights = totalBookings > 0 ? totalNights / totalBookings : 0;

    // Room stats
    const totalRooms = rooms.length || 18;
    let occupiedRooms = 0;
    let availableRooms = 0;
    let maintenanceRooms = 0;
    let acRooms = 0;
    const roomTypeCounts: Record<string, number> = {};
    for (const r of rooms) {
      if (r.status === 'occupied') occupiedRooms++;
      else if (r.status === 'available') availableRooms++;
      else if (r.status === 'maintenance') maintenanceRooms++;
      if (r.has_ac) acRooms++;
      roomTypeCounts[r.room_type] = (roomTypeCounts[r.room_type] || 0) + 1;
    }
    const occupancyRate = totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0;

    // Invoice stats (period)
    let invRevenue = 0;
    let invPaid = 0;
    let invPending = 0;
    let invCount = 0;
    for (const inv of invoices) {
      if (inv.created_at >= startStr && inv.created_at <= endStr) {
        invCount++;
        invRevenue += inv.paid_amount || 0;
        if (inv.payment_status === 'paid') invPaid++;
        else if (inv.payment_status === 'pending') invPending++;
      }
    }

    // Sort leaderboards
    const topCustomers = Object.values(customerMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    const roomPerformance = Object.values(roomMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    const trendMax = Math.max(...trendDays, 1);

    // Derived customer stats
    const uniqueGuests = customerIds.size;
    const repeatGuests = topCustomers.filter((c) => c.bookings > 1).length;
    const avgRevenuePerGuest =
      topCustomers.length > 0
        ? topCustomers.reduce((s, c) => s + c.revenue, 0) / topCustomers.length
        : 0;

    return {
      totalRevenue, totalRevenueAllTime, totalGst, totalBaseAmount,
      totalDue, totalBookings, activeBookings, pendingPayments, avgNights,
      byStatus, bySource, byRoomType,
      topCustomers, roomPerformance,
      trendDays, trendMax,
      occupancyRate, occupiedRooms, availableRooms, maintenanceRooms,
      acRooms, totalRooms, roomTypeCounts,
      invRevenue, invPaid, invPending, invCount,
      uniqueGuests, repeatGuests, avgRevenuePerGuest,
      periodBookings,
    };
  }, [bookings, rooms, invoices, period, startStr, endStr]);

  // ── Export handlers ─────────────────────────────────────────────────────────

  const handleExport = useCallback(
    (type: 'summary' | 'bookings' | 'invoices' | 'rooms' | 'guests') => {
      const today = new Date().toISOString().split('T')[0];

      if (type === 'summary') {
        const rows: string[][] = [
          ['Hotel Pride — Report Summary'],
          [`Period: ${periodLabel}`, `Generated: ${today}`],
          [],
          ['Metric', 'Value'],
          ['Total Revenue', formatINR(analytics.totalRevenue)],
          ['All-time Revenue', formatINR(analytics.totalRevenueAllTime)],
          ['GST Collected', formatINR(analytics.totalGst)],
          ['Outstanding Dues', formatINR(analytics.totalDue)],
          ['Total Bookings', String(analytics.totalBookings)],
          ['Active Stays', String(analytics.activeBookings)],
          ['Pending Payments', String(analytics.pendingPayments)],
          ['Avg Stay (nights)', analytics.avgNights.toFixed(2)],
          ['Occupancy Rate', `${analytics.occupancyRate.toFixed(1)}%`],
          ['Total Rooms', String(analytics.totalRooms)],
          ['Occupied Rooms', String(analytics.occupiedRooms)],
          ['Available Rooms', String(analytics.availableRooms)],
          ['Unique Guests', String(analytics.uniqueGuests)],
          ['Invoice Revenue', formatINR(analytics.invRevenue)],
          ['Paid Invoices', String(analytics.invPaid)],
          ['Pending Invoices', String(analytics.invPending)],
        ];
        downloadCSV(`hotel-pride-summary-${today}.csv`, rows);
      }

      if (type === 'bookings') {
        const rows: string[][] = [
          ['Booking #', 'Guest', 'Phone', 'Room', 'Room Type', 'Check-in', 'Check-out', 'Nights', 'Base Amount', 'GST', 'Total Amount', 'Paid', 'Due', 'Booking Status', 'Payment Status', 'Source', 'Created'],
          ...bookings.map((b) => [
            b.booking_number,
            b.customers?.name || '',
            b.customers?.phone || '',
            b.rooms?.room_number || '',
            b.rooms?.room_type || '',
            b.check_in_date,
            b.check_out_date,
            String(b.total_nights || 0),
            String(b.base_amount || 0),
            String(b.gst_amount || 0),
            String(b.total_amount || 0),
            String(b.paid_amount || 0),
            String(b.due_amount || 0),
            b.booking_status,
            b.payment_status,
            b.booking_source || '',
            b.created_at.split('T')[0],
          ]),
        ];
        downloadCSV(`hotel-pride-bookings-${today}.csv`, rows);
      }

      if (type === 'invoices') {
        const rows: string[][] = [
          ['Invoice #', 'Customer', 'Date', 'Total Amount', 'Tax', 'Paid', 'Balance', 'Payment Status', 'Status'],
          ...invoices.map((inv) => [
            inv.invoice_number,
            inv.customer_name,
            inv.invoice_date,
            String(inv.total_amount || 0),
            String(inv.total_tax || 0),
            String(inv.paid_amount || 0),
            String(inv.balance_amount || 0),
            inv.payment_status,
            inv.status,
          ]),
        ];
        downloadCSV(`hotel-pride-invoices-${today}.csv`, rows);
      }

      if (type === 'rooms') {
        const rows: string[][] = [
          ['Rank', 'Room', 'Type', 'Total Revenue', 'Bookings', 'Nights'],
          ...analytics.roomPerformance.map((r, i) => [
            String(i + 1),
            r.room,
            r.type,
            String(r.revenue),
            String(r.bookings),
            String(r.nights),
          ]),
        ];
        downloadCSV(`hotel-pride-room-performance-${today}.csv`, rows);
      }

      if (type === 'guests') {
        const rows: string[][] = [
          ['Rank', 'Guest Name', 'Phone', 'Total Bookings', 'Total Revenue', 'Loyalty'],
          ...analytics.topCustomers.map((c, i) => [
            String(i + 1),
            c.name,
            c.phone,
            String(c.bookings),
            String(c.revenue),
            c.bookings >= 3 ? 'VIP' : c.bookings >= 2 ? 'Returning' : 'New',
          ]),
        ];
        downloadCSV(`hotel-pride-guests-${today}.csv`, rows);
      }
    },
    [analytics, bookings, invoices, periodLabel]
  );

  // ── Room status colour map (stable reference) ──────────────────────────────

  const STATUS_COLORS = {
    bg: { available: '#d1fae5', occupied: '#fee2e2', cleaning: '#fef3c7', maintenance: '#f3f4f6', blocked: '#e0e7ff' },
    border: { available: '#6ee7b7', occupied: '#fca5a5', cleaning: '#fcd34d', maintenance: '#d1d5db', blocked: '#a5b4fc' },
    dot: { available: '#10b981', occupied: '#ef4444', cleaning: '#f59e0b', maintenance: '#9ca3af', blocked: '#6366f1' },
  } as const;

  function roomBg(status: string): string { return STATUS_COLORS.bg[status as keyof typeof STATUS_COLORS.bg] ?? '#e0e7ff'; }
  function roomBorder(status: string): string { return STATUS_COLORS.border[status as keyof typeof STATUS_COLORS.border] ?? '#a5b4fc'; }
  function roomDot(status: string): string { return STATUS_COLORS.dot[status as keyof typeof STATUS_COLORS.dot] ?? '#6366f1'; }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports &amp; Analytics</h1>
          <p className="text-gray-500 mt-1 text-sm">Comprehensive insights into hotel performance</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
            <SelectTrigger className="w-38">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">Last 7 Days</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={fetchData} disabled={loading} title="Refresh">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <ExportMenu onExport={handleExport} />
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-indigo-100 border-t-indigo-500 animate-spin" />
          <p className="text-gray-400 text-sm">Loading analytics…</p>
        </div>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-4 w-full sm:w-auto sm:inline-flex">
            <TabsTrigger value="overview" className="gap-1.5">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="revenue" className="gap-1.5">
              <IndianRupee className="w-4 h-4" />
              <span className="hidden sm:inline">Revenue</span>
            </TabsTrigger>
            <TabsTrigger value="occupancy" className="gap-1.5">
              <Bed className="w-4 h-4" />
              <span className="hidden sm:inline">Occupancy</span>
            </TabsTrigger>
            <TabsTrigger value="guests" className="gap-1.5">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Guests</span>
            </TabsTrigger>
          </TabsList>

          {/* ── OVERVIEW ─────────────────────────────────────────────────────── */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard title="Total Revenue" value={formatINR(analytics.totalRevenue)} subtitle={periodLabel} icon={IndianRupee} color="#6366f1" miniData={analytics.trendDays} />
              <StatCard title="Total Bookings" value={formatNum(analytics.totalBookings)} subtitle={periodLabel} icon={Calendar} color="#f59e0b" />
              <StatCard title="Occupancy Rate" value={`${analytics.occupancyRate.toFixed(1)}%`} subtitle={`${analytics.occupiedRooms}/${analytics.totalRooms} rooms`} icon={Percent} color="#10b981" />
              <StatCard title="Pending Dues" value={formatINR(analytics.totalDue)} subtitle={`${analytics.pendingPayments} bookings`} icon={AlertCircle} color="#ef4444" />
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard title="GST Collected" value={formatINR(analytics.totalGst)} subtitle={periodLabel} icon={Receipt} color="#8b5cf6" />
              <StatCard title="Active Stays" value={formatNum(analytics.activeBookings)} subtitle="Checked-in now" icon={Bed} color="#06b6d4" />
              <StatCard title="Avg Stay" value={`${analytics.avgNights.toFixed(1)} nights`} subtitle={periodLabel} icon={Clock} color="#84cc16" />
              <StatCard title="All-time Revenue" value={formatINR(analytics.totalRevenueAllTime)} subtitle="Cumulative" icon={TrendingUp} color="#f97316" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Booking by Status */}
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Bookings by Status</CardTitle>
                  <CardDescription>{periodLabel}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {([
                    { key: 'confirmed', label: 'Confirmed', color: '#3b82f6', Icon: CheckCircle2 },
                    { key: 'checked_in', label: 'Checked In', color: '#10b981', Icon: CheckCircle2 },
                    { key: 'checked_out', label: 'Checked Out', color: '#6366f1', Icon: CheckCircle2 },
                    { key: 'cancelled', label: 'Cancelled', color: '#ef4444', Icon: XCircle },
                    { key: 'no_show', label: 'No Show', color: '#f59e0b', Icon: AlertCircle },
                  ] as const).map(({ key, label, color, Icon }) => {
                    const val = analytics.byStatus[key] || 0;
                    return (
                      <div key={key} className="flex items-center gap-3">
                        <Icon className="w-4 h-4 flex-shrink-0" style={{ color }} />
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-700 font-medium">{label}</span>
                            <span className="text-gray-500 tabular-nums">{val}</span>
                          </div>
                          <ProgressBar value={val} max={analytics.totalBookings || 1} color={color} />
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              {/* Booking by Source */}
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Bookings by Source</CardTitle>
                  <CardDescription>{periodLabel}</CardDescription>
                </CardHeader>
                <CardContent>
                  {Object.keys(analytics.bySource).length === 0 ? (
                    <div className="flex flex-col items-center py-10 text-gray-400 gap-2">
                      <BarChart3 className="w-10 h-10 opacity-30" />
                      <p className="text-sm">No bookings in this period</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {([
                        { key: 'walk_in', label: 'Walk In', color: '#6366f1' },
                        { key: 'phone', label: 'Phone', color: '#f59e0b' },
                        { key: 'online', label: 'Online', color: '#10b981' },
                        { key: 'agent', label: 'Agent', color: '#ef4444' },
                      ]).map(({ key, label, color }) => {
                        const val = analytics.bySource[key] || 0;
                        if (!val) return null;
                        const pct = analytics.totalBookings > 0 ? ((val / analytics.totalBookings) * 100).toFixed(0) : '0';
                        return (
                          <div key={key} className="flex items-center gap-3">
                            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between text-sm mb-1">
                                <span className="text-gray-700 font-medium">{label}</span>
                                <span className="text-gray-500 tabular-nums">{val} ({pct}%)</span>
                              </div>
                              <ProgressBar value={val} max={analytics.totalBookings || 1} color={color} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Revenue Trend */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Revenue Trend</CardTitle>
                <CardDescription>{periodLabel}</CardDescription>
              </CardHeader>
              <CardContent>
                {analytics.trendMax <= 1 ? (
                  <div className="flex flex-col items-center py-14 text-gray-400 gap-2">
                    <TrendingUp className="w-10 h-10 opacity-30" />
                    <p className="text-sm">No revenue data for this period</p>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-end gap-0.5 h-44">
                      {analytics.trendDays.map((val, i) => {
                        const pct = (val / analytics.trendMax) * 100;
                        return (
                          <div key={i} className="group relative flex-1 flex flex-col justify-end" style={{ minHeight: 4 }}>
                            <motion.div
                              initial={{ height: 0 }}
                              animate={{ height: `${pct}%` }}
                              transition={{ delay: i * 0.015, duration: 0.45, ease: 'easeOut' }}
                              className="rounded-t-sm"
                              style={{
                                background: 'linear-gradient(to top, #6366f1, #818cf8)',
                                minHeight: val > 0 ? 3 : 0,
                                opacity: 0.55 + (pct / 100) * 0.45,
                              }}
                            />
                            {val > 0 && (
                              <div className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                                {formatINR(val)}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex justify-between mt-2 text-xs text-gray-400">
                      <span>Start</span>
                      <span className="font-medium text-gray-500">{periodLabel}</span>
                      <span>Now</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── REVENUE ──────────────────────────────────────────────────────── */}
          <TabsContent value="revenue" className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              <StatCard title="Gross Revenue" value={formatINR(analytics.totalRevenue)} subtitle={periodLabel} icon={IndianRupee} color="#6366f1" />
              <StatCard title="GST Collected" value={formatINR(analytics.totalGst)} subtitle="Tax liability" icon={Receipt} color="#8b5cf6" />
              <StatCard title="Outstanding Dues" value={formatINR(analytics.totalDue)} subtitle={`${analytics.pendingPayments} unpaid`} icon={AlertCircle} color="#ef4444" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Revenue by room type */}
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Revenue by Room Type</CardTitle>
                  <CardDescription>{periodLabel}</CardDescription>
                </CardHeader>
                <CardContent>
                  {Object.keys(analytics.byRoomType).length === 0 ? (
                    <div className="flex flex-col items-center py-10 text-gray-400 gap-2">
                      <Building2 className="w-10 h-10 opacity-30" />
                      <p className="text-sm">No revenue data for this period</p>
                    </div>
                  ) : (() => {
                    const total = Object.values(analytics.byRoomType).reduce((s, v) => s + v, 0) || 1;
                    return (
                      <div className="space-y-4">
                        {([
                          { key: 'double-bed-deluxe', label: 'Double Bed Deluxe', color: '#6366f1' },
                          { key: 'executive-3bed', label: 'Executive 3-Bed', color: '#f59e0b' },
                          { key: 'vip', label: 'VIP Suite', color: '#10b981' },
                        ]).map(({ key, label, color }) => {
                          const val = analytics.byRoomType[key] || 0;
                          return (
                            <div key={key}>
                              <div className="flex justify-between text-sm mb-1.5">
                                <span className="font-medium text-gray-700">{label}</span>
                                <div className="flex gap-3 tabular-nums">
                                  <span className="text-gray-400">{((val / total) * 100).toFixed(1)}%</span>
                                  <span className="font-semibold text-gray-900">{formatINR(val)}</span>
                                </div>
                              </div>
                              <ProgressBar value={val} max={total} color={color} />
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>

              {/* GST Breakdown */}
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">GST Breakdown</CardTitle>
                  <CardDescription>{periodLabel}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-0">
                  {[
                    { label: 'Base Amount (excl. GST)', value: formatINR(analytics.totalBaseAmount), cls: 'text-gray-900' },
                    { label: 'CGST (6%)', value: formatINR(analytics.totalGst / 2), cls: 'text-purple-600' },
                    { label: 'SGST (6%)', value: formatINR(analytics.totalGst / 2), cls: 'text-purple-600' },
                  ].map(({ label, value, cls }) => (
                    <div key={label} className="flex justify-between items-center py-3 border-b">
                      <span className="text-sm text-gray-600">{label}</span>
                      <span className={`font-semibold text-sm ${cls}`}>{value}</span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center py-3 mt-1 bg-purple-50 rounded-lg px-3">
                    <span className="font-semibold text-sm text-purple-800">Total GST (12%)</span>
                    <span className="font-bold text-purple-700">{formatINR(analytics.totalGst)}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Invoice Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Invoice Summary</CardTitle>
                  <CardDescription>{periodLabel}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-0">
                  {[
                    { label: 'Total Invoices', value: String(analytics.invCount) },
                    { label: 'Invoice Revenue', value: formatINR(analytics.invRevenue) },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between items-center py-3 border-b">
                      <span className="text-sm text-gray-600">{label}</span>
                      <span className="font-bold text-gray-900">{value}</span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center py-3 border-b">
                    <span className="text-sm text-gray-600">Paid Invoices</span>
                    <Badge className="bg-emerald-100 text-emerald-700 border-0">{analytics.invPaid}</Badge>
                  </div>
                  <div className="flex justify-between items-center py-3">
                    <span className="text-sm text-gray-600">Pending Invoices</span>
                    <Badge className="bg-amber-100 text-amber-700 border-0">{analytics.invPending}</Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Invoices */}
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Recent Invoices</CardTitle>
                </CardHeader>
                <CardContent>
                  {invoices.length === 0 ? (
                    <div className="flex flex-col items-center py-10 text-gray-400 gap-2">
                      <Receipt className="w-10 h-10 opacity-30" />
                      <p className="text-sm">No invoices found</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b text-gray-400 text-xs uppercase tracking-wide">
                            <th className="text-left pb-2">Invoice #</th>
                            <th className="text-left pb-2">Customer</th>
                            <th className="text-right pb-2">Amount</th>
                            <th className="text-left pb-2">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {invoices.slice(0, 8).map((inv) => (
                            <tr key={inv.id} className="border-b last:border-0 hover:bg-gray-50">
                              <td className="py-2 font-medium text-indigo-600 pr-2">{inv.invoice_number}</td>
                              <td className="py-2 text-gray-700 pr-2 truncate max-w-[100px]">{inv.customer_name}</td>
                              <td className="py-2 text-right font-semibold tabular-nums">{formatINR(inv.total_amount)}</td>
                              <td className="py-2 pl-2">
                                <Badge className={`text-xs border-0 ${
                                  inv.payment_status === 'paid' ? 'bg-emerald-100 text-emerald-700'
                                  : inv.payment_status === 'partial' ? 'bg-amber-100 text-amber-700'
                                  : 'bg-red-100 text-red-700'
                                }`}>
                                  {inv.payment_status}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ── OCCUPANCY ─────────────────────────────────────────────────────── */}
          <TabsContent value="occupancy" className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard title="Current Occupancy" value={`${analytics.occupancyRate.toFixed(1)}%`} subtitle={`${analytics.occupiedRooms}/${analytics.totalRooms} rooms`} icon={Percent} color="#10b981" />
              <StatCard title="Available Rooms" value={formatNum(analytics.availableRooms)} subtitle="Ready to book" icon={Bed} color="#6366f1" />
              <StatCard title="Maintenance" value={formatNum(analytics.maintenanceRooms)} subtitle="Not available" icon={AlertCircle} color="#f59e0b" />
              <StatCard title="Avg Stay" value={`${analytics.avgNights.toFixed(1)} nights`} subtitle={periodLabel} icon={Clock} color="#06b6d4" />
            </div>

            {/* Room Grid */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Live Room Status</CardTitle>
                <CardDescription>All {analytics.totalRooms} rooms at a glance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-6 sm:grid-cols-9 lg:grid-cols-12 gap-2">
                  {rooms.map((room) => (
                    <motion.div
                      key={room.id}
                      whileHover={{ scale: 1.1 }}
                      className="aspect-square rounded-lg flex flex-col items-center justify-center cursor-default relative group"
                      style={{
                        backgroundColor: roomBg(room.status),
                        border: `1.5px solid ${roomBorder(room.status)}`,
                      }}
                    >
                      <span className="text-[10px] font-bold text-gray-700 leading-none">{room.room_number}</span>
                      <div className="w-1.5 h-1.5 rounded-full mt-0.5" style={{ backgroundColor: roomDot(room.status) }} />
                      <div className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                        {room.room_number} · {room.status}
                      </div>
                    </motion.div>
                  ))}
                </div>
                <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t">
                  {[
                    { label: 'Available', bg: '#d1fae5', dot: '#10b981' },
                    { label: 'Occupied', bg: '#fee2e2', dot: '#ef4444' },
                    { label: 'Cleaning', bg: '#fef3c7', dot: '#f59e0b' },
                    { label: 'Maintenance', bg: '#f3f4f6', dot: '#9ca3af' },
                  ].map((l) => (
                    <div key={l.label} className="flex items-center gap-2 text-sm text-gray-600">
                      <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: l.bg, border: `1px solid ${l.dot}` }} />
                      {l.label}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Rooms by Type */}
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Rooms by Type</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {([
                    { type: 'double-bed-deluxe', label: 'Double Bed Deluxe', color: '#6366f1' },
                    { type: 'executive-3bed', label: 'Executive 3-Bed', color: '#f59e0b' },
                    { type: 'vip', label: 'VIP Suite', color: '#10b981' },
                  ]).map(({ type, label, color }) => {
                    const count = analytics.roomTypeCounts[type] || 0;
                    return (
                      <div key={type} className="flex items-center gap-3">
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between text-sm mb-1">
                            <span className="font-medium">{label}</span>
                            <span className="text-gray-500 tabular-nums">{count} rooms</span>
                          </div>
                          <ProgressBar value={count} max={analytics.totalRooms || 1} color={color} />
                        </div>
                      </div>
                    );
                  })}
                  <div className="flex items-center gap-3 pt-1 border-t">
                    <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium">With AC</span>
                        <span className="text-gray-500 tabular-nums">{analytics.acRooms} rooms</span>
                      </div>
                      <ProgressBar value={analytics.acRooms} max={analytics.totalRooms || 1} color="#06b6d4" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Top Performing Rooms */}
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Top Performing Rooms</CardTitle>
                  <CardDescription>By all-time revenue</CardDescription>
                </CardHeader>
                <CardContent>
                  {analytics.roomPerformance.length === 0 ? (
                    <div className="flex flex-col items-center py-10 text-gray-400 gap-2">
                      <Bed className="w-10 h-10 opacity-30" />
                      <p className="text-sm">No booking data yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {analytics.roomPerformance.map((r, i) => (
                        <div key={r.room} className="flex items-center gap-3">
                          <div
                            className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                            style={{ backgroundColor: i === 0 ? '#f59e0b' : i === 1 ? '#9ca3af' : i === 2 ? '#b87333' : '#6366f1' }}
                          >
                            {i + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between text-sm">
                              <span className="font-medium text-gray-800">Room {r.room}</span>
                              <span className="text-indigo-600 font-semibold tabular-nums">{formatINR(r.revenue)}</span>
                            </div>
                            <p className="text-xs text-gray-400">{r.bookings} booking{r.bookings !== 1 ? 's' : ''} · {r.nights} nights</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ── GUESTS ────────────────────────────────────────────────────────── */}
          <TabsContent value="guests" className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard title="Unique Guests" value={formatNum(analytics.uniqueGuests)} subtitle="All-time" icon={Users} color="#6366f1" />
              <StatCard title="Period Bookings" value={formatNum(analytics.totalBookings)} subtitle={periodLabel} icon={Calendar} color="#f59e0b" />
              <StatCard title="Avg Revenue/Guest" value={formatINR(analytics.avgRevenuePerGuest)} subtitle="All-time avg" icon={IndianRupee} color="#10b981" />
              <StatCard title="Repeat Guests" value={formatNum(analytics.repeatGuests)} subtitle="2+ bookings" icon={Star} color="#f97316" />
            </div>

            {/* Guest Leaderboard */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Top Guests by Revenue</CardTitle>
                <CardDescription>All-time leaderboard</CardDescription>
              </CardHeader>
              <CardContent>
                {analytics.topCustomers.length === 0 ? (
                  <div className="flex flex-col items-center py-14 text-gray-400 gap-2">
                    <Users className="w-10 h-10 opacity-30" />
                    <p className="text-sm">No guest data yet — create bookings to populate</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-gray-400 text-xs uppercase tracking-wide">
                          <th className="text-left pb-2 w-8">#</th>
                          <th className="text-left pb-2">Guest</th>
                          <th className="text-left pb-2">Phone</th>
                          <th className="text-right pb-2">Stays</th>
                          <th className="text-right pb-2">Revenue</th>
                          <th className="text-left pb-2 pl-2">Tier</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analytics.topCustomers.map((c, i) => (
                          <motion.tr
                            key={c.name + c.phone}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.04 }}
                            className="border-b last:border-0 hover:bg-gray-50"
                          >
                            <td className="py-2.5 pr-2">
                              {i < 3 ? (
                                <span
                                  className="inline-flex w-5 h-5 rounded-full items-center justify-center text-[10px] font-bold text-white"
                                  style={{ backgroundColor: i === 0 ? '#f59e0b' : i === 1 ? '#9ca3af' : '#b87333' }}
                                >
                                  {i + 1}
                                </span>
                              ) : (
                                <span className="text-gray-400 text-xs">{i + 1}</span>
                              )}
                            </td>
                            <td className="py-2.5 font-medium text-gray-800">{c.name}</td>
                            <td className="py-2.5 text-gray-500 tabular-nums">{c.phone}</td>
                            <td className="py-2.5 text-right text-gray-700 tabular-nums">{c.bookings}</td>
                            <td className="py-2.5 text-right font-semibold text-indigo-600 tabular-nums">{formatINR(c.revenue)}</td>
                            <td className="py-2.5 pl-2">
                              {c.bookings >= 3 ? (
                                <Badge className="bg-amber-100 text-amber-700 border-0 text-xs gap-1">
                                  <Star className="w-3 h-3" />VIP
                                </Badge>
                              ) : c.bookings >= 2 ? (
                                <Badge className="bg-indigo-100 text-indigo-700 border-0 text-xs">Returning</Badge>
                              ) : (
                                <Badge variant="outline" className="text-xs text-gray-500">New</Badge>
                              )}
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Bookings */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Recent Bookings</CardTitle>
                <CardDescription>{periodLabel}</CardDescription>
              </CardHeader>
              <CardContent>
                {analytics.periodBookings.length === 0 ? (
                  <div className="flex flex-col items-center py-10 text-gray-400 gap-2">
                    <Calendar className="w-10 h-10 opacity-30" />
                    <p className="text-sm">No bookings in this period</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-gray-400 text-xs uppercase tracking-wide">
                          <th className="text-left pb-2">Booking #</th>
                          <th className="text-left pb-2">Guest</th>
                          <th className="text-left pb-2">Room</th>
                          <th className="text-left pb-2">Check-in</th>
                          <th className="text-right pb-2">Amount</th>
                          <th className="text-left pb-2 pl-2">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analytics.periodBookings.slice(0, 12).map((b) => (
                          <tr key={b.id} className="border-b last:border-0 hover:bg-gray-50">
                            <td className="py-2.5 font-medium text-indigo-600">{b.booking_number}</td>
                            <td className="py-2.5 text-gray-800">{b.customers?.name || '—'}</td>
                            <td className="py-2.5 text-gray-600">{b.rooms?.room_number || '—'}</td>
                            <td className="py-2.5 text-gray-500 tabular-nums">{new Date(b.check_in_date).toLocaleDateString('en-IN')}</td>
                            <td className="py-2.5 text-right font-semibold tabular-nums">{formatINR(b.total_amount)}</td>
                            <td className="py-2.5 pl-2">
                              <Badge className={`text-xs border-0 ${
                                b.booking_status === 'checked_in' ? 'bg-emerald-100 text-emerald-700'
                                : b.booking_status === 'confirmed' ? 'bg-blue-100 text-blue-700'
                                : b.booking_status === 'checked_out' ? 'bg-gray-100 text-gray-700'
                                : b.booking_status === 'cancelled' ? 'bg-red-100 text-red-700'
                                : 'bg-amber-100 text-amber-700'
                              }`}>
                                {b.booking_status.replace('_', ' ')}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}