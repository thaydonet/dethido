import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ deId: string }> }
) {
  try {
    const { deId } = await params;
    const decodedDeId = decodeURIComponent(deId);

    const { data, error } = await supabaseAdmin
      .from('questions')
      .select('*')
      .eq('de_id', decodedDeId)
      .order('so_cau', { ascending: true });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
