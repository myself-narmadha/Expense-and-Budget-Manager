// ============================
// Expense & Budget Manager JS
// ============================

const API_URL = "http://127.0.0.1:5000/api/expenses";

// DOM Elements
const form = document.getElementById("expenseForm");
const amountInput = document.getElementById("amount");
const categoryInput = document.getElementById("category");
const descriptionInput = document.getElementById("description");
const dateInput = document.getElementById("date");
const expenseIdInput = document.getElementById("expenseId");
const expensesList = document.getElementById("expensesList");
const totalAmountEl = document.getElementById("totalAmount");
const filterCategory = document.getElementById("filterCategory");
const clearBtn = document.getElementById("clearBtn");
const modeLabel = document.getElementById("modeLabel");
const toggleModeBtn = document.getElementById("toggleModeBtn");

let chart;
let expenses = [];
let isMockMode = true; // Start with localStorage

document.addEventListener("DOMContentLoaded", () => {
  loadExpenses();
});

// ----------------------------
// Load Expenses
// ----------------------------
async function loadExpenses() {
  if (isMockMode) {
    const data = localStorage.getItem("expenses");
    expenses = data ? JSON.parse(data) : [];
  } else {
    const res = await fetch(API_URL);
    expenses = await res.json();
  }
  renderExpenses();
  updateChart();
}

// ----------------------------
// Save Expense
// ----------------------------
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const expenseData = {
    amount: parseFloat(amountInput.value),
    category: categoryInput.value,
    description: descriptionInput.value || "—",
    date: dateInput.value || new Date().toISOString().split("T")[0],
  };
  const id = expenseIdInput.value;

  if (isMockMode) {
    if (id) {
      const index = expenses.findIndex((exp) => exp.id === id);
      expenses[index] = { id, ...expenseData };
    } else {
      expenses.push({ id: Date.now().toString(), ...expenseData });
    }
    localStorage.setItem("expenses", JSON.stringify(expenses));
  } else {
    if (id) {
      await fetch(`${API_URL}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(expenseData),
      });
    } else {
      await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(expenseData),
      });
    }
  }

  form.reset();
  expenseIdInput.value = "";
  loadExpenses();
});

// ----------------------------
// Render Expenses
// ----------------------------
function renderExpenses() {
  expensesList.innerHTML = "";
  const filtered =
    filterCategory.value === "All"
      ? expenses
      : expenses.filter((e) => e.category === filterCategory.value);

  if (filtered.length === 0) {
    expensesList.innerHTML = "<li class='meta'>No expenses to display.</li>";
    totalAmountEl.textContent = "0.00";
    return;
  }

  filtered.forEach((expense) => {
    const id = expense._id || expense.id;
    const li = document.createElement("li");
    li.innerHTML = `
      <div>
        <strong>₹${expense.amount.toFixed(2)}</strong> - ${expense.category}<br/>
        <span class="meta">${expense.description} • ${expense.date}</span>
      </div>
      <div class="controls">
        <button onclick="editExpense('${id}')">✏️</button>
        <button onclick="deleteExpense('${id}')">🗑️</button>
      </div>
    `;
    expensesList.appendChild(li);
  });

  updateTotal(filtered);
}

// ----------------------------
// Edit Expense
// ----------------------------
function editExpense(id) {
  const exp = expenses.find((e) => (e._id || e.id) === id);
  if (!exp) return;
  expenseIdInput.value = exp._id || exp.id;
  amountInput.value = exp.amount;
  categoryInput.value = exp.category;
  descriptionInput.value = exp.description;
  dateInput.value = exp.date;
}

// ----------------------------
// Delete Expense
// ----------------------------
async function deleteExpense(id) {
  if (!confirm("Delete this expense?")) return;
  if (isMockMode) {
    expenses = expenses.filter((e) => e.id !== id);
    localStorage.setItem("expenses", JSON.stringify(expenses));
  } else {
    await fetch(`${API_URL}/${id}`, { method: "DELETE" });
  }
  loadExpenses();
}

// ----------------------------
// Misc Controls
// ----------------------------
filterCategory.addEventListener("change", () => renderExpenses());
clearBtn.addEventListener("click", () => {
  form.reset();
  expenseIdInput.value = "";
});
function updateTotal(list) {
  const total = list.reduce((sum, e) => sum + parseFloat(e.amount), 0);
  totalAmountEl.textContent = total.toFixed(2);
}

// ----------------------------
// Chart.js Pie Chart
// ----------------------------
function updateChart() {
  const categoryTotals = expenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + parseFloat(e.amount);
    return acc;
  }, {});
  const ctx = document.getElementById("chartCanvas").getContext("2d");
  if (chart) chart.destroy();
  chart = new Chart(ctx, {
    type: "pie",
    data: {
      labels: Object.keys(categoryTotals),
      datasets: [
        {
          data: Object.values(categoryTotals),
          backgroundColor: ["#9b5cf6", "#f97316", "#22c55e", "#3b82f6", "#eab308"],
          borderColor: "#111827",
          borderWidth: 2,
        },
      ],
    },
    options: {
      plugins: {
        legend: {
          position: "bottom",
          labels: { color: "#e6eef8" },
        },
      },
    },
  });
}

// ----------------------------
// Toggle Mode
// ----------------------------
toggleModeBtn.addEventListener("click", () => {
  isMockMode = !isMockMode;
  modeLabel.textContent = isMockMode
    ? "Mock (localStorage)"
    : "API Mode (Flask + MongoDB)";
  alert(
    isMockMode
      ? "Switched to localStorage mode."
      : "Switched to Flask API mode."
  );
  loadExpenses();
});
