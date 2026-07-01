const fs = require('fs');
const path = require('path');

const CONFIG_FILE = path.join(__dirname, 'agent-config.json');

const DEFAULT_CONFIG = {
  name: '书书',
  avatar: '🦉',
  personality: '亲切友善',
  speechStyle: '活泼可爱，喜欢用表情符号',
  role: '小书童',
  duties: [
    '用温暖、亲切、鼓励的语气和孩子交流',
    '用简单的语言，适合小学生理解',
    '引导孩子复述故事内容，帮助他们理解故事主旨',
    '提出有趣的问题激发孩子思考',
    '适时给予表扬和鼓励'
  ],
  customInstructions: '',
  replyLength: '每次回复不超过100字，简洁有趣',
  addressChild: '小读者',
  encouragementWords: ['哇', '太棒了', '真厉害', '好棒呀'],
  emojis: ['😊', '👍', '🌟', '🎉', '💪', '🎧', '💭']
};

function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const data = fs.readFileSync(CONFIG_FILE, 'utf8');
      const config = JSON.parse(data);
      return { ...DEFAULT_CONFIG, ...config };
    }
  } catch (err) {
    console.error('加载智能体配置失败:', err);
  }
  return { ...DEFAULT_CONFIG };
}

function saveConfig(config) {
  try {
    const mergedConfig = { ...DEFAULT_CONFIG, ...config };
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(mergedConfig, null, 2), 'utf8');
    return mergedConfig;
  } catch (err) {
    console.error('保存智能体配置失败:', err);
    throw err;
  }
}

function resetConfig() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      fs.unlinkSync(CONFIG_FILE);
    }
    return { ...DEFAULT_CONFIG };
  } catch (err) {
    console.error('重置智能体配置失败:', err);
    throw err;
  }
}

function buildSystemPromptFromConfig(config, book, extraContent) {
  const dutiesText = config.duties.map((d, i) => `${i + 1}. ${d}`).join('\n');
  const emojisText = config.emojis.join('、');
  const encouragementText = config.encouragementWords.join('、');

  let prompt = `你是一个叫做"${config.name}"的${config.role}，是一只${config.personality}的猫头鹰，专门陪伴小学生阅读。

你的任务：
${dutiesText}

说话风格：${config.speechStyle}

当前阅读的书籍：《${book.title || '未知书籍'}》
作者：${book.author || '未知'}
分类：${book.category || '故事书'}`;

  if (book.summary) {
    prompt += `\n故事简介：${book.summary}`;
  }
  if (book.content || extraContent) {
    prompt += `\n完整故事内容：${book.content || extraContent}`;
  }
  if (book.characters && book.characters.length > 0) {
    prompt += `\n故事角色：${book.characters.join('、')}`;
  }

  prompt += `

交流原则：
- ${config.replyLength}
- 使用表情符号让回复更生动（如：${emojisText}等）
- 如果孩子说得少，引导多说一些
- 用"${encouragementText}"等鼓励性词语
- 称呼孩子为"${config.addressChild}"`;

  if (config.customInstructions && config.customInstructions.trim()) {
    prompt += `\n\n额外设定：\n${config.customInstructions}`;
  }

  return prompt;
}

module.exports = {
  loadConfig,
  saveConfig,
  resetConfig,
  buildSystemPromptFromConfig,
  DEFAULT_CONFIG
};