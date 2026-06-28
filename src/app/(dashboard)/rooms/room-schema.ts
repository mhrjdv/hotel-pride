import { z } from 'zod';

export const roomFormSchema = z.object({
  room_number: z.string().trim().min(1, 'Room number is required').max(10),
  room_type: z.enum(['double-bed-deluxe', 'vip', 'executive-3bed']),
  current_rate: z.coerce.number().min(0, 'Rate cannot be negative'),
  max_occupancy: z.coerce.number().int().min(1, 'At least 1 guest').max(20),
  status: z.enum(['available', 'occupied', 'cleaning', 'maintenance', 'blocked']),
  has_ac: z.boolean().default(false),
  allow_extra_bed: z.boolean().default(false),
  amenities: z.array(z.string()).default([]),
});

export type RoomFormValues = z.input<typeof roomFormSchema>;
