# 📒 Sổ Tạp Hóa — Hệ Thống Quản Lý Cửa Hàng Tạp Hóa Thông Minh

Website quản lý sản phẩm, hóa đơn, doanh thu và khách hàng cho cửa hàng tạp hóa,
có trợ lý AI hỗ trợ tra cứu bằng ngôn ngữ tự nhiên tiếng Việt.

## Tính năng

- **Quản lý sản phẩm**: thêm/sửa/xóa, theo dõi tồn kho, cảnh báo sắp hết hàng.
- **Quản lý hóa đơn**: lập hóa đơn bán hàng, tự động trừ tồn kho, xem chi tiết dạng phiếu tính tiền.
- **Doanh thu**: biểu đồ doanh thu theo ngày (7/30/90 ngày), top sản phẩm bán chạy.
- **Quản lý khách hàng**: thông tin liên hệ, tổng chi tiêu.
- **Trợ lý AI (rule-based NLP)**: gõ câu hỏi tự nhiên như:
  - "Cho tôi xem hóa đơn ngày 10/05"
  - "Doanh thu tuần trước"
  - "Doanh thu tháng này"
  - "Sản phẩm sắp hết hàng"
  - "Hóa đơn của khách An"
  - "Tìm sữa vinamilk"

## Công nghệ

- HTML/CSS/JavaScript thuần (không cần build tool, không cần backend).
- Dữ liệu lưu trong **localStorage** của trình duyệt.
- Biểu đồ dùng [Chart.js](https://www.chartjs.org/) (tải qua CDN).
- Bộ xử lý ngôn ngữ tự nhiên tự viết bằng regex + từ khóa tiếng Việt (`js/nlp.js`), không gọi API ngoài.

## Cấu trúc thư mục

```
tapha/
├── index.html          # Trang chính (toàn bộ giao diện)
├── css/
│   └── style.css       # Giao diện chủ đề "Sổ Tạp Hóa"
└── js/
    ├── data.js          # Lớp dữ liệu + localStorage + dữ liệu mẫu
    ├── nlp.js            # Bộ máy xử lý ngôn ngữ tự nhiên
    └── app.js             # Điều hướng, hiển thị, CRUD, modal
```

## Chạy thử trên máy

Không cần cài đặt gì — chỉ cần mở `index.html` trực tiếp bằng trình duyệt,
hoặc chạy server tĩnh đơn giản:

```bash
python3 -m http.server 8000
# rồi mở http://localhost:8000
```

## Đưa lên GitHub Pages

1. Tạo repository mới trên GitHub (ví dụ `tap-hoa-thong-minh`).
2. Đẩy toàn bộ nội dung thư mục này lên nhánh `main`:
   ```bash
   git init
   git add .
   git commit -m "Hệ thống quản lý cửa hàng tạp hóa thông minh"
   git branch -M main
   git remote add origin https://github.com/<username>/<ten-repo>.git
   git push -u origin main
   ```
3. Vào **Settings → Pages** trên GitHub, chọn nguồn là nhánh `main`, thư mục `/ (root)`.
4. Sau ít phút, trang sẽ có tại: `https://<username>.github.io/<ten-repo>/`

## Ghi chú

- Lần đầu mở trang, hệ thống sẽ tự tạo **dữ liệu mẫu** (8 sản phẩm, 3 khách hàng, 12 hóa đơn)
  để tiện demo. Có thể xóa dữ liệu bằng cách xóa localStorage của trình duyệt (DevTools → Application → Local Storage).
- Vì dữ liệu lưu cục bộ theo trình duyệt, mỗi máy/mỗi trình duyệt sẽ có dữ liệu riêng.
