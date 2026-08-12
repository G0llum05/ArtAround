export interface ChatMessage {
  sender: 'user' | 'ai';
  text: string;
  type?: 'text' | 'audio';
}

