export interface ChatMessage {
  sender: 'user' | 'ai' | 'group';
  text: string;
  senderName?: string;
  senderRole?: 'teacher' | 'student' | 'museumstaff' | 'admin' | string;
  senderId?: string;
  type?: 'text' | 'audio';
  createdAt?: string | Date;
}

