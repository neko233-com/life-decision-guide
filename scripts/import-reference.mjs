import { readFileSync, readdirSync, mkdirSync, writeFileSync, copyFileSync } from 'node:fs';
import { dirname, resolve, posix } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { marked } from 'marked';
import { load } from 'cheerio';

// This importer only reads a local, pinned snapshot. It never fetches or runs upstream code.
const PROJECT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const REPO = 'https://github.com/eternity4719/HowToLiveBetter';
const COMMIT = 'bc149af3a02e721f0e3d03a673a0ec64fca765c4';
const SOURCE_DATE = '2026-10-05';
const LICENSE_URL = 'https://creativecommons.org/licenses/by/4.0/';
const FIELDS = ['成本', '说人话', '收益', '证据等级', '来源', '备注'];
const COST_WEIGHTS = { money: { '0': 0, '少': 1, '多': 2 }, time: { '少': 0, '中': 1, '多': 2 }, will: { '否': 0, '些': 1, '是': 2 } };
const CATEGORY_CHAPTERS = {
  health: [1, 2, 16, 24, 28, 34], safety: [8, 13, 14, 21], money: [5, 7, 12, 15, 26],
  rights: [9, 11, 19, 33], family: [10, 17, 18, 20, 25, 27, 30], growth: [3, 4, 6, 22, 23, 29, 31, 32],
};
const CHAPTER_LEADS = [
  '查阅交通、居家意外、疫苗与筛查相关的成本和证据。',
  '整理烟酒、饮食、运动与睡眠相关的原文建议和证据。',
  '了解注意力、休息与人际消耗的成本、收益和适用范围。',
  '查阅通勤、会议、拖延与时间安排相关的原文建议。',
  '整理日常花费、借贷、保险与投资风险的原文说明。',
  '对照常见消费与生活说法，查看原文证据和争议说明。',
  '了解收入中断时的救助、求职与维权途径原文资料。',
  '查阅财产、纠纷与人身安全相关的法条、来源和说明。',
  '整理日常行为中涉及法律责任的原文提醒与出处。',
  '比较恋爱、婚姻与伴侣关系中的成本、收益和证据。',
  '查阅开发、接单、数据与开源使用相关的法律资料。',
  '了解开店、注册、合同与经营风险的成本和原文依据。',
  '按场景查找急救、火灾与户外意外的原文说明和来源。',
  '整理账号、设备与个人信息保护相关的原文建议。',
  '查阅租赁、买卖与住房交易中的成本、风险和来源。',
  '了解慢性病管理、复查与医疗支出的原文证据和说明。',
  '整理老人照护、监护与财产安排相关的原文资料。',
  '比较育儿中的时间、费用与制度支持，保留原文口径。',
  '查阅工资、离职补偿与工伤待遇相关的原文法条资料。',
  '整理新生儿照护、常见风险与采购相关的原文证据。',
  '查阅出境、旅行与境外安全相关的制度和原文来源。',
  '比较休闲活动、减压方式与场所安全的原文说明。',
  '了解技能学习、资格考试与培训投入的成本和证据。',
  '查阅就医、转诊、报销与病历管理相关的原文资料。',
  '整理亲人离世后的手续、费用与权益相关原文资料。',
  '查阅网站与平台经营中的资质、内容与数据合规资料。',
  '按孕期与生产阶段，查找检查、手续和制度相关资料。',
  '对照减重与外形消费中的风险、证据和原文说明。',
  '查阅丧亲、失业与重病等重大变化后的原文证据。',
  '整理学龄儿童的健康、学校与养育相关原文资料。',
  '比较成年后的教育、就业与其他路径的门槛和资料。',
  '查阅留学身份、打工、保险与学历认证相关的制度资料。',
  '了解残疾后的照护、教育与权益安排相关原文资料。',
  '整理家庭常备药的使用风险、证据与原文来源说明。',
];
const DOCS = {
  '结婚划不划算.md': { slug: 'reference-doc-marriage', category: 'family', lead: '从时间、金钱与关系等角度，查阅婚姻成本和原文证据。' },
  '家庭应急装备清单.md': { slug: 'reference-doc-emergency-kit', category: 'safety', lead: '对照家庭应急装备的用途、预算与检查周期原文资料。' },
  '遇到陌生人出事该不该停.md': { slug: 'reference-doc-bystander', category: 'safety', lead: '查阅陌生人救助场景中的风险、责任与原文依据说明。' },
  '做平台要办哪些证.md': { slug: 'reference-doc-platform', category: 'money', lead: '对照平台类型、所需资质与服务器选择相关的原文资料。' },
  '生物钟和夜班.md': { slug: 'reference-doc-sleep-shifts', category: 'health', lead: '了解生物钟与夜班相关的研究口径、证据和适用范围。' },
  '被裁了之后先做什么.md': { slug: 'reference-doc-layoff', category: 'rights', lead: '按时间顺序，查阅离职手续、待遇与后续安排原文资料。' },
  '孩子出生前后要办的事.md': { slug: 'reference-doc-newborn-paperwork', category: 'family', lead: '按出生前后阶段，查阅证件、待遇与办理手续原文资料。' },
  '刚确诊慢性病之后.md': { slug: 'reference-doc-chronic-care', category: 'health', lead: '按确诊后的不同阶段，查阅治疗与生活安排原文资料。' },
  '引用对照.md': { slug: 'reference-doc-citation-map', category: 'thinking', lead: '查看原书条目之间的交叉引用，方便定位相关章节。' },
};
const READING_SECTIONS = ['这本书想回答的问题', '怎么读', '四种资源', '证据分级', '性价比档', '读懂数字（术语表）'];
const SOURCE_DIRECTORIES = new Set();

const escape = value => String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
const textOf = html => load(html, {}, false).text().replace(/\s+/g, ' ').trim();
const plainTitle = md => textOf(marked.parseInline(md, { async: false }));
const blob = path => `${REPO}/blob/${COMMIT}/${path.split('/').map(encodeURIComponent).join('/')}`;
const read = (source, path) => readFileSync(resolve(source, path), 'utf8').replace(/^\uFEFF/, '').replace(/\r\n/g, '\n');
const stripBackLink = md => md.replace(/^\[← 回总目录\]\([^)]*\)\s*\n/, '');

function headingAndBody(md, path) {
  const clean = stripBackLink(md);
  const heading = /^# (.+)$/m.exec(clean);
  if (!heading) throw new Error(`Missing H1: ${path}`);
  if (clean.slice(0, heading.index).trim()) throw new Error(`Unexpected text before H1: ${path}`);
  return { title: plainTitle(heading[1]), body: clean.slice(heading.index + heading[0].length).trim() };
}

function relativeUrl(href, sourcePath, routeMap, counts) {
  const value = href.trim();
  const protocolProbe = value.replace(/[\u0000-\u0020\u007f]/g, '');
  if (/^[a-z][a-z\d+.-]*:/i.test(protocolProbe)) {
    return /^(https?|mailto|tel):/i.test(protocolProbe) ? value : null;
  }
  if (value.startsWith('//')) return `https:${value}`;
  if (!value) return blob(sourcePath);
  const fragmentIndex = value.indexOf('#');
  const fragment = fragmentIndex < 0 ? '' : value.slice(fragmentIndex);
  const beforeFragment = fragmentIndex < 0 ? value : value.slice(0, fragmentIndex);
  const queryIndex = beforeFragment.indexOf('?');
  const query = queryIndex < 0 ? '' : beforeFragment.slice(queryIndex);
  let relativePath = queryIndex < 0 ? beforeFragment : beforeFragment.slice(0, queryIndex);
  try { relativePath = decodeURIComponent(relativePath); } catch { /* Keep malformed URLs readable. */ }
  const target = relativePath ? posix.normalize(posix.join(posix.dirname(sourcePath), relativePath)).replace(/\/$/, '') : sourcePath;
  if (!target.startsWith('../') && routeMap.has(target) && !fragment && !query) {
    counts.localLinks++;
    return `/guide/${routeMap.get(target)}`;
  }
  counts.upstreamLinks++;
  const sourceUrl = SOURCE_DIRECTORIES.has(target) ? `${REPO}/tree/${COMMIT}/${target.split('/').map(encodeURIComponent).join('/')}` : blob(target);
  return `${sourceUrl}${query}${fragment}`;
}

function renderMarkdown(md, sourcePath, routeMap, counts) {
  const raw = marked.parse(md, { gfm: true, breaks: false, async: false });
  const $ = load(raw, {}, false);
  const sourceText = $.text().replace(/\s+/g, ' ').trim();
  const sourceLinks = $('a[href]').length;
  $('script, iframe, object, embed, style, meta, link, form, base').remove();
  const safeTags = new Set(['p', 'ul', 'ol', 'li', 'blockquote', 'strong', 'em', 'del', 'code', 'pre', 'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'a', 'hr', 'br', 'img', 'span', 'sup', 'sub', 'div', 'details', 'summary', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'dl', 'dt', 'dd', 'kbd', 'abbr']);
  const safeAttributes = new Set(['href', 'src', 'alt', 'title', 'width', 'height', 'colspan', 'rowspan', 'scope', 'start', 'type', 'id', 'class', 'lang', 'open']);
  $('*').each((_, element) => {
    const node = $(element);
    if (!safeTags.has(element.tagName)) { node.replaceWith(node.contents()); return; }
    for (const [attribute, value] of Object.entries(element.attribs || {})) {
      if (/^on/i.test(attribute) || (!safeAttributes.has(attribute) && !/^aria-[a-z-]+$/.test(attribute))) {
        node.removeAttr(attribute);
      } else if (attribute === 'href' || attribute === 'src') {
        const url = relativeUrl(value, sourcePath, routeMap, counts);
        if (url === null) node.removeAttr(attribute); else node.attr(attribute, url);
      }
    }
  });
  const safeText = $.text().replace(/\s+/g, ' ').trim();
  const renderedLinks = $('a[href]').length;
  if (sourceText !== safeText) throw new Error(`HTML filtering changed source text: ${sourcePath}`);
  if (sourceLinks !== renderedLinks) throw new Error(`HTML filtering changed source link count: ${sourcePath}`);
  counts.sourceLinks += sourceLinks;
  counts.renderedLinks += renderedLinks;
  return $.html();
}

function attribution(path) {
  return `<p class="source-attribution">来源：<a href="${REPO}">高性价比人生指南</a>（eternity4719） · <a href="${escape(blob(path))}">原文</a> · <a href="${LICENSE_URL}">CC BY 4.0</a> · 同步 ${SOURCE_DATE}</p>`;
}

function article(file, inner, order) {
  if (Array.from(file.lead).length < 20 || Array.from(file.lead).length > 35) throw new Error(`Lead must be 20–35 characters: ${file.path}`);
  return `<article data-slug="${escape(file.slug)}" data-kind="reference" data-category="${escape(file.category)}" data-order="${order}" data-source-path="${escape(file.path)}" data-source-url="${escape(blob(file.path))}">\n<h1>${escape(file.title)}</h1>\n<p class="lead">${escape(file.lead)}</p>\n${attribution(file.path)}\n${inner}\n<p class="source-attribution">仅调整排版、折叠和相对链接；汇总统计按本次导入核对，原条目的成本、收益和证据保持不变。</p>\n</article>\n`;
}

function buildChapter(file, md, routeMap, counts, evidence, tiers) {
  const { title, body } = headingAndBody(md, file.path);
  file.title = title.replace(/^\d+\.\s*/, '');
  const headings = [...body.matchAll(/^### (\d+)\. (.+)$/gm)];
  if (!headings.length) throw new Error(`No advice entries: ${file.path}`);
  const intro = body.slice(0, headings[0].index).trim();
  const parts = [`<details class="reference-intro"><summary>本章说明</summary><div>${renderMarkdown(intro, file.path, routeMap, counts)}</div></details>`, '<h2 id="reference-tips">本章建议</h2>'];
  let extra = '';
  for (let index = 0; index < headings.length; index++) {
    const heading = headings[index];
    const number = Number(heading[1]);
    if (number !== index + 1) throw new Error(`Non-contiguous advice numbers: ${file.path}`);
    let rawBody = body.slice(heading.index + heading[0].length, headings[index + 1]?.index ?? body.length).trim();
    const trailingHeading = /^#{1,2} .+$/m.exec(rawBody);
    if (trailingHeading) {
      if (index !== headings.length - 1) throw new Error(`Unexpected heading between advice entries: ${file.path}`);
      extra = rawBody.slice(trailingHeading.index);
      rawBody = rawBody.slice(0, trailingHeading.index).trim();
    }
    const tag = /<!--\s*成本标签:\s*(.*?)\s*-->/.exec(rawBody);
    if (!tag) throw new Error(`Missing cost labels: ${file.path}:${number}`);
    const tags = Object.fromEntries([...tag[1].matchAll(/(钱|时间|毅力|收益|口径)=([^\s]+)/g)].map(match => [match[1], match[2]]));
    if (Object.keys(tags).length !== 5) throw new Error(`Incomplete cost labels: ${file.path}:${number}`);
    const cost = COST_WEIGHTS.money[tags['钱']] + COST_WEIGHTS.time[tags['时间']] + COST_WEIGHTS.will[tags['毅力']];
    if (!Number.isFinite(cost) || !['大', '中', '小'].includes(tags['收益']) || !['死亡率', '时间', '金钱', '自由'].includes(tags['口径'])) throw new Error(`Unknown cost labels: ${file.path}:${number}`);
    const tier = tags['收益'] === '大' ? (cost === 0 ? '极高' : cost <= 2 ? '高' : '一般') : tags['收益'] === '中' && cost === 0 ? '高' : '一般';
    tiers[tier]++;
    const tipHtml = renderMarkdown(rawBody, file.path, routeMap, counts);
    const $ = load(tipHtml, {}, false);
    for (const field of FIELDS) {
      const sourceField = rawBody.split('\n').find(line => line.startsWith(`- ${field}：`));
      if (!sourceField) throw new Error(`Missing ${field}: ${file.path}:${number}`);
      const expected = plainTitle(sourceField.slice(2));
      const matches = $('li').filter((_, element) => $(element).text().trim().startsWith(`${field}：`));
      if (matches.length !== 1 || textOf(matches.html()) !== expected) throw new Error(`Changed ${field} text: ${file.path}:${number}`);
      if (field === '说人话') matches.html(`<p class="tip-plain">${matches.html()}</p>`);
      if (field === '证据等级') {
        const grade = /^- 证据等级：\s*([ABC])/.exec(sourceField)?.[1];
        if (!grade) throw new Error(`Missing evidence grade: ${file.path}:${number}`);
        evidence[grade]++;
      }
      counts.fieldsChecked++;
    }
    parts.push(`<details class="reference-tip" id="tip-${file.chapter}-${number}" data-tip-number="${number}" data-cost-money="${escape(tags['钱'])}" data-cost-time="${escape(tags['时间'])}" data-cost-will="${escape(tags['毅力'])}" data-cost-benefit="${escape(tags['收益'])}" data-cost-scope="${escape(tags['口径'])}"><summary><span class="tip-number">${number}</span><span class="tip-title">${escape(plainTitle(heading[2]))}</span></summary><div class="tip-body">${$.html()}</div></details>`);
  }
  if (extra) parts.push(`<section class="reference-extra">${renderMarkdown(extra, file.path, routeMap, counts)}</section>`);
  file.tipCount = headings.length;
  return article(file, parts.join('\n'), 100 + file.chapter);
}

function buildReadingHelp(file, readme, routeMap, counts) {
  const headings = [...readme.matchAll(/^## (.+)$/gm)];
  const sections = READING_SECTIONS.map((title, sectionIndex) => {
    const index = headings.findIndex(heading => heading[1] === title);
    if (index < 0) throw new Error(`Missing reading-help section: ${title}`);
    const markdown = readme.slice(headings[index].index, headings[index + 1]?.index ?? readme.length).trim();
    const $ = load(renderMarkdown(markdown, file.path, routeMap, counts), {}, false);
    $('h2').first().attr('id', `reading-${sectionIndex + 1}`);
    return $.html();
  });
  return article(file, `<details class="full-guide" id="full-guide"><summary>展开完整说明</summary><div class="full-guide-body">${sections.join('\n')}</div></details>`, 90);
}

function run() {
  const sourceOption = process.argv.slice(2).find(argument => argument.startsWith('--source='));
  const unknown = process.argv.slice(2).filter(argument => !argument.startsWith('--source='));
  if (unknown.length) throw new Error(`Unknown arguments: ${unknown.join(' ')}; use --source=/path/to/snapshot`);
  if (!sourceOption || !sourceOption.slice('--source='.length).trim()) throw new Error('Usage: npm run import:reference -- --source=/path/to/HowToLiveBetter (a local clone at the pinned commit; no network requests)');
  const source = resolve(sourceOption.slice('--source='.length));
  const actualCommit = execFileSync('git', ['-C', source, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
  if (actualCommit !== COMMIT) throw new Error(`Expected snapshot ${COMMIT}, found ${actualCommit}`);
  const sourceChanges = execFileSync('git', ['-C', source, 'status', '--porcelain', '--', 'README.md', 'book', 'docs', 'LICENSE'], { encoding: 'utf8' }).trim();
  if (sourceChanges) throw new Error('The pinned source content has local changes; preserve them and use a clean snapshot');
  const trackedPaths = execFileSync('git', ['-C', source, 'ls-tree', '-r', '-z', '--name-only', COMMIT], { encoding: 'utf8' }).split('\0').filter(Boolean);
  for (const path of trackedPaths) {
    let directory = posix.dirname(path);
    while (directory !== '.') { SOURCE_DIRECTORIES.add(directory); directory = posix.dirname(directory); }
  }
  const bookPaths = readdirSync(resolve(source, 'book')).filter(name => name.endsWith('.md')).sort();
  const docPaths = readdirSync(resolve(source, 'docs')).filter(name => name.endsWith('.md')).sort();
  if (bookPaths.length !== 34 || docPaths.length !== 9) throw new Error('Snapshot must contain 34 chapters and 9 top-level documents');
  const chapters = bookPaths.map(name => {
    const chapter = Number(/^\d+/.exec(name)?.[0]);
    const category = Object.entries(CATEGORY_CHAPTERS).find(([, numbers]) => numbers.includes(chapter))?.[0];
    if (!category) throw new Error(`No chapter category: ${name}`);
    return { slug: `reference-book-${String(chapter).padStart(2, '0')}`, title: '', path: `book/${name}`, category, chapter, kind: 'chapter', tipCount: 0, lead: CHAPTER_LEADS[chapter - 1] };
  });
  const documents = docPaths.map(name => {
    if (!DOCS[name]) throw new Error(`No document mapping: ${name}`);
    const path = `docs/${name}`;
    return { ...DOCS[name], title: headingAndBody(read(source, path), path).title, path, kind: 'document', tipCount: 0 };
  });
  const readingHelp = { slug: 'reference-doc-reading', title: '怎么用这份指南', path: 'README.md', category: 'thinking', kind: 'reading-help', tipCount: 0, lead: '了解阅读方法、证据等级与术语，再按需要查找原文。' };
  const imported = [...chapters, ...documents];
  const routeMap = new Map(imported.map(file => [file.path, file.slug]));
  // README links stay at the source, since this page imports selected reader sections only.
  const counts = { sourceLinks: 0, renderedLinks: 0, localLinks: 0, upstreamLinks: 0, fieldsChecked: 0 };
  const evidence = { A: 0, B: 0, C: 0 }, tiers = { '极高': 0, '高': 0, '一般': 0 };
  const outputs = new Map();
  for (const file of chapters) outputs.set(file.slug, buildChapter(file, read(source, file.path), routeMap, counts, evidence, tiers));
  for (const [index, file] of documents.entries()) {
    const { body } = headingAndBody(read(source, file.path), file.path);
    outputs.set(file.slug, article(file, `<details class="full-guide" id="full-guide"><summary>展开完整说明</summary><div class="full-guide-body">${renderMarkdown(body, file.path, routeMap, counts)}</div></details>`, 201 + index));
  }
  const readme = read(source, 'README.md');
  outputs.set(readingHelp.slug, buildReadingHelp(readingHelp, readme, routeMap, counts));
  const tips = chapters.reduce((total, file) => total + file.tipCount, 0);
  if (tips !== 658 || counts.fieldsChecked !== 658 * 6) throw new Error(`Incomplete source import: ${tips} tips, ${counts.fieldsChecked} fields`);
  const sourceStatistics = {
    tips: Number(/全书 (\d+) 条中 A 级/.exec(readme)?.[1]),
    evidenceC: Number(/C 级 (\d+) 条，另有/.exec(readme)?.[1]),
    highCostEffectiveness: Number(/条中性价比极高 \d+ 条（\d+%）、高 (\d+) 条/.exec(readme)?.[1]),
  };
  if (sourceStatistics.tips !== tips || sourceStatistics.evidenceC !== evidence.C || sourceStatistics.highCostEffectiveness !== tiers['高']) throw new Error('Pinned README aggregate statistics do not match the actual imported entries');
  for (const [slug, html] of outputs) {
    const $ = load(html, {}, false);
    if ($('article').length !== 1 || $('script, iframe, object, embed, style, meta, link, form, base').length) throw new Error(`Unsafe article structure: ${slug}`);
    $('*').each((_, element) => {
      if (Object.keys(element.attribs || {}).some(attribute => /^on/i.test(attribute))) throw new Error(`Unsafe event attribute: ${slug}`);
      for (const attribute of ['href', 'src']) {
        const value = $(element).attr(attribute) || '';
        if (/^(javascript|data|vbscript):/i.test(value.replace(/[\u0000-\u0020\u007f]/g, ''))) throw new Error(`Unsafe URL: ${slug}`);
      }
    });
  }
  mkdirSync(resolve(PROJECT, 'content'), { recursive: true });
  mkdirSync(resolve(PROJECT, 'reference'), { recursive: true });
  for (const [slug, html] of outputs) writeFileSync(resolve(PROJECT, 'content', `${slug}.html`), html, 'utf8');
  copyFileSync(resolve(source, 'LICENSE'), resolve(PROJECT, 'reference/LICENSE-CC-BY-4.0.txt'));
  const record = file => ({ slug: file.slug, title: file.title, path: file.path, category: file.category, tipCount: file.tipCount, kind: file.kind, sourceUrl: blob(file.path) });
  const manifest = {
    source: { repo: 'eternity4719/HowToLiveBetter', url: REPO, commit: COMMIT, date: SOURCE_DATE, license: 'CC-BY-4.0', licenseUrl: LICENSE_URL, licenseFile: 'reference/LICENSE-CC-BY-4.0.txt' },
    transformations: ['Markdown converted to HTML', 'Advice entries and introductions folded', 'Relative links mapped to imported routes or pinned source URLs', 'Presentation summaries added without changing source recommendations'],
    importedFiles: imported.map(record), readingHelp: record(readingHelp),
    totals: { chapters: chapters.length, tips, documents: documents.length, importedFiles: imported.length, readingHelp: 1, outputFiles: outputs.size, evidence, costEffectiveness: tiers },
    aggregateStatistics: { sourceReadme: sourceStatistics, verifiedAgainstImportedEntries: true, textCorrections: [] },
    validation: counts,
  };
  writeFileSync(resolve(PROJECT, 'reference/manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  console.log(`Imported ${chapters.length} chapters, ${tips} tips, ${documents.length} documents and reading help from ${COMMIT}.`);
  console.log(`Verified ${counts.fieldsChecked} original fields and ${counts.sourceLinks} preserved content links. Evidence A/B/C: ${evidence.A}/${evidence.B}/${evidence.C}.`);
}

run();
