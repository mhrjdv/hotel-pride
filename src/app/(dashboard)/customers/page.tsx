import { AddCustomerButton } from '@/components/customers/AddCustomerButton';
import { CustomerSearch } from '@/components/customers/CustomerSearch';
import { CustomerList } from '@/components/customers/CustomerList';
import { Suspense } from 'react';
import { createServerClient } from '@/lib/supabase/server';

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  const params = await searchParams;
  const query = params?.search || '';
  const supabase = await createServerClient();

  let queryBuilder = supabase
    .from('customers')
    .select(`
      id, 
      name, 
      email, 
      phone, 
      alternate_phone,
      id_type, 
      id_number, 
      id_photo_urls,
      address_line1,
      address_line2,
      city,
      state,
      pin_code,
      country,
      date_of_birth,
      gender,
      nationality,
      is_blacklisted, 
      blacklist_reason,
      notes,
      total_bookings,
      total_spent,
      created_at, 
      updated_at,
      created_by,
      updated_by
    `)
    .order('created_at', { ascending: false })
    .limit(50);

  if (query) {
    queryBuilder = queryBuilder.or(`name.ilike.%${query}%,phone.ilike.%${query}%,email.ilike.%${query}%`);
  }

  const { data: customers, error } = await queryBuilder;

  if (error) {
    // This is a simple error display. For production, you might want to log this
    // and show a more user-friendly error component.
    return <p className="text-red-500 p-4">Error loading customers: {error.message}</p>;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Customers</h1>
        <div className="flex items-center gap-2">
          <CustomerSearch />
          <AddCustomerButton />
        </div>
      </div>

      <Suspense fallback={<div className="text-center">Loading customers...</div>}>
         <CustomerList query={query} customers={customers || []} />
      </Suspense>
    </div>
  );
} 