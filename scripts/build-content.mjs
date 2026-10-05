import { readdir, readFile, mkdir, writeFile } from 'node:fs/promises';
import { load } from 'cheerio';

const articles = [];
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
  articles.push({ slug, title, category: article.attr('data-category'), order: Number(article.attr('data-order')), excerpt: article.find('.lead').text(), html: article.html(), text, toc, minutes: Math.max(2, Math.ceil(text.replace(/\s/g, '').length / 260)) });
}
articles.sort((a, b) => a.order - b.order);
await mkdir('src/generated', { recursive: true });
await writeFile('src/generated/content.json', JSON.stringify(articles));
console.log(`Prepared ${articles.length} HTML guides.`);
