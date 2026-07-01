import { create } from 'zustand';
import { ChatMessage, ReadingPhase, Book, QuizQuestion } from '../types';
import { getAIResponse, generateRetellingFollowUp } from '../mock/aiResponses';
import { getQuizzesByBookId } from '../mock/quizzes';

interface ReadingState {
  currentBook: Book | null;
  phase: ReadingPhase;
  messages: ChatMessage[];
  currentQuizIndex: number;
  quizzes: QuizQuestion[];
  correctAnswers: number;
  startTime: number | null;
  selectedRole: string | null;
  setCurrentBook: (book: Book) => void;
  setPhase: (phase: ReadingPhase) => void;
  addMessage: (message: ChatMessage) => void;
  startRetelling: () => void;
  sendUserMessage: (content: string) => void;
  startComprehension: () => void;
  startQuiz: () => void;
  answerQuiz: (optionIndex: number) => boolean;
  startRoleplay: (role: string) => void;
  completeReading: () => { duration: number; comprehensionScore: number; correctAnswers: number };
  resetReading: () => void;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

export const useReadingStore = create<ReadingState>((set, get) => ({
  currentBook: null,
  phase: 'upload',
  messages: [],
  currentQuizIndex: 0,
  quizzes: [],
  correctAnswers: 0,
  startTime: null,
  selectedRole: null,

  setCurrentBook: (book) => {
    set({
      currentBook: book,
      phase: 'upload',
      messages: [],
      currentQuizIndex: 0,
      quizzes: [],
      correctAnswers: 0,
      startTime: Date.now(),
      selectedRole: null,
    });
  },

  setPhase: (phase) => set({ phase }),

  addMessage: (message) => {
    set((state) => ({
      messages: [...state.messages, message],
    }));
  },

  startRetelling: () => {
    const { currentBook } = get();
    if (!currentBook) return;

    const greeting = getAIResponse(currentBook.type, 'greeting');
    const retellingPrompt = getAIResponse(currentBook.type, 'retelling');

    const greetingMsg: ChatMessage = {
      id: generateId(),
      role: 'ai',
      content: greeting,
      type: 'text',
      timestamp: new Date().toISOString(),
    };

    const promptMsg: ChatMessage = {
      id: generateId(),
      role: 'ai',
      content: retellingPrompt,
      type: 'text',
      timestamp: new Date().toISOString(),
    };

    set({
      phase: 'retelling',
      messages: [greetingMsg, promptMsg],
    });
  },

  sendUserMessage: (content) => {
    const { currentBook, phase } = get();
    if (!currentBook) return;

    const userMsg: ChatMessage = {
      id: generateId(),
      role: 'user',
      content,
      type: 'text',
      timestamp: new Date().toISOString(),
    };

    let aiResponse: string;
    if (phase === 'retelling') {
      aiResponse = generateRetellingFollowUp(currentBook.type, content);
    } else if (phase === 'roleplay' && get().selectedRole) {
      aiResponse = `（扮演${get().selectedRole}）哇，你说得真好！接下来我们要做什么呢？`;
    } else {
      aiResponse = getAIResponse(currentBook.type, 'encouragement');
    }

    const aiMsg: ChatMessage = {
      id: generateId(),
      role: 'ai',
      content: aiResponse,
      type: 'text',
      timestamp: new Date().toISOString(),
    };

    set((state) => ({
      messages: [...state.messages, userMsg, aiMsg],
    }));
  },

  startComprehension: () => {
    const { currentBook } = get();
    if (!currentBook) return;

    const comprehensionMsg: ChatMessage = {
      id: generateId(),
      role: 'ai',
      content: `好啦～ 我来给你总结一下这个故事的主要意思吧！\n\n《${currentBook.title}》这个故事主要讲的是${currentBook.description}\n\n你听懂了吗？`,
      type: 'text',
      timestamp: new Date().toISOString(),
    };

    set({
      phase: 'comprehension',
      messages: [...get().messages, comprehensionMsg],
    });
  },

  startQuiz: () => {
    const { currentBook } = get();
    if (!currentBook) return;

    const quizzes = getQuizzesByBookId(currentBook.id);
    if (quizzes.length === 0) {
      set({ phase: 'complete' });
      return;
    }

    const introMsg: ChatMessage = {
      id: generateId(),
      role: 'ai',
      content: getAIResponse(currentBook.type, 'quizIntro'),
      type: 'text',
      timestamp: new Date().toISOString(),
    };

    const quizMsg: ChatMessage = {
      id: generateId(),
      role: 'ai',
      content: quizzes[0].question,
      type: 'quiz',
      timestamp: new Date().toISOString(),
    };

    set({
      phase: 'quiz',
      quizzes,
      currentQuizIndex: 0,
      correctAnswers: 0,
      messages: [...get().messages, introMsg, quizMsg],
    });
  },

  answerQuiz: (optionIndex) => {
    const { quizzes, currentQuizIndex, currentBook, correctAnswers } = get();
    if (!currentBook || currentQuizIndex >= quizzes.length) return false;

    const currentQuiz = quizzes[currentQuizIndex];
    const isCorrect = optionIndex === currentQuiz.correctIndex;

    const responseMsg: ChatMessage = {
      id: generateId(),
      role: 'ai',
      content: isCorrect
        ? `${getAIResponse(currentBook.type, 'correctAnswer')}\n\n${currentQuiz.explanation}`
        : `${getAIResponse(currentBook.type, 'wrongAnswer')}\n\n正确答案是：${currentQuiz.options[currentQuiz.correctIndex]}\n${currentQuiz.explanation}`,
      type: 'text',
      timestamp: new Date().toISOString(),
    };

    const newCorrect = isCorrect ? correctAnswers + 1 : correctAnswers;
    const nextIndex = currentQuizIndex + 1;

    if (nextIndex < quizzes.length) {
      const nextQuizMsg: ChatMessage = {
        id: generateId(),
        role: 'ai',
        content: quizzes[nextIndex].question,
        type: 'quiz',
        timestamp: new Date().toISOString(),
      };
      set((state) => ({
        messages: [...state.messages, responseMsg, nextQuizMsg],
        currentQuizIndex: nextIndex,
        correctAnswers: newCorrect,
      }));
    } else {
      const completeMsg: ChatMessage = {
        id: generateId(),
        role: 'ai',
        content: `太棒啦！答题闯关完成！🎉\n\n你一共答对了 ${newCorrect}/${quizzes.length} 道题，获得了 ${newCorrect * 5} 颗星星奖励！⭐`,
        type: 'text',
        timestamp: new Date().toISOString(),
      };
      set((state) => ({
        messages: [...state.messages, responseMsg, completeMsg],
        correctAnswers: newCorrect,
      }));
    }

    return isCorrect;
  },

  startRoleplay: (role) => {
    const { currentBook } = get();
    if (!currentBook) return;

    const roleplayMsg: ChatMessage = {
      id: generateId(),
      role: 'ai',
      content: `好呀好呀！我来当${role}！🎭\n\n（扮演${role}的语气）嘿，你好呀！我们一起来演故事吧～ 你想从哪里开始呢？`,
      type: 'roleplay',
      timestamp: new Date().toISOString(),
    };

    set({
      phase: 'roleplay',
      selectedRole: role,
      messages: [...get().messages, roleplayMsg],
    });
  },

  completeReading: () => {
    const { startTime, currentBook, quizzes, correctAnswers } = get();
    const duration = startTime ? Math.round((Date.now() - startTime) / 60000) : 10;
    const comprehensionScore = quizzes.length > 0 ? Math.round((correctAnswers / quizzes.length) * 100) : 80;

    return {
      duration,
      comprehensionScore,
      correctAnswers,
    };
  },

  resetReading: () => {
    set({
      currentBook: null,
      phase: 'upload',
      messages: [],
      currentQuizIndex: 0,
      quizzes: [],
      correctAnswers: 0,
      startTime: null,
      selectedRole: null,
    });
  },
}));
