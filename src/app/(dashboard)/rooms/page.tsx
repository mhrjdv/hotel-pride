import { RoomGrid } from '@/components/rooms/RoomGrid';

export default function RoomsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Room Management</h1>
        <p className="text-gray-500">
          View real-time status of all rooms. Updates are shown live.
        </p>
      </div>
      <RoomGrid />
    </div>
  );
} 