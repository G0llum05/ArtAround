export const VisitService = {
  async getAllVisits() {
    try {
      const res = await fetch('/api/visits');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          return data.map((v, i) => ({
            id: v.id || v._id || `v_${i}`,
            title: v.title || "Visita Senza Titolo",
            creator: typeof v.creator === 'object' && v.creator ? `${v.creator.name} ${v.creator.surname}` : (v.creator || "Staff Museo"),
            creatorVerified: true,
            price: v.price ?? 0,
            license: v.license || "Licenza Standard",
            likes: v.likesCount ?? v.likes ?? Math.floor(Math.random() * 150) + 20,
            views: v.views || { total: 0, weekly: 0 },
            categories: v.categories || [],
            isLiked: false,
            theme: (v.categories && v.categories.length > 0) ? v.categories[0] : "Generale",
            duration: v.minDuration ? `${v.minDuration}-${v.maxDuration || v.minDuration} min` : "60 min",
            image: v.images && v.images.length > 0 ? v.images[0] : (i % 3 === 0 ? "/images/GamberettoAllaBolognese.jpeg" : (i % 3 === 1 ? "/images/MattiasDream.jpeg" : "/images/DenunciaSociale.jpeg")),
            description: v.description || "Percorso culturale guidato con contenuti interattivi ed audioguida."
          }));
        }
      }
    } catch (e) {
      console.warn('Backend /api/visits non raggiungibile, utilizzo dati fallback per marketplace:', e);
    }

    // Fallback data se il backend non ha visite o è in avvio
    return [
      {
        id: 'v1',
        title: "La Magnificenza del Barocco Romano: La Grande Galleria Colonna ed il Mito di Lepanto",
        creator: "Palazzo Colonna",
        creatorVerified: true,
        price: 15.0,
        license: "Licenza Colonna",
        likes: 380,
        views: { total: 1250, weekly: 140 },
        categories: ["Rinascimento"],
        isLiked: true,
        theme: "Palazzo Colonna",
        duration: "60-90 min",
        image: "/images/GamberettoAllaBolognese.jpeg",
        description: "Un percorso guidato spettacolare nella galleria barocca più sfarzosa di Roma, tra specchi dipinti e la Colonna Bellica."
      },
      {
        id: 'v2',
        title: "Il Mangiafagioli di Annibale Carracci e la Pittura di Genere al Palazzo Colonna",
        creator: "Palazzo Colonna",
        creatorVerified: true,
        price: 12.0,
        license: "Licenza Colonna",
        likes: 340,
        views: { total: 980, weekly: 110 },
        categories: ["Realismo"],
        isLiked: true,
        theme: "Palazzo Colonna",
        duration: "50-75 min",
        image: "/images/MattiasDream.jpeg",
        description: "Analisi di uno dei dipinti più rivoluzionari ed emblematici dell'arte europea e della pittura di genere."
      },
      {
        id: 'v3',
        title: "Il Sacro e l'Eterno: La Cappella Sistina ed il Giudizio Universale di Michelangelo",
        creator: "Musei Vaticani",
        creatorVerified: true,
        price: 25.0,
        license: "Licenza Vaticana",
        likes: 680,
        views: { total: 3400, weekly: 450 },
        categories: ["Rinascimento", "Didattica"],
        isLiked: false,
        theme: "Musei Vaticani",
        duration: "75-105 min",
        image: "/images/GamberettoAllaBolognese.jpeg",
        description: "Un tour guidato indimenticabile incentrato sulla Volta e sul Giudizio Universale di Michelangelo nella Cappella Sistina."
      },
      {
        id: 'v4',
        title: "I Marmi dell'Anima: Il Genio Barocco di Gian Lorenzo Bernini",
        creator: "Galleria Borghese",
        creatorVerified: true,
        price: 15.0,
        license: "Licenza MiC",
        likes: 540,
        views: { total: 2100, weekly: 230 },
        categories: ["Neoclassicismo", "Rinascimento"],
        isLiked: false,
        theme: "Galleria Borghese",
        duration: "60-90 min",
        image: "/images/MattiasDream.jpeg",
        description: "Un viaggio mozzafiato tra i gruppi scultorei in marmo a tutto tondo di Bernini: Apollo e Dafne, il Ratto di Proserpina e il David."
      },
      {
        id: 'v5',
        title: "Superbike Legend: Dalla Ducati 916 di Tamburini alla Dominazione Mondiale",
        creator: "Museo Ducati",
        creatorVerified: true,
        price: 0,
        license: "Official Ducati",
        likes: 380,
        views: { total: 1800, weekly: 195 },
        categories: ["Motori", "Scienza"],
        isLiked: false,
        theme: "Museo Ducati",
        duration: "60-90 min",
        image: "/images/IlGr8lloParlante.png",
        description: "Tour incentrato sull'epopea Ducati nel Campionato Mondiale Superbike con la leggendaria 916 di Massimo Tamburini."
      },
      {
        id: 'v6',
        title: "I Ritratti ed i Capolavori del Manierismo e del Seicento: Bronzino, Reni e Guercino",
        creator: "Palazzo Colonna",
        creatorVerified: true,
        price: 15.0,
        license: "Licenza Colonna",
        likes: 290,
        views: { total: 850, weekly: 70 },
        categories: ["Rinascimento", "Medioevo"],
        isLiked: false,
        theme: "Palazzo Colonna",
        duration: "60-90 min",
        image: "/images/ImpressioneDiGambero.png",
        description: "Dal ritratto in armatura di Stefano Colonna dipinto dal Bronzino alle tele trascinanti ed emotive di Guido Reni e del Guercino."
      }
    ];
  },

  async toggleLike(visitId, delta = 1) {
    try {
      await fetch(`/api/visits/${visitId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ delta })
      });
    } catch (e) {
      console.warn('Impossibile registrare il like sul backend:', e);
    }
  },

  async recordView(visitId) {
    try {
      await fetch(`/api/visits/${visitId}/view`, {
        method: 'POST'
      });
    } catch (e) {
      console.warn('Impossibile registrare la visualizzazione sul backend:', e);
    }
  }
};
