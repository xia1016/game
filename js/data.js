var sysInfo = wx.getSystemInfoSync();
var height  = sysInfo.windowHeight;
var width   = sysInfo.windowWidth;
// 安全区：避开刘海 / Home 条
var _safe   = sysInfo.safeArea || {};
var safeTop    = _safe.top    !== undefined ? _safe.top    : 0;
var safeBottom = _safe.bottom !== undefined ? (height - _safe.bottom) : 0;

/**
 * 「不一样的拼图」玩法全局状态
 *
 * 每题流程：
 *  1. 上方展示完整目标图，其中 1 块被挖空（呼吸光晕缺口）
 *  2. 下方展示 N 块候选碎片（1 正确 + N-1 干扰）
 *  3. 玩家点击正确碎片（无任何倒计时）
 *  4. 答对 → 碎片飞入缺口 + 粒子爆炸 + 连击计数
 *  5. 答错 → 错误碎片抖动 + 正确答案短暂高亮 + 错误计数
 *  6. 全部碎片归位 → 结算星级（0~3星）
 */

const data = {
  // ── 屏幕 ──────────────────────────────────────────────
  screenW:    width,
  screenH:    height,
  safeTop:    safeTop,    // 顶部安全区高度（刘海等）
  safeBottom: safeBottom, // 底部安全区高度（Home 条等）

  // ── 游戏进度 ──────────────────────────────────────────
  page:  0,   // 0=首页 1=游戏中
  level: 0,   // 当前关卡（对应图片索引 level+1）

  // ── 关卡参数（由 getLevelConfig 填入）────────────────
  pieceCols:     3,   // 目标图横向切块数
  pieceRows:     3,   // 目标图纵向切块数
  candidateCount: 4,  // 候选碎片数量（含 1 个正确）

  // ── 当前题目状态 ──────────────────────────────────────
  currentQuestion: null,
  /*
    currentQuestion 结构：
    {
      targetRow: number,
      targetCol: number,
      candidates: [{ row, col, x, y, isCorrect, state, shakeTimer }],
        // state: 'idle' | 'flying' | 'placed' | 'wrong' | 'reveal'
        // shakeTimer: 抖动动画剩余时间(ms)
      answered: boolean,
    }
  */

  // ── 答题记录 ──────────────────────────────────────────
  totalQuestions: 0,  // 本关总题数
  answeredCount:  0,  // 已答题数
  correctCount:   0,  // 答对题数
  wrongCount:     0,  // 答错次数

  // ── 连击 ──────────────────────────────────────────────
  combo:        0,    // 当前连击数
  maxCombo:     0,    // 本局最高连击
  comboPopups:  [],   // 连击爆字动画列表 [{x,y,text,alpha,vy,scale}]

  // ── 星级结算 ──────────────────────────────────────────
  // 0错→3星 / 1~2错→2星 / 3~4错→1星 / 5+错→0星
  stars: 0,

  // ── 目标图布局（由 initLevel 计算）──────────────────
  targetX: 0,
  targetY: 0,
  targetW: 0,
  targetH: 0,

  // ── 候选区布局 ────────────────────────────────────────
  candidateAreaY: 0,
  candidateAreaH: 0,

  // ── 广告占位高度（Banner 广告，底部）────────────────
  // 由 main.js 广告管理模块写入，布局计算时读取
  // 广告加载失败时为 0，不影响布局
  adBannerH: 0,

  // ── 随机关卡顺序 ──────────────────────────────────────
  // 由 game.js buildLevelOrder() 填入，每次进入首页重新生成
  // levelOrder[i] = urlList 中的 index，表示第 i 关用哪张图
  // 例如 levelOrder[0]=3 表示第 0 关用 urlList[3]
  levelOrder: [],

  // ── 题目出题顺序（进关时随机打乱，避免玩家记住顺序）──
  questionOrder: [],

  // ── 打码格子（进关时固定，第1关为空）────────────────
  maskedCells: [],

  // ── 已还原的格子记录 ──────────────────────────────────
  placedPieces: [],

  // ── 答错痕迹：wrongPieces[r][c] = { row, col } 表示该格答错时选了哪块碎片
  wrongPieces: [],

  // ── 图片资源 ──────────────────────────────────────────
  urlList: [
    "img/bg.jpg",
    "img-000/01.jpg",
    "img-000/02.jpg",
    "img-000/03.jpg",
    "img-000/04.jpg",
    "img-000/05.jpg",
    "img-000/06.jpg",
    "img-000/07.jpg",
    "img-000/08.jpg",
    "img-000/09.jpg",
    "img-000/10.jpg",
    "img-000/11.jpg",
    "img-000/12.jpg",
    "img-000/13.jpg",
    "img-000/14.jpg",
    "img-000/15.jpg",
    "img-000/16.jpg",
    "img-000/17.jpg",
    "img-000/18.jpg",
    "img-000/19.jpg",
    "img-000/20.jpg",
    "img-000/21.jpg",
    "img-000/22.jpg",
    "img-000/23.jpg",
  ],

  bgMusic: [
    "music/main-1.mp3",
    "music/main-2.mp3",
    "music/main-3.mp3",
    "music/main-4.mp3",
    "music/main-5.mp3",
  ],

  // ── 关卡配置 ──────────────────────────────────────────
  // 逐关递增难度：cols/rows 格子数、candidates 候选数、maskRatio 打码比例、rotate 是否旋转
  getLevelConfig(level) {
    const table = [
      { cols: 3, rows: 3, candidates: 4,  maskRatio: 0,    rotate: false }, // 关1：热身，顺序出题
      { cols: 4, rows: 4, candidates: 4,  maskRatio: 0,    rotate: false }, // 关2：格子变大，随机顺序
      { cols: 4, rows: 4, candidates: 6,  maskRatio: 0.15, rotate: false }, // 关3：加候选、加打码
      { cols: 5, rows: 5, candidates: 6,  maskRatio: 0.20, rotate: false }, // 关4：格子再大
      { cols: 5, rows: 5, candidates: 8,  maskRatio: 0.28, rotate: true  }, // 关5：加旋转
      { cols: 6, rows: 6, candidates: 8,  maskRatio: 0.35, rotate: true  }, // 关6：格子更大
      { cols: 7, rows: 7, candidates: 10, maskRatio: 0.40, rotate: true  }, // 关7+：地狱
    ];
    const idx = Math.min(level, table.length - 1);
    return table[idx];
  },

  // ── 星级计算 ──────────────────────────────────────────
  // 全部拼对才能过关：0错误 → 3星（过关），任意错误 → 0星（失败）
  calcStars(wrongCount) {
    return wrongCount === 0 ? 3 : 0;
  },
};

export default data;