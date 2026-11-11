# Trợ Lý Giao Bài Tập Tiếng Anh (BuildHomeWork)

Ứng dụng giúp giáo viên tiếng Anh (Tiểu học, THCS/THPT, Giao tiếp) tạo nhanh bài tập về nhà chỉ trong ~30 giây, hỗ trợ:

- **2 chế độ AI:**
  1. **Tự động 1-click với Gemini API** (hỗ trợ cả nhập chữ lẫn chụp/tải ảnh trang sách giáo khoa).
  2. **Không cần API Key:** tự ghép Prompt chuẩn sư phạm để copy sang ChatGPT/Gemini web rồi dán kết quả về app.
- **Xuất Word (`.docx`)** 3 bản: Chỉ Đề bài / Đề + Đáp án / Bản Giáo viên (có giải thích).
- **Xuất PDF / In khổ A4** chuẩn đẹp, giữ nguyên font tiếng Việt.
- **Link làm bài Online & Tự chấm điểm** (hỗ trợ cả Link ngắn lưu bảng điểm về máy Giáo viên và Link Độc Lập gửi qua Zalo khi host tĩnh).

## Cách mở nhanh trên Windows
- **Cách dễ nhất (cho giáo viên):** Double-click vào file `Mo_App_Giao_Bai_Tap.bat` (chạy bản đã build tại `http://localhost:3001`).
- **Chế độ phát triển (dev):**
  ```bash
  npm run dev
  ```
  Mở `http://localhost:5173`.

