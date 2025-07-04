'use client';

import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Download, 
  Printer, 
  Edit, 
  Eye, 
  FileText,
  Building,
  Users,
  Hotel,
  CreditCard
} from 'lucide-react';
import { toast } from 'sonner';

interface InvoiceData {
  // Hotel Details
  hotelName: string;
  hotelAddress: string;
  hotelCity: string;
  hotelState: string;
  hotelPinCode: string;
  hotelPhone: string;
  hotelEmail: string;
  gstNumber: string;
  
  // Bank Details
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  accountHolderName: string;
  
  // Invoice Details
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  
  // Display Options
  showGST: boolean;
  showBankDetails: boolean;
  customNotes: string;
}

interface BookingType {
  booking_number: string;
  check_in_date: string;
  check_out_date: string;
  check_in_time: string;
  check_out_time: string;
  total_nights: number;
  total_guests: number;
  room_rate: number;
  base_amount: number;
  gst_amount: number;
  total_amount: number;
  paid_amount: number;
  due_amount: number;
  gst_mode: string;
  payment_status: string;
  extra_bed_count?: number;
  extra_bed_rate?: number;
  extra_bed_total?: number;
  additional_charges?: string | null;
  ac_preference: boolean;
}

interface CustomerType {
  name: string;
  phone: string;
  email?: string | null;
  id_type: string;
  id_number: string;
  address_line1?: string | null;
  address_line2?: string | null;
  city?: string | null;
  state?: string | null;
  pin_code?: string | null;
}

interface RoomType {
  room_number: string;
  room_type: string;
}

interface InvoiceGeneratorProps {
  booking: BookingType;
  customer: CustomerType;
  room: RoomType;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const defaultHotelData = {
  hotelName: 'Hotel Pride',
  hotelAddress: 'Main Street, City Center',
  hotelCity: 'Mumbai',
  hotelState: 'Maharashtra',
  hotelPinCode: '400001',
  hotelPhone: '+91 98765 43210',
  hotelEmail: 'info@hotelpride.com',
  gstNumber: '27XXXXX1234X1ZX',
};

const defaultBankData = {
  bankName: 'State Bank of India',
  accountNumber: '1234567890123456',
  ifscCode: 'SBIN0001234',
  accountHolderName: 'Hotel Pride Pvt Ltd',
};

export function InvoiceGenerator({ booking, customer, room, isOpen, onOpenChange }: InvoiceGeneratorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [invoiceData, setInvoiceData] = useState<InvoiceData>({
    ...defaultHotelData,
    ...defaultBankData,
    invoiceNumber: `INV-${booking.booking_number}`,
    invoiceDate: new Date().toLocaleDateString('en-IN'),
    dueDate: new Date().toLocaleDateString('en-IN'),
    showGST: booking.gst_mode !== 'none',
    showBankDetails: true,
    customNotes: 'Thank you for choosing Hotel Pride. We look forward to serving you again.'
  });
  
  const invoiceRef = useRef<HTMLDivElement>(null);

  const handleFieldChange = (field: keyof InvoiceData, value: string | boolean) => {
    setInvoiceData(prev => ({ ...prev, [field]: value }));
  };

  const calculateTotals = () => {
    const baseAmount = booking.base_amount || (booking.room_rate * booking.total_nights);
    const gstAmount = invoiceData.showGST ? (booking.gst_amount || 0) : 0;
    const totalAmount = baseAmount + gstAmount + (booking.extra_bed_total || 0);
    
    return {
      baseAmount,
      gstAmount,
      totalAmount,
      gstRate: 12 // Standard hotel GST rate in India
    };
  };

  const totals = calculateTotals();

  const handlePrint = () => {
    if (invoiceRef.current) {
      const printContent = invoiceRef.current.innerHTML;
      const originalContent = document.body.innerHTML;
      
      document.body.innerHTML = `
        <html>
          <head>
            <title>Invoice - ${invoiceData.invoiceNumber}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .invoice-container { max-width: 800px; margin: 0 auto; }
              .header { text-align: center; margin-bottom: 30px; }
              .company-name { font-size: 24px; font-weight: bold; color: #1f2937; }
              .invoice-title { font-size: 20px; font-weight: bold; margin: 20px 0; }
              .section { margin: 20px 0; }
              .grid { display: grid; gap: 20px; }
              .grid-2 { grid-template-columns: 1fr 1fr; }
              .border { border: 1px solid #e5e7eb; padding: 15px; border-radius: 8px; }
              .text-right { text-align: right; }
              .font-bold { font-weight: bold; }
              .text-lg { font-size: 18px; }
              .text-sm { font-size: 14px; }
              .bg-gray { background-color: #f9fafb; }
              table { width: 100%; border-collapse: collapse; margin: 20px 0; }
              th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
              th { background-color: #f9fafb; font-weight: bold; }
              .total-row { font-weight: bold; font-size: 16px; }
              @media print {
                body { margin: 0; }
                .no-print { display: none; }
              }
            </style>
          </head>
          <body>${printContent}</body>
        </html>
      `;
      
      window.print();
      document.body.innerHTML = originalContent;
      window.location.reload();
    }
  };

  const handleDownloadPDF = async () => {
    try {
      // This would integrate with a PDF generation library like jsPDF or Puppeteer
      toast.info('PDF download functionality will be implemented with a PDF library');
    } catch (error) {
      console.error('PDF Download error:', error);
      toast.error('Failed to generate PDF');
    }
  };

  const InvoicePreview = () => (
    <div ref={invoiceRef} className="invoice-container bg-white p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="header text-center mb-8">
        <h1 className="company-name text-3xl font-bold text-gray-900 mb-2">
          {invoiceData.hotelName}
        </h1>
        <div className="text-gray-600 space-y-1">
          <p>{invoiceData.hotelAddress}</p>
          <p>{invoiceData.hotelCity}, {invoiceData.hotelState} - {invoiceData.hotelPinCode}</p>
          <p>Phone: {invoiceData.hotelPhone} | Email: {invoiceData.hotelEmail}</p>
          {invoiceData.showGST && <p>GSTIN: {invoiceData.gstNumber}</p>}
        </div>
      </div>

      <Separator className="mb-6" />

      {/* Invoice Title and Details */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="invoice-title text-2xl font-bold text-gray-900">TAX INVOICE</h2>
        <div className="text-right">
          <p className="text-lg font-semibold">Invoice No: {invoiceData.invoiceNumber}</p>
          <p className="text-gray-600">Date: {invoiceData.invoiceDate}</p>
        </div>
      </div>

      {/* Customer and Booking Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card className="border">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="w-5 h-5" />
              Bill To
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="font-semibold text-lg">{customer.name}</p>
            <p className="text-gray-600">{customer.phone}</p>
            {customer.email && <p className="text-gray-600">{customer.email}</p>}
            {customer.address_line1 && (
              <div className="text-gray-600">
                <p>{customer.address_line1}</p>
                {customer.address_line2 && <p>{customer.address_line2}</p>}
                <p>{customer.city}, {customer.state} - {customer.pin_code}</p>
              </div>
            )}
            <p className="text-sm text-gray-500">
              ID: {customer.id_type.toUpperCase()} - {customer.id_number}
            </p>
          </CardContent>
        </Card>

        <Card className="border">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Hotel className="w-5 h-5" />
              Booking Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p><span className="font-medium">Booking No:</span> {booking.booking_number}</p>
            <p><span className="font-medium">Room:</span> {room.room_number}</p>
            <p><span className="font-medium">Check-in:</span> {new Date(booking.check_in_date).toLocaleDateString('en-IN')} at {booking.check_in_time}</p>
            <p><span className="font-medium">Check-out:</span> {new Date(booking.check_out_date).toLocaleDateString('en-IN')} at {booking.check_out_time}</p>
            <p><span className="font-medium">Nights:</span> {booking.total_nights}</p>
            <p><span className="font-medium">Guests:</span> {booking.total_guests}</p>
            <p><span className="font-medium">AC Preference:</span> {booking.ac_preference ? 'With AC' : 'Without AC'}</p>
          </CardContent>
        </Card>
      </div>

      {/* Invoice Items Table */}
      <div className="mb-6">
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-50">
              <th className="border border-gray-300 p-3 text-left">Description</th>
              <th className="border border-gray-300 p-3 text-center">Quantity</th>
              <th className="border border-gray-300 p-3 text-right">Rate</th>
              <th className="border border-gray-300 p-3 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-gray-300 p-3">
                Room Charges - {room.room_number} 
                {booking.ac_preference ? ' (With AC)' : ' (Without AC)'}
              </td>
              <td className="border border-gray-300 p-3 text-center">{booking.total_nights} night(s)</td>
              <td className="border border-gray-300 p-3 text-right">₹{booking.room_rate.toLocaleString('en-IN')}</td>
              <td className="border border-gray-300 p-3 text-right">₹{(booking.room_rate * booking.total_nights).toLocaleString('en-IN')}</td>
            </tr>
            
            {(booking.extra_bed_count || 0) > 0 && (
              <tr>
                <td className="border border-gray-300 p-3">Extra Bed Charges</td>
                <td className="border border-gray-300 p-3 text-center">{booking.extra_bed_count || 0} bed(s) × {booking.total_nights} night(s)</td>
                <td className="border border-gray-300 p-3 text-right">₹{(booking.extra_bed_rate || 0).toLocaleString('en-IN')}</td>
                <td className="border border-gray-300 p-3 text-right">₹{(booking.extra_bed_total || 0).toLocaleString('en-IN')}</td>
              </tr>
            )}

            {booking.additional_charges && (() => {
              try {
                const charges = JSON.parse(booking.additional_charges);
                return charges.length > 0 && charges.map((charge: { description: string; amount: number }, index: number) => (
                  <tr key={index}>
                    <td className="border border-gray-300 p-3">{charge.description}</td>
                    <td className="border border-gray-300 p-3 text-center">1</td>
                    <td className="border border-gray-300 p-3 text-right">₹{charge.amount.toLocaleString('en-IN')}</td>
                    <td className="border border-gray-300 p-3 text-right">₹{charge.amount.toLocaleString('en-IN')}</td>
                  </tr>
                ));
              } catch {
                return null;
              }
            })()}

            {/* Totals */}
            <tr>
              <td colSpan={3} className="border border-gray-300 p-3 text-right font-semibold">Subtotal:</td>
              <td className="border border-gray-300 p-3 text-right font-semibold">₹{totals.baseAmount.toLocaleString('en-IN')}</td>
            </tr>
            
            {invoiceData.showGST && (
              <tr>
                <td colSpan={3} className="border border-gray-300 p-3 text-right">GST ({totals.gstRate}%):</td>
                <td className="border border-gray-300 p-3 text-right">₹{totals.gstAmount.toLocaleString('en-IN')}</td>
              </tr>
            )}
            
            <tr className="bg-gray-50">
              <td colSpan={3} className="border border-gray-300 p-3 text-right font-bold text-lg">Total Amount:</td>
              <td className="border border-gray-300 p-3 text-right font-bold text-lg">₹{totals.totalAmount.toLocaleString('en-IN')}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Payment Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card className="border">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Payment Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p><span className="font-medium">Total Amount:</span> ₹{totals.totalAmount.toLocaleString('en-IN')}</p>
            <p><span className="font-medium">Paid Amount:</span> ₹{booking.paid_amount.toLocaleString('en-IN')}</p>
            <p><span className="font-medium">Due Amount:</span> ₹{booking.due_amount.toLocaleString('en-IN')}</p>
            <Badge variant={booking.payment_status === 'paid' ? 'default' : booking.payment_status === 'partial' ? 'secondary' : 'destructive'}>
              {booking.payment_status.toUpperCase()}
            </Badge>
          </CardContent>
        </Card>

        {invoiceData.showBankDetails && (
          <Card className="border">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Building className="w-5 h-5" />
                Bank Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p><span className="font-medium">Bank Name:</span> {invoiceData.bankName}</p>
              <p><span className="font-medium">Account No:</span> {invoiceData.accountNumber}</p>
              <p><span className="font-medium">IFSC Code:</span> {invoiceData.ifscCode}</p>
              <p><span className="font-medium">Account Holder:</span> {invoiceData.accountHolderName}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Terms and Notes */}
      <div className="space-y-4">
        <div className="text-sm text-gray-600">
          <h4 className="font-semibold mb-2">Terms & Conditions:</h4>
          <ul className="list-disc list-inside space-y-1">
            <li>Payment is due within 24 hours of check-out unless otherwise agreed</li>
            <li>Any damages to hotel property will be charged separately</li>
            <li>Cancellation charges apply as per hotel policy</li>
            <li>All disputes subject to local jurisdiction</li>
          </ul>
        </div>

        {invoiceData.customNotes && (
          <div className="text-sm text-gray-600">
            <h4 className="font-semibold mb-2">Notes:</h4>
            <p>{invoiceData.customNotes}</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-8 pt-6 border-t text-center text-sm text-gray-500">
        <p>This is a computer generated invoice and does not require signature.</p>
        <p className="mt-2">Generated on {new Date().toLocaleString('en-IN')}</p>
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-6 h-6" />
            Invoice Generator - {booking.booking_number}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Controls */}
          <div className="flex-shrink-0 border-b p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant={isEditing ? "default" : "outline"}
                  onClick={() => setIsEditing(!isEditing)}
                  className="flex items-center gap-2"
                >
                  {isEditing ? <Eye className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
                  {isEditing ? 'Preview' : 'Edit'}
                </Button>
                
                <div className="flex items-center gap-2">
                  <Switch
                    checked={invoiceData.showGST}
                    onCheckedChange={(checked) => handleFieldChange('showGST', checked)}
                    id="show-gst"
                  />
                  <Label htmlFor="show-gst">Show GST</Label>
                </div>
                
                <div className="flex items-center gap-2">
                  <Switch
                    checked={invoiceData.showBankDetails}
                    onCheckedChange={(checked) => handleFieldChange('showBankDetails', checked)}
                    id="show-bank"
                  />
                  <Label htmlFor="show-bank">Show Bank Details</Label>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={handlePrint} className="flex items-center gap-2">
                  <Printer className="w-4 h-4" />
                  Print
                </Button>
                <Button variant="outline" onClick={handleDownloadPDF} className="flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  Download PDF
                </Button>
              </div>
            </div>

            {/* Edit Form */}
            {isEditing && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="space-y-2">
                  <Label htmlFor="hotel-name">Hotel Name</Label>
                  <Input
                    id="hotel-name"
                    value={invoiceData.hotelName}
                    onChange={(e) => handleFieldChange('hotelName', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gst-number">GST Number</Label>
                  <Input
                    id="gst-number"
                    value={invoiceData.gstNumber}
                    onChange={(e) => handleFieldChange('gstNumber', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bank-name">Bank Name</Label>
                  <Input
                    id="bank-name"
                    value={invoiceData.bankName}
                    onChange={(e) => handleFieldChange('bankName', e.target.value)}
                  />
                </div>
                <div className="md:col-span-3 space-y-2">
                  <Label htmlFor="custom-notes">Custom Notes</Label>
                  <Textarea
                    id="custom-notes"
                    value={invoiceData.customNotes}
                    onChange={(e) => handleFieldChange('customNotes', e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Invoice Preview */}
          <div className="flex-1 overflow-auto bg-gray-100 p-4">
            <InvoicePreview />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
