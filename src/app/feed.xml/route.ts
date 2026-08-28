import { NextResponse } from 'next/server';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://thi.booktoan.com';

export async function GET() {
  const feed = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Ngân hàng Câu hỏi TN THPT Môn Toán</title>
    <link>${siteUrl}</link>
    <description>Hệ thống ngân hàng câu hỏi trắc nghiệm Toán THPT.</description>
    <language>vi</language>
    <atom:link href="${siteUrl}/feed.xml" rel="self" type="application/rss+xml" />
    <item>
      <title>Trang chủ</title>
      <link>${siteUrl}</link>
      <description>Hệ thống ôn luyện thi Toán THPT</description>
      <pubDate>${new Date().toUTCString()}</pubDate>
    </item>
  </channel>
</rss>`;

  return new NextResponse(feed, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
    },
  });
}
