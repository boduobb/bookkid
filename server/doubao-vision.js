const https = require('https');
const fs = require('fs');

const DOUBAO_API_KEY = process.env.DOUBAO_API_KEY;
const DOUBAO_MODEL = process.env.DOUBAO_MODEL || 'doubao-seed-1-8-vision-250615';
const DOUBAO_BASE_URL = process.env.DOUBAO_BASE_URL || 'https://ark.cn-beijing.volces.com/api/v3';

function callDoubaoVision(messages, temperature = 0.3) {
  return new Promise((resolve, reject) => {
    const url = new URL(DOUBAO_BASE_URL + '/chat/completions');
    const payload = JSON.stringify({
      model: DOUBAO_MODEL,
      messages: messages,
      temperature: temperature,
      max_tokens: 2048
    });

    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + DOUBAO_API_KEY
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (result.choices && result.choices.length > 0) {
            resolve(result.choices[0].message.content);
          } else if (result.error) {
            reject(new Error(result.error.message || '豆包API调用失败'));
          } else {
            reject(new Error('豆包API返回格式错误'));
          }
        } catch (err) {
          reject(err);
        }
      });
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function recognizeText(imagePath) {
  const imageBuffer = fs.readFileSync(imagePath);
  const imageBase64 = imageBuffer.toString('base64');

  const messages = [
    {
      role: 'user',
      content: [
        {
          type: 'image_url',
          image_url: { url: 'data:image/jpeg;base64,' + imageBase64 }
        },
        {
          type: 'text',
          text: '请提取这张图片中的所有文字内容，按阅读顺序逐行输出。如果是绘本，请完整提取所有文字。只输出文字内容，不要添加任何解释或说明。'
        }
      ]
    }
  ];

  try {
    const result = await callDoubaoVision(messages, 0.1);
    return result.trim();
  } catch (err) {
    console.error('豆包文字识别错误:', err.message);
    throw err;
  }
}

async function analyzeBookImage(imagePath) {
  const imageBuffer = fs.readFileSync(imagePath);
  const imageBase64 = imageBuffer.toString('base64');

  const messages = [
    {
      role: 'user',
      content: [
        {
          type: 'image_url',
          image_url: { url: 'data:image/jpeg;base64,' + imageBase64 }
        },
        {
          type: 'text',
          text: `这是一本儿童绘本的内页，请你：
1. 提取页面上所有的文字内容
2. 描述画面中的主要角色和场景
3. 用孩子能听懂的话，简单说说这一页讲了什么

请按以下格式输出：
【文字内容】
（提取的完整文字）

【画面描述】
（画面中的角色、场景、动作等）

【本页大意】
（用简单的话概括这一页的内容）`
        }
      ]
    }
  ];

  try {
    const result = await callDoubaoVision(messages, 0.5);
    return result.trim();
  } catch (err) {
    console.error('豆包图片分析错误:', err.message);
    throw err;
  }
}

async function recognizeMultipleImages(imagePaths) {
  const results = [];
  for (let i = 0; i < imagePaths.length; i++) {
    const imagePath = imagePaths[i];
    try {
      console.log(`正在识别第 ${i + 1}/${imagePaths.length} 张图片...`);
      const text = await recognizeText(imagePath);
      if (text) results.push(text);
    } catch (err) {
      console.error('识别图片失败:', imagePath, err.message);
    }
  }
  return results.join('\n\n===== 第 ' + results.indexOf(results[results.length - 1]) + ' 页 =====\n\n');
}

async function analyzeMultipleBookImages(imagePaths) {
  const results = [];
  for (let i = 0; i < imagePaths.length; i++) {
    const imagePath = imagePaths[i];
    try {
      console.log(`正在分析第 ${i + 1}/${imagePaths.length} 张绘本图片...`);
      const analysis = await analyzeBookImage(imagePath);
      results.push(`第 ${i + 1} 页：\n${analysis}`);
    } catch (err) {
      console.error('分析图片失败:', imagePath, err.message);
    }
  }
  return results.join('\n\n' + '='.repeat(30) + '\n\n');
}

function analyzeBookContent(text) {
  const lines = text.split('\n').filter(l => l.trim());
  const title = lines[0] || '未识别的书籍';
  const author = lines.find(l => l.includes('著') || l.includes('作者') || l.includes('文') || l.includes('图')) || '';
  const isPictureBook = text.length < 1000;
  const characters = extractCharacters(text);
  const summary = text.substring(0, 300) + (text.length > 300 ? '...' : '');

  return {
    title: title.replace(/[著作者文图:：·]/g, '').trim(),
    author: author.replace(/[著作者文图:：·]/g, '').trim(),
    category: isPictureBook ? '绘本故事' : '儿童文学',
    content: text,
    characters,
    summary,
    isPictureBook,
    cover: '📖',
    color: '#FFE4E1'
  };
}

function extractCharacters(text) {
  const commonNames = [
    '小兔子', '大兔子', '小熊', '大熊', '小猪', '猪妈妈',
    '爷爷', '奶奶', '爸爸', '妈妈', '小明', '小红',
    '小猫', '小狗', '小鸟', '小猴子', '狐狸', '狼',
    '大卫', '约瑟', '小象', '兔子', '松鼠', '青蛙',
    '鸭子', '母鸡', '山羊', '小牛', '小马', '公主',
    '王子', '国王', '王后', '巫婆', '仙女'
  ];
  const found = commonNames.filter(name => text.includes(name));
  return found.length > 0 ? [...new Set(found)] : ['故事中的角色'];
}

module.exports = {
  recognizeText,
  recognizeMultipleImages,
  analyzeBookImage,
  analyzeMultipleBookImages,
  analyzeBookContent,
  callDoubaoVision
};
