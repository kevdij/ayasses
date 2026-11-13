import { Link, useParams } from 'react-router-dom';
import { useData, formatDate } from '../store/DataContext.jsx';
import NotFound from './NotFound.jsx';

export default function Article() {
  const { id } = useParams();
  const { data } = useData();
  const article = data.news.find((n) => n.id === id);
  if (!article) return <NotFound />;

  return (
    <article className="section page-top">
      <div className="container narrow">
        <Link to="/actualites" className="text-link">← Toutes les actualités</Link>
        <span className="tag">{article.category}</span>
        <h1 className="page-title">{article.title}</h1>
        <p className="article-date">Publié le <time dateTime={article.date}>{formatDate(article.date)}</time></p>
        <div className="prose">
          {article.body.split(/\n{2,}/).map((p, i) => <p key={i}>{p}</p>)}
        </div>
      </div>
    </article>
  );
}
