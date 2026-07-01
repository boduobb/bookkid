import { motion } from 'framer-motion';
import { Book, bookTypeLabels, bookTypeEmojis } from '../../types';

interface BookCardProps {
  book: Book;
  progress?: number;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
}

export default function BookCard({ book, progress = 0, onClick, size = 'md' }: BookCardProps) {
  const sizeClasses = {
    sm: 'w-24 h-32',
    md: 'w-32 h-44',
    lg: 'w-40 h-56',
  };

  const emojiSize = {
    sm: 'text-3xl',
    md: 'text-5xl',
    lg: 'text-6xl',
  };

  return (
    <motion.div
      whileHover={{ y: -6, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`${sizeClasses[size]} relative rounded-xl3 shadow-soft cursor-pointer overflow-hidden flex flex-col`}
    >
      <div className={`flex-1 bg-gradient-to-br ${book.coverColor} flex items-center justify-center`}>
        <span className={emojiSize[size]}>{book.cover}</span>
      </div>

      <div className="bg-white px-3 py-2">
        <p className="text-xs font-bold text-gray-700 truncate">{book.title}</p>
        <div className="flex items-center justify-between mt-1">
          <span className="text-[10px] text-gray-400">
            {bookTypeEmojis[book.type]} {bookTypeLabels[book.type]}
          </span>
          <span className="text-[10px] text-amber-400">
            {'⭐'.repeat(book.difficulty)}
          </span>
        </div>
      </div>

      {progress > 0 && (
        <div className="absolute bottom-12 left-0 right-0 h-1 bg-white/50">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="h-full bg-mint-400 rounded-r-full"
          />
        </div>
      )}
    </motion.div>
  );
}
