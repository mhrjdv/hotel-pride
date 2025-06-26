import { notFound } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import BookingDetailsClient from './BookingDetailsClient';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function BookingDetailsPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createServerClient();

  const { data: booking, error } = await supabase
    .from('bookings')
    .select(`
      *,
      rooms (*),
      customers:primary_customer_id (*),
      booking_guests (*, customers (*))
    `)
    .eq('id', id)
    .single();

  if (!booking || error) return notFound();

  return <BookingDetailsClient booking={booking} />;
} 