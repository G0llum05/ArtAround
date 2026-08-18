
import { ArtworkResponse } from '../../models/artwork.model';
import {ChatMessage} from '../../models/appModel/chatMessage';

export const dummyItinerary = [
  {id: 1, title: 'Sala del Trono', duration: '10 min', completed: true},
  {id: 2, title: 'Galleria degli Specchi', duration: '15 min', completed: false},
  {id: 3, title: 'Appartamenti Reali', duration: '20 min', completed: false},
  {id: 4, title: 'Giardini all\'Italiana', duration: '30 min', completed: false}
]


export const dummyArtwork: ArtworkResponse = {
  id: "art-mock-001",
  title: "Ritratto di dama",
  description: "Un'opera d'arte di epoca rinascimentale caratterizzata da un uso straordinario della luce.",
  startYear: 1490,
  endYear: 1495,
  artists: [
    {
      id: "artist-mock-01",
      name: "Leonardo",
      surname: "da Vinci",
      artworks: [],
      artisticCurrents: ["Rinascimento"],
      followerOf: null as any,
      teacherOf: null as any,
      assets: { images: [] }
    }
  ],
  museum: {
    id: "museum-mock-01",
    name: "Galleria d'Arte Antica",
    description: "Un museo storico situato nel cuore della città.",
    address: {
      street: "Via Roma 1",
      city: "Milano",
      zipCode: "20121",
      country: "Italia"
    },
    contact: [
      "+3902123456",
      "info@galleria.it",
      "https://www.galleria.it",
      {
        instagram: "@galleria",
        x: "@galleria_art",
        facebook: "galleria",
        youtube: "galleria",
        messanger: "",
        telegram: "",
        whatsapp: ""
      }
    ],
    maxCapacity: 500,
    actualCapacity: 120,
    visits: [],
    artworks: [],
    openingHours: [],
    ticketInfo: {
      prices: [
        { planName: "Intero", price: 15, target: "Adulto" }
      ],
      discountCode: 10
    },
    isActive: true,
    services: {
      hasToilette: true,
      hasDisabledToilette: true,
      hasElevator: true,
      hasStairs: true,
      hasBar: false,
      hasRestaurant: false,
      hasShop: true,
      hasParking: false,
      hasAudioGuide: true,
      hasAirConditioning: true,
      hasHeating: true,
      hasWifi: true,
      hasGuidedTours: true,
      hasCloakroom: true
    },
    accessibility: {
      disableFriendly: true,
      wheelchairAccessible: true,
      childFriendly: true,
      petFriendly: false,
      tactilePaths: true,
      brailleSignage: false,
      audioDescriptions: true,
      notes: "Accessibile con rampe mobili"
    },
    pointsOfInterest: [],
    floors: [
      { level: 1, name: "Primo Piano", description: "Sala dei ritratti" }
    ],
    transportInfo: {
      publicTransport: "Metro M1 - Fermata Duomo",
      parkingDetails: "Parcheggi convenzionati nelle vicinanze"
    },
    eventsAndExibitions: {
      specialEvents: [],
      temporaryExibitions: ["Rinascimento Segreto"]
    },
    requirements: "Green Pass o normative vigenti"
  },
  location: {
    room: "Sala 4",
    floor: "1",
    build: "Ala Nord"
  },
  dimensions: {
    height: 63,
    width: 48,
    depth: 5,
    unit: "cm"
  },
  artisticCurrents: ["Rinascimento", "Umanesimo"],
  details: {
    subjects: ["Ritratto", "Nobiltà"],
    colors: ["Rosso", "Oro", "Blu scuro"],
    places: [],
    objectType: "Dipinto",
    materials: ["Olio su tavola"],
    technique: ["Sfumato"]
  },
  copyOf: null as any,
  falsificationOf: null as any,
  isActive: true,
  isPrivate: false,
  qrCode: "QR-ART-MOCK-001",
  images: [
    "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=800"
  ]
};


export const DUMMY_ITINERARY_ARTWORKS: ArtworkResponse[] = [
  {
    id: "art-mock-001",
    title: "Sala del Trono (Introduzione)",
    description: "Panoramica iniziale della visita e contestualizzazione storica.",
    startYear: 1450,
    endYear: 1460,
    artists: [],
    museum: {} as any,
    location: { room: "Sala 1", floor: "Piano Terra", build: "Ala Principale" },
    dimensions: { height: 0, width: 0, depth: 0, unit: "m" },
    artisticCurrents: ["Gotico"],
    details: { subjects: ["Storia"], colors: ["Oro"], places: [], objectType: "Ambiente", materials: [], technique: [] },
    copyOf: null as any,
    falsificationOf: null as any,
    isActive: true,
    isPrivate: false,
    qrCode: "QR-001",
    images: ["https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800"]
  },
  {
    id: "art-mock-002",
    title: "Galleria degli Specchi",
    description: "Un magnifico corridoio decorato con stucchi e specchi d'epoca.",
    startYear: 1650,
    endYear: 1670,
    artists: [],
    museum: {} as any,
    location: { room: "Sala 2", floor: "1", build: "Ala Principale" },
    dimensions: { height: 0, width: 0, depth: 0, unit: "m" },
    artisticCurrents: ["Barocco"],
    details: { subjects: ["Architettura"], colors: ["Argento", "Bianco"], places: [], objectType: "Sala", materials: [], technique: [] },
    copyOf: null as any,
    falsificationOf: null as any,
    isActive: true,
    isPrivate: false,
    qrCode: "QR-002",
    images: ["https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3?w=800"]
  },
  {
    id: "art-mock-003",
    title: "Ritratto di Dama (Opera Centrale)",
    description: "Un'opera d'arte di epoca rinascimentale caratterizzata da un uso straordinario della luce.",
    startYear: 1490,
    endYear: 1495,
    artists: [
      {
        id: "artist-mock-01",
        name: "Leonardo",
        surname: "da Vinci",
        artworks: [],
        artisticCurrents: ["Rinascimento"],
        followerOf: null as any,
        teacherOf: null as any,
        assets: { images: [] }
      }
    ],
    museum: {} as any,
    location: { room: "Sala 4", floor: "1", build: "Ala Nord" },
    dimensions: { height: 63, width: 48, depth: 5, unit: "cm" },
    artisticCurrents: ["Rinascimento", "Umanesimo"],
    details: { subjects: ["Ritratto", "Nobiltà"], colors: ["Rosso", "Oro", "Blu scuro"], places: [], objectType: "Dipinto", materials: ["Olio su tavola"], technique: ["Sfumato"] },
    copyOf: null as any,
    falsificationOf: null as any,
    isActive: true,
    isPrivate: false,
    qrCode: "QR-ART-MOCK-001",
    images: ["https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=800"]
  },
  {
    id: "art-mock-004",
    title: "Appartamenti Reali",
    description: "Le stanze private riservate ai sovrani, arredate con mobili originali.",
    startYear: 1700,
    endYear: 1750,
    artists: [],
    museum: {} as any,
    location: { room: "Sala 8", floor: "2", build: "Ala Sud" },
    dimensions: { height: 0, width: 0, depth: 0, unit: "m" },
    artisticCurrents: ["Rococò"],
    details: { subjects: ["Arredi"], colors: ["Pastello"], places: [], objectType: "Interni", materials: [], technique: [] },
    copyOf: null as any,
    falsificationOf: null as any,
    isActive: true,
    isPrivate: false,
    qrCode: "QR-004",
    images: ["https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800"]
  },
  {
    id: "art-mock-005",
    title: "Giardini all'Italiana",
    description: "Percorso all'aperto tra fontane storiche, siepi geometriche e statue.",
    startYear: 1600,
    endYear: 1630,
    artists: [],
    museum: {} as any,
    location: { room: "Esterni", floor: "Terra", build: "Parco" },
    dimensions: { height: 0, width: 0, depth: 0, unit: "m" },
    artisticCurrents: ["Manierismo"],
    details: { subjects: ["Natura"], colors: ["Verde"], places: [], objectType: "Giardino", materials: [], technique: [] },
    copyOf: null as any,
    falsificationOf: null as any,
    isActive: true,
    isPrivate: false,
    qrCode: "QR-005",
    images: ["https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=800"]
  }
];



export const messagesDummy:ChatMessage[] = [
  { sender: 'ai', text: 'Benvenuto al museo! Sono la tua guida virtuale. Come posso aiutarti oggi?' },
  { sender: 'user', text: 'Mi racconti qualcosa sulla Sala del Trono?', type: 'text' },
  { sender: 'ai', text: 'La Sala del Trono risale al XVIII secolo ed è famosa per i suoi stucchi dorati e gli affreschi sul soffitto.' },
  { sender: 'ai', text: 'Benvenuto al museo! Sono la tua guida virtuale. Come posso aiutarti oggi?' },
  { sender: 'ai', text: 'Benvenuto al museo! Sono la tua guida virtuale. Come posso aiutarti oggi?' },
  { sender: 'ai', text: 'Benvenuto al museo! Sono la tua guida virtuale. Come posso aiutarti oggi?' },
  { sender: 'ai', text: 'Benvenuto al museo! Sono la tua guida virtuale. Come posso aiutarti oggi?' },
  { sender: 'ai', text: 'Benvenuto al museo! Sono la tua guida virtuale. Come posso aiutarti oggi?' },
  { sender: 'ai', text: 'Benvenuto al museo! Sono la tua guida virtuale. Come posso aiutarti oggi?' },
  { sender: 'ai', text: 'Benvenuto al museo! Sono la tua guida virtuale. Come posso aiutarti oggi?' },
  { sender: 'ai', text: 'Benvenuto al museo! Sono la tua guida virtuale. Come posso aiutarti oggi?' },
  { sender: 'ai', text: 'Benvenuto al museo! Sono la tua guida virtuale. Come posso aiutarti oggi?' },
  { sender: 'user', text: 'Mi racconti qualcosa sulla Sala del Trono?', type: 'text' },
  { sender: 'ai', text: 'La Sala del Trono risale al XVIII secolo ed è famosa per i suoi stucchi dorati e gli affreschi sul soffitto.' },
  { sender: 'user', text: '🎤 [Messaggio Vocale Inviato]', type: 'audio' },
  { sender: 'ai', text: 'Ho ricevuto il tuo messaggio vocale! Certamente, la visita guidata prosegue verso la Galleria degli Specchi.' },
  { sender: 'user', text: 'Mi racconti qualcosa sulla Sala del Trono?', type: 'text' },
  { sender: 'ai', text: 'La Sala del Trono risale al XVIII secolo ed è famosa per i suoi stucchi dorati e gli affreschi sul soffitto.' },
  { sender: 'user', text: '🎤 [Messaggio Vocale Inviato]', type: 'audio' },
  { sender: 'ai', text: 'Ho ricevuto il tuo messaggio vocale! Certamente, la visita guidata prosegue verso la Galleria degli Specchi.' },
  { sender: 'user', text: 'Mi racconti qualcosa sulla Sala del Trono?', type: 'text' },
  { sender: 'ai', text: 'La Sala del Trono risale al XVIII secolo ed è famosa per i suoi stucchi dorati e gli affreschi sul soffitto.' },
  { sender: 'user', text: '🎤 [Messaggio Vocale Inviato]', type: 'audio' },
  { sender: 'ai', text: 'Ho ricevuto il tuo messaggio vocale! Certamente, la visita guidata prosegue verso la Galleria degli Specchi.' },
  { sender: 'user', text: 'Mi racconti qualcosa sulla Sala del Trono?', type: 'text' },
  { sender: 'ai', text: 'La Sala del Trono risale al XVIII secolo ed è famosa per i suoi stucchi dorati e gli affreschi sul soffitto.' },
  { sender: 'user', text: '🎤 [Messaggio Vocale Inviato]', type: 'audio' },
  { sender: 'ai', text: 'Ho ricevuto il tuo messaggio vocale! Certamente, la visita guidata prosegue verso la Galleria degli Specchi.' },
  { sender: 'user', text: 'Mi racconti qualcosa sulla Sala del Trono?', type: 'text' },
  { sender: 'ai', text: 'La Sala del Trono risale al XVIII secolo ed è famosa per i suoi stucchi dorati e gli affreschi sul soffitto.' },
  { sender: 'user', text: '🎤 [Messaggio Vocale Inviato]', type: 'audio' },
  { sender: 'ai', text: 'Ho ricevuto il tuo messaggio vocale! Certamente, la visita guidata prosegue verso la Galleria degli Specchi.' },
  { sender: 'user', text: 'Mi racconti qualcosa sulla Sala del Trono?', type: 'text' },
  { sender: 'ai', text: 'La Sala del Trono risale al XVIII secolo ed è famosa per i suoi stucchi dorati e gli affreschi sul soffitto.' },
  { sender: 'user', text: '🎤 [Messaggio Vocale Inviato]', type: 'audio' },
  { sender: 'ai', text: 'Ho ricevuto il tuo messaggio vocale! Certamente, la visita guidata prosegue verso la Galleria degli Specchi.' },
  { sender: 'user', text: 'Mi racconti qualcosa sulla Sala del Trono?', type: 'text' },
  { sender: 'ai', text: 'La Sala del Trono risale al XVIII secolo ed è famosa per i suoi stucchi dorati e gli affreschi sul soffitto.' },
  { sender: 'user', text: '🎤 [Messaggio Vocale Inviato]', type: 'audio' },
  { sender: 'ai', text: 'Ho ricevuto il tuo messaggio vocale! Certamente, la visita guidata prosegue verso la Galleria degli Specchi.' },
  { sender: 'user', text: 'Mi racconti qualcosa sulla Sala del Trono?', type: 'text' },
  { sender: 'ai', text: 'La Sala del Trono risale al XVIII secolo ed è famosa per i suoi stucchi dorati e gli affreschi sul soffitto.' },
  { sender: 'user', text: '🎤 [Messaggio Vocale Inviato]', type: 'audio' },
  { sender: 'ai', text: 'Ho ricevuto il tuo messaggio vocale! Certamente, la visita guidata prosegue verso la Galleria degli Specchi.' },
  { sender: 'user', text: 'Mi racconti qualcosa sulla Sala del Trono?', type: 'text' },
  { sender: 'ai', text: 'La Sala del Trono risale al XVIII secolo ed è famosa per i suoi stucchi dorati e gli affreschi sul soffitto.' },
  { sender: 'user', text: '🎤 [Messaggio Vocale Inviato]', type: 'audio' },
  { sender: 'ai', text: 'Ho ricevuto il tuo messaggio vocale! Certamente, la visita guidata prosegue verso la Galleria degli Specchi.' },
  { sender: 'user', text: '🎤 [Messaggio Vocale Inviato]', type: 'audio' },
  { sender: 'ai', text: 'Ho ricevuto il tuo messaggio vocale! Certamente, la visita guidata prosegue verso la Galleria degli Specchi.' }
];
