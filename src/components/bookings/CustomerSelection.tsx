'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Search, Plus, User, Phone, Mail, MapPin, CreditCard } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Database } from '@/lib/supabase/types';
import { toast } from 'sonner';

type Customer = Database['public']['Tables']['customers']['Row'];

interface CustomerSelectionProps {
  onCustomerSelect: (customer: Customer) => void;
  showCreateNew?: boolean;
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

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    filterCustomers();
  }, [customers, searchTerm, excludeCustomerIds]);

  const fetchCustomers = async () => {
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
  };

  const filterCustomers = () => {
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
  };

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

  return (
    <div className="space-y-4">
      {/* Search Header */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search by name, phone, email, or ID number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        {showCreateNew && (
          <Button onClick={onCreateNew} variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            New Customer
          </Button>
        )}
      </div>

      {/* Results */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {filteredCustomers.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <User className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-lg font-medium mb-2">
              {searchTerm ? 'No customers found' : 'No customers available'}
            </p>
            <p className="text-sm">
              {searchTerm ? 'Try adjusting your search terms' : 'Start by creating a new customer'}
            </p>
            {showCreateNew && (
              <Button onClick={onCreateNew} className="mt-4">
                <Plus className="w-4 h-4 mr-2" />
                Create New Customer
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-2">
            {filteredCustomers.map((customer) => (
              <Card 
                key={customer.id} 
                className="cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-blue-500"
                onClick={() => onCustomerSelect(customer)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {customer.name}
                        </h3>
                        <Badge variant="outline" className="text-xs">
                          {idTypeLabels[customer.id_type]}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Phone className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{customer.phone}</span>
                        </div>
                        
                        {customer.email && (
                          <div className="flex items-center gap-1">
                            <Mail className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{customer.email}</span>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-1">
                          <CreditCard className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{customer.id_number}</span>
                        </div>
                        
                        {customer.city && customer.state && (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{customer.city}, {customer.state}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="ml-2 flex-shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        onCustomerSelect(customer);
                      }}
                    >
                      Select
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {filteredCustomers.length > 0 && (
        <div className="text-center text-sm text-gray-500 pt-2 border-t">
          Showing {filteredCustomers.length} customer{filteredCustomers.length !== 1 ? 's' : ''}
          {searchTerm && ` matching "${searchTerm}"`}
        </div>
      )}
    </div>
  );
} 