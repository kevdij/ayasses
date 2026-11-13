// Contenu initial du site, repris de lesayasses.fr.
// Une fois Supabase branché, ce qui est enregistré depuis /admin remplace ces valeurs.
import news from './news.json';
import volRando from './volRando.json';

export const defaultData = {
  club: {
    name: 'Club des Ayasses',
    tagline: 'Plus proche de la Lune',
    intro:
      "Club de parapente du Champsaur, basé à Saint-Jean-Saint-Nicolas dans les Hautes-Alpes. On vole ensemble, on progresse ensemble, et on partage le ciel comme l'apéro.",
    location: 'Saint-Jean-Saint-Nicolas (05260), Champsaur – Hautes-Alpes',
    email: 'contact@lesayasses.fr',
    licenceUrl: 'https://intranet.ffvl.fr/ffvl_licenceonline',
    whatsappUrl: 'https://chat.whatsapp.com/EKMcTKOO9TBGiExZm7V8SP',
    membershipPrice: 'À compléter',
    membershipDetails:
      "L'adhésion au club se prend en même temps que la licence FFVL, directement en ligne. Elle donne accès aux sorties club, aux journées pliage secours, aux stages « Voler mieux » à prix réduit, et à la vie du club toute l'année.",
    president: 'À compléter',
    host: 'Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis',
  },

  activities: [
    { id: 'a1', icon: '🪂', title: 'Sorties club', text: 'Des week-ends de vol sur d’autres sites, comme dans le Trièves, en gîte et entre pilotes.' },
    { id: 'a2', icon: '🎯', title: 'Voler mieux', text: 'Des stages de perfectionnement sur deux jours, encadrés, à petits effectifs.' },
    { id: 'a3', icon: '🧵', title: 'Pliage secours', text: 'Une journée pour replier son parachute de secours, avec priorité aux pilotes inscrits au SIV.' },
    { id: 'a4', icon: '📡', title: 'Balises & webcam', text: 'Le club entretient des stations météo et une webcam sur le déco des Richards.' },
    { id: 'a5', icon: '🥾', title: 'Vol rando', text: 'Plus de 100 décollages rando recensés dans le Champsaur, à filtrer par orientation et niveau.' },
    { id: 'a6', icon: '🌙', title: 'Fête du club', text: 'Chaque automne, une grande fête pour clôturer la saison ensemble.' },
  ],

  events: [
    {
      id: 'e1',
      title: 'Assemblée générale',
      date: '2026-12-05',
      time: '18:00',
      place: 'À confirmer',
      price: '',
      description:
        "Exemple : bilan de la saison, budget, projets (balises, webcam) et renouvellement du bureau. Si vous ne pouvez pas venir, vous pouvez donner un pouvoir.",
    },
    {
      id: 'e2',
      title: 'Fête du Club des Ayasses',
      date: '2026-10-10',
      time: '',
      place: 'Voir le plan dans l’annonce',
      price: '',
      description: 'La fête annuelle du club. Venez nombreux !',
    },
    {
      id: 'e3',
      title: 'Fête du parapente',
      date: '2024-10-05',
      time: '',
      place: '',
      price: '',
      description: 'Programme de la journée dans l’annonce.',
    },
    {
      id: 'e4',
      title: 'Voler mieux – stage de deux jours',
      date: '2024-04-13',
      time: '',
      place: '',
      price: '40 € par pilote',
      description: 'Avec Manu et Guillaume, 7 places maximum. Report possible les 20 et 21 avril en cas de météo défavorable.',
    },
    {
      id: 'e5',
      title: 'Les Icares du cinéma',
      date: '2024-04-05',
      time: '',
      place: 'Salle Reynier, Pont-du-Fossé',
      price: '',
      description: 'Projection des films du festival des Icares du cinéma.',
    },
  ],

  news,

  volRando,

  structures: [
    { id: 's1', kind: 'Club', name: 'Les Ayasses', place: 'Champsaur', url: '' },
    { id: 's2', kind: 'Club', name: "Differen'ciel", place: 'Gap', url: '' },
    { id: 's3', kind: 'Club', name: 'Serre-Ponçon Vol Libre', place: 'Serre-Ponçon', url: 'http://serreponconvollibre.unblog.fr/' },
    { id: 's4', kind: 'Club', name: "Trapan'ailes", place: 'Compétition mini Trans’Alps', url: '' },
    { id: 's5', kind: 'École', name: 'Écrins Vol Libre', place: '', url: '' },
    { id: 's6', kind: 'École', name: 'Ressources Parapente', place: '', url: '' },
    { id: 's7', kind: 'École', name: 'Chaussée Glissante', place: '', url: '' },
    { id: 's8', kind: 'École', name: 'JP Parapente', place: '', url: '' },
    { id: 's9', kind: 'École', name: 'Fusion Parapente', place: '', url: '' },
    { id: 's10', kind: 'Biplace', name: "Base de loisirs d'Orcières", place: 'L’été', url: '' },
  ],
};
