import { Component, input, output, ElementRef, viewChild, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatMessage } from '../../models/appModel/chatMessage';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './chat.html',
  styleUrl: './chat.css'
})
export class Chat {
  // Riceve la cronologia dei messaggi dal padre
  messages = input<ChatMessage[]>([]);
  isDictating = input<boolean>(false);

  // Output verso il padre per gestire il click sul microfono
  toggleDictation = output<void>();

  scrollContainer = viewChild<ElementRef<HTMLDivElement>>('scrollContainer');

  constructor() {
    effect(() => {
      // Reagisce a ogni aggiornamento di messages()
      this.messages();
      setTimeout(() => this.scrollToBottom(), 50);
    });
  }

  private scrollToBottom(): void {
    const el = this.scrollContainer()?.nativeElement;
    if (el) {
      if (typeof el.scrollTo === 'function') {
        el.scrollTo({
          top: el.scrollHeight,
          behavior: 'smooth'
        });
      } else {
        el.scrollTop = el.scrollHeight;
      }
    }
  }
}
