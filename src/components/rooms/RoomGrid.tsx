'use client';

import { useMemo, useState } from 'react';
import { Plus, BedDouble, Search, X } from '@/components/icons';
import { Database } from '@/lib/supabase/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { RoomRow } from './RoomCard';
import { RoomFormSheet } from './RoomFormSheet';

type Room = Database['public']['Tables']['rooms']['Row'];
type RoomType = Room['room_type'];

interface RoomGridProps {
  initialRooms: Room[];
}

const STATUS_FILTERS = ['all', 'available', 'occupied', 'cleaning', 'maintenance'] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

const STATUS_LABELS: Record<StatusFilter, string> = {
  all: 'All',
  available: 'Available',
  occupied: 'Occupied',
  cleaning: 'Cleaning',
  maintenance: 'Maintenance',
};

const TYPE_FILTERS: { value: 'all' | RoomType; label: string }[] = [
  { value: 'all', label: 'All types' },
  { value: 'double-bed-deluxe', label: 'Double Bed Deluxe' },
  { value: 'executive-3bed', label: 'Executive 3-Bed' },
  { value: 'vip', label: 'VIP' },
];

const COLUMN_COUNT = 8;

export function RoomGrid({ initialRooms }: RoomGridProps) {
  const [status, setStatus] = useState<StatusFilter>('all');
  const [type, setType] = useState<'all' | RoomType>('all');
  const [search, setSearch] = useState('');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: initialRooms.length };
    for (const r of initialRooms) c[r.status] = (c[r.status] ?? 0) + 1;
    return c;
  }, [initialRooms]);

  const visibleRooms = useMemo(() => {
    const query = search.trim().toLowerCase();
    return initialRooms.filter((r) => {
      if (status !== 'all' && r.status !== status) return false;
      if (type !== 'all' && r.room_type !== type) return false;
      if (query && !r.room_number.toLowerCase().includes(query)) return false;
      return true;
    });
  }, [initialRooms, status, type, search]);

  const openAdd = () => {
    setEditingRoom(null);
    setSheetOpen(true);
  };
  const openEdit = (room: Room) => {
    setEditingRoom(room);
    setSheetOpen(true);
  };

  const hasActiveFilters = status !== 'all' || type !== 'all' || search.trim() !== '';
  const clearFilters = () => {
    setStatus('all');
    setType('all');
    setSearch('');
  };

  return (
    <div className="space-y-4">
      {/* Filters toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter rooms by status">
          {STATUS_FILTERS.map((f) => (
            <Button
              key={f}
              size="sm"
              variant={status === f ? 'default' : 'outline'}
              aria-pressed={status === f}
              onClick={() => setStatus(f)}
            >
              {STATUS_LABELS[f]}
              <span className="ml-1.5 text-xs opacity-70">{counts[f] ?? 0}</span>
            </Button>
          ))}
        </div>

        <Button className="ml-auto" onClick={openAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Add Room
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by room number"
            className="pl-8"
            aria-label="Search rooms by room number"
          />
        </div>

        <Select value={type} onValueChange={(v) => setType(v as 'all' | RoomType)}>
          <SelectTrigger className="w-full sm:w-52" aria-label="Filter rooms by type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TYPE_FILTERS.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="mr-1.5 h-4 w-4" />
            Clear
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Room #</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>AC</TableHead>
              <TableHead>Rate/night</TableHead>
              <TableHead>Max guests</TableHead>
              <TableHead>Extra bed</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleRooms.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={COLUMN_COUNT} className="h-48">
                  <div className="flex flex-col items-center justify-center text-center">
                    <BedDouble className="mb-3 h-10 w-10 text-muted-foreground" aria-hidden="true" />
                    <p className="font-medium">
                      {initialRooms.length === 0 ? 'No rooms yet' : 'No rooms match your filters'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {initialRooms.length === 0
                        ? 'Add your first room to get started.'
                        : 'Try adjusting the filters or search.'}
                    </p>
                    {initialRooms.length === 0 ? (
                      <Button className="mt-4" onClick={openAdd}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Room
                      </Button>
                    ) : (
                      <Button className="mt-4" variant="outline" onClick={clearFilters}>
                        Clear filters
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              visibleRooms.map((room) => <RoomRow key={room.id} room={room} onEdit={openEdit} />)
            )}
          </TableBody>
        </Table>
      </div>

      <RoomFormSheet open={sheetOpen} onOpenChange={setSheetOpen} room={editingRoom} />
    </div>
  );
}
