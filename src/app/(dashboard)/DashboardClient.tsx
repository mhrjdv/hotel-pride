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
} from 'lucide-react';
import { RoomGrid } from '@/components/rooms/RoomGrid';

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
  );
} 