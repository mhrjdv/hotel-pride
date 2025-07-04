'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

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

  Info,
  Save,
  Clock,
  Trash2
} from 'lucide-react';
import RoomSelection from './RoomSelection';
import { GuestRegistration } from './GuestRegistration';
import { PaymentProcessing } from './PaymentProcessing';
import { BookingConfirmation } from './BookingConfirmation';
import { calculateBookingAmount } from '@/lib/utils/gst';
import { toast } from 'sonner';
import { BookingData, Booking } from '@/lib/types/booking';
import { AnimatePresence, motion } from 'framer-motion';
import { Alert, AlertDescription } from '@/components/ui/alert';

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

const logError = (message: string, error: unknown, context?: Record<string, unknown>) => {
  if (process.env.NODE_ENV === 'development') {
    console.error(`[BookingWizard] ${message}:`, error, context);
  }
};

const logInfo = (message: string, context?: Record<string, unknown>) => {
  if (process.env.NODE_ENV === 'development') {
    console.info(`[BookingWizard] ${message}`, context);
  }
};

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
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  useEffect(() => {
    try {
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
    } catch (err) {
      logError('Error loading draft status', err);
    }
  }, []);

  useEffect(() => {
    const fetchExistingBooking = async () => {
      if (!bookingId) return;
      
      try {
        logInfo('Fetching existing booking for edit', { bookingId });
        const { data, error } = await supabase
          .from('bookings')
          .select(`*, rooms (*), customers:primary_customer_id (*), booking_guests (*, customers (*))`)
          .eq('id', bookingId)
          .single();
          
        if (error) {
          logError('Supabase error fetching booking for edit', error, { bookingId });
          toast.error('Failed to load booking for editing');
          return;
        }
        
        if (!data) {
          logError('No booking data found', null, { bookingId });
          return;
        }
        
        const transformed: BookingData = {
          roomId: data.room_id,
          roomNumber: data.rooms?.room_number,
          roomType: data.rooms?.room_type,
          checkInDate: data.check_in_date,
          checkOutDate: data.check_out_date,
          checkInTime: data.check_in_time,
          checkOutTime: data.check_out_time,
          totalNights: data.total_nights,
          customerId: data.primary_customer_id,
          primaryGuestName: data.customers?.name,
          adults: data.adults,
          children: data.children,
          totalGuests: data.total_guests,
          rate: data.room_rate,
          acPreference: data.ac_preference,
          isGstInclusive: data.is_gst_inclusive,
          extraBeds: {
            quantity: data.extra_bed_count || 0,
            ratePerBed: data.extra_bed_rate || 0,
          },
          room: data.rooms,
        };
        
        setBookingData(transformed);
        logInfo('Successfully loaded booking for editing', { bookingId, transformed });
      } catch (err) {
        logError('Unexpected error loading booking', err, { bookingId });
        toast.error('An unexpected error occurred while loading the booking');
      }
    };
    
    fetchExistingBooking();
  }, [bookingId, supabase]);

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
      logInfo('Draft saved successfully', { timestamp: savedDate.toISOString() });
      toast.success('Draft saved!', {
        description: `Saved at ${savedDate.toLocaleTimeString()}`,
      });
    } catch (error) {
      logError('Failed to save draft', error, { bookingData });
      toast.error('Could not save draft.');
    } finally {
      setIsDraftSaving(false);
    }
  }, [bookingData]);

  useEffect(() => {
    const autoSave = setTimeout(() => {
      if (Object.keys(bookingData).length > 0 && !bookingId) {
        saveDraft();
      }
    }, 60000); // Auto-save every 60 seconds

    return () => clearTimeout(autoSave);
  }, [bookingData, saveDraft, bookingId]);

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
        logInfo('Draft loaded successfully', { timestamp: parsedDraft.timestamp });
        toast.success('Draft loaded successfully');
      }
    } catch (error) {
      logError('Failed to load draft', error);
      toast.error('Failed to load draft.');
    }
  };

  const clearDraft = () => {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.removeItem('booking_draft');
      setLastSavedDraft(null);
      setHasDraft(false);
      logInfo('Draft cleared');
      toast.info('Draft cleared.');
    } catch (error) {
      logError('Failed to clear draft', error);
    }
  };

  const deleteDraft = () => {
    setConfirmDeleteOpen(true);
  };

  const confirmDelete = () => {
    clearDraft();
    setBookingData({});
    setCurrentStep(0);
    setConfirmDeleteOpen(false);
    toast.success('Draft deleted successfully');
  };

  const currentStepId = steps[currentStep]?.id;
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;

  const validateCurrentStep = (updateState: boolean = false): boolean => {
    const errors: string[] = [];
    
    try {
      switch (currentStepId) {
        case 'room':
          if (!bookingData.roomId) {
            errors.push('Please select a room');
          }
          
          if (bookingData.checkInDate === bookingData.checkOutDate) {
            if (bookingData.checkInTime && bookingData.checkOutTime && bookingData.checkInTime >= bookingData.checkOutTime) {
              errors.push('Check-out time must be after check-in time for same-day bookings');
            }
          }
          
          if (bookingData.checkInDate && bookingData.checkOutDate) {
            const checkInDate = new Date(bookingData.checkInDate);
            const checkOutDate = new Date(bookingData.checkOutDate);
            if (checkInDate > checkOutDate) {
              errors.push('Check-in date must be before check-out date');
            }
          }
          
          if (bookingData.checkInDate) {
            const today = new Date().toISOString().split('T')[0];
            if (bookingData.checkInDate < today) {
              errors.push('Check-in date cannot be in the past');
            }
          }
          break;
          
        case 'guests':
          if (!bookingData.primaryGuestName || bookingData.primaryGuestName.trim() === '') {
            errors.push('Primary guest name is required');
          }
          if (!bookingData.customerId) {
            errors.push('Please select a customer');
          }
          if (!bookingData.totalGuests || bookingData.totalGuests < 1) {
            errors.push('Total guests must be at least 1');
          }
          if (!bookingData.adults || bookingData.adults < 1) {
            errors.push('At least one adult is required');
          }
          if (bookingData.children && bookingData.children < 0) {
            errors.push('Number of children cannot be negative');
          }
          break;
          
        case 'payment':
          if (!bookingData.rate || bookingData.rate <= 0) {
            errors.push('Valid room rate is required');
          }
          if (!bookingData.totalNights || bookingData.totalNights < 1) {
            errors.push('Total nights must be at least 1');
          }
          if (bookingData.extraBeds?.quantity && bookingData.extraBeds.quantity < 0) {
            errors.push('Extra bed quantity cannot be negative');
          }
          if (bookingData.extraBeds?.ratePerBed && bookingData.extraBeds.ratePerBed < 0) {
            errors.push('Extra bed rate cannot be negative');
          }
          break;
          
        case 'confirmation':
          if (!bookingData.roomId) {
            errors.push('Room selection is required');
          }
          if (!bookingData.customerId) {
            errors.push('Customer selection is required');
          }
          if (!bookingData.primaryGuestName) {
            errors.push('Primary guest name is required');
          }
          if (!bookingData.checkInDate || !bookingData.checkOutDate) {
            errors.push('Check-in and check-out dates are required');
          }
          break;
      }
      
      if (updateState) {
        setValidationErrors({ [currentStepId]: errors });
      }
      
      if (errors.length > 0) {
        logInfo('Step validation failed', { step: currentStepId, errors });
        return false;
      }
      
      logInfo('Step validation passed', { step: currentStepId });
      return true;
    } catch (err) {
      logError('Error during step validation', err, { step: currentStepId, bookingData });
      return false;
    }
  };

  const handleNext = () => {
    if (validateCurrentStep(true)) {
      setDirection(1);
      setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
      setError(null);
    }
  };

  const handlePrevious = () => {
    if (isFirstStep) {
      handleCancel();
    } else {
      setDirection(-1);
      setCurrentStep(prev => Math.max(prev - 1, 0));
      setError(null);
    }
  };

  const handleCancel = () => {
    try {
      if (Object.keys(bookingData).length > 0 && !bookingId) {
        setConfirmCancelOpen(true);
      } else {
        onCancel?.();
        onOpenChange?.(false);
      }
    } catch (err) {
      logError('Error handling cancel', err);
    }
  };

  const handleDialogOpenChange = (open: boolean) => {
    try {
      if (!open) {
        handleCancel();
      } else {
        onOpenChange?.(open);
      }
    } catch (err) {
      logError('Error handling dialog open change', err, { open });
    }
  };

  const handleStepData = useCallback((stepData: Partial<BookingData>) => {
    try {
      setBookingData(prev => ({ ...prev, ...stepData }));
      logInfo('Updated booking data', { stepData });
    } catch (err) {
      logError('Error updating step data', err, { stepData });
    }
  }, []);

  const generateBookingNumber = () => {
    try {
      const prefix = 'BK';
      const timestamp = Date.now().toString().slice(-8);
      const random = Math.random().toString(36).substr(2, 4).toUpperCase();
      return `${prefix}${timestamp}${random}`;
    } catch (err) {
      logError('Error generating booking number', err);
      return `BK${Date.now()}`;
    }
  };

  const handleBookingSubmit = async (): Promise<void> => {
    if (!validateCurrentStep(true)) {
      toast.error('Please fix the errors before submitting.');
      return;
    }
    
    setLoading(true);
    setError(null);
    logInfo('Submitting booking...');

    try {
      const { 
        rate = 0,
        totalNights = 1,
        extraBeds,
        isGstInclusive,
      } = bookingData;

      const finalAmounts = calculateBookingAmount({
        baseRoomRate: rate,
        nights: totalNights,
        extraBeds: extraBeds,
        additionalCharges: [], // Future enhancement
        gstMode: isGstInclusive ? 'inclusive' : 'exclusive',
      });

      const bookingPayload: Omit<Booking, 'id' | 'created_at' | 'updated_at' | 'booking_number'> = {
        room_id: bookingData.roomId!,
        primary_customer_id: bookingData.customerId!,
        check_in_date: bookingData.checkInDate!,
        check_out_date: bookingData.checkOutDate!,
        check_in_time: bookingData.checkInTime!,
        check_out_time: bookingData.checkOutTime!,
        total_guests: bookingData.totalGuests || 1,
        adults: bookingData.adults || 1,
        children: bookingData.children || 0,
        room_rate: bookingData.rate!,
        total_nights: bookingData.totalNights!,
        base_amount: finalAmounts.baseAmount,
        gst_amount: finalAmounts.gstAmount,
        total_amount: finalAmounts.totalAmount,
        paid_amount: bookingData.paymentAmount || 0,
        due_amount: finalAmounts.totalAmount - (bookingData.paymentAmount || 0),
        is_gst_inclusive: bookingData.isGstInclusive || false,
        extra_bed_count: extraBeds?.quantity || 0,
        extra_bed_rate: extraBeds?.ratePerBed || 0,
        extra_bed_total: finalAmounts.breakdown.extraBedTotal,
        discount_amount: bookingData.discount?.amount || 0,
        additional_charges: null, // This can be extended later
        custom_rate_applied: false, // This logic can be extended
        ac_preference: bookingData.acPreference || false,
        gst_mode: bookingData.isGstInclusive ? 'inclusive' : 'exclusive',
        payment_status: bookingData.paymentAmount === finalAmounts.totalAmount ? 'paid' : 
                       bookingData.paymentAmount && bookingData.paymentAmount > 0 ? 'partial' : 'pending',
        booking_status: 'confirmed',
        booking_source: 'walk_in', // Default or from form
        special_requests: null, // From form
        cancellation_reason: null,
        cancelled_at: null,
        actual_check_in: null,
        actual_check_out: null,
        created_by: (await supabase.auth.getUser()).data.user?.id || null,
        updated_by: null,
      };

      const { data, error: submissionError } = await supabase
        .from('bookings')
        .insert(bookingPayload)
        .select()
        .single();

      if (submissionError) {
        throw submissionError;
      }
      
      logInfo('Booking submitted successfully', { booking: data });
      toast.success('Booking Confirmed!', {
        description: `Booking #${data.booking_number} has been created.`
      });
      clearDraft();
      if (onComplete) {
        onComplete(data as Booking);
      }
      setCurrentStep(steps.length - 1); // Move to confirmation
    } catch (err) {
      logError('Failed to submit booking', err);
      setError('An unexpected error occurred while creating the booking. Please try again.');
      toast.error('Booking submission failed.');
    } finally {
      setLoading(false);
    }
  };

  const canProceed = () => {
    try {
      return validateCurrentStep();
    } catch (err) {
      logError('Error checking if can proceed', err);
      return false;
    }
  };

  const getStepValidationMessage = () => {
    const errors = validationErrors[currentStepId] || [];
    return errors.length > 0 ? errors[0] : '';
  };

  const renderStepContent = () => {
    const animationProps = {
      initial: { opacity: 0, x: direction * 20 },
      animate: { opacity: 1, x: 0 },
      exit: { opacity: 0, x: -direction * 20 },
      transition: { duration: 0.3, ease: 'easeInOut' as const },
    };

    switch (currentStepId) {
      case 'room':
        return (
          <motion.div key={currentStepId} {...animationProps}>
            <RoomSelection
              bookingData={bookingData}
              onDataChange={handleStepData}
              customerId={bookingData.customerId || ''}
            />
          </motion.div>
        );
      case 'guests':
        return (
          <motion.div key={currentStepId} {...animationProps}>
            <GuestRegistration 
              data={bookingData} 
              onDataChange={handleStepData}
            />
          </motion.div>
        );
      case 'payment':
        return (
          <motion.div key={currentStepId} {...animationProps}>
            <PaymentProcessing 
              data={bookingData} 
              onDataChange={handleStepData}
            />
          </motion.div>
        );
      case 'confirmation':
        return (
          <motion.div key={currentStepId} {...animationProps}>
            <BookingConfirmation 
              data={bookingData}
            />
          </motion.div>
        );
      default:
        return <div>Unknown step</div>;
    }
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
    <>
      <Dialog open={isOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContent className="w-full sm:w-full md:max-w-4xl lg:max-w-5xl xl:max-w-6xl 2xl:max-w-7xl h-[90vh] max-h-[90vh] flex flex-col p-0">
          <DialogHeader className="px-4 sm:px-6 py-4 border-b">
              <DialogTitle className="text-xl sm:text-2xl font-bold text-gray-900">
                {bookingId ? 'Edit Booking' : 'New Booking'}
              </DialogTitle>
              <DialogDescription className="mt-1 text-sm sm:text-base">
                  Step {currentStep + 1} of {steps.length}: {steps[currentStep].title}
              </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col lg:flex-row flex-1 bg-gray-50/50 overflow-hidden">
            {/* Mobile Steps Progress */}
            <div className="lg:hidden px-4 py-3 border-b bg-white">
              <div className="flex items-center justify-between text-xs">
                {steps.map((step, index) => {
                  const IconComponent = step.icon;
                  const isActive = index === currentStep;
                  const isCompleted = index < currentStep;
                  
                  return (
                    <div key={step.id} className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                        isActive ? 'bg-blue-600 border-blue-600 text-white' : 
                        isCompleted ? 'bg-green-600 border-green-600 text-white' : 'border-gray-300 bg-gray-100 text-gray-500'
                      }`}>
                        {isCompleted ? <CheckCircle className="w-4 h-4" /> : <IconComponent className="w-4 h-4" />}
                      </div>
                      <span className={`mt-1 text-xs font-medium ${isActive ? 'text-blue-700' : isCompleted ? 'text-green-700' : 'text-gray-500'}`}>
                        {step.title}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Desktop Sidebar with Steps */}
            <aside className="hidden lg:flex flex-col w-64 xl:w-72 border-r bg-white p-6 overflow-y-auto">
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
              
              {/* Draft Controls */}
              <div className="mt-auto space-y-3">
                {hasDraft && lastSavedDraft && (
                  <div className="flex items-center gap-2 text-xs text-gray-500 p-2 bg-gray-100 rounded-md">
                    <Clock className="w-3 h-3 flex-shrink-0" />
                    <span>Last draft: {lastSavedDraft.toLocaleTimeString()}</span>
                  </div>
                )}
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={saveDraft} 
                    disabled={isDraftSaving || !!bookingId} 
                    className="flex-1"
                  >
                    {isDraftSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    <span className='ml-2'>{isDraftSaving ? 'Saving' : 'Save'}</span>
                  </Button>
                  {hasDraft && !bookingId && (
                      <Button variant="destructive" size="sm" onClick={deleteDraft}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                  )}
                </div>
                {isFirstStep && hasDraft && !bookingId && (
                  <Button variant="link" onClick={loadDraft} disabled={loading} className="w-full p-0 h-auto text-xs">
                    <Info className="w-3 h-3 mr-1" />
                    Load Saved Draft
                  </Button>
                )}
              </div>
            </aside>
            
            {/* Main Content */}
            <main className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 relative overflow-y-auto">
                  {(error || validationMessage) && (
                    <div className="p-4 sm:p-6">
                      <Alert className="border-red-200 bg-red-50">
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                        <AlertDescription className="text-red-800">
                          {error ?? validationMessage}
                        </AlertDescription>
                      </Alert>
                    </div>
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
                          className="absolute w-full h-full top-0 left-0 p-4 sm:p-6"
                      >
                          {renderStepContent()}
                      </motion.div>
                  </AnimatePresence>
              </div>
            </main>
          </div>

          {/* Footer Navigation */}
          <div className="border-t bg-gray-50 px-4 sm:px-6 py-4">
            <div className="flex items-center justify-between gap-4">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={loading}
                className="flex items-center gap-2 min-w-[100px] sm:min-w-[120px] min-h-[44px] sm:min-h-[48px] text-sm sm:text-base"
              >
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                {isFirstStep ? 'Cancel' : 'Back'}
              </Button>

              {/* Mobile Draft Controls */}
              <div className="lg:hidden flex items-center gap-2">
                {!bookingId && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={saveDraft} 
                    disabled={isDraftSaving}
                    className="p-2"
                  >
                    {isDraftSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  </Button>
                )}
                {hasDraft && !bookingId && (
                  <Button variant="ghost" size="sm" onClick={deleteDraft} className="p-2">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>

              <Button
                onClick={isLastStep ? handleBookingSubmit : handleNext}
                disabled={!canProceed() || loading}
                className="flex items-center gap-2 min-w-[120px] sm:min-w-[150px] min-h-[44px] sm:min-h-[48px] text-sm sm:text-base"
                size="lg"
              >
                {loading && <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />}
                {isLastStep ? (bookingId ? 'Save Changes' : 'Create Booking') : 'Next'}
                {!isLastStep && <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialogs */}
      <Dialog open={confirmCancelOpen} onOpenChange={setConfirmCancelOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Discard this booking?</DialogTitle>
            <DialogDescription>All unsaved changes will be lost.</DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-4 mt-4">
            <Button variant="outline" onClick={() => setConfirmCancelOpen(false)}>Continue Editing</Button>
            <Button variant="destructive" onClick={() => { 
              setConfirmCancelOpen(false); 
              clearDraft();
              onCancel?.(); 
              onOpenChange?.(false); 
            }}>Discard</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete draft?</DialogTitle>
            <DialogDescription>This will permanently delete your saved draft.</DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-4 mt-4">
            <Button variant="outline" onClick={() => setConfirmDeleteOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete}>Delete Draft</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
} 