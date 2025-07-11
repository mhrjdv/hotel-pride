'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { CreditCard, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { Invoice, InvoicePaymentFormData, PAYMENT_METHODS } from '@/lib/types/invoice';
import { formatCurrency } from '@/lib/utils/invoice-calculations';

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: Invoice;
  onPaymentAdded: () => void;
}

export default function PaymentDialog({ open, onOpenChange, invoice, onPaymentAdded }: PaymentDialogProps) {
  const [loading, setLoading] = useState(false);

  // Type assertion for database invoice data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const invoiceData = invoice as any;

  const [formData, setFormData] = useState<InvoicePaymentFormData>({
    payment_date: new Date().toISOString().split('T')[0],
    amount: invoiceData.balance_amount,
    payment_method: 'cash',
    reference_number: '',
    notes: '',
  });

  const handleInputChange = (field: keyof InvoicePaymentFormData, value: string | number | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);

      // Validate amount
      if (formData.amount <= 0) {
        toast.error('Payment amount must be greater than 0');
        return;
      }

      if (formData.amount > invoiceData.balance_amount) {
        toast.error('Payment amount cannot exceed balance amount');
        return;
      }

      const response = await fetch(`/api/invoices/${invoiceData.id}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Payment added successfully');
        onPaymentAdded();
        onOpenChange(false);
        
        // Reset form
        setFormData({
          payment_date: new Date().toISOString().split('T')[0],
          amount: 0,
          payment_method: 'cash',
          reference_number: '',
          notes: '',
        });
      } else {
        toast.error(data.error || 'Failed to add payment');
      }
    } catch (error) {
      console.error('Error adding payment:', error);
      toast.error('Failed to add payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Add Payment
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Invoice Summary */}
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Invoice:</span>
              <span className="font-medium">{invoiceData.invoice_number}</span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Total Amount:</span>
              <span className="font-medium">{formatCurrency(invoiceData.total_amount, invoiceData.currency)}</span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Paid Amount:</span>
              <span className="font-medium text-green-600">{formatCurrency(invoiceData.paid_amount, invoiceData.currency)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Balance Due:</span>
              <span className="font-bold text-red-600">{formatCurrency(invoiceData.balance_amount, invoiceData.currency)}</span>
            </div>
          </div>

          {/* Payment Details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="payment_date">Payment Date *</Label>
              <Input
                id="payment_date"
                type="date"
                value={formData.payment_date}
                onChange={(e) => handleInputChange('payment_date', e.target.value)}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="amount">Amount *</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="amount"
                  type="number"
                  min="0"
                  max={invoiceData.balance_amount}
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => handleInputChange('amount', parseFloat(e.target.value) || 0)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="payment_method">Payment Method *</Label>
            <Select
              value={formData.payment_method}
              onValueChange={(value) => handleInputChange('payment_method', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_METHODS.map(method => (
                  <SelectItem key={method.value} value={method.value}>
                    <span className="flex items-center gap-2">
                      <span>{method.icon}</span>
                      {method.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="reference_number">Reference Number</Label>
            <Input
              id="reference_number"
              value={formData.reference_number}
              onChange={(e) => handleInputChange('reference_number', e.target.value)}
              placeholder="Transaction ID, Check number, etc."
            />
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Additional notes about this payment"
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Adding Payment...' : 'Add Payment'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
