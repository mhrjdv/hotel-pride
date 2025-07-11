import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createServerClient();

    const { data: config, error } = await supabase
      .from('hotel_config')
      .select('*')
      .limit(1)
      .single();

    if (error) {
      console.error('Error fetching hotel config:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch hotel configuration' },
        { status: 500 }
      );
    }

    // Transform the data to match our interface
    const hotelConfig = {
      id: config?.id,
      hotel_name: config?.hotel_name || '',
      hotel_address: config?.address_line1 || '',
      hotel_city: config?.city || '',
      hotel_state: config?.state || '',
      hotel_pincode: config?.pin_code || '',
      hotel_country: 'India',
      hotel_phone: config?.phone || '',
      hotel_email: config?.email || '',
      hotel_website: config?.website || '',
      hotel_gst_number: config?.gst_number || '',

      // Bank details
      bank_name: config?.bank_name || '',
      bank_account_number: config?.bank_account_number || '',
      bank_ifsc_code: config?.bank_ifsc_code || '',
      bank_branch: config?.bank_branch || '',
      bank_account_holder_name: config?.bank_account_holder_name || '',

      // System settings
      default_currency: config?.default_currency || 'INR',
      default_gst_rate: config?.gst_rate || 12,
      show_bank_details_default: config?.show_bank_details_default !== false,
      email_enabled_default: config?.email_enabled_default !== false,

      // Buffet settings
      default_buffet_breakfast_price: config?.buffet_breakfast_price || 250,
      default_buffet_lunch_price: config?.buffet_lunch_price || 350,
      default_buffet_dinner_price: config?.buffet_dinner_price || 400,

      // Invoice settings
      invoice_terms_and_conditions: config?.default_terms_and_conditions || '',
      invoice_footer_text: config?.invoice_footer_text || '',
    };

    return NextResponse.json({
      success: true,
      data: hotelConfig,
    });
  } catch (error) {
    console.error('Error in hotel config API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const body = await request.json();

    // Transform the data back to database format
    const updateData = {
      hotel_name: body.hotel_name,
      address_line1: body.hotel_address,
      city: body.hotel_city,
      state: body.hotel_state,
      pin_code: body.hotel_pincode,
      phone: body.hotel_phone,
      email: body.hotel_email,
      website: body.hotel_website,
      gst_number: body.hotel_gst_number,

      // Bank details
      bank_name: body.bank_name,
      bank_account_number: body.bank_account_number,
      bank_ifsc_code: body.bank_ifsc_code,
      bank_branch: body.bank_branch,
      bank_account_holder_name: body.bank_account_holder_name,

      // System settings
      default_currency: body.default_currency,
      gst_rate: body.default_gst_rate,
      show_bank_details_default: body.show_bank_details_default,
      email_enabled_default: body.email_enabled_default,

      // Buffet settings
      buffet_breakfast_price: body.default_buffet_breakfast_price,
      buffet_lunch_price: body.default_buffet_lunch_price,
      buffet_dinner_price: body.default_buffet_dinner_price,

      // Invoice settings
      default_terms_and_conditions: body.invoice_terms_and_conditions,
      invoice_footer_text: body.invoice_footer_text,

      updated_at: new Date().toISOString(),
    };

    // Get the first (and should be only) hotel config record
    const { data: existingConfig } = await supabase
      .from('hotel_config')
      .select('id')
      .limit(1)
      .single();

    const { data, error } = await supabase
      .from('hotel_config')
      .update(updateData)
      .eq('id', existingConfig?.id || body.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating hotel config:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to update hotel configuration' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Error in hotel config update API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
