import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Database } from '@/lib/supabase/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';

// Map status to design props (bg + border + text)
const statusStyles: Record<string, string> = {
  available: 'bg-emerald-50 border-emerald-200 text-emerald-800',
  occupied: 'bg-red-50 border-red-200 text-red-800',
  cleaning: 'bg-amber-50 border-amber-200 text-amber-800',
  maintenance: 'bg-orange-50 border-orange-200 text-orange-800',
  blocked: 'bg-gray-100 border-gray-300 text-gray-600',
};

type Room = Database['public']['Tables']['rooms']['Row'];

export function RoomGrid() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRooms = async () => {
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .order('room_number');

      if (error) {
        setError(error.message);
      } else {
        setRooms(data || []);
      }
      setLoading(false);
    };

    fetchRooms();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600 py-8">
        Failed to load rooms: {error}
      </div>
    );
  }

  if (!rooms.length) {
    return (
      <div className="text-center py-8 text-gray-600">No rooms configured.</div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {rooms.map((room) => (
        <Card key={room.id} className={`border-2 ${statusStyles[room.status] || ''}`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center justify-between">
              {room.room_number}
              <Badge variant="outline" className="capitalize text-xs">
                {room.room_type.replace('-', ' ')}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-gray-700">
            <p>Status: <span className="capitalize font-medium">{room.status}</span></p>
            <p>Rate: ₹{room.current_rate.toLocaleString('en-IN')}</p>
            {room.allow_extra_bed && (
              <p className="text-emerald-700 font-medium">Extra Bed Available</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
} 