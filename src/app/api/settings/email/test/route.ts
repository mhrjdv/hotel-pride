import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { sendTestEmail } from '@/lib/utils/email-service';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const body = await request.json();
    const { to } = body;

    if (!to) {
      return NextResponse.json(
        { success: false, error: 'Recipient email is required' },
        { status: 400 }
      );
    }

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Call sendTestEmail
    const result = await sendTestEmail(to);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to send test email' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Test email sent successfully',
      previewUrl: result.previewUrl,
    });
  } catch (error) {
    console.error('Unexpected error in POST /api/settings/email/test:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
