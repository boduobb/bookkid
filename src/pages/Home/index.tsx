import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Flame, Star, Coins, Play, ChevronRight } from 'lucide-react';
import { useUserStore } from '../../store/useUserStore';
import { mockBooks } from '../../mock/books';
import { mockAchievements } from '../../mock/achievements';
import Mascot from '../../components/Mascot';
import BookCard from '../../components/BookCard';
import Badge from '../../components/Badge';
import ProgressBar from '../../components/ProgressBar';
import Layout from '../../components/Layout';

const greeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return '早上好呀';
  if (hour < 18) return '下午好呀';
  return '晚上好呀';
};

export default function Home() {
  const navigate = useNavigate();
  const { user, unlockedAchievementIds } = useUserStore();
  const recommendedBook = mockBooks[0];
  const recentBooks = mockBooks.slice(0, 4);
  const achievements = mockAchievements.slice(0, 6);

  const startReading = () => {
    navigate('/reading');
  };

  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">{greeting()}～</p>
            <h1 className="text-2xl font-bold text-gray-800 mt-1">
              {user.nickname} 👋
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <motion.div
              whileHover={{ scale: 1.1 }}
              className="flex items-center gap-1 bg-white/80 px-3 py-1.5 rounded-full shadow-soft"
            >
              <Star size={16} className="text-amber-400 fill-amber-400" />
              <span className="text-sm font-bold text-gray-700">{user.stars}</span>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.1 }}
              className="flex items-center gap-1 bg-white/80 px-3 py-1.5 rounded-full shadow-soft"
            >
              <Coins size={16} className="text-amber-500" />
              <span className="text-sm font-bold text-gray-700">{user.coins}</span>
            </motion.div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-cream-100 via-cream-200 to-mint-100 rounded-3xl p-5 shadow-soft-lg relative overflow-hidden"
        >
          <div className="absolute top-2 right-4 text-6xl opacity-20">📚</div>
          <div className="absolute bottom-2 left-2 text-4xl opacity-20">✨</div>

          <div className="flex items-start gap-4">
            <Mascot size="lg" mood="happy" />
            <div className="flex-1">
              <h2 className="text-lg font-bold text-gray-800 mb-1">
                今天也要开心阅读哦！
              </h2>
              <p className="text-sm text-gray-600 mb-3">
                已连续阅读 <span className="font-bold text-orange-500">{user.streakDays}</span> 天啦，继续加油！
              </p>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Lv.{user.level}</span>
                <div className="flex-1 max-w-32">
                  <ProgressBar value={user.stars % 50} max={50} color="cream" size="sm" />
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl p-5 shadow-soft"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <span>📖</span> 今日推荐
            </h3>
            <span className="text-xs text-gray-400 bg-mint-50 px-2 py-1 rounded-full">
              为你精选
            </span>
          </div>

          <div className="flex gap-4">
            <BookCard book={recommendedBook} size="md" onClick={startReading} />
            <div className="flex-1 flex flex-col justify-between py-2">
              <div>
                <h4 className="font-bold text-gray-800 mb-1">{recommendedBook.title}</h4>
                <p className="text-xs text-gray-500 line-clamp-2">
                  {recommendedBook.description}
                </p>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={startReading}
                className="w-full bg-gradient-to-r from-mint-300 to-mint-400 text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-soft"
              >
                <Play size={16} fill="white" />
                开始阅读
              </motion.button>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <span>📚</span> 我的书架
            </h3>
            <button
              onClick={() => navigate('/records')}
              className="text-sm text-mint-500 flex items-center gap-1"
            >
              查看全部 <ChevronRight size={16} />
            </button>
          </div>
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4">
            {recentBooks.map((book, index) => (
              <motion.div
                key={book.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                onClick={startReading}
              >
                <BookCard
                  book={book}
                  size="sm"
                  progress={Math.floor(Math.random() * 80) + 10}
                />
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-2xl p-5 shadow-soft"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <span>🏆</span> 成就勋章
            </h3>
            <span className="text-xs text-gray-400">
              {unlockedAchievementIds.length}/{mockAchievements.length} 已获得
            </span>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {achievements.map((achievement, index) => (
              <motion.div
                key={achievement.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 + index * 0.05 }}
              >
                <Badge
                  icon={achievement.icon}
                  name={achievement.name}
                  description={achievement.description}
                  unlocked={unlockedAchievementIds.includes(achievement.id)}
                  size="md"
                />
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-gradient-to-r from-lavender-100 to-sky-100 rounded-2xl p-5 shadow-soft"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-gray-800 mb-1">🔥 今日阅读目标</h3>
              <p className="text-sm text-gray-600">
                已读 {Math.floor(user.totalReadingMinutes % 60)}/20 分钟
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Flame size={32} className="text-orange-400" />
              <span className="text-2xl font-bold text-orange-500">{user.streakDays}</span>
            </div>
          </div>
          <div className="mt-3">
            <ProgressBar
              value={Math.floor(user.totalReadingMinutes % 60)}
              max={20}
              color="carrot"
              size="md"
            />
          </div>
        </motion.div>
      </motion.div>
    </Layout>
  );
}
