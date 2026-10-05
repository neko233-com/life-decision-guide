import { useEffect, useState } from 'react';
import { readStored, writeStored } from './storage.js';

const key = 'life-guide-bookmarks-v1';
const storage = {
  getItem: name => window.localStorage.getItem(name),
  setItem: (name, value) => window.localStorage.setItem(name, value),
};
const valid = value => Array.isArray(value) && value.every(slug => typeof slug === 'string');
const message = state => state === 'ready' ? '' : state === 'invalid'
  ? '原收藏记录无法读取，已保留；当前操作仅在本页有效。'
  : state === 'conflict' ? '另一页面刚更新了收藏。当前操作仅在本页有效，请刷新后重试。'
  : '浏览器暂时无法保存收藏，当前操作仅在本页有效。';

export default function useBookmarks() {
  const [bookmarks, setBookmarks] = useState([]);
  const [error, setError] = useState('');
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    function restore() {
      const saved = readStored(storage, key, valid);
      if (saved.state === 'ready') setBookmarks(saved.value || []);
      setError(message(saved.state));
      setLoaded(true);
    }
    restore();
    function changed(event) { if (event.key === key || event.key === null) restore(); }
    window.addEventListener('storage', changed);
    return () => window.removeEventListener('storage', changed);
  }, []);
  function toggle(slug) {
    const add = !bookmarks.includes(slug);
    const saved = readStored(storage, key, valid);
    const previous = saved.state === 'ready' ? saved.value || [] : bookmarks;
    const next = add ? previous.includes(slug) ? previous : [...previous, slug] : previous.filter(value => value !== slug);
    setBookmarks(next);
    const result = saved.state === 'ready' ? writeStored(storage, key, next, saved.raw) : saved;
    setError(message(result.state));
  }
  return { bookmarks, toggle, error, loaded };
}
