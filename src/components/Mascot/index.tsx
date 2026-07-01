import { motion } from 'framer-motion';

interface MascotProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  mood?: 'happy' | 'thinking' | 'excited' | 'sleepy';
  animate?: boolean;
}

const sizeMap = {
  sm: 'w-12 h-12 text-3xl',
  md: 'w-20 h-20 text-5xl',
  lg: 'w-32 h-32 text-7xl',
  xl: 'w-40 h-40 text-8xl',
};

const moodEmojis = {
  happy: '🦉',
  thinking: '🤔',
  excited: '🎉',
  sleepy: '😴',
};

export default function Mascot({ size = 'md', mood = 'happy', animate = true }: MascotProps) {
  return (
    <motion.div
      className={`${sizeMap[size]} flex items-center justify-center rounded-full bg-gradient-to-br from-cream-200 to-cream-300 shadow-soft cursor-pointer select-none`}
      animate={animate ? {
        y: [0, -5, 0],
        rotate: [0, 2, -2, 0],
      } : {}}
      transition={animate ? {
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut",
      } : {}}
    >
      <motion.span
        animate={animate ? {
          scale: [1, 1.1, 1],
        } : {}}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        {mood === 'happy' && '🦉'}
        {mood === 'thinking' && '🦉💭'}
        {mood === 'excited' && '🦉✨'}
        {mood === 'sleepy' && '🦉💤'}
      </motion.span>
    </motion.div>
  );
}
