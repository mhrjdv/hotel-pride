'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Download, Mail, ArrowLeft } from 'lucide-react';
import { InvoiceFormData, HotelConfig } from '@/lib/types/invoice';
import InvoiceLivePreview from '../components/InvoiceLivePreview';
import { toast } from 'sonner';

function InvoicePreviewContent() {
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState<InvoiceFormData | null>(null);
  const [hotelConfig, setHotelConfig] = useState<HotelConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Get form data from URL params
        const dataParam = searchParams.get('data');
        if (dataParam) {
          const decodedData = JSON.parse(decodeURIComponent(dataParam));
          setFormData(decodedData);
        }

        // Load hotel config
        const configResponse = await fetch('/api/hotel/config');
        if (configResponse.ok) {
          const configData = await configResponse.json();
          if (configData.success) {
            setHotelConfig(configData.data);
          }
        }
      } catch (error) {
        console.error('Error loading preview data:', error);
        toast.error('Failed to load preview data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [searchParams]);

  const handleDownloadPDF = async () => {
    if (!formData) return;

    try {
      // Create a temporary invoice for PDF generation
      const response = await fetch('/api/invoices/preview/pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${formData.invoice_type}-preview.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success('PDF downloaded successfully');
      } else {
        toast.error('Failed to generate PDF');
      }
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error('Failed to download PDF');
    }
  };

  const handleSendEmail = async () => {
    if (!formData) return;

    try {
      const response = await fetch('/api/invoices/preview/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Preview email sent successfully');
      } else {
        toast.error(data.error || 'Failed to send email');
      }
    } catch (error) {
      console.error('Error sending email:', error);
      toast.error('Failed to send email');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!formData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">No Preview Data</h1>
          <p className="text-gray-600 mb-6">No invoice data found for preview.</p>
          <Button onClick={() => window.close()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Close
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={() => window.close()}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Close Preview
              </Button>
              <div>
                <h1 className="text-xl font-semibold">
                  {formData.invoice_type.charAt(0).toUpperCase() + formData.invoice_type.slice(1)} Preview
                </h1>
                <p className="text-sm text-gray-600">
                  {formData.customer_name} • {formData.invoice_date}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={handleDownloadPDF}>
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
              {formData.is_email_enabled && formData.customer_email && (
                <Button onClick={handleSendEmail}>
                  <Mail className="h-4 w-4 mr-2" />
                  Send Email
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Preview Content */}
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-sm">
          <InvoiceLivePreview 
            formData={formData} 
            hotelConfig={hotelConfig || undefined}
          />
        </div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-area, .print-area * {
            visibility: visible;
          }
          .print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}

export default function InvoicePreviewPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <InvoicePreviewContent />
    </Suspense>
  );
}
