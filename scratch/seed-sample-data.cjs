const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      process.env[key] = value;
    }
  }
}

async function run() {
  loadEnv();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error('Missing URL or service key');
    return;
  }
  const supabase = createClient(url, key);

  console.log('Seeding sample customers...');
  const customers = [
    {
      id: '550e8400-e29b-41d4-a716-446655440001',
      name: 'Rajesh Kumar',
      email: 'rajesh.kumar@email.com',
      phone: '+919876543210',
      address_line1: '123 MG Road',
      city: 'Mumbai',
      state: 'Maharashtra',
      pin_code: '400001',
      country: 'India',
      id_type: 'aadhaar',
      id_number: '123456789012',
      created_at: '2025-01-10T12:00:00Z'
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440002',
      name: 'Priya Sharma',
      email: 'priya.sharma@email.com',
      phone: '+919876543211',
      address_line1: '456 Park Street',
      city: 'Delhi',
      state: 'Delhi',
      pin_code: '110001',
      country: 'India',
      id_type: 'pan',
      id_number: 'ABCDE1234F',
      created_at: '2025-01-08T12:00:00Z'
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440003',
      name: 'Amit Patel',
      email: 'amit.patel@email.com',
      phone: '+919876543212',
      address_line1: '789 Ring Road',
      city: 'Ahmedabad',
      state: 'Gujarat',
      pin_code: '380001',
      country: 'India',
      id_type: 'passport',
      id_number: 'A1234567',
      created_at: '2025-01-12T12:00:00Z'
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440004',
      name: 'Sunita Reddy',
      email: 'sunita.reddy@email.com',
      phone: '+919876543213',
      address_line1: '321 Tank Bund Road',
      city: 'Hyderabad',
      state: 'Telangana',
      pin_code: '500001',
      country: 'India',
      id_type: 'driving_license',
      id_number: 'TG1234567890',
      created_at: '2025-01-14T12:00:00Z'
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440005',
      name: 'Vikram Singh',
      email: 'vikram.singh@email.com',
      phone: '+919876543214',
      address_line1: '654 Mall Road',
      city: 'Jaipur',
      state: 'Rajasthan',
      pin_code: '302001',
      country: 'India',
      id_type: 'voter_id',
      id_number: 'ABC1234567',
      created_at: '2025-01-15T12:00:00Z'
    }
  ];

  for (const customer of customers) {
    const { error } = await supabase.from('customers').upsert(customer);
    if (error) console.error(`Error upserting customer ${customer.name}:`, error);
  }

  // Get a room to link the bookings
  const { data: rooms, error: rErr } = await supabase.from('rooms').select('id, room_number');
  if (rErr) {
    console.error('Error fetching rooms:', rErr);
    return;
  }
  const room101 = rooms.find(r => r.room_number === '101') || rooms[0];
  const room201 = rooms.find(r => r.room_number === '201') || rooms[0];

  if (!room101 || !room201) {
    console.error('No rooms found in database to link bookings to');
    return;
  }

  console.log('Seeding sample bookings...');
  const bookings = [
    {
      id: '660e8400-e29b-41d4-a716-446655440001',
      booking_number: 'BK20250101',
      room_id: room101.id,
      primary_customer_id: '550e8400-e29b-41d4-a716-446655440001',
      check_in_date: '2025-01-15',
      check_out_date: '2025-01-17',
      check_in_time: '14:00:00',
      check_out_time: '11:00:00',
      total_guests: 2,
      adults: 2,
      children: 0,
      room_rate: 3500.00,
      total_nights: 2,
      base_amount: 7000.00,
      gst_amount: 840.00,
      total_amount: 7840.00,
      paid_amount: 7840.00,
      due_amount: 0.00,
      is_gst_inclusive: false,
      payment_status: 'paid',
      booking_status: 'checked_out',
      created_at: '2025-01-10T12:00:00Z'
    },
    {
      id: '660e8400-e29b-41d4-a716-446655440002',
      booking_number: 'BK20250102',
      room_id: room201.id,
      primary_customer_id: '550e8400-e29b-41d4-a716-446655440002',
      check_in_date: '2025-01-10',
      check_out_date: '2025-01-12',
      check_in_time: '14:00:00',
      check_out_time: '11:00:00',
      total_guests: 1,
      adults: 1,
      children: 0,
      room_rate: 4200.00,
      total_nights: 2,
      base_amount: 8400.00,
      gst_amount: 1008.00,
      total_amount: 9408.00,
      paid_amount: 5000.00,
      due_amount: 4408.00,
      is_gst_inclusive: false,
      payment_status: 'partial',
      booking_status: 'checked_out',
      created_at: '2025-01-08T12:00:00Z'
    }
  ];

  for (const booking of bookings) {
    const { error } = await supabase.from('bookings').upsert(booking);
    if (error) console.error(`Error upserting booking ${booking.booking_number}:`, error);
  }

  console.log('Seeding sample invoices...');
  const invoices = [
    {
      id: '770e8400-e29b-41d4-a716-446655440001',
      invoice_number: 'INV-2025-0001',
      invoice_date: '2025-01-15',
      due_date: '2025-01-30',
      customer_id: '550e8400-e29b-41d4-a716-446655440001',
      customer_name: 'Rajesh Kumar',
      customer_email: 'rajesh.kumar@email.com',
      customer_phone: '+919876543210',
      customer_address: '123 MG Road',
      customer_city: 'Mumbai',
      customer_state: 'Maharashtra',
      customer_pincode: '400001',
      customer_country: 'India',
      hotel_name: 'Hotel Pride',
      hotel_address: 'Hotel Pride Address, Main Street',
      hotel_city: 'Your City',
      hotel_state: 'Your State',
      hotel_pincode: '000000',
      hotel_country: 'India',
      hotel_phone: '+91 9876543210',
      hotel_email: 'info@hotelpride.com',
      hotel_gst_number: '27ABCDE1234F1Z5',
      currency: 'INR',
      subtotal: 7000.00,
      total_tax: 840.00,
      total_discount: 0.00,
      total_amount: 7840.00,
      paid_amount: 7840.00,
      balance_amount: 0.00,
      status: 'paid',
      payment_status: 'paid',
      notes: 'Excellent stay, customer was very satisfied.',
      terms_and_conditions: 'Payment due within 15 days. Late payment charges may apply.',
      booking_id: '660e8400-e29b-41d4-a716-446655440001',
      created_at: '2025-01-15T12:00:00Z'
    },
    {
      id: '770e8400-e29b-41d4-a716-446655440002',
      invoice_number: 'INV-2025-0002',
      invoice_date: '2025-01-10',
      due_date: '2025-01-25',
      customer_id: '550e8400-e29b-41d4-a716-446655440002',
      customer_name: 'Priya Sharma',
      customer_email: 'priya.sharma@email.com',
      customer_phone: '+919876543211',
      customer_address: '456 Park Street',
      customer_city: 'Delhi',
      customer_state: 'Delhi',
      customer_pincode: '110001',
      customer_country: 'India',
      hotel_name: 'Hotel Pride',
      hotel_address: 'Hotel Pride Address, Main Street',
      hotel_city: 'Your City',
      hotel_state: 'Your State',
      hotel_pincode: '000000',
      hotel_country: 'India',
      hotel_phone: '+91 9876543210',
      hotel_email: 'info@hotelpride.com',
      hotel_gst_number: '27ABCDE1234F1Z5',
      currency: 'INR',
      subtotal: 8400.00,
      total_tax: 1008.00,
      total_discount: 0.00,
      total_amount: 9408.00,
      paid_amount: 5000.00,
      balance_amount: 4408.00,
      status: 'sent',
      payment_status: 'partial',
      notes: 'Customer requested extended stay.',
      terms_and_conditions: 'Payment due within 15 days. Late payment charges may apply.',
      booking_id: '660e8400-e29b-41d4-a716-446655440002',
      created_at: '2025-01-10T12:00:00Z'
    }
  ];

  for (const invoice of invoices) {
    const { error } = await supabase.from('invoices').upsert(invoice);
    if (error) console.error(`Error upserting invoice ${invoice.invoice_number}:`, error);
  }

  console.log('Seeding sample invoice line items...');
  const lineItems = [
    {
      id: '880e8400-e29b-41d4-a716-446655440001',
      invoice_id: '770e8400-e29b-41d4-a716-446655440001',
      item_type: 'room',
      description: 'Deluxe AC Room - 2 Nights',
      quantity: 2,
      unit_price: 3500.00,
      line_total: 7000.00,
      tax_rate: 12.00,
      tax_amount: 840.00,
      tax_inclusive: false,
      tax_name: 'GST',
      discount_rate: 0.00,
      discount_amount: 0.00,
      sort_order: 0
    },
    {
      id: '880e8400-e29b-41d4-a716-446655440002',
      invoice_id: '770e8400-e29b-41d4-a716-446655440002',
      item_type: 'room',
      description: 'Premium AC Room - 2 Nights',
      quantity: 2,
      unit_price: 4200.00,
      line_total: 8400.00,
      tax_rate: 12.00,
      tax_amount: 1008.00,
      tax_inclusive: false,
      tax_name: 'GST',
      discount_rate: 0.00,
      discount_amount: 0.00,
      sort_order: 0
    }
  ];

  for (const item of lineItems) {
    const { error } = await supabase.from('invoice_line_items').upsert(item);
    if (error) console.error(`Error upserting line item ${item.id}:`, error);
  }

  console.log('Seeding sample payments...');
  const payments = [
    {
      id: '990e8400-e29b-41d4-a716-446655440001',
      invoice_id: '770e8400-e29b-41d4-a716-446655440001',
      payment_date: '2025-01-15',
      amount: 7840.00,
      payment_method: 'card',
      reference_number: 'TXN123456789',
      notes: 'Payment via Credit Card'
    },
    {
      id: '990e8400-e29b-41d4-a716-446655440002',
      invoice_id: '770e8400-e29b-41d4-a716-446655440002',
      payment_date: '2025-01-10',
      amount: 3000.00,
      payment_method: 'cash',
      reference_number: null,
      notes: 'Advance payment in cash'
    },
    {
      id: '990e8400-e29b-41d4-a716-446655440003',
      invoice_id: '770e8400-e29b-41d4-a716-446655440002',
      payment_date: '2025-01-12',
      amount: 2000.00,
      payment_method: 'upi',
      reference_number: 'UPI987654321',
      notes: 'Partial payment via UPI'
    }
  ];

  for (const payment of payments) {
    const { error } = await supabase.from('invoice_payments').upsert(payment);
    if (error) console.error(`Error upserting payment ${payment.id}:`, error);
  }

  console.log('Sample data seeding finished!');
}

run();
