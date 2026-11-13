// Affiche un texte simple : paragraphes séparés par une ligne vide,
// liens au format [texte](https://…) ou adresses https://… brutes.
// Aucun HTML n'est interprété : pas de risque d'injection.

const TOKEN = /\[([^\]]+)\]\(((?:https?:|mailto:)[^)\s]+)\)|((?:https?:\/\/)[^\s)]+)/g;

function safeHref(href) {
  return /^(https?:|mailto:)/i.test(href) ? href : null;
}

function Inline({ text }) {
  const out = [];
  let last = 0;
  let m;
  TOKEN.lastIndex = 0;
  while ((m = TOKEN.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const href = safeHref(m[2] || m[3]);
    const label = m[1] || m[3];
    out.push(
      href ? (
        <a key={m.index} href={href} target={href.startsWith('mailto:') ? undefined : '_blank'} rel="noreferrer">
          {label}
        </a>
      ) : label
    );
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export default function RichText({ text = '' }) {
  return text.split(/\n{2,}/).map((para, i) => (
    <p key={i}>
      {para.split('\n').map((line, j, arr) => (
        <span key={j}>
          <Inline text={line} />
          {j < arr.length - 1 && <br />}
        </span>
      ))}
    </p>
  ));
}

/** Version texte brut (pour les résumés). */
export const plain = (text = '') => text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
