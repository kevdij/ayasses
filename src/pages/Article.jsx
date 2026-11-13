import { Link, useParams } from 'react-router-dom';
import { useData, formatDate, toList } from '../store/DataContext.jsx';
import RichText from '../components/RichText.jsx';
import NotFound from './NotFound.jsx';

export default function Article() {
  const { id } = useParams();
  const { data, status } = useData();
  const article = data.news.find((n) => n.id === id);
  if (!article) return status.loading ? null : <NotFound />;
  const images = toList(article.images, /[\n,]+/);

  return (
    <article className="section page-top">
      <div className="container narrow">
        <Link to="/actualites" className="text-link">← Toutes les actualités</Link>
        <span className="tag">{article.category}</span>
        <h1 className="page-title">{article.title}</h1>
        <p className="article-date">Publié le <time dateTime={article.date}>{formatDate(article.date)}</time></p>
        <div className="prose">
          <RichText text={article.body} />
        </div>
        {images.length > 0 && (
          <div className={`article-images ${images.length === 1 ? 'is-single' : ''}`}>
            {images.map((src) => (
              <a key={src} href={src} target="_blank" rel="noreferrer">
                <img src={src} alt={`Illustration : ${article.title}`} loading="lazy" />
              </a>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}
