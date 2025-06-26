'use client';

import { useState } from 'react';
import Image from 'next/image';
import { format } from 'date-fns';
import { AddCustomerForm } from '@/components/customers/AddCustomerForm';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Phone,
  Mail,
  MapPin,
  Calendar,
  CreditCard,
  User,
  FileText,
  Star,
  TrendingUp,
  Hotel,
  DollarSign,
  Clock,
  AlertTriangle,
  Shield,
  Eye,
  Download,
  Edit,
  UserX,
  UserCheck,
  Camera,
  ExternalLink,
  Home,
  Briefcase,
  Key,
} from 'lucide-react';
import { Database } from '@/lib/supabase/types';

type Customer = Database['public']['Tables']['customers']['Row'];
type Booking = Database['public']['Tables']['bookings']['Row'] & {
  rooms: Pick<Database['public']['Tables']['rooms']['Row'], 'room_number' | 'room_type'> | null;
};

interface CustomerProfileClientProps {
  customer: Customer;
  bookings: Booking[];
  signedPhotoUrls: string[];
}

const idTypeLabels = {
  aadhaar: 'Aadhaar Card',
  pan: 'PAN Card', 
  passport: 'Passport',
  driving_license: 'Driving License',
  voter_id: 'Voter ID',
};

export function CustomerProfileClient({
  customer,
  bookings,
  signedPhotoUrls
}: CustomerProfileClientProps) {
  const { name, email, phone, created_at } = customer;
  const totalBookings = bookings?.length || 0;
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const completedBookings = bookings?.filter(b => b.booking_status === 'checked_out').length || 0;

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
        <div className="flex items-center gap-4">
          <Avatar className="h-20 w-20">
            <AvatarImage src={`https://api.dicebear.com/8.x/initials/svg?seed=${name}`} />
            <AvatarFallback>{name.substring(0, 2)}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-3xl font-bold">{name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm text-gray-500">
                Customer since {format(new Date(created_at), 'MMMM yyyy')}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Phone className="mr-2 h-4 w-4" />
            Call
          </Button>
          <Button variant="outline">
            <Mail className="mr-2 h-4 w-4" />
            Email
          </Button>
          <Button variant="outline" onClick={() => setIsEditDialogOpen(true)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Hotel className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total Bookings</p>
                <p className="text-2xl font-bold text-gray-900">{totalBookings}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total Spent</p>
                <p className="text-2xl font-bold text-gray-900">
                  ₹{(customer.total_spent || 0).toLocaleString('en-IN')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Completed Stays</p>
                <p className="text-2xl font-bold text-gray-900">{completedBookings}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Avg. Booking Value</p>
                <p className="text-2xl font-bold text-gray-900">
                  ₹{totalBookings > 0 ? Math.round((customer.total_spent || 0) / totalBookings).toLocaleString('en-IN') : '0'}
                </p>
              </div>
            </div>
          </CardContent>  
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="details" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="details">Details & Documents</TabsTrigger>
          <TabsTrigger value="bookings">Booking History</TabsTrigger>
          <TabsTrigger value="notes">Notes & Status</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Full Name</label>
                    <p className="text-sm text-gray-900">{name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Phone Number</label>
                    <p className="text-sm text-gray-900">{phone}</p>
                  </div>
                  {customer.alternate_phone && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Alternate Phone</label>
                      <p className="text-sm text-gray-900">{customer.alternate_phone}</p>
                    </div>
                  )}
                  {email && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Email</label>
                      <p className="text-sm text-gray-900">{email}</p>
                    </div>
                  )}
                  {customer.date_of_birth && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Date of Birth</label>
                      <p className="text-sm text-gray-900">
                        {format(new Date(customer.date_of_birth), 'dd MMM yyyy')}
                      </p>
                    </div>
                  )}
                  {customer.gender && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Gender</label>
                      <p className="text-sm text-gray-900 capitalize">{customer.gender}</p>
                    </div>
                  )}
                  {customer.nationality && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Nationality</label>
                      <p className="text-sm text-gray-900">{customer.nationality}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* ID Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  ID Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">ID Type</label>
                  <p className="text-sm text-gray-900">{idTypeLabels[customer.id_type as keyof typeof idTypeLabels]}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">ID Number</label>
                  <p className="text-sm text-gray-900 font-mono">{customer.id_number}</p>
                </div>
              </CardContent>
            </Card>

            {/* Address Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Address
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {customer.address_line1 && (
                  <p className="text-sm text-gray-900">{customer.address_line1}</p>
                )}
                {customer.address_line2 && (
                  <p className="text-sm text-gray-900">{customer.address_line2}</p>
                )}
                <div className="flex items-center gap-2 text-sm text-gray-900">
                  {customer.city && <span>{customer.city}</span>}
                  {customer.state && <span>, {customer.state}</span>}
                  {customer.pin_code && <span> - {customer.pin_code}</span>}
                </div>
                {customer.country && (
                  <p className="text-sm text-gray-600">{customer.country}</p>
                )}
              </CardContent>
            </Card>

            {/* Activity Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Activity Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div>
                    <p className="text-gray-900">Account created</p>
                    <p className="text-gray-500">{format(new Date(created_at), 'dd MMM yyyy, HH:mm')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div>
                    <p className="text-gray-900">Last updated</p>
                    <p className="text-gray-500">{format(new Date(customer.updated_at), 'dd MMM yyyy, HH:mm')}</p>
                  </div>
                </div>
                {bookings && bookings.length > 0 && (
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <div>
                      <p className="text-gray-900">Last booking</p>
                      <p className="text-gray-500">{format(new Date(bookings[0].created_at), 'dd MMM yyyy')}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* ID Photos Gallery */}
          {signedPhotoUrls.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="w-5 h-5" />
                  ID Document Photos ({signedPhotoUrls.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                  {signedPhotoUrls.map((url, index) => (
                    <div key={index} className="group relative">
                      <div className="relative aspect-[3/2] rounded-lg overflow-hidden border bg-gray-50">
                        <Image
                          src={url}
                          alt={`ID Document ${index + 1}`}
                          fill
                          sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 16vw"
                          className="object-cover transition-transform group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="secondary"
                              className="h-6 w-6 p-0"
                              onClick={() => window.open(url, '_blank')}
                            >
                              <Eye className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              className="h-6 w-6 p-0"
                              onClick={() => {
                                const link = document.createElement('a');
                                link.href = url;
                                link.download = `${name}_ID_${index + 1}`;
                                link.click();
                              }}
                            >
                              <Download className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 text-center">Document {index + 1}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="bookings" className="space-y-6">
          {bookings && bookings.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Booking History ({bookings.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Booking #</TableHead>
                      <TableHead>Room</TableHead>
                      <TableHead>Dates</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bookings.map((booking) => (
                      <TableRow key={booking.id}>
                        <TableCell className="font-mono text-sm">
                          {booking.booking_number}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">Room {booking.rooms?.room_number}</div>
                            <div className="text-sm text-gray-500 capitalize">
                              {booking.rooms?.room_type?.replace('-', ' ')}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{format(new Date(booking.check_in_date), 'dd MMM yyyy')}</div>
                            <div className="text-gray-500">to {format(new Date(booking.check_out_date), 'dd MMM yyyy')}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="font-medium">₹{booking.total_amount.toLocaleString('en-IN')}</div>
                            <div className="text-gray-500">{booking.total_nights} nights</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              booking.booking_status === 'checked_out' ? 'default' :
                              booking.booking_status === 'confirmed' ? 'secondary' :
                              booking.booking_status === 'checked_in' ? 'default' :
                              booking.booking_status === 'cancelled' ? 'destructive' :
                              'outline'
                            }
                            className="capitalize"
                          >
                            {booking.booking_status.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => window.open(`/bookings/${booking.id}`, '_blank')}
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Hotel className="w-12 h-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No bookings yet</h3>
                <p className="text-gray-500">This customer hasn't made any bookings.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="notes" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Customer Notes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {customer.notes ? (
                    <div className="prose prose-sm max-w-none">
                      <p className="text-gray-700 whitespace-pre-wrap">{customer.notes}</p>
                    </div>
                  ) : (
                    <p className="text-gray-500 italic">No notes available for this customer.</p>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Account Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {customer.is_blacklisted ? (
                    <div className="space-y-3">
                      <Badge variant="destructive" className="w-full justify-center">
                        <UserX className="w-4 h-4 mr-2" />
                        Blacklisted Customer
                      </Badge>
                      {customer.blacklist_reason && (
                        <div>
                          <label className="text-sm font-medium text-gray-600">Reason</label>
                          <p className="text-sm text-gray-900 mt-1">{customer.blacklist_reason}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <Badge variant="secondary" className="w-full justify-center text-emerald-700 bg-emerald-50">
                      <UserCheck className="w-4 h-4 mr-2" />
                      Active Customer
                    </Badge>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" className="w-full justify-start">
                    <Phone className="w-4 h-4 mr-2" />
                    Call Customer
                  </Button>
                  {email && (
                    <Button variant="outline" className="w-full justify-start">
                      <Mail className="w-4 h-4 mr-2" />
                      Send Email
                    </Button>
                  )}
                  <Button variant="outline" className="w-full justify-start">
                    <Hotel className="w-4 h-4 mr-2" />
                    New Booking
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
      <AddCustomerForm 
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        customer={customer}
      />
    </div>
  );
} 