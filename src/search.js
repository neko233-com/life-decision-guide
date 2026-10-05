const publicPages = [
  { href: '/', title: '指南首页', text: '人生决策指南。让日子，过得有章法。从今天的问题，找到下一步。工资到账钱又没了、换工作怕选错、家里事情多先做哪件。按问题阅读，按家庭净资产找行动计划。把生活，理清楚。读一句要点，查完整依据。', icon: 'Compass' },
  { href: '/guides', title: '阅读指南', text: '按主题浏览全部指南，筛选文章，查看收藏。', icon: 'BookOpen' },
  { href: '/plans', title: '阶段行动计划', text: 'PLAN。按人民币家庭净资产（含自住房，总资产减负债）划分 A5 A6 A7 A8 A9 A10 A11 A12。起步与积累、配置与保护、家族与机构治理。30天与90天计划，现金流、健康、职业、住房、家庭与长期目标。', icon: 'Compass' },
  { href: '/workbench', title: '方案对比', text: '决策工作台。写清问题、目标和底线。比较方案，设置标准和权重，给选项打分与评分。先试一步，回看结果，导出 Markdown 记录。', icon: 'FileText' },
];

const normalize = value => String(value || '').toLowerCase();

export function queryTerms(query) {
  return [...new Set(normalize(query).trim().split(/\s+/).filter(Boolean))];
}

export function createSearchIndex(articles, categories, tips = []) {
  const categoryNames = Object.fromEntries(categories.map(category => [category.id, category.name]));
  return [
    ...publicPages.map(page => ({ ...page, kind: 'page', label: '页面' })),
    ...categories.map(category => ({ href: `/guides/${category.id}`, title: category.name, text: category.description, kind: 'topic', label: '主题', icon: category.icon })),
    ...articles.map(article => {
      const chapter = article.kind === 'reference' && article.tipCount > 0;
      const text = article.text ?? [article.summaryText, article.detailText].filter(Boolean).join(' ');
      return { href: `/guide/${article.slug}`, title: article.title, originalTitle: article.originalTitle, text: chapter ? [article.summaryText, article.detailText].filter(Boolean).join(' ') : text, summaryText: article.summaryText, detailText: article.detailText, detailAnchor: chapter ? 'reading-info' : 'full-guide', excerpt: article.excerpt, category: categoryNames[article.category] || '', kind: chapter ? 'chapter' : 'article', label: chapter ? '章节' : '指南', icon: 'BookOpen' };
    }),
    ...articles.flatMap(article => (article.extraSections || []).map(section => ({ href: `/guide/${article.slug}#${section.anchor}`, title: `${article.title} · ${section.title}`, text: section.text, chapterTitle: article.title, category: categoryNames[article.category] || '', kind: 'supplement', label: '补充', icon: 'BookOpen' }))),
    ...articles.flatMap(article => (article.groups || []).map(group => ({ href: `/guide/${article.slug}#${group.anchor}`, title: `${article.title} · ${group.title}`, text: group.description || group.title, chapterTitle: article.title, category: categoryNames[article.category] || '', kind: 'group', label: '分组', icon: 'List' }))),
    ...tips.map(tip => ({ id: tip.id, href: tip.href, title: tip.title || tip.plain, originalTitle: tip.originalTitle, summaryText: tip.summary, updateText: tip.updateText, updateAnchor: tip.updateAnchor, plain: tip.plain, text: tip.text || [tip.originalTitle, tip.summary, tip.updateText, ...[['说人话', tip.plain], ['成本', tip.cost], ['收益', tip.benefit], ['证据等级', tip.evidence], ['来源', tip.sources], ['备注', tip.notes]].filter(([, value]) => value).map(([label, value]) => `${label}：${value}`)].filter(Boolean).join(' '), cost: tip.cost, benefit: tip.benefit, evidence: tip.evidence, sources: tip.sources, notes: tip.notes, chapterSlug: tip.chapterSlug, chapterTitle: tip.chapterTitle, category: categoryNames[tip.category] || tip.category || '', kind: 'tip', label: '建议', icon: 'List' })),
  ].map((entry, order) => {
    const normalizedTitle = normalize(entry.title);
    const normalizedText = normalize(entry.text);
    const normalizedCategory = normalize(entry.category);
    const normalizedChapter = normalize(entry.chapterTitle);
    const normalizedFields = normalize([entry.plain, entry.cost, entry.benefit, entry.evidence, entry.sources, entry.notes].filter(Boolean).join(' '));
    return { ...entry, id: entry.id || entry.href, baseHref: entry.href, order, normalizedTitle, normalizedText, normalizedSummary: normalize(entry.summaryText ?? entry.text), normalizedDetail: normalize(entry.detailText), normalizedCategory, normalizedChapter, normalizedPlain: normalize(entry.plain), normalizedFields, normalizedUpdate: normalize(entry.updateText), searchable: `${normalizedTitle} ${normalize(entry.originalTitle)} ${normalizedCategory} ${normalizedChapter} ${normalizedText} ${normalizedFields}` };
  });
}

export function searchIndex(index, query) {
  const terms = queryTerms(query);
  if (!terms.length) {
    const chapters = index.filter(entry => entry.kind === 'chapter');
    return [...index.filter(entry => entry.kind === 'page'), ...(chapters.length ? chapters : index.filter(entry => entry.kind === 'article')).slice(0, 4)];
  }
  const phrase = normalize(query).trim();
  return index.flatMap(entry => {
    if (!terms.every(term => entry.searchable.includes(term))) return [];
    let score = (entry.kind === 'page' ? 10 : entry.kind === 'tip' ? 6 : 0) + (entry.normalizedTitle === phrase ? 100 : entry.normalizedTitle.includes(phrase) ? 35 : 0);
    for (const term of terms) {
      if (entry.normalizedTitle.includes(term)) score += 20;
      if (entry.normalizedCategory.includes(term)) score += 7;
      if (entry.normalizedChapter.includes(term)) score += 3;
      if (entry.normalizedText.includes(term)) score += 2;
    }
    const summary = `${entry.normalizedTitle} ${entry.normalizedCategory} ${entry.normalizedSummary}`;
    const hasSummary = (entry.kind === 'article' || entry.kind === 'chapter') && typeof entry.summaryText === 'string';
    const detailMatch = hasSummary && terms.some(term => !summary.includes(term) && entry.normalizedDetail.includes(term));
    const original = `${entry.normalizedTitle} ${normalize(entry.originalTitle)} ${entry.normalizedSummary} ${entry.normalizedCategory} ${entry.normalizedChapter} ${entry.normalizedFields}`;
    const updateMatch = entry.kind === 'tip' && entry.updateAnchor && terms.some(term => !original.includes(term) && entry.normalizedUpdate.includes(term));
    return [{ ...entry, score, href: updateMatch ? `${entry.baseHref.split('#')[0]}#${entry.updateAnchor}` : detailMatch ? `${entry.baseHref}#${entry.detailAnchor || 'full-guide'}` : entry.baseHref, matchType: updateMatch ? 'update' : detailMatch ? 'detail' : 'summary', matchLabel: updateMatch ? '本站核对' : hasSummary ? detailMatch ? '完整内容' : '要点' : undefined }];
  }).sort((a, b) => b.score - a.score || a.order - b.order);
}

export function resultSnippet(entry, terms, maxLength = 65) {
  let snippetTerms = terms;
  let source = entry.matchType === 'update' ? entry.updateText : entry.matchType === 'detail' ? entry.detailText : entry.summaryText ?? entry.text;
  if (entry.kind === 'tip' && entry.matchType !== 'update') {
    const extraTerms = terms.filter(term => !entry.normalizedPlain.includes(term) && entry.normalizedText.includes(term));
    const summaryContext = `${entry.normalizedSummary} ${entry.normalizedTitle} ${entry.normalizedCategory} ${entry.normalizedChapter}`;
    const useSummary = entry.summaryText && terms.every(term => summaryContext.includes(term));
    source = useSummary ? entry.summaryText : extraTerms.length ? entry.text : entry.plain || entry.text;
    if (extraTerms.length && !useSummary) snippetTerms = extraTerms;
  }
  const text = String(source || entry.text || entry.excerpt || '').replace(/\s+/g, ' ').trim();
  const normalized = normalize(text);
  const positions = snippetTerms.map(term => normalized.indexOf(term)).filter(position => position >= 0);
  const match = positions.length ? Math.min(...positions) : 0;
  const longestTerm = Math.max(0, ...terms.map(term => term.length));
  const length = Math.max(maxLength, longestTerm + 20);
  let start = Math.max(0, match - 22);
  // Start near a sentence boundary when it still keeps the matching word in view.
  const boundary = Math.max(text.lastIndexOf('。', match), text.lastIndexOf('！', match), text.lastIndexOf('？', match));
  if (boundary >= start && boundary < match) start = boundary + 1;
  start = Math.min(start, Math.max(0, text.length - length));
  const end = Math.min(text.length, start + length);
  return `${start ? '…' : ''}${text.slice(start, end).trim()}${end < text.length ? '…' : ''}`;
}

export function highlightSegments(value, terms) {
  const text = String(value || '');
  const normalized = normalize(text);
  const parts = [];
  let cursor = 0;
  while (cursor < text.length) {
    let next = -1;
    let matched = '';
    for (const term of terms) {
      if (!term) continue;
      const position = normalized.indexOf(term, cursor);
      if (position >= 0 && (next < 0 || position < next || position === next && term.length > matched.length)) { next = position; matched = term; }
    }
    if (next < 0) { parts.push({ text: text.slice(cursor), match: false }); break; }
    if (next > cursor) parts.push({ text: text.slice(cursor, next), match: false });
    parts.push({ text: text.slice(next, next + matched.length), match: true });
    cursor = next + matched.length;
  }
  return parts;
}
