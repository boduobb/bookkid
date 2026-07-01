const api = require('../../utils/api.js');

Page({
  data: {
    config: {
      name: '书书',
      avatar: '🦉',
      personality: '亲切友善',
      speechStyle: '活泼可爱，喜欢用表情符号',
      role: '小书童',
      duties: [],
      customInstructions: '',
      replyLength: '每次回复不超过100字，简洁有趣',
      addressChild: '小读者',
      encouragementWords: [],
      emojis: []
    },
    dutyInput: '',
    wordInput: '',
    emojiInput: '',
    isSaving: false,
    isOnline: false
  },

  onLoad() {
    this.loadConfig();
  },

  async loadConfig() {
    try {
      const config = await api.getAgentConfig();
      this.setData({ 
        config,
        isOnline: true 
      });
    } catch (err) {
      console.error('加载配置失败:', err);
      this.setData({ isOnline: false });
      wx.showToast({ title: '无法连接服务器', icon: 'none' });
    }
  },

  onInputChange(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({
      [`config.${field}`]: e.detail.value
    });
  },

  onAddDuty() {
    const { dutyInput, config } = this.data;
    if (!dutyInput.trim()) return;
    
    const duties = [...config.duties, dutyInput.trim()];
    this.setData({
      'config.duties': duties,
      dutyInput: ''
    });
  },

  onDeleteDuty(e) {
    const index = e.currentTarget.dataset.index;
    const duties = [...this.data.config.duties];
    duties.splice(index, 1);
    this.setData({ 'config.duties': duties });
  },

  onDutyInput(e) {
    this.setData({ dutyInput: e.detail.value });
  },

  onAddWord() {
    const { wordInput, config } = this.data;
    if (!wordInput.trim()) return;
    
    const words = [...config.encouragementWords, wordInput.trim()];
    this.setData({
      'config.encouragementWords': words,
      wordInput: ''
    });
  },

  onDeleteWord(e) {
    const index = e.currentTarget.dataset.index;
    const words = [...this.data.config.encouragementWords];
    words.splice(index, 1);
    this.setData({ 'config.encouragementWords': words });
  },

  onWordInput(e) {
    this.setData({ wordInput: e.detail.value });
  },

  onAddEmoji() {
    const { emojiInput, config } = this.data;
    if (!emojiInput.trim()) return;
    
    const emojis = [...config.emojis, emojiInput.trim()];
    this.setData({
      'config.emojis': emojis,
      emojiInput: ''
    });
  },

  onDeleteEmoji(e) {
    const index = e.currentTarget.dataset.index;
    const emojis = [...this.data.config.emojis];
    emojis.splice(index, 1);
    this.setData({ 'config.emojis': emojis });
  },

  onEmojiInput(e) {
    this.setData({ emojiInput: e.detail.value });
  },

  async onSave() {
    if (this.data.isSaving) return;
    
    this.setData({ isSaving: true });
    
    try {
      await api.saveAgentConfig(this.data.config);
      wx.showToast({ title: '保存成功', icon: 'success' });
    } catch (err) {
      console.error('保存失败:', err);
      wx.showToast({ title: err.message || '保存失败', icon: 'none' });
    } finally {
      this.setData({ isSaving: false });
    }
  },

  onReset() {
    wx.showModal({
      title: '确认重置',
      content: '确定要恢复默认配置吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            const config = await api.resetAgentConfig();
            this.setData({ config });
            wx.showToast({ title: '已恢复默认', icon: 'success' });
          } catch (err) {
            wx.showToast({ title: '重置失败', icon: 'none' });
          }
        }
      }
    });
  }
});