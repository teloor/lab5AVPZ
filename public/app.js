/**
 * Frontend JavaScript для системи управління ризиками
 */

const API_URL = window.location.origin + '/api';

let riskSources = {};
let riskEvents = {};
let mitigationMeasures = [];
let selectedEvents = [];
let analyzedRisks = {};

// ==================== ІНІЦІАЛІЗАЦІЯ ====================

document.addEventListener('DOMContentLoaded', async () => {
    setupStageNavigation();
    await loadInitialData();
    renderRiskSourcesForm();
    renderRiskEventsForm();
});

function setupStageNavigation() {
    const stageButtons = document.querySelectorAll('.stage-btn');
    stageButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const stage = btn.dataset.stage;
            switchStage(stage);
        });
    });
}

function switchStage(stageNum) {
    // Оновити кнопки
    document.querySelectorAll('.stage-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.stage === stageNum);
    });

    // Оновити контент
    document.querySelectorAll('.stage-content').forEach(content => {
        content.classList.toggle('active', content.id === `stage${stageNum}`);
    });

    // Оновити дані для відповідного етапу
    if (stageNum === '2') {
        updateRiskAnalysisOptions();
    } else if (stageNum === '3') {
        updateMitigationForm();
    } else if (stageNum === '4') {
        updateMonitoringOptions();
    }
}

async function loadInitialData() {
    try {
        const [sourcesRes, eventsRes, measuresRes] = await Promise.all([
            fetch(`${API_URL}/risk-sources`),
            fetch(`${API_URL}/risk-events`),
            fetch(`${API_URL}/mitigation-measures`)
        ]);

        riskSources = await sourcesRes.json();
        riskEvents = await eventsRes.json();
        mitigationMeasures = await measuresRes.json();
    } catch (error) {
        console.error('Помилка завантаження даних:', error);
        alert('Помилка підключення до сервера. Переконайтеся, що сервер запущено.');
    }
}

// ==================== ЕТАП 1: ІДЕНТИФІКАЦІЯ ====================

function renderRiskSourcesForm() {
    const container = document.getElementById('riskSourcesForm');
    let html = '';

    const categories = [
        { key: 'technical', title: 'Технічні ризики (T^RS)', emoji: '⚙️' },
        { key: 'cost', title: 'Вартісні ризики (C^RS)', emoji: '💰' },
        { key: 'schedule', title: 'Планові ризики (P^RS)', emoji: '📅' },
        { key: 'management', title: 'Ризики управління (M^RS)', emoji: '👥' }
    ];

    categories.forEach(cat => {
        html += `<div class="risk-category">
            <h4>${cat.emoji} ${cat.title}</h4>`;
        
        riskSources[cat.key].risks.forEach(risk => {
            html += `<div class="risk-item">
                <input type="checkbox" id="${risk.id}_source" value="${risk.id}" 
                    onchange="updateRiskSource('${cat.key}', '${risk.id}', this.checked)">
                <label for="${risk.id}_source">${risk.id.toUpperCase()}: ${risk.name}</label>
            </div>`;
        });

        html += `</div>`;
    });

    container.innerHTML = html;
}

function updateRiskSource(category, riskId, checked) {
    const risk = riskSources[category].risks.find(r => r.id === riskId);
    if (risk) {
        risk.value = checked ? 1 : 0;
    }
}

async function calculateRiskSources() {
    try {
        const response = await fetch(`${API_URL}/risk-sources`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(riskSources)
        });

        const result = await response.json();
        displayRiskSourcesResult(result.probabilities);
    } catch (error) {
        console.error('Помилка розрахунку:', error);
        alert('Помилка розрахунку джерел ризиків');
    }
}

function displayRiskSourcesResult(prob) {
    const container = document.getElementById('riskSourcesResult');
    container.innerHTML = `
        <h4>📊 Результати розрахунку ймовірностей груп:</h4>
        <div class="result-table">
            <table style="width:100%">
                <tr>
                    <th>Група ризиків</th>
                    <th>Ймовірність</th>
                </tr>
                <tr>
                    <td>⚙️ Технічні (t_c^RS)</td>
                    <td>${prob.t_c_RS.toFixed(4)}</td>
                </tr>
                <tr>
                    <td>💰 Вартісні (c_c^RS)</td>
                    <td>${prob.c_c_RS.toFixed(4)}</td>
                </tr>
                <tr>
                    <td>📅 Планові (p_c^RS)</td>
                    <td>${prob.p_c_RS.toFixed(4)}</td>
                </tr>
                <tr>
                    <td>👥 Управління (m_c^RS)</td>
                    <td>${prob.m_c_RS.toFixed(4)}</td>
                </tr>
                <tr style="font-weight:bold; background:#f0f0f0;">
                    <td>🎯 Сумарний ризик (R_Σ^RS)</td>
                    <td>${prob.R_sum_RS.toFixed(4)}</td>
                </tr>
            </table>
        </div>
    `;
}

function renderRiskEventsForm() {
    const container = document.getElementById('riskEventsForm');
    let html = '';

    const categories = [
        { key: 'technical', title: 'Технічні події (T^R)', emoji: '⚙️' },
        { key: 'cost', title: 'Вартісні події (C^R)', emoji: '💰' },
        { key: 'schedule', title: 'Планові події (P^R)', emoji: '📅' },
        { key: 'management', title: 'Події управління (M^R)', emoji: '👥' }
    ];

    categories.forEach(cat => {
        html += `<div class="risk-category">
            <h4>${cat.emoji} ${cat.title} (${riskEvents[cat.key].length} подій)</h4>`;
        
        riskEvents[cat.key].forEach(event => {
            html += `<div class="risk-item">
                <input type="checkbox" id="${event.id}_event" value="${event.id}" class="risk-event-checkbox">
                <label for="${event.id}_event">${event.id.toUpperCase()}: ${event.name}</label>
            </div>`;
        });

        html += `</div>`;
    });

    container.innerHTML = html;
}

async function selectRiskEvents() {
    const checkboxes = document.querySelectorAll('.risk-event-checkbox:checked');
    selectedEvents = Array.from(checkboxes).map(cb => cb.value);

    try {
        const response = await fetch(`${API_URL}/risk-events/select`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ selectedEvents })
        });

        const result = await response.json();
        
        const container = document.getElementById('riskEventsResult');
        container.innerHTML = `
            <h4>✅ Вибрано ризикових подій: ${result.count}</h4>
            <p>Події: ${selectedEvents.join(', ').toUpperCase()}</p>
        `;
    } catch (error) {
        console.error('Помилка збереження подій:', error);
        alert('Помилка збереження ризикових подій');
    }
}

// ==================== ЕТАП 2: АНАЛІЗ ====================

function updateRiskAnalysisOptions() {
    const select = document.getElementById('riskToAnalyze');
    select.innerHTML = '<option value="">-- Оберіть ризик --</option>';
    
    selectedEvents.forEach(eventId => {
        const option = document.createElement('option');
        option.value = eventId;
        option.textContent = eventId.toUpperCase();
        select.appendChild(option);
    });
}

function showExpertForm() {
    const riskId = document.getElementById('riskToAnalyze').value;
    const form = document.getElementById('expertForm');
    
    if (!riskId) {
        form.style.display = 'none';
        return;
    }

    form.style.display = 'block';
    
    // Генеруємо поля для 10 експертів
    const probContainer = document.getElementById('probabilityInputs');
    const lossContainer = document.getElementById('lossInputs');
    
    let probHtml = '';
    let lossHtml = '';
    
    for (let i = 1; i <= 10; i++) {
        probHtml += `<div class="expert-input">
            <label>Експерт ${i}:</label>
            <input type="number" step="0.01" min="0" max="1" value="0.5" id="prob_${i}">
        </div>`;
        
        lossHtml += `<div class="expert-input">
            <label>Експерт ${i}:</label>
            <input type="number" step="0.01" min="0" max="1" value="0.5" id="loss_${i}">
        </div>`;
    }
    
    probContainer.innerHTML = probHtml;
    lossContainer.innerHTML = lossHtml;
}

function toggleWeights() {
    const checkbox = document.getElementById('useWeights');
    const container = document.getElementById('weightInputs');
    
    if (checkbox.checked) {
        let html = '<strong>Ваги експертів:</strong>';
        for (let i = 1; i <= 10; i++) {
            html += `<div class="expert-input">
                <label>Експерт ${i}:</label>
                <input type="number" step="0.1" min="0" value="1" id="weight_${i}">
            </div>`;
        }
        container.innerHTML = html;
        container.style.display = 'block';
    } else {
        container.style.display = 'none';
    }
}

async function analyzeRisk() {
    const riskId = document.getElementById('riskToAnalyze').value;
    if (!riskId) {
        alert('Оберіть ризик для аналізу');
        return;
    }

    const expertProbabilities = [];
    const expertLosses = [];
    
    for (let i = 1; i <= 10; i++) {
        expertProbabilities.push(parseFloat(document.getElementById(`prob_${i}`).value));
        expertLosses.push(parseFloat(document.getElementById(`loss_${i}`).value));
    }

    let expertWeights = null;
    if (document.getElementById('useWeights').checked) {
        expertWeights = [];
        for (let i = 1; i <= 10; i++) {
            expertWeights.push(parseFloat(document.getElementById(`weight_${i}`).value));
        }
    }

    try {
        const response = await fetch(`${API_URL}/analyze-risk`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                riskId,
                expertProbabilities,
                expertLosses,
                expertWeights
            })
        });

        const result = await response.json();
        analyzedRisks[riskId] = result;
        displayAnalysisResult(result);
    } catch (error) {
        console.error('Помилка аналізу:', error);
        alert('Помилка аналізу ризику');
    }
}

function displayAnalysisResult(analysis) {
    const container = document.getElementById('analysisResult');
    container.innerHTML = `
        <h4>📊 Результати аналізу ризику ${analysis.riskId.toUpperCase()}</h4>
        <div class="stat">
            <span class="stat-label">Ймовірність (er^p):</span>
            <span class="stat-value">${analysis.probability.toFixed(4)}</span>
        </div>
        <div class="stat">
            <span class="stat-label">Збитки (lrer^p):</span>
            <span class="stat-value">${analysis.loss.toFixed(4)}</span>
        </div>
        <div class="stat">
            <span class="stat-label">Величина ризику (vrer^p):</span>
            <span class="stat-value"><strong>${analysis.magnitude.toFixed(4)}</strong></span>
        </div>
        <div class="stat">
            <span class="stat-label">Класифікація:</span>
            <span class="stat-value">${analysis.classification}</span>
        </div>
    `;
}

async function prioritizeRisks() {
    try {
        const response = await fetch(`${API_URL}/prioritize-risks`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });

        const result = await response.json();
        displayPrioritizationResult(result.risks);
    } catch (error) {
        console.error('Помилка пріоритезації:', error);
        alert('Помилка ранжування ризиків');
    }
}

function displayPrioritizationResult(risks) {
    const container = document.getElementById('prioritizationResult');
    
    if (risks.length === 0) {
        container.innerHTML = '<p>Немає проаналізованих ризиків</p>';
        return;
    }

    let html = `<h4>🎯 Ранжовані ризики</h4>
        <p><strong>Параметри розрахунку:</strong> min=${risks[0].priorityThresholds.min.toFixed(4)}, 
        max=${risks[0].priorityThresholds.max.toFixed(4)}, 
        mpr=${risks[0].priorityThresholds.mpr.toFixed(4)}</p>
        <table class="result-table">
            <tr>
                <th>Ранг</th>
                <th>Ризик</th>
                <th>Величина</th>
                <th>Пріоритет</th>
            </tr>`;

    risks.forEach((risk, index) => {
        const priorityClass = `priority-${risk.priority.toLowerCase()}`;
        html += `<tr>
            <td>${index + 1}</td>
            <td>${risk.riskId.toUpperCase()}</td>
            <td>${risk.magnitude.toFixed(4)}</td>
            <td class="${priorityClass}">${risk.priority}</td>
        </tr>`;
    });

    html += '</table>';
    container.innerHTML = html;
}

// ==================== ЕТАП 3: ПЛАНУВАННЯ ====================

function updateMitigationForm() {
    const container = document.getElementById('mitigationForm');
    const risks = Object.keys(analyzedRisks);

    if (risks.length === 0) {
        container.innerHTML = '<p class="hint">⚠️ Спочатку проаналізуйте ризики на Етапі 2</p>';
        return;
    }

    let html = '<h4>Призначення заходів:</h4>';
    
    risks.forEach(riskId => {
        html += `<div class="form-group">
            <label>Ризик ${riskId.toUpperCase()}:</label>
            <select id="measure_${riskId}">
                <option value="">-- Оберіть захід --</option>`;
        
        mitigationMeasures.forEach(measure => {
            html += `<option value="${measure.id}">${measure.id}: ${measure.name}</option>`;
        });
        
        html += `</select>
            <button onclick="assignMitigation('${riskId}')" class="btn btn-primary" style="margin-top:5px;">
                Призначити
            </button>
        </div>`;
    });

    container.innerHTML = html;
}

async function assignMitigation(riskId) {
    const measureId = document.getElementById(`measure_${riskId}`).value;
    
    if (!measureId) {
        alert('Оберіть захід');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/assign-mitigation`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ riskId, measureId })
        });

        const result = await response.json();
        
        const container = document.getElementById('mitigationResult');
        const existing = container.innerHTML;
        container.innerHTML = existing + `
            <div class="stat">
                <span>✅ ${riskId.toUpperCase()} → ${result.measureId}: ${result.measureName}</span>
            </div>
        `;
    } catch (error) {
        console.error('Помилка призначення заходу:', error);
        alert('Помилка призначення заходу');
    }
}

// ==================== ЕТАП 4: МОНІТОРИНГ ====================

function updateMonitoringOptions() {
    const select = document.getElementById('riskToMonitor');
    select.innerHTML = '<option value="">-- Оберіть ризик --</option>';
    
    Object.keys(analyzedRisks).forEach(riskId => {
        const option = document.createElement('option');
        option.value = riskId;
        option.textContent = riskId.toUpperCase();
        select.appendChild(option);
    });
}

function showMonitoringForm() {
    const riskId = document.getElementById('riskToMonitor').value;
    const form = document.getElementById('monitoringForm');
    
    if (!riskId) {
        form.style.display = 'none';
        return;
    }

    form.style.display = 'block';
    
    const newProbContainer = document.getElementById('newProbabilityInputs');
    const newLossContainer = document.getElementById('newLossInputs');
    
    let probHtml = '';
    let lossHtml = '';
    
    for (let i = 1; i <= 10; i++) {
        probHtml += `<div class="expert-input">
            <label>Експерт ${i}:</label>
            <input type="number" step="0.01" min="0" max="1" value="0.3" id="new_prob_${i}">
        </div>`;
        
        lossHtml += `<div class="expert-input">
            <label>Експерт ${i}:</label>
            <input type="number" step="0.01" min="0" max="1" value="0.3" id="new_loss_${i}">
        </div>`;
    }
    
    newProbContainer.innerHTML = probHtml;
    newLossContainer.innerHTML = lossHtml;
}

function toggleWeightsMonitoring() {
    const checkbox = document.getElementById('useWeightsMonitoring');
    const container = document.getElementById('weightInputsMonitoring');
    
    if (checkbox.checked) {
        let html = '<strong>Ваги експертів:</strong>';
        for (let i = 1; i <= 10; i++) {
            html += `<div class="expert-input">
                <label>Експерт ${i}:</label>
                <input type="number" step="0.1" min="0" value="1" id="weight_mon_${i}">
            </div>`;
        }
        container.innerHTML = html;
        container.style.display = 'block';
    } else {
        container.style.display = 'none';
    }
}

async function monitorRisk() {
    const riskId = document.getElementById('riskToMonitor').value;
    if (!riskId) {
        alert('Оберіть ризик для моніторингу');
        return;
    }

    const newExpertProbabilities = [];
    const newExpertLosses = [];
    
    for (let i = 1; i <= 10; i++) {
        newExpertProbabilities.push(parseFloat(document.getElementById(`new_prob_${i}`).value));
        newExpertLosses.push(parseFloat(document.getElementById(`new_loss_${i}`).value));
    }

    let expertWeights = null;
    if (document.getElementById('useWeightsMonitoring').checked) {
        expertWeights = [];
        for (let i = 1; i <= 10; i++) {
            expertWeights.push(parseFloat(document.getElementById(`weight_mon_${i}`).value));
        }
    }

    try {
        const response = await fetch(`${API_URL}/monitor-risk`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                riskId,
                newExpertProbabilities,
                newExpertLosses,
                expertWeights
            })
        });

        const result = await response.json();
        displayMonitoringResult(result);
    } catch (error) {
        console.error('Помилка моніторингу:', error);
        alert('Помилка оцінювання ефективності');
    }
}

function displayMonitoringResult(data) {
    const container = document.getElementById('monitoringResult');
    const comp = data.comparison;
    
    const improvedClass = comp.improved ? 'improved' : 'worsened';
    const improvedText = comp.improved ? '✅ Покращення' : '⚠️ Погіршення';
    
    container.innerHTML = `
        <h4>📊 Результати моніторингу ризику ${data.riskId.toUpperCase()}</h4>
        <p><strong>Застосований захід:</strong> ${data.mitigationMeasure.measureId}: ${data.mitigationMeasure.measureName}</p>
        <div class="comparison-box">
            <div class="comparison-item">
                <h5>📉 ДО заходу</h5>
                <div class="stat">
                    <span>Ймовірність:</span>
                    <span>${comp.before.probability.toFixed(4)}</span>
                </div>
                <div class="stat">
                    <span>Збитки:</span>
                    <span>${comp.before.loss.toFixed(4)}</span>
                </div>
                <div class="stat">
                    <span><strong>Величина:</strong></span>
                    <span><strong>${comp.before.magnitude.toFixed(4)}</strong></span>
                </div>
                <div class="stat">
                    <span>Класифікація:</span>
                    <span>${comp.before.classification}</span>
                </div>
            </div>
            <div class="comparison-item ${improvedClass}">
                <h5>📈 ПІСЛЯ заходу</h5>
                <div class="stat">
                    <span>Ймовірність:</span>
                    <span>${comp.after.probability.toFixed(4)}</span>
                </div>
                <div class="stat">
                    <span>Збитки:</span>
                    <span>${comp.after.loss.toFixed(4)}</span>
                </div>
                <div class="stat">
                    <span><strong>Величина:</strong></span>
                    <span><strong>${comp.after.magnitude.toFixed(4)}</strong></span>
                </div>
                <div class="stat">
                    <span>Класифікація:</span>
                    <span>${comp.after.classification}</span>
                </div>
            </div>
        </div>
        <div style="margin-top:20px; padding:15px; background:#f8f9fa; border-radius:6px;">
            <h5>${improvedText}</h5>
            <div class="stat">
                <span>Зменшення ризику:</span>
                <span><strong>${comp.reduction.toFixed(4)} (${comp.reductionPercentage.toFixed(2)}%)</strong></span>
            </div>
        </div>
    `;

    const compContainer = document.getElementById('comparisonResult');
    compContainer.innerHTML = container.innerHTML;
}

// ==================== ДОПОМІЖНІ ФУНКЦІЇ ====================

async function resetProject() {
    if (!confirm('Ви впевнені, що хочете скинути всі дані проєкту?')) {
        return;
    }

    try {
        await fetch(`${API_URL}/reset`, {
            method: 'POST'
        });

        location.reload();
    } catch (error) {
        console.error('Помилка скидання:', error);
        alert('Помилка скидання даних');
    }
}
