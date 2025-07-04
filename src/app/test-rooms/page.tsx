'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';

type AvailableRoom = {
  id: string;
  room_number: string;
  room_type: string;
  ac_rate: number | null;
  non_ac_rate: number | null;
  base_rate: number;
  current_rate: number;
  amenities: string[] | null;
  max_occupancy: number;
  allow_extra_bed: boolean;
  has_ac: boolean;
  description: string | null;
  images: string[] | null;
  floor_number: number | null;
  is_active: boolean;
}

export default function TestRoomsPage() {
  const [rooms, setRooms] = useState<AvailableRoom[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const testRoomFunction = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Testing get_available_rooms function...');
      
      const { data, error } = await supabase.rpc('get_available_rooms', {
        p_check_in_date: '2024-12-30',
        p_check_in_time: '14:00',
        p_check_out_date: '2024-12-31',
        p_check_out_time: '12:00',
        p_room_type: 'double-bed-deluxe',
      });

      console.log('Response:', { data, error });

      if (error) {
        setError(`Error: ${error.message}`);
      } else {
        setRooms(data || []);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('Unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Test Room Loading</h1>
      
      <Button onClick={testRoomFunction} disabled={loading}>
        {loading ? 'Loading...' : 'Test Get Available Rooms'}
      </Button>

      {error && (
        <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {rooms.length > 0 && (
        <div className="mt-4">
          <h2 className="text-lg font-semibold mb-2">Available Rooms ({rooms.length})</h2>
          <div className="grid gap-2">
            {rooms.map((room) => (
              <div key={room.id} className="p-2 border rounded">
                Room {room.room_number} - {room.room_type} - AC: ₹{room.ac_rate} / Non-AC: ₹{room.non_ac_rate}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 