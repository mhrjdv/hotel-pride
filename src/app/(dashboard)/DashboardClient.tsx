'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Building2,
  Users,
  Calendar,
  IndianRupee,
  Bed,
  ClipboardList,
  Plus,
  Clock,
  CreditCard,
} from 'lucide-react';
import { RoomGrid } from '@/components/rooms/RoomGrid';
import { useRouter } from 'next/navigation';

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
};

export function DashboardClient({ stats }: DashboardClientProps) {
  const roomStatuses = [
    { type: 'available', count: stats.availableRooms, color: 'bg-emerald-50 border-emerald-200 text-emerald-800' },
    { type: 'occupied', count: stats.occupiedRooms, color: 'bg-red-50 border-red-200 text-red-800' },
    { type: 'cleaning', count: 0, color: 'bg-amber-50 border-amber-200 text-amber-800' },
    { type: 'maintenance', count: 0, color: 'bg-orange-50 border-orange-200 text-orange-800' },
  ];

  const router = useRouter();

  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className="grid w-full grid-cols-2 lg:w-auto lg:grid-cols-4 mb-4">
        <TabsTrigger value="overview">
          <ClipboardList className="w-4 h-4 mr-2" />
          Overview
        </TabsTrigger>
        <TabsTrigger value="rooms">
          <Bed className="w-4 h-4 mr-2" />
          Rooms
        </TabsTrigger>
        <TabsTrigger value="bookings">
          <Calendar className="w-4 h-4 mr-2" />
          Bookings
        </TabsTrigger>
        <TabsTrigger value="customers">
          <Users className="w-4 h-4 mr-2" />
          Customers
        </TabsTrigger>
      </TabsList>

      {/* Overview Tab */}
      <TabsContent value="overview">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Stat Cards */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Rooms</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalRooms}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Revenue</CardTitle>
              <IndianRupee className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{stats.todayRevenue.toLocaleString('en-IN')}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Check-ins Today</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">+{stats.todayCheckIns}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingPayments}</div>
            </CardContent>
          </Card>
        </div>
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Room Status Overview</CardTitle>
            <CardDescription>Current availability of all rooms.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4">
            {roomStatuses.map((status) => (
              <Badge key={status.type} className={`px-4 py-2 text-sm capitalize ${status.color}`}>
                {status.type}: {status.count}
              </Badge>
            ))}
          </CardContent>
        </Card>
      </TabsContent>

      {/* Rooms Tab */}
      <TabsContent value="rooms">
        <Card>
          <CardHeader>
            <CardTitle>Room Management</CardTitle>
            <CardDescription>
              Manage all rooms and their current status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RoomGrid />
          </CardContent>
        </Card>
      </TabsContent>

      {/* Bookings Tab */}
      <TabsContent value="bookings">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Booking Management</CardTitle>
                <CardDescription>
                  View and manage all reservations and bookings
                </CardDescription>
              </div>
              <Button onClick={() => router.push('/bookings')}>
                <Plus className="w-4 h-4 mr-2" />
                New Booking
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Quick Stats */}
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-semibold text-blue-800 mb-2">Today's Check-ins</h3>
                  <p className="text-2xl font-bold text-blue-600">{stats.todayCheckIns || 0}</p>
                  <p className="text-sm text-blue-600">Guests arriving today</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <h3 className="font-semibold text-green-800 mb-2">Today's Check-outs</h3>
                  <p className="text-2xl font-bold text-green-600">{stats.todayCheckOuts || 0}</p>
                  <p className="text-sm text-green-600">Guests departing today</p>
                </div>
                <div className="p-4 bg-amber-50 rounded-lg">
                  <h3 className="font-semibold text-amber-800 mb-2">Pending Payments</h3>
                  <p className="text-2xl font-bold text-amber-600">{stats.pendingPayments || 0}</p>
                  <p className="text-sm text-amber-600">Bookings with due amounts</p>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">Quick Actions</h3>
                <div className="space-y-2">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => router.push('/bookings')}
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    View All Bookings
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => router.push('/bookings?filter=today')}
                  >
                    <Clock className="w-4 h-4 mr-2" />
                    Today's Activities
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => router.push('/bookings?filter=pending')}
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    Pending Payments
                  </Button>
                </div>
              </div>

              {/* Recent Bookings */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">Recent Bookings</h3>
                <div className="space-y-3">
                  <div className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium text-sm">HTL24120001</p>
                      <Badge variant="secondary" className="text-xs">Confirmed</Badge>
                    </div>
                    <p className="text-sm text-gray-600">John Doe • Room A201</p>
                    <p className="text-xs text-gray-500">Check-in: Today</p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium text-sm">HTL24120002</p>
                      <Badge variant="outline" className="text-xs">Checked In</Badge>
                    </div>
                    <p className="text-sm text-gray-600">Jane Smith • Room B102</p>
                    <p className="text-xs text-gray-500">Check-out: Tomorrow</p>
                  </div>
                  <Button variant="ghost" size="sm" className="w-full">
                    View All Bookings
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Customers Tab */}
      <TabsContent value="customers">
        <Card>
          <CardHeader>
            <CardTitle>Customer Management</CardTitle>
            <CardDescription>
              Manage customer information and ID verification
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Customer Management</h3>
              <p className="text-gray-600 mb-4">
                Customer management interface will be implemented here
              </p>
              <Button>View All Customers</Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
} 