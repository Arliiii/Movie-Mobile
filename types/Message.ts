export interface Message {
  id: string;
  text: string;
  role: 'user' | 'assistant' | 'system';
  timestamp: Date;
  isError?: boolean;
  imageUrl?: string;
  metadata?: {
    [key: string]: any;  // For future extensibility like movie data, links, etc.
  };
}