export const storageKey = 'life-guide-decision-v1';
export const scoreLabels = ['未评分', '1 · 很不符合', '2 · 较不符合', '3 · 基本符合', '4 · 比较符合', '5 · 非常符合'];
export const weightLabels = ['0 · 不计入', '1 · 次要', '2 · 稍重要', '3 · 重要', '4 · 很重要', '5 · 最重要'];

export const createDraft = () => ({
  question: '', goals: '', constraints: '',
  criteria: [{ name: '符合目标', weight: 5 }, { name: '实际可行', weight: 3 }, { name: '方便调整', weight: 2 }],
  options: [{ id: 'a', name: '方案 A', scores: [0, 0, 0] }, { id: 'b', name: '方案 B', scores: [0, 0, 0] }],
  experiment: '', review: '',
});

// The existing v1 browser record remains readable. Zero means unanswered for scores.
export function validDraft(value) {
  return Boolean(value && ['question', 'goals', 'constraints', 'experiment', 'review'].every(key => typeof value[key] === 'string')
    && Array.isArray(value.criteria) && value.criteria.length === 3
    && value.criteria.every(item => typeof item?.name === 'string' && Number.isInteger(item.weight) && item.weight >= 0 && item.weight <= 5)
    && Array.isArray(value.options) && value.options.length >= 2 && value.options.length <= 5
    && new Set(value.options.map(option => option?.id)).size === value.options.length
    && value.options.every(option => typeof option?.id === 'string' && typeof option.name === 'string'
      && Array.isArray(option.scores) && option.scores.length === 3
      && option.scores.every(number => Number.isInteger(number) && number >= 0 && number <= 5)));
}

export function evaluateOptions(options, criteria) {
  const totalWeight = criteria.reduce((sum, criterion) => sum + criterion.weight, 0);
  const weights = criteria.map(criterion => totalWeight ? criterion.weight / totalWeight : 0);
  const results = options.map(option => {
    const missing = criteria.filter((criterion, i) => criterion.weight > 0 && option.scores[i] === 0).length;
    const complete = totalWeight > 0 && missing === 0;
    const contributions = weights.map((weight, i) => option.scores[i] * weight * 20);
    const hundred = complete ? contributions.reduce((sum, value) => sum + value, 0) : null;
    return { ...option, missing, complete, contributions, hundred, five: hundred === null ? null : hundred / 20 };
  });
  const complete = totalWeight > 0 && results.every(result => result.complete);
  const highest = complete ? Math.max(...results.map(result => result.hundred)) : null;
  const winners = complete ? results.filter(result => Math.abs(result.hundred - highest) < 1e-8) : [];
  return { totalWeight, weights, results, complete, highest, winners };
}

export function recordMarkdown(draft) {
  const evaluation = evaluateOptions(draft.options, draft.criteria);
  return [
    `# ${draft.question || '我的决策记录'}`, '', '## 目标', draft.goals || '尚未填写', '', '## 底线', draft.constraints || '尚未填写', '',
    '## 比较标准', ...draft.criteria.map((item, i) => `- ${item.name}：权重 ${item.weight}，占比 ${(evaluation.weights[i] * 100).toFixed(1)}%`), '',
    '评分 1–5 分，越高越符合标准；0 表示未评分。总分 = Σ（评分 ÷ 5 × 权重占比 × 100）。', '',
    '## 方案', ...evaluation.results.flatMap(option => [
      `### ${option.name}`, ...draft.criteria.map((criterion, i) => `- ${criterion.name}：${criterion.weight === 0 ? '不计入' : option.scores[i] || '未评分'}`),
      `加权分：${option.complete ? `${option.hundred.toFixed(1)} / 100（${option.five.toFixed(2)} / 5）` : '尚未完成评分'}`, '',
    ]), '## 下一步', draft.experiment || '尚未填写', '', '## 回看时间', draft.review || '尚未填写', '',
    '评分来自你的判断，不是成功概率。先核对事实和底线。',
    '由人生决策指南工作台导出：https://life.neko233.com/workbench',
  ].join('\n');
}
