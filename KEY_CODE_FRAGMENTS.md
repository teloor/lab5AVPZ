# 🔑 Ключові Фрагменти Коду

Цей документ містить основні обчислювальні функції системи управління ризиками.

## 📁 Модуль: calculations.js

### Етап 1: Розрахунок Ймовірностей Груп Джерел та Сумарного Ризику

**Математична модель:**
```
t_c^RS = (1/18) * Σ(t_j^RS) для j=1..7
c_c^RS = (1/18) * Σ(c_j^RS) для j=1..3
p_c^RS = (1/18) * Σ(p_j^RS) для j=1..3
m_c^RS = (1/18) * Σ(m_j^RS) для j=1..5
R_Σ^RS = t_c^RS + c_c^RS + p_c^RS + m_c^RS
```

**Реалізація:**
```javascript
/**
 * Етап 1: Розрахунок ймовірностей груп джерел ризиків та сумарного ризику
 * Формули: t_c^RS = (1/18) * sum(t_j^RS), аналогічно для інших груп
 * R_Σ^RS = t_c^RS + c_c^RS + p_c^RS + m_c^RS
 */
function calculateRiskSourceProbabilities(riskSources) {
  const technical = riskSources.technical.risks.reduce((sum, risk) => sum + risk.value, 0) / 18;
  const cost = riskSources.cost.risks.reduce((sum, risk) => sum + risk.value, 0) / 18;
  const schedule = riskSources.schedule.risks.reduce((sum, risk) => sum + risk.value, 0) / 18;
  const management = riskSources.management.risks.reduce((sum, risk) => sum + risk.value, 0) / 18;
  
  const totalRisk = technical + cost + schedule + management;
  
  return {
    t_c_RS: technical,
    c_c_RS: cost,
    p_c_RS: schedule,
    m_c_RS: management,
    R_sum_RS: totalRisk
  };
}
```

**Приклад виклику:**
```javascript
const riskSources = {
  technical: { risks: [{value: 1}, {value: 1}, {value: 0}, ...] },
  cost: { risks: [{value: 1}, {value: 0}, {value: 0}] },
  schedule: { risks: [{value: 0}, {value: 1}, {value: 0}] },
  management: { risks: [{value: 0}, {value: 0}, {value: 1}, {value: 0}, {value: 0}] }
};

const result = calculateRiskSourceProbabilities(riskSources);
// Result: {
//   t_c_RS: 0.1111,
//   c_c_RS: 0.0556,
//   p_c_RS: 0.0556,
//   m_c_RS: 0.0556,
//   R_sum_RS: 0.2778
// }
```

---

### Етап 2: Аналіз Ризиків з Вагами Експертів

**Математична модель:**
```
Базовий: er_i^p = (1/10) * Σ(per_ij^p) для j=1..10
Розширений: er_i^p = Σ(per_ij^p * weight_j) / Σ(weight_j)
```

**Реалізація:**
```javascript
/**
 * Етап 2: Розрахунок ймовірності ризику з урахуванням ваг експертів
 * Формула: er_i^p = sum(per_ij^p * weight_j) / sum(weight_j)
 * Якщо ваги не надано, використовується просте середнє
 */
function calculateWeightedProbability(expertProbabilities, expertWeights = null) {
  if (!expertWeights || expertWeights.length === 0) {
    // Базовий розрахунок: просте середнє
    return expertProbabilities.reduce((sum, prob) => sum + prob, 0) / expertProbabilities.length;
  }
  
  // Розширений розрахунок: середньозважене
  let weightedSum = 0;
  let weightSum = 0;
  
  for (let i = 0; i < expertProbabilities.length; i++) {
    weightedSum += expertProbabilities[i] * expertWeights[i];
    weightSum += expertWeights[i];
  }
  
  return weightedSum / weightSum;
}

/**
 * Етап 2: Розрахунок збитків з урахуванням ваг експертів
 * Аналогічний розрахунок як для ймовірності
 */
function calculateWeightedLoss(expertLosses, expertWeights = null) {
  return calculateWeightedProbability(expertLosses, expertWeights);
}
```

**Приклад виклику:**
```javascript
const expertProbabilities = [0.6, 0.7, 0.5, 0.8, 0.6, 0.7, 0.5, 0.7, 0.6, 0.7];
const expertWeights = [1.0, 1.2, 0.8, 1.5, 1.0, 1.2, 0.8, 1.2, 1.0, 1.2];

const probability = calculateWeightedProbability(expertProbabilities, expertWeights);
// Result: 0.6569

// Без ваг (базовий):
const probabilitySimple = calculateWeightedProbability(expertProbabilities, null);
// Result: 0.64 (просте середнє)
```

---

### Етап 2: Величина Ризику та Класифікація

**Математична модель:**
```
vrer_i^p = er_i^p * lrer_i^p
```

**Реалізація:**
```javascript
/**
 * Етап 2: Класифікація ймовірності
 */
function classifyProbability(probability) {
  if (probability < 0.1) return 'Дуже низька';
  if (probability < 0.25) return 'Низька';
  if (probability < 0.5) return 'Середня';
  if (probability < 0.75) return 'Висока';
  return 'Дуже висока';
}

/**
 * Етап 2: Розрахунок величини ризику
 * Формула: vrer_i^p = er_i^p * lrer_i^p
 */
function calculateRiskMagnitude(probability, loss) {
  return probability * loss;
}

/**
 * Етап 2: Повний аналіз ризику
 */
function analyzeRisk(riskId, expertProbabilities, expertLosses, expertWeights = null) {
  const probability = calculateWeightedProbability(expertProbabilities, expertWeights);
  const loss = calculateWeightedLoss(expertLosses, expertWeights);
  const magnitude = calculateRiskMagnitude(probability, loss);
  const classification = classifyProbability(probability);
  
  return {
    riskId,
    probability,
    loss,
    magnitude,
    classification,
    expertProbabilities,
    expertLosses,
    expertWeights
  };
}
```

**Приклад виклику:**
```javascript
const analysis = analyzeRisk(
  't1',
  [0.6, 0.7, 0.5, 0.8, 0.6, 0.7, 0.5, 0.7, 0.6, 0.7],
  [0.5, 0.6, 0.4, 0.7, 0.5, 0.6, 0.4, 0.6, 0.5, 0.6],
  [1.0, 1.2, 0.8, 1.5, 1.0, 1.2, 0.8, 1.2, 1.0, 1.2]
);
// Result: {
//   riskId: 't1',
//   probability: 0.6569,
//   loss: 0.5569,
//   magnitude: 0.3658,
//   classification: 'Висока'
// }
```

---

### Етап 2: Ранжування та Пріоритезація

**Математична модель:**
```
mpr = (max - min) / 3
Низький: min ≤ vrer_i^p < min + mpr
Середній: min + mpr ≤ vrer_i^p < min + 2*mpr
Високий: min + 2*mpr ≤ vrer_i^p ≤ max
```

**Реалізація:**
```javascript
/**
 * Етап 2: Ранжування та пріоритезація ризиків
 * Алгоритм поділу на 3 групи пріоритету
 */
function prioritizeRisks(risks) {
  if (risks.length === 0) return [];
  
  // Знаходимо max та min величини ризику
  const magnitudes = risks.map(r => r.magnitude);
  const max = Math.max(...magnitudes);
  const min = Math.min(...magnitudes);
  
  // Обчислюємо крок інтервалу
  const mpr = (max - min) / 3;
  
  // Призначаємо пріоритети
  return risks.map(risk => {
    let priority;
    if (risk.magnitude < min + mpr) {
      priority = 'Низький';
    } else if (risk.magnitude < min + 2 * mpr) {
      priority = 'Середній';
    } else {
      priority = 'Високий';
    }
    
    return {
      ...risk,
      priority,
      priorityThresholds: {
        min,
        max,
        mpr,
        lowThreshold: min + mpr,
        highThreshold: min + 2 * mpr
      }
    };
  }).sort((a, b) => b.magnitude - a.magnitude); // Сортуємо за спаданням
}
```

**Приклад виклику:**
```javascript
const risks = [
  {riskId: 't1', magnitude: 0.3658},
  {riskId: 'c1', magnitude: 0.3600},
  {riskId: 'p2', magnitude: 0.3380},
  {riskId: 'm5', magnitude: 0.2736}
];

const prioritized = prioritizeRisks(risks);
// Result: [
//   {riskId: 't1', magnitude: 0.3658, priority: 'Високий', ...},
//   {riskId: 'c1', magnitude: 0.3600, priority: 'Високий', ...},
//   {riskId: 'p2', magnitude: 0.3380, priority: 'Високий', ...},
//   {riskId: 'm5', magnitude: 0.2736, priority: 'Низький', ...}
// ]
```

---

### Етап 4: Моніторинг та Порівняння

**Математична модель:**
```
evrer_i^p = eprer_i^p * elrer_i^p
reduction = vrer_i^p - evrer_i^p
reductionPercentage = (reduction / vrer_i^p) * 100%
```

**Реалізація:**
```javascript
/**
 * Етап 4: Розрахунок нової величини ризику після застосування заходу
 * Формула: evrer_i^p = eprer_i^p * elrer_i^p
 */
function calculatePostMitigationRisk(newProbability, newLoss) {
  return calculateRiskMagnitude(newProbability, newLoss);
}

/**
 * Етап 4: Порівняння ризиків до і після заходу
 */
function compareRisks(originalRisk, newProbability, newLoss, expertWeights = null) {
  const newProbabilityCalculated = calculateWeightedProbability(newProbability, expertWeights);
  const newLossCalculated = calculateWeightedLoss(newLoss, expertWeights);
  const newMagnitude = calculatePostMitigationRisk(newProbabilityCalculated, newLossCalculated);
  
  const reduction = originalRisk.magnitude - newMagnitude;
  const reductionPercentage = (reduction / originalRisk.magnitude) * 100;
  
  return {
    before: {
      probability: originalRisk.probability,
      loss: originalRisk.loss,
      magnitude: originalRisk.magnitude,
      classification: originalRisk.classification
    },
    after: {
      probability: newProbabilityCalculated,
      loss: newLossCalculated,
      magnitude: newMagnitude,
      classification: classifyProbability(newProbabilityCalculated)
    },
    reduction,
    reductionPercentage,
    improved: newMagnitude < originalRisk.magnitude
  };
}
```

**Приклад виклику:**
```javascript
const originalRisk = {
  riskId: 't1',
  probability: 0.6569,
  loss: 0.5569,
  magnitude: 0.3658,
  classification: 'Висока'
};

const newProbabilities = [0.3, 0.4, 0.2, 0.5, 0.3, 0.4, 0.2, 0.4, 0.3, 0.4];
const newLosses = [0.3, 0.4, 0.2, 0.5, 0.3, 0.4, 0.2, 0.4, 0.3, 0.4];
const weights = [1.0, 1.2, 0.8, 1.5, 1.0, 1.2, 0.8, 1.2, 1.0, 1.2];

const comparison = compareRisks(originalRisk, newProbabilities, newLosses, weights);
// Result: {
//   before: { probability: 0.6569, loss: 0.5569, magnitude: 0.3658, classification: 'Висока' },
//   after: { probability: 0.3569, loss: 0.3569, magnitude: 0.1274, classification: 'Середня' },
//   reduction: 0.2384,
//   reductionPercentage: 65.17,
//   improved: true
// }
```

---

## 📁 Модуль: server.js (REST API Endpoints)

### Етап 1: API для Ідентифікації

```javascript
/**
 * POST /api/risk-sources
 * Оновити стан джерел ризиків та розрахувати ймовірності
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
```

### Етап 2: API для Аналізу

```javascript
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
```

### Етап 3: API для Планування

```javascript
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
```

### Етап 4: API для Моніторингу

```javascript
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
```

---

## 🎯 Висновок

Всі ключові функції реалізовані згідно з математичною моделлю:

✅ **Етап 1:** `calculateRiskSourceProbabilities()` - точний розрахунок за формулою (1/18) * Σ  
✅ **Етап 2:** `calculateWeightedProbability()` та `calculateWeightedLoss()` - середньозважені значення  
✅ **Етап 2:** `calculateRiskMagnitude()` - добуток ймовірності та збитків  
✅ **Етап 2:** `prioritizeRisks()` - алгоритм mpr = (max - min) / 3  
✅ **Етап 4:** `compareRisks()` - порівняння до/після з відсотком покращення  

Усі функції верифіковані та протестовані з реальними даними (див. EXAMPLE_TRACE.md).
