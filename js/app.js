/* ============================================================
   SỔ TẠP HÓA — app.js (điều hướng, hiển thị, CRUD, modal, AI)
   ============================================================ */

const ICON_EDIT = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>`;
const ICON_TRASH = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>`;
const ICON_EYE = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z"/><circle cx="12" cy="12" r="3"/></svg>`;
const ICON_X = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>`;
const ICON_CHECK = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>`;

document.addEventListener("DOMContentLoaded", () => {
  seedIfEmpty();
  initNav();
  initModal();
  initAI();
  initProducts();
  initInvoices();
  initCustomers();
  initSuppliers();
  initRevenue();
  initContactWidget();
  initGreetingClock();
  renderDashboard();
  showView("dashboard");
});

/* ---------------- Lời chào + đồng hồ ---------------- */
const WEEKDAY_VN = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];

function initGreetingClock() {
  updateGreetingClock();
  setInterval(updateGreetingClock, 1000);
}

function updateGreetingClock() {
  const now = new Date();
  const weekday = WEEKDAY_VN[now.getDay()];
  const dateStr = `ngày ${String(now.getDate()).padStart(2, "0")} tháng ${String(now.getMonth() + 1).padStart(2, "0")} năm ${now.getFullYear()}`;
  const timeStr = now.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const el = document.getElementById("greeting-text");
  if (el) el.textContent = `Xin chào! Hôm nay là ${weekday}, ${dateStr} — bây giờ là ${timeStr}.`;
}

/* ---------------- Điều hướng ---------------- */
function initNav() {
  document.querySelectorAll(".nav-item").forEach(btn => {
    btn.addEventListener("click", () => showView(btn.dataset.view));
  });
}

function showView(name) {
  document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
  document.querySelectorAll(".nav-item").forEach(b => b.classList.remove("active"));
  const view = document.getElementById("view-" + name);
  const btn = document.querySelector(`.nav-item[data-view="${name}"]`);
  if (view) view.classList.add("active");
  if (btn) btn.classList.add("active");

  if (name === "dashboard") renderDashboard();
  if (name === "products") renderProducts();
  if (name === "invoices") renderInvoices();
  if (name === "customers") renderCustomers();
  if (name === "suppliers") renderSuppliers();
  if (name === "revenue") renderRevenue();
}

/* ---------------- Modal & Toast ---------------- */
function initModal() {
  document.getElementById("modal-root").addEventListener("click", (e) => {
    if (e.target.classList.contains("modal-backdrop")) closeModal();
  });
}

function openModal(innerHTML) {
  const root = document.getElementById("modal-root");
  root.innerHTML = `
    <div class="modal-backdrop">
      <div class="modal-card">${innerHTML}</div>
    </div>`;
}

function closeModal() {
  document.getElementById("modal-root").innerHTML = "";
}

function showToast(message, type = "ok") {
  const root = document.getElementById("toast-root");
  const el = document.createElement("div");
  el.className = "toast toast-" + type;
  el.textContent = message;
  root.appendChild(el);
  setTimeout(() => el.classList.add("show"), 10);
  setTimeout(() => {
    el.classList.remove("show");
    setTimeout(() => el.remove(), 300);
  }, 2600);
}

/* ---------------- Widget liên hệ & Đặt hàng online ---------------- */
function initContactWidget() {
  const widget = document.getElementById("contact-widget");
  const fab = document.getElementById("contact-fab");
  fab.addEventListener("click", () => {
    const isOpen = widget.classList.toggle("open");
    fab.setAttribute("aria-expanded", isOpen ? "true" : "false");
  });
  document.addEventListener("click", (e) => {
    if (widget.classList.contains("open") && !widget.contains(e.target)) {
      widget.classList.remove("open");
      fab.setAttribute("aria-expanded", "false");
    }
  });
  document.getElementById("btn-order-online").addEventListener("click", () => {
    widget.classList.remove("open");
    openOrderForm();
  });
}

function openOrderForm() {
  openModal(`
    <h3>🛍️ Đặt hàng online</h3>
    <p class="page-sub" style="margin-bottom:4px">Để lại thông tin, cửa hàng sẽ liên hệ xác nhận đơn hàng qua Zalo/điện thoại sớm nhất.</p>
    <form id="order-form" class="form-grid">
      <label style="grid-column:1/-1">Họ và tên <input required name="name" placeholder="Nguyễn Văn A"></label>
      <label>Số điện thoại <input required name="phone" type="tel" placeholder="09xxxxxxxx"></label>
      <label>Địa chỉ nhận hàng <input required name="address" placeholder="Số nhà, đường, phường/xã"></label>
      <label style="grid-column:1/-1">Bạn muốn mua gì? <input name="note" placeholder="VD: 2kg gạo, 1 chai nước mắm..."></label>
      <div class="form-actions">
        <button type="button" class="btn-ghost" onclick="closeModal()">Hủy</button>
        <button type="submit" class="btn-primary">Gửi đơn đặt hàng</button>
      </div>
    </form>
  `);
  document.getElementById("order-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target).entries());
    const order = OnlineOrderStore.add(data);
    showOrderConfirmation(order);
    renderDashboard();
  });
}

function showOrderConfirmation(order) {
  const message = `Xin chào, tôi muốn đặt hàng:%0A- Họ tên: ${order.name}%0A- SĐT: ${order.phone}%0A- Địa chỉ: ${order.address}%0A- Mặt hàng: ${order.note || "(chưa ghi rõ)"}`;
  openModal(`
    <h3>✅ Đã ghi nhận đơn hàng!</h3>
    <p>Cảm ơn ${order.name}. Để được xử lý nhanh nhất, bạn có thể nhắn tin xác nhận qua Zalo cho cửa hàng:</p>
    <div class="form-actions" style="justify-content:flex-start">
      <a class="btn-primary" style="text-decoration:none" href="https://zalo.me/0983621217" target="_blank" rel="noopener">Mở Zalo nhắn xác nhận</a>
      <button class="btn-ghost" onclick="closeModal()">Đóng</button>
    </div>
  `);
}

function renderDashboardOnlineOrders() {
  const pending = OnlineOrderStore.pending().slice().reverse();
  const box = document.getElementById("dashboard-online-orders");
  box.innerHTML = pending.length ? pending.map(o => `
    <div class="order-row">
      <div>
        <div class="order-row-name">${o.name} — ${o.phone}</div>
        <div class="order-row-meta">${o.address}${o.note ? " · " + o.note : ""} · ${formatDate(o.createdAt)}</div>
      </div>
      <button class="btn-icon" onclick="resolveOnlineOrder('${o.id}')" title="Đánh dấu đã xử lý" aria-label="Đã xử lý">${ICON_CHECK}</button>
    </div>`).join("") : `<p class="empty-note">Chưa có đơn đặt hàng online nào.</p>`;
}

function resolveOnlineOrder(id) {
  OnlineOrderStore.remove(id);
  renderDashboard();
  showToast("Đã xử lý đơn đặt hàng");
}

/* ---------------- Dashboard ---------------- */
function renderDashboard() {
  const now = new Date();
  const todayInvoices = InvoiceStore.onDate(now);
  const revenueToday = InvoiceStore.revenueOf(todayInvoices);
  const lowStock = ProductStore.lowStock();
  const customers = CustomerStore.all();

  document.getElementById("stat-revenue-today").textContent = formatVND(revenueToday);
  document.getElementById("stat-invoice-count").textContent = todayInvoices.length;
  document.getElementById("stat-low-stock").textContent = lowStock.length;
  document.getElementById("stat-customers").textContent = customers.length;

  const recent = InvoiceStore.all().slice(-6).reverse();
  document.getElementById("dashboard-recent-invoices").innerHTML = recent.length
    ? recent.map(rowInvoiceMini).join("")
    : `<p class="empty-note">Chưa có hóa đơn nào.</p>`;

  document.getElementById("dashboard-low-stock-list").innerHTML = lowStock.length
    ? lowStock.map(p => `
        <div class="mini-row">
          <span>${p.name}</span>
          <span class="tag tag-warn">còn ${p.stock} ${p.unit}</span>
        </div>`).join("")
    : `<p class="empty-note">Không có sản phẩm sắp hết hàng 🎉</p>`;

  renderDashboardOnlineOrders();
}

function rowInvoiceMini(inv) {
  const cust = inv.customerId ? CustomerStore.get(inv.customerId) : null;
  return `
    <div class="mini-row">
      <span>${inv.code} — ${cust ? cust.name : "Khách lẻ"}</span>
      <span class="tag">${formatVND(inv.total)}</span>
    </div>`;
}

/* ---------------- Sản phẩm ---------------- */
let currentCategoryFilter = "Tất cả";

function initProducts() {
  document.getElementById("btn-add-product").addEventListener("click", () => openProductForm());
  document.getElementById("product-search").addEventListener("input", renderProducts);
  renderCategoryTabs();
}

function renderCategoryTabs() {
  const tabs = ["Tất cả", ...CATEGORY_LIST];
  const box = document.getElementById("category-tabs");
  box.innerHTML = tabs.map(cat => `
    <button type="button" class="cat-tab ${cat === currentCategoryFilter ? "active" : ""}" data-cat="${cat}">${cat}</button>
  `).join("");
  box.querySelectorAll(".cat-tab").forEach(btn => {
    btn.addEventListener("click", () => {
      currentCategoryFilter = btn.dataset.cat;
      renderCategoryTabs();
      renderProducts();
    });
  });
}

function renderProducts() {
  const q = removeDiacritics((document.getElementById("product-search").value || "").toLowerCase());
  const list = ProductStore.all().filter(p => {
    const matchesSearch = removeDiacritics(p.name.toLowerCase()).includes(q);
    const matchesCategory = currentCategoryFilter === "Tất cả" || p.category === currentCategoryFilter;
    return matchesSearch && matchesCategory;
  });
  const body = document.getElementById("product-table-body");
  body.innerHTML = list.length ? list.map(p => `
    <tr class="${p.stock <= p.minStock ? "row-warn" : ""}">
      <td>${p.name}</td>
      <td><span class="tag">${p.category}</span></td>
      <td>${formatVND(p.price)} / ${p.unit}</td>
      <td>${p.stock} ${p.unit}</td>
      <td>
        <button class="btn-icon" onclick="openProductForm('${p.id}')" title="Sửa" aria-label="Sửa sản phẩm">${ICON_EDIT}</button>
        <button class="btn-icon" onclick="deleteProduct('${p.id}')" title="Xóa" aria-label="Xóa sản phẩm">${ICON_TRASH}</button>
      </td>
    </tr>`).join("") : `<tr><td colspan="5" class="empty-note">Không có sản phẩm nào trong danh mục này.</td></tr>`;
}

function openProductForm(id) {
  const p = id ? ProductStore.get(id) : null;
  openModal(`
    <h3>${p ? "Sửa sản phẩm" : "Thêm sản phẩm mới"}</h3>
    <form id="product-form" class="form-grid">
      <label>Tên sản phẩm <input required name="name" value="${p ? p.name : ""}"></label>
      <label>Danh mục
        <select name="category">
          ${CATEGORY_LIST.map(c => `<option value="${c}" ${p && p.category === c ? "selected" : ""}>${c}</option>`).join("")}
        </select>
      </label>
      <label>Đơn vị tính <input name="unit" value="${p ? p.unit : "cái"}" placeholder="kg, chai, gói..."></label>
      <label>Giá bán (₫) <input required type="number" min="0" name="price" value="${p ? p.price : ""}"></label>
      <label>Số lượng tồn <input required type="number" min="0" name="stock" value="${p ? p.stock : ""}"></label>
      <label>Ngưỡng cảnh báo <input type="number" min="0" name="minStock" value="${p ? p.minStock : 5}"></label>
      <div class="form-actions">
        <button type="button" class="btn-ghost" onclick="closeModal()">Hủy</button>
        <button type="submit" class="btn-primary">${p ? "Lưu thay đổi" : "Thêm sản phẩm"}</button>
      </div>
    </form>
  `);
  document.getElementById("product-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target).entries());
    if (p) { ProductStore.update(p.id, data); showToast("Đã cập nhật sản phẩm"); }
    else { ProductStore.add(data); showToast("Đã thêm sản phẩm mới"); }
    closeModal();
    renderProducts();
    renderDashboard();
  });
}

function deleteProduct(id) {
  if (!confirm("Xóa sản phẩm này khỏi kho?")) return;
  ProductStore.remove(id);
  renderProducts();
  renderDashboard();
  showToast("Đã xóa sản phẩm", "warn");
}

/* ---------------- Khách hàng ---------------- */
function initCustomers() {
  document.getElementById("btn-add-customer").addEventListener("click", () => openCustomerForm());
  document.getElementById("customer-search").addEventListener("input", renderCustomers);
}

function renderCustomers() {
  const q = removeDiacritics((document.getElementById("customer-search").value || "").toLowerCase());
  const list = CustomerStore.all().filter(c => removeDiacritics(c.name.toLowerCase()).includes(q));
  const body = document.getElementById("customer-table-body");
  body.innerHTML = list.length ? list.map(c => {
    const spent = InvoiceStore.all().filter(i => i.customerId === c.id).reduce((s, i) => s + i.total, 0);
    return `
    <tr>
      <td>${c.name}</td>
      <td>${c.phone || "—"}</td>
      <td>${c.address || "—"}</td>
      <td>${formatVND(spent)}</td>
      <td>
        <button class="btn-icon" onclick="openCustomerForm('${c.id}')" title="Sửa" aria-label="Sửa khách hàng">${ICON_EDIT}</button>
        <button class="btn-icon" onclick="deleteCustomer('${c.id}')" title="Xóa" aria-label="Xóa khách hàng">${ICON_TRASH}</button>
      </td>
    </tr>`;
  }).join("") : `<tr><td colspan="5" class="empty-note">Chưa có khách hàng nào.</td></tr>`;
}

function openCustomerForm(id) {
  const c = id ? CustomerStore.get(id) : null;
  openModal(`
    <h3>${c ? "Sửa khách hàng" : "Thêm khách hàng mới"}</h3>
    <form id="customer-form" class="form-grid">
      <label>Họ và tên <input required name="name" value="${c ? c.name : ""}"></label>
      <label>Số điện thoại <input name="phone" value="${c ? c.phone : ""}"></label>
      <label>Địa chỉ <input name="address" value="${c ? c.address : ""}"></label>
      <div class="form-actions">
        <button type="button" class="btn-ghost" onclick="closeModal()">Hủy</button>
        <button type="submit" class="btn-primary">${c ? "Lưu thay đổi" : "Thêm khách hàng"}</button>
      </div>
    </form>
  `);
  document.getElementById("customer-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target).entries());
    if (c) { CustomerStore.update(c.id, data); showToast("Đã cập nhật khách hàng"); }
    else { CustomerStore.add(data); showToast("Đã thêm khách hàng mới"); }
    closeModal();
    renderCustomers();
    renderDashboard();
  });
}

function deleteCustomer(id) {
  if (!confirm("Xóa khách hàng này?")) return;
  CustomerStore.remove(id);
  renderCustomers();
  renderDashboard();
  showToast("Đã xóa khách hàng", "warn");
}

/* ---------------- Nhà cung cấp ---------------- */
function initSuppliers() {
  document.getElementById("btn-add-supplier").addEventListener("click", () => openSupplierForm());
  document.getElementById("supplier-search").addEventListener("input", renderSuppliers);
}

function renderSuppliers() {
  const q = removeDiacritics((document.getElementById("supplier-search").value || "").toLowerCase());
  const list = SupplierStore.all().filter(s => removeDiacritics((s.name + " " + s.type).toLowerCase()).includes(q));
  const body = document.getElementById("supplier-table-body");
  body.innerHTML = list.length ? list.map(s => `
    <tr>
      <td>${s.name}</td>
      <td><span class="tag">${s.type}</span></td>
      <td><a href="tel:${s.phone.replace(/\s/g, "")}" class="phone-link">${s.phone || "—"}</a></td>
      <td>${s.note || "—"}</td>
      <td>
        <button class="btn-icon" onclick="openSupplierForm('${s.id}')" title="Sửa" aria-label="Sửa nhà cung cấp">${ICON_EDIT}</button>
        <button class="btn-icon" onclick="deleteSupplier('${s.id}')" title="Xóa" aria-label="Xóa nhà cung cấp">${ICON_TRASH}</button>
      </td>
    </tr>`).join("") : `<tr><td colspan="5" class="empty-note">Chưa có nhà cung cấp nào.</td></tr>`;
}

function openSupplierForm(id) {
  const s = id ? SupplierStore.get(id) : null;
  openModal(`
    <h3>${s ? "Sửa nhà cung cấp" : "Thêm nhà cung cấp mới"}</h3>
    <form id="supplier-form" class="form-grid">
      <label style="grid-column:1/-1">Tên nhà cung cấp <input required name="name" value="${s ? s.name : ""}" placeholder="VD: Công ty Sữa Vinamilk"></label>
      <label>Loại
        <select name="type">
          ${SUPPLIER_TYPES.map(t => `<option value="${t}" ${s && s.type === t ? "selected" : ""}>${t}</option>`).join("")}
        </select>
      </label>
      <label>Số điện thoại <input required name="phone" value="${s ? s.phone : ""}"></label>
      <label style="grid-column:1/-1">Ghi chú <input name="note" value="${s ? s.note : ""}" placeholder="VD: mặt hàng phụ trách, giờ liên hệ..."></label>
      <div class="form-actions">
        <button type="button" class="btn-ghost" onclick="closeModal()">Hủy</button>
        <button type="submit" class="btn-primary">${s ? "Lưu thay đổi" : "Thêm nhà cung cấp"}</button>
      </div>
    </form>
  `);
  document.getElementById("supplier-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target).entries());
    if (s) { SupplierStore.update(s.id, data); showToast("Đã cập nhật nhà cung cấp"); }
    else { SupplierStore.add(data); showToast("Đã thêm nhà cung cấp mới"); }
    closeModal();
    renderSuppliers();
  });
}

function deleteSupplier(id) {
  if (!confirm("Xóa nhà cung cấp này?")) return;
  SupplierStore.remove(id);
  renderSuppliers();
  showToast("Đã xóa nhà cung cấp", "warn");
}

/* ---------------- Hóa đơn ---------------- */
let draftItems = [];

function initInvoices() {
  document.getElementById("btn-add-invoice").addEventListener("click", () => openInvoiceForm());
  document.getElementById("invoice-search").addEventListener("input", renderInvoices);
}

function renderInvoices() {
  const q = removeDiacritics((document.getElementById("invoice-search").value || "").toLowerCase());
  const list = InvoiceStore.all().slice().reverse().filter(i => {
    const cust = i.customerId ? CustomerStore.get(i.customerId) : null;
    const hay = removeDiacritics((i.code + " " + (cust ? cust.name : "khach le")).toLowerCase());
    return hay.includes(q);
  });
  const body = document.getElementById("invoice-table-body");
  body.innerHTML = list.length ? list.map(i => {
    const cust = i.customerId ? CustomerStore.get(i.customerId) : null;
    return `
    <tr>
      <td>${i.code}</td>
      <td>${formatDate(i.createdAt)}</td>
      <td>${cust ? cust.name : "Khách lẻ"}</td>
      <td>${i.items.length} mặt hàng</td>
      <td>${formatVND(i.total)}</td>
      <td>
        <button class="btn-icon" onclick="viewInvoice('${i.id}')" title="Xem" aria-label="Xem hóa đơn">${ICON_EYE}</button>
        <button class="btn-icon" onclick="deleteInvoice('${i.id}')" title="Xóa" aria-label="Xóa hóa đơn">${ICON_TRASH}</button>
      </td>
    </tr>`;
  }).join("") : `<tr><td colspan="6" class="empty-note">Chưa có hóa đơn nào.</td></tr>`;
}

function openInvoiceForm() {
  draftItems = [];
  const products = ProductStore.all();
  const customers = CustomerStore.all();
  openModal(`
    <h3>Lập hóa đơn mới</h3>
    <div class="form-grid">
      <label>Khách hàng
        <select id="invoice-customer">
          <option value="">Khách lẻ</option>
          ${customers.map(c => `<option value="${c.id}">${c.name}</option>`).join("")}
        </select>
      </label>
    </div>
    <div class="invoice-builder">
      <div class="item-add-row">
        <select id="item-product">
          ${products.map(p => `<option value="${p.id}">${p.name} — ${formatVND(p.price)} (còn ${p.stock} ${p.unit})</option>`).join("")}
        </select>
        <input type="number" id="item-qty" min="1" value="1" style="width:70px">
        <button type="button" class="btn-ghost" onclick="addDraftItem()">+ Thêm</button>
      </div>
      <table class="mini-table">
        <thead><tr><th>Sản phẩm</th><th>SL</th><th>Đơn giá</th><th>Thành tiền</th><th></th></tr></thead>
        <tbody id="draft-items-body"></tbody>
      </table>
      <div class="invoice-total">Tổng cộng: <span id="draft-total">0 ₫</span></div>
    </div>
    <div class="form-actions">
      <button type="button" class="btn-ghost" onclick="closeModal()">Hủy</button>
      <button type="button" class="btn-primary" onclick="submitInvoice()">Lưu hóa đơn</button>
    </div>
  `);
  renderDraftItems();
}

function addDraftItem() {
  const productId = document.getElementById("item-product").value;
  const qty = parseInt(document.getElementById("item-qty").value, 10) || 1;
  const product = ProductStore.get(productId);
  if (!product) return;
  if (qty > product.stock) {
    showToast(`Chỉ còn ${product.stock} ${product.unit} trong kho`, "warn");
    return;
  }
  const existing = draftItems.find(it => it.productId === productId);
  if (existing) existing.qty += qty;
  else draftItems.push({ productId, name: product.name, price: product.price, qty });
  renderDraftItems();
}

function removeDraftItem(productId) {
  draftItems = draftItems.filter(it => it.productId !== productId);
  renderDraftItems();
}

function renderDraftItems() {
  const body = document.getElementById("draft-items-body");
  body.innerHTML = draftItems.length ? draftItems.map(it => `
    <tr>
      <td>${it.name}</td>
      <td>${it.qty}</td>
      <td>${formatVND(it.price)}</td>
      <td>${formatVND(it.price * it.qty)}</td>
      <td><button type="button" class="btn-icon" onclick="removeDraftItem('${it.productId}')" aria-label="Bỏ mặt hàng">${ICON_X}</button></td>
    </tr>`).join("") : `<tr><td colspan="5" class="empty-note">Chưa có mặt hàng nào.</td></tr>`;
  const total = draftItems.reduce((s, it) => s + it.price * it.qty, 0);
  document.getElementById("draft-total").textContent = formatVND(total);
}

function submitInvoice() {
  if (draftItems.length === 0) {
    showToast("Hãy thêm ít nhất một mặt hàng", "warn");
    return;
  }
  const customerId = document.getElementById("invoice-customer").value || null;
  InvoiceStore.add({ customerId, items: draftItems });
  closeModal();
  renderInvoices();
  renderProducts();
  renderDashboard();
  showToast("Đã lập hóa đơn thành công");
}

function viewInvoice(id) {
  const inv = InvoiceStore.get(id);
  if (!inv) return;
  const cust = inv.customerId ? CustomerStore.get(inv.customerId) : null;
  openModal(`
    <div class="receipt">
      <h3>🧾 ${inv.code}</h3>
      <p class="receipt-meta">${formatDate(inv.createdAt)} · ${cust ? cust.name : "Khách lẻ"}</p>
      <div class="receipt-dashed"></div>
      <table class="mini-table">
        <thead><tr><th>Sản phẩm</th><th>SL</th><th>Đơn giá</th><th>T.Tiền</th></tr></thead>
        <tbody>
          ${inv.items.map(it => `<tr><td>${it.name}</td><td>${it.qty}</td><td>${formatVND(it.price)}</td><td>${formatVND(it.price * it.qty)}</td></tr>`).join("")}
        </tbody>
      </table>
      <div class="receipt-dashed"></div>
      <div class="invoice-total">Tổng cộng: <span>${formatVND(inv.total)}</span></div>
    </div>
    <div class="form-actions">
      <button class="btn-primary" onclick="closeModal()">Đóng</button>
    </div>
  `);
}

function deleteInvoice(id) {
  if (!confirm("Xóa hóa đơn này? Tồn kho sẽ được hoàn lại.")) return;
  InvoiceStore.remove(id);
  renderInvoices();
  renderProducts();
  renderDashboard();
  showToast("Đã xóa hóa đơn", "warn");
}

/* ---------------- Doanh thu ---------------- */
let revenueChart = null;

function initRevenue() {
  document.getElementById("revenue-range").addEventListener("change", renderRevenue);
}

function renderRevenue() {
  const range = document.getElementById("revenue-range").value; // 7 | 30 | 90
  const days = parseInt(range, 10);
  const now = new Date();
  const labels = [];
  const values = [];

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dayInvoices = InvoiceStore.onDate(d);
    labels.push(d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" }));
    values.push(InvoiceStore.revenueOf(dayInvoices));
  }

  const total = values.reduce((a, b) => a + b, 0);
  document.getElementById("revenue-total").textContent = formatVND(total);
  document.getElementById("revenue-avg").textContent = formatVND(Math.round(total / days));

  const start = new Date(now); start.setDate(start.getDate() - (days - 1));
  const invoicesInRange = InvoiceStore.inRange(startOfDay(start), endOfDay(now));
  document.getElementById("revenue-invoice-count").textContent = invoicesInRange.length;

  const ctx = document.getElementById("revenue-chart").getContext("2d");
  if (revenueChart) revenueChart.destroy();
  revenueChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "Doanh thu (₫)",
        data: values,
        backgroundColor: "#A13D2B",
        borderRadius: 4,
        maxBarThickness: 28,
      }],
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        y: { ticks: { callback: (v) => (v >= 1000 ? v / 1000 + "k" : v) }, grid: { color: "#e3d5ae" } },
        x: { grid: { display: false } },
      },
    },
  });

  // Bảng top sản phẩm bán chạy trong khoảng
  const productSales = {};
  invoicesInRange.forEach(inv => inv.items.forEach(it => {
    productSales[it.name] = (productSales[it.name] || 0) + it.qty;
  }));
  const top = Object.entries(productSales).sort((a, b) => b[1] - a[1]).slice(0, 5);
  document.getElementById("revenue-top-products").innerHTML = top.length
    ? top.map(([name, qty]) => `<div class="mini-row"><span>${name}</span><span class="tag">${qty} đã bán</span></div>`).join("")
    : `<p class="empty-note">Chưa có dữ liệu bán hàng.</p>`;
}

/* ---------------- AI tìm kiếm ngôn ngữ tự nhiên ---------------- */
function initAI() {
  const input = document.getElementById("ai-input");
  document.getElementById("ai-search-btn").addEventListener("click", runAISearch);
  input.addEventListener("keydown", (e) => { if (e.key === "Enter") runAISearch(); });
  document.querySelectorAll(".ai-suggestion").forEach(chip => {
    chip.addEventListener("click", () => {
      input.value = chip.textContent;
      runAISearch();
    });
  });
}

function runAISearch() {
  const input = document.getElementById("ai-input");
  const text = input.value.trim();
  const resultBox = document.getElementById("ai-result");
  if (!text) { resultBox.innerHTML = ""; return; }

  const result = runNLPQuery(text);
  let html = `<div class="ai-summary">🤖 ${result.summary}</div>`;

  if (result.invoices && result.invoices.length) {
    html += `<table class="mini-table"><thead><tr><th>Mã HĐ</th><th>Ngày</th><th>Khách</th><th>Tổng tiền</th></tr></thead><tbody>`;
    html += result.invoices.slice(0, 15).map(i => {
      const cust = i.customerId ? CustomerStore.get(i.customerId) : null;
      return `<tr><td>${i.code}</td><td>${formatDate(i.createdAt)}</td><td>${cust ? cust.name : "Khách lẻ"}</td><td>${formatVND(i.total)}</td></tr>`;
    }).join("");
    html += `</tbody></table>`;
  }

  if (result.products && result.products.length) {
    html += `<table class="mini-table"><thead><tr><th>Sản phẩm</th><th>Giá</th><th>Tồn kho</th></tr></thead><tbody>`;
    html += result.products.slice(0, 15).map(p => `<tr><td>${p.name}</td><td>${formatVND(p.price)}</td><td>${p.stock} ${p.unit}</td></tr>`).join("");
    html += `</tbody></table>`;
  }

  if (result.customers && result.customers.length) {
    html += `<table class="mini-table"><thead><tr><th>Khách hàng</th><th>SĐT</th></tr></thead><tbody>`;
    html += result.customers.slice(0, 15).map(c => `<tr><td>${c.name}</td><td>${c.phone || "—"}</td></tr>`).join("");
    html += `</tbody></table>`;
  }

  resultBox.innerHTML = html;
}
