'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { 
  Users,
  CreditCard,
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  Hotel,
  AlertTriangle,
  Loader2,
  X,
  Info,
  Save,
  Clock
} from 'lucide-react';
import { RoomSelection } from './RoomSelection';
import { GuestRegistration } from './GuestRegistration';
import { PaymentProcessing } from './PaymentProcessing';
import { BookingConfirmation } from './BookingConfirmation';
import { calculateBookingAmount } from '@/lib/utils/gst';
import { toast } from 'sonner';
import { BookingData, Booking } from '@/lib/types/booking';

interface BookingWizardProps {
  onComplete?: (booking: Booking) => void;
  onCancel?: () => void;
  initialData?: Partial<BookingData>;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const steps = [
  { id: 'room', title: 'Select Room', icon: Hotel, description: 'Choose room and dates' },
  { id: 'guests', title: 'Guest Details', icon: Users, description: 'Add guest information' },
  { id: 'payment', title: 'Payment', icon: CreditCard, description: 'Process payment' },
  { id: 'confirmation', title: 'Confirmation', icon: CheckCircle, description: 'Review and confirm' }
];

export function BookingWizard({ onComplete, onCancel, initialData, isOpen = true, onOpenChange }: BookingWizardProps) {
  const supabase = createClient();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [bookingData, setBookingData] = useState<BookingData>(initialData || {});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({});
  const [isDraftSaving, setIsDraftSaving] = useState(false);
  const [lastSavedDraft, setLastSavedDraft] = useState<Date | null>(null);
  const [hasDraft, setHasDraft] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setHasDraft(localStorage.getItem('booking_draft') !== null);
    }
  }, []);

  const saveDraft = useCallback(async () => {
    if (typeof window === 'undefined') return;
    setIsDraftSaving(true);
    try {
      localStorage.setItem('booking_draft', JSON.stringify({
        ...bookingData,
        timestamp: new Date().toISOString()
      }));
      setLastSavedDraft(new Date());
      setHasDraft(true);
    } catch (error) {
      console.error('Failed to save draft:', error);
    } finally {
      setIsDraftSaving(false);
    }
  }, [bookingData]);

  // Auto-save draft functionality
  useEffect(() => {
    const autoSave = setTimeout(() => {
      if (bookingData.room || bookingData.primaryGuest) {
        saveDraft();
      }
    }, 30000); // Auto-save every 30 seconds

    return () => clearTimeout(autoSave);
  }, [bookingData, saveDraft]);

  // Calculate pricing when relevant data changes
  useEffect(() => {
    if (bookingData.room && bookingData.totalNights) {
      try {
        const pricing = calculateBookingAmount({
          baseRoomRate: bookingData.room.current_rate,
          customRoomRate: bookingData.useCustomRate ? bookingData.customRoomRate : undefined,
          nights: bookingData.totalNights,
          extraBeds: bookingData.extraBeds,
          additionalCharges: bookingData.additionalCharges,
          gstMode: bookingData.gstMode || 'inclusive'
        });
        
        setBookingData(prev => ({
          ...prev,
          baseAmount: pricing.baseAmount,
          gstAmount: pricing.gstAmount,
          totalAmount: pricing.totalAmount
        }));
      } catch (error) {
        console.error('Error calculating pricing:', error);
        setError('Failed to calculate pricing. Please check the entered values.');
      }
    }
  }, [
    bookingData.room,
    bookingData.totalNights,
    bookingData.roomRate,
    bookingData.customRoomRate,
    bookingData.useCustomRate,
    bookingData.gstMode,
    bookingData.extraBeds,
    bookingData.additionalCharges
  ]);

  const loadDraft = () => {
    if (typeof window === 'undefined') return;
    try {
      const draft = localStorage.getItem('booking_draft');
      if (draft) {
        const parsedDraft = JSON.parse(draft);
        delete parsedDraft.timestamp;
        setBookingData(parsedDraft);
        toast.success('Draft loaded successfully');
      }
    } catch (error) {
      console.error('Failed to load draft:', error);
      toast.error('Failed to load draft.');
    }
  };

  const clearDraft = () => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('booking_draft');
    setLastSavedDraft(null);
    setHasDraft(false);
  };

  const currentStepId = steps[currentStep]?.id;
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;

  const validateCurrentStep = (): boolean => {
    const errors: string[] = [];
    
    switch (currentStepId) {
      case 'room':
        if (!bookingData.room) errors.push('Please select a room');
        if (!bookingData.checkInDate) errors.push('Please select check-in date');
        if (!bookingData.checkOutDate) errors.push('Please select check-out date');
        if (!bookingData.totalNights || bookingData.totalNights <= 0) errors.push('Invalid stay duration');
        if (bookingData.checkInDate && bookingData.checkOutDate) {
          const checkIn = new Date(bookingData.checkInDate);
          const checkOut = new Date(bookingData.checkOutDate);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          if (checkIn < today) errors.push('Check-in date cannot be in the past');
          if (checkOut <= checkIn) errors.push('Check-out date must be after check-in date');
        }
        break;
        
      case 'guests':
        if (!bookingData.primaryGuest) errors.push('Please select a primary guest');
        if (bookingData.totalGuests && bookingData.room) {
          const totalSelected = 1 + (bookingData.additionalGuests?.length || 0);
          if (totalSelected > bookingData.room.max_occupancy) {
            errors.push(`Too many guests selected (max: ${bookingData.room.max_occupancy})`);
          }
        }
        break;
        
      case 'payment':
        if (!bookingData.paymentMethod) errors.push('Please select a payment method');
        if (bookingData.paymentAmount === undefined || bookingData.paymentAmount < 0) {
          errors.push('Please enter a valid payment amount');
        }
        if (bookingData.paymentMethod && bookingData.paymentMethod !== 'cash') {
          if (!bookingData.referenceNumber || bookingData.referenceNumber.trim().length === 0) {
            errors.push('Please enter a transaction reference number');
          }
        }
        break;
        
      case 'confirmation':
        // Final validation - check all required fields
        if (!bookingData.room || !bookingData.primaryGuest || !bookingData.checkInDate || !bookingData.checkOutDate) {
          errors.push('Missing required booking information');
        }
        break;
    }

    const newValidationErrors = { ...validationErrors };
    if (errors.length > 0) {
      newValidationErrors[currentStepId] = errors;
    } else {
      delete newValidationErrors[currentStepId];
    }
    setValidationErrors(newValidationErrors);
    
    return errors.length === 0;
  };

  const handleNext = async () => {
    setError(null);
    
    if (!validateCurrentStep()) {
      return;
    }

    if (isLastStep) {
      await handleBookingSubmit();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setError(null);
    if (isFirstStep) {
      handleCancel();
    } else {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleCancel = () => {
    if (typeof window !== 'undefined' && (bookingData.room || bookingData.primaryGuest)) {
      if (window.confirm('Are you sure you want to cancel? All unsaved changes will be lost.')) {
        clearDraft();
        onCancel?.();
        onOpenChange?.(false);
      }
    } else {
      onCancel?.();
      onOpenChange?.(false);
    }
  };

  const handleStepData = (stepData: Partial<BookingData>) => {
    setBookingData(prev => ({ ...prev, ...stepData }));
    setError(null); // Clear errors when data changes
  };

  const generateBookingNumber = () => {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `HTL${year}${month}${day}${random}`;
  };

  const handleBookingSubmit = async (): Promise<void> => {
    if (!validateCurrentStep()) {
      toast.error('Please complete all required information');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Calculate final amounts using new system
      const pricing = calculateBookingAmount({
        baseRoomRate: bookingData.room!.current_rate,
        customRoomRate: bookingData.useCustomRate ? bookingData.customRoomRate : undefined,
        nights: bookingData.totalNights!,
        extraBeds: bookingData.extraBeds,
        additionalCharges: bookingData.additionalCharges,
        gstMode: bookingData.gstMode || 'inclusive'
      });

      // Prepare extra bed and additional charges data
      const extraBedData = bookingData.extraBeds && bookingData.extraBeds.quantity > 0 ? {
        extra_bed_count: bookingData.extraBeds.quantity,
        extra_bed_rate: bookingData.extraBeds.ratePerBed,
        extra_bed_total: bookingData.extraBeds.quantity * bookingData.extraBeds.ratePerBed * bookingData.totalNights!
      } : {
        extra_bed_count: 0,
        extra_bed_rate: 0,
        extra_bed_total: 0
      };

      // Create booking
      const bookingNumber = generateBookingNumber();
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          booking_number: bookingNumber,
          room_id: bookingData.room!.id,
          primary_customer_id: bookingData.primaryGuest!.id,
          check_in_date: bookingData.checkInDate!,
          check_out_date: bookingData.checkOutDate!,
          total_guests: bookingData.totalGuests || 1,
          adults: bookingData.adults || 1,
          children: bookingData.children || 0,
          room_rate: bookingData.useCustomRate && bookingData.customRoomRate ? 
            bookingData.customRoomRate : bookingData.room!.current_rate,
          original_room_rate: bookingData.room!.current_rate,
          custom_rate_applied: bookingData.useCustomRate || false,
          total_nights: bookingData.totalNights!,
          ...extraBedData,
          additional_charges: bookingData.additionalCharges ? JSON.stringify(bookingData.additionalCharges) : null,
          base_amount: pricing.baseAmount,
          gst_amount: pricing.gstAmount,
          total_amount: pricing.totalAmount,
          gst_mode: bookingData.gstMode || 'inclusive',
          booking_source: bookingData.bookingSource || 'walk_in',
          special_requests: bookingData.specialRequests,
          booking_status: 'confirmed',
          payment_status: bookingData.paymentAmount === pricing.totalAmount ? 'paid' : 
                         bookingData.paymentAmount && bookingData.paymentAmount > 0 ? 'partial' : 'pending',
          paid_amount: bookingData.paymentAmount || 0,
          created_by: user.id
        })
        .select()
        .single();

      if (bookingError) throw bookingError;

      // Add additional guests if any
      if (bookingData.additionalGuests && bookingData.additionalGuests.length > 0) {
        const guestInserts = bookingData.additionalGuests.map(guest => ({
          booking_id: booking.id,
          customer_id: guest.id,
          is_primary: false
        }));

        const { error: guestsError } = await supabase
          .from('booking_guests')
          .insert(guestInserts);

        if (guestsError) {
          console.error('Error adding additional guests:', guestsError);
          // Don't fail the booking for this
        }
      }

      // Create payment record if payment was made
      if (bookingData.paymentAmount && bookingData.paymentAmount > 0) {
        const { error: paymentError } = await supabase
          .from('payments')
          .insert({
            booking_id: booking.id,
            amount: bookingData.paymentAmount,
            payment_method: bookingData.paymentMethod || 'cash',
            reference_number: bookingData.referenceNumber,
            payment_notes: bookingData.paymentNotes,
            payment_status: 'completed',
            payment_date: new Date().toISOString(),
            created_by: user.id
          });

        if (paymentError) {
          console.error('Error creating payment record:', paymentError);
          // Don't fail the booking for this
        }
      }

      // Update room status if check-in is today
      const today = new Date().toISOString().split('T')[0];
      if (bookingData.checkInDate === today) {
        const { error: roomUpdateError } = await supabase
          .from('rooms')
          .update({ status: 'occupied' })
          .eq('id', bookingData.room!.id);

        if (roomUpdateError) {
          console.error('Error updating room status:', roomUpdateError);
          // Don't fail the booking for this
        }
      }

      // Clear draft on successful booking
      clearDraft();
      
      toast.success('Booking created successfully!');
      onComplete?.(booking);
      onOpenChange?.(false);

    } catch (error) {
      console.error('Booking creation error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create booking';
      setError(errorMessage);
      toast.error('Failed to create booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const canProceed = () => {
    return Object.keys(validationErrors).length === 0 && !loading;
  };

  const getStepValidationMessage = () => {
    const errors = validationErrors[currentStepId];
    return errors && errors.length > 0 ? errors[0] : null;
  };

  const renderStepContent = () => {
    switch (currentStepId) {
      case 'room':
        return (
          <RoomSelection
            data={bookingData}
            onDataChange={handleStepData}
          />
        );
      case 'guests':
        return (
          <GuestRegistration
            data={bookingData}
            onDataChange={handleStepData}
          />
        );
      case 'payment':
        return (
          <PaymentProcessing
            data={bookingData}
            onDataChange={handleStepData}
          />
        );
      case 'confirmation':
        return (
          <BookingConfirmation
            data={bookingData}
          />
        );
      default:
        return null;
    }
  };

  const validationMessage = getStepValidationMessage();

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-7xl h-[95vh] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl font-bold text-gray-900">New Booking</DialogTitle>
              <DialogDescription className="mt-1">
                Complete the booking process step by step
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              {lastSavedDraft && (
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Clock className="w-3 h-3" />
                  <span>Saved {lastSavedDraft.toLocaleTimeString()}</span>
                </div>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={saveDraft}
                disabled={isDraftSaving}
                className="text-xs"
              >
                {isDraftSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span className='ml-1'>{isDraftSaving ? 'Saving...' : 'Save Draft'}</span>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCancel}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto bg-gray-50/50">
          <div className="p-6 space-y-6">
            {/* Progress Steps */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  {steps.map((step, index) => {
                    const IconComponent = step.icon;
                    const isActive = index === currentStep;
                    const isCompleted = index < currentStep;
                    const isAccessible = isCompleted || isActive;
                    const hasError = validationErrors[step.id] && validationErrors[step.id].length > 0;

                    return (
                      <React.Fragment key={step.id}>
                        <div className="flex flex-col items-center space-y-2">
                          <div
                            className={`
                              w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-200
                              ${isAccessible && 'cursor-pointer'}
                              ${isActive 
                                ? 'bg-blue-600 border-blue-600 text-white' 
                                : isCompleted 
                                  ? 'bg-green-600 border-green-600 text-white'
                                  : hasError
                                    ? 'border-red-300 text-red-600 bg-red-50'
                                    : 'border-gray-300 text-gray-600 hover:border-blue-300'
                              }
                            `}
                            onClick={() => {
                              if (isAccessible && !loading) {
                                setCurrentStep(index);
                              }
                            }}
                          >
                            {isCompleted ? (
                              <CheckCircle className="w-6 h-6" />
                            ) : hasError ? (
                              <AlertTriangle className="w-5 h-5" />
                            ) : (
                              <IconComponent className="w-6 h-6" />
                            )}
                          </div>
                          <div className="text-center">
                            <p className={`text-sm font-medium ${
                              isActive ? 'text-blue-600' : 
                              isCompleted ? 'text-green-600' : 
                              hasError ? 'text-red-600' :
                              'text-gray-600'
                            }`}>
                              {step.title}
                            </p>
                            <p className="text-xs text-gray-500">{step.description}</p>
                          </div>
                        </div>
                        {index < steps.length - 1 && (
                          <div className={`flex-1 h-0.5 mx-4 ${
                            isCompleted ? 'bg-green-600' : 'bg-gray-200'
                          }`} />
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Error Display */}
            {(error || validationMessage) && (
              <Card className="border-red-200 bg-red-50">
                <CardContent className="p-4">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-red-800 font-medium">
                        {error ? 'An error occurred' : 'Please correct the following'}
                      </p>
                      <p className="text-red-700 mt-1">{error || validationMessage}</p>
                      {validationErrors[currentStepId] && validationErrors[currentStepId].length > 1 && (
                        <ul className="mt-2 text-sm text-red-600 list-disc list-inside">
                          {validationErrors[currentStepId].slice(1).map((err, idx) => (
                            <li key={idx}>{err}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step Content */}
            <div className="min-h-[500px]">
              {renderStepContent()}
            </div>
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="border-t bg-gray-50 px-6 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              {isFirstStep ? 'Cancel' : 'Back'}
            </Button>

            <div className="flex items-center gap-4">
              {/* Step Progress */}
              <div className="text-sm text-gray-600">
                Step {currentStep + 1} of {steps.length}: {steps[currentStep].title}
              </div>

              {/* Load Draft Button */}
              {isFirstStep && hasDraft && (
                <Button
                  variant="outline"
                  onClick={loadDraft}
                  disabled={loading}
                  size="sm"
                >
                  <Info className="w-4 h-4 mr-2" />
                  Load Saved Draft
                </Button>
              )}

              <Button
                onClick={handleNext}
                disabled={!canProceed() || loading}
                className="flex items-center gap-2 min-w-[120px]"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {isLastStep ? 'Create Booking' : 'Next'}
                {!isLastStep && <ArrowRight className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 