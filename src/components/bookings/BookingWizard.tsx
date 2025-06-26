'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
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
  AlertCircle,
  Loader2,
  X,
  Info,
  Save,
  Clock,
  Trash2
} from 'lucide-react';
import { RoomSelection } from './RoomSelection';
import { GuestRegistration } from './GuestRegistration';
import { PaymentProcessing } from './PaymentProcessing';
import { BookingConfirmation } from './BookingConfirmation';
import { calculateBookingAmount } from '@/lib/utils/gst';
import { toast } from 'sonner';
import { BookingData, Booking } from '@/lib/types/booking';
import { AnimatePresence, motion } from 'framer-motion';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog as ConfirmDialog, DialogContent as ConfirmContent, DialogHeader as ConfirmHeader, DialogTitle as ConfirmTitle, DialogDescription as ConfirmDesc } from '@/components/ui/dialog';

interface BookingWizardProps {
  onComplete?: (booking: Booking) => void;
  onCancel?: () => void;
  initialData?: Partial<BookingData>;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  bookingId?: string;
}

const steps = [
  { id: 'room', title: 'Select Room', icon: Hotel, description: 'Choose room and dates' },
  { id: 'guests', title: 'Guest Details', icon: Users, description: 'Add guest information' },
  { id: 'payment', title: 'Payment', icon: CreditCard, description: 'Process payment' },
  { id: 'confirmation', title: 'Confirmation', icon: CheckCircle, description: 'Review and confirm' }
];

export function BookingWizard({ onComplete, onCancel, initialData, isOpen = true, onOpenChange, bookingId }: BookingWizardProps) {
  const supabase = createClient();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [bookingData, setBookingData] = useState<BookingData>(initialData || {});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({});
  const [isDraftSaving, setIsDraftSaving] = useState(false);
  const [lastSavedDraft, setLastSavedDraft] = useState<Date | null>(null);
  const [hasDraft, setHasDraft] = useState(false);
  const [direction, setDirection] = useState(1);
  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const draft = localStorage.getItem('booking_draft');
      if (draft) {
        setHasDraft(true);
        const parsedDraft = JSON.parse(draft);
        if (parsedDraft.timestamp) {
          setLastSavedDraft(new Date(parsedDraft.timestamp));
        }
      }
    }
  }, []);

  useEffect(() => {
    const fetchExistingBooking = async () => {
      if (!bookingId) return;
      try {
        const { data, error } = await supabase
          .from('bookings')
          .select(`*, rooms (*), customers:primary_customer_id (*), booking_guests (*, customers (*))`)
          .eq('id', bookingId)
          .single();
        if (error) {
          console.error('Error fetching booking for edit:', error);
          toast.error('Failed to load booking for editing');
          return;
        }
        if (!data) return;
        const transformed: BookingData = {
          room: data.rooms,
          checkInDate: data.check_in_date,
          checkOutDate: data.check_out_date,
          totalNights: data.total_nights,
          totalGuests: data.total_guests,
          adults: data.adults,
          children: data.children,
          primaryGuest: data.customers,
          additionalGuests: (data.booking_guests || [])
            .filter((g: any) => !g.is_primary && g.customers)
            .map((g: any) => g.customers),
          useCustomRate: data.custom_rate_applied,
          customRoomRate: data.custom_rate_applied ? data.room_rate : undefined,
          gstMode: data.gst_mode,
          extraBeds: data.extra_bed_count && data.extra_bed_count > 0 ? {
            quantity: data.extra_bed_count,
            ratePerBed: data.extra_bed_rate
          } : undefined,
          additionalCharges: data.additional_charges ? JSON.parse(data.additional_charges) : undefined,
          paymentMethod: undefined,
          paymentAmount: undefined,
          bookingSource: data.booking_source,
          specialRequests: data.special_requests
        };
        setBookingData(transformed);
      } catch (err) {
        console.error('Unexpected error loading booking:', err);
      }
    };
    fetchExistingBooking();
  }, [bookingId]);

  const saveDraft = useCallback(async () => {
    if (typeof window === 'undefined') return;
    setIsDraftSaving(true);
    try {
      const draftData = {
        ...bookingData,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem('booking_draft', JSON.stringify(draftData));
      
      const savedDate = new Date();
      setLastSavedDraft(savedDate);
      setHasDraft(true);
      toast.success('Draft saved!', {
        description: `Saved at ${savedDate.toLocaleTimeString()}`,
      });
    } catch (error) {
      console.error('Failed to save draft:', error);
      toast.error('Could not save draft.');
    } finally {
      setIsDraftSaving(false);
    }
  }, [bookingData]);

  // Auto-save draft functionality
  useEffect(() => {
    const autoSave = setTimeout(() => {
      if (Object.keys(bookingData).length > 0) {
        saveDraft();
      }
    }, 60000); // Auto-save every 60 seconds

    return () => clearTimeout(autoSave);
  }, [bookingData, saveDraft]);

  const loadDraft = () => {
    if (typeof window === 'undefined') return;
    try {
      const draft = localStorage.getItem('booking_draft');
      if (draft) {
        const parsedDraft = JSON.parse(draft);
        setBookingData(parsedDraft.data || parsedDraft); // Support both old and new draft formats
        if (parsedDraft.timestamp) {
           setLastSavedDraft(new Date(parsedDraft.timestamp));
        }
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
    toast.info('Draft cleared.');
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
          if (checkOut < checkIn) errors.push('Check-out date must be the same or after check-in date');
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
        break;
        
      case 'confirmation':
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
    setDirection(1);
    if (isLastStep) {
      await handleBookingSubmit();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setError(null);
    setDirection(-1);
    if (isFirstStep) {
      handleCancel();
    } else {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleCancel = () => {
    if (Object.keys(bookingData).length > 0) {
      setConfirmCancelOpen(true);
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

      const pricing = calculateBookingAmount({
        baseRoomRate: bookingData.room!.current_rate,
        customRoomRate: bookingData.useCustomRate ? bookingData.customRoomRate : undefined,
        nights: bookingData.totalNights!,
        extraBeds: bookingData.extraBeds,
        additionalCharges: bookingData.additionalCharges,
        gstMode: bookingData.gstMode || 'inclusive'
      });

      const extraBedData = bookingData.extraBeds && bookingData.extraBeds.quantity > 0 ? {
        extra_bed_count: bookingData.extraBeds.quantity,
        extra_bed_rate: bookingData.extraBeds.ratePerBed,
        extra_bed_total: bookingData.extraBeds.quantity * bookingData.extraBeds.ratePerBed * bookingData.totalNights!
      } : {
        extra_bed_count: 0,
        extra_bed_rate: 0,
        extra_bed_total: 0
      };

      let booking;
      if (bookingId) {
        const { data: updated, error: updateError } = await supabase
          .from('bookings')
          .update({
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
            custom_rate_applied: !!bookingData.useCustomRate,
            total_nights: bookingData.totalNights!,
            ...extraBedData,
            additional_charges: bookingData.additionalCharges ? JSON.stringify(bookingData.additionalCharges) : null,
            base_amount: pricing.baseAmount,
            gst_amount: pricing.gstAmount,
            total_amount: pricing.totalAmount,
            gst_mode: bookingData.gstMode || 'inclusive',
            booking_source: bookingData.bookingSource || 'walk_in',
            special_requests: bookingData.specialRequests,
            updated_by: user.id,
            updated_at: new Date().toISOString()
          })
          .eq('id', bookingId)
          .select()
          .single();

        if (updateError) throw updateError;
        booking = updated;

        await supabase.from('booking_guests').delete().eq('booking_id', bookingId).eq('is_primary', false);
        if (bookingData.additionalGuests && bookingData.additionalGuests.length > 0) {
          const inserts = bookingData.additionalGuests.map(guest => ({
            booking_id: bookingId,
            customer_id: guest.id,
            is_primary: false
          }));
          const { error: addGuestsErr } = await supabase.from('booking_guests').insert(inserts);
          if (addGuestsErr) console.error('Error re-adding guests:', addGuestsErr);
        }
      } else {
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
            custom_rate_applied: !!bookingData.useCustomRate,
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

        if (bookingError) {
          if (process.env.NODE_ENV === 'development') {
            console.error('Supabase booking insert error:', JSON.stringify(bookingError, null, 2));
          }
          throw bookingError;
        }

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
          }
        }

        if (bookingData.paymentAmount && bookingData.paymentAmount > 0) {
          const { error: paymentError } = await supabase
            .from('payments')
            .insert({
              booking_id: booking.id,
              amount: bookingData.paymentAmount,
              payment_method: bookingData.paymentMethod || 'cash',
              reference_number: bookingData.referenceNumber || null,
              payment_notes: bookingData.paymentNotes,
              payment_status: 'completed',
              payment_date: new Date().toISOString(),
              created_by: user.id
            });

          if (paymentError) {
            console.error('Error creating payment record:', paymentError);
          }
        }

        const today = new Date().toISOString().split('T')[0];
        if (bookingData.checkInDate === today) {
          const { error: roomUpdateError } = await supabase
            .from('rooms')
            .update({ status: 'occupied' })
            .eq('id', bookingData.room!.id);

          if (roomUpdateError) {
            console.error('Error updating room status:', roomUpdateError);
          }
        }

        clearDraft();
        
        toast.success('Booking created successfully!');
        booking = { ...booking, ...bookingData };
      }

      onComplete?.(booking);
      onOpenChange?.(false);

    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Booking creation error object:', JSON.stringify(error, null, 2));
      }
      const errorMessage = error?.message || error?.details || 'Failed to create booking';
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
    const CurrentComponent = [RoomSelection, GuestRegistration, PaymentProcessing, BookingConfirmation][currentStep];
    return <CurrentComponent data={bookingData} onDataChange={handleStepData} />;
  };

  const validationMessage = getStepValidationMessage();

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? '100%' : '-100%',
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? '100%' : '-100%',
      opacity: 0
    })
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-full sm:w-full md:max-w-4xl lg:max-w-5xl xl:max-w-6xl 2xl:max-w-7xl h-[90vh] max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b relative">
            <DialogTitle className="text-2xl font-bold text-gray-900 pr-16">New Booking</DialogTitle>
            <DialogDescription className="mt-1">
                Step {currentStep + 1} of {steps.length}: {steps[currentStep].title}
            </DialogDescription>
            <Button variant="ghost" size="icon" onClick={handleCancel} className="absolute top-3 right-3">
                <X className="w-5 h-5" />
            </Button>
        </DialogHeader>

        <div className="flex flex-col lg:flex-row flex-1 bg-gray-50/50 overflow-hidden">
          {/* Sidebar with Steps */}
          <aside className="hidden lg:flex flex-col w-64 border-r bg-white p-6 overflow-y-auto">
            <div className="space-y-6">
              {steps.map((step, index) => {
                const IconComponent = step.icon;
                const isActive = index === currentStep;
                const isCompleted = index < currentStep;
                
                return (
                  <div key={step.id} className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                      isActive ? 'bg-blue-600 border-blue-600 text-white' : 
                      isCompleted ? 'bg-green-600 border-green-600 text-white' : 'border-gray-300 bg-gray-100 text-gray-500'
                    }`}>
                      {isCompleted ? <CheckCircle className="w-5 h-5" /> : <IconComponent className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className={`font-semibold ${isActive ? 'text-blue-700' : isCompleted ? 'text-green-700' : 'text-gray-700'}`}>{step.title}</p>
                      <p className="text-sm text-gray-500">{step.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-auto space-y-3">
              {hasDraft && lastSavedDraft && (
                <div className="flex items-center gap-2 text-xs text-gray-500 p-2 bg-gray-100 rounded-md">
                  <Clock className="w-3 h-3 flex-shrink-0" />
                  <span>Last draft saved: {lastSavedDraft.toLocaleTimeString()}</span>
                </div>
              )}
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={saveDraft} disabled={isDraftSaving} className="w-full">
                  {isDraftSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span className='ml-2'>{isDraftSaving ? 'Saving' : 'Save'}</span>
                </Button>
                {hasDraft && (
                    <Button variant="destructive" size="sm" onClick={clearDraft}><Trash2 className="w-4 h-4" /></Button>
                )}
              </div>
            </div>
          </aside>
          
          {/* Main Content */}
          <main className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 relative overflow-y-auto p-6">
                {(error || validationMessage) && (
                  <Alert className="border-red-200 bg-red-50 mb-4">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800">
                      {error ?? validationMessage}
                    </AlertDescription>
                  </Alert>
                )}
                <AnimatePresence initial={false} custom={direction}>
                    <motion.div
                        key={currentStep}
                        custom={direction}
                        variants={variants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{
                            x: { type: "spring", stiffness: 300, damping: 30 },
                            opacity: { duration: 0.2 }
                        }}
                        className="absolute w-full h-full top-0 left-0 p-6"
                    >
                        {renderStepContent()}
                    </motion.div>
                </AnimatePresence>
            </div>
          </main>
        </div>

        {/* Footer Navigation */}
        <div className="border-t bg-gray-50 px-6 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={loading}
              className="flex items-center gap-2 min-w-[120px] min-h-[48px] text-lg"
            >
              <ArrowLeft className="w-5 h-5" />
              {isFirstStep ? 'Cancel' : 'Back'}
            </Button>

            <div className="flex items-center gap-4">
              {isFirstStep && hasDraft && (
                <Button variant="link" onClick={loadDraft} disabled={loading}>
                  <Info className="w-4 h-4 mr-2" />
                  Load Saved Draft
                </Button>
              )}
              <Button
                onClick={handleNext}
                disabled={!canProceed() || loading}
                className="flex items-center gap-2 min-w-[150px] min-h-[48px] text-lg"
                size="lg"
              >
                {loading && <Loader2 className="w-5 h-5 animate-spin" />}
                {isLastStep ? 'Create Booking' : 'Next'}
                {!isLastStep && <ArrowRight className="w-5 h-5" />}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
      <ConfirmDialog open={confirmCancelOpen} onOpenChange={setConfirmCancelOpen}>
        <ConfirmContent className="max-w-sm">
          <ConfirmHeader>
            <ConfirmTitle>Discard this booking?</ConfirmTitle>
            <ConfirmDesc>All unsaved changes will be lost.</ConfirmDesc>
          </ConfirmHeader>
          <div className="flex justify-end gap-4 mt-4">
            <Button variant="outline" onClick={() => setConfirmCancelOpen(false)}>Continue Editing</Button>
            <Button variant="destructive" onClick={() => { setConfirmCancelOpen(false); onCancel?.(); onOpenChange?.(false); }}>Discard</Button>
          </div>
        </ConfirmContent>
      </ConfirmDialog>
    </Dialog>
  );
} 