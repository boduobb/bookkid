// server/index.js - 小书童后端服务主入口
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { callSpark, buildReadingSystemPrompt, buildQuizSystemPrompt, buildRoleplaySystemPrompt } = require('./spark-api');
const { recognizeMultipleImages, analyzeBookContent } = require('./tencent-ocr');
const { loadConfig, saveConfig, resetConfig, buildSystemPromptFromConfig } = require('./agent-config');

const app = express();
const PORT = process.env.PORT || 3000;

// 创建上传目录
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 配置multer - 支持多文件上传
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 单张10MB
    files: 20 // 最多20张
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('只支持图片文件'));
    }
  }
});

// 中间件
app.use(cors());
app.use(express.json());

// 书籍数据（和小程序同步）
const BOOKS = [
  {
    id: '1',
    title: '小猫钓鱼',
    author: '金近',
    cover: '🐱',
    category: '童话故事',
    color: '#FFE4E1',
    summary: '猫妈妈带着小猫去河边钓鱼...',
    content: '猫妈妈带着小猫去河边钓鱼。蜻蜓飞来了，小猫放下鱼竿就去捉蜻蜓...',
    characters: ['小猫', '猫妈妈']
  },
  {
    id: '2',
    title: '龟兔赛跑',
    author: '伊索寓言',
    cover: '🐢',
    category: '寓言故事',
    color: '#E0F7FA',
    summary: '兔子嘲笑乌龟爬得慢...',
    content: '森林里要举行运动会啦！兔子嘲笑乌龟爬得慢...',
    characters: ['兔子', '乌龟']
  },
  {
    id: '3',
    title: '三只小猪',
    author: '英国童话',
    cover: '🐷',
    category: '童话故事',
    color: '#FFF3E0',
    summary: '三只小猪盖房子...',
    content: '猪妈妈有三个孩子...',
    characters: ['猪老大', '猪老二', '猪老三', '大灰狼']
  },
  {
    id: '4',
    title: '小蝌蚪找妈妈',
    author: '方惠珍',
    cover: '🐸',
    category: '科普故事',
    color: '#E8F5E9',
    summary: '小蝌蚪们出生后不知道妈妈长什么样...',
    content: '池塘里有一群小蝌蚪...',
    characters: ['小蝌蚪', '鲤鱼妈妈', '乌龟', '青蛙妈妈']
  },
  {
    id: '5',
    title: '司马光砸缸',
    author: '历史故事',
    cover: '🏺',
    category: '历史故事',
    color: '#F3E5F5',
    summary: '司马光小时候和小伙伴们在院子里玩...',
    content: '司马光小时候是个聪明勇敢的孩子...',
    characters: ['司马光', '小伙伴']
  },
  {
    id: '6',
    title: '孔融让梨',
    author: '历史故事',
    cover: '🍐',
    category: '传统美德',
    color: '#FFFDE7',
    summary: '孔融小时候，家里来了客人...',
    content: '东汉时期，有个叫孔融的小朋友...',
    characters: ['孔融', '父亲', '兄弟们']
  }
];

// ============ API接口 ============

/**
 * 获取书籍列表
 */
app.get('/api/books', (req, res) => {
  res.json({ success: true, data: BOOKS });
});

/**
 * 获取单本书籍详情
 */
app.get('/api/books/:id', (req, res) => {
  const book = BOOKS.find(b => b.id === req.params.id);
  if (book) {
    res.json({ success: true, data: book });
  } else {
    res.json({ success: false, message: '书籍不存在' });
  }
});

/**
 * 开始阅读对话 - AI引导复述
 * POST /api/chat/start
 * body: { bookId }
 */
app.post('/api/chat/start', async (req, res) => {
  try {
    const { bookId } = req.body;
    const book = BOOKS.find(b => b.id === bookId);
    
    if (!book) {
      return res.json({ success: false, message: '书籍不存在' });
    }

    const systemPrompt = buildSystemPromptFromConfig(loadConfig(), book);
    
    // 发送初始引导消息
    const messages = [
      { role: 'user', content: `请给孩子发送阅读开始的消息，用亲切的语气介绍这本书《${book.title}》，并引导孩子开始阅读。` }
    ];

    const aiResponse = await callSpark(messages, systemPrompt);
    
    res.json({ 
      success: true, 
      data: {
        message: aiResponse,
        book: book,
        phase: 'reading'
      }
    });
  } catch (err) {
    console.error('开始阅读错误:', err);
    res.json({ success: false, message: err.message });
  }
});

/**
 * 阅读对话 - 孩子发送消息，AI回复
 * POST /api/chat/message
 * body: { bookId, userMessage, history, phase }
 */
app.post('/api/chat/message', async (req, res) => {
  try {
    const { bookId, userMessage, history = [], phase = 'retelling' } = req.body;
    const book = BOOKS.find(b => b.id === bookId);
    
    if (!book) {
      return res.json({ success: false, message: '书籍不存在' });
    }

    const systemPrompt = buildSystemPromptFromConfig(loadConfig(), book);
    
    // 构建对话历史
    const messages = [
      ...history,
      { role: 'user', content: userMessage }
    ];

    const aiResponse = await callSpark(messages, systemPrompt);
    
    // 判断是否进入下一阶段（简化逻辑）
    let nextPhase = phase;
    let phaseChange = false;
    
    // 如果对话次数足够，建议进入下一阶段
    if (phase === 'retelling' && history.length >= 4) {
      nextPhase = 'comprehension';
      phaseChange = true;
    } else if (phase === 'comprehension' && history.length >= 6) {
      nextPhase = 'quiz';
      phaseChange = true;
    }

    res.json({ 
      success: true, 
      data: {
        message: aiResponse,
        phase: nextPhase,
        phaseChange
      }
    });
  } catch (err) {
    console.error('对话错误:', err);
    res.json({ success: false, message: err.message });
  }
});

/**
 * 生成阅读理解题目
 * POST /api/quiz/generate
 * body: { bookId }
 */
app.post('/api/quiz/generate', async (req, res) => {
  try {
    const { bookId } = req.body;
    const book = BOOKS.find(b => b.id === bookId);
    
    if (!book) {
      return res.json({ success: false, message: '书籍不存在' });
    }

    const systemPrompt = buildQuizSystemPrompt(book);
    
    const messages = [
      { role: 'user', content: '请生成题目' }
    ];

    const aiResponse = await callSpark(messages, systemPrompt);
    
    // 解析JSON题目
    let quizzes = [];
    try {
      // 清理可能的格式问题
      let cleanResponse = aiResponse.trim();
      if (cleanResponse.startsWith('```')) {
        cleanResponse = cleanResponse.replace(/```json?/g, '').replace(/```/g, '').trim();
      }
      quizzes = JSON.parse(cleanResponse);
    } catch (parseErr) {
      console.error('解析题目JSON失败:', parseErr, aiResponse);
      // 使用备用题目
      quizzes = book.quiz || [
        {
          question: '这个故事讲了什么？',
          options: ['一个有趣的冒险', '一个道理', '一个好笑的事', '一个可怕的事'],
          answer: 1
        }
      ];
    }

    res.json({ 
      success: true, 
      data: { quizzes }
    });
  } catch (err) {
    console.error('生成题目错误:', err);
    res.json({ success: false, message: err.message });
  }
});

/**
 * 角色扮演对话
 * POST /api/roleplay/start
 * body: { bookId, character }
 */
app.post('/api/roleplay/start', async (req, res) => {
  try {
    const { bookId, character } = req.body;
    const book = BOOKS.find(b => b.id === bookId);
    
    if (!book) {
      return res.json({ success: false, message: '书籍不存在' });
    }

    const systemPrompt = buildRoleplaySystemPrompt(book, character);
    
    const messages = [
      { role: 'user', content: `你好！我是小读者，我要扮演"${character}"，请开始角色扮演互动。` }
    ];

    const aiResponse = await callSpark(messages, systemPrompt);
    
    res.json({ 
      success: true, 
      data: {
        message: aiResponse,
        character: character
      }
    });
  } catch (err) {
    console.error('角色扮演错误:', err);
    res.json({ success: false, message: err.message });
  }
});

/**
 * 角色扮演对话
 * POST /api/roleplay/message
 * body: { bookId, character, userMessage, history }
 */
app.post('/api/roleplay/message', async (req, res) => {
  try {
    const { bookId, character, userMessage, history = [] } = req.body;
    const book = BOOKS.find(b => b.id === bookId);
    
    if (!book) {
      return res.json({ success: false, message: '书籍不存在' });
    }

    const systemPrompt = buildRoleplaySystemPrompt(book, character);
    
    const messages = [
      ...history,
      { role: 'user', content: userMessage }
    ];

    const aiResponse = await callSpark(messages, systemPrompt);
    
    res.json({ 
      success: true, 
      data: { message: aiResponse }
    });
  } catch (err) {
    console.error('角色扮演对话错误:', err);
    res.json({ success: false, message: err.message });
  }
});

/**
 * 获取故事总结/主旨理解
 * POST /api/summary
 * body: { bookId, userSummary }
 */
app.post('/api/summary', async (req, res) => {
  try {
    const { bookId, userSummary } = req.body;
    const book = BOOKS.find(b => b.id === bookId);
    
    if (!book) {
      return res.json({ success: false, message: '书籍不存在' });
    }

    const systemPrompt = buildSystemPromptFromConfig(loadConfig(), book);
    
    const messages = [
      { role: 'user', content: `孩子说这个故事的主旨是："${userSummary}"，请给予评价和鼓励，并补充这个故事想要传达的道理。` }
    ];

    const aiResponse = await callSpark(messages, systemPrompt);
    
    res.json({ 
      success: true, 
      data: { message: aiResponse }
    });
  } catch (err) {
    console.error('总结错误:', err);
    res.json({ success: false, message: err.message });
  }
});

/**
 * 批量上传图片并识别
 * POST /api/upload/recognize
 * body: multipart/form-data (images字段，多张图片)
 */
app.post('/api/upload/recognize', upload.array('images', 20), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.json({ success: false, message: '请选择要上传的图片' });
    }

    const files = req.files;
    console.log(`收到 ${files.length} 张图片上传`);

    // 获取图片路径
    const imagePaths = files.map(f => f.path);

    let ocrText = '';
    let bookData = null;

    try {
      // 调用腾讯云OCR识别
      console.log('开始调用腾讯云OCR...');
      ocrText = await recognizeMultipleImages(imagePaths);
      
      if (!ocrText || ocrText.trim().length === 0) {
        throw new Error('未能识别出文字内容');
      }

      console.log('OCR识别成功，文字长度:', ocrText.length);

      // 分析书籍内容
      bookData = analyzeBookContent(ocrText);
      
    } catch (ocrErr) {
      console.error('腾讯云OCR识别失败，切换到模拟模式:', ocrErr.message);
      
      // OCR失败时，使用模拟数据
      const mockBooks = [
        {
          title: '猜猜我有多爱你',
          author: '山姆·麦克布雷尼',
          cover: '🐰',
          category: '绘本故事',
          color: '#FFE4E1',
          summary: '小兔子和大兔子比赛谁的爱更多...',
          content: '小兔子认真的告诉大兔子"我好爱你"，而大兔子回应小兔子说："我更爱你！"如此一来，不仅确定大兔子很爱自己，更希望自己的爱能胜过大兔子的爱。小兔子想尽办法用各种身体动作、看得见的景物来描述自己的爱意，直到他累得在大兔子的怀中睡着了。',
          characters: ['小兔子', '大兔子']
        },
        {
          title: '爷爷一定有办法',
          author: '菲比·吉尔曼',
          cover: '👴',
          category: '绘本故事',
          color: '#E3F2FD',
          summary: '爷爷总能把旧东西变成新的...',
          content: '当约瑟还是娃娃的时候，爷爷为他缝了一条奇妙的毯子。毯子又舒服、又保暖，还可以把噩梦通通赶跑。不过，约瑟渐渐长大了，奇妙的毯子也变得老旧了。妈妈对他说："约瑟，看看你的毯子，又破又旧，好难看，真该把它丢了。"约瑟说："爷爷一定有办法。"',
          characters: ['约瑟', '爷爷', '妈妈']
        },
        {
          title: '大卫，不可以',
          author: '大卫·香农',
          cover: '👦',
          category: '绘本故事',
          color: '#FFF3E0',
          summary: '大卫总是做各种调皮的事...',
          content: '大卫的妈妈总是说："大卫，不可以！"大卫伸着舌头，站在椅子上颤颤巍巍去够糖罐；大卫一身污泥回家，客厅的地毯上留下了一串黑脚印；大卫在浴缸里闹翻了天，水流成河；大卫光着屁股跑到了大街上……每一幅页面里都有妈妈说的话"大卫，不可以！"',
          characters: ['大卫', '妈妈']
        }
      ];

      const bookIndex = files.length % mockBooks.length;
      bookData = mockBooks[bookIndex];
      ocrText = '【OCR识别失败，已切换到演示模式】\n\n请上传清晰的书籍内页图片，OCR将自动识别内容。';
    }

    // 返回识别结果
    res.json({
      success: true,
      data: {
        book: bookData,
        imageCount: files.length,
        images: files.map(f => ({
          filename: f.filename,
          size: f.size,
          url: `/uploads/${f.filename}`
        })),
        ocrText: ocrText,
        confidence: 0.95,
        ocrMode: bookData.title ? 'tencent' : 'demo'
      }
    });

  } catch (err) {
    console.error('图片上传识别错误:', err);
    res.json({ success: false, message: err.message || '图片识别失败' });
  }
});

/**
 * 从拍照/上传开始阅读
 * POST /api/upload/start-reading
 * body: { bookData, images }
 */
app.post('/api/upload/start-reading', async (req, res) => {
  try {
    const { bookData, ocrText } = req.body;

    if (!bookData) {
      return res.json({ success: false, message: '书籍信息不能为空' });
    }

    // 构建系统提示词，加入OCR识别的内容
    const agentConfig = loadConfig();
    const systemPrompt = buildSystemPromptFromConfig(agentConfig, bookData, ocrText || bookData.content);

    // 发送初始引导消息
    const messages = [
      { role: 'user', content: `孩子通过拍照上传了一本书《${bookData.title || '他今天读的书'}》，请用亲切的语气和孩子打招呼，告诉他你已经收到了他拍的照片，并引导他开始分享今天读的内容。` }
    ];

    const aiResponse = await callSpark(messages, systemPrompt);

    res.json({
      success: true,
      data: {
        message: aiResponse,
        book: bookData,
        phase: 'reading',
        systemPrompt
      }
    });

  } catch (err) {
    console.error('开始拍照阅读错误:', err);
    res.json({ success: false, message: err.message || '开始阅读失败' });
  }
});

/**
 * 拍照阅读对话 - 孩子发送消息，AI回复
 * POST /api/upload/message
 * body: { bookData, userMessage, history, phase, ocrText }
 */
app.post('/api/upload/message', async (req, res) => {
  try {
    const { bookData, userMessage, history = [], phase = 'retelling', ocrText } = req.body;

    if (!bookData) {
      return res.json({ success: false, message: '书籍信息不能为空' });
    }

    const agentConfig = loadConfig();
    const systemPrompt = buildSystemPromptFromConfig(agentConfig, bookData, ocrText || bookData.content);

    // 构建对话历史
    const messages = [
      ...history,
      { role: 'user', content: userMessage }
    ];

    const aiResponse = await callSpark(messages, systemPrompt);

    // 判断是否进入下一阶段
    let nextPhase = phase;
    let phaseChange = false;

    if (phase === 'retelling' && history.length >= 4) {
      nextPhase = 'comprehension';
      phaseChange = true;
    } else if (phase === 'comprehension' && history.length >= 6) {
      nextPhase = 'quiz';
      phaseChange = true;
    }

    res.json({
      success: true,
      data: {
        message: aiResponse,
        phase: nextPhase,
        phaseChange
      }
    });

  } catch (err) {
    console.error('拍照阅读对话错误:', err);
    res.json({ success: false, message: err.message || '对话失败' });
  }
});

/**
 * 获取智能体配置
 */
app.get('/api/agent/config', (req, res) => {
  try {
    const config = loadConfig();
    res.json({ success: true, data: config });
  } catch (err) {
    console.error('获取智能体配置失败:', err);
    res.json({ success: false, message: err.message });
  }
});

/**
 * 更新智能体配置
 */
app.post('/api/agent/config', (req, res) => {
  try {
    const config = saveConfig(req.body);
    res.json({ success: true, data: config, message: '配置已保存' });
  } catch (err) {
    console.error('保存智能体配置失败:', err);
    res.json({ success: false, message: err.message });
  }
});

/**
 * 重置智能体配置
 */
app.post('/api/agent/reset', (req, res) => {
  try {
    const config = resetConfig();
    res.json({ success: true, data: config, message: '已恢复默认配置' });
  } catch (err) {
    console.error('重置智能体配置失败:', err);
    res.json({ success: false, message: err.message });
  }
});

/**
 * 检查服务器状态
 */
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: '小书童AI阅读服务运行正常',
    sparkApi: '已配置'
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`\n🦉 小书童AI阅读服务已启动！`);
  console.log(`📍 服务地址: http://localhost:${PORT}`);
  console.log(`📖 API接口:`);
  console.log(`   - GET  /api/books          获取书籍列表`);
  console.log(`   - GET  /api/books/:id      获取书籍详情`);
  console.log(`   - POST /api/chat/start     开始阅读对话`);
  console.log(`   - POST /api/chat/message   发送对话消息`);
  console.log(`   - POST /api/quiz/generate  生成理解题目`);
  console.log(`   - POST /api/roleplay/start 开始角色扮演`);
  console.log(`   - POST /api/roleplay/message 角色扮演对话`);
  console.log(`   - POST /api/summary        故事主旨理解`);
  console.log(`\n💡 请在小程序中配置后端地址: http://localhost:${PORT}\n`);
});