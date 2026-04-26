import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabaseAdmin as supabase } from '@/lib/supabase-admin';

// Khởi tạo Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: Request) {
  try {
    const { query } = await req.json();

    if (!query) {
      return NextResponse.json({ error: 'Thiếu nội dung tìm kiếm (query)' }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'Chưa cấu hình GEMINI_API_KEY' }, { status: 500 });
    }

    // 1. Tạo vector embedding cho câu query
    const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
    const result = await model.embedContent(query);
    const embedding = result.embedding.values;

    if (!embedding || embedding.length === 0) {
      return NextResponse.json({ error: 'Không thể tạo embedding' }, { status: 500 });
    }

    // 2. Gọi hàm RPC của Supabase để tìm kiếm vector
    // Sử dụng chuỗi vector format '[0.1, 0.2, ...]'
    const { data: questions, error } = await supabase.rpc('search_similar_questions', {
      query_embedding: `[${embedding.join(',')}]`,
      match_count: 5, // Trả về top 5
    });

    if (error) {
      console.error('Lỗi khi gọi RPC search_similar_questions:', error);
      return NextResponse.json({ error: 'Lỗi khi truy vấn CSDL' }, { status: 500 });
    }

    return NextResponse.json({ data: questions });
  } catch (error: any) {
    console.error('Search API error:', error);
    return NextResponse.json({ error: error.message || 'Lỗi server' }, { status: 500 });
  }
}
