import assert from 'node:assert/strict';
import { readFile, readdir, access } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { load } from 'cheerio';
import { categories, categoryAliases } from '../src/data.js';
import { createSearchIndex, queryTerms, resultSnippet, searchIndex } from '../src/search.js';
import { createDraft, evaluateOptions, recordMarkdown, validDraft } from '../src/scoring.js';
import { assetLevel, assetPlans, planHref, planLevelFromSearch, planSelectionHref } from '../src/plans.js';
import { readStored, writeStored } from '../src/storage.js';

const normalize = value => value.replace(/\s+/g, ' ').trim();
const readJson = async path => JSON.parse(await readFile(path, 'utf8'));
const [articles, tips, searchData] = await Promise.all([
  readJson('src/generated/content.json'), readJson('src/generated/tips.json'), readJson('dist/search-index.json'),
]);
const bySlug = new Map(articles.map(article => [article.slug, article]));
const tipByHref = new Map(tips.map(tip => [tip.href, tip]));
const readingGroups = await readJson('content/reading-groups.json');
assert.equal(bySlug.size, articles.length, 'Guide slugs must be unique');
assert.equal(tipByHref.size, tips.length, 'Suggestion anchors must be unique');
assert.equal(searchData.articles.length, articles.length, 'Search must cover all guides');
assert.equal(searchData.tips.length, tips.length, 'Search must cover all suggestions');
let originalCount = 0;
let fieldCount = 0;
for (const file of (await readdir('content')).filter(file => file.endsWith('.html'))) {
  const source = load(await readFile(join('content', file), 'utf8'));
  const slug = source('article').attr('data-slug');
  const guide = bySlug.get(slug);
  assert.ok(guide, `Missing guide ${slug}`);
  const rendered = load(guide.html);
  assert.ok(categories.some(category => category.id === guide.category), `Unknown category ${slug}`);
  assert.equal(guide.originalTitle, source('h1').text(), `Original heading lost ${slug}`);
  const originalBody = source('.full-guide-body');
  if (originalBody.length) assert.equal(normalize(rendered('.full-guide-body').text()), normalize(originalBody.text()), `Full explanation changed ${slug}`);
  const intro = normalize(source('.reference-intro > div').text());
  if (intro) assert.ok(normalize(rendered('.source-info').text()).includes(intro), `Chapter introduction lost ${slug}`);
  if (guide.tipCount > 0) {
    const grouping = readingGroups[slug];
    const ids = grouping.groups.flatMap(group => group.tips);
    assert.equal(new Set(ids).size, guide.tipCount, `Group coverage missing or repeated ${slug}`);
    assert.equal(ids.length, guide.tipCount, `Duplicate group entries ${slug}`);
    assert.equal(rendered('.reading-group .reference-tip').length, guide.tipCount, `Ungrouped suggestions ${slug}`);
    assert.deepEqual(rendered('.reading-group .reference-tip').toArray().map(element => rendered(element).attr('id')), ids, `Wrong grouping ${slug}`);
    assert.equal(rendered('.chapter-jumps a').length, grouping.groups.length);
  }
  if (source('article').attr('data-kind') === 'reference') {
    const attribution = rendered('.source-info');
    assert.ok(attribution.text().includes('eternity4719'), `Author missing ${slug}`);
    assert.ok(attribution.find('a[href="https://creativecommons.org/licenses/by/4.0/"]').length, `License missing ${slug}`);
    assert.ok(attribution.find(`a[href="${guide.source.url}"]`).length, `Pinned source missing ${slug}`);
  }
  source('.reference-tip').each((_, element) => {
    const tip = source(element);
    const id = tip.attr('id');
    const href = `/guide/${slug}#${id}`;
    const entry = tipByHref.get(href);
    const result = rendered(`#${id}`);
    originalCount++;
    assert.ok(entry && result.length, `Missing suggestion ${href}`);
    assert.equal(entry.originalTitle, tip.find('.tip-title').text(), `Original title changed ${href}`);
    const originalFields = tip.find('.tip-body > ul > li').toArray();
    const resultFields = result.find(entry.summary ? '.tip-source > ul > li' : '.tip-body > ul > li').toArray();
    assert.equal(originalFields.length, 6, `Source field schema changed ${href}`);
    assert.equal(resultFields.length, originalFields.length, `Missing source fields ${href}`);
    originalFields.forEach((field, index) => {
      assert.equal(normalize(rendered(resultFields[index]).text()), normalize(source(field).text()), `Source field changed ${href} field ${index}`);
      assert.deepEqual(rendered(resultFields[index]).find('a').toArray().map(link => rendered(link).attr('href')), source(field).find('a').toArray().map(link => source(link).attr('href')), `Source links changed ${href}`);
      fieldCount++;
    });
    if (entry.summary) {
      assert.equal(result.find('.tip-title').text(), entry.title);
      assert.equal(result.find('.tip-summary').text(), entry.summary);
      assert.equal(result.find('.tip-evidence').length, 1, `Missing reading layer ${href}`);
    }
  });
  const expected = source('a').toArray().map(link => source(link).attr('href'));
  const actual = new Set(rendered('a').toArray().map(link => rendered(link).attr('href')));
  for (const href of expected) assert.ok(actual.has(href), `Content link lost ${slug}: ${href}`);
}
assert.equal(originalCount, tips.length, 'All source suggestions must be retained');

const index = createSearchIndex(searchData.articles, searchData.categories, searchData.tips);
const indexedTips = new Map(index.filter(entry => entry.kind === 'tip').map(entry => [entry.id, entry]));
assert.equal(index.length, 4 + categories.length + articles.length + tips.length + articles.reduce((count, article) => count + (article.extraSections?.length || 0) + (article.groups?.length || 0), 0));
for (const article of articles) {
  assert.ok(searchIndex(index, article.originalTitle).some(result => result.baseHref === `/guide/${article.slug}`), `Original guide title not searchable: ${article.slug}`);
  for (const group of article.groups || []) assert.ok(searchIndex(index, group.title).some(result => result.href === `/guide/${article.slug}#${group.anchor}`), `Group not searchable: ${article.slug}#${group.anchor}`);
  for (const section of article.extraSections || []) {
    assert.ok(searchIndex(index, section.text).some(result => result.href === `/guide/${article.slug}#${section.anchor}`), `Supplement not searchable: ${article.slug}#${section.anchor}`);
  }
}
for (const tip of tips) {
  const indexed = indexedTips.get(tip.id);
  for (const key of ['plain', 'cost', 'benefit', 'evidence', 'sources', 'notes']) {
    assert.equal(indexed[key], tip[key], `Search field changed: ${tip.href} ${key}`);
    assert.ok(indexed.searchable.includes(tip[key].toLowerCase()), `Original field not indexed: ${tip.href} ${key}`);
  }
  for (const title of new Set([tip.title, tip.originalTitle])) {
    assert.ok(searchIndex(index, title).some(result => result.id === tip.id && result.href === tip.href), `Not searchable: ${tip.href}`);
  }
}
const healthSnippet = indexedTips.get('reference-book-01-tip-1-1');
assert.equal(resultSnippet(healthSnippet, queryTerms('健康')), healthSnippet.summaryText, 'Category searches should use concise notes');
const sourceTip = indexedTips.get('reference-book-05-tip-5-2');
assert.ok(resultSnippet(sourceTip, queryTerms('400')).includes('400'), 'Original fields must remain visible in matching snippets');
const updates = tips.filter(tip => tip.updateText);
assert.equal(updates.length, 3);
for (const tip of updates) {
  const rendered = load(bySlug.get(tip.chapterSlug).html);
  assert.equal(rendered(`#${tip.updateAnchor}`).length, 1, `Update anchor missing: ${tip.href}`);
  assert.ok(rendered(`#${tip.updateAnchor} a[href^="https://"]`).length, `Update source missing: ${tip.href}`);
  assert.ok(indexedTips.get(tip.id).searchable.includes(tip.updateText.toLowerCase()), `Update not searchable: ${tip.href}`);
}
assert.equal(searchIndex(index, '申请前2年内领失业保险金累计12个月').find(result => result.id === 'reference-book-05-tip-5-20')?.href, '/guide/reference-book-05#tip-5-20-update');
assert.equal(searchIndex(index, '2025-12-31').find(result => result.id === 'reference-book-18-tip-18-1')?.href, '/guide/reference-book-18#tip-18-1-update');
assert.ok(tipByHref.get('/guide/reference-book-13#tip-13-1').summary.includes('仅喘息也算呼吸异常'));
assert.equal(searchIndex(index, '打分')[0].href, '/workbench');
assert.equal(searchIndex(index, '本节条目按主题分成下面几块').find(result => result.kind === 'chapter')?.href, '/guide/reference-book-01#reading-info');
assert.equal(searchIndex(index, '转载、改编要写明出处并附原文链接').find(result => result.kind === 'supplement')?.href, '/guide/reference-book-26#section-2');
assert.ok(tipByHref.get('/guide/reference-book-05#tip-5-2').summary.includes('3月至6月'), 'Months must use Arabic digits in concise notes');
assert.ok(tipByHref.get('/guide/reference-book-18#tip-18-5').title.includes('3个阶段'), 'Counts must use Arabic digits in concise titles');
// Arithmetic, partial answers, ties and persisted v1 drafts are independently checked.
const draft = createDraft();
assert.ok(validDraft(draft));
draft.criteria = [{ name: '目标', weight: 5 }, { name: '可行', weight: 3 }, { name: '可逆', weight: 0 }];
draft.options[0].scores = [5, 3, 0]; draft.options[1].scores = [3, 5, 0];
let evaluation = evaluateOptions(draft.options, draft.criteria);
assert.equal(evaluation.results[0].hundred, 85); assert.equal(evaluation.results[0].five, 4.25);
assert.equal(evaluation.results[1].hundred, 75); assert.equal(evaluation.results[1].five, 3.75);
assert.equal(evaluation.winners[0].id, 'a');
assert.ok(validDraft(JSON.parse(JSON.stringify(draft))), 'Existing v1 record must remain readable');
assert.ok(recordMarkdown(draft).includes('85.0 / 100（4.25 / 5）'));
assert.ok(recordMarkdown(draft).includes('\n## 比较标准\n'));
draft.options[1].scores = [5, 3, 5];
assert.equal(evaluateOptions(draft.options, draft.criteria).winners.length, 2, 'Zero weight must not break a tie');
draft.options[1].scores = [0, 3, 0];
assert.equal(evaluateOptions(draft.options, draft.criteria).winners.length, 0, 'Pending scores must not create a winner');
draft.criteria.forEach(item => { item.weight = 0; });
evaluation = evaluateOptions(draft.options, draft.criteria);
assert.equal(evaluation.highest, null); assert.equal(evaluation.totalWeight, 0);
assert.ok(evaluation.results.every(result => result.hundred === null && !result.complete));
assert.equal(validDraft({ ...draft, options: [draft.options[0], draft.options[0]] }), false);
assert.equal(validDraft(null), false);
for (let a = 0; a <= 5; a++) for (let b = 0; b <= 5; b++) for (let c = 0; c <= 5; c++) {
  const criteria = [a, b, c].map(weight => ({ name: '', weight }));
  const total = a + b + c;
  const check = evaluateOptions([{ id: 'test', name: '', scores: [5, 3, 1] }], criteria);
  if (total) {
    const expected = (a * 5 + b * 3 + c) / total * 20;
    assert.ok(Math.abs(check.results[0].hundred - expected) < 1e-8, 'Weighted score mismatch');
    assert.ok(check.complete && Number.isFinite(check.highest));
  } else assert.equal(check.results[0].hundred, null);
}
// A broken or concurrently changed record must never be silently replaced.
let stored = '{broken';
let writes = 0;
const memoryStorage = { getItem: () => stored, setItem: (_, value) => { stored = value; writes++; } };
assert.equal(readStored(memoryStorage, 'decision', validDraft).state, 'invalid');
assert.equal(stored, '{broken'); assert.equal(writes, 0);
stored = JSON.stringify(createDraft());
const initialRecord = readStored(memoryStorage, 'decision', validDraft);
assert.equal(initialRecord.state, 'ready'); assert.ok(validDraft(initialRecord.value));
const edited = createDraft(); edited.question = 'Saved elsewhere';
stored = JSON.stringify(edited);
assert.equal(writeStored(memoryStorage, 'decision', createDraft(), initialRecord.raw).state, 'conflict');
assert.equal(JSON.parse(stored).question, 'Saved elsewhere'); assert.equal(writes, 0);
const latestRecord = readStored(memoryStorage, 'decision', validDraft);
edited.question = 'Current edit';
assert.equal(writeStored(memoryStorage, 'decision', edited, latestRecord.raw).state, 'ready');
assert.equal(JSON.parse(stored).question, 'Current edit'); assert.equal(writes, 1);
assert.equal(readStored({ getItem() { throw new Error('Denied'); } }, 'decision', validDraft).state, 'unavailable');
assert.equal(writeStored({ getItem: () => stored, setItem() { throw new Error('Quota'); } }, 'decision', edited, stored).state, 'unavailable');
assert.equal(JSON.parse(stored).question, 'Current edit');
stored = null;
assert.equal(readStored(memoryStorage, 'decision', validDraft).state, 'ready');
assert.equal(assetPlans.length, 8);
assert.equal(planLevelFromSearch('?level=a7'), 'A7');
assert.equal(planLevelFromSearch('?level=A13'), null);
assert.equal(planLevelFromSearch(''), null);
assert.equal(planSelectionHref('A8'), '/plans?level=A8');
assert.equal(planSelectionHref('foundation'), '/plans');
assert.equal(articles.filter(article => article.kind === 'plan').length, 9);
assert.equal(assetLevel(-1), null); assert.equal(assetLevel(9999), null);
assert.equal(assetLevel(10000), 'A5'); assert.equal(assetLevel(99999), 'A5');
assert.equal(assetLevel(100000), 'A6'); assert.equal(assetLevel(1500000), 'A7');
assert.equal(assetLevel(10000000), 'A8'); assert.equal(assetLevel(100000000000), 'A12');
assert.equal(assetLevel(1000000000000), null); assert.equal(assetLevel(NaN), null);
for (const plan of assetPlans) {
  assert.equal(assetLevel(plan.lower), plan.level);
  assert.equal(assetLevel(plan.upper - 1), plan.level);
  const guide = bySlug.get(planHref(plan.level).slice(7));
  assert.ok(guide && guide.kind === 'plan', `Missing plan ${plan.level}`);
  const rendered = load(guide.html);
  assert.ok(rendered('.plan-range').text().includes(plan.range), `Inconsistent asset range ${plan.level}`);
  for (const id of ['focus', 'next-30', 'next-90', 'check', 'liquidity', 'housing', 'career', 'health', 'family', 'long-term']) assert.equal(rendered(`#${id}`).length, 1, `Incomplete plan ${plan.level}: ${id}`);
  assert.ok(searchIndex(index, plan.level).some(result => result.href === planHref(plan.level)), `Plan not searchable ${plan.level}`);
}

const routes = ['/', '/guides', '/plans', '/workbench', ...categories.map(category => `/guides/${category.id}`), ...articles.map(article => `/guide/${article.slug}`), '/404'];
const pages = new Map();
for (const route of routes) {
  const html = await readFile(route === '/' ? 'dist/index.html' : `dist${route}.html`, 'utf8');
  const page = load(html);
  assert.equal(page('#root').attr('data-page-path'), route, `Wrong prerender ${route}`);
  assert.ok(page('h1').text(), `Blank page ${route}`);
  assert.ok(page('title').text().endsWith('· 人生决策指南'), `Missing page title ${route}`);
  assert.equal(page('link[rel="canonical"]').attr('href'), `https://life.neko233.com${route}`, `Wrong canonical ${route}`);
  assert.ok(page('meta[name="description"]').attr('content'), `Missing description ${route}`);
  assert.equal(page('meta[property="og:title"]').attr('content'), page('title').text(), `Wrong share title ${route}`);
  assert.equal(page('meta[name="theme-color"]').attr('content'), '#ffffff', `Wrong site theme ${route}`);
  const ids = page('[id]').toArray().map(element => page(element).attr('id'));
  assert.equal(ids.length, new Set(ids).size, `Duplicate anchor ${route}`);
  pages.set(route, page);
}
let linkCount = 0;
for (const [route, page] of pages) {
  for (const element of page('a[href]').toArray()) {
    const href = page(element).attr('href');
    if (!href.startsWith('/') && !href.startsWith('#')) continue;
    const url = new URL(href, `https://life.neko233.com${route}`);
    let path = url.pathname.replace(/\/$/, '') || '/';
    const alias = path.startsWith('/guides/') && categoryAliases[path.slice(8)];
    if (alias) path = `/guides/${alias}`;
    const target = pages.get(path);
    if (target) {
      if (url.hash) assert.ok(target('[id]').toArray().some(element => target(element).attr('id') === decodeURIComponent(url.hash.slice(1))), `Broken anchor ${route} -> ${href}`);
    } else await access(join('dist', path));
    linkCount++;
  }
  for (const image of page('img[src]').toArray()) await access(join('dist', page(image).attr('src')));
}
const redirects = await readFile('dist/_redirects', 'utf8');
for (const [oldId, newId] of Object.entries(categoryAliases)) assert.ok(redirects.includes(`/guides/${oldId} /guides/${newId} 301`));
let documentLinkCount = 0;
try {
  const files = ['AGENTS.md', 'README.md', ...(await readdir('docs')).filter(file => file.endsWith('.md')).map(file => join('docs', file))];
  for (const file of files) {
    const markdown = await readFile(file, 'utf8');
    for (const match of markdown.matchAll(/\[[^\]]*\]\(([^\s)]+)\)/g)) {
      const href = match[1];
      if (/^[a-z]+:/i.test(href)) continue;
      const [path, fragment] = href.split('#');
      const target = path ? resolve(dirname(file), decodeURIComponent(path)) : resolve(file);
      await access(target);
      if (fragment && target.endsWith('.md')) {
        const content = await readFile(target, 'utf8');
        const headings = Array.from(content.matchAll(/^#{1,6}\s+(.+)$/gm), item => item[1].trim().toLowerCase().replace(/[^\p{L}\p{N}\s_-]/gu, '').replace(/\s/g, '-'));
        assert.ok(headings.includes(decodeURIComponent(fragment).toLowerCase()), `Broken documentation anchor ${file} -> ${href}`);
      }
      documentLinkCount++;
    }
  }
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
  // During the first layout phase, maintenance documents have not been added yet.
  if (error.path !== 'docs') throw error;
}
console.log(`Verified ${articles.length} guides, ${tips.length} suggestions, ${fieldCount} original fields, ${index.length} search entries, ${routes.length} pages, ${linkCount} internal links and ${documentLinkCount} documentation links.`);
