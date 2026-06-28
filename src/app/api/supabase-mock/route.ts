import { NextRequest, NextResponse } from 'next/server';
import { queryMockDb } from '@/lib/supabase/mock-db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { table, method, payload } = body;
    
    if (!table || !method || !payload) {
      return NextResponse.json({ data: null, error: { message: 'Missing table, method, or payload' } }, { status: 400 });
    }

    const result = queryMockDb(table, method, payload);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ data: null, error: { message: err.message || 'Internal server error' } }, { status: 500 });
  }
}
