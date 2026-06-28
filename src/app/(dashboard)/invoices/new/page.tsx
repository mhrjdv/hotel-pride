import { Suspense } from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from '@/components/icons';
import EnhancedInvoiceForm from '../components/EnhancedInvoiceForm';

export const metadata: Metadata = {
  title: 'Create New Invoice | Hotel Pride',
  description: 'Create invoices, proforma invoices, estimates, and quotes with live preview',
};

interface NewInvoicePageProps {
  searchParams: Promise<{ bookingId?: string; customerId?: string }>;
}

export default async function NewInvoicePage({ searchParams }: NewInvoicePageProps) {
  const { bookingId, customerId } = await searchParams;

  return (
    <div className="container mx-auto px-4 py-6">
      <Link
        href="/invoices"
        className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white mb-4"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Invoices
      </Link>

      <Suspense fallback={
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      }>
        <EnhancedInvoiceForm mode="create" bookingId={bookingId} customerId={customerId} />
      </Suspense>
    </div>
  );
}
