import { motion } from 'framer-motion';

interface BadgeProps {
  icon: string;
  name: string;
  description?: string;
  unlocked?: boolean;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

export default function Badge({ icon, name, description, unlocked = true, size = 'md', onClick }: BadgeProps) {
  const sizeClasses = {
    sm: 'w-14 h-14 text-2xl',
    md: 'w-20 h-20 text-4xl',
    lg: 'w-28 h-28 text-5xl',
  };

  return (
    <motion.div
      whileHover={unlocked ? { y: -4, scale: 1.05 } : {}}
      whileTap={unlocked ? { scale: 0.95 } : {}}
      onClick={onClick}
      className="flex flex-col items-center gap-2 cursor-pointer"
    >
      <div
        className={`${sizeClasses[size]} rounded-full flex items-center justify-center ${
          unlocked
            ? 'bg-gradient-to-br from-amber-200 via-yellow-300 to-amber-400 shadow-glow'
            : 'bg-gray-200 grayscale opacity-50'
        }`}
      >
        <span className={unlocked ? '' : 'grayscale'}>{icon}</span>
      </div>
      <p className={`text-xs font-bold ${unlocked ? 'text-gray-700' : 'text-gray-400'}`}>
        {name}
      </p>
      {description && size !== 'sm' && (
        <p className="text-[10px] text-gray-400 text-center max-w-20">
          {description}
        </p>
      )}
    </motion.div>
  );
}
