'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2 } from '@/components/icons';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Database } from '@/lib/supabase/types';
import { createRoom, updateRoom } from '@/app/(dashboard)/rooms/actions';
import type { RoomFormValues } from '@/app/(dashboard)/rooms/room-schema';

type Room = Database['public']['Tables']['rooms']['Row'];

const ROOM_TYPES: { value: Room['room_type']; label: string }[] = [
  { value: 'double-bed-deluxe', label: 'Double Bed Deluxe' },
  { value: 'executive-3bed', label: 'Executive 3-Bed' },
  { value: 'vip', label: 'VIP Suite' },
];

const STATUSES: { value: Room['status']; label: string }[] = [
  { value: 'available', label: 'Available' },
  { value: 'occupied', label: 'Occupied' },
  { value: 'cleaning', label: 'Cleaning' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'blocked', label: 'Blocked' },
];

const DEFAULTS: RoomFormValues = {
  room_number: '',
  room_type: 'double-bed-deluxe',
  current_rate: 1800,
  max_occupancy: 2,
  status: 'available',
  has_ac: false,
  allow_extra_bed: true,
  amenities: [],
};

interface RoomFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  room?: Room | null;
}

export function RoomFormSheet({ open, onOpenChange, room }: RoomFormSheetProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [values, setValues] = useState<RoomFormValues>(DEFAULTS);
  const isEdit = !!room;

  useEffect(() => {
    if (!open) return;
    setValues(
      room
        ? {
            room_number: room.room_number,
            room_type: room.room_type,
            current_rate: room.current_rate,
            max_occupancy: room.max_occupancy,
            status: room.status,
            has_ac: room.has_ac,
            allow_extra_bed: room.allow_extra_bed,
            amenities: room.amenities ?? [],
          }
        : DEFAULTS,
    );
  }, [open, room]);

  const set = <K extends keyof RoomFormValues>(key: K, val: RoomFormValues[K]) =>
    setValues((v) => ({ ...v, [key]: val }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = isEdit ? await updateRoom(room!.id, values) : await createRoom(values);
      if (res.success) {
        toast.success(isEdit ? 'Room updated' : 'Room added');
        onOpenChange(false);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md flex flex-col">
        <SheetHeader>
          <SheetTitle>{isEdit ? `Edit Room ${room!.room_number}` : 'Add Room'}</SheetTitle>
          <SheetDescription>
            {isEdit ? 'Update this room’s details.' : 'Create a new room for the hotel.'}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-5 overflow-y-auto px-4">
          <div className="grid gap-2">
            <Label htmlFor="room_number">Room number</Label>
            <Input
              id="room_number"
              value={values.room_number}
              onChange={(e) => set('room_number', e.target.value)}
              placeholder="e.g. 101"
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="room_type">Room type</Label>
            <Select value={values.room_type} onValueChange={(v) => set('room_type', v as Room['room_type'])}>
              <SelectTrigger id="room_type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROOM_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="current_rate">Rate (₹ / night)</Label>
              <Input
                id="current_rate"
                type="number"
                min={0}
                value={values.current_rate}
                onChange={(e) => set('current_rate', e.target.valueAsNumber || 0)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="max_occupancy">Max guests</Label>
              <Input
                id="max_occupancy"
                type="number"
                min={1}
                value={values.max_occupancy}
                onChange={(e) => set('max_occupancy', e.target.valueAsNumber || 1)}
                required
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="status">Status</Label>
            <Select value={values.status} onValueChange={(v) => set('status', v as Room['status'])}>
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <Label htmlFor="has_ac" className="cursor-pointer">Air conditioning</Label>
            <Switch id="has_ac" checked={values.has_ac} onCheckedChange={(c) => set('has_ac', c)} />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <Label htmlFor="allow_extra_bed" className="cursor-pointer">Allow extra bed</Label>
            <Switch
              id="allow_extra_bed"
              checked={values.allow_extra_bed}
              onCheckedChange={(c) => set('allow_extra_bed', c)}
            />
          </div>
        </form>

        <SheetFooter className="flex-row gap-2">
          <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)} disabled={pending}>
            Cancel
          </Button>
          <Button type="button" className="flex-1" onClick={handleSubmit} disabled={pending}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : isEdit ? 'Save changes' : 'Add room'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
