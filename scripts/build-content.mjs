import { readdir, readFile, mkdir, writeFile } from 'node:fs/promises';
import { load } from 'cheerio';
import { categoryAliases } from '../src/data.js';

const readingGuide = JSON.parse(await readFile('content/reading-guide.json', 'utf8'));
const shortTipFiles = ['content/short-tips-01-12.json', 'content/short-tips-13-34.json'];
const readingMaps = await Promise.all(shortTipFiles.map(async file => JSON.parse(await readFile(file, 'utf8'))));
const noteKeys = readingMaps.flatMap(map => Object.keys(map));
if (new Set(noteKeys).size !== noteKeys.length) throw new Error('Duplicate concise reading note');
const shortTips = Object.assign({}, ...readingMaps);
const usedNotes = new Set();

const articles = [];
const tips = [];
const slugs = new Set();
for (const file of (await readdir('content')).filter(file => file.endsWith('.html'))) {
  const $ = load(await readFile(`content/${file}`, 'utf8'));
  const article = $('article');
  const slug = article.attr('data-slug');
  if (!slug || slugs.has(slug)) throw new Error(`Missing or duplicate slug: ${file}`);
  slugs.add(slug);
  article.find('h2').each((index, heading) => {
    const id = $(heading).attr('id') || `section-${index + 1}`;
    $(heading).attr('id', id);
  });
  const originalTitle = article.find('h1').text();
  const reading = readingGuide[slug];
  const title = reading?.title || originalTitle;
  const category = categoryAliases[article.attr('data-category')] || article.attr('data-category');
  article.find('h1').remove();
  const introduction = article.find('.reference-intro > div').html();
  const introductionText = article.find('.reference-intro > div').text().replace(/\s+/g, ' ').trim();
  if (reading) article.find('.lead').text(reading.excerpt);
  article.find('.full-guide > summary').text('查看完整内容');
  if (reading?.brief) {
    const brief = $('<section class="article-brief"><h2 id="quick-points">先看要点</h2><ul></ul></section>');
    for (const point of reading.brief) brief.find('ul').append($('<li></li>').text(point));
    article.find('.full-guide').before(brief);
  }
  if (article.attr('data-kind') === 'reference') {
    const sourceInfo = $('<details class="source-info" id="reading-info"><summary>阅读说明与来源</summary><div class="source-info-body"></div></details>');
    if (title !== originalTitle) sourceInfo.find('.source-info-body').append($('<p class="original-chapter-title"></p>').text(`原文：${originalTitle}`));
    if (introduction) sourceInfo.find('.source-info-body').append(introduction);
    sourceInfo.find('.source-info-body').append(article.find('.source-attribution').first().clone());
    sourceInfo.find('.source-info-body').append('<p>本站添加短标题与一句话要点。完整条目和出处保留在“依据与原文”中。</p>');
    article.find('.source-attribution, .reference-intro').remove();
    article.find('.lead').after(sourceInfo);
  }
  article.find('.reference-tip').each((_, element) => {
    const tip = $(element);
    const body = tip.find('.tip-body');
    const fields = {};
    body.find('li').each((_, li) => {
      const value = $(li).text().replace(/\s+/g, ' ').trim();
      const match = value.match(/^(成本|说人话|收益|证据等级|来源|原始出处|备注)[：:]\s*([\s\S]*)/);
      if (match) fields[match[1]] = match[2];
    });
    const id = tip.attr('id');
    if (!id) throw new Error(`Missing tip id: ${file}`);
    const originalTipTitle = tip.find('.tip-title').text();
    const noteKey = `${slug}#${id}`;
    const note = shortTips[noteKey];
    if (!note) throw new Error(`Missing concise reading note: ${noteKey}`);
    if (note) {
      if (typeof note.title !== 'string' || typeof note.summary !== 'string' || !note.title.trim() || !note.summary.trim() || note.title.length > 28 || note.summary.length > 75) throw new Error(`Invalid concise reading note: ${noteKey}`);
      usedNotes.add(noteKey);
      const originalBody = body.html();
      tip.find('.tip-title').text(note.title);
      body.empty().append('<p class="tip-summary"></p><details class="tip-evidence"><summary>依据与原文</summary><div class="tip-source"><h3 class="tip-original-title"></h3></div></details>');
      body.find('.tip-summary').text(note.summary);
      body.find('.tip-original-title').text(originalTipTitle);
      body.find('.tip-source').append(originalBody);
    }
    tips.push({ id: `${slug}-${id}`, title: note?.title || originalTipTitle, originalTitle: originalTipTitle, summary: note?.summary || '', plain: fields['说人话'] || '', cost: fields['成本'] || '', benefit: fields['收益'] || '', evidence: fields['证据等级'] || '', sources: fields['来源'] || fields['原始出处'] || '', notes: fields['备注'] || '', text: body.text().replace(/\s+/g, ' ').trim(), href: `/guide/${slug}#${id}`, chapterSlug: slug, chapterTitle: title, category });
  });
  const text = article.text().replace(/\s+/g, ' ').trim();
  const summary = article.clone();
  summary.find('.full-guide, .reference-tip, .source-info, .reference-extra').remove();
  const summaryText = summary.text().replace(/\s+/g, ' ').trim();
  const tipCount = article.find('.reference-tip').length;
  const detailText = tipCount ? introductionText : article.find('.full-guide-body').text().replace(/\s+/g, ' ').trim();
  const extraSections = article.find('.reference-extra').toArray().map(section => ({ anchor: $(section).find('h2').attr('id'), title: $(section).find('h2').text(), text: $(section).text().replace(/\s+/g, ' ').trim() }));
  const toc = article.find('h2').toArray().filter(heading => !$(heading).closest('.full-guide, .source-info, .tip-source').length).map(heading => ({ id: $(heading).attr('id'), title: $(heading).text() }));
  if (article.find('.full-guide').length) toc.push({ id: 'full-guide', title: '完整内容' });
  articles.push({ slug, title, originalTitle, category, kind: article.attr('data-kind') || 'original', tipCount, source: article.attr('data-source-url') ? { url: article.attr('data-source-url'), path: article.attr('data-source-path') } : null, order: Number(article.attr('data-order')), excerpt: article.find('.lead').text(), html: article.html(), text, summaryText, detailText, extraSections, toc, minutes: Math.max(1, Math.ceil(summaryText.replace(/\s/g, '').length / 260)) });
}
for (const key of Object.keys(shortTips)) if (!usedNotes.has(key)) throw new Error(`Unknown concise reading note: ${key}`);
articles.sort((a, b) => (a.kind === 'reference' ? 0 : 1) - (b.kind === 'reference' ? 0 : 1) || a.order - b.order);
await mkdir('src/generated', { recursive: true });
await writeFile('src/generated/content.json', JSON.stringify(articles));
await writeFile('src/generated/metadata.json', JSON.stringify(articles.map(({ html, text, summaryText, detailText, extraSections, ...metadata }) => metadata)));
await writeFile('src/generated/tips.json', JSON.stringify(tips));
console.log(`Prepared ${articles.length} HTML guides, ${tips.length} suggestions and ${usedNotes.size} concise reading notes.`);
