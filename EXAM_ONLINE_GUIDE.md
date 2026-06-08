# Hướng dẫn Thi Online - TN THPT Môn Toán 2026

## Tổng quan

Hệ thống thi online mô phỏng đề thi TN THPT Môn Toán với cấu trúc chuẩn:
- **12 câu trắc nghiệm (MCQ)** - Chọn 1 đáp án đúng
- **4 câu nhiều đáp án (MSQ)** - Chọn nhiều đáp án đúng
- **6 câu tự luận (SA)** - Nhập đáp án số

## Tính năng chính

### 1. Random câu hỏi mỗi lần thi
- Mỗi lần load/refresh trang sẽ random câu hỏi mới từ ngân hàng
- Đảm bảo học sinh có thể luyện tập nhiều lần với đề khác nhau
- Câu hỏi được lấy ngẫu nhiên từ pool 100+ đề thi

### 2. Đồng hồ đếm ngược
- Thời gian: **90 phút** (chuẩn TN THPT)
- Hiển thị ở header, luôn nhìn thấy
- Cảnh báo màu đỏ khi còn < 5 phút
- Tự động nộp bài khi hết giờ

### 3. Bảng điều hướng câu hỏi
- Hiển thị 22 ô số (câu 1-22)
- Màu sắc phân biệt:
  - **Trắng**: Chưa làm
  - **Xanh lá**: Đã làm
  - **Tím**: Đang làm
- Border màu phân biệt loại:
  - **Xanh dương**: MCQ (câu 1-12)
  - **Xanh lá**: MSQ (câu 13-16)
  - **Đỏ**: SA (câu 17-22)
- Click vào số để nhảy đến câu đó

### 4. Thống kê real-time
- Số câu đã làm / tổng số câu
- Số câu chưa làm
- Cập nhật tức thì khi chọn đáp án

### 5. Giao diện làm bài
- Hiển thị từng câu một (không scroll dài)
- Nút "Câu trước" / "Câu sau" để di chuyển
- Hiển thị đầy đủ:
  - Nội dung câu hỏi (có LaTeX)
  - Hình ảnh (nếu có)
  - Các đáp án A, B, C, D
  - Ô input cho câu tự luận

### 6. Nộp bài và xem kết quả
- Nút "Nộp bài" luôn hiển thị ở sidebar
- Xác nhận trước khi nộp
- Sau khi nộp:
  - Hiển thị điểm số (X/22 câu đúng)
  - Quy đổi thang điểm 10
  - Highlight đáp án đúng/sai
  - Hiển thị đáp án đúng cho câu SA
  - Nút "Làm đề mới" để thi lại

## Cấu trúc URL

```
/de-thi-thu-tn-thpt-mon-toan-2026
```

## Cách hoạt động

### Server-side (page.tsx)
```typescript
1. Fetch pool câu hỏi từ Supabase:
   - MCQ: Lấy tối đa 1000 câu type='mcq'
   - MSQ: Lấy tối đa 1000 câu type='msq'
   - SA: Lấy tối đa 1000 câu type='sa'

2. Shuffle và chọn random:
   - 12 câu MCQ ngẫu nhiên
   - 4 câu MSQ ngẫu nhiên
   - 6 câu SA ngẫu nhiên

3. Đánh số lại:
   - MCQ: Câu 1-12
   - MSQ: Câu 13-16
   - SA: Câu 17-22

4. Pass xuống client component
```

### Client-side (ExamInterface.tsx)
```typescript
1. State management:
   - currentQuestion: Câu đang hiển thị
   - answers: Object lưu đáp án {questionNumber: answer}
   - timeLeft: Thời gian còn lại (giây)
   - isSubmitted: Đã nộp bài chưa
   - showResults: Hiển thị kết quả

2. Timer:
   - useEffect với setInterval
   - Countdown mỗi giây
   - Auto submit khi hết giờ

3. Answer handling:
   - MCQ: Radio button, lưu 1 đáp án
   - MSQ: Checkbox, lưu nhiều đáp án (A,B,C)
   - SA: Text input, lưu string

4. Scoring:
   - So sánh answers[n] với question.answer
   - Đếm số câu đúng
   - Tính điểm thang 10
```

## Database Schema

Câu hỏi cần có metadata.type:
```json
{
  "id": "uuid",
  "content": "Nội dung câu hỏi...",
  "options": {
    "option_a": "Đáp án A",
    "option_b": "Đáp án B",
    "option_c": "Đáp án C",
    "option_d": "Đáp án D"
  },
  "answer": "A" hoặc "A,B,C" hoặc "123.45",
  "metadata": {
    "type": "mcq" | "msq" | "sa",
    "difficulty": "easy" | "medium" | "hard",
    ...
  }
}
```

## Upload 100 đề thi

### Cách 1: Sử dụng pipeline hiện có
```bash
# Đặt các file JSON vào thư mục gốc
# Chạy pipeline cho từng đề
python run_pipeline.py --input de-1.json
python run_pipeline.py --input de-2.json
...
```

### Cách 2: Bulk upload script
```python
import json
from supabase import create_client

supabase = create_client(url, key)

for i in range(1, 101):
    with open(f'de-{i}.json') as f:
        data = json.load(f)
        questions = data['questions']
        
        for q in questions:
            supabase.table('questions').insert({
                'de_id': data['title'],
                'content': q['question'],
                'options': {
                    'option_a': q.get('option_a'),
                    'option_b': q.get('option_b'),
                    'option_c': q.get('option_c'),
                    'option_d': q.get('option_d'),
                },
                'answer': q['correct_option'],
                'metadata': {
                    'type': q['type'],
                    'difficulty': q.get('difficulty_level'),
                }
            }).execute()
```

### Cách 3: Admin dashboard
- Vào /admin
- Tạo chức năng "Import đề thi"
- Upload file JSON
- Parse và insert vào database

## Tối ưu hóa

### Performance
- Server-side random (không load hết vào client)
- Chỉ render 1 câu tại 1 thời điểm
- Lazy load images
- Memoize calculations

### UX
- Sticky header với timer
- Sticky sidebar với navigator
- Smooth transitions
- Keyboard shortcuts (← → để di chuyển câu)
- Auto-save answers (có thể thêm localStorage)

### SEO
- Dynamic metadata
- Open Graph tags
- Structured data for educational content

## Mở rộng tương lai

### 1. Lưu lịch sử thi
```typescript
// Tạo bảng exam_results
{
  user_id: uuid,
  exam_date: timestamp,
  questions: jsonb, // Lưu các câu đã thi
  answers: jsonb,   // Lưu đáp án đã chọn
  score: number,
  time_spent: number
}
```

### 2. Phân tích chi tiết
- Thống kê câu nào sai nhiều
- Chủ đề nào yếu
- Xu hướng điểm số
- So sánh với trung bình

### 3. Chế độ luyện tập
- Luyện theo chủ đề
- Luyện theo độ khó
- Chỉ làm câu sai trước đó
- Giải thích chi tiết sau mỗi câu

### 4. Tính năng xã hội
- Bảng xếp hạng
- Chia sẻ kết quả
- Thách đấu bạn bè
- Nhóm học tập

## Lưu ý quan trọng

1. **Metadata type**: Đảm bảo tất cả câu hỏi có `metadata.type` đúng
2. **Answer format**: 
   - MCQ: "A" hoặc "B" hoặc "C" hoặc "D"
   - MSQ: "A,B" hoặc "A,C,D" (phân cách bằng dấu phẩy)
   - SA: String số "123.45"
3. **Random seed**: Mỗi lần refresh = đề mới hoàn toàn
4. **Browser compatibility**: Test trên Chrome, Firefox, Safari, Edge
5. **Mobile responsive**: Đảm bảo làm bài được trên điện thoại

## Troubleshooting

### Không load được câu hỏi
- Kiểm tra Supabase connection
- Kiểm tra metadata.type trong database
- Xem console log lỗi

### Timer không chạy
- Kiểm tra useEffect dependencies
- Xem có conflict với React Strict Mode không

### Đáp án không lưu
- Kiểm tra state management
- Xem handleAnswerChange có được gọi không

### Điểm số sai
- Kiểm tra format answer trong database
- So sánh logic trong calculateScore()
