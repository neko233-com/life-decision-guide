import { useDeferredValue, useEffect, useRef, useState } from 'react';
import articles from './generated/content.json';
import { categories, steps } from './data.js';
import Icon from './Icons.jsx';
import Workbench from './Workbench.jsx';

export const repository = 'https://github.com/neko233-com/life-decision-guide';
export const articleUrl = article => `/guide/${article.slug}`;
const categoryById = Object.fromEntries(categories.map(category => [category.id, category]));

function Header({ path, onSearch }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const links = [['/', '指南首页'], ['/guides', '阅读指南'], ['/workbench', '决策工作台']];
  return <header className="site-header">
    <div className="header-inner">
      <a className="brand" href="/" aria-label="人生决策指南首页"><Icon name="Compass" size={42} /><span><strong>人生决策指南</strong><small>更清醒的选择，更丰盛的人生</small></span></a>
      <nav aria-label="主导航" className={menuOpen ? 'primary-nav is-open' : 'primary-nav'}>{links.map(([href, title]) => <a key={href} href={href} className={(href === '/' ? path === '/' : path.startsWith(href) || href === '/guides' && path.startsWith('/guide/')) ? 'active' : ''}>{title}</a>)}</nav>
      <div className="header-actions"><button className="search-trigger" onClick={onSearch} aria-label="搜索指南"><Icon name="Search" size={17} /><span>搜索指南、主题或问题</span><kbd>⌘ K</kbd></button><a className="icon-button github-link" href={repository} target="_blank" rel="noreferrer" aria-label="在 GitHub 查看源码"><Icon name="Github" size={23} /></a><button className="icon-button mobile-menu" onClick={() => setMenuOpen(!menuOpen)} aria-label={menuOpen ? '关闭导航' : '打开导航'} aria-expanded={menuOpen}><Icon name={menuOpen ? 'X' : 'Menu'} /></button></div>
    </div>
  </header>;
}

function Footer() {
  return <footer className="site-footer"><div className="footer-inner"><a className="footer-brand" href="/"><Icon name="Compass" size={18} />人生决策指南</a><p>每一个方向，都从一步开始。</p><div><a href="/guides">阅读指南</a><a href={repository} target="_blank" rel="noreferrer">开源共建 <Icon name="ArrowUpRight" size={13} /></a></div></div></footer>;
}

function SearchDialog({ open, onClose }) {
  const ref = useRef(null);
  const [query, setQuery] = useState('');
  const search = useDeferredValue(query.trim().toLocaleLowerCase());
  useEffect(() => { if (open && !ref.current.open) ref.current.showModal(); else if (!open && ref.current.open) ref.current.close(); }, [open]);
  const terms = search.split(/\s+/).filter(Boolean);
  const results = (search ? articles.filter(article => terms.every(term => `${article.title} ${article.text} ${categoryById[article.category].name}`.toLocaleLowerCase().includes(term))) : articles.slice(0, 5));
  return <dialog ref={ref} className="search-dialog" onCancel={onClose} onClose={onClose} onClick={event => { if (event.target === event.currentTarget) onClose(); }} aria-labelledby="search-title">
    <div className="search-dialog-inner"><div className="dialog-heading"><h2 id="search-title">找到你的下一步</h2><button className="icon-button" onClick={onClose} aria-label="关闭搜索"><Icon name="X" /></button></div><label className="search-field"><Icon name="Search" /><input autoFocus value={query} onChange={event => setQuery(event.target.value)} placeholder="搜索指南、主题或你关心的问题…" aria-label="搜索关键词" /></label><div className="search-summary" aria-live="polite">{search ? `找到 ${results.length} 篇指南` : '可以从这些指南开始'}</div><div className="search-results">{results.length ? results.map(article => <a key={article.slug} href={articleUrl(article)}><span className="result-category">{categoryById[article.category].name}</span><strong>{article.title}</strong><p>{article.excerpt}</p><Icon name="ArrowRight" size={18} /></a>) : <div className="empty-state"><Icon name="Search" size={28} /><h3>还没有找到相关指南</h3><p>试试更短的词，例如“工作”“边界”或“学习”。</p></div>}</div><p className="dialog-footnote">按 Esc 关闭 · Tab 切换 · Enter 打开选中的指南</p></div>
  </dialog>;
}

function Home() {
  const featured = articles[0];
  return <main id="main-content" className="home container">
    <section className="hero" aria-labelledby="hero-title"><div className="hero-copy"><h1 id="hero-title">人生没有标准答案，<br />但可以有更好的<br /><span>决策方法。</span></h1><p>把复杂的选择，拆成清晰的下一步。</p><div className="hero-actions"><a className="button" href={articleUrl(featured)}>开始阅读 <Icon name="ArrowRight" size={18} /></a><a className="text-link" href="/workbench">写下你的选择 <Icon name="ArrowRight" size={18} /></a></div></div><figure className="hero-image"><img src="/images/mountain-path.webp" alt="一条穿过青绿山脊、延伸向远方薄雾的小径" width="1440" height="960" fetchPriority="high" /><figcaption>每一个方向，都从一步开始。</figcaption></figure></section>
    <section className="topics-section" aria-labelledby="topics-title"><div className="section-heading"><h2 id="topics-title">从你正在面对的选择开始</h2><a className="text-link" href="/guides">全部指南 <Icon name="ArrowRight" size={17} /></a></div><div className="topics">{categories.map((category, index) => <a className="topic" href={`/guides/${category.id}`} key={category.id}><Icon name={category.icon} size={31} /><div><span className="topic-number">0{index + 1}</span><h3>{category.name}</h3><p>{category.description}</p></div><Icon name="ArrowRight" className="topic-arrow" size={20} /></a>)}</div></section>
    <section className="home-bottom"><div className="recommended"><h2>一次只做一个清晰的决定</h2><p className="section-description">从真实的问题出发，找到属于你的下一步。</p><span className="small-label">推荐阅读</span><a className="featured-article" href={articleUrl(featured)}><img src="/images/mountain-path.webp" alt="山间的路径" width="156" height="105" loading="lazy" /><div><h3>{featured.title}</h3><p>{featured.excerpt}</p><span className="article-meta">思考方法 <span>·</span> {featured.minutes} 分钟阅读</span></div><Icon name="ArrowRight" size={18} /></a></div><div className="method"><h2>一个实用的决策方法</h2><p>不必一次想清楚所有答案，先按这四步，走出更清晰的路径。</p><ol>{steps.map((step, index) => <li key={step.title}><div className="step-icon"><Icon name={step.icon} size={23} /></div><h3>{index + 1}. {step.title}</h3><p>{step.text}</p>{index < 3 && <Icon className="step-arrow" name="ArrowRight" size={16} />}</li>)}</ol><a className="text-link" href="/workbench">在工作台试一试 <Icon name="ArrowRight" size={16} /></a></div></section>
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
  const filtered = articles.filter(article => (!category || article.category === category) && (!savedOnly || bookmarks.includes(article.slug)) && (!search || `${article.title} ${article.text}`.toLowerCase().includes(search)));
  return <main id="main-content" className="container library"><div className="page-intro"><a className="breadcrumb" href="/">指南首页 <Icon name="ChevronRight" size={14} /></a><h1>{selected?.name || '阅读指南'}</h1><p>{selected?.description || '不急着找到所有答案，先从一个与你有关的问题开始。'}</p></div><div className="library-layout"><aside className="library-sidebar" aria-label="指南主题"><a className={!category ? 'selected' : ''} href="/guides"><Icon name="BookOpen" size={18} />全部指南<span>{articles.length}</span></a>{categories.map(item => <a key={item.id} className={category === item.id ? 'selected' : ''} href={`/guides/${item.id}`}><Icon name={item.icon} size={18} />{item.name}<span>{articles.filter(article => article.category === item.id).length}</span></a>)}<div className="sidebar-note"><Icon name="Compass" size={23} /><p>你可以慢慢读，<br />也可以带着一个问题来。</p></div></aside><section className="library-content" aria-label="指南列表"><div className="library-toolbar"><label className="library-search"><Icon name="Search" size={17} /><input aria-label="筛选指南" placeholder="在这些指南中搜索…" value={query} onChange={event => setQuery(event.target.value)} /></label><button className={savedOnly ? 'filter-button selected' : 'filter-button'} onClick={() => setSavedOnly(!savedOnly)} aria-pressed={savedOnly}><Icon name="Bookmark" size={17} />我的收藏</button></div><p className="result-count" aria-live="polite">{filtered.length} 篇指南 {error && <span>{error}</span>}</p>{filtered.length ? <div className="article-list">{filtered.map(article => <a className="article-row" key={article.slug} href={articleUrl(article)}><span className="article-meta">{categoryById[article.category].name}<span>·</span>{article.minutes} 分钟阅读</span><h2>{article.title}</h2><p>{article.excerpt}</p><span className="read-link">阅读这篇指南 <Icon name="ArrowRight" size={17} /></span></a>)}</div> : <div className="empty-state"><Icon name={savedOnly ? 'Bookmark' : 'Search'} size={30} /><h2>{savedOnly ? '这里还没有收藏的指南' : '暂时没有匹配的指南'}</h2><p>{savedOnly ? '阅读时点击标题旁的“收藏”，就能在这里找到它。' : '试着换一个关键词，或查看其他主题。'}</p><button className="text-link" onClick={() => { setQuery(''); setSavedOnly(false); }}>查看全部 <Icon name="ArrowRight" size={17} /></button></div>}</section></div></main>;
}

function Article({ article }) {
  const { bookmarks, toggle, error } = useBookmarks();
  const [progress, setProgress] = useState(0);
  const [activeSection, setActiveSection] = useState(article.toc[0]?.id);
  const category = categoryById[article.category];
  const index = articles.findIndex(item => item.slug === article.slug);
  useEffect(() => {
    function update() { const available = document.documentElement.scrollHeight - window.innerHeight; setProgress(available > 0 ? Math.min(100, Math.max(0, window.scrollY / available * 100)) : 100); }
    update(); window.addEventListener('scroll', update, { passive: true }); window.addEventListener('resize', update);
    const observer = new IntersectionObserver(entries => { for (const entry of entries) if (entry.isIntersecting) setActiveSection(entry.target.id); }, { rootMargin: '-90px 0px -65% 0px' });
    document.querySelectorAll('.prose h2').forEach(heading => observer.observe(heading));
    return () => { window.removeEventListener('scroll', update); window.removeEventListener('resize', update); observer.disconnect(); };
  }, [article.slug]);
  return <><div className="reading-progress" aria-hidden="true"><span style={{ width: `${progress}%` }} /></div><main id="main-content" className="container document-layout"><aside className="document-sidebar" aria-label="指南导航"><a className="back-link" href="/guides"><Icon name="ChevronLeft" size={16} />全部指南</a>{categories.map(item => <details key={item.id} open={item.id === article.category}><summary><Icon name={item.icon} size={17} />{item.name}<Icon name="ChevronRight" size={14} /></summary>{articles.filter(guide => guide.category === item.id).map(guide => <a key={guide.slug} className={guide.slug === article.slug ? 'selected' : ''} href={articleUrl(guide)} aria-current={guide.slug === article.slug ? 'page' : undefined}>{guide.title}</a>)}</details>)}<a className="sidebar-workbench" href="/workbench"><Icon name="FileText" size={20} /><strong>把思考写下来</strong><span>打开决策工作台 <Icon name="ArrowRight" size={14} /></span></a></aside><article className="document"><div className="article-breadcrumb"><a href="/guides">阅读指南</a><Icon name="ChevronRight" size={13} /><a href={`/guides/${category.id}`}>{category.name}</a></div><h1>{article.title}</h1><div className="document-meta"><span><Icon name="Clock3" size={15} />{article.minutes} 分钟阅读</span><span>原创指南</span><button className={bookmarks.includes(article.slug) ? 'bookmark-button saved' : 'bookmark-button'} onClick={() => toggle(article.slug)} aria-pressed={bookmarks.includes(article.slug)}><Icon name={bookmarks.includes(article.slug) ? 'Check' : 'Bookmark'} size={16} />{bookmarks.includes(article.slug) ? '已收藏' : '收藏'}</button></div>{error && <p role="status">{error}</p>}<div className="prose" dangerouslySetInnerHTML={{ __html: article.html }} /><div className="article-action"><Icon name="FileText" size={27} /><div><h2>让这次阅读，变成一个行动</h2><p>在工作台里写下你的问题和下一步。</p></div><a className="button" href="/workbench">开始记录 <Icon name="ArrowRight" size={17} /></a></div><nav className="article-pagination" aria-label="上一篇与下一篇">{index > 0 ? <a href={articleUrl(articles[index - 1])}><span><Icon name="ChevronLeft" size={14} />上一篇</span><strong>{articles[index - 1].title}</strong></a> : <span />}{index < articles.length - 1 && <a href={articleUrl(articles[index + 1])}><span>下一篇<Icon name="ChevronRight" size={14} /></span><strong>{articles[index + 1].title}</strong></a>}</nav></article><aside className="article-toc" aria-label="本篇目录"><strong>本篇目录</strong>{article.toc.map(section => <a key={section.id} href={`#${section.id}`} className={activeSection === section.id ? 'active' : ''}>{section.title}</a>)}<a className="toc-top" href="#main-content">回到顶部 ↑</a></aside></main></>;
}

function NotFound() {
  return <main id="main-content" className="container not-found"><Icon name="Compass" size={48} /><p>404</p><h1>这条路还没有走通</h1><p>你访问的页面不存在，可以从指南目录重新出发。</p><a className="button" href="/guides">查看指南 <Icon name="ArrowRight" size={17} /></a></main>;
}

export function pageMetadata(path) {
  const article = path.startsWith('/guide/') ? articles.find(item => item.slug === path.slice(7)) : null;
  const category = path.startsWith('/guides/') ? categoryById[path.slice(8)] : null;
  const title = article?.title || category?.name || (path === '/workbench' ? '决策工作台' : path === '/guides' ? '阅读指南' : path === '/' ? '更清醒的选择，更丰盛的人生' : '页面未找到');
  return { title: `${title} · 人生决策指南`, description: article?.excerpt || category?.description || '把复杂的选择，拆成清晰的下一步。阅读指南，记录思考，小步验证。', article };
}

export default function App({ path = '/' }) {
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
  else if (path.startsWith('/guides/') && categoryById[path.slice(8)]) page = <Guides category={path.slice(8)} />;
  else if (article) page = <Article article={article} />;
  else page = <NotFound />;
  return <><a className="skip-link" href="#main-content">跳到正文</a><Header path={path} onSearch={() => setSearchOpen(true)} />{page}<Footer /><SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} /></>;
}
