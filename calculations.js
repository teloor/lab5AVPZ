/**
 * Модуль розрахунків для системи управління ризиками
 * Реалізує всі математичні формули згідно з моделлю
 */

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
  }).sort((a, b) => b.magnitude - a.magnitude); // Сортуємо за спаданням величини ризику
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

module.exports = {
  calculateRiskSourceProbabilities,
  calculateWeightedProbability,
  calculateWeightedLoss,
  classifyProbability,
  calculateRiskMagnitude,
  prioritizeRisks,
  analyzeRisk,
  calculatePostMitigationRisk,
  compareRisks
};
