// miniprogram/utils/api.js - 后端API请求模块

// 后端服务地址（正式环境 - HTTPS）
// 域名：bookkid.cloud
const API_BASE_URL = 'https://bookkid.cloud';

// ===== 开发环境配置（取消注释使用）=====
// const API_BASE_URL = 'http://localhost:3000';
// const API_BASE_URL = 'http://192.168.1.100:3000'; // 局域网IP（真机调试）

/**
 * 发送HTTP请求
 */
function request(url, method = 'GET', data = {}) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: API_BASE_URL + url,
      method,
      data,
      header: {
        'content-type': 'application/json'
      },
      success: (res) => {
        if (res.data.success) {
          resolve(res.data.data);
        } else {
          reject(new Error(res.data.message || '请求失败'));
        }
      },
      fail: (err) => {
        reject(new Error('网络请求失败: ' + err.errMsg));
      }
    });
  });
}

/**
 * 获取书籍列表
 */
function getBooks() {
  return request('/api/books');
}

/**
 * 获取书籍详情
 */
function getBook(bookId) {
  return request('/api/books/' + bookId);
}

/**
 * 开始阅读对话
 */
function startReading(bookId) {
  return request('/api/chat/start', 'POST', { bookId });
}

/**
 * 发送对话消息
 */
function sendMessage(bookId, userMessage, history = [], phase = 'retelling') {
  return request('/api/chat/message', 'POST', {
    bookId,
    userMessage,
    history,
    phase
  });
}

/**
 * 生成理解题目
 */
function generateQuiz(bookId) {
  return request('/api/quiz/generate', 'POST', { bookId });
}

/**
 * 开始角色扮演
 */
function startRoleplay(bookId, character) {
  return request('/api/roleplay/start', 'POST', { bookId, character });
}

/**
 * 角色扮演对话
 */
function roleplayMessage(bookId, character, userMessage, history = []) {
  return request('/api/roleplay/message', 'POST', {
    bookId,
    character,
    userMessage,
    history
  });
}

/**
 * 获取故事总结反馈
 */
function getSummary(bookId, userSummary) {
  return request('/api/summary', 'POST', { bookId, userSummary });
}

/**
 * 检查服务状态
 */
function checkHealth() {
  return request('/api/health');
}

/**
 * 批量上传图片并识别
 * @param {Array} tempFilePaths - 临时图片路径数组
 * @returns {Promise} 识别结果
 */
function uploadAndRecognize(tempFilePaths) {
  return new Promise((resolve, reject) => {
    const uploadTasks = [];
    
    // 逐个上传图片
    tempFilePaths.forEach(filePath => {
      uploadTasks.push(new Promise((res, rej) => {
        wx.uploadFile({
          url: API_BASE_URL + '/api/upload/recognize',
          filePath: filePath,
          name: 'images',
          success: (uploadRes) => {
            try {
              const data = JSON.parse(uploadRes.data);
              if (data.success) {
                res(data.data);
              } else {
                rej(new Error(data.message || '上传失败'));
              }
            } catch (err) {
              rej(new Error('解析响应失败'));
            }
          },
          fail: (err) => {
            rej(new Error('上传失败: ' + err.errMsg));
          }
        });
      }));
    });

    // 等待所有上传完成（取第一个的识别结果）
    Promise.all(uploadTasks)
      .then(results => {
        // 返回最后一张的识别结果（合并所有图片识别）
        resolve(results[results.length - 1]);
      })
      .catch(reject);
  });
}

/**
 * 从拍照开始阅读对话
 * @param {Object} bookData - 识别出的书籍信息
 * @param {string} ocrText - OCR识别文本
 */
function startUploadReading(bookData, ocrText) {
  return request('/api/upload/start-reading', 'POST', { bookData, ocrText });
}

/**
 * 拍照阅读对话 - 发送消息
 * @param {Object} bookData - 书籍信息
 * @param {string} userMessage - 用户消息
 * @param {Array} history - 对话历史
 * @param {string} phase - 当前阶段
 * @param {string} ocrText - OCR文本
 */
function sendUploadMessage(bookData, userMessage, history = [], phase = 'retelling', ocrText = '') {
  return request('/api/upload/message', 'POST', {
    bookData,
    userMessage,
    history,
    phase,
    ocrText
  });
}

/**
 * 获取智能体配置
 */
function getAgentConfig() {
  return request('/api/agent/config');
}

/**
 * 保存智能体配置
 */
function saveAgentConfig(config) {
  return request('/api/agent/config', 'POST', config);
}

/**
 * 重置智能体配置
 */
function resetAgentConfig() {
  return request('/api/agent/reset', 'POST');
}

module.exports = {
  API_BASE_URL,
  request,
  getBooks,
  getBook,
  startReading,
  sendMessage,
  generateQuiz,
  startRoleplay,
  roleplayMessage,
  getSummary,
  checkHealth,
  uploadAndRecognize,
  startUploadReading,
  sendUploadMessage,
  getAgentConfig,
  saveAgentConfig,
  resetAgentConfig
};