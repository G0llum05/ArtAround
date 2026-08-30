import { Component, input, output, signal, ElementRef, viewChild, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatMessage } from '../../models/appModel/chatMessage';

@Component({
  selector: 'app-group-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './group-chat.html',
  styleUrl: './group-chat.css'
})
export class GroupChat {
  isOpen = input<boolean>(false);
  messages = input<ChatMessage[]>([]);
  currentUserId = input<string>('');
  sessionCode = input<string>('');
  isTeacher = input<boolean>(false);

  closeDrawer = output<void>();
  sendMessage = output<string>();

  typedText = signal<string>('');

  scrollContainer = viewChild<ElementRef<HTMLDivElement>>('scrollContainer');

  constructor() {
    effect(() => {
      this.messages();
      if (this.isOpen()) {
        setTimeout(() => this.scrollToBottom(), 50);
      }
    });

    effect(() => {
      if (this.isOpen()) {
        setTimeout(() => this.scrollToBottom(), 50);
      }
    });
  }

  onSend(): void {
    const text = this.typedText().trim();
    if (!text) return;
    this.sendMessage.emit(text);
    this.typedText.set('');
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.onSend();
    }
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
