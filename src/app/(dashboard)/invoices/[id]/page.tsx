import { Suspense } from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
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
