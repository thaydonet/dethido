import type { Metadata } from "next";
import 'katex/dist/katex.min.css';
import "./globals.css";

export const metadata: Metadata = {
  title: "Ngân hàng Câu hỏi Toán học THPT | AI Math Repos",
  description: "Hệ thống lưu trữ và phân loại câu hỏi toán học THPT tự động bằng AI — hơn hàng nghìn câu hỏi có đáp án và lời giải chi tiết.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body style={{ margin: 0, padding: 0 }}>
        {children}
      </body>
    </html>
  );
}
