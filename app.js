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

// utility functions for calculations
function daysInMonth(month, year) {
    return new Date(year, month + 1, 0).getDate();
}

function addMonths(date, months) {
    const d = new Date(date.getTime());
    d.setMonth(d.getMonth() + months);
    return d;
}

// main calculate handler
const calcBtn = document.getElementById('calculate');
const results = document.getElementById('results');

if (calcBtn) {
    calcBtn.addEventListener('click', () => {
        if (!results) return;
        results.innerHTML = '';

        const startVal = document.getElementById('projectStart').value;
        const finishVal = document.getElementById('finishDate').value;
        const start = startVal ? new Date(startVal) : null;
        const finish = finishVal ? new Date(finishVal) : null;
        if (!start || !finish || finish <= start) {
            results.textContent = 'Проверьте даты входа и окончания строительства.';
            return;
        }

        const baseADR = parseFloat(document.getElementById('unitAdr').value) || 0;
        const occupancy = parseFloat(document.getElementById('occupancy').value) || 0;
        const agr = parseFloat(document.getElementById('agr').value) || 0;
        const priceGrowth = parseFloat(document.getElementById('priceGrowth').value) || 0;

        let coefs = new Array(12).fill(1);
        if (demandCheckbox && demandCheckbox.checked) {
            coefs = Array.from(document.querySelectorAll('.month-coef')).map(i => parseFloat(i.value) || 1);
        }

        const yearly = new Array(10).fill(0);
        for (let i = 0; i < 120; i++) {
            const current = addMonths(finish, i + 1); // месяц после сдачи
            const monthsSince = i;
            const adrCurrent = baseADR * Math.pow(1 + agr / 100, monthsSince / 12);
            const coef = coefs[current.getMonth()];
            const days = daysInMonth(current.getMonth(), current.getFullYear());
            const monthly = adrCurrent * (occupancy / 100) * days * coef;
            yearly[Math.floor(i / 12)] += monthly;
        }

        const stageNodes = document.querySelectorAll('#priceStages .stage');
        const basePrice = parseFloat(document.getElementById('unitCost').value) || 0;
        const stages = [];
        stageNodes.forEach(node => {
            const p = parseFloat(node.querySelector('.stage-percent').value);
            const d = node.querySelector('.stage-date').value;
            if (!isNaN(p) && d) stages.push({ percent: p, date: new Date(d) });
        });
        stages.sort((a, b) => a.date - b.date);
        let lastPrice = basePrice;
        let lastDate = finish;
        stages.forEach(st => {
            if (st.date >= start) {
                lastPrice = basePrice * (st.percent / 100);
                lastDate = st.date;
            }
        });

        const price5 = lastPrice * Math.pow(1 + priceGrowth / 100, 5);
        const price10 = lastPrice * Math.pow(1 + priceGrowth / 100, 10);

        const priceInfo = document.createElement('div');
        priceInfo.innerHTML =
            `<p>Стоимость через 5 лет: ${price5.toFixed(2)}</p>` +
            `<p>Стоимость через 10 лет: ${price10.toFixed(2)}</p>`;
        results.appendChild(priceInfo);

        const revenueExpenseNodes = document.querySelectorAll('#revenueExpenses .expense-row');
        const revenueExpenseItems = Array.from(revenueExpenseNodes).map(row => ({
            name: row.querySelector('.expense-name').value || '',
            percent: parseFloat(row.querySelector('.expense-percent').value) || 0
        }));

        const profitExpenseNodes = document.querySelectorAll('#profitExpenses .expense-row');
        const profitExpenseItems = Array.from(profitExpenseNodes).map(row => ({
            name: row.querySelector('.expense-name').value || '',
            percent: parseFloat(row.querySelector('.expense-percent').value) || 0
        }));

        const monthlyCostVal = parseFloat(document.getElementById('monthlyCosts').value) || 0;
        const monthlyCostEnabled = document.getElementById('monthlyCostsEnabled').checked;
        const yearlyRepairVal = parseFloat(document.getElementById('yearlyRepair').value) || 0;
        const yearlyRepairEnabled = document.getElementById('yearlyRepairEnabled').checked;
        const insuranceVal = parseFloat(document.getElementById('insurance').value) || 0;
        const insuranceEnabled = document.getElementById('insuranceEnabled').checked;

        const gross = yearly;
        const revenueTotals = new Array(10).fill(0);
        const profitBefore = new Array(10).fill(0);
        const netProfit = new Array(10).fill(0);

        // arrays per item
        const revItemValues = revenueExpenseItems.map(() => new Array(10).fill(0));
        const profitItemValues = profitExpenseItems.map(() => new Array(10).fill(0));

        for (let y = 0; y < 10; y++) {
            revenueExpenseItems.forEach((it, idx) => {
                revItemValues[idx][y] = gross[y] * it.percent / 100;
                revenueTotals[y] += revItemValues[idx][y];
            });

            const mc = monthlyCostEnabled ? monthlyCostVal * 12 : 0;
            const rep = yearlyRepairEnabled ? yearlyRepairVal : 0;
            const ins = insuranceEnabled ? insuranceVal : 0;

            const beforeProfit = gross[y] - revenueTotals[y] - mc - rep - ins;
            profitBefore[y] = beforeProfit;

            profitExpenseItems.forEach((it, idx) => {
                profitItemValues[idx][y] = beforeProfit * it.percent / 100;
            });

            const profitExpTotal = profitItemValues.reduce((sum, arr) => sum + arr[y], 0);
            netProfit[y] = beforeProfit - profitExpTotal;
        }

        const table = document.createElement('table');
        let html = '<tr><th>Статья/Год</th>';
        for (let y = 1; y <= 10; y++) html += `<th>${y}</th>`;
        html += '</tr>';

        function addRow(label, arr) {
            html += `<tr><td>${label}</td>` + arr.map(v => `<td>${v.toFixed(2)}</td>`).join('') + '</tr>';
        }

        addRow('Валовой доход', gross);
        revenueExpenseItems.forEach((it, idx) => addRow(`${it.name} (${it.percent}%)`, revItemValues[idx]));
        addRow('Итого расходы из выручки', revenueTotals);
        const monthlyArr = new Array(10).fill(monthlyCostEnabled ? monthlyCostVal * 12 : 0);
        const repairArr = new Array(10).fill(yearlyRepairEnabled ? yearlyRepairVal : 0);
        const insArr = new Array(10).fill(insuranceEnabled ? insuranceVal : 0);
        addRow('Месячные расходы', monthlyArr);
        addRow('Ремонт', repairArr);
        addRow('Страховка', insArr);
        addRow('Прибыль до расходов из прибыли', profitBefore);
        profitExpenseItems.forEach((it, idx) => addRow(`${it.name} (${it.percent}%)`, profitItemValues[idx]));
        addRow('Чистая прибыль', netProfit);

        table.innerHTML = html;
        results.appendChild(table);
    });
}

