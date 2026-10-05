import React from 'react';
import { renderToString } from 'react-dom/server';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { load } from 'cheerio';
import App, { pageMetadata } from '../src/App.jsx';
import { categories } from '../src/data.js';

const articles = JSON.parse(await readFile('src/generated/content.json', 'utf8'));
const tips = JSON.parse(await readFile('src/generated/tips.json', 'utf8'));
const template = await readFile('dist/index.html', 'utf8');
const paths = ['/', '/guides', '/plans', '/workbench', ...categories.map(item => `/guides/${item.id}`), ...articles.map(item => `/guide/${item.slug}`), '/404'];
for (const path of paths) {
  const metadata = pageMetadata(path);
  const $ = load(template);
  $('title').text(metadata.title);
  $('meta[name="description"], meta[property="og:description"]').attr('content', metadata.description);
  $('meta[property="og:title"]').attr('content', metadata.title);
  $('meta[property="og:url"]').attr('content', `https://life.neko233.com${path === '/' ? '/' : path}`);
  $('link[rel="canonical"]').attr('href', `https://life.neko233.com${path === '/' ? '/' : path}`);
  if (metadata.article) $('meta[property="og:type"]').attr('content', 'article');
  if (path === '/404') $('head').append('<meta name="robots" content="noindex">');
  const article = articles.find(item => `/guide/${item.slug}` === path);
  $('#root').attr('data-page-path', path).html(renderToString(<App path={path} articleHtml={article?.html} />));
  const file = path === '/' ? 'dist/index.html' : `dist${path}.html`;
  await mkdir(file.slice(0, file.lastIndexOf('/')), { recursive: true });
  await writeFile(file, $.html());
}
await mkdir('dist/content', { recursive: true });
for (const article of articles) await writeFile(`dist/content/${article.slug}.html`, article.html);
await writeFile('dist/search-index.json', JSON.stringify({ categories, articles: articles.map(({ slug, title, originalTitle, kind, category, tipCount, groups, summaryText, detailText, extraSections, excerpt }) => ({ slug, title, originalTitle, kind, category, tipCount, groups, summaryText, excerpt, detailText, extraSections })), tips: tips.map(({ text, ...tip }) => tip) }));
await writeFile('dist/sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${paths.filter(path => path !== '/404' && path !== '/workbench').map(path => `<url><loc>https://life.neko233.com${path === '/' ? '/' : path}</loc></url>`).join('')}</urlset>\n`);
console.log(`Prerendered ${paths.length} pages with readable HTML and page-specific metadata.`);
