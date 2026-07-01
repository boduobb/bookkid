// server/spark-api.js - 星火大模型API调用模块
const WebSocket = require('ws');
const crypto = require('crypto');

// 星火API配置 - 从环境变量读取
const SPARK_CONFIG = {
  appId: process.env.APPID || '33990c0b',
  apiSecret: process.env.API_SECRET || 'NjJiMjVmMGUzZjNkOWQ2OTMzNTgwNDU2',
  apiKey: process.env.API_KEY || '0f81be35ee6a1f9702b1a4967aeaa2ee',
  hostUrl: 'wss://spark-api.xf-yun.com/v3.5/chat',
};

/**
 * 生成星火API鉴权URL
 */
function getAuthUrl() {
  const apiKey = SPARK_CONFIG.apiKey;
  const apiSecret = SPARK_CONFIG.apiSecret;
  const hostUrl = SPARK_CONFIG.hostUrl;

  // 解析hostUrl
  const url = new URL(hostUrl);
  const host = url.host;
  const path = url.pathname;

  // 生成日期字符串
  const date = new Date().toUTCString();

  // 生成签名原始字符串
  const signatureOrigin = `host: ${host}\ndate: ${date}\nGET ${path} HTTP/1.1`;

  // 使用hmac-sha256加密
  const signature = crypto
    .createHmac('sha256', apiSecret)
    .update(signatureOrigin)
    .digest('base64');

  // 构建authorization
  const authorizationOrigin = `api_key="${apiKey}", algorithm="hmac-sha256", headers="host date request-line", signature="${signature}"`;
  const authorization = Buffer.from(authorizationOrigin).toString('base64');

  // 构建最终URL
  const authUrl = `${hostUrl}?authorization=${authorization}&date=${encodeURIComponent(date)}&host=${host}`;

  return authUrl;
}

/**
 * 调用星火大模型 - 发送消息并获取回复
 * @param {Array} messages - 对话历史 [{role: 'user'|'assistant', content: '...'}]
 * @param {string} systemPrompt - 系统提示词
 * @returns {Promise<string>} - AI回复内容
 */
function callSpark(messages, systemPrompt = '') {
  return new Promise((resolve, reject) => {
    const authUrl = getAuthUrl();
    const ws = new WebSocket(authUrl);

    let responseText = '';
    let isResolved = false;

    // 超时处理
    const timeout = setTimeout(() => {
      if (!isResolved) {
        ws.close();
        reject(new Error('星火API调用超时'));
      }
    }, 30000);

    ws.on('open', () => {
      // 构建请求消息
      const requestMessage = {
        header: {
          app_id: SPARK_CONFIG.appId,
          uid: 'xiaoshutong_user_' + Date.now()
        },
        parameter: {
          chat: {
            domain: 'generalv3.5', // Spark3.5 Ultra
            temperature: 0.7,
            max_tokens: 1024,
            top_k: 4
          }
        },
        payload: {
          message: {
            text: [
              // 添加系统提示词
              ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
              // 添加用户对话历史
              ...messages.map(msg => ({
                role: msg.role === 'user' ? 'user' : 'assistant',
                content: msg.content
              }))
            ]
          }
        }
      };

      ws.send(JSON.stringify(requestMessage));
    });

    ws.on('message', (data) => {
      try {
        const response = JSON.parse(data.toString());
        
        if (response.header && response.header.code !== 0) {
          clearTimeout(timeout);
          ws.close();
          reject(new Error(`星火API错误: ${response.header.code} - ${response.header.message || '未知错误'}`));
          return;
        }

        if (response.payload && response.payload.text) {
          responseText = response.payload.text.text || '';
        }

        // 检查是否完成
        if (response.header && response.header.status === 2) {
          clearTimeout(timeout);
          ws.close();
          isResolved = true;
          resolve(responseText);
        }
      } catch (err) {
        clearTimeout(timeout);
        ws.close();
        reject(new Error('解析星火API响应失败'));
      }
    });

    ws.on('error', (err) => {
      clearTimeout(timeout);
      reject(new Error(`WebSocket错误: ${err.message}`));
    });

    ws.on('close', () => {
      clearTimeout(timeout);
      if (!isResolved && responseText) {
        resolve(responseText);
      }
    });
  });
}

/**
 * 构建阅读对话的系统提示词
 */
function buildReadingSystemPrompt(book) {
  return `你是一个叫做"书书"的小书童，是一只可爱友善的猫头鹰，专门陪伴小学生阅读。

你的任务：
1. 用温暖、亲切、鼓励的语气和孩子交流
2. 用简单的语言，适合小学生理解
3. 引导孩子复述故事内容，帮助他们理解故事主旨
4. 提出有趣的问题激发孩子思考
5. 适时给予表扬和鼓励

当前阅读的书籍：《${book.title}》
作者：${book.author}
分类：${book.category}
故事简介：${book.summary}
完整故事内容：${book.content}
故事角色：${book.characters.join('、')}

交流原则：
- 每次回复不超过100字，简洁有趣
- 使用表情符号让回复更生动（如：😊、👍、🌟、🎉等）
- 如果孩子说得少，引导多说一些
- 用"哇"、"太棒了"、"真厉害"等鼓励性词语
- 称呼孩子为"小读者"`;
}

/**
 * 构建答题生成的系统提示词
 */
function buildQuizSystemPrompt(book) {
  return `你是一个教育专家，需要为小学生设计有趣的阅读理解题目。

当前书籍：《${book.title}》
故事内容：${book.content}

请根据故事内容，设计2道选择题，帮助孩子理解故事。

返回格式要求（严格按照JSON格式）：
[
  {
    "question": "题目内容",
    "options": ["选项A", "选项B", "选项C", "选项D"],
    "answer": 1
  }
]

注意：
1. 题目要简单有趣，适合小学生
2. 答案是正确选项的索引（0-3）
3. 只返回JSON数组，不要其他内容`;
}

/**
 * 构建角色扮演的系统提示词
 */
function buildRoleplaySystemPrompt(book, character) {
  const otherCharacters = book.characters.filter(c => c !== character);
  const aiCharacter = otherCharacters[0] || '书书';
  
  return `你现在要扮演故事《${book.title}》中的角色"${character}"，和孩子进行角色扮演互动。

故事背景：${book.content}

扮演规则：
1. 你是"${character}"，要体现这个角色的性格特点
2. 用角色的语气说话，可以加入动作描写
3. 回复要短（不超过50字），有趣生动
4. 鼓励孩子继续扮演互动
5. 使用表情符号让互动更生动`;
}

module.exports = {
  callSpark,
  buildReadingSystemPrompt,
  buildQuizSystemPrompt,
  buildRoleplaySystemPrompt,
  SPARK_CONFIG
};