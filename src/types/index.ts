export interface DocumentInput {
  id: string;
  type: 'document' | 'image' | 'link';
  title: string;
  content: string;
  url?: string;
  uploadedAt: Date;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
}

export interface ChatMessage {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
} 