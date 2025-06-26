import { RoomGrid } from '@/components/rooms/RoomGrid';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export default function RoomsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Room Management</h1>
          <p className="text-gray-500">
            View real-time status of all rooms. Updates are shown live.
          </p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add New Room
        </Button>
      </div>
      <RoomGrid />
    </div>
  );
} 