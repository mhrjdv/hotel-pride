'use client';

import { Database } from '@/lib/supabase/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Pencil, Snowflake, Users, Plus } from '@/components/icons';
import { getRoomStatusConfig, getRoomTypeDisplay } from '@/lib/utils/hotel';

type Room = Database['public']['Tables']['rooms']['Row'];

interface RoomCardProps {
  room: Room;
  onEdit?: (room: Room) => void;
  onSelect?: (room: Room) => void;
}

export function RoomCard({ room, onEdit, onSelect }: RoomCardProps) {
  const status = getRoomStatusConfig(room.status);
  const isAvailable = room.status === 'available';

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-lg font-semibold leading-tight">Room {room.room_number}</p>
            <p className="text-sm text-muted-foreground">{getRoomTypeDisplay(room.room_type)}</p>
          </div>
          <Badge className={`${status.bg} ${status.text} border ${status.border}`}>{status.label}</Badge>
        </div>

        <div className="mt-3 flex items-baseline gap-1">
          <span className="text-xl font-bold">₹{room.current_rate.toLocaleString('en-IN')}</span>
          <span className="text-sm text-muted-foreground">/ night</span>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Users className="h-4 w-4" /> Max {room.max_occupancy}
          </span>
          {room.has_ac && (
            <span className="flex items-center gap-1">
              <Snowflake className="h-4 w-4" /> AC
            </span>
          )}
          {room.allow_extra_bed && <span>Extra bed</span>}
        </div>

        <div className="mt-4 flex gap-2">
          {onEdit && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => onEdit(room)}
              aria-label={`Edit room ${room.room_number}`}
            >
              <Pencil className="mr-1.5 h-4 w-4" /> Edit
            </Button>
          )}
          {onSelect && isAvailable && (
            <Button
              size="sm"
              className="flex-1"
              onClick={() => onSelect(room)}
              aria-label={`Book room ${room.room_number}`}
            >
              <Plus className="mr-1.5 h-4 w-4" /> Book
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
