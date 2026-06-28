'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CustomerSelection } from './CustomerSelection';
import { AddCustomerFormBooking } from './AddCustomerFormBooking';
import {
  Plus,
  Search,
  Phone,
  CreditCard,
  Trash2,
  Edit,
  AlertCircle,
  UserCheck,
  UserPlus,
  ChevronDown,
  ChevronRight,
  X
} from '@/components/icons';
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
  // Inline panels (no modals) for selecting the primary guest and adding additional guests.
  const [primarySearchOpen, setPrimarySearchOpen] = useState(false);
  const [addGuestSearchOpen, setAddGuestSearchOpen] = useState(false);
  const [additionalGuestsExpanded, setAdditionalGuestsExpanded] = useState(false);
  const [editingGuest, setEditingGuest] = useState<Customer | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Calculate guest statistics
  const totalSelectedGuests = 1 + ((data.additionalGuests as Customer[] | undefined)?.length || 0);

  // Validate guest data
  const validateGuestData = () => {
    const errors: string[] = [];
    
    if (!data.primaryGuest) {
      errors.push('Primary guest is required');
    }
    

    
    if (data.totalGuests && totalSelectedGuests > data.totalGuests) {
      errors.push(`Selected guests exceed booking capacity (${totalSelectedGuests}/${data.totalGuests})`);
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handlePrimaryGuestSelect = (customer: Customer) => {
    onDataChange({
      primaryGuest: customer,
      customerId: customer.id,
      primaryGuestName: customer.name
    });
    setPrimarySearchOpen(false);
    validateGuestData();
  };

  const handleAddAdditionalGuest = (customer: Customer) => {
    const currentGuests: Customer[] = (data.additionalGuests as Customer[] | undefined) || [];
    
    // Check if guest is already added
    if (currentGuests.some((g: Customer) => g.id === customer.id) || customer.id === data.primaryGuest?.id) {
      toast.error('This guest is already added to the booking');
      return;
    }



    const updatedGuests: Customer[] = [...currentGuests, customer];
    onDataChange({
      additionalGuests: updatedGuests,
      totalGuests: 1 + updatedGuests.length // Primary + additional
    });
    setAddGuestSearchOpen(false);
    setAdditionalGuestsExpanded(true);
    validateGuestData();
    toast.success(`${customer.name} added as additional guest`);
  };

  const handleRemoveGuest = (guestId: string) => {
    if (window.confirm('Are you sure you want to remove this guest?')) {
      const updatedGuests: Customer[] = ((data.additionalGuests as Customer[] | undefined) || []).filter((g: Customer) => g.id !== guestId);
      onDataChange({ 
        additionalGuests: updatedGuests,
        totalGuests: 1 + updatedGuests.length // Primary + additional
      });
      validateGuestData();
      toast.success('Guest removed from booking');
    }
  };

  const handleEditGuest = (customer: Customer) => {
    setEditingGuest(customer);
  };

  // Called when an existing guest is edited and saved via the modal form.
  const handleGuestUpdated = (customer: Customer) => {
    if (data.primaryGuest?.id === customer.id) {
      onDataChange({
        primaryGuest: customer,
        customerId: customer.id,
        primaryGuestName: customer.name
      });
    } else {
      const updatedGuests = ((data.additionalGuests as Customer[] | undefined) || []).map((g) =>
        g.id === customer.id ? customer : g
      );
      onDataChange({ additionalGuests: updatedGuests });
    }
    setEditingGuest(null);
  };

  // IDs already used by the booking, so they're excluded from search results.
  const additionalGuestIds = (data.additionalGuests as Customer[] | undefined)?.map((g) => g.id) || [];
  const excludeCustomerIds = data.primaryGuest
    ? [data.primaryGuest.id, ...additionalGuestIds]
    : additionalGuestIds;

  // Rich card used for the primary guest.
  const renderPrimaryCard = (customer: Customer) => (
    <div className="p-4 border rounded-lg bg-blue-50 border-blue-200">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <h3 className="font-semibold text-base sm:text-lg truncate">{customer.name}</h3>
            <Badge className="bg-blue-600">Primary Guest</Badge>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-700">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-gray-500 flex-shrink-0" />
              <span className="truncate">{customer.phone}</span>
            </div>
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-gray-500 flex-shrink-0" />
              <span className="truncate">
                {idTypeLabels[customer.id_type]} - {customer.id_number}
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleEditGuest(customer)}
            aria-label="Edit primary guest"
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPrimarySearchOpen((v) => !v)}
            aria-label="Change primary guest"
          >
            <Search className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );

  // Compact single-row layout for each additional guest.
  const renderAdditionalGuestRow = (customer: Customer) => (
    <div
      key={customer.id}
      className="flex items-center justify-between gap-2 px-3 py-2 border rounded-md bg-gray-50"
    >
      <div className="min-w-0 flex-1">
        <p className="font-medium text-sm truncate">{customer.name}</p>
        <p className="text-xs text-gray-500 truncate">
          {customer.phone} • {idTypeLabels[customer.id_type]}
        </p>
      </div>
      <div className="flex gap-1 flex-shrink-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleEditGuest(customer)}
          className="h-8 w-8 p-0"
          aria-label={`Edit ${customer.name}`}
        >
          <Edit className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleRemoveGuest(customer.id)}
          className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
          aria-label={`Remove ${customer.name}`}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
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
        <CardContent className="space-y-4">
          {data.primaryGuest && !primarySearchOpen ? (
            renderPrimaryCard(data.primaryGuest)
          ) : (
            <div className="space-y-3">
              {data.primaryGuest && (
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-700">Change primary guest</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setPrimarySearchOpen(false)}
                    aria-label="Cancel changing primary guest"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}
              {/* Inline customer search + create (no modals). */}
              <CustomerSelection
                onCustomerSelect={handlePrimaryGuestSelect}
                showCreateNew={true}
                excludeCustomerIds={excludeCustomerIds}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Additional Guests (collapsible) */}
      {data.primaryGuest && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setAdditionalGuestsExpanded((v) => !v)}
                className="flex items-center gap-2 text-left flex-1 min-w-0"
                aria-expanded={additionalGuestsExpanded}
                aria-controls="additional-guests-panel"
              >
                {additionalGuestsExpanded ? (
                  <ChevronDown className="w-4 h-4 flex-shrink-0" />
                ) : (
                  <ChevronRight className="w-4 h-4 flex-shrink-0" />
                )}
                <UserPlus className="w-5 h-5 flex-shrink-0" />
                <span className="font-semibold">Additional Guests</span>
                <Badge variant="outline" className="text-xs">
                  {additionalGuestIds.length}
                </Badge>
              </button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setAdditionalGuestsExpanded(true);
                  setAddGuestSearchOpen((v) => !v);
                }}
                className="flex-shrink-0"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Guest
              </Button>
            </div>
          </CardHeader>

          {additionalGuestsExpanded && (
            <CardContent id="additional-guests-panel" className="space-y-3 pt-0">
              {/* Inline add-guest search panel, revealed one at a time. */}
              {addGuestSearchOpen && (
                <div className="rounded-lg border p-3 bg-gray-50/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-700">Add a guest</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setAddGuestSearchOpen(false)}
                      aria-label="Close add guest"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  <CustomerSelection
                    onCustomerSelect={handleAddAdditionalGuest}
                    showCreateNew={true}
                    excludeCustomerIds={excludeCustomerIds}
                  />
                </div>
              )}

              {additionalGuestIds.length > 0 ? (
                <div className="space-y-2">
                  {(data.additionalGuests as Customer[]).map((guest) => renderAdditionalGuestRow(guest))}
                </div>
              ) : (
                !addGuestSearchOpen && (
                  <p className="text-sm text-gray-500 py-2">
                    No additional guests added. Click &quot;Add Guest&quot; to include more.
                  </p>
                )
              )}

              <div className="flex items-center justify-between text-sm pt-2 border-t">
                <span className="text-gray-600">Total Guests</span>
                <span className="font-medium text-blue-600">
                  {totalSelectedGuests} guest{totalSelectedGuests > 1 ? 's' : ''}
                </span>
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* Edit existing guest (modal form only for editing) */}
      {editingGuest?.id && (
        <AddCustomerFormBooking
          isOpen={!!editingGuest}
          onOpenChange={(open: boolean) => {
            if (!open) {
              setEditingGuest(null);
            }
          }}
          customer={editingGuest}
          onSuccess={handleGuestUpdated}
        />
      )}
    </div>
  );
} 