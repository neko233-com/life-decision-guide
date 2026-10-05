import { createRoot, hydrateRoot } from 'react-dom/client';
import App, { pageMetadata } from './App.jsx';
import './styles.css';

const path = window.location.pathname.replace(/\.html$/, '').replace(/\/$/, '') || '/';
const root = document.getElementById('root');
const metadata = pageMetadata(path);
document.title = metadata.title;
document.querySelector('meta[name="description"]').content = metadata.description;
if (root.hasChildNodes() && root.dataset.pagePath === path) hydrateRoot(root, <App path={path} />);
else createRoot(root).render(<App path={path} />);
