'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Plus,
  Trash2,
  Save,
  Send,
  Eye,
  Calculator,
  User,
  FileText,
  Settings
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  InvoiceFormData, 
  InvoiceLineItemFormData, 
  HotelConfig,
  CustomItemType,
  INVOICE_TYPES,
  CUSTOMER_TYPES,
  BUFFET_TYPES
} from '@/lib/types/invoice';
import { calculateInvoiceTotal, formatCurrency } from '@/lib/utils/invoice-calculations';
import InvoiceLivePreview from './InvoiceLivePreview';

interface EnhancedInvoiceFormProps {
  initialData?: Partial<InvoiceFormData>;
  invoiceId?: string;
  mode?: 'create' | 'edit';
}

export default function EnhancedInvoiceForm({ initialData, invoiceId, mode = 'create' }: EnhancedInvoiceFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [hotelConfig, setHotelConfig] = useState<HotelConfig | null>(null);
  const [customItemTypes, setCustomItemTypes] = useState<CustomItemType[]>([]);
  const [previewMode, setPreviewMode] = useState<'split' | 'form' | 'preview'>('split');

  const [formData, setFormData] = useState<InvoiceFormData>({
    invoice_date: new Date().toISOString().split('T')[0],
    invoice_type: 'invoice',
    customer_type: 'individual',
    customer_name: '',
    customer_country: 'India',
    hotel_name: 'Hotel Pride',
    hotel_address: 'Hotel Pride Address',
    hotel_city: 'Your City',
    hotel_state: 'Your State',
    hotel_pincode: '000000',
    hotel_country: 'India',
    currency: 'INR',
    status: 'draft',
    show_bank_details: true,
    is_email_enabled: true,
    line_items: [
      {
        item_type: 'room',
        description: '',
        quantity: 1,
        unit_price: 0,
        gst_rate: 12,
        gst_inclusive: false,
        gst_name: 'GST',
        discount_rate: 0,
        is_buffet_item: false,
        persons_count: 1,
        price_per_person: 0,
        sort_order: 0,
      }
    ],
    ...initialData,
  });

  // Load hotel config and custom item types
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load hotel config
        const configResponse = await fetch('/api/hotel/config');
        if (configResponse.ok) {
          const configData = await configResponse.json();
          if (configData.success) {
            setHotelConfig(configData.data);
            // Update form with hotel config using new field names
            setFormData(prev => ({
              ...prev,
              hotel_name: configData.data.hotel_name || 'Hotel Pride',
              hotel_address: configData.data.hotel_address || 'Hotel Address',
              hotel_city: configData.data.hotel_city || 'Your City',
              hotel_state: configData.data.hotel_state || 'Your State',
              hotel_pincode: configData.data.hotel_pincode || '000000',
              hotel_country: configData.data.hotel_country || 'India',
              hotel_phone: configData.data.hotel_phone || '+91-0000000000',
              hotel_email: configData.data.hotel_email || 'hotel@example.com',
              hotel_gst_number: configData.data.hotel_gst_number || 'GST_NUMBER_HERE',
              hotel_website: configData.data.hotel_website || '',

              // Use system defaults from settings
              currency: configData.data.default_currency || 'INR',
              show_bank_details: configData.data.show_bank_details_default !== false,
              is_email_enabled: configData.data.email_enabled_default !== false,

              // Use invoice settings from hotel config
              terms_and_conditions: configData.data.invoice_terms_and_conditions || 'Payment due within 15 days from invoice date. Late payment charges may apply. All disputes subject to local jurisdiction.',
            }));
          }
        }

        // Load custom item types
        const itemTypesResponse = await fetch('/api/invoice/item-types');
        if (itemTypesResponse.ok) {
          const itemTypesData = await itemTypesResponse.json();
          if (itemTypesData.success) {
            setCustomItemTypes(itemTypesData.data);
          }
        }
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };

    loadData();
  }, []);

  const handleInputChange = (field: keyof InvoiceFormData, value: string | number | boolean | string[]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleLineItemChange = (index: number, field: keyof InvoiceLineItemFormData, value: string | number | boolean | undefined) => {
    setFormData(prev => ({
      ...prev,
      line_items: prev.line_items.map((item, i) => {
        if (i === index) {
          const updatedItem = { ...item, [field]: value };
          
          // Handle buffet item logic
          if (field === 'is_buffet_item' && value) {
            const buffetPrice = hotelConfig?.buffet_breakfast_price || 0;
            updatedItem.price_per_person = buffetPrice;
            updatedItem.unit_price = buffetPrice * updatedItem.persons_count;
            updatedItem.buffet_type = 'breakfast';
          }
          
          // Handle buffet type change
          if (field === 'buffet_type' && updatedItem.is_buffet_item) {
            const buffetPrices = {
              breakfast: hotelConfig?.buffet_breakfast_price || 0,
              lunch: hotelConfig?.buffet_lunch_price || 0,
              dinner: hotelConfig?.buffet_dinner_price || 0,
            };
            updatedItem.price_per_person = buffetPrices[value as keyof typeof buffetPrices];
            updatedItem.unit_price = updatedItem.price_per_person * updatedItem.persons_count;
          }
          
          // Handle persons count change for buffet items
          if (field === 'persons_count' && updatedItem.is_buffet_item && typeof value === 'number') {
            updatedItem.unit_price = updatedItem.price_per_person * value;
          }
          
          // Handle custom item type selection
          if (field === 'custom_item_type_id') {
            const customType = customItemTypes.find(t => t.id === value);
            if (customType) {
              updatedItem.gst_rate = customType.default_gst_rate;
              updatedItem.item_type = 'custom';
            }
          }

          // Handle basic item type selection
          if (field === 'item_type') {
            // Clear custom item type when selecting basic type
            updatedItem.custom_item_type_id = undefined;

            // Set default GST rates for basic types
            switch (value) {
              case 'room':
                updatedItem.gst_rate = 12;
                break;
              case 'food':
                updatedItem.gst_rate = 5;
                break;
              case 'service':
                updatedItem.gst_rate = 18;
                break;
              case 'extra':
                updatedItem.gst_rate = 12;
                break;
              case 'discount':
                updatedItem.gst_rate = 0;
                break;
              case 'other':
                updatedItem.gst_rate = 12;
                break;
              default:
                updatedItem.gst_rate = 12;
            }
          }
          
          return updatedItem;
        }
        return item;
      }),
    }));
  };

  const addLineItem = () => {
    setFormData(prev => ({
      ...prev,
      line_items: [
        ...prev.line_items,
        {
          item_type: 'room',
          description: '',
          quantity: 1,
          unit_price: 0,
          gst_rate: 12,
          gst_inclusive: false,
          gst_name: 'GST',
          discount_rate: 0,
          is_buffet_item: false,
          persons_count: 1,
          price_per_person: 0,
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

  const handlePreview = () => {
    // Open preview in new tab
    const previewData = encodeURIComponent(JSON.stringify(formData));
    window.open(`/invoices/preview?data=${previewData}`, '_blank');
  };

  const calculations = calculateInvoiceTotal(formData.line_items.map(item => ({
    ...item,
    tax_rate: item.gst_rate,
    tax_inclusive: item.gst_inclusive,
    tax_name: item.gst_name,
  })));

  return (
    <div className="max-w-full mx-auto">
      {/* Header Controls */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">
            {mode === 'edit' ? 'Edit' : 'Create'} {INVOICE_TYPES.find(t => t.value === formData.invoice_type)?.label}
          </h1>
          <Badge variant="outline" className="text-lg px-3 py-1">
            {formatCurrency(calculations.total_amount)}
          </Badge>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handlePreview}>
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          
          <Select value={previewMode} onValueChange={(value: string) => setPreviewMode(value as 'split' | 'form' | 'preview')}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="split">Split View</SelectItem>
              <SelectItem value="form">Form Only</SelectItem>
              <SelectItem value="preview">Preview Only</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Main Content */}
      <div className={`grid gap-6 ${previewMode === 'split' ? 'grid-cols-1 xl:grid-cols-2' : 'grid-cols-1'}`}>
        {/* Form Section */}
        {(previewMode === 'split' || previewMode === 'form') && (
          <div className="space-y-6">
            {/* Invoice Type & Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Invoice Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="invoice_type">Invoice Type</Label>
                    <Select
                      value={formData.invoice_type}
                      onValueChange={(value) => handleInputChange('invoice_type', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {INVOICE_TYPES.map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
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
                <div>
                  <Label>Customer Type</Label>
                  <Select
                    value={formData.customer_type}
                    onValueChange={(value) => handleInputChange('customer_type', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CUSTOMER_TYPES.map(type => (
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

                {formData.customer_type === 'company' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="company_name">Company Name *</Label>
                      <Input
                        id="company_name"
                        value={formData.company_name || ''}
                        onChange={(e) => handleInputChange('company_name', e.target.value)}
                        placeholder="Company name"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="company_contact_person">Contact Person</Label>
                      <Input
                        id="company_contact_person"
                        value={formData.company_contact_person || ''}
                        onChange={(e) => handleInputChange('company_contact_person', e.target.value)}
                        placeholder="Contact person name"
                      />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="customer_name">
                      {formData.customer_type === 'company' ? 'Contact Person Name *' : 'Customer Name *'}
                    </Label>
                    <Input
                      id="customer_name"
                      value={formData.customer_name}
                      onChange={(e) => handleInputChange('customer_name', e.target.value)}
                      placeholder="Enter name"
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
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <Label htmlFor="customer_gst_number">
                      {formData.customer_type === 'company' ? 'Company GST Number' : 'GST Number'}
                    </Label>
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
              </CardContent>
            </Card>

            {/* Line Items */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Calculator className="h-5 w-5" />
                    Line Items
                  </span>
                  <Button onClick={addLineItem} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {formData.line_items.map((item, index) => (
                  <div key={index} className="p-4 border rounded-lg space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Item {index + 1}</h4>
                      {formData.line_items.length > 1 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeLineItem(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Item Type</Label>
                        <Select
                          value={item.custom_item_type_id || item.item_type}
                          onValueChange={(value) => {
                            // Check if it's a custom item type (UUID format)
                            if (customItemTypes.find(t => t.id === value)) {
                              handleLineItemChange(index, 'custom_item_type_id', value);
                            } else {
                              // It's a basic item type
                              handleLineItemChange(index, 'item_type', value);
                              handleLineItemChange(index, 'custom_item_type_id', undefined);
                            }
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {/* Basic Item Types */}
                            <SelectItem value="room">
                              <span className="flex items-center gap-2">
                                <span>🏨</span>
                                Room Charges
                              </span>
                            </SelectItem>
                            <SelectItem value="food">
                              <span className="flex items-center gap-2">
                                <span>🍽️</span>
                                Food & Beverage
                              </span>
                            </SelectItem>
                            <SelectItem value="service">
                              <span className="flex items-center gap-2">
                                <span>🛎️</span>
                                Service Charges
                              </span>
                            </SelectItem>
                            <SelectItem value="extra">
                              <span className="flex items-center gap-2">
                                <span>➕</span>
                                Extra Charges
                              </span>
                            </SelectItem>
                            <SelectItem value="discount">
                              <span className="flex items-center gap-2">
                                <span>💰</span>
                                Discount
                              </span>
                            </SelectItem>
                            <SelectItem value="other">
                              <span className="flex items-center gap-2">
                                <span>📋</span>
                                Other
                              </span>
                            </SelectItem>

                            {/* Custom Item Types */}
                            {customItemTypes.length > 0 && (
                              <>
                                <div className="px-2 py-1 text-xs font-semibold text-gray-500 border-t">
                                  Custom Types
                                </div>
                                {customItemTypes.map(type => (
                                  <SelectItem key={type.id} value={type.id}>
                                    <span className="flex items-center gap-2">
                                      <span>{type.icon}</span>
                                      {type.name}
                                    </span>
                                  </SelectItem>
                                ))}
                              </>
                            )}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                          id={`buffet-${index}`}
                          checked={item.is_buffet_item}
                          onCheckedChange={(checked) => handleLineItemChange(index, 'is_buffet_item', checked)}
                        />
                        <Label htmlFor={`buffet-${index}`}>Buffet Item</Label>
                      </div>
                    </div>

                    {item.is_buffet_item && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-3 bg-blue-50 rounded">
                        <div>
                          <Label>Buffet Type</Label>
                          <Select
                            value={item.buffet_type || 'breakfast'}
                            onValueChange={(value) => handleLineItemChange(index, 'buffet_type', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {BUFFET_TYPES.map(type => (
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
                        <div>
                          <Label>Number of Persons</Label>
                          <Input
                            type="number"
                            min="1"
                            value={item.persons_count}
                            onChange={(e) => handleLineItemChange(index, 'persons_count', parseInt(e.target.value) || 1)}
                          />
                        </div>
                        <div>
                          <Label>Price per Person</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={item.price_per_person}
                            onChange={(e) => handleLineItemChange(index, 'price_per_person', parseFloat(e.target.value) || 0)}
                          />
                        </div>
                      </div>
                    )}

                    <div>
                      <Label>Description *</Label>
                      <Input
                        value={item.description}
                        onChange={(e) => handleLineItemChange(index, 'description', e.target.value)}
                        placeholder="Item description"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <Label>Quantity</Label>
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleLineItemChange(index, 'quantity', parseInt(e.target.value) || 1)}
                        />
                      </div>
                      <div>
                        <Label>Unit Price</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={item.unit_price}
                          onChange={(e) => handleLineItemChange(index, 'unit_price', parseFloat(e.target.value) || 0)}
                          disabled={item.is_buffet_item}
                        />
                      </div>
                      <div>
                        <Label>GST Rate (%)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          value={item.gst_rate}
                          onChange={(e) => handleLineItemChange(index, 'gst_rate', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div>
                        <Label>Discount (%)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          value={item.discount_rate}
                          onChange={(e) => handleLineItemChange(index, 'discount_rate', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id={`gst-inclusive-${index}`}
                        checked={item.gst_inclusive}
                        onCheckedChange={(checked) => handleLineItemChange(index, 'gst_inclusive', checked)}
                      />
                      <Label htmlFor={`gst-inclusive-${index}`}>GST Inclusive</Label>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Invoice Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="show_bank_details"
                      checked={formData.show_bank_details}
                      onCheckedChange={(checked) => handleInputChange('show_bank_details', checked)}
                    />
                    <Label htmlFor="show_bank_details">Show Bank Details</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_email_enabled"
                      checked={formData.is_email_enabled}
                      onCheckedChange={(checked) => handleInputChange('is_email_enabled', checked)}
                    />
                    <Label htmlFor="is_email_enabled">Enable Email Sending</Label>
                  </div>
                </div>

                <div>
                  <Label htmlFor="terms_and_conditions">Terms and Conditions</Label>
                  <Textarea
                    id="terms_and_conditions"
                    value={formData.terms_and_conditions || ''}
                    onChange={(e) => handleInputChange('terms_and_conditions', e.target.value)}
                    placeholder="Enter terms and conditions"
                    rows={4}
                  />
                </div>

                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes || ''}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    placeholder="Internal notes (not shown on invoice)"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-6">
              <Button
                variant="outline"
                onClick={() => {
                  if (mode === 'edit' && invoiceId) {
                    router.push(`/invoices/${invoiceId}`);
                  } else {
                    router.push('/invoices');
                  }
                }}
              >
                Cancel
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleSubmit('draft')}
                  disabled={loading}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save as Draft
                </Button>

                {formData.is_email_enabled && (
                  <Button
                    onClick={() => handleSubmit('sent')}
                    disabled={loading}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Save & Send
                  </Button>
                )}

                {!formData.is_email_enabled && (
                  <Button
                    onClick={() => handleSubmit('sent')}
                    disabled={loading}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save & Mark Sent
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Live Preview Section */}
        {(previewMode === 'split' || previewMode === 'preview') && (
          <div className="sticky top-6">
            <InvoiceLivePreview 
              formData={formData} 
              hotelConfig={hotelConfig || undefined}
              className="max-h-[calc(100vh-8rem)] overflow-y-auto"
            />
          </div>
        )}
      </div>
    </div>
  );
}
