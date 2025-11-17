/**
 * Сервер REST API для системи управління ризиками
 * Backend на Node.js з Express
 */

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const calculations = require('./calculations');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Завантаження даних з JSON файлів
const riskSources = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'riskSources.json'), 'utf8'));
const riskEvents = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'riskEvents.json'), 'utf8'));
const mitigationMeasures = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'mitigationMeasures.json'), 'utf8'));

// Сховище для проєктних даних (в реальному додатку це була б база даних)
let projectData = {
  riskSources: JSON.parse(JSON.stringify(riskSources)),
  selectedRiskEvents: [],
  analyzedRisks: {},
  mitigationPlans: {},
  monitoringData: {}
};

// ==================== ЕТАП 1: ІДЕНТИФІКАЦІЯ РИЗИКІВ ====================

/**
 * GET /api/risk-sources
 * Отримати каталог джерел ризиків
 */
app.get('/api/risk-sources', (req, res) => {
  res.json(riskSources);
});

/**
 * POST /api/risk-sources
 * Оновити стан джерел ризиків (0 або 1)
 */
app.post('/api/risk-sources', (req, res) => {
  projectData.riskSources = req.body;
  
  // Розрахунок ймовірностей груп та сумарного ризику
  const probabilities = calculations.calculateRiskSourceProbabilities(projectData.riskSources);
  
  res.json({
    riskSources: projectData.riskSources,
    probabilities
  });
});

/**
 * GET /api/risk-events
 * Отримати каталог ризикових подій
 */
app.get('/api/risk-events', (req, res) => {
  res.json(riskEvents);
});

/**
 * POST /api/risk-events/select
 * Вибрати релевантні ризикові події для проєкту
 */
app.post('/api/risk-events/select', (req, res) => {
  projectData.selectedRiskEvents = req.body.selectedEvents;
  res.json({
    selectedEvents: projectData.selectedRiskEvents,
    count: projectData.selectedRiskEvents.length
  });
});

/**
 * GET /api/risk-events/selected
 * Отримати список вибраних ризикових подій
 */
app.get('/api/risk-events/selected', (req, res) => {
  res.json({
    selectedEvents: projectData.selectedRiskEvents,
    count: projectData.selectedRiskEvents.length
  });
});

// ==================== ЕТАП 2: АНАЛІЗ РИЗИКІВ ====================

/**
 * POST /api/analyze-risk
 * Аналіз конкретного ризику (розрахунок ймовірності, збитків, величини)
 */
app.post('/api/analyze-risk', (req, res) => {
  const { riskId, expertProbabilities, expertLosses, expertWeights } = req.body;
  
  if (!riskId || !expertProbabilities || !expertLosses) {
    return res.status(400).json({ error: 'Не вказано обов\'язкові параметри' });
  }
  
  if (expertProbabilities.length !== 10 || expertLosses.length !== 10) {
    return res.status(400).json({ error: 'Потрібно 10 експертних оцінок' });
  }
  
  const analysis = calculations.analyzeRisk(riskId, expertProbabilities, expertLosses, expertWeights);
  
  // Зберігаємо результат аналізу
  projectData.analyzedRisks[riskId] = analysis;
  
  res.json(analysis);
});

/**
 * GET /api/analyzed-risks
 * Отримати всі проаналізовані ризики
 */
app.get('/api/analyzed-risks', (req, res) => {
  const risks = Object.values(projectData.analyzedRisks);
  res.json(risks);
});

/**
 * POST /api/prioritize-risks
 * Ранжування та пріоритезація всіх проаналізованих ризиків
 */
app.post('/api/prioritize-risks', (req, res) => {
  const risks = Object.values(projectData.analyzedRisks);
  const prioritizedRisks = calculations.prioritizeRisks(risks);
  
  res.json({
    risks: prioritizedRisks,
    count: prioritizedRisks.length
  });
});

// ==================== ЕТАП 3: ПЛАНУВАННЯ РИЗИКІВ ====================

/**
 * GET /api/mitigation-measures
 * Отримати каталог заходів зі зменшення ризику
 */
app.get('/api/mitigation-measures', (req, res) => {
  res.json(mitigationMeasures);
});

/**
 * POST /api/assign-mitigation
 * Призначити захід для конкретного ризику
 */
app.post('/api/assign-mitigation', (req, res) => {
  const { riskId, measureId } = req.body;
  
  if (!riskId || !measureId) {
    return res.status(400).json({ error: 'Не вказано riskId або measureId' });
  }
  
  if (!projectData.analyzedRisks[riskId]) {
    return res.status(404).json({ error: 'Ризик не знайдено. Спочатку потрібно проаналізувати ризик.' });
  }
  
  const measure = mitigationMeasures.find(m => m.id === measureId);
  if (!measure) {
    return res.status(404).json({ error: 'Захід не знайдено' });
  }
  
  projectData.mitigationPlans[riskId] = {
    riskId,
    measureId,
    measureName: measure.name,
    assignedAt: new Date().toISOString()
  };
  
  res.json(projectData.mitigationPlans[riskId]);
});

/**
 * GET /api/mitigation-plans
 * Отримати всі плани заходів
 */
app.get('/api/mitigation-plans', (req, res) => {
  res.json(projectData.mitigationPlans);
});

// ==================== ЕТАП 4: МОНІТОРИНГ РИЗИКІВ ====================

/**
 * POST /api/monitor-risk
 * Оцінювання ризику після застосування заходу
 */
app.post('/api/monitor-risk', (req, res) => {
  const { riskId, newExpertProbabilities, newExpertLosses, expertWeights } = req.body;
  
  if (!riskId || !newExpertProbabilities || !newExpertLosses) {
    return res.status(400).json({ error: 'Не вказано обов\'язкові параметри' });
  }
  
  const originalRisk = projectData.analyzedRisks[riskId];
  if (!originalRisk) {
    return res.status(404).json({ error: 'Ризик не знайдено. Спочатку потрібно проаналізувати ризик.' });
  }
  
  if (newExpertProbabilities.length !== 10 || newExpertLosses.length !== 10) {
    return res.status(400).json({ error: 'Потрібно 10 експертних оцінок' });
  }
  
  const comparison = calculations.compareRisks(
    originalRisk,
    newExpertProbabilities,
    newExpertLosses,
    expertWeights
  );
  
  const mitigationPlan = projectData.mitigationPlans[riskId];
  
  projectData.monitoringData[riskId] = {
    riskId,
    comparison,
    mitigationMeasure: mitigationPlan,
    evaluatedAt: new Date().toISOString()
  };
  
  res.json(projectData.monitoringData[riskId]);
});

/**
 * GET /api/monitoring-data
 * Отримати всі дані моніторингу
 */
app.get('/api/monitoring-data', (req, res) => {
  res.json(projectData.monitoringData);
});

/**
 * GET /api/monitoring-data/:riskId
 * Отримати дані моніторингу конкретного ризику
 */
app.get('/api/monitoring-data/:riskId', (req, res) => {
  const data = projectData.monitoringData[req.params.riskId];
  if (!data) {
    return res.status(404).json({ error: 'Дані моніторингу не знайдено' });
  }
  res.json(data);
});

// ==================== ДОПОМІЖНІ ЕНДПОІНТИ ====================

/**
 * GET /api/project-status
 * Отримати загальний статус проєкту
 */
app.get('/api/project-status', (req, res) => {
  const sourceProbabilities = calculations.calculateRiskSourceProbabilities(projectData.riskSources);
  
  res.json({
    riskSourcesProbabilities: sourceProbabilities,
    selectedEventsCount: projectData.selectedRiskEvents.length,
    analyzedRisksCount: Object.keys(projectData.analyzedRisks).length,
    mitigationPlansCount: Object.keys(projectData.mitigationPlans).length,
    monitoredRisksCount: Object.keys(projectData.monitoringData).length
  });
});

/**
 * POST /api/reset
 * Скинути всі дані проєкту
 */
app.post('/api/reset', (req, res) => {
  projectData = {
    riskSources: JSON.parse(JSON.stringify(riskSources)),
    selectedRiskEvents: [],
    analyzedRisks: {},
    mitigationPlans: {},
    monitoringData: {}
  };
  res.json({ message: 'Дані проєкту скинуто' });
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`🚀 Сервер запущено на порті ${PORT}`);
  console.log(`📊 API доступне за адресою: http://localhost:${PORT}/api`);
  console.log(`🌐 Веб-інтерфейс: http://localhost:${PORT}`);
});

module.exports = app;
