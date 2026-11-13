// Outils partagés de la page Vol rando : légendes, fiche d'un décollage, partage.
import { toList } from '../store/DataContext.jsx';

export const DIRS = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'];

export const NIVEAUX = {
  Vert: {
    color: '#2f9e44',
    text: 'Ça passe face ou dos voile, et il y a de la place.',
    long: 'Décollage accessible : on peut gonfler face ou dos voile et la place ne manque pas. Il reste un décollage de montagne, sans moniteur ni manche à air.',
  },
  Bleu: {
    color: '#1d6fb8',
    text: 'Maîtrise du face et du dos voile obligatoire, déco plus exigu et parfois plus raide.',
    long: 'Il faut maîtriser le gonflage face voile et dos voile. Le décollage est plus étroit, parfois plus raide : peu de place pour étaler et peu de marge pour un deuxième essai.',
  },
  Marron: {
    color: '#8a5a33',
    text: 'Déco très petit et/ou très raide : maîtrise sans faille de sa voile.',
    long: 'Décollage très petit et/ou très raide. Il demande une maîtrise sans faille de sa voile au sol, et de savoir renoncer si les conditions ne sont pas parfaites.',
  },
};

export const EXPOS = {
  E1: {
    text: 'Pas de risque particulier par rapport à un déco école.',
    long: 'Engagement faible : un décollage raté n’a pas plus de conséquences que sur un déco école.',
  },
  E2: {
    text: 'Risque de blessure en cas de raté (pente, obstacles).',
    long: 'Engagement moyen : en cas de raté, la pente ou les obstacles (rochers, arbres, barre) peuvent blesser. On ne part que si le gonflage est propre.',
  },
  E3: {
    text: 'Risque de blessure grave, voire de chute mortelle en cas d’échec.',
    long: 'Engagement fort : un échec peut entraîner une blessure grave, voire une chute mortelle. Aucun droit à l’erreur.',
  },
};

const TERRAINS = {
  Herbe: 'Sol en herbe : étalage confortable, mais glissant quand il est mouillé ou gelé.',
  Cailloux: 'Sol caillouteux : attention aux suspentes qui accrochent et au tissu qui s’abîme. Étalez soigneusement et vérifiez qu’aucune suspente n’est prise.',
  Mixte: 'Sol mixte herbe et cailloux : repérez la zone la plus propre pour étaler et dégagez les pierres qui gênent.',
};

const DIR_LABEL = { N: 'nord', NE: 'nord-est', E: 'est', SE: 'sud-est', S: 'sud', SO: 'sud-ouest', O: 'ouest', NO: 'nord-ouest' };

export const norm = (p) => ({
  ...p,
  orientation: toList(p.orientation).map((d) => d.toUpperCase().replace('W', 'O')),
  altitude: p.altitude === '' || p.altitude == null ? null : Number(p.altitude),
  lat: Number(p.lat),
  lng: Number(p.lng),
});

/** "Pic de l'Aiglière" → "pic-de-l-aigliere" */
export const slugify = (s) =>
  String(s || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

/** Ajoute à chaque point une adresse stable (nom du sommet, massif en cas d'homonyme). */
export function withSlugs(points) {
  const count = {};
  points.forEach((p) => { const s = slugify(p.sommet); count[s] = (count[s] || 0) + 1; });
  return points.map((p) => {
    const s = slugify(p.sommet);
    return { ...p, slug: count[s] > 1 ? `${s}-${slugify(p.massif)}` : s };
  });
}

export const pointPath = (p) => `/vol-rando/${p.slug}`;
export const fmtAlt = (a) => (a ? `${a.toLocaleString('fr-FR')} m` : 'altitude inconnue');
export const dirsLabel = (dirs) => dirs.map((d) => DIR_LABEL[d] || d).join(', ');

/** Repères tirés des infos du décollage. Chaque élément : { icon, title, text }. */
export function thingsToKnow(p) {
  const tips = [];
  const txt = `${p.remarque} ${p.atterrissage}`.toLowerCase();

  if (/parc/.test(txt)) {
    const period = p.remarque.match(/du\s+1er\s+\w+\s+au\s+\d+\s+\w+/i);
    tips.push({
      icon: '🦅',
      title: 'Parc national des Écrins',
      text: `Décollage en cœur de parc${period ? `, autorisé uniquement ${period[0]}` : ', soumis à sa réglementation'}. Hors de cette période, on n’y décolle pas. Pas de survol bas de la faune, surtout des rapaces.`,
    });
  }
  if (/pas test/.test(txt)) {
    tips.push({ icon: '🧪', title: 'Pas encore testé', text: 'Ce décollage n’a pas été validé en vol. Allez-y en repérage, prêt à redescendre à pied.' });
  }

  const o = p.orientation;
  if (o.length) {
    const morning = o.some((d) => ['E', 'NE', 'SE'].includes(d));
    const evening = o.some((d) => ['O', 'SO', 'NO'].includes(d));
    const north = o.length && o.every((d) => ['N', 'NE', 'NO'].includes(d));
    let when = 'en milieu de journée';
    if (morning && evening) when = 'à différents moments de la journée selon la face choisie';
    else if (morning) when = 'plutôt le matin, quand le soleil chauffe la pente';
    else if (evening) when = 'plutôt l’après-midi et en fin de journée';
    tips.push({
      icon: '🧭',
      title: `Orienté ${dirsLabel(o)}`,
      text: north
        ? 'Face peu ensoleillée : la brise y monte peu et peut être nulle ou de dos. Visez une journée de vent météo faible dans l’axe.'
        : `La brise de pente s’y établit ${when}. Vérifiez la météo : le vent météo ne doit pas être de dos ni trop fort.`,
    });
  }

  if (p.altitude >= 2000) {
    tips.push({
      icon: '🏔️',
      title: 'Haute montagne',
      text: `À ${fmtAlt(p.altitude)}, le vent est souvent plus fort qu’en vallée et la neige peut rester tard au printemps. Partez tôt, emportez de quoi vous couvrir, et évitez les après-midi orageux.`,
    });
  }

  if (TERRAINS[p.type]) tips.push({ icon: '🪨', title: `Terrain : ${p.type.toLowerCase()}`, text: TERRAINS[p.type] });
  if (/raide/.test(txt) && p.niveau !== 'Marron') {
    tips.push({ icon: '📐', title: 'Pente raide', text: 'Gonflage court et engagé : soyez prêt avant de lever la voile.' });
  }

  tips.push({
    icon: '🌾',
    title: 'Atterrissage',
    text: `${p.atterrissage ? `${p.atterrissage}. ` : 'Pas d’atterrissage indiqué : repérez-le avant de monter. '}${/fauch/.test(txt) ? 'Les champs ne sont utilisables que fauchés : sinon, prenez la solution de secours. ' : ''}Posez-vous loin des troupeaux et des cultures, et restez discret.`,
  });

  tips.push({
    icon: '⚠️',
    title: 'Ni officiel, ni conventionné',
    text: 'Vous volez sous votre entière responsabilité, sans accord du propriétaire ni de la mairie. Pas d’itinéraire de montée : à chacun de faire sa trace.',
  });

  return tips;
}

/** Texte prêt à envoyer (WhatsApp, SMS, e-mail…). */
export function shareText(p, url) {
  const lines = [
    `🪂 ${p.sommet} (${fmtAlt(p.altitude)}) · ${p.massif}`,
    `🧭 Orientation : ${p.orientation.join(', ') || '?'}`,
    `🎯 Niveau ${p.niveau} : ${NIVEAUX[p.niveau]?.text || ''}`,
    `⚠️ Engagement ${p.expo} : ${EXPOS[p.expo]?.text || ''}`,
    p.type && `🪨 Terrain : ${p.type}`,
    p.atterrissage && `🌾 Atterro : ${p.atterrissage}`,
    p.remarque && `ℹ️ ${p.remarque}`,
    `📍 ${p.lat.toFixed(5)}, ${p.lng.toFixed(5)} : https://www.google.com/maps?q=${p.lat},${p.lng}`,
    url && `👉 Fiche complète : ${url}`,
  ];
  return lines.filter(Boolean).join('\n');
}

/**
 * Partage natif (téléphone) ou copie dans le presse-papiers.
 * Renvoie 'shared', 'copied' ou 'cancelled' ; lève une erreur si rien n'a marché.
 */
export async function sharePoint(p) {
  const url = `${window.location.origin}${pointPath(p)}`;
  const text = shareText(p, url);
  if (navigator.share) {
    try {
      await navigator.share({ title: `${p.sommet} : décollage vol rando`, text });
      return 'shared';
    } catch (e) {
      if (e?.name === 'AbortError') return 'cancelled';
    }
  }
  await navigator.clipboard.writeText(text);
  return 'copied';
}
