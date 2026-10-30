let transactions = [], customCategories = [];
let chartInstance = null;
const LIMIT = 500000;
const CAT_COLORS = { Food: "#22c55e", Transport: "#3b82f6", Fun: "#a855f7" };
function getColor(cat) { return CAT_COLORS[cat] || "#f97316"; }

function init() {
  var theme = localStorage.getItem("theme") || "light";
  document.documentElement.setAttribute("data-theme", theme);
  updateThemeBtn(theme);
  customCategories = JSON.parse(localStorage.getItem("custom_categories") || "[]");
  customCategories.forEach(function(cat){ addCatToDropdown(cat, false); });
  transactions = JSON.parse(localStorage.getItem("expense_data") || "[]");
  renderTransactions(); updateTotal(); renderChart();
}

function toggleTheme() {
  var cur = document.documentElement.getAttribute("data-theme");
  var next = cur === "light" ? "dark" : "light";
  document.documentElement.setAttribute("data-theme", next);
  localStorage.setItem("theme", next);
  updateThemeBtn(next); renderChart();
}
function updateThemeBtn(theme) {
  document.getElementById("themeToggle").textContent = theme === "dark" ? "Mode Terang" : "Mode Gelap";
}

function addTransaction(event) {
  event.preventDefault();
  var name = document.getElementById("itemName").value.trim();
  var amount = parseFloat(document.getElementById("itemAmount").value);
  var category = document.getElementById("itemCategory").value;
  if (!name || !amount || !category) { alert("Semua field harus diisi!"); return; }
  if (amount <= 0) { alert("Jumlah harus lebih dari 0!"); return; }
  var t = { id: Date.now(), name: name, amount: amount, category: category, date: new Date().toLocaleDateString("id-ID") };
  transactions.push(t);
  saveData(); renderTransactions(); updateTotal(); renderChart();
  document.getElementById("transactionForm").reset();
}

function deleteTransaction(id) {
  transactions = transactions.filter(function(t){ return t.id !== id; });
  saveData(); renderTransactions(); updateTotal(); renderChart();
}

function renderTransactions() {
  var list = document.getElementById("transactionList");
  var sortVal = document.getElementById("sortSelect").value;
  var sorted = transactions.slice();
  if (sortVal === "amount-asc") sorted.sort(function(a,b){ return a.amount - b.amount; });
  else if (sortVal === "amount-desc") sorted.sort(function(a,b){ return b.amount - a.amount; });
  else if (sortVal === "category") sorted.sort(function(a,b){ return a.category.localeCompare(b.category); });
  if (!sorted.length) {
    list.innerHTML = '<p class="empty-state">Belum ada transaksi. Tambahkan di atas!</p>';
    return;
  }
  list.innerHTML = sorted.map(function(t) {
    var over = t.amount > LIMIT;
    var badge = getCatBadge(t.category);
    var warn = over ? '<span class="over-limit-badge">Besar</span>' : "";
    return '<div class="transaction-item' + (over ? " over-limit" : "") + '">' +
      '<div class="item-info"><div class="item-name">' + escHtml(t.name) + " " + warn + '</div>' +
      '<div class="item-date">' + t.date + '</div></div>' +
      '<span class="category-badge ' + badge.cls + '">' + badge.lbl + '</span>' +
      '<div class="item-amount">' + fmtRp(t.amount) + '</div>' +
      '<button class="btn-delete" onclick="deleteTransaction(' + t.id + ')">Hapus</button></div>';
  }).join("");
}

function updateTotal() {
  var total = transactions.reduce(function(s,t){ return s + t.amount; }, 0);
  document.getElementById("totalBalance").textContent = fmtRp(total);
}

function renderChart() {
  var ctx = document.getElementById("expenseChart").getContext("2d");
  var grouped = {};
  transactions.forEach(function(t){ grouped[t.category] = (grouped[t.category] || 0) + t.amount; });
  var labels = Object.keys(grouped);
  var data = Object.values(grouped);
  var colors = labels.map(function(l){ return getColor(l); });
  if (chartInstance) { chartInstance.destroy(); chartInstance = null; }
  if (!labels.length) { ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height); return; }
  var dark = document.documentElement.getAttribute("data-theme") === "dark";
  chartInstance = new Chart(ctx, {
    type: "pie",
    data: { labels: labels.map(getCatLabel), datasets: [{ data: data, backgroundColor: colors, borderColor: dark ? "#1a1a2e" : "#fff", borderWidth: 3 }] },
    options: { responsive: true, plugins: {
      legend: { position: "bottom", labels: { color: dark ? "#e8e8f0" : "#1a1a2e", padding: 16, font: { size: 13 } } },
      tooltip: { callbacks: { label: function(c){ return " " + getCatLabel(c.label) + ": " + fmtRp(c.parsed); } } }
    }}
  });
}

function addCustomCategory() {
  var inp = document.getElementById("customCategoryName");
  var name = inp.value.trim();
  if (!name) { alert("Nama kategori tidak boleh kosong!"); return; }
  var all = ["Food", "Transport", "Fun"].concat(customCategories);
  if (all.map(function(c){ return c.toLowerCase(); }).indexOf(name.toLowerCase()) !== -1) { alert("Kategori sudah ada!"); return; }
  customCategories.push(name);
  localStorage.setItem("custom_categories", JSON.stringify(customCategories));
  addCatToDropdown(name, true);
  inp.value = "";
}
function addCatToDropdown(name, sel) {
  var s = document.getElementById("itemCategory");
  var o = document.createElement("option");
  o.value = name; o.textContent = name;
  s.appendChild(o);
  if (sel) s.value = name;
}

function saveData() { localStorage.setItem("expense_data", JSON.stringify(transactions)); }
function fmtRp(n) { return "Rp " + Math.round(n).toLocaleString("id-ID"); }
function escHtml(s) { var d = document.createElement("div"); d.appendChild(document.createTextNode(s)); return d.innerHTML; }
function getCatBadge(cat) {
  var m = { Food: { cls: "badge-Food", lbl: "Makanan" }, Transport: { cls: "badge-Transport", lbl: "Transport" }, Fun: { cls: "badge-Fun", lbl: "Hiburan" } };
  return m[cat] || { cls: "badge-custom", lbl: cat };
}
function getCatLabel(cat) {
  var m = { Food: "Makanan", Transport: "Transport", Fun: "Hiburan" };
  return m[cat] || cat;
}

document.addEventListener("DOMContentLoaded", init);
