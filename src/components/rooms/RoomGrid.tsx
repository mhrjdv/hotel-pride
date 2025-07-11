'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Database } from '@/lib/supabase/types';
import { toast } from 'sonner';
import { Loader2, RefreshCw, ServerCrash } from 'lucide-react';
import { RoomCard } from './RoomCard';
import { Button } from '@/components/ui/button';

type Room = Database['public']['Tables']['rooms']['Row'];

interface RoomGridProps {
  initialRooms: Room[];
}

export function RoomGrid({ initialRooms }: RoomGridProps) {
  const [supabase] = useState(() => createClient());
  const [rooms, setRooms] = useState<Room[]>(initialRooms);
  const [loading, setLoading] = useState(initialRooms.length === 0);
  const [error, setError] = useState<string | null>(null);

  const fetchRooms = useCallback(async (isRefetch = false) => {
    if (isRefetch) {
      setLoading(true);
    }
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
    if (isRefetch) {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    // If we have initial data, we don't need to fetch it again immediately.
    // The realtime subscription will handle updates.
    if (initialRooms.length === 0) {
      fetchRooms(true);
    }

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
  }, [supabase, fetchRooms, initialRooms.length]);

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
        <Button onClick={() => fetchRooms(true)} className="mt-4">
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