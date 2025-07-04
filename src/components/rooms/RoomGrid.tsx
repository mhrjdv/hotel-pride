'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Database } from '@/lib/supabase/types';
import { toast } from 'sonner';
import { Loader2, RefreshCw, ServerCrash } from 'lucide-react';
import { RoomCard } from './RoomCard';
import { Button } from '@/components/ui/button';

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
  const supabase = createClient();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRooms = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .order('room_number', { ascending: true });

    if (error) {
      console.error('Error fetching rooms:', error);
      setError('Failed to fetch rooms. Please check your connection and try again.');
      toast.error('Could not load room data.');
    } else {
      setRooms(data);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchRooms();

    const channel = supabase
      .channel('realtime-rooms')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'rooms' },
        (payload) => {
          console.log('Change received!', payload);
          toast.info('Room status has been updated.');
          fetchRooms(); // Refetch all rooms on any change
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchRooms, supabase]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
        <p className="mt-4 text-lg text-gray-600">Loading Room Status...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-red-50 text-red-700 border border-red-200 rounded-lg">
        <ServerCrash className="w-12 h-12" />
        <p className="mt-4 text-lg font-semibold">An Error Occurred</p>
        <p className="mt-1">{error}</p>
        <Button onClick={fetchRooms} className="mt-4">
          <RefreshCw className="w-4 h-4 mr-2" />
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
      {rooms.map((room) => (
        <RoomCard key={room.id} room={room} />
      ))}
    </div>
  );
} 