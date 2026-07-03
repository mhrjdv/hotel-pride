'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  Search,
  Download,
  Mail,
  Eye,
  Edit,
  Trash2,
  FileText,
  Calendar,
  DollarSign,
  TrendingUp,
  ChevronUpIcon,
  ChevronDown
} from '@/components/icons';
import { toast } from 'sonner';
import { InvoiceListItem, InvoiceFilters, INVOICE_STATUSES, PAYMENT_STATUSES } from '@/lib/types/invoice';
import { formatCurrency } from '@/lib/utils/invoice-calculations';

type SortColumn = 'invoice_number' | 'customer' | 'invoice_date' | 'amount' | 'status';
type SortDirection = 'asc' | 'desc';

export default function InvoicesClient() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<InvoiceListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<InvoiceFilters>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortColumn, setSortColumn] = useState<SortColumn>('invoice_date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [stats, setStats] = useState({
    total_invoices: 0,
    total_amount: 0,
    paid_amount: 0,
    pending_amount: 0,
  });

  // Fetch invoices
  const fetchInvoices = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        ...(filters.status && { status: filters.status }),
        ...(filters.payment_status && { payment_status: filters.payment_status }),
        ...(filters.customer_id && { customer_id: filters.customer_id }),
        ...(filters.date_from && { date_from: filters.date_from }),
        ...(filters.date_to && { date_to: filters.date_to }),
        ...(searchTerm && { search: searchTerm }),
      });

      const response = await fetch(`/api/invoices?${params}`);
      const data = await response.json();

      if (data.success) {
        setInvoices(data.data.invoices);
        setTotalPages(Math.ceil(data.data.total / 20));
        
        // Calculate stats
        const totalAmount = data.data.invoices.reduce((sum: number, inv: InvoiceListItem) => sum + inv.total_amount, 0);
        const paidAmount = data.data.invoices.reduce((sum: number, inv: InvoiceListItem) => sum + inv.paid_amount, 0);
        
        setStats({
          total_invoices: data.data.total,
          total_amount: totalAmount,
          paid_amount: paidAmount,
          pending_amount: totalAmount - paidAmount,
        });
      } else {
        toast.error('Failed to fetch invoices');
      }
    } catch (error) {
      console.error('Error fetching invoices:', error);
      toast.error('Failed to fetch invoices');
    } finally {
      setLoading(false);
    }
  }, [currentPage, filters, searchTerm]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleFilterChange = (key: keyof InvoiceFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || undefined,
    }));
    setCurrentPage(1);
  };

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const sortIndicator = (column: SortColumn) => {
    if (sortColumn !== column) {
      return <ChevronDown className="w-3.5 h-3.5 text-gray-300" aria-hidden="true" />;
    }
    return sortDirection === 'asc'
      ? <ChevronUpIcon className="w-3.5 h-3.5 text-gray-700" aria-hidden="true" />
      : <ChevronDown className="w-3.5 h-3.5 text-gray-700" aria-hidden="true" />;
  };

  const ariaSort = (column: SortColumn): 'ascending' | 'descending' | 'none' =>
    sortColumn === column ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none';

  // Client-side sort applied to the current (already filtered) page of invoices.
  const sortedInvoices = [...invoices].sort((a, b) => {
    const dir = sortDirection === 'asc' ? 1 : -1;
    switch (sortColumn) {
      case 'invoice_number':
        return a.invoice_number.localeCompare(b.invoice_number, undefined, { numeric: true }) * dir;
      case 'customer':
        return a.customer_name.localeCompare(b.customer_name) * dir;
      case 'amount':
        return (a.total_amount - b.total_amount) * dir;
      case 'status':
        return a.status.localeCompare(b.status) * dir;
      case 'invoice_date':
      default:
        return (new Date(a.invoice_date).getTime() - new Date(b.invoice_date).getTime()) * dir;
    }
  });

  // Invoice deletion is intentionally disabled in the UI for now. When it is
  // re-enabled it must SOFT-delete (set a deleted_at flag and filter it out)
  // rather than hard-delete, so invoices are never permanently lost.

  const getStatusBadge = (status: string, type: 'invoice' | 'payment') => {
    const statuses = type === 'invoice' ? INVOICE_STATUSES : PAYMENT_STATUSES;
    const statusConfig = statuses.find(s => s.value === status);
    
    if (!statusConfig) return <Badge variant="secondary">{status}</Badge>;

    const variants: Record<string, "secondary" | "default" | "destructive" | "outline"> = {
      gray: 'secondary',
      blue: 'default',
      green: 'default',
      red: 'destructive',
      yellow: 'secondary',
      orange: 'secondary',
      purple: 'secondary',
    };

    return (
      <Badge variant={variants[statusConfig.color] || 'secondary'}>
        {statusConfig.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_invoices}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.total_amount)}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid Amount</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(stats.paid_amount)}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Amount</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{formatCurrency(stats.pending_amount)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search invoices..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={filters.status || 'all'} onValueChange={(value) => handleFilterChange('status', value === 'all' ? '' : value)}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {INVOICE_STATUSES.map(status => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filters.payment_status || 'all'} onValueChange={(value) => handleFilterChange('payment_status', value === 'all' ? '' : value)}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Payment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Payments</SelectItem>
                  {PAYMENT_STATUSES.map(status => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Invoice date range */}
              <div className="flex items-center gap-2">
                <label htmlFor="invoice-date-from" className="text-sm text-gray-600 whitespace-nowrap">
                  From
                </label>
                <Input
                  id="invoice-date-from"
                  type="date"
                  aria-label="Invoice date from"
                  value={filters.date_from || ''}
                  max={filters.date_to || undefined}
                  onChange={(e) => handleFilterChange('date_from', e.target.value)}
                  className="w-[150px]"
                />
                <label htmlFor="invoice-date-to" className="text-sm text-gray-600 whitespace-nowrap">
                  to
                </label>
                <Input
                  id="invoice-date-to"
                  type="date"
                  aria-label="Invoice date to"
                  value={filters.date_to || ''}
                  min={filters.date_from || undefined}
                  onChange={(e) => handleFilterChange('date_to', e.target.value)}
                  className="w-[150px]"
                />
                {(filters.date_from || filters.date_to) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      handleFilterChange('date_from', '');
                      handleFilterChange('date_to', '');
                    }}
                  >
                    Clear
                  </Button>
                )}
              </div>
            </div>
            
            <Button onClick={() => router.push('/invoices/new')} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              New Invoice
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : invoices.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No invoices found</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                {searchTerm || Object.keys(filters).length > 0 
                  ? 'Try adjusting your search or filters'
                  : 'Get started by creating your first invoice'
                }
              </p>
              {!searchTerm && Object.keys(filters).length === 0 && (
                <Button onClick={() => router.push('/invoices/new')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Invoice
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {/* Sortable column header bar (desktop) */}
              <div className="hidden md:flex items-center gap-4 px-3 py-2 border-b text-xs font-medium text-gray-600">
                <div aria-sort={ariaSort('invoice_number')} className="w-40">
                  <button type="button" onClick={() => handleSort('invoice_number')} className="flex items-center gap-1 hover:text-gray-900">
                    Invoice # {sortIndicator('invoice_number')}
                  </button>
                </div>
                <div aria-sort={ariaSort('customer')} className="flex-1">
                  <button type="button" onClick={() => handleSort('customer')} className="flex items-center gap-1 hover:text-gray-900">
                    Customer {sortIndicator('customer')}
                  </button>
                </div>
                <div aria-sort={ariaSort('invoice_date')} className="w-28">
                  <button type="button" onClick={() => handleSort('invoice_date')} className="flex items-center gap-1 hover:text-gray-900">
                    Date {sortIndicator('invoice_date')}
                  </button>
                </div>
                <div aria-sort={ariaSort('amount')} className="w-28">
                  <button type="button" onClick={() => handleSort('amount')} className="flex items-center gap-1 hover:text-gray-900">
                    Amount {sortIndicator('amount')}
                  </button>
                </div>
                <div aria-sort={ariaSort('status')} className="w-28">
                  <button type="button" onClick={() => handleSort('status')} className="flex items-center gap-1 hover:text-gray-900">
                    Status {sortIndicator('status')}
                  </button>
                </div>
                <span className="w-[180px]" aria-hidden="true" />
              </div>

              {sortedInvoices.map((invoice) => (
                <div key={invoice.id} className="border rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1.5">
                        <h3 className="font-semibold text-base">{invoice.invoice_number}</h3>
                        {getStatusBadge(invoice.status, 'invoice')}
                        {getStatusBadge(invoice.payment_status, 'payment')}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-x-4 gap-y-1 text-xs text-gray-600 dark:text-gray-400">
                        <div>
                          <span className="font-medium">Customer:</span> {invoice.customer_name}
                        </div>
                        <div>
                          <span className="font-medium">Date:</span> {new Date(invoice.invoice_date).toLocaleDateString('en-IN')}
                        </div>
                        <div>
                          <span className="font-medium">Amount:</span> {formatCurrency(invoice.total_amount)}
                        </div>
                        <div>
                          <span className="font-medium">Balance:</span>{' '}
                          <span className={invoice.balance_amount > 0 ? 'text-red-600' : 'text-green-600'}>
                            {formatCurrency(invoice.balance_amount)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/invoices/${invoice.id}`)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/invoices/${invoice.id}/edit`)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(`/api/invoices/${invoice.id}/pdf?t=${Date.now()}`, '_blank')}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          toast.info('Sending invoice email…');
                          try {
                            const res = await fetch(`/api/invoices/${invoice.id}/email`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ emailData: { attach_pdf: true } }),
                            });
                            const data = await res.json();
                            if (data.success) toast.success('Invoice email sent.');
                            else toast.error(data.error || 'Failed to send email.');
                          } catch {
                            toast.error('Failed to send email.');
                          }
                        }}
                      >
                        <Mail className="h-4 w-4" />
                      </Button>
                      
                      {/* Deletion disabled for now — invoices should be soft-deleted, not removed. */}
                      <Button
                        variant="outline"
                        size="sm"
                        disabled
                        title="Invoice deletion is disabled"
                        aria-label="Delete invoice (disabled)"
                        className="text-red-400 cursor-not-allowed"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Page {currentPage} of {totalPages}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
