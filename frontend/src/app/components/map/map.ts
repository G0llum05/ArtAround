import {
  Component,
  output,
  input,
  computed,
  viewChild,
  ElementRef,
  AfterViewInit,
  OnDestroy,
  effect
} from '@angular/core';
import Panzoom, { PanzoomObject } from '@panzoom/panzoom';
import { CommonModule } from '@angular/common';
import { MuseumResponse } from '../../models/museum.model';

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './map.html',
  styleUrl: './map.css'
})
export class Map implements AfterViewInit, OnDestroy {
  museum = input<MuseumResponse | null | undefined>(null);
  closeMap = output<void>();

  mapViewport = viewChild<ElementRef<HTMLElement>>('mapViewport');
  panzoomElement = viewChild<ElementRef<HTMLElement>>('panzoomElement');

  private panzoomInstance?: PanzoomObject;
  private wheelListener?: (e: WheelEvent) => void;

  // Restituisce l'URL salvato all'interno di museum.assets.map
  imageUrl = computed<string>(() => {
    return this.museum()?.assets?.map?.url || '/assets/images/place_holder.jpg';
  });

  constructor() {
    effect(() => {
      this.imageUrl();
      if (this.panzoomInstance) {
        setTimeout(() => this.panzoomInstance?.reset({ animate: true }), 50);
      }
    });
  }

  ngAfterViewInit(): void {
    this.initPanzoom();
  }

  ngOnDestroy(): void {
    if (this.wheelListener && this.mapViewport()?.nativeElement) {
      this.mapViewport()?.nativeElement.removeEventListener('wheel', this.wheelListener);
    }
    this.panzoomInstance?.destroy();
  }

  private initPanzoom(): void {
    const elem = this.panzoomElement()?.nativeElement;
    const parent = this.mapViewport()?.nativeElement;

    if (!elem || !parent) return;

    this.panzoomInstance?.destroy();

    this.panzoomInstance = Panzoom(elem, {
      maxScale: 6,
      minScale: 0.5,
      canvas: true,
      step: 0.3
    });

    this.wheelListener = (event: WheelEvent) => {
      event.preventDefault();
      this.panzoomInstance?.zoomWithWheel(event);
    };

    parent.addEventListener('wheel', this.wheelListener, { passive: false });
  }

  onImageLoad(): void {
    if (!this.panzoomInstance) {
      this.initPanzoom();
    }
  }

  zoomIn(): void {
    this.panzoomInstance?.zoomIn({ animate: true });
  }

  zoomOut(): void {
    this.panzoomInstance?.zoomOut({ animate: true });
  }

  resetZoom(): void {
    this.panzoomInstance?.reset({ animate: true });
  }

  close(): void {
    this.closeMap.emit();
  }
}


