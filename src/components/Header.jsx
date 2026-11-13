import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useData } from '../store/DataContext.jsx';
import Logo from './Logo.jsx';

const links = [
  { to: '/#club', label: 'Le club' },
  { to: '/#agenda', label: 'Agenda' },
  { to: '/actualites', label: 'Actualités' },
  { to: '/#structures', label: 'Autour de nous' },
  { to: '/#contact', label: 'Contact' },
];

export default function Header() {
  const { data } = useData();
  const [open, setOpen] = useState(false);

  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link to="/" className="brand" onClick={() => setOpen(false)}>
          <Logo />
          <span>
            <strong>{data.club.name}</strong>
            <small>{data.club.tagline}</small>
          </span>
        </Link>

        <button
          className="menu-toggle"
          aria-expanded={open}
          aria-controls="main-nav"
          onClick={() => setOpen((o) => !o)}
        >
          <span className="sr-only">Menu</span>
          <span aria-hidden="true">{open ? '✕' : '☰'}</span>
        </button>

        <nav id="main-nav" className={`main-nav ${open ? 'is-open' : ''}`}>
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} onClick={() => setOpen(false)}>
              {l.label}
            </NavLink>
          ))}
          <Link to="/#adhesion" className="btn btn-small" onClick={() => setOpen(false)}>
            Nous rejoindre
          </Link>
        </nav>
      </div>
    </header>
  );
}
