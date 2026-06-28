'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Search, Plus, User } from '@/components/icons';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Database } from '@/lib/supabase/types';
import { toast } from 'sonner';
import { AddCustomerFormBooking } from './AddCustomerFormBooking';

type Customer = Database['public']['Tables']['customers']['Row'];

interface CustomerSelectionProps {
  onCustomerSelect: (customer: Customer) => void;
  showCreateNew?: boolean;
  /**
   * Optional override for the "New Customer" action. When omitted, CustomerSelection
   * reveals an inline embedded new-customer form within the section itself.
   */
  onCreateNew?: () => void;
  excludeCustomerIds?: string[];
}

const idTypeLabels = {
  'aadhaar': 'Aadhaar',
  'pan': 'PAN',
  'passport': 'Passport',
  'driving_license': 'Driving License',
  'voter_id': 'Voter ID',
};

export function CustomerSelection({ 
  onCustomerSelect, 
  showCreateNew = true, 
  onCreateNew,
  excludeCustomerIds = []
}: CustomerSelectionProps) {
  const supabase = createClient();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showInlineForm, setShowInlineForm] = useState(false);

  // If no custom handler is provided, manage an inline embedded new-customer form.
  const useInlineForm = !onCreateNew;

  const handleCreateNewClick = () => {
    if (onCreateNew) {
      onCreateNew();
    } else {
      setShowInlineForm(true);
    }
  };

  const handleInlineCustomerCreated = (customer: Customer) => {
    setShowInlineForm(false);
    // Refresh the list so the new customer is available for future selections.
    fetchCustomers();
    onCustomerSelect(customer);
  };

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      toast.error('Failed to load customers');
      console.error('Error fetching customers:', error);
    } else {
      setCustomers(data || []);
    }
    setLoading(false);
  }, [supabase]);

  const filterCustomers = useCallback(() => {
    let filtered = customers.filter(customer => 
      !excludeCustomerIds.includes(customer.id)
    );

    if (searchTerm) {
      const query = searchTerm.toLowerCase();
      filtered = filtered.filter(customer => 
        customer.name.toLowerCase().includes(query) ||
        customer.phone.includes(query) ||
        customer.email?.toLowerCase().includes(query) ||
        customer.id_number.toLowerCase().includes(query)
      );
    }

    setFilteredCustomers(filtered);
  }, [customers, searchTerm, excludeCustomerIds]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  useEffect(() => {
    filterCustomers();
  }, [filterCustomers]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading customers...</p>
        </div>
      </div>
    );
  }

  // Inline embedded new-customer form replaces the search UI while open.
  if (useInlineForm && showInlineForm) {
    return (
      <AddCustomerFormBooking
        inline
        isOpen
        onOpenChange={(open) => {
          if (!open) setShowInlineForm(false);
        }}
        onSuccess={handleInlineCustomerCreated}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Search Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search by name, phone, email, or ID number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            aria-label="Search customers"
          />
        </div>
        {showCreateNew && (
          <Button onClick={handleCreateNewClick} variant="outline" className="sm:w-auto w-full">
            <Plus className="w-4 h-4 mr-2" />
            New Customer
          </Button>
        )}
      </div>

      {/* Results */}
      {filteredCustomers.length === 0 ? (
        <div className="text-center py-8 text-gray-500 border rounded-lg">
          <User className="w-10 h-10 mx-auto text-gray-400 mb-3" />
          <p className="text-base font-medium mb-1">
            {searchTerm ? 'No customers found' : 'No customers available'}
          </p>
          <p className="text-sm">
            {searchTerm ? 'Try adjusting your search terms' : 'Start by creating a new customer'}
          </p>
          {showCreateNew && (
            <Button onClick={handleCreateNewClick} className="mt-4">
              <Plus className="w-4 h-4 mr-2" />
              Create New Customer
            </Button>
          )}
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <ul
            className="divide-y max-h-72 overflow-y-auto"
            role="listbox"
            aria-label="Customer search results"
          >
            {filteredCustomers.map((customer) => (
              <li key={customer.id} role="option" aria-selected={false}>
                <button
                  type="button"
                  onClick={() => onCustomerSelect(customer)}
                  className="w-full text-left px-3 py-2.5 hover:bg-blue-50 focus:bg-blue-50 focus:outline-none transition-colors flex items-center justify-between gap-3"
                >
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="font-medium text-gray-900 truncate">{customer.name}</span>
                      <Badge variant="outline" className="text-xs flex-shrink-0">
                        {idTypeLabels[customer.id_type]}
                      </Badge>
                    </span>
                    <span className="block text-xs text-gray-500 truncate">
                      {customer.phone}
                      {customer.email ? ` • ${customer.email}` : ''}
                      {customer.city ? ` • ${customer.city}` : ''}
                    </span>
                  </span>
                  <span className="text-xs font-medium text-blue-600 flex-shrink-0">Select</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {filteredCustomers.length > 0 && (
        <p className="text-xs text-gray-500">
          Showing {filteredCustomers.length} customer{filteredCustomers.length !== 1 ? 's' : ''}
          {searchTerm && ` matching "${searchTerm}"`}
        </p>
      )}
    </div>
  );
} 