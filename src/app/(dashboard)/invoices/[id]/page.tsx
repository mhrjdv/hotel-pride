import { Suspense } from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import InvoiceView from './InvoiceView';

interface InvoicePageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({ params }: InvoicePageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Invoice ${id} | Hotel Pride`,
    description: 'View invoice details and manage payments',
  };
}

export default async function InvoicePage({ params }: InvoicePageProps) {
  const { id } = await params;
  if (!id) {
    notFound();
  }

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
            Invoice Details
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            View and manage invoice information
          </p>
        </div>
      </div>

      <Suspense fallback={
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      }>
        <InvoiceView invoiceId={id} />
      </Suspense>
    </div>
  );
}
