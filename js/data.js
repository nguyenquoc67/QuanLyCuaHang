/* ============================================================
   SỔ TẠP HÓA — Lớp dữ liệu (Data Layer)
   Toàn bộ dữ liệu được lưu trong localStorage, không cần server.
   ============================================================ */

const DB_KEYS = {
  products: "sth_products",
  customers: "sth_customers",
  invoices: "sth_invoices",
  onlineOrders: "sth_online_orders",
  suppliers: "sth_suppliers",
  seeded: "sth_seeded_v1",
};

const CATEGORY_LIST = ["Đồ ăn", "Nước uống", "Gia vị", "Bánh kẹo", "Khác"];

function uid(prefix) {
  return prefix + "_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function loadList(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("Lỗi đọc dữ liệu:", key, e);
    return [];
  }
}

function saveList(key, list) {
  localStorage.setItem(key, JSON.stringify(list));
}

/* ---------------- Sản phẩm ---------------- */
const ProductStore = {
  all() { return loadList(DB_KEYS.products); },
  get(id) { return this.all().find(p => p.id === id) || null; },
  add(data) {
    const list = this.all();
    const item = {
      id: uid("sp"),
      name: data.name.trim(),
      category: data.category || "Khác",
      unit: data.unit || "cái",
      price: Number(data.price) || 0,
      stock: Number(data.stock) || 0,
      minStock: Number(data.minStock) || 5,
      createdAt: new Date().toISOString(),
    };
    list.push(item);
    saveList(DB_KEYS.products, list);
    return item;
  },
  update(id, data) {
    const list = this.all();
    const idx = list.findIndex(p => p.id === id);
    if (idx === -1) return null;
    list[idx] = { ...list[idx], ...data, price: Number(data.price), stock: Number(data.stock), minStock: Number(data.minStock) };
    saveList(DB_KEYS.products, list);
    return list[idx];
  },
  remove(id) {
    const list = this.all().filter(p => p.id !== id);
    saveList(DB_KEYS.products, list);
  },
  adjustStock(id, delta) {
    const list = this.all();
    const idx = list.findIndex(p => p.id === id);
    if (idx === -1) return;
    list[idx].stock = Math.max(0, Number(list[idx].stock) + delta);
    saveList(DB_KEYS.products, list);
  },
  lowStock() {
    return this.all().filter(p => p.stock <= p.minStock);
  },
};

/* ---------------- Khách hàng ---------------- */
const CustomerStore = {
  all() { return loadList(DB_KEYS.customers); },
  get(id) { return this.all().find(c => c.id === id) || null; },
  add(data) {
    const list = this.all();
    const item = {
      id: uid("kh"),
      name: data.name.trim(),
      phone: data.phone || "",
      address: data.address || "",
      createdAt: new Date().toISOString(),
    };
    list.push(item);
    saveList(DB_KEYS.customers, list);
    return item;
  },
  update(id, data) {
    const list = this.all();
    const idx = list.findIndex(c => c.id === id);
    if (idx === -1) return null;
    list[idx] = { ...list[idx], ...data };
    saveList(DB_KEYS.customers, list);
    return list[idx];
  },
  remove(id) {
    const list = this.all().filter(c => c.id !== id);
    saveList(DB_KEYS.customers, list);
  },
  findByName(query) {
    const q = removeDiacritics(query.toLowerCase()).trim();
    const qWords = q.split(/\s+/);
    return this.all().filter(c => {
      const nameNorm = removeDiacritics(c.name.toLowerCase());
      const nameWords = nameNorm.split(/\s+/);
      // Khớp nếu tất cả các từ trong truy vấn đều xuất hiện là 1 từ riêng trong tên khách
      return qWords.every(w => nameWords.includes(w));
    });
  },
};

/* ---------------- Hóa đơn ---------------- */
const InvoiceStore = {
  all() { return loadList(DB_KEYS.invoices); },
  get(id) { return this.all().find(i => i.id === id) || null; },
  nextCode() {
    const list = this.all();
    const n = list.length + 1;
    return "HD" + String(n).padStart(5, "0");
  },
  add({ customerId, items, note, createdAt }) {
    const list = this.all();
    const total = items.reduce((s, it) => s + it.price * it.qty, 0);
    const item = {
      id: uid("hd"),
      code: this.nextCode(),
      customerId: customerId || null,
      items,
      total,
      note: note || "",
      createdAt: createdAt || new Date().toISOString(),
    };
    list.push(item);
    saveList(DB_KEYS.invoices, list);
    // Trừ tồn kho
    items.forEach(it => ProductStore.adjustStock(it.productId, -it.qty));
    return item;
  },
  remove(id) {
    const inv = this.get(id);
    if (inv) {
      // Hoàn lại tồn kho khi xóa hóa đơn
      inv.items.forEach(it => ProductStore.adjustStock(it.productId, it.qty));
    }
    const list = this.all().filter(i => i.id !== id);
    saveList(DB_KEYS.invoices, list);
  },
  inRange(start, end) {
    return this.all().filter(i => {
      const t = new Date(i.createdAt).getTime();
      return t >= start.getTime() && t <= end.getTime();
    });
  },
  onDate(dateObj) {
    const start = new Date(dateObj); start.setHours(0, 0, 0, 0);
    const end = new Date(dateObj); end.setHours(23, 59, 59, 999);
    return this.inRange(start, end);
  },
  revenueOf(list) {
    return list.reduce((s, i) => s + i.total, 0);
  },
};

/* ---------------- Nhà cung cấp ---------------- */
const SUPPLIER_TYPES = ["Công ty sữa", "Công ty bánh kẹo", "Đại diện bán hàng (Sale)", "Nhà phân phối thực phẩm", "Khác"];

const SupplierStore = {
  all() { return loadList(DB_KEYS.suppliers); },
  get(id) { return this.all().find(s => s.id === id) || null; },
  add(data) {
    const list = this.all();
    const item = {
      id: uid("ncc"),
      name: data.name.trim(),
      type: data.type || "Khác",
      phone: data.phone || "",
      note: data.note || "",
      createdAt: new Date().toISOString(),
    };
    list.push(item);
    saveList(DB_KEYS.suppliers, list);
    return item;
  },
  update(id, data) {
    const list = this.all();
    const idx = list.findIndex(s => s.id === id);
    if (idx === -1) return null;
    list[idx] = { ...list[idx], ...data };
    saveList(DB_KEYS.suppliers, list);
    return list[idx];
  },
  remove(id) {
    saveList(DB_KEYS.suppliers, this.all().filter(s => s.id !== id));
  },
};

/* ---------------- Đơn đặt hàng online ---------------- */
const OnlineOrderStore = {
  all() { return loadList(DB_KEYS.onlineOrders); },
  add(data) {
    const list = this.all();
    const item = {
      id: uid("dh"),
      name: data.name.trim(),
      phone: data.phone.trim(),
      address: data.address.trim(),
      note: (data.note || "").trim(),
      status: "moi",
      createdAt: new Date().toISOString(),
    };
    list.push(item);
    saveList(DB_KEYS.onlineOrders, list);
    return item;
  },
  remove(id) {
    const list = this.all().filter(o => o.id !== id);
    saveList(DB_KEYS.onlineOrders, list);
  },
  pending() { return this.all().filter(o => o.status === "moi"); },
};

/* ---------------- Tiện ích chung ---------------- */
function removeDiacritics(str) {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d").replace(/Đ/g, "D");
}

function formatVND(n) {
  return Number(n || 0).toLocaleString("vi-VN") + " ₫";
}

function formatDate(d) {
  const dt = new Date(d);
  return dt.toLocaleDateString("vi-VN") + " " + dt.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
}

/* ---------------- Dữ liệu mẫu ---------------- */
function seedIfEmpty() {
  if (localStorage.getItem(DB_KEYS.seeded)) return;

  const sampleProducts = [
    { name: "Gạo ST25", category: "Đồ ăn", unit: "kg", price: 22000, stock: 80, minStock: 15 },
    { name: "Nước mắm Phú Quốc", category: "Gia vị", unit: "chai", price: 45000, stock: 30, minStock: 8 },
    { name: "Mì gói Hảo Hảo", category: "Đồ ăn", unit: "gói", price: 4000, stock: 200, minStock: 30 },
    { name: "Trứng gà", category: "Đồ ăn", unit: "chục", price: 32000, stock: 20, minStock: 10 },
    { name: "Dầu ăn Neptune", category: "Gia vị", unit: "chai", price: 52000, stock: 25, minStock: 6 },
    { name: "Sữa Vinamilk", category: "Nước uống", unit: "hộp", price: 7000, stock: 150, minStock: 20 },
    { name: "Đường cát trắng", category: "Gia vị", unit: "kg", price: 24000, stock: 40, minStock: 10 },
    { name: "Nước ngọt Coca-Cola", category: "Nước uống", unit: "lon", price: 10000, stock: 3, minStock: 20 },
    { name: "Bánh Oreo", category: "Bánh kẹo", unit: "gói", price: 15000, stock: 45, minStock: 10 },
    { name: "Kẹo dẻo Haribo", category: "Bánh kẹo", unit: "gói", price: 28000, stock: 18, minStock: 6 },
  ];
  const products = sampleProducts.map(p => ProductStore.add(p));

  const sampleCustomers = [
    { name: "Nguyễn Thị An", phone: "0901234567", address: "12 Lê Lợi, Q.1" },
    { name: "Trần Văn Bình", phone: "0912345678", address: "45 Nguyễn Trãi, Q.5" },
    { name: "Lê Thị Cúc", phone: "0987654321", address: "78 Cách Mạng Tháng 8" },
  ];
  const customers = sampleCustomers.map(c => CustomerStore.add(c));

  // Tạo vài hóa đơn mẫu trong 14 ngày gần đây
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const daysAgo = Math.floor(Math.random() * 14);
    const d = new Date(now);
    d.setDate(d.getDate() - daysAgo);
    d.setHours(8 + Math.floor(Math.random() * 11), Math.floor(Math.random() * 60));

    const numItems = 1 + Math.floor(Math.random() * 3);
    const items = [];
    const usedIds = new Set();
    for (let j = 0; j < numItems; j++) {
      const p = products[Math.floor(Math.random() * products.length)];
      if (usedIds.has(p.id)) continue;
      usedIds.add(p.id);
      const qty = 1 + Math.floor(Math.random() * 4);
      items.push({ productId: p.id, name: p.name, price: p.price, qty });
    }
    if (items.length === 0) continue;
    const cust = Math.random() > 0.3 ? customers[Math.floor(Math.random() * customers.length)] : null;

    const list = loadList(DB_KEYS.invoices);
    const total = items.reduce((s, it) => s + it.price * it.qty, 0);
    list.push({
      id: uid("hd"),
      code: "HD" + String(list.length + 1).padStart(5, "0"),
      customerId: cust ? cust.id : null,
      items,
      total,
      note: "",
      createdAt: d.toISOString(),
    });
    saveList(DB_KEYS.invoices, list);
  }

  localStorage.setItem(DB_KEYS.seeded, "1");

  // Đơn đặt hàng online mẫu
  OnlineOrderStore.add({
    name: "Phạm Văn Đức",
    phone: "0909112233",
    address: "23 Nguyễn Văn Cừ, Q.5",
    note: "2kg gạo ST25, 1 chai dầu ăn",
  });

  // Nhà cung cấp mẫu
  const sampleSuppliers = [
    { name: "Công ty Sữa Vinamilk", type: "Công ty sữa", phone: "1900 545 425", note: "Đặt hàng qua tổng đài, giao trong 2 ngày" },
    { name: "Công ty Bánh Kẹo Hải Hà", type: "Công ty bánh kẹo", phone: "0243 8621 953", note: "Liên hệ giờ hành chính" },
    { name: "Anh Tuấn — Sale khu vực", type: "Đại diện bán hàng (Sale)", phone: "0908 765 432", note: "Phụ trách gia vị & nước mắm" },
    { name: "Nhà phân phối Thực phẩm An Phát", type: "Nhà phân phối thực phẩm", phone: "0281 234 5678", note: "" },
  ];
  sampleSuppliers.forEach(s => SupplierStore.add(s));
}
