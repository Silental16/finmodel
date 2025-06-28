// toggle discount rate visibility
const npvCheckbox = document.getElementById('npvEnabled');
const discountContainer = document.getElementById('discountRateContainer');
if (npvCheckbox) {
    npvCheckbox.addEventListener('change', () => {
        discountContainer.style.display = npvCheckbox.checked ? 'block' : 'none';
    });
}

// demand multiplier toggle
const demandCheckbox = document.getElementById('demandEnabled');
const monthlyDemand = document.getElementById('monthlyDemand');
if (demandCheckbox) {
    demandCheckbox.addEventListener('change', () => {
        monthlyDemand.style.display = demandCheckbox.checked ? 'block' : 'none';
    });
}

// add price stage
const addStageBtn = document.getElementById('addStage');
const priceStages = document.getElementById('priceStages');
if (addStageBtn) {
    addStageBtn.addEventListener('click', () => {
        const div = document.createElement('div');
        div.className = 'stage';
        div.innerHTML = `<input type="text" class="stage-name">`
            + `<input type="number" class="stage-percent">`
            + `<input type="date" class="stage-date">`
            + `<button type="button" class="remove-stage">Удалить</button>`;
        priceStages.insertBefore(div, addStageBtn);
    });
}

priceStages.addEventListener('click', (e) => {
    if (e.target.classList.contains('remove-stage')) {
        e.target.parentElement.remove();
    }
});

// add revenue expense
function setupExpenseSection(sectionId, addBtnId) {
    const container = document.getElementById(sectionId);
    const addBtn = document.getElementById(addBtnId);
    if (!container || !addBtn) return;
    addBtn.addEventListener('click', () => {
        const row = document.createElement('div');
        row.className = 'expense-row';
        row.innerHTML = `<input type="text" class="expense-name">`
            + `<input type="number" class="expense-percent">`
            + `<button type="button" class="remove-expense">Удалить</button>`;
        container.insertBefore(row, addBtn);
    });

    container.addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-expense')) {
            e.target.parentElement.remove();
        }
    });
}

setupExpenseSection('revenueExpenses', 'addRevenueExpense');
setupExpenseSection('profitExpenses', 'addProfitExpense');
