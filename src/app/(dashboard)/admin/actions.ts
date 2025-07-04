'use server';

import { createServerClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const userRoleSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(['admin', 'manager', 'staff', 'receptionist']),
});

const userStatusSchema = z.object({
  userId: z.string().uuid(),
  isActive: z.boolean(),
});

async function checkAdmin() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (error || !profile || profile.role !== 'admin') {
    throw new Error('You do not have permission to perform this action.');
  }
}

export async function updateUserRole(formData: FormData) {
  const rawData = {
    userId: formData.get('userId'),
    role: formData.get('role'),
  };

  const parsed = userRoleSchema.safeParse(rawData);
  if (!parsed.success) {
    return { error: 'Invalid data provided.' };
  }

  try {
    await checkAdmin();
    const supabase = await createServerClient();
    const { error } = await supabase
      .from('profiles')
      .update({ role: parsed.data.role })
      .eq('id', parsed.data.userId);

    if (error) throw error;
    
    revalidatePath('/admin/users');
    return { success: true };

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    return { error: errorMessage };
  }
}

export async function updateUserStatus(formData: FormData) {
  const rawData = {
    userId: formData.get('userId'),
    isActive: formData.get('isActive') === 'true',
  };
  
  const parsed = userStatusSchema.safeParse(rawData);
  if (!parsed.success) {
    return { error: 'Invalid data provided.' };
  }

  try {
    await checkAdmin();
    const supabase = await createServerClient();
    const { error } = await supabase
      .from('profiles')
      .update({ is_active: parsed.data.isActive })
      .eq('id', parsed.data.userId);

    if (error) throw error;
    
    revalidatePath('/admin/users');
    return { success: true };

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    return { error: errorMessage };
  }
} 