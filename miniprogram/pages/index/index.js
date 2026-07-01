// pages/index/index.js
const app = getApp();
const util = require('../../utils/util.js');

Page({
  data: {
    userInfo: {},
    books: [],
    achievements: [],
    recommendedBook: null,
    greeting: '',
    encouragingText: '',
    levelProgress: 0,
    expPerLevel: 100
  },

  onLoad() {
    this.loadData();
  },

  onShow() {
    this.loadData();
  },

  loadData() {
    const userInfo = app.globalData.userInfo || wx.getStorageSync('userInfo');
    const books = app.globalData.books.length ? app.globalData.books : wx.getStorageSync('books') || [];
    const achievements = app.globalData.achievements.length ? app.globalData.achievements : wx.getStorageSync('achievements') || [];

    const currentExp = userInfo.totalReadTime % this.data.expPerLevel;
    const levelProgress = Math.floor((currentExp / this.data.expPerLevel) * 100);

    const recommendedBook = books.length > 0 ? books[Math.floor(Math.random() * books.length)] : null;

    this.setData({
      userInfo,
      books,
      achievements: achievements.slice(0, 6),
      recommendedBook,
      greeting: util.getGreeting(),
      encouragingText: util.getEncouragingText(userInfo.streakDays),
      levelProgress
    });
  },

  goToReading(e) {
    const bookId = e.currentTarget.dataset.bookid;
    if (bookId) {
      wx.navigateTo({
        url: `/pages/reading/reading?bookId=${bookId}`
      });
    } else {
      // 无bookId时，跳转到阅读页面进行拍照上传
      wx.navigateTo({
        url: '/pages/reading/reading'
      });
    }
  },

  onStartReading() {
    const { recommendedBook } = this.data;
    if (recommendedBook) {
      wx.navigateTo({
        url: `/pages/reading/reading?bookId=${recommendedBook.id}`
      });
    }
  },

  viewAllAchievements() {
    wx.showToast({ title: '成就系统开发中...', icon: 'none' });
  },

  onPullDownRefresh() {
    this.loadData();
    wx.stopPullDownRefresh();
  }
});
