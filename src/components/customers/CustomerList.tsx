'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Card, CardContent } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { 
  Eye, 
  Edit, 
  MoreHorizontal, 
  Phone, 
  Mail, 
  MapPin, 
  CreditCard,
  UserCheck,
  UserX,
  Star,
  TrendingUp,
  Users
} from 'lucide-react';
import { AddCustomerForm } from './AddCustomerForm';
import { AddCustomerButton } from './AddCustomerButton';
import { Database } from '@/lib/supabase/types';
import { useState } from 'react';

type Customer = Database['public']['Tables']['customers']['Row'];

type CustomerListProps = {
  customers: Customer[];
  query: string;
};

const idTypeLabels = {
  aadhaar: 'Aadhaar',
  pan: 'PAN Card', 
  passport: 'Passport',
  driving_license: 'Driving License',
  voter_id: 'Voter ID',
};

export function CustomerList({ customers, query }: CustomerListProps) {
  const router = useRouter();
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  if (customers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-20 px-6 border-2 border-dashed rounded-lg">
        <Users className="h-16 w-16 text-gray-400 mb-4" />
        <h2 className="text-2xl font-semibold mb-2">No Customers Found</h2>
        <p className="text-gray-500 mb-6">
          {query ? "Try adjusting your search filters." : "It looks like you haven't added any customers yet."}
        </p>
        <AddCustomerButton />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-emerald-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total Customers</p>
                <p className="text-2xl font-bold text-gray-900">{customers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <UserX className="w-5 h-5 text-red-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Blacklisted</p>
                <p className="text-2xl font-bold text-gray-900">
                  {customers.filter(c => c.is_blacklisted).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Avg. Bookings</p>
                <p className="text-2xl font-bold text-gray-900">
                  {Math.round(customers.reduce((sum, c) => sum + (c.total_bookings || 0), 0) / customers.length)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">
                  ₹{customers.reduce((sum, c) => sum + (c.total_spent || 0), 0).toLocaleString('en-IN')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mobile Cards View */}
      <div className="block lg:hidden space-y-4">
        {customers.map((customer) => {
          return (
            <Card 
              key={customer.id} 
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => router.push(`/customers/${customer.id}`)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900">{customer.name}</h3>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                      <div className="flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {customer.phone}
                      </div>
                      {customer.email && (
                        <div className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {customer.email}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <CreditCard className="w-3 h-3" />
                        {idTypeLabels[customer.id_type]}
                      </div>
                      {customer.city && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {customer.city}, {customer.state}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {customer.is_blacklisted && (
                      <Badge variant="destructive" className="text-xs">Blacklisted</Badge>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={() => router.push(`/customers/${customer.id}`)}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setEditingCustomer(customer)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Customer
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => window.open(`tel:${customer.phone}`)}>
                          <Phone className="mr-2 h-4 w-4" />
                          Call Customer
                        </DropdownMenuItem>
                        {customer.email && (
                          <DropdownMenuItem onClick={() => window.open(`mailto:${customer.email}`)}>
                            <Mail className="mr-2 h-4 w-4" />
                            Send Email
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 pt-3 border-t text-sm">
                  <div>
                    <p className="text-gray-500">Total Spent</p>
                    <p className="font-semibold">₹{(customer.total_spent || 0).toLocaleString('en-IN')}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Bookings</p>
                    <p className="font-semibold">{customer.total_bookings || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block">
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>ID Info</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Total Spent</TableHead>
                  <TableHead>Bookings</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((customer) => {
                  return (
                    <TableRow 
                      key={customer.id} 
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => router.push(`/customers/${customer.id}`)}
                    >
                      <TableCell>
                        <div>
                          <div className="font-medium text-gray-900">{customer.name}</div>
                          <div className="text-sm text-gray-500">
                            Joined {format(new Date(customer.created_at), 'MMM yyyy')}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-sm">
                            <Phone className="w-3 h-3 text-gray-400" />
                            {customer.phone}
                          </div>
                          {customer.email && (
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              <Mail className="w-3 h-3 text-gray-400" />
                              {customer.email}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="text-sm font-medium">{idTypeLabels[customer.id_type]}</div>
                          <div className="text-xs text-gray-500 font-mono">{customer.id_number}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {customer.city && customer.state ? (
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-gray-400" />
                              {customer.city}, {customer.state}
                            </div>
                          ) : (
                            <span className="text-gray-400">Not provided</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">₹{(customer.total_spent || 0).toLocaleString('en-IN')}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{customer.total_bookings || 0}</div>
                      </TableCell>
                      <TableCell>
                        {customer.is_blacklisted ? (
                          <Badge variant="destructive">Blacklisted</Badge>
                        ) : (
                          <Badge variant="secondary">Active</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 w-8 p-0"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={() => router.push(`/customers/${customer.id}`)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setEditingCustomer(customer)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Details
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => window.open(`tel:${customer.phone}`)}>
                              <Phone className="mr-2 h-4 w-4" />
                              Call
                            </DropdownMenuItem>
                            {customer.email && (
                              <DropdownMenuItem onClick={() => window.open(`mailto:${customer.email}`)}>
                                <Mail className="mr-2 h-4 w-4" />
                                Email
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <AddCustomerForm
        isOpen={!!editingCustomer}
        onOpenChange={(open) => {
          if (!open) {
            setEditingCustomer(null);
          }
        }}
        customer={editingCustomer || undefined}
      />
    </div>
  );
} 