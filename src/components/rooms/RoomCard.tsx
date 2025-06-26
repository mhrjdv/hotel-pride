'use client';

import { Database } from '@/lib/supabase/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Bed, 
  User, 
  Wifi, 
  Tv, 
  Snowflake, 
  Wind, 
  Check, 
  X, 
  Users, 
  IndianRupee, 
  MoreHorizontal 
} from 'lucide-react';
import { getRoomStatusConfig, getRoomTypeDisplay, formatAmenities } from '@/lib/utils/hotel';

type Room = Database['public']['Tables']['rooms']['Row'];

interface RoomCardProps {
  room: Room;
  onSelect?: (room: Room) => void;
}

const amenityIcons: { [key: string]: React.ElementType } = {
  'Wi-Fi': Wifi,
  'Television': Tv,
  'Air Conditioning': Snowflake,
  'Fan': Wind,
};

export function RoomCard({ room, onSelect }: RoomCardProps) {
  const statusConfig = getRoomStatusConfig(room.status);
  const roomTypeLabel = room.room_type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());

  return (
    <Card className={`overflow-hidden transition-all duration-300 hover:shadow-lg border-2 ${statusConfig.border}`}>
      <CardHeader className={`p-4 ${statusConfig.bg}`}>
        <div className="flex items-center justify-between">
          <CardTitle className={`text-xl font-bold ${statusConfig.text}`}>Room {room.room_number}</CardTitle>
          <Badge className={`${statusConfig.bg} ${statusConfig.text} border ${statusConfig.border} flex items-center gap-2 px-3 py-1`}>
            {statusConfig.icon && <span className="text-base">{statusConfig.icon}</span>}
            <span className="font-semibold">{statusConfig.label}</span>
          </Badge>
        </div>
        <CardDescription className={`${statusConfig.text} opacity-90 pt-1`}>{getRoomTypeDisplay(room.room_type)}</CardDescription>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        <div className="text-center">
          <p className="font-semibold text-gray-800">{roomTypeLabel}</p>
          <p className="text-sm text-gray-500">Max {room.max_occupancy} Guests</p>
        </div>

        <div className="flex justify-center items-baseline gap-1">
          <span className="text-2xl font-bold text-gray-900">₹{room.current_rate.toLocaleString('en-IN')}</span>
          <span className="text-sm text-gray-500">/ night</span>
        </div>

        <div className="flex justify-center gap-3 text-gray-600">
          {room.amenities?.map((amenity) => {
            const Icon = amenityIcons[amenity];
            return Icon ? <Icon key={amenity} className="w-5 h-5" title={amenity} /> : null;
          })}
        </div>
        
        <div className="text-xs text-center text-gray-500 flex items-center justify-center gap-2">
            Extra Bed: 
            {room.allow_extra_bed ? (
                <span className="flex items-center gap-1 font-medium text-green-600"><Check className="w-3 h-3"/>Yes</span>
            ) : (
                <span className="flex items-center gap-1 font-medium text-red-600"><X className="w-3 h-3"/>No</span>
            )}
        </div>

        <div className="flex gap-2 pt-4 border-t">
          <Button variant="outline" size="sm" className="w-full">
            <MoreHorizontal className="w-4 h-4 mr-2"/>
            Details
          </Button>
          {onSelect && (
            <Button onClick={() => onSelect(room)} size="sm" className="w-full">
              Select Room
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 