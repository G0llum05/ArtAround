import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'primary-button',
  standalone: true,
  imports: [
    RouterLink,
    CommonModule,
  ], // Serve per far funzionare il routerLink nel template
  templateUrl: 'primary-button.html',
  styleUrl: 'primary-button.css'
})
export class PrimaryButtonComponent {
  // Se il padre passa un path, il bottone diventerà un link per cambiare pagina
  @Input() path?: string;

  // Se non c'è un path, il bottone emetterà questo evento quando cliccato
  @Output() action = new EventEmitter<void>();

  onClick() {
    this.action.emit();
  }
}
