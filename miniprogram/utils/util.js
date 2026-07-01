// utils/util.js

function formatTime(date) {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hour = date.getHours();
  const minute = date.getMinutes();
  const second = date.getSeconds();

  return (
    [year, month, day].map(formatNumber).join('/') +
    ' ' +
    [hour, minute, second].map(formatNumber).join(':')
  );
}

function formatNumber(n) {
  n = n.toString();
  return n[1] ? n : '0' + n;
}

function formatDate(date) {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${year}-${formatNumber(month)}-${formatNumber(day)}`;
}

function getTodayStr() {
  return formatDate(new Date());
}

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay();
}

function generateCalendarData(year, month, markedDates = []) {
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const days = [];

  for (let i = 0; i < firstDay; i++) {
    days.push({ day: '', isEmpty: true });
  }

  for (let i = 1; i <= daysInMonth; i++) {
    const dateStr = `${year}-${formatNumber(month + 1)}-${formatNumber(i)}`;
    const isMarked = markedDates.includes(dateStr);
    const isToday = dateStr === getTodayStr();
    days.push({
      day: i,
      date: dateStr,
      isMarked,
      isToday,
      isEmpty: false
    });
  }

  return days;
}

function showToast(title, icon = 'none') {
  wx.showToast({
    title,
    icon,
    duration: 2000
  });
}

function showLoading(title = '加载中...') {
  wx.showLoading({
    title,
    mask: true
  });
}

function hideLoading() {
  wx.hideLoading();
}

function getRandomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffleArray(arr) {
  const newArr = [...arr];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function throttle(func, limit) {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 6) return '凌晨好';
  if (hour < 9) return '早上好';
  if (hour < 12) return '上午好';
  if (hour < 14) return '中午好';
  if (hour < 17) return '下午好';
  if (hour < 19) return '傍晚好';
  return '晚上好';
}

function getEncouragingText(streakDays) {
  if (streakDays === 0) {
    return '今天是开始阅读的好日子！';
  } else if (streakDays < 3) {
    return '很棒的开始，继续加油！';
  } else if (streakDays < 7) {
    return '坚持就是胜利，你做得很好！';
  } else if (streakDays < 30) {
    return `哇！已经连续${streakDays}天啦，太厉害了！`;
  } else {
    return `传奇！连续${streakDays}天阅读，你是阅读小达人！`;
  }
}

module.exports = {
  formatTime,
  formatNumber,
  formatDate,
  getTodayStr,
  getDaysInMonth,
  getFirstDayOfMonth,
  generateCalendarData,
  showToast,
  showLoading,
  hideLoading,
  getRandomItem,
  shuffleArray,
  debounce,
  throttle,
  getGreeting,
  getEncouragingText
};
