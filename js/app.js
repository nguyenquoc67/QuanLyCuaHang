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
  syncProductCatalog();
  initTheme();
  initSettings();
  initCurrentUserSelect();
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
  initNotesAndAttendance();
  renderDashboard();
  showView("dashboard");
});

/* ---------------- Thanh tiến trình tải trang (giả lập loading chuyên nghiệp) ---------------- */
function showTopProgress() {
  const bar = document.getElementById("top-progress-bar");
  bar.style.width = "0%";
  bar.classList.add("loading");
  requestAnimationFrame(() => { bar.style.width = "70%"; });
}
function finishTopProgress() {
  const bar = document.getElementById("top-progress-bar");
  bar.style.width = "100%";
  setTimeout(() => { bar.classList.remove("loading"); bar.style.width = "0%"; }, 250);
}

function skeletonRows(n = 3) {
  return Array.from({ length: n }).map(() => `<div class="skeleton-row" style="width:${60 + Math.random() * 35}%"></div>`).join("");
}

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
  showTopProgress();
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
  if (name === "notes") { renderNotes(); renderEmployees(); renderAttendance(); renderAttendanceChecklist(); }
  if (name === "revenue") renderRevenue();
  if (name === "activity") renderActivityLog();
  if (name === "settings") loadSettingsForm();
  finishTopProgress();
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

/* ---------------- Ghi chú & Chấm công ---------------- */
function initNotesAndAttendance() {
  document.querySelectorAll("#notes-subtabs .cat-tab").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll("#notes-subtabs .cat-tab").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      document.querySelectorAll(".subview").forEach(v => v.classList.remove("active"));
      document.getElementById("subview-" + btn.dataset.subtab).classList.add("active");
    });
  });

  document.getElementById("btn-add-note").addEventListener("click", openNoteForm);
  document.getElementById("btn-add-employee").addEventListener("click", openEmployeeForm);
  document.getElementById("btn-add-attendance").addEventListener("click", openAttendanceForm);

  const dateInput = document.getElementById("attendance-calendar-date");
  dateInput.value = new Date().toISOString().slice(0, 10);
  dateInput.addEventListener("change", renderAttendanceChecklist);
}

/* --- Ghi chú thanh toán / nợ --- */
function openNoteForm() {
  openModal(`
    <h3>📝 Thêm ghi chú</h3>
    <form id="note-form" class="form-grid">
      <label>Loại
        <select name="type">${NOTE_TYPES.map(t => `<option value="${t}">${t}</option>`).join("")}</select>
      </label>
      <label>Liên quan đến ai <input name="person" placeholder="VD: Anh Ba, Chị Hoa..."></label>
      <label>Số tiền (₫) <input type="number" min="0" name="amount" placeholder="0"></label>
      <label style="grid-column:1/-1">Nội dung <input name="content" placeholder="VD: Mua chịu gạo, hẹn trả cuối tháng"></label>
      <div class="form-actions">
        <button type="button" class="btn-ghost" onclick="closeModal()">Hủy</button>
        <button type="submit" class="btn-primary">Lưu ghi chú</button>
      </div>
    </form>
  `);
  document.getElementById("note-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target).entries());
    NoteStore.add(data);
    closeModal();
    renderNotes();
    showToast("Đã lưu ghi chú");
  });
}

function renderNotes() {
  const notes = NoteStore.all().slice().reverse();
  const box = document.getElementById("note-list");
  box.innerHTML = notes.length ? notes.map(n => `
    <div class="note-row ${n.resolved ? "note-resolved" : ""}">
      <div class="note-row-main">
        <span class="tag note-tag-${slugify(n.type)}">${n.type}</span>
        <span class="note-row-text">${n.content || "(không có nội dung)"}${n.person ? ` — <b>${n.person}</b>` : ""}</span>
      </div>
      <div class="note-row-side">
        ${n.amount ? `<span class="tag">${formatVND(n.amount)}</span>` : ""}
        <button class="btn-icon" onclick="toggleNoteResolved('${n.id}')" title="${n.resolved ? "Đánh dấu chưa xong" : "Đánh dấu đã xong"}" aria-label="Đánh dấu">${ICON_CHECK}</button>
        <button class="btn-icon" onclick="removeNote('${n.id}')" title="Xóa" aria-label="Xóa ghi chú">${ICON_TRASH}</button>
      </div>
    </div>`).join("") : `<p class="empty-note">Chưa có ghi chú nào.</p>`;
}

function slugify(s) { return removeDiacritics(s.toLowerCase()).replace(/\s+/g, "-"); }

function toggleNoteResolved(id) { NoteStore.toggleResolved(id); renderNotes(); }
function removeNote(id) {
  if (!confirm("Xóa ghi chú này?")) return;
  NoteStore.remove(id);
  renderNotes();
  showToast("Đã xóa ghi chú", "warn");
}

/* --- Nhân viên --- */
function openEmployeeForm() {
  openModal(`
    <h3>🧑‍💼 Thêm nhân viên</h3>
    <form id="employee-form" class="form-grid">
      <label>Họ tên <input required name="name"></label>
      <label>Vai trò <input name="role" value="Nhân viên phổ thông"></label>
      <label>Lương / ngày công (₫) <input type="number" min="0" name="dailyWage" placeholder="200000"></label>
      <div class="form-actions">
        <button type="button" class="btn-ghost" onclick="closeModal()">Hủy</button>
        <button type="submit" class="btn-primary">Thêm nhân viên</button>
      </div>
    </form>
  `);
  document.getElementById("employee-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target).entries());
    EmployeeStore.add(data);
    closeModal();
    renderEmployees();
    renderAttendanceChecklist();
    populateCurrentUserOptions();
    showToast("Đã thêm nhân viên");
  });
}

function renderEmployees() {
  const list = EmployeeStore.all();
  const body = document.getElementById("employee-table-body");
  body.innerHTML = list.length ? list.map(e => `
    <tr>
      <td>${e.name}</td>
      <td>${e.role}</td>
      <td>${e.dailyWage ? formatVND(e.dailyWage) : "—"}</td>
      <td><button class="btn-icon" onclick="deleteEmployee('${e.id}')" title="Xóa" aria-label="Xóa nhân viên">${ICON_TRASH}</button></td>
    </tr>`).join("") : `<tr><td colspan="4" class="empty-note">Chưa có nhân viên nào.</td></tr>`;
}

function deleteEmployee(id) {
  if (!confirm("Xóa nhân viên này? Lịch sử chấm công của họ cũng sẽ bị xóa.")) return;
  EmployeeStore.remove(id);
  renderEmployees();
  renderAttendance();
  renderAttendanceChecklist();
  populateCurrentUserOptions();
  showToast("Đã xóa nhân viên", "warn");
}

/* --- Chấm công theo lịch (tick chọn) --- */
function renderAttendanceChecklist() {
  const dateInput = document.getElementById("attendance-calendar-date");
  if (!dateInput) return;
  const date = dateInput.value || new Date().toISOString().slice(0, 10);
  const employees = EmployeeStore.all();
  const box = document.getElementById("attendance-checklist");
  if (!employees.length) {
    box.innerHTML = `<p class="empty-note">Chưa có nhân viên nào — hãy thêm nhân viên trước.</p>`;
    return;
  }
  box.innerHTML = employees.map(e => {
    const rec = AttendanceStore.recordFor(e.id, date);
    const checked = rec && rec.status !== "Nghỉ";
    return `
    <label class="att-check-row ${checked ? "checked" : ""}" data-emp="${e.id}">
      <input type="checkbox" ${checked ? "checked" : ""} onchange="onAttendanceTick('${e.id}', this.checked)">
      <span>${e.name}</span>
    </label>`;
  }).join("");
}

function onAttendanceTick(employeeId, present) {
  const date = document.getElementById("attendance-calendar-date").value;
  AttendanceStore.setPresent(employeeId, date, present);
  renderAttendanceChecklist();
  renderAttendance();
}

/* --- Chấm công (form chi tiết: nửa công/nghỉ + ghi chú) --- */
function openAttendanceForm() {
  const employees = EmployeeStore.all();
  if (!employees.length) {
    showToast("Hãy thêm nhân viên trước khi chấm công", "warn");
    return;
  }
  const today = new Date().toISOString().slice(0, 10);
  openModal(`
    <h3>🗓️ Chấm công</h3>
    <form id="attendance-form" class="form-grid">
      <label>Nhân viên
        <select name="employeeId">${employees.map(e => `<option value="${e.id}">${e.name}</option>`).join("")}</select>
      </label>
      <label>Ngày <input required type="date" name="date" value="${today}"></label>
      <label>Trạng thái
        <select name="status">${ATTENDANCE_STATUS.map(s => `<option value="${s}">${s}</option>`).join("")}</select>
      </label>
      <label>Ghi chú <input name="note" placeholder="VD: về sớm, tăng ca..."></label>
      <div class="form-actions">
        <button type="button" class="btn-ghost" onclick="closeModal()">Hủy</button>
        <button type="submit" class="btn-primary">Lưu chấm công</button>
      </div>
    </form>
  `);
  document.getElementById("attendance-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target).entries());
    AttendanceStore.add(data);
    closeModal();
    renderAttendance();
    showToast("Đã lưu chấm công");
  });
}

function renderAttendance() {
  const list = AttendanceStore.all().slice().reverse();
  const body = document.getElementById("attendance-table-body");
  body.innerHTML = list.length ? list.map(a => {
    const emp = EmployeeStore.get(a.employeeId);
    return `
    <tr>
      <td>${new Date(a.date).toLocaleDateString("vi-VN")}</td>
      <td>${emp ? emp.name : "(đã xóa)"}</td>
      <td><span class="tag ${a.status === "Nghỉ" ? "tag-warn" : ""}">${a.status}</span></td>
      <td>${a.note || "—"}</td>
      <td><button class="btn-icon" onclick="deleteAttendance('${a.id}')" title="Xóa" aria-label="Xóa chấm công">${ICON_TRASH}</button></td>
    </tr>`;
  }).join("") : `<tr><td colspan="5" class="empty-note">Chưa có dữ liệu chấm công.</td></tr>`;
}

function deleteAttendance(id) {
  AttendanceStore.remove(id);
  renderAttendance();
  showToast("Đã xóa bản ghi chấm công", "warn");
}

/* ---------------- Dark mode ---------------- */
function initTheme() {
  const saved = localStorage.getItem(DB_KEYS.theme) || "light";
  document.documentElement.setAttribute("data-theme", saved);
  document.getElementById("theme-toggle").addEventListener("click", () => {
    const current = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", current);
    localStorage.setItem(DB_KEYS.theme, current);
  });
}

/* ---------------- Cài đặt cửa hàng ---------------- */
function applyBrandFromSettings() {
  const s = SettingsStore.get();
  document.getElementById("brand-name-text").textContent = s.storeName;
  document.title = `${s.storeName} — Hệ Thống Quản Lý Cửa Hàng Tạp Hóa Thông Minh`;
  const slot = document.getElementById("brand-logo-slot");
  if (s.logo) {
    slot.innerHTML = `<img src="${s.logo}" alt="Logo" style="width:100%;height:100%;border-radius:50%;object-fit:cover">`;
  }
}

function initSettings() {
  applyBrandFromSettings();
  const form = document.getElementById("settings-form");
  const fileInput = document.getElementById("settings-logo-input");
  let pendingLogo = null;

  fileInput.addEventListener("change", () => {
    const file = fileInput.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      pendingLogo = reader.result;
      document.getElementById("settings-logo-preview").innerHTML = `<img src="${pendingLogo}" alt="Xem trước logo">`;
    };
    reader.readAsDataURL(file);
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());
    delete data.logoFile;
    if (pendingLogo) data.logo = pendingLogo;
    SettingsStore.save(data);
    applyBrandFromSettings();
    renderDashboard();
    showToast("Đã lưu cài đặt cửa hàng");
  });
}

function loadSettingsForm() {
  const s = SettingsStore.get();
  const form = document.getElementById("settings-form");
  form.storeName.value = s.storeName;
  form.address.value = s.address;
  form.hotline.value = s.hotline;
  form.vatPercent.value = s.vatPercent;
  form.currency.value = s.currency;
  form.language.value = s.language;
  document.getElementById("settings-logo-preview").innerHTML = s.logo ? `<img src="${s.logo}" alt="Logo hiện tại">` : `<span class="page-sub" style="margin:0">Chưa có logo tùy chỉnh — đang dùng logo mặc định.</span>`;
}

/* ---------------- Người đang trực ---------------- */
function initCurrentUserSelect() {
  const select = document.getElementById("current-user-select");
  populateCurrentUserOptions();
  select.value = CurrentUserStore.get();
  select.addEventListener("change", () => CurrentUserStore.set(select.value));
}

function populateCurrentUserOptions() {
  const select = document.getElementById("current-user-select");
  const names = ["Quản lý", ...EmployeeStore.all().map(e => e.name)];
  const current = select.value || CurrentUserStore.get();
  select.innerHTML = names.map(n => `<option value="${n}">${n}</option>`).join("");
  select.value = names.includes(current) ? current : "Quản lý";
}
/* ---------------- Nhật ký hoạt động ---------------- */
function renderActivityLog() {
  const logs = ActivityLogStore.all().slice().reverse();
  const box = document.getElementById("activity-log-list");
  box.innerHTML = logs.length ? logs.map(l => {
    const t = new Date(l.createdAt);
    const time = t.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
    const date = t.toLocaleDateString("vi-VN");
    return `<div class="activity-row"><span class="activity-time">${time}<br>${date}</span><span>${l.message}</span></div>`;
  }).join("") : `<p class="empty-note">Chưa có hoạt động nào được ghi lại.</p>`;
}

document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("btn-clear-log");
  if (btn) btn.addEventListener("click", () => {
    if (!confirm("Xóa toàn bộ nhật ký hoạt động?")) return;
    ActivityLogStore.clear();
    renderActivityLog();
    showToast("Đã xóa nhật ký", "warn");
  });
});

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
  const top = Object.entries(productSales).sort((a, b) => b[1] - a[1]).slice(0, 8);
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
