import { createRoot, hydrateRoot } from 'react-dom/client';
import App, { pageMetadata } from './App.jsx';
import './styles.css';
import './search.css';

const path = window.location.pathname.replace(/\.html$/, '').replace(/\/$/, '') || '/';
const root = document.getElementById('root');
const articleHtml = root.dataset.pagePath === path ? root.querySelector('.prose')?.innerHTML : undefined;
const metadata = pageMetadata(path);
document.title = metadata.title;
document.querySelector('meta[name="description"]').content = metadata.description;
if (root.hasChildNodes() && root.dataset.pagePath === path) hydrateRoot(root, <App path={path} articleHtml={articleHtml} />);
else createRoot(root).render(<App path={path} articleHtml={articleHtml} />);
