import { Component, Input, HostBinding } from '@angular/core';

export interface Picture {
  dimension: 'invisible' | 'small' | 'large' | 'tall' | 'huge';
  url: string;
}

@Component({
  selector: 'app-quadro',
  standalone: true,
  template: `
    <div class="paint">
      @if(url){
        <img [src]="url" alt="Quadro" style="width: 100%; height: 100%; object-fit: cover">
      }
    </div>
    `
  ,
  styles: [`
    /* :host si riferisce al tag <app-quadro> stesso, non al suo contenuto */
    /* In generele <app-quadro> è detto host element, e tutto l'html finisce dentro di lui */
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }
    .paint {
      width: 100%;
      height: 100%;
      border: 5px solid var(--black);
      box-sizing: border-box;
    }
  `]
})
export class PictureComponent {
  // @Input permette al componente padre (App) di passare questi valori
  @Input() dimension: string = 'invisible';
  @Input() color: string = '#ffffff';
  @Input() url: string = '';

  // @HostBinding serve ad accdere direttamente all'host element quello che viene dopo è il valore applicato (dinamicamente)
  @HostBinding('class')
  get dim() {  //get è un semplice getter, che restituisce il valore della dimensione, e lo applica come classe al tag <app-quadro>
    return  this.dimension;
  }
}
