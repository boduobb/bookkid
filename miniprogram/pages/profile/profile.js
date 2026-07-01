// pages/profile/profile.js
const app = getApp();
const util = require('../../utils/util.js');

Page({
  data: {
    userInfo: {},
    achievements: [],
    unlockedCount: 0,
    levelProgress: 0,
    expPerLevel: 100,
    wardrobe: [
      { id: 'default', name: '默认形象', icon: '👦', price: 0, owned: true },
      { id: 'owl', name: '猫头鹰装', icon: '🦉', price: 50, owned: false },
      { id: 'princess', name: '小公主', icon: '👸', price: 100, owned: false },
      { id: 'prince', name: '小王子', icon: '🤴', price: 100, owned: false },
      { id: 'rabbit', name: '兔兔装', icon: '🐰', price: 80, owned: false },
      { id: 'bear', name: '小熊装', icon: '🐻', price: 80, owned: false }
    ],
    settings: {
      voiceEnabled: true,
      dailyReminder: true,
      soundEffects: true
    }
  },

  onLoad() {
    this.loadData();
  },

  onShow() {
    this.loadData();
  },

  loadData() {
    const userInfo = app.globalData.userInfo || wx.getStorageSync('userInfo');
    const achievements = app.globalData.achievements.length 
      ? app.globalData.achievements 
      : wx.getStorageSync('achievements') || [];
    
    const unlockedCount = achievements.filter(a => a.unlocked).length;
    const currentExp = userInfo.totalReadTime % this.data.expPerLevel;
    const levelProgress = Math.floor((currentExp / this.data.expPerLevel) * 100);

    this.setData({
      userInfo,
      achievements,
      unlockedCount,
      levelProgress
    });
  },

  onEditNickname() {
    wx.showModal({
      title: '修改昵称',
      editable: true,
      placeholderText: '请输入新昵称',
      content: this.data.userInfo.nickname,
      success: (res) => {
        if (res.confirm && res.content) {
          app.updateUserInfo({ nickname: res.content });
          this.loadData();
          wx.showToast({ title: '昵称已更新', icon: 'success' });
        }
      }
    });
  },

  onChooseAvatar() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const avatarUrl = res.tempFilePaths[0];
        app.updateUserInfo({ avatar: avatarUrl });
        this.loadData();
        wx.showToast({ title: '头像已更新', icon: 'success' });
      }
    });
  },

  onBuyOutfit(e) {
    const outfitId = e.currentTarget.dataset.id;
    const outfit = this.data.wardrobe.find(w => w.id === outfitId);
    
    if (!outfit || outfit.owned) return;

    if (this.data.userInfo.coins < outfit.price) {
      wx.showToast({ title: '金币不够啦，多读书赚金币吧！', icon: 'none' });
      return;
    }

    wx.showModal({
      title: '购买装扮',
      content: `确定花费 ${outfit.price} 金币购买"${outfit.name}"吗？`,
      success: (res) => {
        if (res.confirm) {
          const newCoins = this.data.userInfo.coins - outfit.price;
          const newWardrobe = this.data.wardrobe.map(w => 
            w.id === outfitId ? { ...w, owned: true } : w
          );
          
          app.updateUserInfo({ coins: newCoins });
          this.setData({ wardrobe: newWardrobe });
          
          wx.showToast({ title: '购买成功！', icon: 'success' });
        }
      }
    });
  },

  onToggleSetting(e) {
    const setting = e.currentTarget.dataset.setting;
    const value = e.detail.value;
    
    const settings = { ...this.data.settings, [setting]: value };
    this.setData({ settings });
    
    wx.setStorageSync('settings', settings);
  },

  onViewAchievement(e) {
    const id = e.currentTarget.dataset.id;
    const achievement = this.data.achievements.find(a => a.id === id);
    
    if (achievement) {
      wx.showModal({
        title: achievement.icon + ' ' + achievement.name,
        content: achievement.description,
        showCancel: false,
        confirmText: achievement.unlocked ? '太棒了！' : '加油'
      });
    }
  },

  goToAgentConfig() {
    wx.navigateTo({
      url: '/pages/agent-config/agent-config'
    });
  },

  onClearData() {
    wx.showModal({
      title: '清除数据',
      content: '确定要清除所有阅读数据吗？此操作不可恢复！',
      confirmText: '确定清除',
      confirmColor: '#EF4444',
      success: (res) => {
        if (res.confirm) {
          wx.clearStorageSync();
          app.onLaunch();
          this.loadData();
          wx.showToast({ title: '数据已清除', icon: 'success' });
        }
      }
    });
  },

  onAbout() {
    wx.showModal({
      title: '关于小书童',
      content: '小书童AI阅读伙伴 v1.0.0\n\n让每个孩子爱上阅读，在快乐中成长！',
      showCancel: false,
      confirmText: '知道了'
    });
  }
});
