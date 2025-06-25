'use client';

import { useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { Navigation } from '@/components/ui/navigation';
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
  Settings,
  Bell
} from 'lucide-react';
import { RoomGrid } from '@/components/rooms/RoomGrid';

/**
 * Hotel Management Dashboard
 * Main interface for staff to manage rooms, bookings, and customers
 */
export default function HotelDashboard() {
  const { user, profile, loading } = useAuth();
  const [selectedTab, setSelectedTab] = useState('overview');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return null; // This will be handled by middleware redirect
  }

  // Mock data - will be replaced with real Supabase data
  const mockStats = {
    totalRooms: 18,
    occupiedRooms: 12,
    availableRooms: 6,
    todayCheckIns: 3,
    todayCheckOuts: 2,
    todayRevenue: 45000,
    pendingPayments: 2
  };

  const roomStatuses = [
    { type: 'available', count: 6, color: 'bg-emerald-50 border-emerald-200 text-emerald-800' },
    { type: 'occupied', count: 12, color: 'bg-red-50 border-red-200 text-red-800' },
    { type: 'cleaning', count: 0, color: 'bg-amber-50 border-amber-200 text-amber-800' },
    { type: 'maintenance', count: 0, color: 'bg-orange-50 border-orange-200 text-orange-800' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="p-4 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Welcome back, {profile.full_name || profile.email}!
              </h1>
              <p className="text-gray-600">
                Here's what's happening at your hotel today.
              </p>
            </div>
            <div className="flex items-center gap-4 mt-4 lg:mt-0">
              <Button variant="outline" size="sm">
                <Bell className="h-4 w-4 mr-2" />
                Notifications
              </Button>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </div>

      {/* Main Content */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="rooms">Rooms</TabsTrigger>
          <TabsTrigger value="bookings">Bookings</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Rooms</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{mockStats.totalRooms}</div>
                <p className="text-xs text-muted-foreground">
                  {mockStats.occupiedRooms} occupied, {mockStats.availableRooms} available
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Today's Check-ins</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{mockStats.todayCheckIns}</div>
                <p className="text-xs text-muted-foreground">
                  {mockStats.todayCheckOuts} check-outs expected
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Today's Revenue</CardTitle>
                <IndianRupee className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ₹{mockStats.todayRevenue.toLocaleString('en-IN')}
                </div>
                <p className="text-xs text-muted-foreground">
                  {mockStats.pendingPayments} pending payments
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Occupancy Rate</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Math.round((mockStats.occupiedRooms / mockStats.totalRooms) * 100)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  {mockStats.occupiedRooms} of {mockStats.totalRooms} rooms
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Room Status Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Room Status Overview</CardTitle>
              <CardDescription>
                Current status of all rooms in the hotel
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {roomStatuses.map((status) => (
                  <div key={status.type} className="text-center">
                    <div className={`rounded-lg border-2 p-4 ${status.color}`}>
                      <div className="text-2xl font-bold mb-1">{status.count}</div>
                      <div className="text-sm font-medium capitalize">
                        {status.type}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Common tasks for hotel operations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Button size="lg" className="h-auto p-4 flex-col">
                  <Bed className="h-8 w-8 mb-2" />
                  <span className="font-semibold">New Booking</span>
                  <span className="text-xs text-muted-foreground">
                    Create a new room reservation
                  </span>
                </Button>
                
                <Button size="lg" variant="outline" className="h-auto p-4 flex-col">
                  <Users className="h-8 w-8 mb-2" />
                  <span className="font-semibold">Walk-in Guest</span>
                  <span className="text-xs text-muted-foreground">
                    Register a walk-in customer
                  </span>
                </Button>
                
                <Button size="lg" variant="outline" className="h-auto p-4 flex-col">
                  <ClipboardList className="h-8 w-8 mb-2" />
                  <span className="font-semibold">Check-in/out</span>
                  <span className="text-xs text-muted-foreground">
                    Process arrivals and departures
                  </span>
                </Button>
              </div>
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
              <CardTitle>Booking Management</CardTitle>
              <CardDescription>
                View and manage all reservations and bookings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Booking Management</h3>
                <p className="text-gray-600 mb-4">
                  Booking management interface will be implemented here
                </p>
                <Button>View All Bookings</Button>
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
      </div>
    </div>
  );
}
