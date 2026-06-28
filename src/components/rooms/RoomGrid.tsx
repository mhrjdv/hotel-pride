'use client';

import { useMemo, useState } from 'react';
import { Plus, BedDouble } from '@/components/icons';
import { Database } from '@/lib/supabase/types';
import { Button } from '@/components/ui/button';
import { RoomCard } from './RoomCard';
import { RoomFormSheet } from './RoomFormSheet';

type Room = Database['public']['Tables']['rooms']['Row'];

interface RoomGridProps {
  initialRooms: Room[];
}

const FILTERS = ['all', 'available', 'occupied', 'cleaning', 'maintenance'] as const;
type Filter = (typeof FILTERS)[number];

const FILTER_LABELS: Record<Filter, string> = {
  all: 'All',
  available: 'Available',
  occupied: 'Occupied',
  cleaning: 'Cleaning',
  maintenance: 'Maintenance',
};

export function RoomGrid({ initialRooms }: RoomGridProps) {
  const [filter, setFilter] = useState<Filter>('all');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: initialRooms.length };
    for (const r of initialRooms) c[r.status] = (c[r.status] ?? 0) + 1;
    return c;
  }, [initialRooms]);

  const visibleRooms = useMemo(
    () => (filter === 'all' ? initialRooms : initialRooms.filter((r) => r.status === filter)),
    [initialRooms, filter],
  );

  const openAdd = () => {
    setEditingRoom(null);
    setSheetOpen(true);
  };
  const openEdit = (room: Room) => {
    setEditingRoom(room);
    setSheetOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* Filter bar + primary action */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter rooms by status">
          {FILTERS.map((f) => (
            <Button
              key={f}
              size="sm"
              variant={filter === f ? 'default' : 'outline'}
              aria-pressed={filter === f}
              onClick={() => setFilter(f)}
            >
              {FILTER_LABELS[f]}
              <span className="ml-1.5 text-xs opacity-70">{counts[f] ?? 0}</span>
            </Button>
          ))}
        </div>
        <Button className="ml-auto" onClick={openAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Add Room
        </Button>
      </div>

      {visibleRooms.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
          <BedDouble className="mb-3 h-10 w-10 text-muted-foreground" />
          <p className="font-medium">No {filter === 'all' ? '' : FILTER_LABELS[filter].toLowerCase()} rooms</p>
          <p className="text-sm text-muted-foreground">
            {filter === 'all' ? 'Add your first room to get started.' : 'Try a different filter.'}
          </p>
          {filter === 'all' && (
            <Button className="mt-4" onClick={openAdd}>
              <Plus className="mr-2 h-4 w-4" />
              Add Room
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visibleRooms.map((room) => (
            <RoomCard key={room.id} room={room} onEdit={openEdit} />
          ))}
        </div>
      )}

      <RoomFormSheet open={sheetOpen} onOpenChange={setSheetOpen} room={editingRoom} />
    </div>
  );
}
