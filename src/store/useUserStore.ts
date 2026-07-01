import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, ReadingSession, Preference, BookType } from '../types';

interface UserState {
  user: User;
  readingSessions: ReadingSession[];
  unlockedAchievementIds: string[];
  preferences: Preference[];
  addReadingSession: (session: ReadingSession) => void;
  addStars: (count: number) => void;
  addCoins: (count: number) => void;
  addStreak: () => void;
  unlockAchievement: (id: string) => void;
  updatePreference: (bookType: BookType, score: number) => void;
  resetUser: () => void;
}

const initialUser: User = {
  id: 'user-1',
  nickname: '小书虫',
  level: 1,
  stars: 15,
  coins: 50,
  avatar: '🦉',
  outfit: 'default',
  streakDays: 3,
  totalReadingMinutes: 120,
  createdAt: new Date().toISOString(),
};

const initialSessions: ReadingSession[] = [
  {
    id: 'session-1',
    userId: 'user-1',
    bookTitle: '小红帽',
    bookType: 'fairy_tale',
    content: '从前有个可爱的小姑娘...',
    duration: 15,
    comprehensionScore: 85,
    expressionScore: 78,
    questionsAnswered: 3,
    correctAnswers: 2,
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'session-2',
    userId: 'user-1',
    bookTitle: '龟兔赛跑',
    bookType: 'fable',
    content: '森林里住着一只兔子和一只乌龟...',
    duration: 12,
    comprehensionScore: 90,
    expressionScore: 82,
    questionsAnswered: 3,
    correctAnswers: 3,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'session-3',
    userId: 'user-1',
    bookTitle: '司马光砸缸',
    bookType: 'history',
    content: '北宋时期，有个叫司马光的孩子...',
    duration: 10,
    comprehensionScore: 88,
    expressionScore: 75,
    questionsAnswered: 2,
    correctAnswers: 2,
    createdAt: new Date().toISOString(),
  },
];

const initialPreferences: Preference[] = [
  { bookType: 'fairy_tale', count: 1, score: 85 },
  { bookType: 'fable', count: 1, score: 90 },
  { bookType: 'history', count: 1, score: 88 },
  { bookType: 'science', count: 0, score: 0 },
  { bookType: 'poetry', count: 0, score: 0 },
  { bookType: 'adventure', count: 0, score: 0 },
];

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      user: initialUser,
      readingSessions: initialSessions,
      unlockedAchievementIds: ['1', '3'],
      preferences: initialPreferences,

      addReadingSession: (session) => {
        set((state) => ({
          readingSessions: [...state.readingSessions, session],
          user: {
            ...state.user,
            totalReadingMinutes: state.user.totalReadingMinutes + session.duration,
          },
        }));
      },

      addStars: (count) => {
        set((state) => {
          const newStars = state.user.stars + count;
          const newLevel = Math.floor(newStars / 50) + 1;
          return {
            user: {
              ...state.user,
              stars: newStars,
              level: newLevel,
            },
          };
        });
      },

      addCoins: (count) => {
        set((state) => ({
          user: {
            ...state.user,
            coins: state.user.coins + count,
          },
        }));
      },

      addStreak: () => {
        set((state) => ({
          user: {
            ...state.user,
            streakDays: state.user.streakDays + 1,
          },
        }));
      },

      unlockAchievement: (id) => {
        set((state) => {
          if (state.unlockedAchievementIds.includes(id)) return state;
          return {
            unlockedAchievementIds: [...state.unlockedAchievementIds, id],
          };
        });
      },

      updatePreference: (bookType, score) => {
        set((state) => {
          const newPrefs = state.preferences.map((p) =>
            p.bookType === bookType
              ? {
                  ...p,
                  count: p.count + 1,
                  score: Math.round((p.score * p.count + score) / (p.count + 1)),
                }
              : p
          );
          return { preferences: newPrefs };
        });
      },

      resetUser: () => {
        set({
          user: initialUser,
          readingSessions: [],
          unlockedAchievementIds: [],
          preferences: initialPreferences.map(p => ({ ...p, count: 0, score: 0 })),
        });
      },
    }),
    {
      name: 'reading-buddy-user-store',
    }
  )
);
