// pages/reading/reading.js - 对接星火大模型的阅读互动页
const app = getApp();
const util = require('../../utils/util.js');
const api = require('../../utils/api.js');

Page({
  data: {
    bookId: '',
    book: null,
    phase: 'upload',
    messages: [],
    chatHistory: [],
    inputText: '',
    isRecording: false,
    currentQuizIndex: 0,
    quizzes: [],
    selectedAnswer: null,
    showCompleteModal: false,
    selectedCharacter: '',
    scrollToView: '',
    quizCorrectCount: 0,
    retellingCount: 0,
    isThinking: false,
    isOnline: false,
    roleplayHistory: [],
    // 拍照上传相关
    uploadImages: [],
    isUploading: false,
    uploadProgress: 0,
    isFromUpload: false,
    ocrText: ''
  },

  onLoad(options) {
    const bookId = options.bookId;
    if (bookId) {
      this.loadBook(bookId);
    } else {
      this.setData({ phase: 'upload' });
    }
    
    // 检查后端服务是否可用
    this.checkServer();
  },

  async checkServer() {
    try {
      await api.checkHealth();
      this.setData({ isOnline: true });
      console.log('后端服务可用，将使用星火大模型');
    } catch (err) {
      console.log('后端服务不可用，将使用本地Mock数据:', err.message);
      this.setData({ isOnline: false });
    }
  },

  loadBook(bookId) {
    const books = app.globalData.books.length ? app.globalData.books : wx.getStorageSync('books') || [];
    const book = books.find(b => b.id === bookId);
    if (book) {
      this.setData({ 
        book, 
        bookId,
        phase: 'loading'
      });
      this.startReadingFlow();
    }
  },

  async startReadingFlow() {
    const { book, isOnline } = this.data;
    
    // 如果后端可用，调用星火API
    if (isOnline) {
      try {
        this.setData({ isThinking: true });
        
        const result = await api.startReading(this.data.bookId);
        
        const welcomeMsg = {
          id: Date.now(),
          type: 'text',
          role: 'ai',
          content: result.message
        };
        
        this.setData({
          messages: [welcomeMsg],
          phase: 'reading',
          scrollToView: 'msg-' + welcomeMsg.id,
          isThinking: false,
          chatHistory: [{ role: 'assistant', content: result.message }]
        });
        
        // 发送故事内容
        setTimeout(() => {
          this.sendStoryContent();
        }, 1500);
        
      } catch (err) {
        console.error('调用星火API失败:', err);
        wx.showToast({ title: 'AI连接失败，使用本地模式', icon: 'none' });
        this.setData({ isOnline: false, isThinking: false });
        this.startLocalFlow();
      }
    } else {
      this.startLocalFlow();
    }
  },

  sendStoryContent() {
    const { book } = this.data;
    const storyMsg = {
      id: Date.now() + 1,
      type: 'story',
      role: 'ai',
      content: book.content
    };
    
    const messages = [...this.data.messages, storyMsg];
    this.setData({
      messages,
      scrollToView: 'msg-' + storyMsg.id,
      phase: 'retelling'
    });
    
    // 引导复述
    setTimeout(() => {
      this.addAIMessage('好啦，故事讲完了！现在你能用自己的话给书书讲讲这个故事吗？😊');
      this.setData({
        chatHistory: [...this.data.chatHistory, { role: 'assistant', content: '好啦，故事讲完了！现在你能用自己的话给书书讲讲这个故事吗？😊' }]
      });
    }, 2000);
  },

  // 本地Mock流程（后端不可用时）
  startLocalFlow() {
    const { book } = this.data;
    const welcomeMsg = {
      id: Date.now(),
      type: 'text',
      role: 'ai',
      content: `嗨！我们今天要读的是《${book.title}》。准备好了吗？我先给你讲故事，然后我们一起玩游戏！`
    };
    
    const storyMsg = {
      id: Date.now() + 1,
      type: 'story',
      role: 'ai',
      content: book.content
    };

    this.setData({
      messages: [welcomeMsg, storyMsg],
      phase: 'reading',
      scrollToView: 'msg-' + (Date.now() + 1)
    });

    setTimeout(() => {
      this.setData({ phase: 'retelling' });
      this.addAIMessage('哇，这本书听起来好有趣！你能用自己的话给书书讲讲这个故事吗？😊');
    }, 2000);
  },

  addAIMessage(content, type = 'text') {
    this.setData({ isThinking: true });
    
    setTimeout(() => {
      const msg = {
        id: Date.now(),
        type,
        role: 'ai',
        content
      };
      
      const messages = [...this.data.messages, msg];
      this.setData({
        messages,
        isThinking: false,
        scrollToView: 'msg-' + msg.id
      });
    }, 800);
  },

  addUserMessage(content, type = 'text') {
    const msg = {
      id: Date.now(),
      type,
      role: 'user',
      content
    };
    
    const messages = [...this.data.messages, msg];
    this.setData({
      messages,
      scrollToView: 'msg-' + msg.id
    });
  },

  onInputChange(e) {
    this.setData({ inputText: e.detail.value });
  },

  async onSendMessage() {
    const { inputText, phase, isOnline, bookId, chatHistory, isFromUpload, book, ocrText } = this.data;
    if (!inputText.trim()) return;

    const userMessage = inputText;
    this.addUserMessage(userMessage);
    this.setData({ inputText: '' });

    const newHistory = [...chatHistory, { role: 'user', content: userMessage }];

    if (isOnline) {
      try {
        this.setData({ isThinking: true });
        
        let result;
        if (isFromUpload) {
          result = await api.sendUploadMessage(book, userMessage, chatHistory, phase, ocrText);
        } else {
          result = await api.sendMessage(bookId, userMessage, chatHistory, phase);
        }
        
        const aiMsg = {
          id: Date.now(),
          type: 'text',
          role: 'ai',
          content: result.message
        };
        
        const messages = [...this.data.messages, aiMsg];
        const updatedHistory = [...newHistory, { role: 'assistant', content: result.message }];
        
        this.setData({
          messages,
          chatHistory: updatedHistory,
          isThinking: false,
          scrollToView: 'msg-' + aiMsg.id,
          phase: result.phase
        });
        
        if (result.phaseChange) {
          if (result.phase === 'quiz') {
            this.loadQuizzes();
          }
        }
        
      } catch (err) {
        console.error('调用星火API失败:', err);
        this.setData({ isThinking: false });
        this.handleLocalMessage(userMessage);
      }
    } else {
      this.handleLocalMessage(userMessage);
    }
  },

  handleLocalMessage(text) {
    const { phase } = this.data;

    switch (phase) {
      case 'retelling':
        this.handleRetelling(text);
        break;
      case 'comprehension':
        this.handleComprehension(text);
        break;
      case 'roleplay':
        this.handleRoleplay(text);
        break;
      default:
        this.addAIMessage('你说得真好！👍');
    }
  },

  handleRetelling(text) {
    const { retellingCount } = this.data;
    const newCount = retellingCount + 1;

    if (newCount === 1) {
      this.addAIMessage('哇，你说得真好！继续讲，书书在认真听呢～ 🎧');
      setTimeout(() => {
        this.addAIMessage('那你最喜欢故事里的哪个角色呀？为什么呢？');
      }, 1500);
    } else if (newCount === 2) {
      this.addAIMessage('你讲得太精彩了！比故事书还有意思呢～ 🌟');
      setTimeout(() => {
        this.startComprehension();
      }, 2000);
    } else {
      this.addAIMessage('真厉害！你还记得这么多细节！👍');
    }

    this.setData({ retellingCount: newCount });
  },

  startComprehension() {
    this.setData({ phase: 'comprehension' });
    this.addAIMessage('好啦，复述完故事，我们来聊一聊这个故事的意思吧～ 💭');
    setTimeout(() => {
      this.addAIMessage('你觉得这个故事想告诉我们什么道理呢？');
    }, 1500);
  },

  handleComprehension(text) {
    this.addAIMessage('哇，你说得太好了！这个故事告诉我们的道理你都明白啦！真棒！🎉');
    setTimeout(() => {
      this.loadQuizzes();
    }, 2000);
  },

  async loadQuizzes() {
    const { book, isOnline, bookId } = this.data;
    
    this.setData({ phase: 'quiz', currentQuizIndex: 0, selectedAnswer: null, quizCorrectCount: 0 });
    
    if (isOnline) {
      try {
        const result = await api.generateQuiz(bookId);
        this.setData({ quizzes: result.quizzes });
        this.addAIMessage('好！现在我们来玩个闯关游戏，答对题目可以获得星星奖励哦！⭐');
        setTimeout(() => {
          this.showQuizQuestion();
        }, 1500);
      } catch (err) {
        console.error('生成题目失败:', err);
        // 使用本地题目
        this.setData({ quizzes: book.quiz });
        this.addAIMessage('好！现在我们来玩个闯关游戏！⭐');
        setTimeout(() => {
          this.showQuizQuestion();
        }, 1500);
      }
    } else {
      this.setData({ quizzes: book.quiz });
      this.addAIMessage('好！现在我们来玩个闯关游戏，答对题目可以获得星星奖励哦！⭐');
      setTimeout(() => {
        this.showQuizQuestion();
      }, 1500);
    }
  },

  showQuizQuestion() {
    const { quizzes, currentQuizIndex } = this.data;
    const quiz = quizzes[currentQuizIndex];
    
    if (!quiz) {
      this.completeQuiz();
      return;
    }

    const msg = {
      id: Date.now(),
      type: 'quiz',
      role: 'ai',
      content: quiz.question,
      options: quiz.options,
      quizIndex: currentQuizIndex
    };

    const messages = [...this.data.messages, msg];
    this.setData({
      messages,
      scrollToView: 'msg-' + msg.id
    });
  },

  onSelectQuizOption(e) {
    const optionIndex = e.currentTarget.dataset.index;
    const { currentQuizIndex, quizzes, selectedAnswer } = this.data;
    
    if (selectedAnswer !== null) return;
    
    const quiz = quizzes[currentQuizIndex];
    const isCorrect = optionIndex === quiz.answer;

    this.setData({ selectedAnswer: optionIndex });

    if (isCorrect) {
      this.setData({ quizCorrectCount: this.data.quizCorrectCount + 1 });
      this.addAIMessage('太棒了！答对啦！⭐+5 🎉');
    } else {
      this.addAIMessage('哎呀，不对哦～没关系，继续加油！💪');
    }

    setTimeout(() => {
      const nextIndex = currentQuizIndex + 1;
      this.setData({ 
        currentQuizIndex: nextIndex,
        selectedAnswer: null 
      });
      this.showQuizQuestion();
    }, 2000);
  },

  completeQuiz() {
    const { quizCorrectCount, quizzes } = this.data;
    const total = quizzes.length;
    
    this.addAIMessage(`闯关完成！你答对了 ${quizCorrectCount}/${total} 道题！🎉`);
    
    setTimeout(() => {
      this.startRoleplay();
    }, 2500);
  },

  startRoleplay() {
    this.setData({ phase: 'roleplay' });
    
    const { book } = this.data;
    const msg = {
      id: Date.now(),
      type: 'roleplay-select',
      role: 'ai',
      content: '接下来我们来玩角色扮演吧！你想当故事里的谁呢？🎭',
      characters: book.characters
    };

    const messages = [...this.data.messages, msg];
    this.setData({
      messages,
      scrollToView: 'msg-' + msg.id
    });
  },

  async onSelectCharacter(e) {
    const character = e.currentTarget.dataset.character;
    this.setData({ selectedCharacter: character, roleplayHistory: [] });
    
    this.addUserMessage(`我要扮演${character}！`);
    
    const { isOnline, bookId } = this.data;
    
    if (isOnline) {
      try {
        this.setData({ isThinking: true });
        const result = await api.startRoleplay(bookId, character);
        
        const aiMsg = {
          id: Date.now(),
          type: 'text',
          role: 'ai',
          content: result.message
        };
        
        const messages = [...this.data.messages, aiMsg];
        const roleplayHistory = [{ role: 'assistant', content: result.message }];
        
        this.setData({
          messages,
          roleplayHistory,
          isThinking: false,
          scrollToView: 'msg-' + aiMsg.id
        });
      } catch (err) {
        console.error('角色扮演失败:', err);
        this.setData({ isThinking: false });
        this.addAIMessage(`好呀好呀！那我来当其他角色，我们开始吧！（扮演${character})`);
      }
    } else {
      this.addAIMessage(`好呀好呀！那我来当其他角色，我们开始吧！（扮演${character})`);
    }
  },

  async handleRoleplay(text) {
    const { selectedCharacter, isOnline, bookId, roleplayHistory } = this.data;
    
    if (isOnline) {
      try {
        this.setData({ isThinking: true });
        const newHistory = [...roleplayHistory, { role: 'user', content: text }];
        
        const result = await api.roleplayMessage(bookId, selectedCharacter, text, roleplayHistory);
        
        const aiMsg = {
          id: Date.now(),
          type: 'text',
          role: 'ai',
          content: result.message
        };
        
        const messages = [...this.data.messages, aiMsg];
        const updatedHistory = [...newHistory, { role: 'assistant', content: result.message }];
        
        this.setData({
          messages,
          roleplayHistory: updatedHistory,
          isThinking: false,
          scrollToView: 'msg-' + aiMsg.id
        });
      } catch (err) {
        console.error('角色扮演对话失败:', err);
        this.setData({ isThinking: false });
        this.addAIMessage('(扮演角色)哈哈，你说得好有意思！🎭');
      }
    } else {
      this.addAIMessage('(扮演角色)哈哈，你说得好有意思！🎭');
    }
  },

  onCompleteReading() {
    const { book } = this.data;
    app.addReadingRecord(book.id, 15);
    this.setData({ showCompleteModal: true });
  },

  closeCompleteModal() {
    this.setData({ showCompleteModal: false });
    wx.navigateBack();
  },

  onToggleRecording() {
    // 已改为按住说话模式，此方法保留兼容
  },

  // 按住开始录音
  onStartRecording() {
    this.setData({ isRecording: true });
    this.recorderManager = wx.getRecorderManager();
    
    this.recorderManager.onStop((res) => {
      this.setData({ isRecording: false });
      if (res.duration < 1000) {
        wx.showToast({ title: '说话时间太短啦', icon: 'none' });
        return;
      }
      this.processVoiceFile(res.tempFilePath);
    });

    this.recorderManager.onError((err) => {
      console.error('录音错误:', err);
      this.setData({ isRecording: false });
      wx.showToast({ title: '录音失败，请重试', icon: 'none' });
    });

    this.recorderManager.start({
      duration: 60000,
      sampleRate: 16000,
      numberOfChannels: 1,
      encodeBitRate: 48000,
      format: 'pcm'
    });
  },

  // 松开停止录音
  onStopRecording() {
    if (this.data.isRecording && this.recorderManager) {
      this.recorderManager.stop();
    }
  },

  // 处理语音文件 - 上传识别
  async processVoiceFile(filePath) {
    wx.showLoading({ title: '识别中...' });
    try {
      const result = await api.recognizeVoice(filePath);
      const text = result.text;
      
      if (text && text.trim()) {
        this.setData({ inputText: text });
        wx.showToast({ title: '识别成功', icon: 'success' });
        // 自动发送识别出的文字
        this.onSendMessage();
      } else {
        wx.showToast({ title: '没听清，请再说一次', icon: 'none' });
      }
    } catch (err) {
      console.error('语音识别失败:', err);
      wx.showToast({ title: '语音识别失败: ' + err.message, icon: 'none' });
    } finally {
      wx.hideLoading();
    }
  },

  // 播放AI消息的语音
  async onPlayMessageVoice(e) {
    const text = e.currentTarget.dataset.text;
    if (!text) return;

    wx.showLoading({ title: '语音合成中...' });
    try {
      const result = await api.synthesizeVoice(text);
      const audioUrl = api.API_BASE_URL + result.audioUrl;
      
      if (this.innerAudioContext) {
        this.innerAudioContext.stop();
      }
      
      this.innerAudioContext = wx.createInnerAudioContext();
      this.innerAudioContext.src = audioUrl;
      this.innerAudioContext.onPlay(() => {
        console.log('开始播放语音');
      });
      this.innerAudioContext.onEnded(() => {
        console.log('语音播放结束');
      });
      this.innerAudioContext.onError((err) => {
        console.error('播放错误:', err);
        wx.showToast({ title: '播放失败', icon: 'none' });
      });
      this.innerAudioContext.play();
    } catch (err) {
      console.error('语音合成失败:', err);
      wx.showToast({ title: '语音合成失败: ' + err.message, icon: 'none' });
    } finally {
      wx.hideLoading();
    }
  },

  onPlayVoice() {
    // 兼容旧代码
  },

  goToUpload() {
    wx.chooseMedia({
      count: 9,
      mediaType: ['image'],
      sourceType: ['camera', 'album'],
      sizeType: ['compressed'],
      success: (res) => {
        const tempFiles = res.tempFiles;
        const tempFilePaths = tempFiles.map(f => f.tempFilePath);
        
        this.setData({
          uploadImages: tempFilePaths,
          isUploading: true,
          uploadProgress: 10
        });

        wx.showLoading({ title: '上传识别中...' });

        if (this.data.isOnline) {
          this.uploadAndRecognize(tempFilePaths);
        } else {
          setTimeout(() => {
            wx.hideLoading();
            wx.showToast({ title: '请先连接后端服务', icon: 'none' });
            this.setData({ isUploading: false });
          }, 1000);
        }
      },
      fail: (err) => {
        console.log('选择图片失败:', err);
      }
    });
  },

  async uploadAndRecognize(tempFilePaths) {
    try {
      this.setData({ uploadProgress: 30 });

      const result = await api.uploadAndRecognize(tempFilePaths);
      
      this.setData({ uploadProgress: 80 });

      const bookData = result.book;
      const ocrText = result.ocrText;

      wx.hideLoading();
      
      wx.showToast({
        title: `识别成功：${bookData.title}`,
        icon: 'none'
      });

      this.setData({
        book: bookData,
        bookId: 'upload_' + Date.now(),
        isFromUpload: true,
        ocrText: ocrText,
        phase: 'loading',
        isUploading: false,
        uploadProgress: 100
      });

      this.startUploadReadingFlow(bookData, ocrText);

    } catch (err) {
      console.error('上传识别失败:', err);
      wx.hideLoading();
      wx.showToast({
        title: err.message || '识别失败，请重试',
        icon: 'none'
      });
      this.setData({ isUploading: false });
    }
  },

  async startUploadReadingFlow(bookData, ocrText) {
    try {
      this.setData({ isThinking: true });

      const result = await api.startUploadReading(bookData, ocrText);

      const welcomeMsg = {
        id: Date.now(),
        type: 'text',
        role: 'ai',
        content: result.message
      };

      this.setData({
        messages: [welcomeMsg],
        phase: 'reading',
        scrollToView: 'msg-' + welcomeMsg.id,
        isThinking: false,
        chatHistory: [{ role: 'assistant', content: result.message }]
      });

      setTimeout(() => {
        this.showUploadStoryContent(bookData, ocrText);
      }, 1500);

    } catch (err) {
      console.error('开始拍照阅读失败:', err);
      this.setData({ isThinking: false });
      wx.showToast({ title: 'AI连接失败', icon: 'none' });
      this.startLocalFlow();
    }
  },

  showUploadStoryContent(bookData, ocrText) {
    const storyMsg = {
      id: Date.now() + 1,
      type: 'story',
      role: 'ai',
      content: ocrText || bookData.content
    };

    const messages = [...this.data.messages, storyMsg];
    this.setData({
      messages,
      scrollToView: 'msg-' + storyMsg.id,
      phase: 'retelling'
    });

    setTimeout(() => {
      this.addAIMessage('太棒啦！你今天读的是《' + bookData.title + '》～ 能用自己的话给书书讲讲这个故事吗？😊');
      this.setData({
        chatHistory: [...this.data.chatHistory, { role: 'assistant', content: '太棒啦！你今天读的是《' + bookData.title + '》～ 能用自己的话给书书讲讲这个故事吗？😊' }]
      });
    }, 2000);
  },

  chooseFromShelf() {
    const books = app.globalData.books.length ? app.globalData.books : wx.getStorageSync('books') || [];
    const bookNames = books.map(b => b.title);
    
    wx.showActionSheet({
      itemList: bookNames,
      success: (res) => {
        const selectedBook = books[res.tapIndex];
        this.loadBook(selectedBook.id);
      }
    });
  }
});