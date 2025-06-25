import { AddCustomerForm } from '@/components/customers/AddCustomerForm';
import { CustomerSearch } from '@/components/customers/CustomerSearch';
import { CustomerList } from '@/components/customers/CustomerList';
import { Suspense } from 'react';
import { createServerClient } from '@/lib/supabase/server';

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: { search?: string };
}) {
  const query = searchParams?.search || '';
  const supabase = await createServerClient();

  let queryBuilder = supabase
    .from('customers')
    .select('id, name, email, phone, id_type, id_number, is_blacklisted, created_at, updated_at')
    .order('created_at', { ascending: false })
    .limit(50);

  if (query) {
    queryBuilder = queryBuilder.or(`name.ilike.%${query}%,phone.ilike.%${query}%`);
  }

  const { data: customers, error } = await queryBuilder;

  if (error) {
    // This is a simple error display. For production, you might want to log this
    // and show a more user-friendly error component.
    return <p className="text-red-500 p-4">Error loading customers: {error.message}</p>;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Customer Management</h1>
          <p className="text-gray-600">
            View, add, and manage all your customers.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <CustomerSearch />
          <AddCustomerForm />
        </div>
      </div>

      <Suspense fallback={<div className="text-center">Loading customers...</div>}>
         <CustomerList query={query} customers={customers || []} />
      </Suspense>
    </div>
  );
} 