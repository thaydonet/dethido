# Admin Dashboard - Hướng dẫn sử dụng

## Tính năng

Admin Dashboard cung cấp các tính năng quản lý câu hỏi:

### 1. Đăng nhập Admin
- Truy cập: `http://localhost:3000/admin/login`
- Mật khẩu mặc định: `admin123` (có thể thay đổi trong file `.env.local`)

### 2. Dashboard chính
Sau khi đăng nhập, bạn sẽ thấy:

#### Thống kê tổng quan
- **Tổng số câu hỏi**: Hiển thị tổng số câu hỏi trong hệ thống
- **Trắc nghiệm (MCQ)**: Số câu hỏi trắc nghiệm 1 đáp án
- **Nhiều đáp án (MSQ)**: Số câu hỏi trắc nghiệm nhiều đáp án
- **Tự luận (SA)**: Số câu hỏi tự luận

#### Bộ lọc và tìm kiếm
- **Tìm kiếm**: Tìm kiếm theo nội dung câu hỏi hoặc mã đề
- **Lọc theo loại**: MCQ, MSQ, SA hoặc tất cả
- **Lọc theo đề**: Chọn đề cụ thể để xem

#### Danh sách câu hỏi
Mỗi câu hỏi hiển thị:
- Mã đề (DE-1-dethido, DE-2-PXN-1, ...)
- Số câu hỏi
- Loại câu hỏi (MCQ/MSQ/SA)
- Nội dung rút gọn

#### Thao tác với câu hỏi
- **Xem chi tiết** (▼): Click để xem đầy đủ nội dung, đáp án, hình ảnh, metadata
- **Xóa** (🗑️): Xóa câu hỏi (có xác nhận)

## Cấu hình

### Thay đổi mật khẩu admin
Chỉnh sửa file `frontend/.env.local`:
```env
ADMIN_PASSWORD=your_secure_password_here
```

### Bảo mật
- Mật khẩu được lưu trong cookie HTTP-only
- Session tồn tại 7 ngày
- Chỉ admin mới có quyền xóa/sửa câu hỏi

## API Endpoints

### POST `/api/admin/login`
Đăng nhập admin
```json
{
  "password": "admin123"
}
```

### POST `/api/admin/logout`
Đăng xuất

### DELETE `/api/admin/questions/[id]`
Xóa câu hỏi (yêu cầu authentication)

### PATCH `/api/admin/questions/[id]`
Cập nhật câu hỏi (yêu cầu authentication)

## Giao diện

Dashboard được thiết kế với:
- Gradient màu tím đẹp mắt
- Card thống kê với icon sinh động
- Hover effects mượt mà
- Responsive trên mobile
- Dark mode ready (có thể mở rộng)

## Lưu ý

1. **Bảo mật**: Đổi mật khẩu mặc định trước khi deploy production
2. **Backup**: Luôn backup database trước khi xóa hàng loạt
3. **Performance**: Dashboard load tất cả câu hỏi, nếu có >1000 câu hỏi nên thêm pagination
