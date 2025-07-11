import { Suspense } from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import EnhancedInvoiceEditForm from './EnhancedInvoiceEditForm';

interface InvoiceEditPageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({ params }: InvoiceEditPageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Edit Invoice ${id} | Hotel Pride`,
    description: 'Edit invoice details and line items',
  };
}

export default async function InvoiceEditPage({ params }: InvoiceEditPageProps) {
  const { id } = await params;
  if (!id) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6 flex items-center gap-4">
        <Link href={`/invoices/${id}`}>
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Invoice
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Edit Invoice
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Modify invoice details with live preview
          </p>
        </div>
      </div>

      <Suspense fallback={
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </div>
      }>
        <EnhancedInvoiceEditForm invoiceId={id} />
      </Suspense>
    </div>
  );
}
