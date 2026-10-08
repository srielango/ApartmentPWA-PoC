// --- 1. Service Worker Registration ---
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => console.log('SW Registered successfully:', reg.scope))
            .catch(err => console.error('SW Registration failed:', err));
    });
}

// --- 2. Install Prompt Handling ---
let deferredPrompt;
const installBtn = document.getElementById('install-btn');

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    installBtn.classList.remove('hidden');
});

installBtn.addEventListener('click', async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`Install prompt outcome: ${outcome}`);
    deferredPrompt = null;
    installBtn.classList.add('hidden');
});

// Hide button if already installed
window.addEventListener('appinstalled', () => {
    installBtn.classList.add('hidden');
    console.log('App was successfully installed!');
});

// --- 3. App Logic & Local Persistence ---
const STORAGE_KEY = 'apt_expenses_v1';
let expenses = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

const expenseForm = document.getElementById('expense-form');
const expenseList = document.getElementById('expense-list');
const totalAmountDisplay = document.getElementById('total-amount');
const clearBtn = document.getElementById('clear-btn');

function saveAndRender() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
    render();
}

function render() {
    expenseList.innerHTML = '';
    let total = 0;

    if (expenses.length === 0) {
        expenseList.innerHTML = '<li class="empty-state">No expenses logged yet.</li>';
    } else {
        expenses.forEach((item) => {
            total += Number(item.amount);

            const li = document.createElement('li');
            li.className = 'expense-item';
            li.innerHTML = `
        <div class="item-left">
          <div class="item-cat">${escapeHtml(item.category)}</div>
          <div class="item-meta">
            ${escapeHtml(item.payer ? item.payer + ' • ' : '')}
            ${new Date(item.timestamp).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
            ${item.note ? ' • ' + escapeHtml(item.note) : ''}
          </div>
        </div>
        <div class="item-amount">₹${Number(item.amount).toLocaleString('en-IN')}</div>
      `;
            expenseList.appendChild(li);
        });
    }

    totalAmountDisplay.textContent = `₹${total.toLocaleString('en-IN')}`;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

expenseForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const amount = document.getElementById('amount').value;
    const category = document.getElementById('category').value;
    const payer = document.getElementById('payer').value.trim();
    const note = document.getElementById('note').value.trim();

    const newEntry = {
        id: Date.now(),
        amount: Number(amount),
        category,
        payer,
        note,
        timestamp: new Date().toISOString()
    };

    expenses.unshift(newEntry);
    saveAndRender();
    expenseForm.reset();
});

clearBtn.addEventListener('click', () => {
    if (confirm('Clear all logged records?')) {
        expenses = [];
        saveAndRender();
    }
});

// Initial render on boot
render();