import { notFound } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import Image from 'next/image';
import { format } from 'date-fns';
import { AddCustomerForm } from '@/components/customers/AddCustomerForm';
import { Suspense } from 'react';

interface Props {
  params: Promise<{ id: string }>;
}

// Skeleton placeholder shown while the image gallery is being prepared
function ImageGallerySkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 animate-pulse">
      {Array.from({ length: 8 }).map((_, idx) => (
        <div
          // eslint-disable-next-line react/no-array-index-key
          key={idx}
          className="relative aspect-video rounded-lg overflow-hidden border bg-muted"
        />
      ))}
    </div>
  );
}

export default async function CustomerProfile({ params }: Props) {
  const { id } = await params;
  const supabase = await createServerClient();
  const { data: customer } = await supabase
    .from('customers')
    .select('*')
    .eq('id', id)
    .single();

  if (!customer) return notFound();

  let signedPhotoUrls: string[] = [];
  if (customer.id_photo_urls && customer.id_photo_urls.length > 0) {
    // Filter out any potentially empty strings
    const photoPaths = customer.id_photo_urls.filter((p: string | null) => p);
    if (photoPaths.length > 0) {
      const { data, error } = await supabase.storage
        .from('hotel-pride')
        .createSignedUrls(photoPaths as string[], 3600); // URLs are valid for 1 hour

      if (error) {
        console.error('Error creating signed URLs:', error);
        // In case of error, we'll just have an empty array and no images will be shown.
      } else {
        signedPhotoUrls = data.map(item => item.signedUrl).filter(Boolean);
      }
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{customer.name}</h1>
          <p className="text-sm text-muted-foreground">Created {format(new Date(customer.created_at), 'dd MMM yyyy')} • Updated {format(new Date(customer.updated_at), 'dd MMM yyyy')}</p>
        </div>
        <AddCustomerForm customer={customer} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="space-y-2">
          <h2 className="font-semibold">Contact</h2>
          <p>{customer.phone}</p>
          {customer.email && <p>{customer.email}</p>}
        </div>
        <div className="space-y-2">
          <h2 className="font-semibold">Address</h2>
          <p>{customer.address_line1}</p>
          <p>
            {customer.city}, {customer.state} {customer.pin_code}
          </p>
        </div>
      </div>

      {signedPhotoUrls.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-4">ID Photos</h2>
          <Suspense fallback={<ImageGallerySkeleton />}>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {signedPhotoUrls.map((url, index) => (
                <div key={index} className="relative aspect-video rounded-lg overflow-hidden border">
                  <Image
                    src={url}
                    alt={`ID Photo ${index + 1}`}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          </Suspense>
        </div>
      )}
    </div>
  );
}