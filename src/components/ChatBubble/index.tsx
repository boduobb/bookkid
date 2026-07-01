import { motion } from 'framer-motion';
import Mascot from '../Mascot';

interface ChatBubbleProps {
  content: string;
  role: 'ai' | 'user';
  type?: 'text' | 'voice' | 'quiz' | 'roleplay' | 'system';
  showAvatar?: boolean;
}

export default function ChatBubble({ content, role, type = 'text', showAvatar = true }: ChatBubbleProps) {
  const isAI = role === 'ai';

  if (type === 'system') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-center my-3"
      >
        <span className="text-xs text-gray-400 bg-white/60 px-4 py-1 rounded-full">
          {content}
        </span>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className={`flex gap-3 items-start ${isAI ? 'justify-start' : 'justify-end'} mb-4`}
    >
      {isAI && showAvatar && (
        <div className="flex-shrink-0">
          <Mascot size="sm" animate={false} />
        </div>
      )}

      <div
        className={`max-w-[75%] px-5 py-3 rounded-2xl shadow-soft ${
          isAI
            ? 'bg-white text-gray-700 rounded-tl-sm'
            : 'bg-gradient-to-r from-mint-300 to-mint-200 text-gray-700 rounded-tr-sm'
        }`}
      >
        {type === 'voice' && (
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">🎙️</span>
            <div className="flex items-end gap-0.5 h-4">
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  className="w-1 bg-mint-400 rounded-full"
                  animate={{ height: ['4px', '12px', '4px'] }}
                  transition={{
                    duration: 0.8,
                    repeat: Infinity,
                    delay: i * 0.1,
                    ease: 'easeInOut',
                  }}
                />
              ))}
            </div>
          </div>
        )}
        {type === 'quiz' && (
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">❓</span>
            <span className="text-sm font-bold text-carrot-400">答题时间</span>
          </div>
        )}
        {type === 'roleplay' && (
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">🎭</span>
            <span className="text-sm font-bold text-lavender-400">角色扮演</span>
          </div>
        )}
        <p className="text-sm leading-relaxed whitespace-pre-line">{content}</p>
      </div>

      {!isAI && showAvatar && (
        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-sky-200 to-sky-300 flex items-center justify-center text-2xl shadow-soft">
          👦
        </div>
      )}
    </motion.div>
  );
}
