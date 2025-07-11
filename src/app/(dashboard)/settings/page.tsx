import { Suspense } from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import HotelSettingsClient from './HotelSettingsClient';

export const metadata: Metadata = {
  title: 'Hotel Settings | Hotel Pride',
  description: 'Manage hotel information, bank details, and system settings',
};

export default function SettingsPage() {
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6 flex items-center gap-4">
        <Link href="/">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Hotel Settings
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage hotel information, bank details, and system configuration
          </p>
        </div>
      </div>

      <Suspense fallback={
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      }>
        <HotelSettingsClient />
      </Suspense>
    </div>
  );
}