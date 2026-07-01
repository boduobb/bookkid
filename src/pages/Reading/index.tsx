import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Camera, Image, Mic, Send, ArrowLeft, Star, Volume2, Sparkles } from 'lucide-react';
import { useReadingStore } from '../../store/useReadingStore';
import { useUserStore } from '../../store/useUserStore';
import { mockBooks } from '../../mock/books';
import { bookTypeLabels } from '../../types';
import ChatBubble from '../../components/ChatBubble';
import Mascot from '../../components/Mascot';
import ProgressBar from '../../components/ProgressBar';
import Layout from '../../components/Layout';

const phaseLabels: Record<string, string> = {
  upload: '上传书籍',
  retelling: '故事复述',
  comprehension: '理解主旨',
  quiz: '答题闯关',
  roleplay: '角色扮演',
  complete: '阅读完成',
};

const phaseOrder = ['upload', 'retelling', 'comprehension', 'quiz', 'roleplay', 'complete'];

export default function Reading() {
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [selectedBookForUpload, setSelectedBookForUpload] = useState<string | null>(null);
  const [showCompleteModal, setShowCompleteModal] = useState(false);

  const {
    currentBook,
    phase,
    messages,
    quizzes,
    currentQuizIndex,
    setCurrentBook,
    setPhase,
    startRetelling,
    sendUserMessage,
    startComprehension,
    startQuiz,
    answerQuiz,
    startRoleplay,
    completeReading,
    resetReading,
  } = useReadingStore();

  const { addStars, addCoins, addReadingSession, updatePreference, addStreak } = useUserStore();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSelectBook = (bookId: string) => {
    const book = mockBooks.find((b) => b.id === bookId);
    if (book) {
      setSelectedBookForUpload(bookId);
      setCurrentBook(book);
    }
  };

  const handleStartReading = () => {
    if (currentBook) {
      startRetelling();
    }
  };

  const handleSendMessage = () => {
    if (!inputText.trim()) return;
    sendUserMessage(inputText.trim());
    setInputText('');
  };

  const handleQuizAnswer = (optionIndex: number) => {
    const isCorrect = answerQuiz(optionIndex);
    if (isCorrect) {
      addStars(5);
      addCoins(2);
    }

    if (currentQuizIndex + 1 >= quizzes.length) {
      setTimeout(() => {
        setPhase('roleplay');
      }, 2000);
    }
  };

  const handleComplete = () => {
    const result = completeReading();
    const sessionData = {
      id: `session-${Date.now()}`,
      userId: 'user-1',
      bookTitle: currentBook?.title || '',
      bookType: currentBook?.type || 'fairy_tale',
      content: currentBook?.sampleContent || '',
      duration: result.duration,
      comprehensionScore: result.comprehensionScore,
      expressionScore: 80,
      questionsAnswered: quizzes.length,
      correctAnswers: result.correctAnswers,
      createdAt: new Date().toISOString(),
    };

    addReadingSession(sessionData);
    updatePreference(currentBook?.type || 'fairy_tale', result.comprehensionScore);
    addStars(10);
    addCoins(5);
    addStreak();
    setShowCompleteModal(true);
  };

  const handleCloseComplete = () => {
    setShowCompleteModal(false);
    resetReading();
    navigate('/');
  };

  const currentPhaseIndex = phaseOrder.indexOf(phase);

  const getCurrentQuiz = () => {
    if (phase !== 'quiz' || quizzes.length === 0) return null;
    return quizzes[currentQuizIndex];
  };

  const currentQuiz = getCurrentQuiz();

  if (phase === 'upload') {
    return (
      <Layout showNav={false}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="flex items-center gap-4">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-full bg-white shadow-soft flex items-center justify-center"
            >
              <ArrowLeft size={20} className="text-gray-600" />
            </motion.button>
            <h1 className="text-xl font-bold text-gray-800">开始阅读</h1>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-soft">
            <div className="flex justify-center mb-6">
              <Mascot size="xl" mood="happy" />
            </div>
            <h2 className="text-lg font-bold text-center text-gray-800 mb-2">
              你今天读了什么书呀？
            </h2>
            <p className="text-sm text-center text-gray-500 mb-6">
              拍一张书页照片，或者从下面选一本书吧～
            </p>

            <div className="flex gap-3 mb-6">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 bg-gradient-to-br from-mint-100 to-mint-200 rounded-xl3 p-4 flex flex-col items-center gap-2"
              >
                <Camera size={32} className="text-mint-500" />
                <span className="text-sm font-bold text-gray-700">拍照上传</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 bg-gradient-to-br from-sky-100 to-sky-200 rounded-xl3 p-4 flex flex-col items-center gap-2"
              >
                <Image size={32} className="text-sky-500" />
                <span className="text-sm font-bold text-gray-700">相册选择</span>
              </motion.button>
            </div>

            <div className="relative flex items-center gap-2 my-4">
              <div className="flex-1 h-px bg-gray-200"></div>
              <span className="text-xs text-gray-400 px-2">或从书架选择</span>
              <div className="flex-1 h-px bg-gray-200"></div>
            </div>

            <div className="grid grid-cols-4 gap-3 max-h-60 overflow-y-auto scrollbar-hide">
              {mockBooks.map((book) => (
                <motion.div
                  key={book.id}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleSelectBook(book.id)}
                  className={`aspect-[3/4] rounded-xl flex items-center justify-center text-3xl cursor-pointer transition-all ${
                    selectedBookForUpload === book.id
                      ? 'ring-4 ring-mint-300 shadow-lg scale-105'
                      : 'shadow-soft hover:shadow-md'
                  } bg-gradient-to-br ${book.coverColor}`}
                >
                  {book.cover}
                </motion.div>
              ))}
            </div>

            {selectedBookForUpload && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 p-4 bg-mint-50 rounded-xl"
              >
                <p className="text-sm font-bold text-gray-700 mb-1">
                  {mockBooks.find((b) => b.id === selectedBookForUpload)?.title}
                </p>
                <p className="text-xs text-gray-500 mb-3">
                  {bookTypeLabels[mockBooks.find((b) => b.id === selectedBookForUpload)?.type || 'fairy_tale']}
                </p>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleStartReading}
                  className="w-full bg-gradient-to-r from-mint-300 to-mint-400 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 shadow-soft"
                >
                  <Sparkles size={18} />
                  开始互动阅读
                </motion.button>
              </motion.div>
            )}
          </div>
        </motion.div>
      </Layout>
    );
  }

  return (
    <Layout showNav={false}>
      <div className="fixed inset-0 flex flex-col bg-gradient-to-b from-cream-50 to-mint-50">
        <div className="bg-white/80 backdrop-blur-lg border-b border-gray-100 px-4 py-3 z-10">
          <div className="max-w-md mx-auto flex items-center gap-3">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate(-1)}
              className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center"
            >
              <ArrowLeft size={18} className="text-gray-600" />
            </motion.button>
            <div className="flex-1">
              <p className="text-sm font-bold text-gray-800">{currentBook?.title}</p>
              <div className="flex gap-1 mt-1">
                {phaseOrder.slice(0, 5).map((p, i) => (
                  <div
                    key={p}
                    className={`flex-1 h-1 rounded-full transition-colors duration-300 ${
                      i <= currentPhaseIndex ? 'bg-mint-400' : 'bg-gray-200'
                    }`}
                  />
                ))}
              </div>
            </div>
            <div className="flex items-center gap-1 text-amber-500">
              <Star size={16} fill="currentColor" />
              <span className="text-sm font-bold">{useUserStore.getState().user.stars}</span>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 pt-20 pb-28">
          <div className="max-w-md mx-auto">
            {messages.map((msg) => (
              <ChatBubble key={msg.id} content={msg.content} role={msg.role} type={msg.type} />
            ))}

            {phase === 'quiz' && currentQuiz && messages[messages.length - 1]?.type === 'quiz' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 ml-15"
              >
                <div className="space-y-2">
                  {currentQuiz.options.map((option, index) => (
                    <motion.button
                      key={index}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleQuizAnswer(index)}
                      className="w-full text-left p-4 bg-white rounded-xl shadow-soft hover:shadow-md transition-shadow border-2 border-transparent hover:border-mint-200"
                    >
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-mint-100 text-mint-600 text-sm font-bold mr-3">
                        {String.fromCharCode(65 + index)}
                      </span>
                      <span className="text-sm text-gray-700">{option}</span>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}

            {phase === 'comprehension' && messages[messages.length - 1]?.role === 'ai' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-2 mb-4 ml-15"
              >
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    const msg = {
                      id: Date.now().toString(),
                      role: 'user' as const,
                      content: '听懂啦！😊',
                      type: 'text' as const,
                      timestamp: new Date().toISOString(),
                    };
                    useReadingStore.getState().addMessage(msg);
                    setTimeout(() => startQuiz(), 800);
                  }}
                  className="flex-1 bg-mint-200 text-mint-700 font-bold py-3 rounded-xl"
                >
                  👍 听懂啦！
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    const msg = {
                      id: Date.now().toString(),
                      role: 'user' as const,
                      content: '还不太懂，能再讲一遍吗？',
                      type: 'text' as const,
                      timestamp: new Date().toISOString(),
                    };
                    useReadingStore.getState().addMessage(msg);
                    const aiMsg = {
                      id: (Date.now() + 1).toString(),
                      role: 'ai' as const,
                      content: `没关系～ 我再简单说一遍哦！\n\n简单来说，就是${currentBook?.description?.slice(0, 50)}...\n\n这次听懂了吗？`,
                      type: 'text' as const,
                      timestamp: new Date().toISOString(),
                    };
                    setTimeout(() => {
                      useReadingStore.getState().addMessage(aiMsg);
                    }, 500);
                  }}
                  className="flex-1 bg-peach-200 text-peach-700 font-bold py-3 rounded-xl"
                >
                  🤔 再讲一遍
                </motion.button>
              </motion.div>
            )}

            {phase === 'retelling' && messages.length > 2 && messages[messages.length - 1]?.role === 'ai' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-center mb-4"
              >
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => startComprehension()}
                  className="bg-gradient-to-r from-sky-300 to-sky-400 text-white font-bold py-2.5 px-6 rounded-full shadow-soft text-sm flex items-center gap-2"
                >
                  我讲完啦！下一步 →
                </motion.button>
              </motion.div>
            )}

            {phase === 'roleplay' && currentBook?.characters && currentBook.characters.length > 0 && messages[messages.length - 1]?.role === 'ai' && messages[messages.length - 1]?.type !== 'roleplay' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4"
              >
                <p className="text-sm text-gray-500 mb-3 text-center">选择你想扮演的角色～</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {currentBook.characters.map((char) => (
                    <motion.button
                      key={char}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => startRoleplay(char)}
                      className="px-4 py-2 bg-white rounded-full shadow-soft text-sm font-bold text-gray-700 border-2 border-lavender-200 hover:border-lavender-400 hover:bg-lavender-50 transition-colors"
                    >
                      🎭 {char}
                    </motion.button>
                  ))}
                </div>
                <div className="flex justify-center mt-4">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleComplete}
                    className="text-sm text-gray-400 underline"
                  >
                    跳过角色扮演，完成阅读
                  </motion.button>
                </div>
              </motion.div>
            )}

            {(phase === 'roleplay') && messages[messages.length - 1]?.type === 'roleplay' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-center mb-4"
              >
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleComplete}
                  className="bg-gradient-to-r from-cream-300 to-cream-400 text-white font-bold py-2.5 px-6 rounded-full shadow-soft text-sm flex items-center gap-2"
                >
                  <Star size={16} fill="white" />
                  完成阅读，领取奖励
                </motion.button>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-gray-100 px-4 py-3 z-10">
            <div className="max-w-md mx-auto flex items-end gap-2">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsRecording(!isRecording)}
                className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 ${
                  isRecording
                    ? 'bg-red-400 text-white animate-pulse'
                    : 'bg-gray-100 text-gray-500'
                }`}
              >
                <Mic size={20} />
              </motion.button>

              <div className="flex-1 relative">
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder={isRecording ? '正在录音...' : '输入你想说的话...'}
                  rows={1}
                  className="w-full px-4 py-2.5 pr-12 bg-gray-100 rounded-full text-sm resize-none focus:outline-none focus:ring-2 focus:ring-mint-300"
                  style={{ maxHeight: '100px' }}
                />
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  className="absolute right-1 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-mint-400 text-white flex items-center justify-center"
                  onClick={handleSendMessage}
                >
                  <Send size={16} />
                </motion.button>
              </div>

              <motion.button
                whileTap={{ scale: 0.9 }}
                className="w-11 h-11 rounded-full bg-sky-100 text-sky-500 flex items-center justify-center flex-shrink-0"
              >
                <Volume2 size={20} />
              </motion.button>
            </div>
          </div>

        <AnimatePresence>
          {showCompleteModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-6"
            >
              <motion.div
                initial={{ scale: 0.8, y: 50 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.8, y: 50 }}
                className="bg-white rounded-3xl p-6 w-full max-w-sm text-center relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-cream-200 to-transparent" />

                <motion.div
                  animate={{
                    rotate: [0, -10, 10, -10, 0],
                    scale: [1, 1.1, 1],
                  }}
                  transition={{ duration: 1, repeat: Infinity, repeatDelay: 1 }}
                  className="relative z-10 flex justify-center mb-4"
                >
                  <div className="text-6xl">🎉</div>
                </motion.div>

                <h2 className="text-xl font-bold text-gray-800 mb-2 relative z-10">
                  太棒啦！阅读完成！
                </h2>
                <p className="text-sm text-gray-500 mb-6 relative z-10">
                  你今天表现得真出色！继续保持哦～
                </p>

                <div className="grid grid-cols-3 gap-4 mb-6 relative z-10">
                  <div className="bg-amber-50 rounded-xl p-3">
                    <div className="text-2xl mb-1">⭐</div>
                    <div className="text-lg font-bold text-amber-500">+15</div>
                    <div className="text-xs text-gray-400">星星</div>
                  </div>
                  <div className="bg-yellow-50 rounded-xl p-3">
                    <div className="text-2xl mb-1">🪙</div>
                    <div className="text-lg font-bold text-yellow-600">+8</div>
                    <div className="text-xs text-gray-400">金币</div>
                  </div>
                  <div className="bg-red-50 rounded-xl p-3">
                    <div className="text-2xl mb-1">🔥</div>
                    <div className="text-lg font-bold text-red-500">+1</div>
                    <div className="text-xs text-gray-400">连续天数</div>
                  </div>
                </div>

                <div className="space-y-2 mb-6 text-left relative z-10">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">理解能力</span>
                    <span className="font-bold text-mint-500">
                      {quizzes.length > 0 ? Math.round((useReadingStore.getState().correctAnswers / quizzes.length) * 100) : 85}分
                    </span>
                  </div>
                  <ProgressBar
                    value={quizzes.length > 0 ? (useReadingStore.getState().correctAnswers / quizzes.length) * 100 : 85}
                    max={100}
                    color="mint"
                    size="sm"
                  />
                  <div className="flex justify-between text-sm mt-2">
                    <span className="text-gray-500">阅读时长</span>
                    <span className="font-bold text-sky-500">
                      {completeReading().duration} 分钟
                    </span>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCloseComplete}
                  className="w-full bg-gradient-to-r from-mint-300 to-mint-400 text-white font-bold py-3 rounded-xl shadow-soft relative z-10"
                >
                  太棒了！
                </motion.button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
}
