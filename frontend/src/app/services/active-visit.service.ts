import { Injectable, signal, computed } from '@angular/core';
import { Subject } from 'rxjs';
import { ArtworkResponse } from '../models/artwork.model';
import { VisitResponse } from '../models/visit.model';

const ACTIVE_VISIT_KEY = 'artaround_active_visit';

interface StoredVisitSession {
  visitId: string;
  museumId: string;
  itinerary: ArtworkResponse[];
  stepIndex: number;
  isSingleArtwork?: boolean;
  virtualVisit?: VisitResponse | null;
}

@Injectable({
  providedIn: 'root'
})
export class ActiveVisitService {
  activeVisitId = signal<string | null>(null);
  activeMuseumId = signal<string | null>(null);
  activeItinerary = signal<ArtworkResponse[]>([]);
  currentStepIndex = signal<number>(0);
  isSingleArtworkMode = signal<boolean>(false);
  virtualVisit = signal<VisitResponse | null>(null);

  hasActiveVisit = computed(() => !!this.activeVisitId());

  private stepJumpSubject = new Subject<number>();
  stepJumpRequested$ = this.stepJumpSubject.asObservable();

  constructor() {
    this.restoreSession();
  }

  setActiveVisit(visitId: string, museumId: string = '', itinerary: ArtworkResponse[] = [], stepIndex: number = 0): void {
    this.activeVisitId.set(visitId);
    this.activeMuseumId.set(museumId);
    this.activeItinerary.set(itinerary);
    this.currentStepIndex.set(stepIndex);
    this.isSingleArtworkMode.set(false);
    this.virtualVisit.set(null);
    this.persistSession();
  }

  /**
   * Genera la struttura dati di una visita fittizia (formattata secondo VisitResponse)
   * contenente esclusivamente l'opera d'arte passata.
   */
  createVirtualVisitFromArtwork(artwork: ArtworkResponse): VisitResponse {
    const museumId = typeof artwork.museum === 'object' && artwork.museum !== null
      ? ((artwork.museum as any)._id || (artwork.museum as any).id || '')
      : (typeof artwork.museum === 'string' ? artwork.museum : '');

    const artworkImages = artwork.assets?.images || [];
    const artId = artwork.id || (artwork as any)._id || 'unknown';

    const virtualVisit: VisitResponse = {
      id: `virtual_single_${artId}`,
      title: `Esplorazione: ${artwork.title || 'Opera d\'arte'}`,
      description: artwork.description || `Guida e narrazione interattiva per l'opera ${artwork.title || ''}`,
      price: 0,
      license: 'Standard',
      creator: {
        id: 'system',
        name: 'ArtAround',
        surname: 'Navigator',
        email: 'info@artaround.it',
        role: 'guest'
      },
      artworks: [artwork],
      minDuration: 5,
      maxDuration: 15,
      isActive: true,
      availability: {
        always: true,
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
      },
      weeklySchedule: [],
      disableFriendly: true,
      requirements: 'Dispositivo con connessione audio e microfono',
      categories: artwork.artisticCurrents || [],
      likesCount: 0,
      views: { total: 1, weekly: 1 },
      badge: 'QR Code',
      isVerified: true,
      assets: {
        images: artworkImages.length > 0 ? artworkImages : [{ url: '/assets/images/place_holder.jpg', orientation: 'landscape' }]
      }
    };

    return virtualVisit;
  }

  /**
   * Inizializza e salva in sessionStorage una visita fittizia a 1 sola tappa per l'opera data.
   */
  setVirtualSingleArtworkVisit(artwork: ArtworkResponse): VisitResponse {
    const virtualVisit = this.createVirtualVisitFromArtwork(artwork);
    const museumId = typeof artwork.museum === 'object' && artwork.museum !== null
      ? ((artwork.museum as any)._id || (artwork.museum as any).id || '')
      : (typeof artwork.museum === 'string' ? artwork.museum : '');

    this.activeVisitId.set(virtualVisit.id);
    this.activeMuseumId.set(museumId);
    this.activeItinerary.set([artwork]);
    this.currentStepIndex.set(0);
    this.isSingleArtworkMode.set(true);
    this.virtualVisit.set(virtualVisit);

    this.persistSession();
    return virtualVisit;
  }

  updateCurrentStep(stepIndex: number): void {
    this.currentStepIndex.set(stepIndex);
    this.persistSession();
  }

  jumpToStep(stepIndex: number): void {
    this.updateCurrentStep(stepIndex);
    this.stepJumpSubject.next(stepIndex);
  }

  clearActiveVisit(): void {
    this.activeVisitId.set(null);
    this.activeMuseumId.set(null);
    this.activeItinerary.set([]);
    this.currentStepIndex.set(0);
    this.isSingleArtworkMode.set(false);
    this.virtualVisit.set(null);
    sessionStorage.removeItem(ACTIVE_VISIT_KEY);
  }

  isArtworkInActiveVisit(codeOrId: string): number {
    if (!codeOrId) return -1;
    const target = codeOrId.trim().toLowerCase();
    const items = this.activeItinerary();

    return items.findIndex(art => {
      const idMatch = (art.id || (art as any)._id || '').toString().toLowerCase() === target;
      const qrMatch = (art.qrCode || '').toString().toLowerCase() === target;
      return idMatch || qrMatch;
    });
  }

  private persistSession(): void {
    const vId = this.activeVisitId();
    if (!vId) {
      sessionStorage.removeItem(ACTIVE_VISIT_KEY);
      return;
    }
    const data: StoredVisitSession = {
      visitId: vId,
      museumId: this.activeMuseumId() || '',
      itinerary: this.activeItinerary(),
      stepIndex: this.currentStepIndex(),
      isSingleArtwork: this.isSingleArtworkMode(),
      virtualVisit: this.virtualVisit()
    };
    try {
      sessionStorage.setItem(ACTIVE_VISIT_KEY, JSON.stringify(data));
    } catch {}
  }

  private restoreSession(): void {
    try {
      const stored = sessionStorage.getItem(ACTIVE_VISIT_KEY);
      if (stored) {
        const parsed: StoredVisitSession = JSON.parse(stored);
        if (parsed && parsed.visitId) {
          this.activeVisitId.set(parsed.visitId);
          this.activeMuseumId.set(parsed.museumId || '');
          this.activeItinerary.set(parsed.itinerary || []);
          this.currentStepIndex.set(parsed.stepIndex || 0);
          this.isSingleArtworkMode.set(Boolean(parsed.isSingleArtwork));
          this.virtualVisit.set(parsed.virtualVisit || null);
        }
      }
    } catch {}
  }
}
