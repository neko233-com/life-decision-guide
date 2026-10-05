import assert from 'node:assert/strict';
import { readFile, readdir, access } from 'node:fs/promises';
import { join } from 'node:path';
import { load } from 'cheerio';
import { categories, categoryAliases } from '../src/data.js';
import { createSearchIndex, searchIndex } from '../src/search.js';

const normalize = value => value.replace(/\s+/g, ' ').trim();
const readJson = async path => JSON.parse(await readFile(path, 'utf8'));
const [articles, tips, searchData] = await Promise.all([
  readJson('src/generated/content.json'), readJson('src/generated/tips.json'), readJson('dist/search-index.json'),
]);
const bySlug = new Map(articles.map(article => [article.slug, article]));
const tipByHref = new Map(tips.map(tip => [tip.href, tip]));
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
assert.equal(index.length, 3 + categories.length + articles.length + tips.length);
for (const tip of tips) {
  for (const title of new Set([tip.title, tip.originalTitle])) {
    assert.ok(searchIndex(index, title).some(result => result.id === tip.id && result.href === tip.href), `Not searchable: ${tip.href}`);
  }
}
assert.equal(searchIndex(index, '打分')[0].href, '/workbench');
assert.equal(searchIndex(index, '本节条目按主题分成下面几块').find(result => result.kind === 'chapter')?.href, '/guide/reference-book-01#reading-info');

const routes = ['/', '/guides', '/workbench', ...categories.map(category => `/guides/${category.id}`), ...articles.map(article => `/guide/${article.slug}`), '/404'];
const pages = new Map();
for (const route of routes) {
  const html = await readFile(route === '/' ? 'dist/index.html' : `dist${route}.html`, 'utf8');
  const page = load(html);
  assert.equal(page('#root').attr('data-page-path'), route, `Wrong prerender ${route}`);
  assert.ok(page('h1').text(), `Blank page ${route}`);
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
console.log(`Verified ${articles.length} guides, ${tips.length} suggestions, ${fieldCount} original fields, ${index.length} search entries, ${routes.length} pages and ${linkCount} internal links.`);
