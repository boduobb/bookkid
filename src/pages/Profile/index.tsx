import { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings, Volume2, Bell, Palette, Shield, HelpCircle, ChevronRight, Star, Coins, Award } from 'lucide-react';
import { useUserStore } from '../../store/useUserStore';
import { mockAchievements } from '../../mock/achievements';
import Layout from '../../components/Layout';
import Mascot from '../../components/Mascot';
import Badge from '../../components/Badge';
import ProgressBar from '../../components/ProgressBar';

const outfits = [
  { id: 'default', name: '默认', emoji: '🦉', price: 0 },
  { id: 'wizard', name: '魔法师', emoji: '🧙', price: 50 },
  { id: 'pirate', name: '海盗船长', emoji: '🏴‍☠️', price: 80 },
  { id: 'astronaut', name: '宇航员', emoji: '👨‍🚀', price: 100 },
  { id: 'prince', name: '小王子', emoji: '🤴', price: 120 },
  { id: 'fairy', name: '小精灵', emoji: '🧚', price: 150 },
];

export default function Profile() {
  const { user, unlockedAchievementIds } = useUserStore();
  const [showOutfits, setShowOutfits] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const settingsItems = [
    { icon: Volume2, label: '萌趣语音', value: voiceEnabled, type: 'toggle' as const, action: () => setVoiceEnabled(!voiceEnabled) },
    { icon: Bell, label: '阅读提醒', value: soundEnabled, type: 'toggle' as const, action: () => setSoundEnabled(!soundEnabled) },
    { icon: Palette, label: '主题装扮', type: 'link' as const, action: () => setShowOutfits(true) },
    { icon: Shield, label: '家长模式', type: 'link' as const },
    { icon: HelpCircle, label: '帮助与反馈', type: 'link' as const },
  ];

  const progressToNextLevel = user.stars % 50;

  return (
    <Layout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 pb-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800">我的</h1>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-cream-100 via-sky-50 to-lavender-50 rounded-3xl p-6 shadow-soft relative overflow-hidden"
        >
          <div className="absolute top-2 right-4 text-5xl opacity-20">✨</div>
          <div className="absolute bottom-2 left-2 text-4xl opacity-20">🌟</div>

          <div className="flex flex-col items-center">
            <motion.div
              whileHover={{ scale: 1.05, rotate: 5 }}
              className="mb-3 cursor-pointer"
              onClick={() => setShowOutfits(true)}
            >
              <Mascot size="xl" mood="happy" />
            </motion.div>

            <h2 className="text-xl font-bold text-gray-800 mb-1">{user.nickname}</h2>
            <p className="text-sm text-gray-500 mb-4">Lv.{user.level} 阅读小达人</p>

            <div className="w-full max-w-48 mb-2">
              <ProgressBar value={progressToNextLevel} max={50} color="cream" size="md" showLabel />
            </div>
            <p className="text-xs text-gray-400">
              再获得 {50 - progressToNextLevel} 颗星星升级到 Lv.{user.level + 1}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Star size={18} className="text-amber-400 fill-amber-400" />
                <span className="text-lg font-bold text-gray-800">{user.stars}</span>
              </div>
              <p className="text-xs text-gray-400">星星</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Coins size={18} className="text-amber-500" />
                <span className="text-lg font-bold text-gray-800">{user.coins}</span>
              </div>
              <p className="text-xs text-gray-400">金币</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Award size={18} className="text-orange-400" />
                <span className="text-lg font-bold text-gray-800">{unlockedAchievementIds.length}</span>
              </div>
              <p className="text-xs text-gray-400">勋章</p>
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
              <span>🏆</span> 我的成就
            </h3>
            <span className="text-xs text-gray-400">
              {unlockedAchievementIds.length}/{mockAchievements.length}
            </span>
          </div>
          <div className="grid grid-cols-5 gap-3">
            {mockAchievements.slice(0, 10).map((achievement, index) => (
              <motion.div
                key={achievement.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + index * 0.05 }}
              >
                <Badge
                  icon={achievement.icon}
                  name={achievement.name}
                  unlocked={unlockedAchievementIds.includes(achievement.id)}
                  size="sm"
                />
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl overflow-hidden shadow-soft"
        >
          <div className="px-5 py-3 border-b border-gray-100">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <Settings size={18} /> 设置
            </h3>
          </div>
          {settingsItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.button
                key={index}
                whileTap={{ backgroundColor: 'rgb(249 250 251)' }}
                onClick={item.action}
                className="w-full flex items-center gap-3 px-5 py-4 border-b border-gray-50 last:border-b-0"
              >
                <div className="w-9 h-9 rounded-xl bg-mint-50 flex items-center justify-center">
                  <Icon size={18} className="text-mint-500" />
                </div>
                <span className="flex-1 text-left text-sm text-gray-700">{item.label}</span>
                {item.type === 'toggle' && (
                  <div
                    className={`w-11 h-6 rounded-full relative transition-colors ${
                      item.value ? 'bg-mint-400' : 'bg-gray-200'
                    }`}
                  >
                    <motion.div
                      animate={{ x: item.value ? 22 : 2 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
                    />
                  </div>
                )}
                {item.type === 'link' && <ChevronRight size={18} className="text-gray-300" />}
              </motion.button>
            );
          })}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-xs text-gray-400"
        >
          小书童AI阅读伙伴 v1.0.0
        </motion.div>
      </motion.div>

      {showOutfits && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-end z-50"
          onClick={() => setShowOutfits(false)}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="w-full bg-white rounded-t-3xl p-6 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto mb-4" />

            <h3 className="text-xl font-bold text-gray-800 text-center mb-2">
              👕 我的衣橱
            </h3>
            <p className="text-sm text-gray-500 text-center mb-6">
              用金币解锁更多可爱装扮吧～
            </p>

            <div className="grid grid-cols-3 gap-4 mb-6">
              {outfits.map((outfit, index) => {
                const owned = outfit.price === 0 || user.coins >= outfit.price;
                const isActive = user.outfit === outfit.id;
                return (
                  <motion.div
                    key={outfit.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {}}
                    className={`aspect-square rounded-2xl flex flex-col items-center justify-center cursor-pointer border-2 transition-all ${
                      isActive
                        ? 'border-mint-400 bg-mint-50'
                        : owned
                        ? 'border-gray-100 bg-gray-50 hover:border-mint-200'
                        : 'border-gray-100 bg-gray-50 opacity-60'
                    }`}
                  >
                    <span className="text-4xl mb-2">{outfit.emoji}</span>
                    <span className="text-xs font-bold text-gray-700">{outfit.name}</span>
                    {outfit.price > 0 && !isActive && (
                      <span className="text-xs text-amber-500 flex items-center gap-0.5 mt-1">
                        <Coins size={12} /> {outfit.price}
                      </span>
                    )}
                    {isActive && (
                      <span className="text-xs text-mint-500 font-bold mt-1">使用中</span>
                    )}
                  </motion.div>
                );
              })}
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowOutfits(false)}
              className="w-full bg-gradient-to-r from-mint-300 to-mint-400 text-white font-bold py-3 rounded-xl shadow-soft"
            >
              关闭
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </Layout>
  );
}
