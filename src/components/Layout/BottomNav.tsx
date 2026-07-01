import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, BookOpen, BarChart2, User } from 'lucide-react';

const navItems = [
  { path: '/', icon: Home, label: '首页' },
  { path: '/reading', icon: BookOpen, label: '阅读' },
  { path: '/records', icon: BarChart2, label: '记录' },
  { path: '/profile', icon: User, label: '我的' },
];

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-gray-100 px-4 py-2 z-50">
      <div className="max-w-md mx-auto flex justify-around items-center">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <motion.button
              key={item.path}
              onClick={() => navigate(item.path)}
              whileTap={{ scale: 0.9 }}
              className="flex flex-col items-center gap-1 px-4 py-1 relative"
            >
              {isActive && (
                <motion.div
                  layoutId="activeIndicator"
                  className="absolute -top-2 w-10 h-1 bg-gradient-to-r from-cream-300 to-cream-400 rounded-full"
                />
              )}
              <Icon
                size={24}
                className={`transition-colors duration-300 ${
                  isActive ? 'text-cream-400' : 'text-gray-400'
                }`}
              />
              <span
                className={`text-xs font-medium transition-colors duration-300 ${
                  isActive ? 'text-cream-400' : 'text-gray-400'
                }`}
              >
                {item.label}
              </span>
            </motion.button>
          );
        })}
      </div>
    </nav>
  );
}
