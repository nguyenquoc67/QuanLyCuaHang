/* ============================================================
   SỔ TẠP HÓA — Bộ máy xử lý ngôn ngữ tự nhiên (rule-based)
   Không dùng API ngoài — toàn bộ dựa trên từ khóa & regex tiếng Việt.
   Hỗ trợ các câu hỏi kiểu:
     "Cho tôi xem hóa đơn ngày 10/05"
     "Doanh thu tuần trước"
     "Doanh thu hôm nay"
     "Hóa đơn của khách An"
     "Sản phẩm sắp hết hàng"
     "Tìm sữa vinamilk"
   ============================================================ */

function startOfDay(d) { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; }
function endOfDay(d) { const x = new Date(d); x.setHours(23, 59, 59, 999); return x; }
function startOfWeek(d) {
  const x = new Date(d);
  const day = (x.getDay() + 6) % 7; // Thứ 2 = 0
  x.setDate(x.getDate() - day);
  return startOfDay(x);
}
function endOfWeek(d) { const s = startOfWeek(d); const e = new Date(s); e.setDate(e.getDate() + 6); return endOfDay(e); }
function startOfMonth(d) { const x = new Date(d.getFullYear(), d.getMonth(), 1); return startOfDay(x); }
function endOfMonth(d) { const x = new Date(d.getFullYear(), d.getMonth() + 1, 0); return endOfDay(x); }

/** Phân giải các cụm thời gian tương đối trong tiếng Việt thành {start, end, label} */
function resolveTimeExpression(textNorm, now = new Date()) {
  const t = textNorm;

  if (/\bhom nay\b/.test(t)) return { start: startOfDay(now), end: endOfDay(now), label: "hôm nay" };
  if (/\bhom qua\b/.test(t)) {
    const y = new Date(now); y.setDate(y.getDate() - 1);
    return { start: startOfDay(y), end: endOfDay(y), label: "hôm qua" };
  }
  if (/\btuan nay\b|\btuan hien tai\b/.test(t)) return { start: startOfWeek(now), end: endOfWeek(now), label: "tuần này" };
  if (/\btuan truoc\b|\btuan qua\b/.test(t)) {
    const w = new Date(now); w.setDate(w.getDate() - 7);
    return { start: startOfWeek(w), end: endOfWeek(w), label: "tuần trước" };
  }
  if (/\bthang nay\b/.test(t)) return { start: startOfMonth(now), end: endOfMonth(now), label: "tháng này" };
  if (/\bthang truoc\b/.test(t)) {
    const m = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return { start: startOfMonth(m), end: endOfMonth(m), label: "tháng trước" };
  }

  // "ngày dd/mm" hoặc "dd/mm/yyyy" hoặc "dd-mm-yyyy"
  const dateMatch = t.match(/\b(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?\b/);
  if (dateMatch) {
    const day = parseInt(dateMatch[1], 10);
    const month = parseInt(dateMatch[2], 10) - 1;
    const year = dateMatch[3] ? (dateMatch[3].length === 2 ? 2000 + parseInt(dateMatch[3], 10) : parseInt(dateMatch[3], 10)) : now.getFullYear();
    const d = new Date(year, month, day);
    if (!isNaN(d.getTime())) {
      return { start: startOfDay(d), end: endOfDay(d), label: "ngày " + d.toLocaleDateString("vi-VN") };
    }
  }

  // "N ngày qua / N ngày trước"
  const nDaysMatch = t.match(/\b(\d+)\s*ngay\s*(qua|truoc|gan day)\b/);
  if (nDaysMatch) {
    const n = parseInt(nDaysMatch[1], 10);
    const s = new Date(now); s.setDate(s.getDate() - (n - 1));
    return { start: startOfDay(s), end: endOfDay(now), label: `${n} ngày gần đây` };
  }

  return null; // Không tìm thấy mốc thời gian rõ ràng
}

/** Trích tên riêng phía sau các từ khóa như "khách", "khách hàng", "của" */
function extractNameAfter(textOriginal, keywords) {
  for (const kw of keywords) {
    const re = new RegExp(kw + "\\s+([^\\.,\\?]+)", "i");
    const m = textOriginal.match(re);
    if (m && m[1]) return m[1].trim();
  }
  return null;
}

/**
 * Phân loại ý định câu hỏi và trả về kết quả truy vấn.
 * Trả về { intent, label, data, summary }
 */
function runNLPQuery(textOriginal) {
  const norm = removeDiacritics(textOriginal.toLowerCase());
  const now = new Date();

  // 1) Ý định: DOANH THU
  if (/\bdoanh thu\b/.test(norm)) {
    const time = resolveTimeExpression(norm, now) || { start: startOfDay(now), end: endOfDay(now), label: "hôm nay" };
    const invoices = InvoiceStore.inRange(time.start, time.end);
    const revenue = InvoiceStore.revenueOf(invoices);
    return {
      intent: "revenue",
      label: `Doanh thu ${time.label}`,
      invoices,
      summary: `Doanh thu ${time.label}: ${formatVND(revenue)} — từ ${invoices.length} hóa đơn.`,
    };
  }

  // 2) Ý định: SẢN PHẨM SẮP HẾT HÀNG / TỒN KHO THẤP
  if (/(sap het hang|het hang|ton kho thap|sap can hang)/.test(norm)) {
    const items = ProductStore.lowStock();
    return {
      intent: "low_stock",
      label: "Sản phẩm sắp hết hàng",
      products: items,
      summary: items.length
        ? `Có ${items.length} sản phẩm sắp hết hàng (tồn kho ở mức cảnh báo).`
        : "Hiện không có sản phẩm nào sắp hết hàng.",
    };
  }

  // 3) Ý định: HÓA ĐƠN CỦA KHÁCH HÀNG (kiểm tra trước, vì có thể chứa từ "hóa đơn")
  const nameAfter = extractNameAfter(textOriginal, ["khách hàng", "của khách", "khách"]);
  if (/\bkhach\b/.test(norm) && nameAfter) {
    const customers = CustomerStore.findByName(nameAfter);
    if (customers.length) {
      const ids = customers.map(c => c.id);
      const invoices = InvoiceStore.all().filter(i => ids.includes(i.customerId));
      return {
        intent: "customer_invoices",
        label: `Hóa đơn của khách "${nameAfter}"`,
        invoices,
        customers,
        summary: `Tìm thấy ${customers.length} khách hàng khớp với "${nameAfter}", tổng ${invoices.length} hóa đơn.`,
      };
    }
  }

  // 4) Ý định: HÓA ĐƠN (theo ngày / khoảng thời gian)
  if (/\bhoa don\b|\bphieu\b/.test(norm)) {
    const time = resolveTimeExpression(norm, now);
    if (time) {
      const invoices = InvoiceStore.inRange(time.start, time.end);
      return {
        intent: "invoices_by_time",
        label: `Hóa đơn ${time.label}`,
        invoices,
        summary: `Tìm thấy ${invoices.length} hóa đơn ${time.label}.`,
      };
    }
    // Không có mốc thời gian -> trả về toàn bộ hóa đơn gần nhất
    const invoices = InvoiceStore.all().slice(-10).reverse();
    return {
      intent: "invoices_recent",
      label: "Hóa đơn gần đây",
      invoices,
      summary: `Không xác định được ngày cụ thể, hiển thị ${invoices.length} hóa đơn gần đây nhất.`,
    };
  }

  // 5) Ý định: TÌM SẢN PHẨM theo tên
  const productMatch = ProductStore.all().filter(p => removeDiacritics(p.name.toLowerCase()).includes(norm.replace(/^tim\s+/, "").trim()));
  if (/\btim\b/.test(norm) && productMatch.length) {
    return {
      intent: "find_product",
      label: "Tìm sản phẩm",
      products: productMatch,
      summary: `Tìm thấy ${productMatch.length} sản phẩm khớp với yêu cầu.`,
    };
  }

  // 6) Mặc định: tìm kiếm tổng hợp theo từ khóa trong sản phẩm / khách hàng
  const kwProducts = ProductStore.all().filter(p => removeDiacritics(p.name.toLowerCase()).includes(norm));
  const kwCustomers = CustomerStore.all().filter(c => removeDiacritics(c.name.toLowerCase()).includes(norm));
  if (kwProducts.length || kwCustomers.length) {
    return {
      intent: "keyword_search",
      label: "Kết quả tìm kiếm",
      products: kwProducts,
      customers: kwCustomers,
      summary: `Tìm thấy ${kwProducts.length} sản phẩm và ${kwCustomers.length} khách hàng liên quan.`,
    };
  }

  return {
    intent: "unknown",
    label: "Không hiểu câu hỏi",
    summary: 'Mình chưa hiểu ý bạn. Thử hỏi kiểu: "Doanh thu tuần trước", "Hóa đơn ngày 10/05", hoặc "Sản phẩm sắp hết hàng".',
  };
}
