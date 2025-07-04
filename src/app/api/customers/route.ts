import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { cookies } from 'next/headers';

const idTypes = [
  'aadhaar',
  'pan',
  'passport',
  'driving_license',
  'voter_id',
] as const;

const customerFormSchema = z.object({
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

export async function POST(request: Request) {
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const idPhotos = formData.getAll('id_photos') as File[];

    const parsedData = customerFormSchema.safeParse({
      name: formData.get('name'),
      phone: formData.get('phone'),
      email: formData.get('email'),
      id_type: formData.get('id_type'),
      id_number: formData.get('id_number'),
      address_line1: formData.get('address_line1'),
      city: formData.get('city'),
      state: formData.get('state'),
      pin_code: formData.get('pin_code'),
      notes: formData.get('notes'),
    });

    if (!parsedData.success) {
      return NextResponse.json({ error: 'Invalid form data', details: parsedData.error.flatten() }, { status: 400 });
    }

    let id_photo_urls: string[] = [];
    if (idPhotos.length > 0) {
      for (const photo of idPhotos) {
        const fileName = `${user.id}/${uuidv4()}-${photo.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('hotel-pride')
          .upload(fileName, photo);

        if (uploadError) {
          console.error('Upload Error:', uploadError);
          return NextResponse.json({ error: 'Failed to upload one or more ID photos.', details: uploadError.message }, { status: 500 });
        }
        id_photo_urls.push(uploadData.path);
      }
    }

    const { data: newCustomer, error: insertError } = await supabase
      .from('customers')
      .insert([
        {
          ...parsedData.data,
          id_photo_urls,
          created_by: user.id,
        },
      ])
      .select()
      .single();

    if (insertError) {
      console.error('Insert Error:', insertError);
      return NextResponse.json({ error: 'Failed to create new customer.', details: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, customer: newCustomer });
  } catch (error: any) {
    console.error('API Route Error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred.', details: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
    const supabase = await createServerClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const formData = await request.formData();
        const idPhotos = formData.getAll('id_photos') as File[];
        const customerId = formData.get('customerId') as string;
        const existingPhotoPaths = JSON.parse(formData.get('existingPhotoPaths') as string || '[]') as string[];

        if (!customerId) {
            return NextResponse.json({ error: 'Customer ID is missing.' }, { status: 400 });
        }

        const parsedData = customerFormSchema.safeParse({
            name: formData.get('name'),
            phone: formData.get('phone'),
            email: formData.get('email'),
            id_type: formData.get('id_type'),
            id_number: formData.get('id_number'),
            address_line1: formData.get('address_line1'),
            city: formData.get('city'),
            state: formData.get('state'),
            pin_code: formData.get('pin_code'),
            notes: formData.get('notes'),
        });

        if (!parsedData.success) {
            return NextResponse.json({ error: 'Invalid form data.', details: parsedData.error.flatten() }, { status: 400 });
        }
        
        // Handle photo uploads
        const newPhotoUrls: string[] = [];
        if (idPhotos.length > 0) {
            for (const photo of idPhotos) {
                const fileName = `${user.id}/${uuidv4()}-${photo.name}`;
                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('hotel-pride')
                    .upload(fileName, photo);

                if (uploadError) {
                    console.error('Upload Error:', uploadError);
                    return NextResponse.json({ 
                        error: 'Failed to upload photo.', 
                        details: uploadError.message 
                    }, { status: 500 });
                }
                newPhotoUrls.push(uploadData.path);
            }
        }

        const finalPhotoUrls = [...existingPhotoPaths, ...newPhotoUrls];

        const { data: updatedCustomer, error: updateError } = await supabase
            .from('customers')
            .update({ ...parsedData.data, id_photo_urls: finalPhotoUrls })
            .eq('id', customerId)
            .select()
            .single();

        if (updateError) {
            console.error('Update Error:', updateError);
            return NextResponse.json({ 
                error: 'Failed to update customer.', 
                details: updateError.message 
            }, { status: 500 });
        }

        return NextResponse.json({ success: true, customer: updatedCustomer });

    } catch (error: any) {
        return NextResponse.json({ error: 'An unexpected error occurred.', details: error.message }, { status: 500 });
    }
} 