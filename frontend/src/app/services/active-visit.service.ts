import { Injectable, signal, computed } from '@angular/core';
import { Subject } from 'rxjs';
import { ArtworkResponse } from '../models/artwork.model';

const ACTIVE_VISIT_KEY = 'artaround_active_visit';

interface StoredVisitSession {
  visitId: string;
  museumId: string;
  itinerary: ArtworkResponse[];
  stepIndex: number;
}

@Injectable({
  providedIn: 'root'
})
export class ActiveVisitService {
  activeVisitId = signal<string | null>(null);
  activeMuseumId = signal<string | null>(null);
  activeItinerary = signal<ArtworkResponse[]>([]);
  currentStepIndex = signal<number>(0);

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
    this.persistSession();
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
      stepIndex: this.currentStepIndex()
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
        }
      }
    } catch {}
  }
}
