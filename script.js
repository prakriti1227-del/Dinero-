// DINERO keeps its data in this browser, using localStorage.
const transactionStorageKey = "dineroTransactions";
const currencyStorageKey = "dineroCurrency";

let transactions = [];
let currencySymbol = "₹";

const expenseCategories = ["Food", "Transport", "Education", "Entertainment", "Shopping", "Bills", "Other"];
const incomeCategories = ["Pocket Money", "Salary", "Gifts", "Other"];
const classifications = ["Necessary", "Wants", "Wasteful"];

const transactionForm = document.getElementById("transaction-form");
const transactionNameInput = document.getElementById("transaction-name");
const transactionAmountInput = document.getElementById("transaction-amount");
const transactionTypeInput = document.getElementById("transaction-type");
const transactionCategoryInput = document.getElementById("transaction-category");
const transactionDateInput = document.getElementById("transaction-date");
const transactionClassificationInput = document.getElementById("transaction-classification");
const transactionIdInput = document.getElementById("transaction-id");
const formMessage = document.getElementById("form-message");

function loadSavedData() {
  const savedTransactions = localStorage.getItem(transactionStorageKey);
  const savedCurrency = localStorage.getItem(currencyStorageKey);

  if (savedTransactions) {
    try {
      transactions = JSON.parse(savedTransactions);
      if (!Array.isArray(transactions)) transactions = [];
    } catch (error) {
      transactions = [];
    }
  }

  if (savedCurrency) currencySymbol = savedCurrency;
  document.getElementById("currency-select").value = currencySymbol;
}

function saveTransactions() {
  localStorage.setItem(transactionStorageKey, JSON.stringify(transactions));
}

function updateCategoryOptions() {
  const categories = transactionTypeInput.value === "Income" ? incomeCategories : expenseCategories;
  const selectedCategory = transactionCategoryInput.value;
  transactionCategoryInput.innerHTML = "<option value=\"\">Choose a category</option>";

  categories.forEach(function(category) {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    transactionCategoryInput.appendChild(option);
  });

  if (categories.includes(selectedCategory)) transactionCategoryInput.value = selectedCategory;
}

function formatMoney(amount) {
  return currencySymbol + Number(amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function getTotals() {
  let income = 0;
  let expenses = 0;

  transactions.forEach(function(transaction) {
    if (transaction.type === "Income") income += Number(transaction.amount);
    if (transaction.type === "Expense") expenses += Number(transaction.amount);
  });

  return { income: income, expenses: expenses, savings: income - expenses };
}

function updateSummary() {
  const totals = getTotals();
  const spendingPercent = totals.income > 0 ? Math.round((totals.expenses / totals.income) * 100) : 0;
  const savingsPercent = totals.income > 0 ? Math.round((totals.savings / totals.income) * 100) : 0;

  document.getElementById("total-income").textContent = formatMoney(totals.income);
  document.getElementById("total-expenses").textContent = formatMoney(totals.expenses);
  document.getElementById("total-savings").textContent = formatMoney(totals.savings);
  document.getElementById("spending-percent").textContent = spendingPercent + "%";
  document.getElementById("savings-note").textContent = totals.savings < 0 ? "You spent more than you earned" : "Income minus expenses";

  document.getElementById("overview-income").textContent = formatMoney(totals.income);
  document.getElementById("overview-expenses").textContent = formatMoney(totals.expenses);
  document.getElementById("overview-savings").textContent = formatMoney(totals.savings);
  document.getElementById("savings-percent").textContent = totals.income > 0 ? savingsPercent + "%" : "0%";

  let message = "Add transactions to see your savings picture.";
  if (totals.expenses > totals.income) message = "You have spent more than you earned. Your savings are below zero.";
  else if (totals.income > 0) message = "You have kept " + savingsPercent + "% of your income as savings.";
  else if (totals.expenses > 0) message = "Add income to compare your spending and savings.";
  document.getElementById("savings-message").textContent = message;
}

function updateBarList(containerId, names, amounts, total, useClassification) {
  const container = document.getElementById(containerId);
  container.innerHTML = "";
  if (useClassification) container.classList.add("classification-bars");
  else container.classList.remove("classification-bars");

  names.forEach(function(name) {
    const amount = amounts[name] || 0;
    const percentage = total > 0 ? Math.round((amount / total) * 100) : 0;
    const row = document.createElement("div");
    row.className = "bar-item";

    const label = document.createElement("span");
    label.className = "bar-name";
    label.textContent = name;

    const track = document.createElement("span");
    track.className = "bar-track";
    const fill = document.createElement("span");
    fill.className = "bar-fill";
    fill.style.width = Math.min(percentage, 100) + "%";
    track.appendChild(fill);

    const value = document.createElement("span");
    value.className = "bar-value";
    value.textContent = percentage + "%";

    row.appendChild(label);
    row.appendChild(track);
    row.appendChild(value);
    container.appendChild(row);
  });
}

function updateAnalysis() {
  const categoryTotals = {};
  const classificationTotals = {};

  expenseCategories.forEach(function(category) { categoryTotals[category] = 0; });
  classifications.forEach(function(classification) { classificationTotals[classification] = 0; });

  transactions.forEach(function(transaction) {
    if (transaction.type === "Expense") {
      if (categoryTotals[transaction.category] !== undefined) categoryTotals[transaction.category] += Number(transaction.amount);
      if (classificationTotals[transaction.classification] !== undefined) classificationTotals[transaction.classification] += Number(transaction.amount);
    }
  });

  const totals = getTotals();
  updateBarList("category-analysis", expenseCategories, categoryTotals, totals.expenses, false);
  updateBarList("classification-analysis", classifications, classificationTotals, totals.expenses, true);
}

function formatDate(dateText) {
  if (!dateText) return "";
  const parts = dateText.split("-");
  return parts.length === 3 ? parts[1] + "/" + parts[2] + "/" + parts[0] : dateText;
}

function renderTransactions() {
  const list = document.getElementById("transaction-list");
  const searchText = document.getElementById("search-input").value.toLowerCase().trim();
  const selectedType = document.getElementById("filter-type").value;
  list.innerHTML = "";

  const visibleTransactions = transactions.filter(function(transaction) {
    const matchesName = transaction.name.toLowerCase().includes(searchText);
    const matchesType = selectedType === "All" || transaction.type === selectedType;
    return matchesName && matchesType;
  });

  visibleTransactions.forEach(function(transaction) {
    const row = document.createElement("tr");
    const cells = [transaction.name, transaction.category, transaction.type, formatMoney(transaction.amount), formatDate(transaction.date), transaction.classification];

    cells.forEach(function(value, index) {
      const cell = document.createElement("td");
      if (index === 2) {
        const pill = document.createElement("span");
        pill.className = "type-pill " + (transaction.type === "Income" ? "type-income" : "type-expense");
        pill.textContent = value;
        cell.appendChild(pill);
      } else if (index === 5) {
        const pill = document.createElement("span");
        pill.className = "class-pill";
        pill.textContent = value;
        cell.appendChild(pill);
      } else {
        cell.textContent = value;
      }
      row.appendChild(cell);
    });

    const actionCell = document.createElement("td");
    const actions = document.createElement("div");
    actions.className = "row-actions";
    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.textContent = "Edit";
    editButton.addEventListener("click", function() { editTransaction(transaction.id); });
    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "delete-button";
    deleteButton.textContent = "Delete";
    deleteButton.addEventListener("click", function() { deleteTransaction(transaction.id); });
    actions.appendChild(editButton);
    actions.appendChild(deleteButton);
    actionCell.appendChild(actions);
    row.appendChild(actionCell);
    list.appendChild(row);
  });

  const emptyState = document.getElementById("empty-state");
  emptyState.classList.toggle("visible", visibleTransactions.length === 0);
  if (transactions.length > 0 && visibleTransactions.length === 0) {
    emptyState.querySelector("strong").textContent = "No matching transactions";
    emptyState.querySelector("p").textContent = "Try a different name or filter.";
    emptyState.querySelector("a").style.display = "none";
  } else {
    emptyState.querySelector("strong").textContent = "No transactions yet";
    emptyState.querySelector("p").textContent = "Add your first transaction to see your money activity here.";
    emptyState.querySelector("a").style.display = "inline";
  }
}

function updatePage() {
  updateSummary();
  updateAnalysis();
  renderTransactions();
}

function clearForm() {
  transactionForm.reset();
  transactionIdInput.value = "";
  document.getElementById("form-title").textContent = "Add a transaction";
  document.getElementById("submit-button").textContent = "Save transaction";
  document.getElementById("cancel-edit").classList.add("hidden");
  formMessage.textContent = "";
  transactionTypeInput.value = "Expense";
  updateCategoryOptions();
}

function editTransaction(transactionId) {
  const transaction = transactions.find(function(item) { return item.id === transactionId; });
  if (!transaction) return;

  transactionIdInput.value = transaction.id;
  transactionNameInput.value = transaction.name;
  transactionAmountInput.value = transaction.amount;
  transactionTypeInput.value = transaction.type;
  updateCategoryOptions();
  transactionCategoryInput.value = transaction.category;
  transactionDateInput.value = transaction.date;
  transactionClassificationInput.value = transaction.classification;
  document.getElementById("form-title").textContent = "Edit transaction";
  document.getElementById("submit-button").textContent = "Update transaction";
  document.getElementById("cancel-edit").classList.remove("hidden");
  formMessage.textContent = "";
  document.getElementById("add-transaction").scrollIntoView({ behavior: "smooth" });
}

function deleteTransaction(transactionId) {
  const shouldDelete = window.confirm("Delete this transaction?");
  if (!shouldDelete) return;

  transactions = transactions.filter(function(transaction) { return transaction.id !== transactionId; });
  saveTransactions();
  updatePage();
  if (transactionIdInput.value === transactionId) clearForm();
}

transactionTypeInput.addEventListener("change", updateCategoryOptions);
transactionForm.addEventListener("submit", function(event) {
  event.preventDefault();
  formMessage.textContent = "";

  const name = transactionNameInput.value.trim();
  const amount = Number(transactionAmountInput.value);
  const type = transactionTypeInput.value;
  const category = transactionCategoryInput.value;
  const date = transactionDateInput.value;
  const classification = transactionClassificationInput.value;

  if (!name || !category || !date || !classification || transactionAmountInput.value === "") {
    formMessage.textContent = "Please fill in every field.";
    return;
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    formMessage.textContent = "Enter an amount greater than zero.";
    return;
  }

  const existingId = transactionIdInput.value;
  const transaction = {
    id: existingId || String(Date.now()),
    name: name,
    amount: amount,
    type: type,
    category: category,
    date: date,
    classification: classification
  };

  if (existingId) {
    transactions = transactions.map(function(item) { return item.id === existingId ? transaction : item; });
  } else {
    transactions.push(transaction);
  }

  saveTransactions();
  clearForm();
  updatePage();
});

document.getElementById("cancel-edit").addEventListener("click", clearForm);
document.getElementById("search-input").addEventListener("input", renderTransactions);
document.getElementById("filter-type").addEventListener("change", renderTransactions);
document.getElementById("currency-select").addEventListener("change", function(event) {
  currencySymbol = event.target.value;
  localStorage.setItem(currencyStorageKey, currencySymbol);
  updatePage();
});
document.getElementById("clear-data").addEventListener("click", function() {
  if (!window.confirm("Clear all transactions? This cannot be undone.")) return;
  transactions = [];
  saveTransactions();
  clearForm();
  updatePage();
});

loadSavedData();
updateCategoryOptions();
const today = new Date();
const year = today.getFullYear();
const month = String(today.getMonth() + 1).padStart(2, "0");
const day = String(today.getDate()).padStart(2, "0");
transactionDateInput.value = year + "-" + month + "-" + day;
updatePage();
