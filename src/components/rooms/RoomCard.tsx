'use client';

import { Database } from '@/lib/supabase/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TableCell, TableRow } from '@/components/ui/table';
import { Pencil, Snowflake, Users } from '@/components/icons';
import { getRoomStatusConfig, getRoomTypeDisplay } from '@/lib/utils/hotel';

type Room = Database['public']['Tables']['rooms']['Row'];

interface RoomRowProps {
  room: Room;
  onEdit: (room: Room) => void;
}

/**
 * A single room rendered as a compact table row.
 */
export function RoomRow({ room, onEdit }: RoomRowProps) {
  const status = getRoomStatusConfig(room.status);

  return (
    <TableRow>
      <TableCell className="font-medium">{room.room_number}</TableCell>
      <TableCell className="text-muted-foreground">{getRoomTypeDisplay(room.room_type)}</TableCell>
      <TableCell>
        {room.has_ac ? (
          <span className="inline-flex items-center gap-1 text-sky-700">
            <Snowflake className="h-4 w-4" aria-hidden="true" />
            <span className="sr-only">Air conditioned</span>
            AC
          </span>
        ) : (
          <span className="text-muted-foreground">Non-AC</span>
        )}
      </TableCell>
      <TableCell className="tabular-nums">₹{room.current_rate.toLocaleString('en-IN')}</TableCell>
      <TableCell>
        <span className="inline-flex items-center gap-1 text-muted-foreground">
          <Users className="h-4 w-4" aria-hidden="true" />
          {room.max_occupancy}
        </span>
      </TableCell>
      <TableCell className="text-muted-foreground">{room.allow_extra_bed ? 'Yes' : 'No'}</TableCell>
      <TableCell>
        <Badge className={`${status.bg} ${status.text} border ${status.border}`}>{status.label}</Badge>
      </TableCell>
      <TableCell className="text-right">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onEdit(room)}
          aria-label={`Edit room ${room.room_number}`}
        >
          <Pencil className="h-4 w-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
}
