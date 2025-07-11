import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createServerClient();

    const { data: itemTypes, error } = await supabase
      .from('custom_item_types')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error fetching custom item types:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch item types' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: itemTypes,
    });
  } catch (error) {
    console.error('Error in item types API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const body = await request.json();

    const { data, error } = await supabase
      .from('custom_item_types')
      .insert({
        name: body.name,
        description: body.description,
        icon: body.icon || '📋',
        default_gst_rate: body.default_gst_rate || 12,
        sort_order: body.sort_order || 0,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating custom item type:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to create item type' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Error in item types create API:', error);
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

    const { data, error } = await supabase
      .from('custom_item_types')
      .update({
        name: body.name,
        description: body.description,
        icon: body.icon,
        default_gst_rate: body.default_gst_rate,
        sort_order: body.sort_order,
        is_active: body.is_active,
        updated_at: new Date().toISOString(),
      })
      .eq('id', body.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating custom item type:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to update item type' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Error in item types update API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Item type ID is required' },
        { status: 400 }
      );
    }

    // Soft delete by setting is_active to false
    const { error } = await supabase
      .from('custom_item_types')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      console.error('Error deleting custom item type:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to delete item type' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Item type deleted successfully',
    });
  } catch (error) {
    console.error('Error in item types delete API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
