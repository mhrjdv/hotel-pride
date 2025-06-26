'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { 
  CreditCard, 
  Banknote, 
  Smartphone, 
  Building, 
  Calculator,
  IndianRupee,
  Receipt,
  AlertCircle,
  CheckCircle,
  Info
} from 'lucide-react';
import { calculateBookingAmount, formatBookingCalculation, GSTMode } from '@/lib/utils/gst';
import { toast } from 'sonner';
import { BookingData } from '@/lib/types/booking';

interface PaymentProcessingProps {
  data: BookingData;
  onDataChange: (data: Partial<BookingData>) => void;
}

const paymentMethods = [
  { 
    value: 'cash', 
    label: 'Cash', 
    icon: Banknote, 
    description: 'Payment in cash',
    requiresReference: false
  },
  { 
    value: 'card', 
    label: 'Card (Credit/Debit)', 
    icon: CreditCard, 
    description: 'Credit or debit card payment',
    requiresReference: true
  },
  { 
    value: 'upi', 
    label: 'UPI', 
    icon: Smartphone, 
    description: 'UPI payment (PhonePe, Paytm, GPay, etc.)',
    requiresReference: true
  },
  { 
    value: 'bank_transfer', 
    label: 'Bank Transfer', 
    icon: Building, 
    description: 'Direct bank transfer/NEFT/RTGS',
    requiresReference: true
  }
];

const gstModeLabels = {
  'inclusive': 'GST Inclusive',
  'exclusive': 'GST Exclusive', 
  'none': 'No GST'
};

export function PaymentProcessing({ data, onDataChange }: PaymentProcessingProps) {
  const [paymentType, setPaymentType] = useState<'full' | 'partial' | 'advance'>('full');
  const [customAmount, setCustomAmount] = useState<string>('');

  // Calculate pricing breakdown using new system
  const pricingCalculation = data.room && data.totalNights ? calculateBookingAmount({
    baseRoomRate: data.room.current_rate,
    customRoomRate: data.useCustomRate ? data.customRoomRate : undefined,
    nights: data.totalNights,
    extraBeds: data.extraBeds,
    additionalCharges: data.additionalCharges,
    gstMode: data.gstMode || 'inclusive'
  }) : null;

  const formattedPricing = pricingCalculation ? formatBookingCalculation(pricingCalculation) : null;
  const totalAmount = pricingCalculation?.totalAmount || data.totalAmount || 0;
  const dueAmount = totalAmount - (data.paymentAmount || 0);

  useEffect(() => {
    if (pricingCalculation) {
      onDataChange({
        baseAmount: pricingCalculation.baseAmount,
        gstAmount: pricingCalculation.gstAmount,
        totalAmount: pricingCalculation.totalAmount
      });
    }
  }, [pricingCalculation?.baseAmount, pricingCalculation?.gstAmount, pricingCalculation?.totalAmount]);

  useEffect(() => {
    if (!data.paymentAmount && pricingCalculation) {
      onDataChange({ paymentAmount: pricingCalculation.totalAmount });
      setPaymentType('full');
      setCustomAmount(pricingCalculation.totalAmount.toString());
    }
  }, [pricingCalculation?.totalAmount]);

  const handlePaymentMethodChange = (method: 'cash' | 'card' | 'upi' | 'bank_transfer') => {
    onDataChange({ 
      paymentMethod: method,
      referenceNumber: '',
      paymentAmount: paymentType === 'full' ? totalAmount : data.paymentAmount
    });
  };

  const handlePaymentTypeChange = (type: 'full' | 'partial' | 'advance') => {
    setPaymentType(type);
    
    if (type === 'full') {
      onDataChange({ paymentAmount: totalAmount });
      setCustomAmount(totalAmount.toString());
    } else if (type === 'advance') {
      const advanceAmount = Math.round(totalAmount * 0.3); // 30% advance
      onDataChange({ paymentAmount: advanceAmount });
      setCustomAmount(advanceAmount.toString());
    } else {
      onDataChange({ paymentAmount: 0 });
      setCustomAmount('0');
    }
  };

  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value);
    const amount = parseFloat(value) || 0;
    
    if (amount > totalAmount) {
      toast.error('Payment amount cannot exceed total booking amount');
      return;
    }
    
    onDataChange({ paymentAmount: amount });
  };

  const selectedMethod = paymentMethods.find(m => m.value === data.paymentMethod);
  const paymentStatus = data.paymentAmount === totalAmount ? 'paid' : 
                       data.paymentAmount && data.paymentAmount > 0 ? 'partial' : 'pending';

  if (!data.room || !pricingCalculation) {
    return (
      <div className="text-center py-8 text-gray-600">
        <AlertCircle className="w-12 h-12 mx-auto text-gray-400 mb-4" />
        <p className="text-lg font-medium">No room selected</p>
        <p>Please go back and select a room to proceed with payment</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Booking Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5" />
            Booking Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Room & Stay Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Room Details</h4>
                <div className="space-y-1 text-sm">
                  <p><span className="text-gray-600">Room:</span> {data.room.room_number}</p>
                  <p><span className="text-gray-600">Type:</span> {data.room.room_type.replace('-', ' ')}</p>
                  <p><span className="text-gray-600">Rate:</span> {data.useCustomRate && data.customRoomRate ? 
                    `₹${data.customRoomRate.toLocaleString('en-IN')} (Custom)` : 
                    `₹${data.room.current_rate.toLocaleString('en-IN')}`}/night</p>
                  {data.useCustomRate && (
                    <p className="text-xs text-blue-600">
                      Original rate: ₹{data.room.current_rate.toLocaleString('en-IN')}/night
                    </p>
                  )}
                </div>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Stay Details</h4>
                <div className="space-y-1 text-sm">
                  <p><span className="text-gray-600">Check-in:</span> {data.checkInDate ? new Date(data.checkInDate).toLocaleDateString() : 'N/A'}</p>
                  <p><span className="text-gray-600">Check-out:</span> {data.checkOutDate ? new Date(data.checkOutDate).toLocaleDateString() : 'N/A'}</p>
                  <p><span className="text-gray-600">Nights:</span> {data.totalNights}</p>
                  {data.extraBeds && data.extraBeds.quantity > 0 && (
                    <p><span className="text-gray-600">Extra beds:</span> {data.extraBeds.quantity} × ₹{data.extraBeds.ratePerBed.toLocaleString('en-IN')}/night</p>
                  )}
                </div>
              </div>
            </div>

            {/* Guest Information */}
            {data.primaryGuest && (
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Primary Guest</h4>
                <div className="text-sm text-blue-800">
                  <p><strong>{data.primaryGuest.name}</strong></p>
                  <p>{data.primaryGuest.phone} • {data.primaryGuest.email}</p>
                  {data.additionalGuests && data.additionalGuests.length > 0 && (
                    <p className="mt-1">+ {data.additionalGuests.length} additional guest{data.additionalGuests.length > 1 ? 's' : ''}</p>
                  )}
                </div>
              </div>
            )}

            <Separator />

            {/* Detailed Pricing Breakdown */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Pricing Breakdown</h4>
              <div className="space-y-2 text-sm bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between">
                  <span>Room charges ({data.totalNights} nights)</span>
                  <span>{formattedPricing?.roomCharges}</span>
                </div>
                
                {formattedPricing?.extraBedCharges && (
                  <div className="flex justify-between">
                    <span>Extra bed charges</span>
                    <span>{formattedPricing.extraBedCharges}</span>
                  </div>
                )}
                
                {formattedPricing?.additionalCharges && (
                  <div className="flex justify-between">
                    <span>Additional charges</span>
                    <span>{formattedPricing.additionalCharges}</span>
                  </div>
                )}
                
                <div className="flex justify-between font-medium border-t pt-2">
                  <span>Subtotal</span>
                  <span>{formattedPricing?.subtotal}</span>
                </div>
                
                {formattedPricing?.showGST && (
                  <div className="flex justify-between">
                    <span>GST (12%)</span>
                    <span>{formattedPricing.gstAmount}</span>
                  </div>
                )}
                
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Total Amount</span>
                  <span className="text-green-600">{formattedPricing?.grandTotal}</span>
                </div>
                
                <div className="text-xs text-gray-500 border-t pt-2">
                  Tax Mode: {gstModeLabels[data.gstMode || 'inclusive']}
                  {!formattedPricing?.showGST && (
                    <span className="ml-2 text-amber-600 font-medium">• No GST Applied</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Method Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Payment Method
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {paymentMethods.map((method) => {
              const IconComponent = method.icon;
              const isSelected = data.paymentMethod === method.value;
              
              return (
                <Card
                  key={method.value}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                  }`}
                  onClick={() => handlePaymentMethodChange(method.value as any)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <IconComponent className={`w-6 h-6 ${isSelected ? 'text-blue-600' : 'text-gray-600'}`} />
                      <div className="flex-1">
                        <h4 className={`font-medium ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                          {method.label}
                        </h4>
                        <p className={`text-sm ${isSelected ? 'text-blue-700' : 'text-gray-600'}`}>
                          {method.description}
                        </p>
                      </div>
                      {isSelected && (
                        <CheckCircle className="w-5 h-5 text-blue-600" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Reference Number (if required) */}
          {selectedMethod?.requiresReference && (
            <div className="mt-4">
              <Label htmlFor="referenceNumber">
                Transaction Reference Number *
                <span className="text-sm text-gray-500 ml-1">(Required for {selectedMethod.label})</span>
              </Label>
              <Input
                id="referenceNumber"
                placeholder="Enter transaction reference number"
                value={data.referenceNumber || ''}
                onChange={(e) => onDataChange({ referenceNumber: e.target.value })}
                className="mt-1"
                required
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Amount */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            Payment Amount
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Payment Type Selection */}
          <div>
            <Label className="text-base font-medium">Payment Type</Label>
            <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                { value: 'full', label: 'Full Payment', description: `Pay complete amount (₹${totalAmount.toLocaleString('en-IN')})` },
                { value: 'advance', label: 'Advance Payment', description: `Pay 30% advance (₹${Math.round(totalAmount * 0.3).toLocaleString('en-IN')})` },
                { value: 'partial', label: 'Custom Amount', description: 'Enter custom payment amount' }
              ].map((type) => (
                <Card
                  key={type.value}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    paymentType === type.value ? 'ring-2 ring-green-500 bg-green-50' : ''
                  }`}
                  onClick={() => handlePaymentTypeChange(type.value as any)}
                >
                  <CardContent className="p-3">
                    <div className="text-center">
                      <h4 className={`font-medium ${paymentType === type.value ? 'text-green-900' : 'text-gray-900'}`}>
                        {type.label}
                      </h4>
                      <p className={`text-xs mt-1 ${paymentType === type.value ? 'text-green-700' : 'text-gray-600'}`}>
                        {type.description}
                      </p>
                      {paymentType === type.value && (
                        <CheckCircle className="w-4 h-4 text-green-600 mx-auto mt-2" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Custom Amount Input */}
          {paymentType === 'partial' && (
            <div>
              <Label htmlFor="customAmount">Custom Payment Amount</Label>
              <div className="flex items-center gap-2 mt-1">
                <div className="relative flex-1">
                  <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <Input
                    id="customAmount"
                    type="number"
                    min="0"
                    max={totalAmount}
                    step="1"
                    placeholder="0"
                    value={customAmount}
                    onChange={(e) => handleCustomAmountChange(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setCustomAmount(totalAmount.toString());
                    onDataChange({ paymentAmount: totalAmount });
                  }}
                >
                  Max
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Maximum amount: ₹{totalAmount.toLocaleString('en-IN')}
              </p>
            </div>
          )}

          {/* Payment Summary */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Total booking amount:</span>
                <span className="font-medium">₹{totalAmount.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span>Payment amount:</span>
                <span className="font-medium text-green-600">₹{(data.paymentAmount || 0).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span>Due amount:</span>
                <span className={`font-medium ${dueAmount > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                  ₹{dueAmount.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
            
            {/* Payment Status Badge */}
            <div className="mt-3">
              <Badge 
                variant={paymentStatus === 'paid' ? 'default' : paymentStatus === 'partial' ? 'secondary' : 'outline'}
                className={
                  paymentStatus === 'paid' ? 'bg-green-600' : 
                  paymentStatus === 'partial' ? 'bg-orange-500' : 'bg-gray-500'
                }
              >
                {paymentStatus === 'paid' ? 'Fully Paid' : 
                 paymentStatus === 'partial' ? 'Partially Paid' : 'Payment Pending'}
              </Badge>
            </div>
          </div>

          {/* Payment Notes */}
          <div>
            <Label htmlFor="paymentNotes">Payment Notes (Optional)</Label>
            <Textarea
              id="paymentNotes"
              placeholder="Add any notes about the payment (optional)"
              value={data.paymentNotes || ''}
              onChange={(e) => onDataChange({ paymentNotes: e.target.value })}
              className="mt-1"
              rows={3}
            />
          </div>

          {/* Validation Messages */}
          {data.paymentMethod && selectedMethod?.requiresReference && !data.referenceNumber && (
            <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <p className="text-sm text-amber-800">
                Reference number is required for {selectedMethod.label} payments
              </p>
            </div>
          )}

          {dueAmount > 0 && paymentStatus !== 'pending' && (
            <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <Info className="w-4 h-4 text-blue-600" />
              <p className="text-sm text-blue-800">
                Remaining amount of ₹{dueAmount.toLocaleString('en-IN')} will be collected later
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 