import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import BottomNav from './BottomNav';

interface LayoutProps {
  children: ReactNode;
  showNav?: boolean;
}

export default function Layout({ children, showNav = true }: LayoutProps) {
  return (
    <div className="min-h-screen pb-20">
      <motion.main
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className="max-w-md mx-auto px-4 pt-6"
      >
        {children}
      </motion.main>
      {showNav && <BottomNav />}
    </div>
  );
}
