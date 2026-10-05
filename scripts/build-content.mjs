import { readdir, readFile, mkdir, writeFile } from 'node:fs/promises';
import { load } from 'cheerio';

const articles = [];
const tips = [];
const slugs = new Set();
for (const file of (await readdir('content')).filter(file => file.endsWith('.html'))) {
  const $ = load(await readFile(`content/${file}`, 'utf8'));
  const article = $('article');
  const slug = article.attr('data-slug');
  if (!slug || slugs.has(slug)) throw new Error(`Missing or duplicate slug: ${file}`);
  slugs.add(slug);
  const toc = [];
  article.find('h2').each((index, heading) => {
    const id = $(heading).attr('id') || `section-${index + 1}`;
    $(heading).attr('id', id);
    toc.push({ id, title: $(heading).text() });
  });
  const title = article.find('h1').text();
  article.find('h1').remove();
  const text = article.text().replace(/\s+/g, ' ').trim();
  const summary = article.clone();
  summary.find('.full-guide, .reference-tip, .reference-intro, .source-attribution, .reference-extra').remove();
  const summaryText = summary.text().replace(/\s+/g, ' ').trim();
  const detailText = article.find('.full-guide-body').text().replace(/\s+/g, ' ').trim();
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
    tips.push({ id: `${slug}-${id}`, title: tip.find('.tip-title').text(), plain: fields['说人话'] || '', cost: fields['成本'] || '', benefit: fields['收益'] || '', evidence: fields['证据等级'] || '', sources: fields['来源'] || fields['原始出处'] || '', notes: fields['备注'] || '', text: body.text().replace(/\s+/g, ' ').trim(), href: `/guide/${slug}#${id}`, chapterSlug: slug, chapterTitle: title, category: article.attr('data-category') });
  });
  articles.push({ slug, title, category: article.attr('data-category'), kind: article.attr('data-kind') || 'original', tipCount: article.find('.reference-tip').length, source: article.attr('data-source-url') ? { url: article.attr('data-source-url'), path: article.attr('data-source-path') } : null, order: Number(article.attr('data-order')), excerpt: article.find('.lead').text(), html: article.html(), text, summaryText, detailText, toc, minutes: Math.max(1, Math.ceil(summaryText.replace(/\s/g, '').length / 260)) });
}
articles.sort((a, b) => (a.kind === 'reference' ? 0 : 1) - (b.kind === 'reference' ? 0 : 1) || a.order - b.order);
await mkdir('src/generated', { recursive: true });
await writeFile('src/generated/content.json', JSON.stringify(articles));
await writeFile('src/generated/metadata.json', JSON.stringify(articles.map(({ html, text, summaryText, detailText, ...metadata }) => metadata)));
await writeFile('src/generated/tips.json', JSON.stringify(tips));
console.log(`Prepared ${articles.length} HTML guides and ${tips.length} reference suggestions.`);
