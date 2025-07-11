import { Suspense } from 'react';
import { Metadata } from 'next';
import InvoicesClient from './InvoicesClient';

export const metadata: Metadata = {
  title: 'Invoice Management | Hotel Pride',
  description: 'Manage hotel invoices, create new invoices, and track payments',
};

export default function InvoicesPage() {
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Invoice Management
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Create, manage, and track all your hotel invoices
        </p>
      </div>

      <Suspense fallback={
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      }>
        <InvoicesClient />
      </Suspense>
    </div>
  );
}
