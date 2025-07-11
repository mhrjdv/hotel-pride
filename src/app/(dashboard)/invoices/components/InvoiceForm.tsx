'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Trash2, 
  Save, 
  Send, 
  Calculator,
  Building,
  User,
  FileText,
  DollarSign
} from 'lucide-react';
import { toast } from 'sonner';
import { InvoiceFormData, InvoiceLineItemFormData, ITEM_TYPES } from '@/lib/types/invoice';
import { calculateInvoiceTotal, formatCurrency } from '@/lib/utils/invoice-calculations';

interface InvoiceFormProps {
  initialData?: Partial<InvoiceFormData>;
  invoiceId?: string;
  mode?: 'create' | 'edit';
}

export default function InvoiceForm({ initialData, invoiceId, mode = 'create' }: InvoiceFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<InvoiceFormData>({
    invoice_type: 'invoice',
    customer_type: 'individual',
    invoice_date: new Date().toISOString().split('T')[0],
    customer_name: '',
    hotel_name: 'Hotel Pride',
    hotel_address: 'Hotel Pride Address',
    hotel_city: 'Your City',
    hotel_state: 'Your State',
    hotel_pincode: '000000',
    hotel_country: 'India',
    currency: 'INR',
    status: 'draft',
    show_bank_details: true,
    is_email_enabled: false,
    line_items: [
      {
        item_type: 'room',
        custom_item_type_id: undefined,
        description: '',
        quantity: 1,
        unit_price: 0,
        gst_rate: 12,
        gst_inclusive: false,
        gst_name: 'GST',
        discount_rate: 0,
        is_buffet_item: false,
        buffet_type: undefined,
        persons_count: 1,
        price_per_person: 0,
        item_date: undefined,
        sort_order: 0,
      }
    ],
    ...initialData,
  });

  const [calculations, setCalculations] = useState(calculateInvoiceTotal(formData.line_items));

  // Recalculate totals when line items change
  useEffect(() => {
    setCalculations(calculateInvoiceTotal(formData.line_items));
  }, [formData.line_items]);

  const handleInputChange = (field: keyof InvoiceFormData, value: string | number | boolean | string[]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleLineItemChange = (index: number, field: keyof InvoiceLineItemFormData, value: string | number | boolean | undefined) => {
    setFormData(prev => ({
      ...prev,
      line_items: prev.line_items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const addLineItem = () => {
    setFormData(prev => ({
      ...prev,
      line_items: [
        ...prev.line_items,
        {
          item_type: 'service',
          custom_item_type_id: undefined,
          description: '',
          quantity: 1,
          unit_price: 0,
          gst_rate: 12,
          gst_inclusive: false,
          gst_name: 'GST',
          discount_rate: 0,
          is_buffet_item: false,
          buffet_type: undefined,
          persons_count: 1,
          price_per_person: 0,
          item_date: undefined,
          sort_order: prev.line_items.length,
        }
      ],
    }));
  };

  const removeLineItem = (index: number) => {
    if (formData.line_items.length === 1) {
      toast.error('At least one line item is required');
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      line_items: prev.line_items.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (status: 'draft' | 'sent' = 'draft') => {
    try {
      setLoading(true);

      // Validate required fields
      if (!formData.customer_name.trim()) {
        toast.error('Customer name is required');
        return;
      }

      if (!formData.invoice_date) {
        toast.error('Invoice date is required');
        return;
      }

      if (formData.line_items.some(item => !item.description.trim())) {
        toast.error('All line items must have a description');
        return;
      }

      const submitData = {
        ...formData,
        status,
      };

      const url = mode === 'edit' ? `/api/invoices/${invoiceId}` : '/api/invoices';
      const method = mode === 'edit' ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(mode === 'edit' ? 'Invoice updated successfully' : 'Invoice created successfully');
        router.push(`/invoices/${data.data.id}`);
      } else {
        toast.error(data.error || 'Failed to save invoice');
      }
    } catch (error) {
      console.error('Error saving invoice:', error);
      toast.error('Failed to save invoice');
    } finally {
      setLoading(false);
    }
  };

  const getItemTypeIcon = (type: string) => {
    const itemType = ITEM_TYPES.find(t => t.value === type);
    return itemType?.icon || '📋';
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Invoice Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Invoice Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="invoice_number">Invoice Number</Label>
              <Input
                id="invoice_number"
                value={formData.invoice_number || ''}
                onChange={(e) => handleInputChange('invoice_number', e.target.value)}
                placeholder="Auto-generated"
              />
            </div>
            <div>
              <Label htmlFor="invoice_date">Invoice Date *</Label>
              <Input
                id="invoice_date"
                type="date"
                value={formData.invoice_date}
                onChange={(e) => handleInputChange('invoice_date', e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="due_date">Due Date</Label>
              <Input
                id="due_date"
                type="date"
                value={formData.due_date || ''}
                onChange={(e) => handleInputChange('due_date', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customer Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Customer Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="customer_name">Customer Name *</Label>
              <Input
                id="customer_name"
                value={formData.customer_name}
                onChange={(e) => handleInputChange('customer_name', e.target.value)}
                placeholder="Enter customer name"
                required
              />
            </div>
            <div>
              <Label htmlFor="customer_email">Email</Label>
              <Input
                id="customer_email"
                type="email"
                value={formData.customer_email || ''}
                onChange={(e) => handleInputChange('customer_email', e.target.value)}
                placeholder="customer@example.com"
              />
            </div>
            <div>
              <Label htmlFor="customer_phone">Phone</Label>
              <Input
                id="customer_phone"
                value={formData.customer_phone || ''}
                onChange={(e) => handleInputChange('customer_phone', e.target.value)}
                placeholder="+91 9876543210"
              />
            </div>
            <div>
              <Label htmlFor="customer_gst_number">GST Number</Label>
              <Input
                id="customer_gst_number"
                value={formData.customer_gst_number || ''}
                onChange={(e) => handleInputChange('customer_gst_number', e.target.value)}
                placeholder="GST Number (if applicable)"
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="customer_address">Address</Label>
            <Textarea
              id="customer_address"
              value={formData.customer_address || ''}
              onChange={(e) => handleInputChange('customer_address', e.target.value)}
              placeholder="Customer address"
              rows={3}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="customer_city">City</Label>
              <Input
                id="customer_city"
                value={formData.customer_city || ''}
                onChange={(e) => handleInputChange('customer_city', e.target.value)}
                placeholder="City"
              />
            </div>
            <div>
              <Label htmlFor="customer_state">State</Label>
              <Input
                id="customer_state"
                value={formData.customer_state || ''}
                onChange={(e) => handleInputChange('customer_state', e.target.value)}
                placeholder="State"
              />
            </div>
            <div>
              <Label htmlFor="customer_pincode">PIN Code</Label>
              <Input
                id="customer_pincode"
                value={formData.customer_pincode || ''}
                onChange={(e) => handleInputChange('customer_pincode', e.target.value)}
                placeholder="PIN Code"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Hotel Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Hotel Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="hotel_name">Hotel Name</Label>
              <Input
                id="hotel_name"
                value={formData.hotel_name}
                onChange={(e) => handleInputChange('hotel_name', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="hotel_email">Email</Label>
              <Input
                id="hotel_email"
                type="email"
                value={formData.hotel_email || ''}
                onChange={(e) => handleInputChange('hotel_email', e.target.value)}
                placeholder="hotel@example.com"
              />
            </div>
            <div>
              <Label htmlFor="hotel_phone">Phone</Label>
              <Input
                id="hotel_phone"
                value={formData.hotel_phone || ''}
                onChange={(e) => handleInputChange('hotel_phone', e.target.value)}
                placeholder="+91 9876543210"
              />
            </div>
            <div>
              <Label htmlFor="hotel_gst_number">GST Number</Label>
              <Input
                id="hotel_gst_number"
                value={formData.hotel_gst_number || ''}
                onChange={(e) => handleInputChange('hotel_gst_number', e.target.value)}
                placeholder="Hotel GST Number"
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="hotel_address">Address</Label>
            <Textarea
              id="hotel_address"
              value={formData.hotel_address}
              onChange={(e) => handleInputChange('hotel_address', e.target.value)}
              rows={3}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="hotel_city">City</Label>
              <Input
                id="hotel_city"
                value={formData.hotel_city}
                onChange={(e) => handleInputChange('hotel_city', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="hotel_state">State</Label>
              <Input
                id="hotel_state"
                value={formData.hotel_state}
                onChange={(e) => handleInputChange('hotel_state', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="hotel_pincode">PIN Code</Label>
              <Input
                id="hotel_pincode"
                value={formData.hotel_pincode}
                onChange={(e) => handleInputChange('hotel_pincode', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Line Items */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Invoice Items
            </CardTitle>
            <Button onClick={addLineItem} variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {formData.line_items.map((item, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{getItemTypeIcon(item.item_type)}</span>
                    <Badge variant="outline">Item {index + 1}</Badge>
                  </div>
                  {formData.line_items.length > 1 && (
                    <Button
                      onClick={() => removeLineItem(index)}
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <Label>Item Type</Label>
                    <Select
                      value={item.item_type}
                      onValueChange={(value) => handleLineItemChange(index, 'item_type', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ITEM_TYPES.map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            <span className="flex items-center gap-2">
                              <span>{type.icon}</span>
                              {type.label}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="md:col-span-3">
                    <Label>Description *</Label>
                    <Input
                      value={item.description}
                      onChange={(e) => handleLineItemChange(index, 'description', e.target.value)}
                      placeholder="Item description"
                      required
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  <div>
                    <Label>Quantity</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.quantity}
                      onChange={(e) => handleLineItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  
                  <div>
                    <Label>Unit Price</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unit_price}
                      onChange={(e) => handleLineItemChange(index, 'unit_price', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  
                  <div>
                    <Label>Tax Rate (%)</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={item.gst_rate}
                      onChange={(e) => handleLineItemChange(index, 'gst_rate', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  
                  <div>
                    <Label>Discount (%)</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={item.discount_rate}
                      onChange={(e) => handleLineItemChange(index, 'discount_rate', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2 pt-6">
                    <Switch
                      id={`tax-inclusive-${index}`}
                      checked={item.gst_inclusive}
                      onCheckedChange={(checked) => handleLineItemChange(index, 'gst_inclusive', checked)}
                    />
                    <Label htmlFor={`tax-inclusive-${index}`} className="text-sm">
                      Tax Inclusive
                    </Label>
                  </div>
                  
                  <div className="pt-6">
                    <div className="text-sm text-gray-600">Line Total:</div>
                    <div className="font-semibold">
                      {formatCurrency(calculations.line_items[index]?.final_amount || 0)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Invoice Totals */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Invoice Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-w-md ml-auto">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>{formatCurrency(calculations.subtotal)}</span>
            </div>
            {calculations.total_discount > 0 && (
              <div className="flex justify-between text-red-600">
                <span>Total Discount:</span>
                <span>-{formatCurrency(calculations.total_discount)}</span>
              </div>
            )}
            {calculations.total_tax > 0 && (
              <div className="flex justify-between">
                <span>Total Tax:</span>
                <span>{formatCurrency(calculations.total_tax)}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between text-lg font-bold">
              <span>Total Amount:</span>
              <span>{formatCurrency(calculations.total_amount)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notes and Terms */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes || ''}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Internal notes (not visible to customer)"
              rows={3}
            />
          </div>
          
          <div>
            <Label htmlFor="terms_and_conditions">Terms and Conditions</Label>
            <Textarea
              id="terms_and_conditions"
              value={formData.terms_and_conditions || ''}
              onChange={(e) => handleInputChange('terms_and_conditions', e.target.value)}
              placeholder="Terms and conditions for this invoice"
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-end">
        <Button
          variant="outline"
          onClick={() => router.back()}
          disabled={loading}
        >
          Cancel
        </Button>
        
        <Button
          onClick={() => handleSubmit('draft')}
          disabled={loading}
          variant="outline"
        >
          <Save className="h-4 w-4 mr-2" />
          {loading ? 'Saving...' : 'Save as Draft'}
        </Button>
        
        <Button
          onClick={() => handleSubmit('sent')}
          disabled={loading}
        >
          <Send className="h-4 w-4 mr-2" />
          {loading ? 'Saving...' : 'Save & Send'}
        </Button>
      </div>
    </div>
  );
}
