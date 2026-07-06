const https = require('https');
const http = require('http');
const url = require('url');

const DOUBAO_API_KEY = process.env.DOUBAO_API_KEY;
const DOUBAO_MODEL = process.env.DOUBAO_MODEL || 'doubao-seed-2-0-mini-260215';
const DOUBAO_BASE_URL = process.env.DOUBAO_BASE_URL || 'https://ark.cn-beijing.volces.com/api/v3';
const HTTPS_PROXY = process.env.HTTPS_PROXY || process.env.https_proxy || '';

function extractBasePath(baseUrl) {
  try {
    const urlObj = new URL(baseUrl);
    return urlObj.pathname.replace(/\/$/, '');
  } catch (e) {
    return '/api/v3';
  }
}

function makeHttpsRequest(requestOptions, payload) {
  return new Promise((resolve, reject) => {
    if (HTTPS_PROXY) {
      const proxyUrl = new URL(HTTPS_PROXY);
      const proxyOptions = {
        hostname: proxyUrl.hostname,
        port: proxyUrl.port || 80,
        method: 'CONNECT',
        path: requestOptions.hostname + ':' + (requestOptions.port || 443)
      };

      const proxyReq = http.request(proxyOptions);
      proxyReq.on('connect', (res, socket) => {
        if (res.statusCode !== 200) {
          reject(new Error('代理连接失败: ' + res.statusCode));
          return;
        }

        const httpsOptions = {
          ...requestOptions,
          socket: socket,
          agent: false
        };

        const req = https.request(httpsOptions, (response) => {
          let data = '';
          response.on('data', (chunk) => { data += chunk; });
          response.on('end', () => resolve({ statusCode: response.statusCode, data }));
        });
        req.on('error', reject);
        req.write(payload);
        req.end();
      });
      proxyReq.on('error', reject);
      proxyReq.end();
    } else {
      const req = https.request(requestOptions, (response) => {
        let data = '';
        response.on('data', (chunk) => { data += chunk; });
        response.on('end', () => resolve({ statusCode: response.statusCode, data }));
      });
      req.on('error', reject);
      req.write(payload);
      req.end();
    }
  });
}

function callDoubao(messages, systemPrompt = '', options = {}) {
  return new Promise((resolve, reject) => {
    const allMessages = [];
    if (systemPrompt) {
      allMessages.push({ role: 'system', content: systemPrompt });
    }
    for (const msg of messages) {
      allMessages.push({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content
      });
    }

    const requestBody = {
      model: DOUBAO_MODEL,
      messages: allMessages,
      temperature: options.temperature || 0.7,
      max_tokens: options.max_tokens || 1024,
      top_p: options.top_p || 0.9
    };

    const payload = JSON.stringify(requestBody);

    const basePath = extractBasePath(DOUBAO_BASE_URL);
    const hostname = DOUBAO_BASE_URL.replace(/^https?:\/\//, '').split('/')[0];

    const requestOptions = {
      hostname: hostname,
      port: 443,
      path: basePath + '/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + DOUBAO_API_KEY,
        'Content-Length': Buffer.byteLength(payload)
      }
    };

    const timeout = setTimeout(() => {
      reject(new Error('豆包API调用超时'));
    }, 60000);

    makeHttpsRequest(requestOptions, payload)
      .then(({ statusCode, data }) => {
        clearTimeout(timeout);
        try {
          const result = JSON.parse(data);
          if (result.error) {
            reject(new Error('豆包API错误: ' + (result.error.message || JSON.stringify(result.error))));
            return;
          }
          if (result.choices && result.choices.length > 0 && result.choices[0].message) {
            resolve(result.choices[0].message.content || '');
          } else {
            reject(new Error('豆包API返回格式异常: ' + data.substring(0, 200)));
          }
        } catch (err) {
          reject(new Error('解析豆包API响应失败: ' + err.message));
        }
      })
      .catch((err) => {
        clearTimeout(timeout);
        reject(new Error('豆包API请求失败: ' + err.message));
      });
  });
}

function buildReadingSystemPrompt(book) {
  return `你是一个叫做"书书"的小书童，是一只可爱友善的猫头鹰，专门陪伴小学生阅读。

核心职责：
1. 引导复述：鼓励孩子用自己的话复述故事内容
2. 抓主旨：帮助孩子理解故事的中心思想和道理
3. 分层提问：按照"简单→中等→进阶"三个层次提出问题

提问层次：
- 第一层（简单）：关于故事的基本事实（谁、什么、在哪里、什么时候）
- 第二层（中等）：关于故事的因果关系和角色情感
- 第三层（进阶）：关于故事的深层含义、道理和联系生活

当前阅读的书籍：《${book.title}》
作者：${book.author}
分类：${book.category}
故事简介：${book.summary}
完整故事内容：${book.content}
故事角色：${book.characters.join('、')}

交流原则：
- 每次回复不超过120字，简洁有趣
- 使用表情符号让回复更生动（如：😊、👍、🌟、🎉等）
- 如果孩子说得少，引导多说一些
- 用"哇"、"太棒了"、"真厉害"等鼓励性词语
- 称呼孩子为"小读者"
- 先让孩子复述，再逐步引导到主旨理解
- 根据孩子的回答水平调整问题难度`;
}

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
  callDoubao,
  buildReadingSystemPrompt,
  buildQuizSystemPrompt,
  buildRoleplaySystemPrompt,
  DOUBAO_MODEL
};
