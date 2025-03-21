// User profile types
export interface UserProfile {
  id: string;
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  photos: string[];
  bio: string;
  interests: string[];
  location: {
    latitude: number;
    longitude: number;
  };
  lookingFor: 'male' | 'female' | 'both';
  seriousnessScore?: number;
  videoIntro?: string;
  lastActive?: Date;
}

// Match types
export interface Match {
  id: string;
  users: [string, string]; // IDs of the two users
  createdAt: Date;
  messages: Message[];
  isActive: boolean;
}

// Message types
export interface Message {
  id: string;
  senderId: string;
  content: string;
  timestamp: Date;
  isRead: boolean;
  type: 'text' | 'voice' | 'video';
}

// Conversation prompt types
export interface ConversationPrompt {
  id: string;
  text: string;
  category: 'values' | 'goals' | 'lifestyle' | 'personality';
}
