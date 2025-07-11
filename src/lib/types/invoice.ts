import { Database } from '@/lib/supabase/types';

// Base types from database
export type InvoiceTable = Database['public']['Tables']['invoices']['Row'];
export type InvoiceInsert = Database['public']['Tables']['invoices']['Insert'];
export type InvoiceUpdate = Database['public']['Tables']['invoices']['Update'];

export type InvoiceLineItemTable = Database['public']['Tables']['invoice_line_items']['Row'];
export type InvoiceLineItemInsert = Database['public']['Tables']['invoice_line_items']['Insert'];
export type InvoiceLineItemUpdate = Database['public']['Tables']['invoice_line_items']['Update'];

export type InvoicePaymentTable = Database['public']['Tables']['invoice_payments']['Row'];
export type InvoicePaymentInsert = Database['public']['Tables']['invoice_payments']['Insert'];
export type InvoicePaymentUpdate = Database['public']['Tables']['invoice_payments']['Update'];

// Extended types with relationships
export interface Invoice extends InvoiceTable {
  line_items?: InvoiceLineItem[];
  payments?: InvoicePayment[];
  customer?: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
  };
  booking?: {
    id: string;
    booking_number: string;
    check_in_date: string;
    check_out_date: string;
  };
}

export type InvoiceLineItem = InvoiceLineItemTable;

export type InvoicePayment = InvoicePaymentTable;

// Hotel Configuration
export interface HotelConfig {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  phone?: string;
  email?: string;
  website?: string;
  gst_number?: string;
  pan_number?: string;
  logo_url?: string;

  // Bank Details
  bank_name?: string;
  bank_account_number?: string;
  bank_ifsc_code?: string;
  bank_branch?: string;
  bank_account_holder_name?: string;

  // Invoice Settings
  invoice_prefix: string;
  proforma_prefix: string;
  default_gst_rate: number;
  default_terms_and_conditions?: string;

  // Buffet Settings
  buffet_breakfast_price: number;
  buffet_lunch_price: number;
  buffet_dinner_price: number;
}

// Custom Item Types
export interface CustomItemType {
  id: string;
  name: string;
  description?: string;
  icon: string;
  default_gst_rate: number;
  is_active: boolean;
  sort_order: number;
}

// Form types for creating/editing invoices
export interface InvoiceFormData {
  // Basic Info
  invoice_number?: string;
  invoice_date: string;
  due_date?: string;
  invoice_type: 'invoice' | 'proforma' | 'estimate' | 'quote';

  // Customer Info
  customer_type: 'individual' | 'company';
  customer_id?: string;
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  customer_address?: string;
  customer_city?: string;
  customer_state?: string;
  customer_pincode?: string;
  customer_country?: string;
  customer_gst_number?: string;

  // Company Info (when customer_type is 'company')
  company_name?: string;
  company_gst_number?: string;
  company_pan_number?: string;
  company_contact_person?: string;
  
  // Hotel Info
  hotel_name: string;
  hotel_address: string;
  hotel_city: string;
  hotel_state: string;
  hotel_pincode: string;
  hotel_country: string;
  hotel_phone?: string;
  hotel_email?: string;
  hotel_gst_number?: string;
  hotel_website?: string;
  
  // Settings
  currency: string;
  show_bank_details: boolean;
  is_email_enabled: boolean;

  // Status
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';

  // Notes
  notes?: string;
  terms_and_conditions?: string;

  // Related
  booking_id?: string;

  // Line Items
  line_items: InvoiceLineItemFormData[];
}

export interface InvoiceLineItemFormData {
  id?: string;
  item_type: 'room' | 'food' | 'service' | 'extra' | 'discount' | 'other' | 'custom';
  custom_item_type_id?: string;
  description: string;
  quantity: number;
  unit_price: number;

  // GST (renamed from tax)
  gst_rate: number;
  gst_inclusive: boolean;
  gst_name: string;

  // Discount
  discount_rate: number;

  // Buffet specific
  is_buffet_item: boolean;
  buffet_type?: 'breakfast' | 'lunch' | 'dinner';
  persons_count: number;
  price_per_person: number;

  // Metadata
  item_date?: string;
  sort_order: number;
}

export interface InvoicePaymentFormData {
  payment_date: string;
  amount: number;
  payment_method: 'cash' | 'card' | 'upi' | 'bank_transfer' | 'cheque' | 'other';
  reference_number?: string;
  notes?: string;
}

// Calculation types
export interface InvoiceCalculation {
  subtotal: number;
  total_tax: number;
  total_discount: number;
  total_amount: number;
  line_items: InvoiceLineItemCalculation[];
}

export interface InvoiceLineItemCalculation {
  line_total: number;
  tax_amount: number;
  discount_amount: number;
  final_amount: number;
}

// Filter and search types
export interface InvoiceFilters {
  status?: string;
  payment_status?: string;
  customer_id?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
}

export interface InvoiceListItem {
  id: string;
  invoice_number: string;
  invoice_date: string;
  customer_name: string;
  total_amount: number;
  paid_amount: number;
  balance_amount: number;
  status: string;
  payment_status: string;
  created_at: string;
}

// Email types
export interface InvoiceEmailData {
  to: string;
  cc?: string[];
  bcc?: string[];
  subject: string;
  message: string;
  attach_pdf: boolean;
}

// PDF generation types
export interface InvoicePDFOptions {
  format: 'A4' | 'Letter';
  orientation: 'portrait' | 'landscape';
  include_payments: boolean;
  include_terms: boolean;
  watermark?: string;
}

// Template types
export interface InvoiceTemplate {
  id: string;
  name: string;
  description?: string;
  hotel_info: {
    name: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
    phone?: string;
    email?: string;
    gst_number?: string;
    website?: string;
  };
  default_terms?: string;
  default_tax_rate: number;
  default_currency: string;
}

// Statistics types
export interface InvoiceStats {
  total_invoices: number;
  total_amount: number;
  paid_amount: number;
  pending_amount: number;
  overdue_amount: number;
  draft_count: number;
  sent_count: number;
  paid_count: number;
  overdue_count: number;
}

// Export types
export type InvoiceExportFormat = 'pdf' | 'excel' | 'csv';

export interface InvoiceExportOptions {
  format: InvoiceExportFormat;
  filters?: InvoiceFilters;
  include_line_items: boolean;
  include_payments: boolean;
  date_range?: {
    from: string;
    to: string;
  };
}

// Validation types
export interface InvoiceValidationError {
  field: string;
  message: string;
  code: string;
}

export interface InvoiceValidationResult {
  valid: boolean;
  errors: InvoiceValidationError[];
  warnings: InvoiceValidationError[];
}

// API Response types
export interface InvoiceApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface InvoiceListResponse {
  invoices: InvoiceListItem[];
  total: number;
  page: number;
  limit: number;
  has_more: boolean;
}

// Utility types
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
export type PaymentStatus = 'pending' | 'partial' | 'paid' | 'refunded';
export type ItemType = 'room' | 'food' | 'service' | 'extra' | 'discount' | 'other' | 'custom';
export type PaymentMethod = 'cash' | 'card' | 'upi' | 'bank_transfer' | 'cheque' | 'other';
export type InvoiceType = 'invoice' | 'proforma' | 'estimate' | 'quote';
export type CustomerType = 'individual' | 'company';
export type BuffetType = 'breakfast' | 'lunch' | 'dinner';

// Constants
export const INVOICE_TYPES: { value: InvoiceType; label: string; description: string }[] = [
  { value: 'invoice', label: 'Invoice', description: 'Standard invoice for completed services' },
  { value: 'proforma', label: 'Proforma Invoice', description: 'Advance invoice for booking confirmation' },
  { value: 'estimate', label: 'Estimate', description: 'Cost estimate for services' },
  { value: 'quote', label: 'Quote', description: 'Price quotation for potential customers' },
];

export const CUSTOMER_TYPES: { value: CustomerType; label: string; icon: string }[] = [
  { value: 'individual', label: 'Individual', icon: '👤' },
  { value: 'company', label: 'Company', icon: '🏢' },
];

export const BUFFET_TYPES: { value: BuffetType; label: string; icon: string }[] = [
  { value: 'breakfast', label: 'Breakfast', icon: '🥐' },
  { value: 'lunch', label: 'Lunch', icon: '🍛' },
  { value: 'dinner', label: 'Dinner', icon: '🍽️' },
];

export const INVOICE_STATUSES: { value: InvoiceStatus; label: string; color: string }[] = [
  { value: 'draft', label: 'Draft', color: 'gray' },
  { value: 'sent', label: 'Sent', color: 'blue' },
  { value: 'paid', label: 'Paid', color: 'green' },
  { value: 'overdue', label: 'Overdue', color: 'red' },
  { value: 'cancelled', label: 'Cancelled', color: 'red' },
];

export const PAYMENT_STATUSES: { value: PaymentStatus; label: string; color: string }[] = [
  { value: 'pending', label: 'Pending', color: 'yellow' },
  { value: 'partial', label: 'Partial', color: 'orange' },
  { value: 'paid', label: 'Paid', color: 'green' },
  { value: 'refunded', label: 'Refunded', color: 'purple' },
];

export const ITEM_TYPES: { value: ItemType; label: string; icon: string }[] = [
  { value: 'room', label: 'Room Charges', icon: '🏨' },
  { value: 'food', label: 'Food & Beverage', icon: '🍽️' },
  { value: 'service', label: 'Service Charges', icon: '🛎️' },
  { value: 'extra', label: 'Extra Charges', icon: '➕' },
  { value: 'discount', label: 'Discount', icon: '💰' },
  { value: 'other', label: 'Other', icon: '📋' },
];

export const PAYMENT_METHODS: { value: PaymentMethod; label: string; icon: string }[] = [
  { value: 'cash', label: 'Cash', icon: '💵' },
  { value: 'card', label: 'Card', icon: '💳' },
  { value: 'upi', label: 'UPI', icon: '📱' },
  { value: 'bank_transfer', label: 'Bank Transfer', icon: '🏦' },
  { value: 'cheque', label: 'Cheque', icon: '📝' },
  { value: 'other', label: 'Other', icon: '💼' },
];
