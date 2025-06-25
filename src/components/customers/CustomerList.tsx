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
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { Database } from '@/lib/supabase/types';

type Customer = Pick<
  Database['public']['Tables']['customers']['Row'],
  'id' | 'name' | 'email' | 'phone' | 'id_type' | 'id_number' | 'is_blacklisted' | 'created_at' | 'updated_at'
>;

type CustomerListProps = {
  customers: Customer[];
  query: string;
};

export function CustomerList({ customers, query }: CustomerListProps) {
  const router = useRouter();

  if (!customers || customers.length === 0) {
    return (
      <div className="border-2 border-dashed rounded-lg p-12 text-center">
        <p className="text-gray-500">
          {query ? `No customers found for "${query}".` : 'No customers found.'}
        </p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead className="hidden md:table-cell">Contact</TableHead>
            <TableHead>ID</TableHead>
            <TableHead className="hidden md:table-cell">Created</TableHead>
            <TableHead className="hidden md:table-cell">Updated</TableHead>
            <TableHead className="text-right">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {customers.map((customer) => (
            <TableRow
              key={customer.id}
              className="hover:bg-accent cursor-pointer"
              onClick={() => router.push(`/customers/${customer.id}`)}
            >
              <TableCell className="font-medium underline">{customer.name}</TableCell>
              <TableCell className="hidden md:table-cell">
                <div>{customer.phone}</div>
                <div className="text-sm text-muted-foreground">{customer.email}</div>
              </TableCell>
              <TableCell>
                <div className="capitalize">{customer.id_type.replace('_', ' ')}</div>
                <div className="text-sm text-muted-foreground">{customer.id_number}</div>
              </TableCell>
              <TableCell className="hidden md:table-cell">{format(new Date(customer.created_at), 'dd MMM yyyy')}</TableCell>
              <TableCell className="hidden md:table-cell">{format(new Date(customer.updated_at), 'dd MMM yyyy')}</TableCell>
              <TableCell className="text-right">
                {customer.is_blacklisted && <Badge variant="destructive">Blacklisted</Badge>}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
} 