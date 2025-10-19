export enum Page {
  Dashboard = 'DASHBOARD',
  WeeklyView = 'WEEKLY_VIEW',
  Chatbot = 'CHATBOT',
}

export interface Medicine {
  id: string;
  name: string;
  description: string;
  activeIngredients: string[];
  interactions: string[];
  dosage: string;
  imageUrl?: string;
  icon?: string; // e.g., 'tablet', 'capsule'
}

export interface Reminder {
  id: string;
  medicineId: string;
  medicineName: string;
  day: number; // 0 for Sunday, 1 for Monday, etc.
  time: string; // e.g., "08:00"
}

export interface AdherenceLog {
  reminderId: string;
  date: string; // YYYY-MM-DD
  status: 'taken' | 'skipped';
}

export interface ChatMessage {
  sender: 'user' | 'ai';
  text: string;
}
