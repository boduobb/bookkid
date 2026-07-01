// app.js
App({
  onLaunch() {
    this.initUserData();
    this.loadMockData();
  },

  globalData: {
    userInfo: null,
    books: [],
    achievements: [],
    readingHistory: []
  },

  initUserData() {
    const userInfo = wx.getStorageSync('userInfo');
    if (!userInfo) {
      const defaultUser = {
        nickname: '小读者',
        avatar: '',
        level: 1,
        stars: 0,
        coins: 0,
        streakDays: 0,
        totalReadTime: 0,
        booksRead: 0,
        lastReadDate: null
      };
      wx.setStorageSync('userInfo', defaultUser);
      this.globalData.userInfo = defaultUser;
    } else {
      this.globalData.userInfo = userInfo;
    }
  },

  loadMockData() {
    const books = [
      {
        id: '1',
        title: '小猫钓鱼',
        author: '金近',
        cover: '🐱',
        category: '童话故事',
        color: '#FFE4E1',
        summary: '猫妈妈带着小猫去河边钓鱼。小猫三心二意，一会儿捉蜻蜓，一会儿捉蝴蝶，一条鱼也没钓到。后来小猫听了妈妈的话，一心一意地钓鱼，终于钓到了一条大鱼。',
        content: '猫妈妈带着小猫去河边钓鱼。蜻蜓飞来了，小猫放下鱼竿就去捉蜻蜓。蝴蝶飞来了，小猫又放下鱼竿去捉蝴蝶。结果小猫一条鱼也没钓到，猫妈妈却钓到了一条大鱼。小猫不好意思地低下头说："我也想钓到鱼。"猫妈妈说："钓鱼要一心一意，不能一会儿捉蜻蜓，一会儿捉蝴蝶。"小猫听了妈妈的话，开始认真钓鱼。蜻蜓又飞来了，蝴蝶又飞来了，小猫就像没看见一样。不一会儿，小猫也钓到了一条大鱼！',
        quiz: [
          {
            question: '小猫一开始为什么没钓到鱼？',
            options: ['因为鱼竿不好', '因为三心二意', '因为河里没有鱼', '因为猫妈妈不让'],
            answer: 1
          },
          {
            question: '猫妈妈告诉小猫钓鱼要怎么样？',
            options: ['要跑得快', '要一心一意', '要多说话', '要大声喊'],
            answer: 1
          }
        ],
        characters: ['小猫', '猫妈妈']
      },
      {
        id: '2',
        title: '龟兔赛跑',
        author: '伊索寓言',
        cover: '🐢',
        category: '寓言故事',
        color: '#E0F7FA',
        summary: '兔子嘲笑乌龟爬得慢，乌龟说总有一天他会赢。兔子想都没想就答应了比赛。比赛开始后，兔子跑得飞快，不一会儿就把乌龟远远甩在后面。兔子觉得自己肯定赢了，就在树下睡着了。而乌龟一直不停地爬，当兔子醒来时，乌龟已经到达终点了。',
        content: '森林里要举行运动会啦！兔子嘲笑乌龟爬得慢，乌龟不服气地说："我虽然爬得慢，但我一定会坚持到底的。咱们比一比谁先跑到山顶！"兔子哈哈大笑："比就比，我肯定赢！"发令枪一响，兔子"噌"地一下就冲了出去，跑得可快了。乌龟呢，一步一步慢慢地往前爬。兔子跑了一半，回头一看，乌龟连影子都看不见。"哈哈，乌龟太慢了，我先睡一觉再跑也来得及！"兔子靠在一棵大树下，不一会儿就睡着了。乌龟虽然爬得慢，但是他一步也没有停下，不停地往前爬。当兔子醒来的时候，发现乌龟已经快到终点了！兔子赶紧追，可是已经晚了，乌龟第一个到达了终点。',
        quiz: [
          {
            question: '比赛中兔子做了什么？',
            options: ['一直跑', '睡觉了', '加油助威', '放弃比赛'],
            answer: 1
          },
          {
            question: '谁赢得了比赛？',
            options: ['兔子', '乌龟', '平局', '不知道'],
            answer: 1
          }
        ],
        characters: ['兔子', '乌龟']
      },
      {
        id: '3',
        title: '三只小猪',
        author: '英国童话',
        cover: '🐷',
        category: '童话故事',
        color: '#FFF3E0',
        summary: '三只小猪盖房子，老大盖了草房子，老二盖了木房子，老三盖了砖房子。大灰狼来了，吹倒了草房子和木房子，但是砖房子怎么也吹不倒。最后三只小猪齐心协力，用智慧赶走了大灰狼。',
        content: '猪妈妈有三个孩子。有一天，猪妈妈说："孩子们，你们长大了，该自己盖房子住了。"老大最懒，用稻草很快就盖好了一间草房子。老二用木头盖了一间木房子。老三最勤快，一块砖一块砖地盖，盖了一间结实的砖房子。一天，大灰狼来了，他看到草房子，"呼--"一吹，草房子就倒了！老大赶紧跑到老二的木房子里。大灰狼又来吹木房子，"呼--呼--"木房子也倒了！老大和老二赶紧跑到老三的砖房子里。大灰狼使出全身力气吹，"呼--呼--呼--"砖房子却一动也不动。大灰狼想从烟囱爬进去，可是三只小猪早就烧好了一锅热水。大灰狼掉进去，"哎哟！烫死我啦！"大灰狼夹着尾巴逃走了。',
        quiz: [
          {
            question: '哪只小猪盖的房子最结实？',
            options: ['老大', '老二', '老三', '都一样'],
            answer: 2
          },
          {
            question: '大灰狼最后怎么样了？',
            options: ['吃掉了小猪', '被热水烫跑了', '睡着了', '和小猪做朋友了'],
            answer: 1
          }
        ],
        characters: ['猪老大', '猪老二', '猪老三', '大灰狼']
      },
      {
        id: '4',
        title: '小蝌蚪找妈妈',
        author: '方惠珍',
        cover: '🐸',
        category: '科普故事',
        color: '#E8F5E9',
        summary: '小蝌蚪们出生后不知道妈妈长什么样，他们一路寻找，遇到了鸭妈妈、金鱼、乌龟、大白鹅，最后终于找到了自己的妈妈——青蛙。在寻找的过程中，小蝌蚪们也慢慢长出了四肢，变成了小青蛙。',
        content: '池塘里有一群小蝌蚪，大大的脑袋，黑灰色的身子，甩着长长的尾巴，快活地游来游去。小蝌蚪游哇游，过了几天，长出了两条后腿。他们看见鲤鱼妈妈在教小鲤鱼捕食，就迎上去，问："鲤鱼阿姨，我们的妈妈在哪里？"鲤鱼妈妈说："你们的妈妈四条腿，宽嘴巴。你们到那边去找吧！"小蝌蚪游哇游，过了几天，长出了两条前腿。他们看见一只乌龟摆动着四条腿在水里游，连忙追上去，叫着："妈妈，妈妈！"乌龟笑着说："我不是你们的妈妈。你们的妈妈头顶上有两只大眼睛，披着绿衣裳。你们到那边去找吧！"小蝌蚪游哇游，过了几天，尾巴变短了。他们游到荷花旁边，看见荷叶上蹲着一只大青蛙，披着碧绿的衣裳，露着雪白的肚皮，鼓着一对大眼睛。小蝌蚪游过去，叫着："妈妈，妈妈！"青蛙妈妈低头一看，笑着说："好孩子，你们已经长成青蛙了，快跳上来吧！"',
        quiz: [
          {
            question: '小蝌蚪的妈妈是谁？',
            options: ['鲤鱼', '乌龟', '青蛙', '鸭子'],
            answer: 2
          },
          {
            question: '小蝌蚪先长出的是？',
            options: ['前腿', '后腿', '尾巴', '眼睛'],
            answer: 1
          }
        ],
        characters: ['小蝌蚪', '鲤鱼妈妈', '乌龟', '青蛙妈妈']
      },
      {
        id: '5',
        title: '司马光砸缸',
        author: '历史故事',
        cover: '🏺',
        category: '历史故事',
        color: '#F3E5F5',
        summary: '司马光小时候和小伙伴们在院子里玩。一个小朋友不小心掉进了大水缸里。别的孩子都吓得哭了起来，只有司马光冷静地搬起一块大石头，砸破了水缸，水流出来，小朋友得救了。',
        content: '司马光小时候是个聪明勇敢的孩子。有一天，他和小伙伴们在花园里玩捉迷藏。花园里有一口大水缸，里面装满了水。有个小朋友爬到假山上去玩，一不小心，掉进了大水缸里。"救命啊！救命啊！"别的小朋友都慌了，有的吓哭了，有的叫着喊着跑去找大人。司马光没有慌，他举起一块大石头，使劲砸那口缸，"哐当！"缸破了，缸里的水一下子涌了出来。落水的小朋友得救了！司马光遇事不慌，沉着冷静，真是个聪明的孩子！',
        quiz: [
          {
            question: '司马光用什么救出了小伙伴？',
            options: ['手', '绳子', '大石头砸缸', '喊大人'],
            answer: 2
          },
          {
            question: '这个故事告诉我们什么道理？',
            options: ['不要玩水', '遇事要冷静想办法', '要跑得快', '要多交朋友'],
            answer: 1
          }
        ],
        characters: ['司马光', '小伙伴']
      },
      {
        id: '6',
        title: '孔融让梨',
        author: '历史故事',
        cover: '🍐',
        category: '传统美德',
        color: '#FFFDE7',
        summary: '孔融小时候，家里来了客人，父亲让他把梨分给大家。孔融把大的梨分给了哥哥和弟弟，自己留了最小的。父亲问他为什么，他说："哥哥比我大，应该吃大的；弟弟比我小，我应该让着他。"',
        content: '东汉时期，有个叫孔融的小朋友，他非常聪明懂事。孔融有五个哥哥，一个弟弟，兄弟七人感情特别好。有一天，家里来了客人，父亲买了一筐梨，让孔融把梨分给兄弟们吃。孔融看了看筐里的梨，有大的有小的。他先挑了一个最大的梨给了大哥，然后依次给哥哥们分了大梨，又给弟弟们也分了大梨，最后给自己留了一个最小的梨。父亲看见了，心里很高兴，故意问孔融："孩子，你为什么把大梨都分给别人，自己留最小的呢？"孔融认真地回答："哥哥们比我大，应该吃大的；弟弟们比我小，我是哥哥，应该让着弟弟，所以我吃小的。"父亲听了，连连点头，夸奖孔融是个懂事的好孩子。',
        quiz: [
          {
            question: '孔融给自己留了什么样的梨？',
            options: ['最大的', '最小的', '中等的', '最甜的'],
            answer: 1
          },
          {
            question: '这个故事告诉我们什么道理？',
            options: ['要多吃水果', '要尊敬长辈、友爱兄弟', '要跑得快', '要好好学习'],
            answer: 1
          }
        ],
        characters: ['孔融', '父亲', '兄弟们']
      }
    ];

    const achievements = [
      { id: '1', name: '初次阅读', description: '完成第一次阅读', icon: '📖', unlocked: true },
      { id: '2', name: '坚持不懈', description: '连续阅读7天', icon: '🔥', unlocked: false },
      { id: '3', name: '故事大王', description: '读完10本书', icon: '👑', unlocked: false },
      { id: '4', name: '答题小能手', description: '答对50道题', icon: '✏️', unlocked: true },
      { id: '5', name: '角色扮演达人', description: '参与10次角色扮演', icon: '🎭', unlocked: false },
      { id: '6', name: '表达小明星', description: '完成20次复述', icon: '🌟', unlocked: false },
      { id: '7', name: '探索家', description: '阅读3种不同类型的书', icon: '🔍', unlocked: true },
      { id: '8', name: '月度冠军', description: '一个月阅读30天', icon: '🏆', unlocked: false }
    ];

    this.globalData.books = books;
    this.globalData.achievements = achievements;

    if (!wx.getStorageSync('books')) {
      wx.setStorageSync('books', books);
    }
    if (!wx.getStorageSync('achievements')) {
      wx.setStorageSync('achievements', achievements);
    }
  },

  updateUserInfo(data) {
    const userInfo = { ...this.globalData.userInfo, ...data };
    this.globalData.userInfo = userInfo;
    wx.setStorageSync('userInfo', userInfo);
  },

  addReadingRecord(bookId, duration = 15) {
    const history = wx.getStorageSync('readingHistory') || [];
    const today = new Date().toISOString().split('T')[0];
    
    const record = {
      id: Date.now(),
      bookId,
      date: today,
      duration,
      completed: true
    };
    
    history.unshift(record);
    this.globalData.readingHistory = history;
    wx.setStorageSync('readingHistory', history);

    const userInfo = this.globalData.userInfo;
    userInfo.totalReadTime += duration;
    userInfo.booksRead += 1;
    userInfo.stars += 15;
    userInfo.coins += 10;

    if (userInfo.lastReadDate !== today) {
      const lastDate = new Date(userInfo.lastReadDate);
      const todayDate = new Date(today);
      const diffTime = todayDate - lastDate;
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        userInfo.streakDays += 1;
      } else if (diffDays > 1) {
        userInfo.streakDays = 1;
      } else if (!userInfo.lastReadDate) {
        userInfo.streakDays = 1;
      }
      userInfo.lastReadDate = today;
    }

    const expPerLevel = 100;
    const newLevel = Math.floor(userInfo.totalReadTime / expPerLevel) + 1;
    if (newLevel > userInfo.level) {
      userInfo.level = newLevel;
      wx.showToast({ title: '恭喜升级！', icon: 'success' });
    }

    this.updateUserInfo(userInfo);
  }
});
