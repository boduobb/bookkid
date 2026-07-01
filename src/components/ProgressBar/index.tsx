import { motion } from 'framer-motion';

interface ProgressBarProps {
  value: number;
  max?: number;
  color?: 'mint' | 'cream' | 'sky' | 'peach' | 'lavender' | 'carrot';
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const colorMap = {
  mint: 'from-mint-300 to-mint-400',
  cream: 'from-cream-300 to-cream-400',
  sky: 'from-sky-300 to-sky-400',
  peach: 'from-peach-300 to-peach-400',
  lavender: 'from-lavender-300 to-lavender-400',
  carrot: 'from-carrot-300 to-carrot-400',
};

const heightMap = {
  sm: 'h-2',
  md: 'h-3',
  lg: 'h-4',
};

export default function ProgressBar({
  value,
  max = 100,
  color = 'mint',
  showLabel = false,
  size = 'md',
}: ProgressBarProps) {
  const percentage = Math.min((value / max) * 100, 100);

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs text-gray-500">进度</span>
          <span className="text-xs font-bold text-gray-600">{Math.round(percentage)}%</span>
        </div>
      )}
      <div className={`w-full ${heightMap[size]} bg-white/60 rounded-full overflow-hidden shadow-inner`}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className={`h-full bg-gradient-to-r ${colorMap[color]} rounded-full`}
        />
      </div>
    </div>
  );
}
