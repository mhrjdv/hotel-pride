'use server';

import { z } from 'zod';
import { createServerClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

const idTypes = [
  'aadhaar',
  'pan',
  'passport',
  'driving_license',
  'voter_id',
] as const;

const customerSchema = z.object({
  name: z.string().min(2),
  phone: z.string().regex(/^\+91[0-9]{10}$/),
  email: z.string().email().optional().or(z.literal('')),
  id_type: z.enum(idTypes),
  id_number: z.string().min(5),
  address_line1: z.string().min(5),
  city: z.string().min(2),
  state: z.string().min(2),
  pin_code: z.string().regex(/^[1-9][0-9]{5}$/),
  notes: z.string().optional().nullable().transform(val => val ?? undefined),
});

const BUCKET_NAME = 'hotel-pride';

export async function addCustomer(formData: FormData) {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Authentication required.' };
  }

  const rawFormData = Object.fromEntries(formData.entries());

  // Handle files separately
  const idPhotos = formData.getAll('id_photos') as File[];
  
  const validation = customerSchema.safeParse(rawFormData);

  if (!validation.success) {
    return { success: false, error: validation.error.flatten().fieldErrors };
  }

  const id_photo_urls: string[] = [];
  if (idPhotos && idPhotos.length > 0) {
    for (const photo of idPhotos) {
      if (photo.size === 0) continue;
      const timestamp = Date.now();
      const key = `${user.id}/${timestamp}-${photo.name}`;
      try {
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from(BUCKET_NAME)
          .upload(key, photo);

        if (uploadError) throw uploadError;
        
        id_photo_urls.push(uploadData.path);
      } catch (err) {
        console.error('Storage Upload Error:', err);
        return { success: false, error: `Failed to upload photo ${photo.name}` };
      }
    }
  }
  
  const { data: insertedCustomer, error: insertError } = await supabase.from('customers').insert({
    ...validation.data,
    id_photo_urls: id_photo_urls.length > 0 ? id_photo_urls : null,
    created_by: user.id,
  }).select().single();

  if (insertError) {
    console.error('DB Insert Error:', insertError);
    return { success: false, error: 'Failed to save customer to the database.' };
  }

  revalidatePath('/customers');
  return { success: true, data: insertedCustomer };
}

export async function updateCustomer(id: string, existingPhotoUrls: string[], formData: FormData) {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Authentication required.' };
  }

  const rawFormData = Object.fromEntries(formData.entries());
  const idPhotos = formData.getAll('id_photos') as File[];
  const validation = customerSchema.safeParse(rawFormData);

  if (!validation.success) {
    return { success: false, error: validation.error.flatten().fieldErrors };
  }

  const new_photo_urls: string[] = [];
  if (idPhotos && idPhotos.length > 0) {
    for (const photo of idPhotos) {
      if (photo.size === 0) continue;
      const timestamp = Date.now();
      const key = `${user.id}/${timestamp}-${photo.name}`;
      try {
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from(BUCKET_NAME)
          .upload(key, photo);

        if (uploadError) throw uploadError;
        
        new_photo_urls.push(uploadData.path);
      } catch (err) {
        console.error('Storage Upload Error:', err);
        return { success: false, error: `Failed to upload photo ${photo.name}` };
      }
    }
  }

  // Combine existing URLs with new ones
  const finalPhotoUrls = [...existingPhotoUrls, ...new_photo_urls].filter(p => p);

  const { data: updatedCustomer, error: updateError } = await supabase
    .from('customers')
    .update({
      ...validation.data,
      id_photo_urls: finalPhotoUrls.length > 0 ? finalPhotoUrls : null,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (updateError) {
    console.error('DB Update Error:', updateError);
    return { success: false, error: 'Failed to update customer in the database.' };
  }

  revalidatePath('/customers');
  revalidatePath(`/customers/${id}`);
  return { success: true, data: updatedCustomer };
}

export async function getSignedUrls(paths: string[]) {
  const supabase = await createServerClient();
  if (!paths || paths.length === 0) {
    return { success: true, urls: [] };
  }

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUrls(paths, 60); // URLs are valid for 1 minute for form display

  if (error) {
    console.error('Error creating signed URLs for form:', error);
    return { success: false, error: 'Could not get image URLs.' };
  }
  
  // Create a map of path to signed URL for correct ordering
  const urlMap = new Map(data.map(item => [item.path, item.signedUrl]));
  // Return URLs in the same order as the requested paths
  const orderedUrls = paths.map(path => urlMap.get(path) || '');
  
  return { success: true, urls: orderedUrls };
} 