import { RoomGrid } from '@/components/rooms/RoomGrid';
import { createServerClient } from '@/lib/supabase/server';

export default async function RoomsPage() {
  const supabase = await createServerClient();
  const { data: rooms, error } = await supabase
    .from('rooms')
    .select('*')
    .order('room_number', { ascending: true });

  if (error) {
    return <p className="text-red-500 p-4">Error loading rooms: {error.message}</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Room Management</h1>
        <p className="text-gray-500">
          View real-time status of all rooms. Updates are shown live.
        </p>
      </div>
      <RoomGrid initialRooms={rooms || []} />
    </div>
  );
} 