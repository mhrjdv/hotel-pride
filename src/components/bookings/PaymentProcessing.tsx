'use client';

import { useState, useEffect, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { IndianRupee, AlertCircle } from '@/components/icons';
import { calculateBookingAmount, formatBookingCalculation } from '@/lib/utils/gst';
import { toast } from 'sonner';
import { BookingData } from '@/lib/types/booking';

interface PaymentProcessingProps {
  data: BookingData;
  onDataChange: (data: Partial<BookingData>) => void;
}

type PaymentMethod = NonNullable<BookingData['paymentMethod']>;

const paymentMethods: { value: PaymentMethod; label: string; requiresReference: boolean }[] = [
  { value: 'cash', label: 'Cash', requiresReference: false },
  { value: 'card', label: 'Card (Credit/Debit)', requiresReference: true },
  { value: 'upi', label: 'UPI', requiresReference: true },
  { value: 'bank_transfer', label: 'Bank Transfer', requiresReference: true },
];

const gstModeLabels = {
  inclusive: 'GST Inclusive',
  exclusive: 'GST Exclusive',
  none: 'No GST',
};

export function PaymentProcessing({ data, onDataChange }: PaymentProcessingProps) {
  const [amountInput, setAmountInput] = useState<string>('');

  // Calculate pricing breakdown using the GST system.
  const pricingCalculation = useMemo(() => {
    return data.room && data.totalNights
      ? calculateBookingAmount({
          baseRoomRate: data.room.current_rate,
          customRoomRate: data.useCustomRate ? data.customRoomRate : undefined,
          nights: data.totalNights,
          extraBeds: data.extraBeds,
          additionalCharges: data.additionalCharges,
          gstMode: data.gstMode || 'inclusive',
        })
      : null;
  }, [data.room, data.totalNights, data.useCustomRate, data.customRoomRate, data.extraBeds, data.additionalCharges, data.gstMode]);

  const formattedPricing = pricingCalculation ? formatBookingCalculation(pricingCalculation) : null;
  const totalAmount = pricingCalculation?.totalAmount || data.totalAmount || 0;
  const paidAmount = data.paymentAmount || 0;
  const dueAmount = totalAmount - paidAmount;

  useEffect(() => {
    if (pricingCalculation) {
      onDataChange({
        baseAmount: pricingCalculation.baseAmount,
        gstAmount: pricingCalculation.gstAmount,
        totalAmount: pricingCalculation.totalAmount,
      });
    }
  }, [onDataChange, pricingCalculation]);

  // Default the payment amount to the full total once pricing is known.
  useEffect(() => {
    if (!data.paymentAmount && pricingCalculation) {
      onDataChange({ paymentAmount: pricingCalculation.totalAmount });
      setAmountInput(pricingCalculation.totalAmount.toString());
    }
  }, [data.paymentAmount, onDataChange, pricingCalculation]);

  // Keep the input in sync when the amount is set elsewhere (e.g. quick helpers).
  useEffect(() => {
    setAmountInput((prev) => {
      const prevNum = parseFloat(prev);
      return prevNum === (data.paymentAmount ?? 0) ? prev : String(data.paymentAmount ?? 0);
    });
  }, [data.paymentAmount]);

  const handlePaymentMethodChange = (method: PaymentMethod) => {
    onDataChange({ paymentMethod: method, referenceNumber: '' });
  };

  const handleAmountChange = (value: string) => {
    setAmountInput(value);
    const amount = parseFloat(value) || 0;
    if (amount > totalAmount) {
      toast.error('Payment amount cannot exceed total booking amount');
      return;
    }
    onDataChange({ paymentAmount: amount });
  };

  const setQuickAmount = (amount: number) => {
    setAmountInput(amount.toString());
    onDataChange({ paymentAmount: amount });
  };

  const selectedMethod = paymentMethods.find((m) => m.value === data.paymentMethod);
  const paymentStatus = paidAmount === totalAmount && totalAmount > 0 ? 'paid' : paidAmount > 0 ? 'partial' : 'pending';
  const advanceAmount = Math.round(totalAmount * 0.3);

  if (!data.room || !pricingCalculation) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        <AlertCircle className="mx-auto mb-3 h-10 w-10 text-muted-foreground" aria-hidden="true" />
        <p className="text-sm font-medium text-foreground">No room selected</p>
        <p className="text-sm">Go back and select a room to process payment.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Booking summary — one concise block */}
      <section className="rounded-lg border bg-card p-4">
        <h2 className="mb-3 text-sm font-semibold text-foreground">Booking Summary</h2>
        <dl className="space-y-1.5 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Room charges ({data.totalNights} night{(data.totalNights || 0) !== 1 ? 's' : ''})</dt>
            <dd className="font-medium">{formattedPricing?.roomCharges}</dd>
          </div>
          {formattedPricing?.extraBedCharges && (
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Extra bed charges</dt>
              <dd className="font-medium">{formattedPricing.extraBedCharges}</dd>
            </div>
          )}
          {formattedPricing?.additionalCharges && (
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Additional charges</dt>
              <dd className="font-medium">{formattedPricing.additionalCharges}</dd>
            </div>
          )}
          {formattedPricing?.showGST && (
            <div className="flex justify-between">
              <dt className="text-muted-foreground">GST (12%)</dt>
              <dd className="font-medium">{formattedPricing.gstAmount}</dd>
            </div>
          )}
          <div className="flex justify-between border-t pt-1.5 text-base font-semibold">
            <dt>Total</dt>
            <dd>{formattedPricing?.grandTotal}</dd>
          </div>
        </dl>
        <p className="mt-2 text-xs text-muted-foreground">
          {gstModeLabels[data.gstMode || 'inclusive']}
        </p>
      </section>

      {/* Payment entry */}
      <section className="rounded-lg border bg-card p-4 space-y-4">
        <h2 className="text-sm font-semibold text-foreground">Payment</h2>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {/* Payment method dropdown */}
          <div className="space-y-1.5">
            <Label htmlFor="payment-method" className="text-xs">Payment Method</Label>
            <Select
              value={data.paymentMethod || ''}
              onValueChange={(v) => handlePaymentMethodChange(v as PaymentMethod)}
            >
              <SelectTrigger id="payment-method" className="w-full">
                <SelectValue placeholder="Select method" />
              </SelectTrigger>
              <SelectContent>
                {paymentMethods.map((m) => (
                  <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Amount input with quick helpers */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="payment-amount" className="text-xs">Amount Paid</Label>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setQuickAmount(totalAmount)}
                  className="rounded border px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground transition-colors hover:bg-muted"
                >
                  Full
                </button>
                <button
                  type="button"
                  onClick={() => setQuickAmount(advanceAmount)}
                  className="rounded border px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground transition-colors hover:bg-muted"
                >
                  Advance 30%
                </button>
              </div>
            </div>
            <div className="relative">
              <IndianRupee className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input
                id="payment-amount"
                type="number"
                min={0}
                max={totalAmount}
                step="1"
                value={amountInput}
                onChange={(e) => handleAmountChange(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
        </div>

        {/* Reference number (only when required) */}
        {selectedMethod?.requiresReference && (
          <div className="space-y-1.5">
            <Label htmlFor="referenceNumber" className="text-xs">
              Transaction Reference <span className="text-muted-foreground">(required for {selectedMethod.label})</span>
            </Label>
            <Input
              id="referenceNumber"
              placeholder="Enter reference number"
              value={data.referenceNumber || ''}
              onChange={(e) => onDataChange({ referenceNumber: e.target.value })}
              required
            />
          </div>
        )}

        {/* Compact paid/balance line */}
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-muted/50 px-3 py-2 text-sm">
          <span className="text-muted-foreground">
            Paid <span className="font-medium text-foreground">₹{paidAmount.toLocaleString('en-IN')}</span>
            <span className="mx-1.5">·</span>
            Balance{' '}
            <span className={`font-medium ${dueAmount > 0 ? 'text-orange-600' : 'text-foreground'}`}>
              ₹{dueAmount.toLocaleString('en-IN')}
            </span>
          </span>
          <Badge
            variant={paymentStatus === 'paid' ? 'default' : paymentStatus === 'partial' ? 'secondary' : 'outline'}
          >
            {paymentStatus === 'paid' ? 'Fully Paid' : paymentStatus === 'partial' ? 'Partially Paid' : 'Pending'}
          </Badge>
        </div>

        {/* Payment notes */}
        <div className="space-y-1.5">
          <Label htmlFor="paymentNotes" className="text-xs">Payment Notes (optional)</Label>
          <Textarea
            id="paymentNotes"
            placeholder="Add any notes about the payment"
            value={data.paymentNotes || ''}
            onChange={(e) => onDataChange({ paymentNotes: e.target.value })}
            rows={2}
          />
        </div>

        {/* Reference validation hint */}
        {data.paymentMethod && selectedMethod?.requiresReference && !data.referenceNumber && (
          <p className="flex items-center gap-1.5 text-xs font-medium text-amber-600">
            <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
            Reference number is required for {selectedMethod.label} payments.
          </p>
        )}
      </section>
    </div>
  );
}
