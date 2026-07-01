export type BookType = 'fairy_tale' | 'science' | 'history' | 'fable' | 'poetry' | 'adventure';

export type ReadingPhase = 'upload' | 'retelling' | 'comprehension' | 'quiz' | 'roleplay' | 'complete';

export interface User {
  id: string;
  nickname: string;
  level: number;
  stars: number;
  coins: number;
  avatar: string;
  outfit?: string;
  streakDays: number;
  totalReadingMinutes: number;
  createdAt: string;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  type: BookType;
  cover: string;
  coverColor: string;
  description: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  totalPages: number;
  sampleContent: string;
  characters?: string[];
}

export interface ReadingSession {
  id: string;
  userId: string;
  bookTitle: string;
  bookType: BookType;
  content: string;
  duration: number;
  comprehensionScore: number;
  expressionScore: number;
  questionsAnswered: number;
  correctAnswers: number;
  rolePlayed?: string;
  createdAt: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  requirement: number;
  type: 'streak' | 'books' | 'quiz' | 'expression';
}

export interface QuizQuestion {
  id: string;
  bookId: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  difficulty: 1 | 2 | 3;
}

export interface ChatMessage {
  id: string;
  role: 'ai' | 'user';
  content: string;
  type: 'text' | 'voice' | 'quiz' | 'roleplay' | 'system';
  timestamp: string;
}

export interface Preference {
  bookType: BookType;
  count: number;
  score: number;
}

export interface RecommendedBook extends Book {
  reason: string;
  matchScore: number;
}

export const bookTypeLabels: Record<BookType, string> = {
  fairy_tale: '童话故事',
  science: '科普百科',
  history: '历史故事',
  fable: '寓言故事',
  poetry: '诗歌童谣',
  adventure: '冒险小说',
};

export const bookTypeEmojis: Record<BookType, string> = {
  fairy_tale: '🏰',
  science: '🔬',
  history: '📜',
  fable: '🦊',
  poetry: '🎵',
  adventure: '🗺️',
};

export const bookTypeColors: Record<BookType, string> = {
  fairy_tale: 'from-pink-200 to-purple-200',
  science: 'from-blue-200 to-cyan-200',
  history: 'from-amber-200 to-orange-200',
  fable: 'from-green-200 to-emerald-200',
  poetry: 'from-rose-200 to-pink-200',
  adventure: 'from-indigo-200 to-blue-200',
};
