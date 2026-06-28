'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Calendar,
  Users,
  Hotel,
  Receipt,
  Printer,
  Copy,
  User,
} from '@/components/icons';
import { toast } from 'sonner';
import { BookingData } from '@/lib/types/booking';
import { InvoiceGenerator } from './InvoiceGenerator';

interface BookingConfirmationProps {
  data: BookingData;
}

const paymentMethodLabels = {
  cash: 'Cash',
  card: 'Card Payment',
  upi: 'UPI Payment',
  bank_transfer: 'Bank Transfer',
};

const idTypeLabels = {
  aadhaar: 'Aadhaar Card',
  pan: 'PAN Card',
  passport: 'Passport',
  driving_license: 'Driving License',
  voter_id: 'Voter ID',
};

const roomTypeLabels = {
  'double-bed-deluxe': 'Double Bed Deluxe',
  'executive-3bed': 'Executive 3-Bed',
  'vip': 'VIP Suite',
};

const formatDate = (value?: string) =>
  value ? new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A';

export function BookingConfirmation({ data }: BookingConfirmationProps) {
  const [showInvoiceGenerator, setShowInvoiceGenerator] = useState(false);

  const totalAmount = data.totalAmount || 0;
  const paidAmount = data.paymentAmount || 0;
  const dueAmount = totalAmount - paidAmount;
  const paymentStatus = paidAmount === totalAmount && totalAmount > 0 ? 'paid' : paidAmount > 0 ? 'partial' : 'pending';

  const handleCopyDetails = () => {
    const details = `
Booking Review
==============
Room: ${data.room?.room_number} (${roomTypeLabels[data.room?.room_type as keyof typeof roomTypeLabels]})
Guest: ${data.primaryGuest?.name ?? data.primaryGuestName ?? 'N/A'}
Check-in: ${formatDate(data.checkInDate)}
Check-out: ${formatDate(data.checkOutDate)}
Total Amount: ₹${totalAmount.toLocaleString('en-IN')}
Payment Status: ${paymentStatus.toUpperCase()}
    `.trim();

    navigator.clipboard.writeText(details).then(() => {
      toast.success('Booking details copied to clipboard');
    });
  };

  if (!data.room || (!data.primaryGuest && !data.primaryGuestName)) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        <p className="text-sm font-medium text-foreground">Incomplete booking information</p>
        <p className="text-sm">Please complete the previous steps to review this booking.</p>
      </div>
    );
  }

  const guestName = data.primaryGuest?.name ?? data.primaryGuestName;

  return (
    <div className="space-y-4">
      {/* Review intro — no premature success state */}
      <div>
        <h2 className="text-base font-semibold text-foreground">Review &amp; confirm</h2>
        <p className="text-sm text-muted-foreground">
          Check the details below, then select <span className="font-medium text-foreground">Create Booking</span> to confirm.
        </p>
      </div>

      {/* Room & stay */}
      <section className="rounded-lg border bg-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Hotel className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            Room &amp; Stay
          </h3>
          <Badge variant="outline">{roomTypeLabels[data.room.room_type as keyof typeof roomTypeLabels]}</Badge>
        </div>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-4">
          <div>
            <dt className="text-xs text-muted-foreground">Room</dt>
            <dd className="font-medium">{data.room.room_number}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Rate / night</dt>
            <dd className="font-medium">₹{data.rate?.toLocaleString('en-IN')}</dd>
          </div>
          <div className="flex items-start gap-1.5">
            <Calendar className="mt-0.5 h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
            <div>
              <dt className="text-xs text-muted-foreground">Check-in</dt>
              <dd className="font-medium">{formatDate(data.checkInDate)}</dd>
            </div>
          </div>
          <div className="flex items-start gap-1.5">
            <Calendar className="mt-0.5 h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
            <div>
              <dt className="text-xs text-muted-foreground">Check-out</dt>
              <dd className="font-medium">{formatDate(data.checkOutDate)}</dd>
            </div>
          </div>
        </dl>
        <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Users className="h-3.5 w-3.5" aria-hidden="true" />
          {data.totalNights} night{data.totalNights !== 1 ? 's' : ''} · {data.totalGuests} guest{data.totalGuests !== 1 ? 's' : ''}
          {data.adults && data.children !== undefined ? (
            <span>
              ({data.adults} adult{data.adults !== 1 ? 's' : ''}
              {data.children > 0 ? `, ${data.children} child${data.children !== 1 ? 'ren' : ''}` : ''})
            </span>
          ) : null}
        </p>
        {data.specialRequests && (
          <p className="text-sm">
            <span className="text-muted-foreground">Special requests: </span>
            {data.specialRequests}
          </p>
        )}
      </section>

      {/* Guest */}
      <section className="rounded-lg border bg-card p-4 space-y-2">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <User className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          Primary Guest
        </h3>
        <p className="text-sm font-medium text-foreground">{guestName}</p>
        {data.primaryGuest && (
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span>{data.primaryGuest.phone}</span>
            {data.primaryGuest.email && <span>{data.primaryGuest.email}</span>}
            <span>{idTypeLabels[data.primaryGuest.id_type]} · {data.primaryGuest.id_number}</span>
            {data.primaryGuest.city && data.primaryGuest.state && (
              <span>{data.primaryGuest.city}, {data.primaryGuest.state}</span>
            )}
          </div>
        )}
        {data.additionalGuests && data.additionalGuests.length > 0 && (
          <p className="text-sm text-muted-foreground">
            + {data.additionalGuests.length} additional guest{data.additionalGuests.length > 1 ? 's' : ''}
          </p>
        )}
      </section>

      {/* Payment */}
      <section className="rounded-lg border bg-card p-4 space-y-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Receipt className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          Payment
        </h3>
        <dl className="space-y-1.5 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Total</dt>
            <dd className="font-medium">₹{totalAmount.toLocaleString('en-IN')}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Paid</dt>
            <dd className="font-medium">₹{paidAmount.toLocaleString('en-IN')}</dd>
          </div>
          <div className="flex justify-between border-t pt-1.5">
            <dt className="text-muted-foreground">Balance due</dt>
            <dd className={`font-medium ${dueAmount > 0 ? 'text-orange-600' : 'text-foreground'}`}>
              ₹{dueAmount.toLocaleString('en-IN')}
            </dd>
          </div>
          {typeof data.gstAmount === 'number' && (
            <div className="flex justify-between text-xs text-muted-foreground">
              <dt>GST (12%)</dt>
              <dd>₹{data.gstAmount.toLocaleString('en-IN')}</dd>
            </div>
          )}
        </dl>
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <span className="text-muted-foreground">
            {data.paymentMethod ? paymentMethodLabels[data.paymentMethod] : 'Method not selected'}
            {data.referenceNumber ? <span className="ml-1.5 font-mono text-xs">({data.referenceNumber})</span> : null}
          </span>
          <Badge variant={paymentStatus === 'paid' ? 'default' : paymentStatus === 'partial' ? 'secondary' : 'outline'}>
            {paymentStatus === 'paid' ? 'Fully Paid' : paymentStatus === 'partial' ? 'Partially Paid' : 'Pending'}
          </Badge>
        </div>
        {data.paymentNotes && (
          <p className="text-sm">
            <span className="text-muted-foreground">Notes: </span>
            {data.paymentNotes}
          </p>
        )}
      </section>

      {/* Secondary actions */}
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={() => window.print()}>
          <Printer className="mr-1.5 h-4 w-4" aria-hidden="true" />
          Print
        </Button>
        <Button variant="outline" size="sm" onClick={handleCopyDetails}>
          <Copy className="mr-1.5 h-4 w-4" aria-hidden="true" />
          Copy Details
        </Button>
        <Button variant="outline" size="sm" onClick={() => setShowInvoiceGenerator(true)}>
          <Receipt className="mr-1.5 h-4 w-4" aria-hidden="true" />
          Generate Invoice
        </Button>
      </div>

      {/* Invoice Generator */}
      {data.room && data.primaryGuest && (
        <InvoiceGenerator
          booking={{
            booking_number: 'TMP-' + Date.now(),
            check_in_date: data.checkInDate || '',
            check_out_date: data.checkOutDate || '',
            check_in_time: data.checkInTime || '14:00',
            check_out_time: data.checkOutTime || '12:00',
            total_nights: data.totalNights || 0,
            total_guests: data.totalGuests || 1,
            room_rate: data.rate || 0,
            base_amount: data.baseAmount || 0,
            gst_amount: data.gstAmount || 0,
            total_amount: data.totalAmount || 0,
            paid_amount: data.paymentAmount || 0,
            due_amount: (data.totalAmount || 0) - (data.paymentAmount || 0),
            gst_mode: data.gstMode || 'inclusive',
            payment_status:
              data.paymentAmount === data.totalAmount
                ? 'paid'
                : data.paymentAmount && data.paymentAmount > 0
                  ? 'partial'
                  : 'pending',
            extra_bed_count: data.extraBeds?.quantity || 0,
            extra_bed_rate: data.extraBeds?.ratePerBed || 0,
            extra_bed_total: (data.extraBeds?.quantity || 0) * (data.extraBeds?.ratePerBed || 0) * (data.totalNights || 0),
            additional_charges: data.additionalCharges ? JSON.stringify(data.additionalCharges) : null,
            ac_preference: data.acPreference ?? true,
          }}
          customer={data.primaryGuest}
          room={data.room}
          isOpen={showInvoiceGenerator}
          onOpenChange={setShowInvoiceGenerator}
        />
      )}
    </div>
  );
}
