import { useDeferredValue, useEffect, useState } from 'react';
import articles from './generated/metadata.json';
import { categories, categoryAliases } from './data.js';
import Icon from './Icons.jsx';
import Workbench from './Workbench.jsx';
import SearchDialog from './SearchDialog.jsx';

export const repository = 'https://github.com/neko233-com/life-decision-guide';
export const articleUrl = article => `/guide/${article.slug}`;
const categoryById = Object.fromEntries(categories.map(category => [category.id, category]));
const referenceChapters = articles.filter(article => article.tipCount > 0);
const suggestionCount = referenceChapters.reduce((total, article) => total + article.tipCount, 0);

function Header({ path, onSearch }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const links = [['/', '首页'], ['/guides', '阅读'], ['/workbench', '对比']];
  return <header className="site-header">
    <div className="header-inner">
      <a className="brand" href="/" aria-label="人生决策指南首页"><Icon name="Compass" size={42} /><span><strong>人生决策指南</strong></span></a>
      <nav aria-label="主导航" className={menuOpen ? 'primary-nav is-open' : 'primary-nav'}>{links.map(([href, title]) => <a key={href} href={href} className={(href === '/' ? path === '/' : path.startsWith(href) || href === '/guides' && path.startsWith('/guide/')) ? 'active' : ''}>{title}</a>)}</nav>
      <div className="header-actions"><button className="search-trigger" onClick={onSearch} aria-label="全站搜索"><Icon name="Search" size={17} /><span>全站搜索</span><kbd>⌘ K</kbd></button><a className="icon-button github-link" href={repository} target="_blank" rel="noreferrer" aria-label="在 GitHub 查看源码"><Icon name="Github" size={23} /></a><button className="icon-button mobile-menu" onClick={() => setMenuOpen(!menuOpen)} aria-label={menuOpen ? '关闭导航' : '打开导航'} aria-expanded={menuOpen}><Icon name={menuOpen ? 'X' : 'Menu'} /></button></div>
    </div>
  </header>;
}

function Footer() {
  return <footer className="site-footer"><div className="footer-inner"><a className="footer-brand" href="/"><Icon name="Compass" size={18} />人生决策指南</a><div><a href="/guides">阅读指南</a><a href={repository} target="_blank" rel="noreferrer">开源共建 <Icon name="ArrowUpRight" size={13} /></a></div></div></footer>;
}

function Home() {
  return <main id="main-content" className="home container">
    <section className="apple-hero" aria-labelledby="hero-title"><h1 id="hero-title">把生活，<span>理清楚。</span></h1><p>看要点，做选择。</p><div className="hero-actions"><a className="button" href="/guides">开始阅读</a><a className="text-link" href="/workbench">比较方案 <Icon name="ChevronRight" size={18} /></a></div><a className="hero-stats" href="/guides">{referenceChapters.length} 章 · {suggestionCount} 条建议</a></section>
    <figure className="apple-landscape"><img src="/images/mountain-path.webp" alt="通向山顶的步道" width="1440" height="960" fetchPriority="high" /></figure>
    <section className="topics-section" aria-labelledby="topics-title"><div className="section-heading"><h2 id="topics-title">从一个问题开始。</h2><a className="text-link" href="/guides">全部指南 <Icon name="ChevronRight" size={17} /></a></div><div className="topics">{categories.map(category => <a className="topic" href={`/guides/${category.id}`} key={category.id}><Icon name={category.icon} size={31} /><div><h3>{category.name}</h3><p>{category.description}</p></div><Icon name="ChevronRight" className="topic-arrow" size={20} /></a>)}</div></section>
  </main>;
}

function useBookmarks() {
  const [bookmarks, setBookmarks] = useState([]);
  const [error, setError] = useState('');
  useEffect(() => { try { const saved = JSON.parse(localStorage.getItem('life-guide-bookmarks-v1') || '[]'); if (Array.isArray(saved)) setBookmarks(saved.filter(value => typeof value === 'string')); } catch { setError('浏览器暂时无法读取收藏。'); } }, []);
  function toggle(slug) {
    const next = bookmarks.includes(slug) ? bookmarks.filter(value => value !== slug) : [...bookmarks, slug];
    setBookmarks(next);
    try { localStorage.setItem('life-guide-bookmarks-v1', JSON.stringify(next)); setError(''); } catch { setError('收藏在当前页面有效，但浏览器无法保存。'); }
  }
  return { bookmarks, toggle, error };
}

function Guides({ category }) {
  const [query, setQuery] = useState('');
  const [savedOnly, setSavedOnly] = useState(false);
  const { bookmarks, error } = useBookmarks();
  const search = useDeferredValue(query.trim().toLowerCase());
  const selected = categoryById[category];
  const filtered = articles.filter(article => (!category || article.category === category) && (!savedOnly || bookmarks.includes(article.slug)) && (!search || `${article.title} ${article.excerpt} ${categoryById[article.category].name}`.toLowerCase().includes(search)));
  return <main id="main-content" className="container library"><div className="page-intro"><a className="breadcrumb" href="/">指南首页 <Icon name="ChevronRight" size={14} /></a><h1>{selected?.name || '阅读指南'}</h1><p>{selected?.description || '选主题，找到你的问题。'}</p></div><div className="library-layout"><aside className="library-sidebar" aria-label="指南主题"><a className={!category ? 'selected' : ''} href="/guides"><Icon name="BookOpen" size={18} />全部指南<span>{articles.length}</span></a>{categories.map(item => <a key={item.id} className={category === item.id ? 'selected' : ''} href={`/guides/${item.id}`}><Icon name={item.icon} size={18} />{item.name}<span>{articles.filter(article => article.category === item.id).length}</span></a>)}</aside><section className="library-content" aria-label="指南列表"><div className="library-toolbar"><label className="library-search"><Icon name="Search" size={17} /><input aria-label="筛选指南" placeholder="筛选标题或简介" value={query} onChange={event => setQuery(event.target.value)} /></label><button className={savedOnly ? 'filter-button selected' : 'filter-button'} onClick={() => setSavedOnly(!savedOnly)} aria-pressed={savedOnly}><Icon name="Bookmark" size={17} />收藏</button></div><p className="result-count" aria-live="polite">{filtered.length} 篇指南 {error && <span>{error}</span>}</p>{filtered.length ? <div className="article-list">{filtered.map(article => <a className="article-row" key={article.slug} href={articleUrl(article)}><span className="article-meta">{categoryById[article.category].name}<span>·</span>{article.tipCount > 0 ? `${article.tipCount} 条建议` : `${article.minutes} 分钟要点`}</span><h2>{article.title}</h2><p>{article.excerpt}</p></a>)}</div> : <div className="empty-state"><Icon name={savedOnly ? 'Bookmark' : 'Search'} size={30} /><h2>{savedOnly ? '这里还没有收藏的指南' : '暂时没有匹配的指南'}</h2><p>{savedOnly ? '在文章标题旁点击“收藏”。' : '换个词试试。'}</p><button className="text-link" onClick={() => { setQuery(''); setSavedOnly(false); }}>查看全部 <Icon name="ArrowRight" size={17} /></button></div>}</section></div></main>;
}

function Article({ article, html }) {
  const { bookmarks, toggle, error } = useBookmarks();
  const [content, setContent] = useState(html || '');
  const [contentError, setContentError] = useState('');
  const [progress, setProgress] = useState(0);
  const [activeSection, setActiveSection] = useState(article.toc[0]?.id);
  const category = categoryById[article.category];
  const index = articles.findIndex(item => item.slug === article.slug);
  useEffect(() => {
    if (html !== undefined) { setContent(html); return; }
    let active = true;
    fetch(`/content/${article.slug}.html`).then(response => {
      if (!response.ok) throw new Error('Cannot load article');
      return response.text();
    }).then(value => { if (active) { setContent(value); setContentError(''); } }).catch(() => { if (active) setContentError('正文加载失败，请刷新重试。'); });
    return () => { active = false; };
  }, [article.slug, html]);
  useEffect(() => {
    function update() { const available = document.documentElement.scrollHeight - window.innerHeight; setProgress(available > 0 ? Math.min(100, Math.max(0, window.scrollY / available * 100)) : 100); }
    update(); window.addEventListener('scroll', update, { passive: true }); window.addEventListener('resize', update);
    const observer = new IntersectionObserver(entries => { for (const entry of entries) if (entry.isIntersecting) setActiveSection(entry.target.id); }, { rootMargin: '-90px 0px -65% 0px' });
    document.querySelectorAll('.prose h2').forEach(heading => observer.observe(heading));
    return () => { window.removeEventListener('scroll', update); window.removeEventListener('resize', update); observer.disconnect(); };
  }, [article.slug, content]);
  useEffect(() => {
    function revealSection() {
      let id; try { id = decodeURIComponent(window.location.hash.slice(1)); } catch { return; }
      const target = id && document.getElementById(id);
      const detail = target && (target.matches('details') ? target : target.closest('details'));
      if (detail) {
        for (let ancestor = detail; ancestor; ancestor = ancestor.parentElement?.closest('details')) ancestor.open = true;
        if (target.matches('details')) target.querySelectorAll('details').forEach(item => { item.open = true; });
      }
      if (target) target.scrollIntoView({ block: 'start' });
    }
    revealSection();
    window.addEventListener('hashchange', revealSection);
    return () => window.removeEventListener('hashchange', revealSection);
  }, [article.slug, content]);
  return <><div className="reading-progress" aria-hidden="true"><span style={{ width: `${progress}%` }} /></div><main id="main-content" className="container document-layout"><aside className="document-sidebar" aria-label="指南导航"><a className="back-link" href="/guides"><Icon name="ChevronLeft" size={16} />全部指南</a>{categories.map(item => <details key={item.id} open={item.id === article.category}><summary><Icon name={item.icon} size={17} />{item.name}<Icon name="ChevronRight" size={14} /></summary>{articles.filter(guide => guide.category === item.id).map(guide => <a key={guide.slug} className={guide.slug === article.slug ? 'selected' : ''} href={articleUrl(guide)} aria-current={guide.slug === article.slug ? 'page' : undefined}>{guide.title}</a>)}</details>)}<a className="sidebar-workbench" href="/workbench"><Icon name="FileText" size={20} /><span>比较方案 <Icon name="ArrowRight" size={14} /></span></a></aside><article className="document"><div className="article-breadcrumb"><a href="/guides">阅读指南</a><Icon name="ChevronRight" size={13} /><a href={`/guides/${category.id}`}>{category.name}</a></div><h1>{article.title}</h1><div className="document-meta"><span><Icon name={article.tipCount > 0 ? 'List' : 'Clock3'} size={15} />{article.tipCount > 0 ? `${article.tipCount} 条建议` : `${article.minutes} 分钟要点`}</span><button className={bookmarks.includes(article.slug) ? 'bookmark-button saved' : 'bookmark-button'} onClick={() => toggle(article.slug)} aria-pressed={bookmarks.includes(article.slug)}><Icon name={bookmarks.includes(article.slug) ? 'Check' : 'Bookmark'} size={16} />{bookmarks.includes(article.slug) ? '已收藏' : '收藏'}</button></div>{error && <p role="status">{error}</p>}<div className="prose" dangerouslySetInnerHTML={{ __html: content }} />{contentError && <p role="alert">{contentError}</p>}<div className="article-action"><Icon name="FileText" size={27} /><div><h2>想比较几个选项？</h2></div><a className="button" href="/workbench">比较方案 <Icon name="ArrowRight" size={17} /></a></div><nav className="article-pagination" aria-label="上一篇与下一篇">{index > 0 ? <a href={articleUrl(articles[index - 1])}><span><Icon name="ChevronLeft" size={14} />上一篇</span><strong>{articles[index - 1].title}</strong></a> : <span />}{index < articles.length - 1 && <a href={articleUrl(articles[index + 1])}><span>下一篇<Icon name="ChevronRight" size={14} /></span><strong>{articles[index + 1].title}</strong></a>}</nav></article><aside className="article-toc" aria-label="本篇目录"><strong>{article.tipCount > 0 ? `本章 ${article.tipCount} 条建议` : '本篇目录'}</strong>{article.toc.slice(0, 10).map(section => <a key={section.id} href={`#${section.id}`} className={activeSection === section.id ? 'active' : ''}>{section.title}</a>)}<a className="toc-top" href="#main-content">回到顶部 ↑</a></aside></main></>;
}

function NotFound() {
  return <main id="main-content" className="container not-found"><Icon name="Compass" size={48} /><p>404</p><h1>页面不存在</h1><p>去指南里找找。</p><a className="button" href="/guides">查看指南 <Icon name="ArrowRight" size={17} /></a></main>;
}

export function pageMetadata(path) {
  const article = path.startsWith('/guide/') ? articles.find(item => item.slug === path.slice(7)) : null;
  const categoryId = path.startsWith('/guides/') ? path.slice(8) : null;
  const category = categoryById[categoryAliases[categoryId] || categoryId];
  const title = article?.title || category?.name || (path === '/workbench' ? '比较方案' : path === '/guides' ? '阅读指南' : path === '/' ? '把生活，理清楚' : '页面未找到');
  return { title: `${title} · 人生决策指南`, description: article?.excerpt || category?.description || '读一句要点，查完整依据。按主题找生活建议，也可以按自己的标准比较方案。', article };
}

export default function App({ path = '/', articleHtml }) {
  const routeCategory = path.startsWith('/guides/') && path.slice(8);
  const selectedCategory = categoryAliases[routeCategory] || routeCategory;
  const [searchOpen, setSearchOpen] = useState(false);
  useEffect(() => {
    const keydown = event => { if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); setSearchOpen(value => !value); } };
    window.addEventListener('keydown', keydown); return () => window.removeEventListener('keydown', keydown);
  }, []);
  const article = path.startsWith('/guide/') && articles.find(item => item.slug === path.slice(7));
  let page;
  if (path === '/') page = <Home />;
  else if (path === '/workbench') page = <Workbench />;
  else if (path === '/guides') page = <Guides />;
  else if (routeCategory && categoryById[selectedCategory]) page = <Guides category={selectedCategory} />;
  else if (article) page = <Article article={article} html={articleHtml} />;
  else page = <NotFound />;
  return <><a className="skip-link" href="#main-content">跳到正文</a><Header path={path} onSearch={() => setSearchOpen(true)} />{page}<Footer /><SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} /></>;
}
