'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  CheckCircle, 
  Calendar, 
  Users, 
  Hotel, 
  CreditCard, 
  Phone, 
  Mail, 
  MapPin,
  Receipt,
  Printer,
  Download,
  Share,
  Copy,
  User,
  IndianRupee
} from 'lucide-react';
import { toast } from 'sonner';
import { BookingData, Room, Customer } from '@/lib/types/booking';

const paymentMethodLabels = {
  cash: 'Cash',
  card: 'Card Payment',
  upi: 'UPI Payment',
  bank_transfer: 'Bank Transfer'
};

const idTypeLabels = {
  aadhaar: 'Aadhaar Card',
  pan: 'PAN Card',
  passport: 'Passport',
  driving_license: 'Driving License',
  voter_id: 'Voter ID'
};

const roomTypeLabels = {
  'ac-2bed': 'AC 2-Bed Room',
  'non-ac-2bed': 'Non-AC 2-Bed Room',
  'ac-3bed': 'AC 3-Bed Room',
  'non-ac-3bed': 'Non-AC 3-Bed Room',
  'vip-ac': 'VIP AC Suite',
  'vip-non-ac': 'VIP Non-AC Suite'
};

export function BookingConfirmation({ data }: BookingConfirmationProps) {
  const [printing, setPrinting] = useState(false);

  const totalAmount = data.totalAmount || 0;
  const paidAmount = data.paymentAmount || 0;
  const dueAmount = totalAmount - paidAmount;
  const paymentStatus = paidAmount === totalAmount ? 'paid' : paidAmount > 0 ? 'partial' : 'pending';

  const handlePrint = () => {
    setPrinting(true);
    window.print();
    setTimeout(() => setPrinting(false), 1000);
  };

  const handleCopyDetails = () => {
    const details = `
Booking Confirmation
====================
Room: ${data.room?.room_number} (${roomTypeLabels[data.room?.room_type as keyof typeof roomTypeLabels]})
Guest: ${data.primaryGuest?.name}
Check-in: ${data.checkInDate ? new Date(data.checkInDate).toLocaleDateString() : 'N/A'}
Check-out: ${data.checkOutDate ? new Date(data.checkOutDate).toLocaleDateString() : 'N/A'}
Total Amount: ₹${totalAmount.toLocaleString('en-IN')}
Payment Status: ${paymentStatus.toUpperCase()}
    `.trim();

    navigator.clipboard.writeText(details).then(() => {
      toast.success('Booking details copied to clipboard');
    });
  };

  if (!data.room || !data.primaryGuest) {
    return (
      <div className="text-center py-8 text-gray-600">
        <p className="text-lg font-medium">Incomplete booking information</p>
        <p>Please complete all previous steps to view confirmation</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Success Header */}
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-6 text-center">
          <CheckCircle className="w-16 h-16 mx-auto text-green-600 mb-4" />
          <h2 className="text-2xl font-bold text-green-800 mb-2">Booking Ready for Confirmation</h2>
          <p className="text-green-700">
            All details have been verified and the booking is ready to be created.
          </p>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-2 justify-center">
            <Button onClick={handlePrint} disabled={printing}>
                                <Printer className="w-4 h-4 mr-2" />
              {printing ? 'Printing...' : 'Print Receipt'}
            </Button>
            <Button variant="outline" onClick={handleCopyDetails}>
              <Copy className="w-4 h-4 mr-2" />
              Copy Details
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Booking Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Room & Stay Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Hotel className="w-5 h-5" />
              Room & Stay Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold">Room {data.room.room_number}</h3>
                <Badge variant="outline">
                  {roomTypeLabels[data.room.room_type as keyof typeof roomTypeLabels]}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-600">Rate per night:</span>
                  <p className="font-medium">₹{data.roomRate?.toLocaleString('en-IN')}</p>
                </div>
                <div>
                  <span className="text-gray-600">Max occupancy:</span>
                  <p className="font-medium">{data.room.max_occupancy} guests</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="font-medium">Check-in: {data.checkInDate ? new Date(data.checkInDate).toLocaleDateString('en-IN', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  }) : 'N/A'}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="font-medium">Check-out: {data.checkOutDate ? new Date(data.checkOutDate).toLocaleDateString('en-IN', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  }) : 'N/A'}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="font-medium">
                    {data.totalNights} night{data.totalNights !== 1 ? 's' : ''} • {data.totalGuests} guest{data.totalGuests !== 1 ? 's' : ''}
                  </p>
                  {data.adults && data.children !== undefined && (
                    <p className="text-sm text-gray-600">
                      {data.adults} adult{data.adults !== 1 ? 's' : ''} {data.children > 0 && `, ${data.children} child${data.children !== 1 ? 'ren' : ''}`}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {data.specialRequests && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-700 mb-1">Special Requests:</p>
                <p className="text-sm text-gray-600">{data.specialRequests}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Guest Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Guest Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Primary Guest */}
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <User className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-lg">Primary Guest</h3>
              </div>
              <div className="space-y-2">
                <p className="font-medium text-lg">{data.primaryGuest.name}</p>
                <div className="grid grid-cols-1 gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-500" />
                    <span>{data.primaryGuest.phone}</span>
                  </div>
                  {data.primaryGuest.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-500" />
                      <span>{data.primaryGuest.email}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-gray-500" />
                    <span>{idTypeLabels[data.primaryGuest.id_type]} - {data.primaryGuest.id_number}</span>
                  </div>
                  {data.primaryGuest.city && data.primaryGuest.state && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-500" />
                      <span>{data.primaryGuest.city}, {data.primaryGuest.state}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Additional Guests */}
            {data.additionalGuests && data.additionalGuests.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Additional Guests ({data.additionalGuests.length})</h4>
                <div className="space-y-2">
                  {data.additionalGuests.map((guest, index) => (
                    <div key={guest.id} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium">{guest.name}</p>
                        <Badge variant="secondary" className="text-xs">Guest {index + 2}</Badge>
                      </div>
                      <div className="grid grid-cols-1 gap-1 text-sm text-gray-600">
                        <span>{guest.phone}</span>
                        <span>{idTypeLabels[guest.id_type]} - {guest.id_number}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Payment & Billing */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5" />
            Payment & Billing Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Billing Breakdown */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Billing Breakdown</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Room charges ({data.totalNights} nights × ₹{data.roomRate?.toLocaleString('en-IN')})</span>
                  <span>₹{((data.roomRate || 0) * (data.totalNights || 0)).toLocaleString('en-IN')}</span>
                </div>
                
                {data.isGstInclusive ? (
                  <>
                    <div className="flex justify-between text-gray-600">
                      <span>Base amount (excluding GST)</span>
                      <span>₹{data.baseAmount?.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>GST (12%) - included</span>
                      <span>₹{data.gstAmount?.toLocaleString('en-IN')}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between">
                      <span>Base amount</span>
                      <span>₹{data.baseAmount?.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>GST (12%)</span>
                      <span>₹{data.gstAmount?.toLocaleString('en-IN')}</span>
                    </div>
                  </>
                )}

                <Separator />
                <div className="flex justify-between font-medium text-lg">
                  <span>Total Amount</span>
                  <span className="text-green-600">₹{totalAmount.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            {/* Payment Details */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Payment Details</h4>
              <div className="space-y-3">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Payment Method:</span>
                      <span className="font-medium">
                        {data.paymentMethod ? paymentMethodLabels[data.paymentMethod] : 'Not selected'}
                      </span>
                    </div>
                    
                    {data.referenceNumber && (
                      <div className="flex justify-between">
                        <span>Reference:</span>
                        <span className="font-mono text-xs">{data.referenceNumber}</span>
                      </div>
                    )}
                    
                    <div className="flex justify-between">
                      <span>Amount Paid:</span>
                      <span className="font-medium text-green-600">₹{paidAmount.toLocaleString('en-IN')}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span>Amount Due:</span>
                      <span className={`font-medium ${dueAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        ₹{dueAmount.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-center">
                  <Badge 
                    variant={paymentStatus === 'paid' ? 'default' : paymentStatus === 'partial' ? 'secondary' : 'outline'}
                    className={`px-4 py-2 ${
                      paymentStatus === 'paid' ? 'bg-green-600' :
                      paymentStatus === 'partial' ? 'bg-blue-600' : 'bg-gray-600'
                    }`}
                  >
                    {paymentStatus === 'paid' ? '✓ Fully Paid' :
                     paymentStatus === 'partial' ? '◐ Partially Paid' : '○ Pending Payment'}
                  </Badge>
                </div>

                {data.paymentNotes && (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm font-medium text-blue-700 mb-1">Payment Notes:</p>
                    <p className="text-sm text-blue-600">{data.paymentNotes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Important Notes */}
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="p-4">
          <h4 className="font-medium text-amber-800 mb-2">Important Notes:</h4>
          <ul className="text-sm text-amber-700 space-y-1">
            <li>• Please arrive at the hotel by 2:00 PM on your check-in date</li>
            <li>• Check-out time is 11:00 AM</li>
            <li>• Valid ID proof is required for all guests during check-in</li>
            {dueAmount > 0 && (
              <li>• Remaining amount of ₹{dueAmount.toLocaleString('en-IN')} can be paid during check-in</li>
            )}
            <li>• Cancellation policy applies as per hotel terms and conditions</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
} 