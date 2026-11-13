import { Routes, Route, useLocation } from 'react-router-dom';
import { useEffect, lazy, Suspense } from 'react';
import Header from './components/Header.jsx';
import Footer from './components/Footer.jsx';
import Home from './pages/Home.jsx';
import News from './pages/News.jsx';
import Article from './pages/Article.jsx';
import Legal from './pages/Legal.jsx';
import NotFound from './pages/NotFound.jsx';

// Chargés à la demande : la carte et l'admin ne pèsent pas sur l'accueil
const Admin = lazy(() => import('./pages/Admin.jsx'));
const VolRando = lazy(() => import('./pages/VolRando.jsx'));

function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      const el = document.getElementById(hash.slice(1));
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
        return;
      }
    }
    window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
}

export default function App() {
  const { pathname } = useLocation();
  const isAdmin = pathname.startsWith('/admin');

  return (
    <>
      <ScrollToTop />
      <a className="skip-link" href="#main">Aller au contenu</a>
      {!isAdmin && <Header />}
      <main id="main">
        <Suspense fallback={<p className="container page-top">Chargement…</p>}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/actualites" element={<News />} />
            <Route path="/actualites/:id" element={<Article />} />
            <Route path="/vol-rando" element={<VolRando />} />
            <Route path="/mentions-legales" element={<Legal />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>
      {!isAdmin && <Footer />}
    </>
  );
}
