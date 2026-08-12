import { Component, input, output, computed, signal} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatMessage } from '../../models/appModel/chatMessage';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat.html',
  styleUrl: './chat.css'
})
export class Chat {
  // Riceve la cronologia dei messaggi dal padre
  messages = input<ChatMessage[]>([]);
  isDictating = input<boolean>(false);

  chatText = signal<string>('');

  // Output verso il padre per gestire il click sul microfono o l'invio
  toggleDictation = output<void>();
  sendText = output<string>();

  onActionButtonClick(): void {
    const text = this.chatText().trim();
    if (text.length > 0) {
      this.sendText.emit(text);
    } else {
      this.toggleDictation.emit();
    }
  }

  remainingChars = computed(() => 200 - (this.chatText()?.length || 0));
}
