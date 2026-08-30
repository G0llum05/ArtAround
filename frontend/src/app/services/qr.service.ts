import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ActiveVisitService } from './active-visit.service';
import { ArtworkService } from './artwork.service';
import { SingleArtworkModalService } from './single-artwork-modal.service';
import { AlertService } from './alert.service';
import { ArtworkResponse } from '../models/artwork.model';
import { DUMMY_ITINERARY_ARTWORKS, dummyArtwork } from '../pages/navigator/dummy';

@Injectable({
  providedIn: 'root'
})
export class QrService {
  private router = inject(Router);
  private activeVisitService = inject(ActiveVisitService);
  private artworkService = inject(ArtworkService);
  private singleArtworkModalService = inject(SingleArtworkModalService);
  private alertService = inject(AlertService);

  extractArtworkIdentifier(resultString: string): string {
    if (!resultString) return '';
    const trimmed = resultString.trim();

    try {
      if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
        const url = new URL(trimmed);
        const queryParam = url.searchParams.get('artworkId') || url.searchParams.get('id') || url.searchParams.get('qrCode') || url.searchParams.get('code');
        if (queryParam) return queryParam.trim();

        const pathParts = url.pathname.split('/').filter(Boolean);
        if (pathParts.length > 0) {
          return pathParts[pathParts.length - 1].trim();
        }
      }
    } catch {}

    return trimmed;
  }

  async handleScannedCode(resultString: string): Promise<boolean> {
    const identifier = this.extractArtworkIdentifier(resultString);
    if (!identifier) {
      this.alertService.error('QR Code vuoto o non valido.');
      return false;
    }

    const stepIndex = this.activeVisitService.isArtworkInActiveVisit(identifier);

    if (stepIndex >= 0) {
      const currentUrl = this.router.url;
      if (currentUrl.startsWith('/navigator')) {
        this.activeVisitService.jumpToStep(stepIndex);
      } else {
        const vId = this.activeVisitService.activeVisitId();
        const mId = this.activeVisitService.activeMuseumId() || '';
        await this.router.navigate(['/navigator'], {
          queryParams: {
            visitId: vId,
            museumId: mId,
            step: stepIndex
          }
        });
      }
      return true;
    }

    let artwork: ArtworkResponse | null = null;
    try {
      artwork = await firstValueFrom(this.artworkService.getById(identifier));
    } catch {
      artwork = null;
    }

    if (!artwork) {
      const dummyMatch = DUMMY_ITINERARY_ARTWORKS.find(a =>
        a.id === identifier || a.qrCode === identifier || a.title.toLowerCase().includes(identifier.toLowerCase())
      );
      if (dummyMatch) {
        artwork = dummyMatch;
      } else if (identifier.includes('mock') || identifier.includes('dummy') || identifier === 'QR-001') {
        artwork = dummyArtwork;
      }
    }

    if (artwork) {
      this.singleArtworkModalService.open(artwork);
      return true;
    }

    this.alertService.error('Nessuna opera corrispondente al QR Code inquadrato.');
    return false;
  }
}
