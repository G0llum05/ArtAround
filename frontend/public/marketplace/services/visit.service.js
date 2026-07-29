export const VisitService = {
  async getAllVisits() {
    try {
      const res = await fetch('/api/visit');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          return data.map((v, i) => ({
            id: v.id || v._id || `v_${i}`,
            title: v.title || "Visita Senza Titolo",
            creator: typeof v.creator === 'object' ? `${v.creator.name} ${v.creator.surname}` : (v.creator || "Staff Museo"),
            creatorVerified: true,
            price: v.price ?? 0,
            license: v.license || "Licenza Standard",
            likes: v.likes || Math.floor(Math.random() * 150) + 20,
            isLiked: false,
            theme: v.theme || (v.title && (v.title.toLowerCase().includes("colonna") || v.title.toLowerCase().includes("carracci") || v.title.toLowerCase().includes("mangiafagioli")) ? "Palazzo Colonna" : (v.title && (v.title.toLowerCase().includes("sistina") || v.title.toLowerCase().includes("vatican")) ? "Musei Vaticani" : (v.title && (v.title.toLowerCase().includes("borghese") || v.title.toLowerCase().includes("bernini")) ? "Galleria Borghese" : (v.title && (v.title.toLowerCase().includes("ducati") || v.title.toLowerCase().includes("desmo")) ? "Museo Ducati" : (v.title && (v.title.toLowerCase().includes("archeo") || v.title.toLowerCase().includes("etrusca")) ? "Museo Civico Archeologico" : (v.title && v.title.toLowerCase().includes("poggi") ? "Palazzo Poggi" : (v.title && v.title.toLowerCase().includes("carducci") ? "Casa Carducci" : (i % 2 === 0 ? "Museo del Patrimonio Industriale" : "800")))))))),
            duration: v.minDuration ? `${v.minDuration}-${v.maxDuration || v.minDuration} min` : "60 min",
            image: v.images && v.images.length > 0 ? v.images[0] : (i % 3 === 0 ? "/images/GamberettoAllaBolognese.jpeg" : (i % 3 === 1 ? "/images/MattiasDream.jpeg" : "/images/DenunciaSociale.jpeg")),
            description: v.description || "Percorso culturale guidato con contenuti interattivi ed audioguida."
          }));
        }
      }
    } catch (e) {
      console.warn('Backend /api/visit non raggiungibile, utilizzo dati fallback per marketplace:', e);
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
        price: 20.0,
        license: "Official Ducati",
        likes: 380,
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
        isLiked: false,
        theme: "Palazzo Colonna",
        duration: "60-90 min",
        image: "/images/ImpressioneDiGambero.png",
        description: "Dal ritratto in armatura di Stefano Colonna dipinto dal Bronzino alle tele trascinanti ed emotive di Guido Reni e del Guercino."
      }
    ];
  }
};
