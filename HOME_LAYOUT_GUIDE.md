# Hướng dẫn sử dụng Trang chủ mới

## Tổng quan

Trang chủ đã được thiết kế lại với layout 2 cột để tối ưu trải nghiệm học tập:

### Layout 2 cột

```
┌─────────────────────────────────────────────────────┐
│         Ngân hàng Câu hỏi Toán học                  │
│    Hệ thống lưu trữ và phân loại tự động bởi AI     │
├──────────────────┬──────────────────────────────────┤
│  📚 Danh sách    │  20 câu hỏi mới nhất             │
│     đề thi       │                                  │
│                  │  ┌────────────────────────────┐  │
│  🏠 Tất cả       │  │ Câu 1 [DE-1] [MCQ]      ▼ │  │
│     câu hỏi mới  │  │ Nội dung câu hỏi...        │  │
│                  │  └────────────────────────────┘  │
│  📝 DE-1-dethido │                                  │
│     (50 câu)     │  ┌────────────────────────────┐  │
│                  │  │ Câu 2 [DE-2] [MSQ]      ▼ │  │
│  📝 DE-2-PXN-1   │  │ Nội dung câu hỏi...        │  │
│     (22 câu)     │  └────────────────────────────┘  │
│                  │                                  │
└──────────────────┴──────────────────────────────────┘
```

## Tính năng

### 1. Cột trái - Danh sách đề thi

**Hiển thị:**
- 🏠 **Tất cả câu hỏi mới**: 20 câu hỏi được thêm gần nhất
- 📝 **Danh sách đề thi**: Tất cả các đề thi có trong hệ thống
- Số lượng câu hỏi của mỗi đề

**Tương tác:**
- Click vào đề thi để xem tất cả câu hỏi của đề đó
- Đề đang được chọn sẽ có màu gradient tím
- Hover để xem hiệu ứng

### 2. Cột phải - Danh sách câu hỏi

**Chế độ mặc định (Tất cả câu hỏi mới):**
- Hiển thị 20 câu hỏi mới nhất
- Sắp xếp theo thời gian tạo (mới nhất trước)

**Khi chọn đề thi:**
- Hiển thị tất cả câu hỏi của đề đó
- Sắp xếp theo số câu (từ câu 1 đến cuối)

**Mỗi câu hỏi hiển thị:**
- Số thứ tự câu hỏi
- Mã đề thi (badge)
- Loại câu hỏi: MCQ/MSQ/SA (badge)
- Nội dung rút gọn (150 ký tự đầu)
- Icon mở rộng (▼/▲)

### 3. Xem chi tiết câu hỏi

**Click vào câu hỏi để mở rộng:**
- Nội dung đầy đủ với LaTeX được render
- Hình ảnh (nếu có)
- Các đáp án A, B, C, D
- Đáp án đúng được highlight màu xanh
- Lời giải chi tiết (nếu có)
- Metadata: chủ đề, khái niệm, độ khó

**Click lại để thu gọn**

## Giao diện

### Màu sắc
- **Gradient chính**: Tím (#667eea → #764ba2)
- **Đề đang chọn**: Background gradient tím
- **Hover**: Border màu tím, shadow nhẹ
- **Badge MCQ**: Xanh dương nhạt
- **Badge MSQ**: Xanh lá nhạt
- **Badge SA**: Đỏ nhạt

### Responsive
- **Desktop (>1024px)**: Layout 2 cột
- **Tablet (768-1024px)**: Sidebar trên, content dưới
- **Mobile (<768px)**: Stack layout, tối ưu cho màn hình nhỏ

## API Endpoints

### GET `/api/exams/[deId]`
Lấy tất cả câu hỏi của một đề thi

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "de_id": "DE-1-dethido",
      "so_cau": 1,
      "content": "...",
      "options": {...},
      "answer": "A",
      ...
    }
  ]
}
```

## Trải nghiệm người dùng

### Học sinh/Sinh viên
1. Vào trang chủ → Xem 20 câu hỏi mới nhất
2. Click vào câu hỏi → Đọc đề, suy nghĩ
3. Click mở rộng → Xem đáp án và lời giải
4. Muốn làm cả đề → Click vào đề thi bên trái
5. Làm từng câu một theo thứ tự

### Giáo viên
1. Vào trang chủ → Xem danh sách đề
2. Click vào đề cần xem
3. Duyệt qua các câu hỏi
4. Mở rộng để kiểm tra chi tiết
5. Vào /admin để quản lý (xóa, sửa)

## Tối ưu hóa

### Performance
- Sidebar sticky (dính khi scroll)
- Lazy loading cho hình ảnh
- Smooth transitions
- Optimized re-renders

### UX
- Loading state khi fetch data
- Empty state khi không có câu hỏi
- Hover effects rõ ràng
- Active state dễ nhận biết
- Expand/collapse mượt mà

## Lưu ý

1. **Dữ liệu**: Cần có câu hỏi trong database để hiển thị
2. **LaTeX**: Cần cài đặt KaTeX để render công thức toán
3. **Hình ảnh**: URL hình ảnh phải accessible
4. **Browser**: Hỗ trợ modern browsers (Chrome, Firefox, Safari, Edge)
