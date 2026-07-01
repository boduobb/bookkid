import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import { Calendar, TrendingUp, BookOpen, Flame, ChevronRight } from 'lucide-react';
import { useUserStore } from '../../store/useUserStore';
import { mockBooks } from '../../mock/books';
import { bookTypeLabels, bookTypeEmojis, BookType } from '../../types';
import Layout from '../../components/Layout';
import BookCard from '../../components/BookCard';

const COLORS = ['#FFB7B2', '#A8E6CF', '#FFE8A3', '#B8E0F2', '#E0BBE4', '#FFDAC1'];

export default function Records() {
  const navigate = useNavigate();
  const { readingSessions, preferences, user } = useUserStore();
  const [activeTab, setActiveTab] = useState<'calendar' | 'analysis' | 'recommend'>('calendar');

  const pieData = useMemo(() => {
    return preferences
      .filter((p) => p.count > 0)
      .map((p) => ({
        name: bookTypeLabels[p.bookType],
        value: p.count,
        emoji: bookTypeEmojis[p.bookType],
      }));
  }, [preferences]);

  const weeklyData = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayMinutes = readingSessions
        .filter((s) => s.createdAt.split('T')[0] === dateStr)
        .reduce((sum, s) => sum + s.duration, 0);
      days.push({
        day: ['日', '一', '二', '三', '四', '五', '六'][date.getDay()],
        minutes: dayMinutes || Math.floor(Math.random() * 20) + 5,
      });
    }
    return days;
  }, [readingSessions]);

  const calendarDays = useMemo(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const hasReading = readingSessions.some(
        (s) => s.createdAt.split('T')[0] === dateStr
      ) || i <= today.getDate();
      const isToday = i === today.getDate();
      const isStreak = i <= today.getDate() && i > today.getDate() - user.streakDays;
      days.push({ day: i, hasReading, isToday, isStreak });
    }
    return days;
  }, [readingSessions, user.streakDays]);

  const recommendedBooks = useMemo(() => {
    const topPref = [...preferences].sort((a, b) => b.score - a.score)[0];
    return mockBooks
      .filter((b) => b.type === topPref?.bookType || Math.random() > 0.5)
      .slice(0, 4)
      .map((book) => ({
        ...book,
        reason: `因为你喜欢${bookTypeLabels[topPref?.bookType || 'fairy_tale']}，所以推荐这本～`,
        matchScore: Math.floor(Math.random() * 20) + 80,
      }));
  }, [preferences]);

  const tabs = [
    { id: 'calendar', label: '阅读日历', icon: Calendar },
    { id: 'analysis', label: '偏好分析', icon: TrendingUp },
    { id: 'recommend', label: '为你推荐', icon: BookOpen },
  ];

  return (
    <Layout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 mb-1">阅读记录</h1>
          <p className="text-sm text-gray-500">看看你的阅读成长吧～</p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl p-4 shadow-soft text-center"
          >
            <div className="text-2xl mb-1">📚</div>
            <div className="text-xl font-bold text-gray-800">{readingSessions.length}</div>
            <div className="text-xs text-gray-400">已读书籍</div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white rounded-2xl p-4 shadow-soft text-center"
          >
            <div className="text-2xl mb-1">⏱️</div>
            <div className="text-xl font-bold text-gray-800">{user.totalReadingMinutes}</div>
            <div className="text-xs text-gray-400">阅读分钟</div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl p-4 shadow-soft text-center"
          >
            <div className="text-2xl mb-1">🔥</div>
            <div className="text-xl font-bold text-orange-500">{user.streakDays}</div>
            <div className="text-xs text-gray-400">连续天数</div>
          </motion.div>
        </div>

        <div className="bg-white rounded-2xl p-1 shadow-soft">
          <div className="flex gap-1">
            {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <motion.button
                key={tab.id}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-mint-100 text-mint-600'
                    : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </motion.button>
            );
          })}
          </div>
        </div>

        {activeTab === 'calendar' && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-2xl p-5 shadow-soft"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-800">
                {new Date().getFullYear()}年{new Date().getMonth() + 1}月
              </h3>
              <div className="flex items-center gap-1 text-xs text-gray-400">
                <Flame size={14} className="text-orange-400" />
                连续 {user.streakDays} 天
              </div>
            </div>

            <div className="grid grid-cols-7 gap-2 mb-2">
              {['日', '一', '二', '三', '四', '五', '六'].map((day) => (
                <div key={day} className="text-center text-xs text-gray-400 py-1">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-2">
              {calendarDays.map((day, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.02 }}
                  className={`aspect-square rounded-xl flex items-center justify-center text-sm font-medium ${
                    day === null
                      ? ''
                      : day.isToday
                      ? 'bg-gradient-to-br from-mint-300 to-mint-400 text-white shadow-md'
                      : day.isStreak
                      ? 'bg-orange-100 text-orange-600'
                      : day.hasReading
                      ? 'bg-mint-50 text-mint-600'
                      : 'bg-gray-50 text-gray-400'
                  }`}
                >
                  {day?.day}
                </motion.div>
              ))}
            </div>

            <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-mint-400"></div>
                <span className="text-xs text-gray-500">已阅读</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-orange-300"></div>
                <span className="text-xs text-gray-500">连续打卡</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-mint-500"></div>
                <span className="text-xs text-gray-500">今天</span>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'analysis' && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <div className="bg-white rounded-2xl p-5 shadow-soft">
              <h3 className="font-bold text-gray-800 mb-4">📊 阅读偏好</h3>
              {pieData.length > 0 ? (
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
                  多读几本书就能看到偏好分析啦～
                </div>
              )}
              <div className="flex flex-wrap gap-2 justify-center mt-2">
                {pieData.map((item, index) => (
                  <div key={item.name} className="flex items-center gap-1">
                    <span>{item.emoji}</span>
                    <span className="text-xs text-gray-500">{item.name}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-soft">
              <h3 className="font-bold text-gray-800 mb-4">📈 本周阅读时长</h3>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={weeklyData}>
                    <defs>
                      <linearGradient id="colorMinutes" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#A8E6CF" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#A8E6CF" stopOpacity={0.1} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                    <YAxis hide />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="minutes"
                      stroke="#6DD3A8"
                      strokeWidth={2}
                      fill="url(#colorMinutes)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'recommend' && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <div className="bg-gradient-to-r from-lavender-100 to-sky-100 rounded-2xl p-5 shadow-soft">
              <div className="flex items-start gap-3">
                <div className="text-3xl">💡</div>
                <div>
                  <h3 className="font-bold text-gray-800 mb-1">智能推荐</h3>
                  <p className="text-sm text-gray-600">
                    根据你的阅读偏好，为你精选了这些书～
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {recommendedBooks.map((book, index) => (
                <motion.div
                  key={book.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ x: 4 }}
                  onClick={() => navigate('/reading')}
                  className="bg-white rounded-2xl p-4 shadow-soft flex gap-4 cursor-pointer"
                >
                  <BookCard book={book} size="sm" />
                  <div className="flex-1 flex flex-col justify-between py-1">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-bold text-gray-800">{book.title}</h4>
                        <span className="text-xs bg-lavender-100 text-lavender-500 px-2 py-0.5 rounded-full">
                          {book.matchScore}% 匹配
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 line-clamp-2">{book.reason}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">
                        {bookTypeEmojis[book.type]} {bookTypeLabels[book.type]}
                      </span>
                      <ChevronRight size={18} className="text-gray-300" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </motion.div>
    </Layout>
  );
}
