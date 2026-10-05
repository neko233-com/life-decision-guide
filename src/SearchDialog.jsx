import { useEffect, useMemo, useRef, useState } from 'react';
import Icon from './Icons.jsx';
import { createSearchIndex, highlightSegments, queryTerms, resultSnippet, searchIndex } from './search.js';

const batchSize = 40;
let indexPromise;

function loadSearchIndex() {
  if (!indexPromise) {
    indexPromise = fetch('/search-index.json').then(response => {
      if (!response.ok) throw new Error('Search index unavailable');
      return response.json();
    }).then(data => {
      if (!Array.isArray(data.articles) || !Array.isArray(data.categories) || !Array.isArray(data.tips)) throw new Error('Invalid search index');
      return createSearchIndex(data.articles, data.categories, data.tips);
    }).catch(error => {
      indexPromise = undefined;
      throw error;
    });
  }
  return indexPromise;
}

function Highlight({ text, terms }) {
  return highlightSegments(text, terms).map((part, position) => part.match ? <mark key={position}>{part.text}</mark> : part.text);
}

export default function SearchDialog({ open, onClose }) {
  const dialogRef = useRef(null);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const [limit, setLimit] = useState(batchSize);
  const [index, setIndex] = useState([]);
  const [loadState, setLoadState] = useState('idle');
  const [retry, setRetry] = useState(0);
  const results = useMemo(() => searchIndex(index, query), [index, query]);
  const visibleResults = results.slice(0, limit);
  const terms = useMemo(() => queryTerms(query), [query]);
  const activeResult = visibleResults[active];
  const counts = { entrance: 0, chapter: 0, article: 0, tip: 0, group: 0, supplement: 0 };
  for (const result of results) counts[result.kind === 'page' || result.kind === 'topic' ? 'entrance' : result.kind] += 1;
  const countSummary = [['入口', counts.entrance], ['章节', counts.chapter], ['指南', counts.article], ['分组', counts.group], ['建议', counts.tip], ['补充', counts.supplement]].filter(([, count]) => count).map(([label, count]) => `${label} ${count}`).join(' · ');

  useEffect(() => {
    const dialog = dialogRef.current;
    if (open && !dialog.open) dialog.showModal();
    else if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    let mounted = true;
    setLoadState(current => current === 'ready' ? current : 'loading');
    loadSearchIndex().then(loadedIndex => {
      if (mounted) { setIndex(loadedIndex); setLoadState('ready'); }
    }).catch(() => {
      if (mounted) setLoadState('error');
    });
    // The shared request may finish and cache its result after this dialog closes.
    return () => { mounted = false; };
  }, [open, retry]);

  useEffect(() => {
    if (open) dialogRef.current.querySelector(`[data-result-index="${active}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [active, open, results]);

  function move(event) {
    if (event.isComposing || event.nativeEvent?.isComposing) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
    } else if ((event.key === 'ArrowDown' || event.key === 'ArrowUp') && visibleResults.length) {
      event.preventDefault();
      setActive(current => (current + (event.key === 'ArrowDown' ? 1 : -1) + visibleResults.length) % visibleResults.length);
    } else if (event.key === 'Enter' && activeResult) {
      event.preventDefault();
      window.location.assign(activeResult.href);
    }
  }

  function showMore() {
    setActive(visibleResults.length);
    setLimit(current => current + batchSize);
    dialogRef.current.querySelector('input').focus();
  }

  return <dialog ref={dialogRef} className="gsearch-dialog" aria-labelledby="gsearch-title" onCancel={onClose} onClose={onClose} onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
    <div className="gsearch-heading"><h2 id="gsearch-title">全站搜索</h2><button className="icon-button" aria-label="关闭搜索" onClick={onClose}><Icon name="X" size={20} /></button></div>
    <label className="gsearch-field"><Icon name="Search" size={21} /><input autoFocus type="search" name="site-search" autoComplete="off" value={query} onChange={event => { setQuery(event.target.value); setActive(0); setLimit(batchSize); }} onKeyDown={move} placeholder="搜索建议、问题或工具…" aria-label="全站搜索关键词" aria-controls="gsearch-results" aria-activedescendant={activeResult ? `gsearch-result-${active}` : undefined} role="combobox" aria-autocomplete="list" aria-expanded={open} /></label>
    <div className="gsearch-summary" aria-live="polite">{loadState === 'ready' ? terms.length ? <><span>{results.length} 个结果</span>{results.length > 0 && <span>{countSummary}</span>}</> : <><span>常用入口</span><span>推荐阅读</span></> : <span>{loadState === 'error' ? '搜索暂时不可用' : '加载搜索中…'}</span>}</div>
    <ul className="gsearch-results" id="gsearch-results" role="listbox" aria-label="搜索结果" aria-busy={loadState === 'loading'}>{visibleResults.map((result, position) => <li key={result.id} role="presentation"><a id={`gsearch-result-${position}`} data-result-index={position} role="option" aria-selected={active === position} className={active === position ? 'gsearch-result is-active' : 'gsearch-result'} href={result.href} onMouseEnter={() => setActive(position)} onFocus={() => setActive(position)}>
      <Icon name={result.icon} size={19} /><div><div className="gsearch-result-heading"><strong><Highlight text={result.title.length > 60 ? `${result.title.slice(0, 60)}…` : result.title} terms={terms} /></strong><span>{result.matchLabel || result.label}</span></div><p><Highlight text={resultSnippet(result, terms)} terms={terms} /></p>{(result.chapterTitle || result.category) && <small><Highlight text={result.chapterTitle || result.category} terms={terms} /></small>}</div><Icon name="ArrowRight" size={16} />
    </a></li>)}</ul>
    {loadState === 'error' && <div className="gsearch-empty"><button className="text-link" onClick={() => { setLoadState('loading'); setRetry(current => current + 1); }}>重试</button></div>}
    {loadState === 'ready' && !results.length && <div className="gsearch-empty"><Icon name="Search" size={25} /><h3>没有找到结果</h3><p>换个短词试试，如“工作”“边界”。</p></div>}
    <div className="gsearch-footer">{loadState === 'ready' && (visibleResults.length < results.length ? <button className="text-link" onClick={showMore}>再看 {Math.min(batchSize, results.length - visibleResults.length)} 条</button> : <span>↑ ↓ 选择 · Enter 打开</span>)}<span>Esc 关闭</span></div>
  </dialog>;
}
