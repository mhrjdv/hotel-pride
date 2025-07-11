'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Save, Building, CreditCard, Settings, Loader2 } from 'lucide-react';

interface HotelConfig {
  // Basic Hotel Information
  hotel_name: string;
  hotel_address: string;
  hotel_city: string;
  hotel_state: string;
  hotel_pincode: string;
  hotel_country: string;
  hotel_phone: string;
  hotel_email: string;
  hotel_website?: string;
  hotel_gst_number: string;
  
  // Bank Details
  bank_name?: string;
  bank_account_number?: string;
  bank_ifsc_code?: string;
  bank_account_holder_name?: string;
  bank_branch?: string;
  
  // System Settings
  default_currency: string;
  default_gst_rate: number;
  show_bank_details_default: boolean;
  email_enabled_default: boolean;
  
  // Buffet Settings
  default_buffet_breakfast_price: number;
  default_buffet_lunch_price: number;
  default_buffet_dinner_price: number;
  
  // Invoice Settings
  invoice_terms_and_conditions?: string;
  invoice_footer_text?: string;
}

export default function HotelSettingsClient() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<HotelConfig>({
    hotel_name: '',
    hotel_address: '',
    hotel_city: '',
    hotel_state: '',
    hotel_pincode: '',
    hotel_country: 'India',
    hotel_phone: '',
    hotel_email: '',
    hotel_website: '',
    hotel_gst_number: '',
    
    bank_name: '',
    bank_account_number: '',
    bank_ifsc_code: '',
    bank_account_holder_name: '',
    bank_branch: '',
    
    default_currency: 'INR',
    default_gst_rate: 12,
    show_bank_details_default: true,
    email_enabled_default: true,
    
    default_buffet_breakfast_price: 250,
    default_buffet_lunch_price: 350,
    default_buffet_dinner_price: 400,
    
    invoice_terms_and_conditions: 'Payment due within 15 days from invoice date. Late payment charges may apply. All disputes subject to local jurisdiction.',
    invoice_footer_text: 'Thank you for choosing our hotel services.',
  });

  const loadHotelConfig = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/hotel/config');
      const data = await response.json();

      if (data.success && data.data) {
        setConfig(prev => ({
          ...prev,
          ...data.data,
        }));
      }
    } catch (error) {
      console.error('Error loading hotel config:', error);
      toast.error('Failed to load hotel configuration');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHotelConfig();
  }, [loadHotelConfig]);

  const saveHotelConfig = async () => {
    try {
      setSaving(true);
      
      const response = await fetch('/api/hotel/config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Hotel configuration saved successfully');
      } else {
        throw new Error(data.error || 'Failed to save configuration');
      }
    } catch (error) {
      console.error('Error saving hotel config:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const updateConfig = (field: keyof HotelConfig, value: string | number | boolean) => {
    setConfig(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="h-6 bg-gray-200 rounded animate-pulse w-1/4" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="h-10 bg-gray-200 rounded animate-pulse" />
                  <div className="h-10 bg-gray-200 rounded animate-pulse" />
                </div>
                <div className="h-20 bg-gray-200 rounded animate-pulse" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basic" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            Basic Info
          </TabsTrigger>
          <TabsTrigger value="bank" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Bank Details
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            System Settings
          </TabsTrigger>
          <TabsTrigger value="invoice" className="flex items-center gap-2">
            <Save className="h-4 w-4" />
            Invoice Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Hotel Information</CardTitle>
              <CardDescription>
                Basic hotel details that appear on invoices and throughout the system
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="hotel_name">Hotel Name *</Label>
                  <Input
                    id="hotel_name"
                    value={config.hotel_name}
                    onChange={(e) => updateConfig('hotel_name', e.target.value)}
                    placeholder="Enter hotel name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hotel_gst_number">GST Number *</Label>
                  <Input
                    id="hotel_gst_number"
                    value={config.hotel_gst_number}
                    onChange={(e) => updateConfig('hotel_gst_number', e.target.value)}
                    placeholder="Enter GST number"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="hotel_address">Address *</Label>
                <Textarea
                  id="hotel_address"
                  value={config.hotel_address}
                  onChange={(e) => updateConfig('hotel_address', e.target.value)}
                  placeholder="Enter complete hotel address"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="hotel_city">City *</Label>
                  <Input
                    id="hotel_city"
                    value={config.hotel_city}
                    onChange={(e) => updateConfig('hotel_city', e.target.value)}
                    placeholder="Enter city"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hotel_state">State *</Label>
                  <Input
                    id="hotel_state"
                    value={config.hotel_state}
                    onChange={(e) => updateConfig('hotel_state', e.target.value)}
                    placeholder="Enter state"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hotel_pincode">PIN Code *</Label>
                  <Input
                    id="hotel_pincode"
                    value={config.hotel_pincode}
                    onChange={(e) => updateConfig('hotel_pincode', e.target.value)}
                    placeholder="Enter PIN code"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="hotel_phone">Phone Number *</Label>
                  <Input
                    id="hotel_phone"
                    value={config.hotel_phone}
                    onChange={(e) => updateConfig('hotel_phone', e.target.value)}
                    placeholder="+91-0000000000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hotel_email">Email Address *</Label>
                  <Input
                    id="hotel_email"
                    type="email"
                    value={config.hotel_email}
                    onChange={(e) => updateConfig('hotel_email', e.target.value)}
                    placeholder="hotel@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hotel_website">Website (Optional)</Label>
                  <Input
                    id="hotel_website"
                    value={config.hotel_website || ''}
                    onChange={(e) => updateConfig('hotel_website', e.target.value)}
                    placeholder="https://yourhotel.com"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bank" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Bank Account Details</CardTitle>
              <CardDescription>
                Bank information for payment processing and invoice display
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bank_name">Bank Name</Label>
                  <Input
                    id="bank_name"
                    value={config.bank_name || ''}
                    onChange={(e) => updateConfig('bank_name', e.target.value)}
                    placeholder="Enter bank name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bank_account_holder_name">Account Holder Name</Label>
                  <Input
                    id="bank_account_holder_name"
                    value={config.bank_account_holder_name || ''}
                    onChange={(e) => updateConfig('bank_account_holder_name', e.target.value)}
                    placeholder="Enter account holder name"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bank_account_number">Account Number</Label>
                  <Input
                    id="bank_account_number"
                    value={config.bank_account_number || ''}
                    onChange={(e) => updateConfig('bank_account_number', e.target.value)}
                    placeholder="Enter account number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bank_ifsc_code">IFSC Code</Label>
                  <Input
                    id="bank_ifsc_code"
                    value={config.bank_ifsc_code || ''}
                    onChange={(e) => updateConfig('bank_ifsc_code', e.target.value)}
                    placeholder="Enter IFSC code"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bank_branch">Branch Address</Label>
                <Textarea
                  id="bank_branch"
                  value={config.bank_branch || ''}
                  onChange={(e) => updateConfig('bank_branch', e.target.value)}
                  placeholder="Enter branch address"
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>System Configuration</CardTitle>
              <CardDescription>
                Default settings for invoices and system behavior
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="default_currency">Default Currency</Label>
                  <Input
                    id="default_currency"
                    value={config.default_currency}
                    onChange={(e) => updateConfig('default_currency', e.target.value)}
                    placeholder="INR"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="default_gst_rate">Default GST Rate (%)</Label>
                  <Input
                    id="default_gst_rate"
                    type="number"
                    value={config.default_gst_rate}
                    onChange={(e) => updateConfig('default_gst_rate', parseFloat(e.target.value) || 0)}
                    placeholder="12"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Show Bank Details by Default</Label>
                    <p className="text-sm text-gray-600">
                      Include bank details in new invoices by default
                    </p>
                  </div>
                  <Switch
                    checked={config.show_bank_details_default}
                    onCheckedChange={(checked) => updateConfig('show_bank_details_default', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email Enabled by Default</Label>
                    <p className="text-sm text-gray-600">
                      Enable email sending for new invoices by default
                    </p>
                  </div>
                  <Switch
                    checked={config.email_enabled_default}
                    onCheckedChange={(checked) => updateConfig('email_enabled_default', checked)}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-lg font-semibold">Default Buffet Pricing</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="breakfast_price">Breakfast (per person)</Label>
                    <Input
                      id="breakfast_price"
                      type="number"
                      value={config.default_buffet_breakfast_price}
                      onChange={(e) => updateConfig('default_buffet_breakfast_price', parseFloat(e.target.value) || 0)}
                      placeholder="250"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lunch_price">Lunch (per person)</Label>
                    <Input
                      id="lunch_price"
                      type="number"
                      value={config.default_buffet_lunch_price}
                      onChange={(e) => updateConfig('default_buffet_lunch_price', parseFloat(e.target.value) || 0)}
                      placeholder="350"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dinner_price">Dinner (per person)</Label>
                    <Input
                      id="dinner_price"
                      type="number"
                      value={config.default_buffet_dinner_price}
                      onChange={(e) => updateConfig('default_buffet_dinner_price', parseFloat(e.target.value) || 0)}
                      placeholder="400"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoice" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Invoice Configuration</CardTitle>
              <CardDescription>
                Default text and settings for invoice generation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="terms_conditions">Default Terms and Conditions</Label>
                <Textarea
                  id="terms_conditions"
                  value={config.invoice_terms_and_conditions || ''}
                  onChange={(e) => updateConfig('invoice_terms_and_conditions', e.target.value)}
                  placeholder="Enter default terms and conditions for invoices"
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="footer_text">Invoice Footer Text</Label>
                <Textarea
                  id="footer_text"
                  value={config.invoice_footer_text || ''}
                  onChange={(e) => updateConfig('invoice_footer_text', e.target.value)}
                  placeholder="Enter footer text for invoices"
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button 
          onClick={saveHotelConfig} 
          disabled={saving}
          size="lg"
          className="min-w-32"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Configuration
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
