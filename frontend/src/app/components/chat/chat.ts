import { Component, input, output, signal, ElementRef, viewChild, effect } from '@angular/core';
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
  messages = input<ChatMessage[]>([]);
  isDictating = input<boolean>(false);
  isCollapsed = input<boolean>(false);

  toggleDictation = output<void>();
  toggleCollapse = output<void>();

  scrollContainer = viewChild<ElementRef<HTMLDivElement>>('scrollContainer');

  constructor() {
    effect(() => {
      this.messages();
      if (!this.isCollapsed()) {
        setTimeout(() => this.scrollToBottom(), 50);
      }
    });
  }

  private scrollToBottom(): void {
    const el = this.scrollContainer()?.nativeElement;
    if (el) {
      el.scrollTo({
        top: el.scrollHeight,
        behavior: 'smooth'
      });
    }
  }
}
