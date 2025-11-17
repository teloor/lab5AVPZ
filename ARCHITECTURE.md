# 🏗 Архітектура Системи Управління Ризиками

## Огляд

Система побудована за класичною тришаровою архітектурою з REST API для комунікації між клієнтом та сервером.

## Шари Архітектури

### 1. Presentation Layer (Frontend)

**Технології:** HTML5, CSS3, Vanilla JavaScript

**Компоненти:**
- `index.html` - Одностороковий веб-додаток (SPA)
- `styles.css` - Сучасний адаптивний дизайн
- `app.js` - Клієнтська логіка та API взаємодія

**Функціональність:**
- Навігація між 4 етапами
- Динамічне генерування форм
- Валідація введених даних
- Відображення результатів розрахунків
- Інтерактивні графіки та таблиці

### 2. Business Logic Layer (Backend)

**Технології:** Node.js, Express.js

**Компоненти:**

#### server.js - REST API Server
Основний сервер, який надає 15+ ендпоінтів для:
- Управління джерелами ризиків
- Вибору ризикових подій
- Аналізу ризиків
- Планування заходів
- Моніторингу ефективності

**Ключові ендпоінти:**
```
Етап 1:
  GET  /api/risk-sources
  POST /api/risk-sources
  GET  /api/risk-events
  POST /api/risk-events/select

Етап 2:
  POST /api/analyze-risk
  POST /api/prioritize-risks
  GET  /api/analyzed-risks

Етап 3:
  GET  /api/mitigation-measures
  POST /api/assign-mitigation
  GET  /api/mitigation-plans

Етап 4:
  POST /api/monitor-risk
  GET  /api/monitoring-data
  GET  /api/monitoring-data/:riskId
```

#### calculations.js - Математична Модель
Модуль з чистими функціями для всіх розрахунків:

**Функції Етапу 1:**
```javascript
calculateRiskSourceProbabilities(riskSources)
// Розрахунок: t_c^RS, c_c^RS, p_c^RS, m_c^RS, R_Σ^RS
```

**Функції Етапу 2:**
```javascript
calculateWeightedProbability(expertProbabilities, expertWeights)
// Базовий: (1/10) * Σ(per_ij^p)
// Розширений: Σ(per_ij^p * weight_j) / Σ(weight_j)

calculateWeightedLoss(expertLosses, expertWeights)
// Аналогічно до ймовірності

calculateRiskMagnitude(probability, loss)
// vrer_i^p = er_i^p * lrer_i^p

classifyProbability(probability)
// Класифікація: Дуже низька/Низька/Середня/Висока/Дуже висока

prioritizeRisks(risks)
// Алгоритм: mpr = (max - min) / 3
// Розподіл: Низький/Середній/Високий

analyzeRisk(riskId, expertProbabilities, expertLosses, expertWeights)
// Повний аналіз одного ризику
```

**Функції Етапу 4:**
```javascript
calculatePostMitigationRisk(newProbability, newLoss)
// evrer_i^p = eprer_i^p * elrer_i^p

compareRisks(originalRisk, newProbability, newLoss, expertWeights)
// Порівняння до/після з розрахунком зменшення
```

### 3. Data Layer

**Технології:** JSON файли (у production - база даних)

**Компоненти:**

#### data/riskSources.json
18 джерел ризиків у 4 категоріях:
- Technical (7 джерел)
- Cost (3 джерела)
- Schedule (3 джерела)
- Management (5 джерел)

#### data/riskEvents.json
46 ризикових подій у 4 категоріях:
- Technical (11 подій)
- Cost (9 подій)
- Schedule (11 подій)
- Management (16 подій)

#### data/mitigationMeasures.json
19 заходів зі зменшення ризику

#### Сховище в пам'яті (In-Memory Storage)
```javascript
projectData = {
  riskSources: {},           // Відмічені джерела
  selectedRiskEvents: [],    // Вибрані події
  analyzedRisks: {},         // Результати аналізу
  mitigationPlans: {},       // Призначені заходи
  monitoringData: {}         // Дані моніторингу
}
```

## Потоки Даних

### Етап 1: Ідентифікація

```
Frontend                    Backend                     Data
   │                           │                          │
   ├─GET /api/risk-sources────▶│                          │
   │                           ├─read───────────────────▶│
   │◀────JSON catalog──────────┤                          │
   │                           │                          │
   ├─POST /api/risk-sources───▶│                          │
   │  (selected sources)        │                          │
   │                           ├─calculateRiskSourceProbabilities()
   │◀────probabilities─────────┤                          │
```

### Етап 2: Аналіз

```
Frontend                    Backend                     Calculations
   │                           │                          │
   ├─POST /api/analyze-risk───▶│                          │
   │  (expert assessments)      │                          │
   │                           ├─analyzeRisk()──────────▶│
   │                           │                          ├─calculateWeighted*()
   │                           │                          ├─calculateRiskMagnitude()
   │                           │                          ├─classifyProbability()
   │                           │◀─────analysis result─────┤
   │◀────analysis result───────┤                          │
   │                           │                          │
   ├─POST /api/prioritize─────▶│                          │
   │                           ├─prioritizeRisks()──────▶│
   │                           │                          ├─find max/min
   │                           │                          ├─calculate mpr
   │                           │                          ├─assign priorities
   │                           │◀─────prioritized list────┤
   │◀────prioritized list──────┤                          │
```

### Етап 3: Планування

```
Frontend                    Backend                     Data
   │                           │                          │
   ├─GET /api/mitigation-measures─▶│                      │
   │                           ├─read───────────────────▶│
   │◀────measures list─────────┤                          │
   │                           │                          │
   ├─POST /api/assign-mitigation──▶│                      │
   │  (riskId, measureId)       │                          │
   │                           ├─store in projectData     │
   │◀────confirmation──────────┤                          │
```

### Етап 4: Моніторинг

```
Frontend                    Backend                     Calculations
   │                           │                          │
   ├─POST /api/monitor-risk───▶│                          │
   │  (new assessments)         │                          │
   │                           ├─compareRisks()─────────▶│
   │                           │                          ├─calculate new magnitude
   │                           │                          ├─calculate reduction
   │                           │◀─────comparison──────────┤
   │◀────comparison────────────┤                          │
```

## Патерни Проектування

### 1. MVC (Model-View-Controller)
- **Model:** calculations.js, projectData
- **View:** HTML/CSS (public/)
- **Controller:** server.js (Express routes)

### 2. Repository Pattern
Сховище даних абстраговане через модулі, що дозволяє легко замінити JSON файли на базу даних.

### 3. Stateless REST API
Кожен запит містить всю необхідну інформацію. Стан зберігається на сервері в пам'яті (для прототипу).

### 4. Pure Functions
Всі розрахункові функції в calculations.js є чистими функціями без побічних ефектів.

## Масштабованість та Розширення

### Для Production:

1. **База даних:**
   - Замінити in-memory storage на MongoDB/PostgreSQL
   - Додати user authentication та multi-tenant support

2. **Frontend Framework:**
   - Мігрувати на React/Vue для кращого управління станом
   - Додати Redux/Vuex для state management

3. **API Improvements:**
   - Додати пагінацію
   - Додати фільтрацію та сортування
   - Додати API versioning
   - Додати rate limiting

4. **Security:**
   - Додати JWT authentication
   - Додати HTTPS
   - Додати input validation/sanitization
   - Додати CORS configuration

5. **Performance:**
   - Додати кешування (Redis)
   - Додати CDN для статичних файлів
   - Додати compression middleware

6. **Monitoring:**
   - Додати logging (Winston/Bunyan)
   - Додати metrics (Prometheus)
   - Додати error tracking (Sentry)

## Тестування

### Unit Tests (майбутнє):
```javascript
// calculations.test.js
describe('calculateRiskSourceProbabilities', () => {
  it('should calculate correct probabilities', () => {
    const result = calculateRiskSourceProbabilities(testData);
    expect(result.t_c_RS).toBeCloseTo(0.1111);
  });
});
```

### Integration Tests:
```javascript
// server.test.js
describe('POST /api/analyze-risk', () => {
  it('should analyze risk correctly', async () => {
    const response = await request(app)
      .post('/api/analyze-risk')
      .send(testRiskData);
    expect(response.status).toBe(200);
  });
});
```

## Deployment

### Development:
```bash
npm start
```

### Production:
```bash
NODE_ENV=production PORT=80 npm start
```

### Docker (майбутнє):
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]
```

## Безпека

### Поточні заходи:
- CORS enabled
- Body parser з обмеженням розміру
- Input validation на API рівні

### Рекомендовані покращення:
- Helmet.js для HTTP headers security
- Rate limiting (express-rate-limit)
- Input sanitization (validator.js)
- SQL/NoSQL injection prevention
- XSS protection

## Висновок

Архітектура системи забезпечує:
- ✅ Чітке розділення відповідальностей
- ✅ Легку підтримку та розширення
- ✅ Точну відповідність математичній моделі
- ✅ Гарну продуктивність для прототипу
- ✅ Готовність до масштабування
