import type { Metadata, Viewport } from "next";
import 'katex/dist/katex.min.css';
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://thi.booktoan.com';
const defaultTitle = "Ngân hàng Câu hỏi TN THPT Môn Toán 2026";
const defaultDescription = "Hệ thống ngân hàng câu hỏi trắc nghiệm Toán THPT — Đề thi thử, đề thi chính thức và các dạng bài trắc nghiệm Toán 12, Toán 11, Toán 10, luyện thi THPT Quốc Gia.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: defaultTitle,
    template: "%s | lop12.com"
  },
  description: defaultDescription,
  keywords: ["toán học", "tn thpt", "ngân hàng câu hỏi", "sach toan", "đề thi", "toán 12", "đề thi thử", "ôn thi đại học"],
  authors: [{ name: "lop12.com" }],
  creator: "lop12.com",
  openGraph: {
    type: "website",
    locale: "vi_VN",
    url: siteUrl,
    title: defaultTitle,
    description: defaultDescription,
    siteName: "lop12.com",
  },
  twitter: {
    card: "summary_large_image",
    title: defaultTitle,
    description: defaultDescription,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body style={{ margin: 0, padding: 0, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Header />
        <main style={{ flex: 1 }}>
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
