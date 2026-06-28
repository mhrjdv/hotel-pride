'use server';

import { revalidatePath } from 'next/cache';
import { createServerClient } from '@/lib/supabase/server';
import { roomFormSchema, type RoomFormValues } from './room-schema';

type ActionResult = { success: true } | { success: false; error: string };

async function requireUser() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function createRoom(input: RoomFormValues): Promise<ActionResult> {
  const { supabase, user } = await requireUser();
  if (!user) return { success: false, error: 'You must be signed in.' };

  const parsed = roomFormSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid room details.' };
  }
  const d = parsed.data;

  const { error } = await supabase.from('rooms').insert({
    room_number: d.room_number,
    room_type: d.room_type,
    base_rate: d.current_rate,
    current_rate: d.current_rate,
    max_occupancy: d.max_occupancy,
    status: d.status,
    has_ac: d.has_ac,
    allow_extra_bed: d.allow_extra_bed,
    amenities: d.amenities,
  });

  if (error) {
    // 23505 = unique_violation (duplicate room_number)
    if (error.code === '23505') return { success: false, error: `Room ${d.room_number} already exists.` };
    return { success: false, error: error.message };
  }

  revalidatePath('/rooms');
  revalidatePath('/');
  return { success: true };
}

export async function updateRoom(id: string, input: RoomFormValues): Promise<ActionResult> {
  const { supabase, user } = await requireUser();
  if (!user) return { success: false, error: 'You must be signed in.' };

  const parsed = roomFormSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid room details.' };
  }
  const d = parsed.data;

  const { error } = await supabase
    .from('rooms')
    .update({
      room_number: d.room_number,
      room_type: d.room_type,
      base_rate: d.current_rate,
      current_rate: d.current_rate,
      max_occupancy: d.max_occupancy,
      status: d.status,
      has_ac: d.has_ac,
      allow_extra_bed: d.allow_extra_bed,
      amenities: d.amenities,
    })
    .eq('id', id);

  if (error) {
    if (error.code === '23505') return { success: false, error: `Room ${d.room_number} already exists.` };
    return { success: false, error: error.message };
  }

  revalidatePath('/rooms');
  revalidatePath('/');
  return { success: true };
}
