'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CustomerSelection } from './CustomerSelection';
import { AddCustomerFormBooking } from './AddCustomerFormBooking';
import { 
  User, 
  Plus, 
  Search, 
  Phone, 
  Mail, 
  CreditCard, 
  MapPin, 
  Users, 
  Trash2,
  Edit,
  AlertCircle,
  CheckCircle2,
  UserCheck,
  UserPlus
} from 'lucide-react';
import { toast } from 'sonner';
import { Customer, BookingData } from '@/lib/types/booking';

interface GuestRegistrationProps {
  data: BookingData;
  onDataChange: (data: Partial<BookingData>) => void;
}

const idTypeLabels = {
  aadhaar: 'Aadhaar Card',
  pan: 'PAN Card',
  passport: 'Passport',
  driving_license: 'Driving License',
  voter_id: 'Voter ID'
};

export function GuestRegistration({ data, onDataChange }: GuestRegistrationProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [addGuestOpen, setAddGuestOpen] = useState(false);
  const [editingGuest, setEditingGuest] = useState<Customer | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Calculate guest statistics
  const totalSelectedGuests = 1 + (data.additionalGuests?.length || 0);
  const maxGuests = data.room?.max_occupancy || 6;
  const canAddMoreGuests = totalSelectedGuests < maxGuests;
  const guestCapacityWarning = totalSelectedGuests > maxGuests;
  const guestCapacityNearLimit = totalSelectedGuests === maxGuests;

  // Validate guest data
  const validateGuestData = () => {
    const errors: string[] = [];
    
    if (!data.primaryGuest) {
      errors.push('Primary guest is required');
    }
    
    if (totalSelectedGuests > maxGuests) {
      errors.push(`Too many guests selected (${totalSelectedGuests}/${maxGuests})`);
    }
    
    if (data.totalGuests && totalSelectedGuests > data.totalGuests) {
      errors.push(`Selected guests exceed booking capacity (${totalSelectedGuests}/${data.totalGuests})`);
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handlePrimaryGuestSelect = (customer: Customer) => {
    onDataChange({ primaryGuest: customer });
    setSearchOpen(false);
    validateGuestData();
  };

  const handleAddAdditionalGuest = (customer: Customer) => {
    const currentGuests = data.additionalGuests || [];
    
    // Check if guest is already added
    if (currentGuests.some(g => g.id === customer.id) || customer.id === data.primaryGuest?.id) {
      toast.error('This guest is already added to the booking');
      return;
    }

    if (!canAddMoreGuests) {
      toast.error(`Cannot add more guests. Maximum capacity is ${maxGuests}`);
      return;
    }

    const updatedGuests = [...currentGuests, customer];
    onDataChange({ 
      additionalGuests: updatedGuests,
      totalGuests: 1 + updatedGuests.length // Primary + additional
    });
    setAddGuestOpen(false);
    validateGuestData();
    toast.success(`${customer.name} added as additional guest`);
  };

  const handleRemoveGuest = (guestId: string) => {
    if (window.confirm('Are you sure you want to remove this guest?')) {
      const updatedGuests = (data.additionalGuests || []).filter(g => g.id !== guestId);
      onDataChange({ 
        additionalGuests: updatedGuests,
        totalGuests: 1 + updatedGuests.length // Primary + additional
      });
      validateGuestData();
      toast.success('Guest removed from booking');
    }
  };

  const handleNewCustomerCreated = (customer: Customer) => {
    if (!data.primaryGuest) {
      handlePrimaryGuestSelect(customer);
      toast.success(`${customer.name} added as primary guest`);
    } else {
      handleAddAdditionalGuest(customer);
    }
  };

  const handleEditGuest = (customer: Customer) => {
    setEditingGuest(customer);
  };

  const renderGuestCard = (customer: Customer, isPrimary: boolean = false) => (
    <div 
      key={customer.id}
      className={`p-4 border rounded-lg transition-all ${
        isPrimary 
          ? 'bg-blue-50 border-blue-200' 
          : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-semibold text-lg truncate">{customer.name}</h3>
            <Badge className={isPrimary ? 'bg-blue-600' : 'bg-gray-600'}>
              {isPrimary ? 'Primary Guest' : 'Additional Guest'}
            </Badge>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-gray-500 flex-shrink-0" />
              <span className="truncate">{customer.phone}</span>
            </div>
            
            {customer.email && (
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-gray-500 flex-shrink-0" />
                <span className="truncate">{customer.email}</span>
              </div>
            )}
            
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-gray-500 flex-shrink-0" />
              <span className="truncate">
                {idTypeLabels[customer.id_type]} - {customer.id_number}
              </span>
            </div>
            
            {customer.city && customer.state && (
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-500 flex-shrink-0" />
                <span className="truncate">{customer.city}, {customer.state}</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex gap-2 ml-4">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => handleEditGuest(customer)}
            className="flex-shrink-0"
          >
            <Edit className="w-4 h-4" />
          </Button>
          
          {isPrimary ? (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setSearchOpen(true)}
              className="flex-shrink-0"
            >
              <Search className="w-4 h-4" />
            </Button>
          ) : (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleRemoveGuest(customer.id)}
                             className="flex-shrink-0 text-red-600 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <div className="space-y-1">
              {validationErrors.map((error, index) => (
                <div key={index}>• {error}</div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Guest Capacity Warning */}
      {guestCapacityWarning && (
        <Alert className="border-amber-200 bg-amber-50">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            <strong>Capacity Exceeded:</strong> You have selected {totalSelectedGuests} guests 
            but the room only accommodates {maxGuests} guests maximum.
          </AlertDescription>
        </Alert>
      )}

      {/* Primary Guest Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="w-5 h-5" />
            Primary Guest
            <span className="text-sm font-normal text-gray-500">
              (Required - Main contact person)
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.primaryGuest ? (
            <div className="space-y-4">
              {renderGuestCard(data.primaryGuest, true)}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-center py-8 text-gray-600">
                <User className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-lg font-medium mb-2">Select Primary Guest</p>
                <p className="mb-4 text-sm">
                  The primary guest is the main contact person for this booking
                </p>
                <div className="flex gap-2 justify-center">
                  <Button onClick={() => setSearchOpen(true)}>
                    <Search className="w-4 h-4 mr-2" />
                    Search Customer
                  </Button>
                  <Button variant="outline" onClick={() => setEditingGuest({} as Customer)}>
                    <Plus className="w-4 h-4 mr-2" />
                    New Customer
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Additional Guests */}
      {data.primaryGuest && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="w-5 h-5" />
                Additional Guests 
                <span className="text-sm font-normal text-gray-500">
                  ({data.additionalGuests?.length || 0}/{maxGuests - 1} available)
                </span>
              </CardTitle>
              {canAddMoreGuests && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setAddGuestOpen(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Guest
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {data.additionalGuests && data.additionalGuests.length > 0 ? (
              <div className="space-y-3">
                {data.additionalGuests.map((guest) => renderGuestCard(guest, false))}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">
                <Users className="w-8 h-8 mx-auto text-gray-400 mb-3" />
                <p className="text-sm">No additional guests added</p>
                {canAddMoreGuests && (
                  <p className="text-xs mt-1">
                    You can add up to {maxGuests - 1} more guest{maxGuests - 1 > 1 ? 's' : ''}
                  </p>
                )}
              </div>
            )}

            {/* Capacity Information */}
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Room Capacity:</span>
                <span className="font-medium">{maxGuests} guests maximum</span>
              </div>
              <div className="flex items-center justify-between text-sm mt-1">
                <span className="text-gray-600">Currently Selected:</span>
                <span className={`font-medium ${
                  guestCapacityWarning ? 'text-red-600' : 
                  guestCapacityNearLimit ? 'text-amber-600' : 
                  'text-green-600'
                }`}>
                  {totalSelectedGuests} guest{totalSelectedGuests > 1 ? 's' : ''}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Guest Summary */}
      {data.primaryGuest && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              Guest Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">1</p>
                <p className="text-sm text-gray-600">Primary Guest</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{data.additionalGuests?.length || 0}</p>
                <p className="text-sm text-gray-600">Additional Guests</p>
              </div>
              <div className={`p-3 rounded-lg ${
                guestCapacityWarning ? 'bg-red-50' : 
                guestCapacityNearLimit ? 'bg-amber-50' : 
                'bg-purple-50'
              }`}>
                <p className={`text-2xl font-bold ${
                  guestCapacityWarning ? 'text-red-600' : 
                  guestCapacityNearLimit ? 'text-amber-600' : 
                  'text-purple-600'
                }`}>
                  {totalSelectedGuests}
                </p>
                <p className="text-sm text-gray-600">Total Selected</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-600">{maxGuests}</p>
                <p className="text-sm text-gray-600">Max Allowed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Customer Search Dialog */}
      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {data.primaryGuest ? 'Change Primary Guest' : 'Select Primary Guest'}
            </DialogTitle>
          </DialogHeader>
          <CustomerSelection 
            onCustomerSelect={data.primaryGuest ? handleAddAdditionalGuest : handlePrimaryGuestSelect}
            showCreateNew={true}
            onCreateNew={() => {
              setSearchOpen(false);
              setEditingGuest({} as Customer);
            }}
            excludeCustomerIds={data.primaryGuest ? [data.primaryGuest.id, ...(data.additionalGuests?.map(g => g.id) || [])] : (data.additionalGuests?.map(g => g.id) || [])}
          />
        </DialogContent>
      </Dialog>

      {/* Add Additional Guest Dialog */}
      <Dialog open={addGuestOpen} onOpenChange={setAddGuestOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Additional Guest</DialogTitle>
          </DialogHeader>
          <CustomerSelection 
            onCustomerSelect={handleAddAdditionalGuest}
            showCreateNew={true}
            onCreateNew={() => {
              setAddGuestOpen(false);
              setEditingGuest({} as Customer);
            }}
            excludeCustomerIds={[data.primaryGuest!.id, ...(data.additionalGuests?.map(g => g.id) || [])]}
          />
        </DialogContent>
      </Dialog>

      {/* Customer Form Dialog */}
      <AddCustomerFormBooking
        isOpen={!!editingGuest}
        onOpenChange={(open: boolean) => {
          if (!open) {
            setEditingGuest(null);
          }
        }}
        customer={editingGuest?.id ? editingGuest : undefined}
        onSuccess={handleNewCustomerCreated}
      />
    </div>
  );
} 