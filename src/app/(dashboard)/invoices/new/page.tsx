import { Suspense } from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import EnhancedInvoiceForm from '../components/EnhancedInvoiceForm';

export const metadata: Metadata = {
  title: 'Create New Invoice | Hotel Pride',
  description: 'Create invoices, proforma invoices, estimates, and quotes with live preview',
};

export default function NewInvoicePage() {
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6 flex items-center gap-4">
        <Link href="/invoices">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Invoices
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Create New Invoice
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Create invoices, proforma invoices, estimates, and quotes with live preview
          </p>
        </div>
      </div>

      <Suspense fallback={
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      }>
        <EnhancedInvoiceForm mode="create" />
      </Suspense>
    </div>
  );
}
