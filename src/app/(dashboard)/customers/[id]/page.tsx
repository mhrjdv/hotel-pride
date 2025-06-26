import { notFound } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import { CustomerProfileClient } from './CustomerProfileClient';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function CustomerProfile({ params }: Props) {
  const { id } = await params;
  const supabase = await createServerClient();
  
  // Fetch customer details
  const { data: customer } = await supabase
    .from('customers')
    .select('*')
    .eq('id', id)
    .single();

  if (!customer) return notFound();

  // Fetch customer's bookings
  const { data: bookings, error: bookingsError } = await supabase
    .from('bookings')
    .select(`
      *,
      rooms (
        room_number,
        room_type
      )
    `)
    .eq('primary_customer_id', id)
    .order('created_at', { ascending: false });

  // Get signed URLs for ID photos
  let signedPhotoUrls: { url: string; path: string }[] = [];
  if (customer.id_photo_urls && customer.id_photo_urls.length > 0) {
    const photoPaths = customer.id_photo_urls.filter((p: string | null) => p);
    if (photoPaths.length > 0) {
      const { data, error } = await supabase.storage
        .from('hotel-pride')
        .createSignedUrls(photoPaths as string[], 3600);

      if (!error && data) {
        signedPhotoUrls = data.map((item, index) => ({
          url: item.signedUrl,
          path: photoPaths[index] as string
        })).filter(item => item.url);
      }
    }
  }

  return (
    <CustomerProfileClient
      customer={customer}
      bookings={bookings || []}
      signedPhotoUrls={signedPhotoUrls.map(item => item.url)}
    />
  );
}