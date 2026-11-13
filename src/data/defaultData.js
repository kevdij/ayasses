// Contenu initial du site, repris de lesayasses.fr.
// Tout est modifiable depuis /admin (stocké dans le navigateur pour la maquette).

export const defaultData = {
  club: {
    name: 'Club des Ayasses',
    tagline: 'Plus proche de la Lune',
    intro:
      "Club de parapente du Champsaur, basé à Saint-Jean-Saint-Nicolas dans les Hautes-Alpes. On vole ensemble, on progresse ensemble, et on partage le ciel comme l'apéro.",
    location: 'Saint-Jean-Saint-Nicolas (05260), Champsaur – Hautes-Alpes',
    email: 'contact@lesayasses.fr',
    whatsappUrl: '',
    membershipPrice: 'À compléter',
    membershipDetails:
      "L'adhésion au club se prend avec la licence FFVL. Elle donne accès aux sorties club, aux journées pliage secours, aux stages « Voler mieux » à prix réduit, et à la vie du club toute l'année.",
    president: 'À compléter',
    host: 'À compléter',
  },

  activities: [
    { id: 'a1', icon: '🪂', title: 'Sorties club', text: 'Des week-ends de vol sur d’autres sites, comme dans le Trièves, en gîte et entre pilotes.' },
    { id: 'a2', icon: '🎯', title: 'Voler mieux', text: 'Des stages de perfectionnement sur deux jours, encadrés, à petits effectifs.' },
    { id: 'a3', icon: '🧵', title: 'Pliage secours', text: 'Une journée pour replier son parachute de secours, avec priorité aux pilotes inscrits au SIV.' },
    { id: 'a4', icon: '📡', title: 'Balises & webcam', text: 'Le club entretient des stations météo et une webcam sur le déco de Richards.' },
    { id: 'a5', icon: '🎬', title: 'Soirées', text: 'Les Icares du cinéma, des projections et des soirées pour se retrouver hors du ciel.' },
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

  news: [
    {
      id: 'n1',
      title: 'Fête du club le 10 octobre 2026',
      date: '2026-09-18',
      category: 'Événement',
      excerpt: 'La fête du club revient le samedi 10 octobre. Plan d’accès et programme dans l’annonce.',
      body:
        "La fête du Club des Ayasses aura lieu le samedi 10 octobre 2026.\n\nPour venir, le plan d'accès est indiqué dans l'annonce. Pensez à vous inscrire auprès du bureau pour qu'on prévoie assez à manger !",
    },
    {
      id: 'n2',
      title: 'Rocket est mort, WhatsApp revient !',
      date: '2024-07-14',
      category: 'Vie du club',
      excerpt: 'Le club passe sur une communauté WhatsApp. Voici comment la rejoindre.',
      body:
        "Notre messagerie Rocket.Chat est arrêtée. Le club a créé une communauté WhatsApp.\n\nPour éviter les robots de spam, rejoignez d'abord le groupe d'accueil : nous vous enverrons ensuite l'invitation vers la vraie communauté. Pensez ensuite à rejoindre tous les sous-groupes qui vous intéressent.",
    },
    {
      id: 'n3',
      title: 'Pliage secours',
      date: '2024-03-05',
      category: 'Formation',
      excerpt: 'Une journée pour replier son parachute de secours, 16 places.',
      body:
        "Une journée pliage secours est organisée. La priorité sera donnée aux pilotes inscrits au SIV du 30 avril (8 personnes). Au total, 16 places sont disponibles, plus une de réserve.\n\nInscription via le sondage envoyé sur le groupe du club.",
    },
    {
      id: 'n4',
      title: 'Voler mieux : stage de perfectionnement',
      date: '2024-03-05',
      category: 'Formation',
      excerpt: 'Deux jours avec Manu et Guillaume, 40 € par pilote, 7 places.',
      body:
        "Un stage « Voler mieux » est organisé les 13 et 14 avril (report les 20 et 21 avril si la météo ne le permet pas), avec Manu et Guillaume.\n\nTarif : 40 € par pilote pour les deux jours. 7 places maximum. Inscrivez-vous sur le groupe du club avec vos nom, prénom et numéro de portable.",
    },
    {
      id: 'n5',
      title: 'Compte rendu de l’assemblée générale du 5 décembre',
      date: '2023-12-13',
      category: 'Vie du club',
      excerpt: 'Budget, balises météo, webcam et renouvellement du bureau.',
      body:
        "Merci à toutes et à tous pour votre présence lors de l'assemblée générale.\n\nAu programme : le budget du club, l'entretien des stations météo, l'ajout d'une webcam au déco de Richards et le renouvellement du bureau.\n\nLe compte rendu complet est disponible pour les adhérents sur demande.",
    },
  ],

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
