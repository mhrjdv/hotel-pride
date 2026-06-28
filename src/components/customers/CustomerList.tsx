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
import { useRouter, useSearchParams } from 'next/navigation';
import { format } from 'date-fns';
import {
  Eye,
  Edit,
  MoreHorizontal,
  Phone,
  Mail,
  MapPin,
  Users,
} from '@/components/icons';
import { AddCustomerForm } from './AddCustomerForm';
import { AddCustomerButton } from './AddCustomerButton';
import { Database } from '@/lib/supabase/types';
import { useState } from 'react';

type Customer = Database['public']['Tables']['customers']['Row'];

type CustomerListProps = {
  customers: Customer[];
  query: string;
  isLoading?: boolean;
};

const idTypeLabels = {
  aadhaar: 'Aadhaar',
  pan: 'PAN Card',
  passport: 'Passport',
  driving_license: 'Driving License',
  voter_id: 'Voter ID',
};

const TABLE_COLUMNS = [
  'Name',
  'Contact',
  'ID',
  'Location',
  'Total Spent',
  'Bookings',
  'Status',
  'Actions',
];

function formatCurrency(value: number | null) {
  return `₹${(value || 0).toLocaleString('en-IN')}`;
}

function LoadingState() {
  const skeletonRows = Array.from({ length: 6 });

  return (
    <div className="space-y-6">
      {/* Mobile skeleton cards */}
      <div className="block space-y-4 lg:hidden">
        {skeletonRows.map((_, i) => (
          <Card key={i}>
            <CardContent className="space-y-3 p-4">
              <div className="h-4 w-1/3 animate-pulse rounded bg-gray-200" />
              <div className="h-3 w-2/3 animate-pulse rounded bg-gray-200" />
              <div className="h-3 w-1/2 animate-pulse rounded bg-gray-200" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Desktop skeleton table */}
      <div className="hidden lg:block">
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  {TABLE_COLUMNS.map((col) => (
                    <TableHead key={col}>{col}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {skeletonRows.map((_, i) => (
                  <TableRow key={i}>
                    {TABLE_COLUMNS.map((col) => (
                      <TableCell key={col}>
                        <div className="h-4 w-full animate-pulse rounded bg-gray-200" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function CustomerList({ customers, query, isLoading }: CustomerListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // Show the skeleton during the Suspense fallback and while a new server-side
  // search is in flight (the live URL param has moved ahead of the rendered data).
  const liveSearch = searchParams.get('search') || '';
  const isPending = isLoading || liveSearch !== query;

  if (isPending) {
    return <LoadingState />;
  }

  if (customers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-20 text-center">
        <Users className="mb-4 h-16 w-16 text-gray-400" />
        <h2 className="mb-2 text-2xl font-semibold">No Customers Found</h2>
        <p className="mb-6 text-gray-500">
          {query
            ? 'Try adjusting your search filters.'
            : "It looks like you haven't added any customers yet."}
        </p>
        <AddCustomerButton />
      </div>
    );
  }

  const renderActions = (customer: Customer) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          aria-label={`Actions for ${customer.name}`}
          className="h-8 w-8 p-0"
          onClick={(e) => e.stopPropagation()}
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem onClick={() => router.push(`/customers/${customer.id}`)}>
          <Eye className="mr-2 h-4 w-4" />
          View
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setEditingCustomer(customer)}>
          <Edit className="mr-2 h-4 w-4" />
          Edit
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
  );

  return (
    <div className="space-y-6">
      {/* Mobile Cards View */}
      <div className="block space-y-4 lg:hidden">
        {customers.map((customer) => (
          <Card
            key={customer.id}
            className="cursor-pointer transition-shadow hover:shadow-md"
            onClick={() => router.push(`/customers/${customer.id}`)}
          >
            <CardContent className="p-4">
              <div className="mb-3 flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-semibold text-gray-900">{customer.name}</h3>
                  <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {customer.phone}
                    </div>
                    {customer.email && (
                      <div className="flex min-w-0 items-center gap-1">
                        <Mail className="h-3 w-3 shrink-0" />
                        <span className="truncate">{customer.email}</span>
                      </div>
                    )}
                  </div>
                  {customer.city && (
                    <div className="mt-1 flex items-center gap-1 text-xs text-gray-500">
                      <MapPin className="h-3 w-3" />
                      {customer.city}
                      {customer.state ? `, ${customer.state}` : ''}
                    </div>
                  )}
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  {customer.is_blacklisted && (
                    <Badge variant="destructive" className="text-xs">
                      Blacklisted
                    </Badge>
                  )}
                  {renderActions(customer)}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t pt-3 text-sm">
                <div>
                  <p className="text-gray-500">Total Spent</p>
                  <p className="font-semibold">{formatCurrency(customer.total_spent)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Bookings</p>
                  <p className="font-semibold">{customer.total_bookings || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block">
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  {TABLE_COLUMNS.map((col) => (
                    <TableHead
                      key={col}
                      className={col === 'Actions' ? 'text-right' : undefined}
                    >
                      {col}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((customer) => (
                  <TableRow
                    key={customer.id}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => router.push(`/customers/${customer.id}`)}
                  >
                    <TableCell>
                      <div className="font-medium text-gray-900">{customer.name}</div>
                      <div className="text-sm text-gray-500">
                        Joined {format(new Date(customer.created_at), 'MMM yyyy')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-sm">
                          <Phone className="h-3 w-3 text-gray-400" />
                          {customer.phone}
                        </div>
                        {customer.email && (
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <Mail className="h-3 w-3 text-gray-400" />
                            {customer.email}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium">{idTypeLabels[customer.id_type]}</div>
                      <div className="font-mono text-xs text-gray-500">{customer.id_number}</div>
                    </TableCell>
                    <TableCell>
                      {customer.city && customer.state ? (
                        <div className="flex items-center gap-1 text-sm">
                          <MapPin className="h-3 w-3 text-gray-400" />
                          {customer.city}, {customer.state}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">Not provided</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{formatCurrency(customer.total_spent)}</div>
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
                    <TableCell className="text-right">{renderActions(customer)}</TableCell>
                  </TableRow>
                ))}
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
