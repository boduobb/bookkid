// pages/records/records.js
const app = getApp();
const util = require('../../utils/util.js');

Page({
  data: {
    activeTab: 'calendar',
    userInfo: {},
    readingHistory: [],
    calendarDays: [],
    currentMonth: '',
    currentYear: 0,
    currentMonthIndex: 0,
    markedDates: [],
    streakDays: 0,
    totalBooks: 0,
    totalMinutes: 0,
    categoryData: [],
    weeklyData: [],
    recommendedBooks: [],
    books: []
  },

  onLoad() {
    const now = new Date();
    this.setData({
      currentYear: now.getFullYear(),
      currentMonthIndex: now.getMonth()
    });
    this.loadData();
  },

  onShow() {
    this.loadData();
  },

  loadData() {
    const userInfo = app.globalData.userInfo || wx.getStorageSync('userInfo');
    const readingHistory = wx.getStorageSync('readingHistory') || [];
    const books = app.globalData.books.length ? app.globalData.books : wx.getStorageSync('books') || [];

    const markedDates = readingHistory.map(r => r.date);
    const calendarDays = util.generateCalendarData(
      this.data.currentYear,
      this.data.currentMonthIndex,
      markedDates
    );

    const totalMinutes = readingHistory.reduce((sum, r) => sum + r.duration, 0);
    const uniqueDates = [...new Set(readingHistory.map(r => r.date))];
    const streakDays = this.calculateStreak(uniqueDates);

    const categoryData = this.calculateCategoryData(readingHistory, books);
    const weeklyData = this.calculateWeeklyData(readingHistory);
    const recommendedBooks = this.getRecommendedBooks(books, readingHistory);

    const currentMonth = `${this.data.currentYear}年${this.data.currentMonthIndex + 1}月`;

    this.setData({
      userInfo,
      readingHistory,
      calendarDays,
      currentMonth,
      markedDates,
      streakDays,
      totalBooks: readingHistory.length,
      totalMinutes,
      categoryData,
      weeklyData,
      recommendedBooks,
      books
    });
  },

  calculateStreak(dates) {
    if (!dates || dates.length === 0) return 0;
    
    const sortedDates = [...dates].sort().reverse();
    const today = util.getTodayStr();
    
    if (sortedDates[0] !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = util.formatDate(yesterday);
      if (sortedDates[0] !== yesterdayStr) {
        return 0;
      }
    }
    
    let streak = 1;
    for (let i = 1; i < sortedDates.length; i++) {
      const current = new Date(sortedDates[i - 1]);
      const prev = new Date(sortedDates[i]);
      const diff = Math.floor((current - prev) / (1000 * 60 * 60 * 24));
      
      if (diff === 1) {
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  },

  calculateCategoryData(history, books) {
    const categoryCount = {};
    
    history.forEach(record => {
      const book = books.find(b => b.id === record.bookId);
      if (book) {
        categoryCount[book.category] = (categoryCount[book.category] || 0) + 1;
      }
    });

    const colors = ['#FFD76E', '#6DD3A8', '#60A5FA', '#F472B6', '#A78BFA', '#FB923C'];
    const result = Object.keys(categoryCount).map((name, index) => ({
      name,
      count: categoryCount[name],
      color: colors[index % colors.length]
    }));

    return result.length > 0 ? result : [
      { name: '童话故事', count: 0, color: '#FFD76E' },
      { name: '寓言故事', count: 0, color: '#6DD3A8' },
      { name: '科普故事', count: 0, color: '#60A5FA' }
    ];
  },

  calculateWeeklyData(history) {
    const days = [];
    const dayNames = ['日', '一', '二', '三', '四', '五', '六'];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = util.formatDate(date);
      const dayName = dayNames[date.getDay()];
      
      const dayRecords = history.filter(r => r.date === dateStr);
      const minutes = dayRecords.reduce((sum, r) => sum + r.duration, 0);
      
      days.push({
        date: dateStr,
        dayName,
        minutes
      });
    }
    
    return days;
  },

  getRecommendedBooks(books, history) {
    const readBookIds = history.map(r => r.bookId);
    const unreadBooks = books.filter(b => !readBookIds.includes(b.id));
    return unreadBooks.slice(0, 4);
  },

  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({ activeTab: tab });
  },

  prevMonth() {
    let { currentYear, currentMonthIndex } = this.data;
    currentMonthIndex--;
    if (currentMonthIndex < 0) {
      currentMonthIndex = 11;
      currentYear--;
    }
    this.setData({ currentYear, currentMonthIndex });
    this.loadData();
  },

  nextMonth() {
    let { currentYear, currentMonthIndex } = this.data;
    currentMonthIndex++;
    if (currentMonthIndex > 11) {
      currentMonthIndex = 0;
      currentYear++;
    }
    this.setData({ currentYear, currentMonthIndex });
    this.loadData();
  },

  goToReading(e) {
    const bookId = e.currentTarget.dataset.bookid;
    wx.navigateTo({
      url: `/pages/reading/reading?bookId=${bookId}`
    });
  },

  onPullDownRefresh() {
    this.loadData();
    wx.stopPullDownRefresh();
  }
});
