import Main from './js/main';
import data from './js/data';
import { createAudio } from './js/utils';
import { baseUrl } from './js/const';

var sysInfo = wx.getSystemInfoSync();
var height  = sysInfo.windowHeight;
var width   = sysInfo.windowWidth;
// 用物理像素渲染，解决高 DPI 屏模糊问题
var dpr     = sysInfo.pixelRatio || 1;
var canvas  = wx.createCanvas();
canvas.width  = width  * dpr;
canvas.height = height * dpr;
var ctx = canvas.getContext('2d');
ctx.scale(dpr, dpr);

// ─────────────────────────────────────────────────────────────
//  兼容微信小游戏的圆角矩形（不依赖 roundRect API）
// ─────────────────────────────────────────────────────────────
function _fillRoundRect(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arc(x + w - r, y + r, r, -Math.PI / 2, 0);
  ctx.lineTo(x + w, y + h - r);
  ctx.arc(x + w - r, y + h - r, r, 0, Math.PI / 2);
  ctx.lineTo(x + r, y + h);
  ctx.arc(x + r, y + h - r, r, Math.PI / 2, Math.PI);
  ctx.lineTo(x, y + r);
  ctx.arc(x + r, y + r, r, Math.PI, Math.PI * 1.5);
  ctx.closePath();
  ctx.fill();
}

// ─────────────────────────────────────────────────────────────
//  加载界面
// ─────────────────────────────────────────────────────────────
function showLoadingScreen(progress) {
  // 背景渐变（奶油白→浅橙）
  const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
  bgGrad.addColorStop(0, '#FFF9F0');
  bgGrad.addColorStop(1, '#FFE0CC');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // 背景装饰光斑（珊瑚橙）
  const gGrad = ctx.createRadialGradient(width * 0.5, height * 0.4, 0, width * 0.5, height * 0.4, width * 0.6);
  gGrad.addColorStop(0, 'rgba(255,107,107,0.10)');
  gGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = gGrad;
  ctx.fillRect(0, 0, width, height);

  // 标题（珊瑚橙→薄荷青渐变）
  ctx.save();
  ctx.font = 'bold 42px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const titleGrad = ctx.createLinearGradient(width / 2 - 100, 0, width / 2 + 100, 0);
  titleGrad.addColorStop(0, '#FF6B6B');
  titleGrad.addColorStop(1, '#4ECDC4');
  ctx.fillStyle = titleGrad;
  ctx.shadowColor = 'rgba(255,107,107,0.4)';
  ctx.shadowBlur = 18;
  ctx.fillText('不一样的拼图', width / 2, height * 0.38);
  ctx.restore();

  // 副标题
  ctx.save();
  ctx.font = '15px sans-serif';
  ctx.fillStyle = 'rgba(93,64,55,0.55)';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('资源加载中...', width / 2, height * 0.48);
  ctx.restore();

  // 进度条
  const barW = width * 0.58;
  const barH = 10;
  const barX = (width - barW) / 2;
  const barY = height * 0.55;
  // 背景槽
  ctx.save();
  ctx.fillStyle = 'rgba(93,64,55,0.12)';
  _fillRoundRect(ctx, barX, barY, barW, barH, barH / 2);
  // 渐变填充
  if (progress > 0) {
    const pGrad = ctx.createLinearGradient(barX, 0, barX + barW, 0);
    pGrad.addColorStop(0, '#FF6B6B');
    pGrad.addColorStop(1, '#4ECDC4');
    ctx.fillStyle = pGrad;
    _fillRoundRect(ctx, barX, barY, barW * progress, barH, barH / 2);
    // 高光
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    _fillRoundRect(ctx, barX, barY, barW * progress, barH * 0.45, barH / 2);
  }
  ctx.restore();

  // 百分比
  ctx.save();
  ctx.font = '13px sans-serif';
  ctx.fillStyle = 'rgba(93,64,55,0.5)';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(`${Math.round(progress * 100)}%`, width / 2, barY + barH + 10);
  ctx.restore();
}

// ─────────────────────────────────────────────────────────────
//  加载图片资源并启动游戏
// ─────────────────────────────────────────────────────────────
function start(urlList, savedLevel) {
  const images = [];
  let loadedCount = 0;
  const total = urlList.length;

  showLoadingScreen(0);

  // 背景音乐已关闭

  urlList.forEach((url, index) => {
    const img = wx.createImage();
    img.onload = function () {
      loadedCount++;
      showLoadingScreen(loadedCount / total);

      if (loadedCount === total) {
        ctx.clearRect(0, 0, width, height);
        new Main(ctx, images, savedLevel || 0);
      }
    };
    img.onerror = function () {
      // 加载失败也计数，避免卡死
      loadedCount++;
      showLoadingScreen(loadedCount / total);
      if (loadedCount === total) {
        ctx.clearRect(0, 0, width, height);
        new Main(ctx, images, savedLevel || 0);
      }
    };
    img.src = baseUrl + url;
    images.push(img);
  });
}

// ─────────────────────────────────────────────────────────────
//  入口：读取存档后启动
// ─────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────
//  生成随机关卡顺序（不改动 urlList 本身，避免破坏 level 索引）
//  data.levelOrder[i] 表示第 i 关实际使用 urlList 中的哪个 index
// ─────────────────────────────────────────────────────────────
function buildLevelOrder() {
  // urlList[0] 是背景图，urlList[1..n] 是关卡图
  const count = data.urlList.length - 1; // 关卡图数量
  const order = [];
  for (let i = 0; i < count; i++) order.push(i + 1); // [1, 2, 3, ...]
  // Fisher-Yates shuffle
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = order[i]; order[i] = order[j]; order[j] = tmp;
  }
  data.levelOrder = order;
}

// ─────────────────────────────────────────────────────────────
//  禁止截屏：截屏内容模糊 + 检测到截屏时换图
// ─────────────────────────────────────────────────────────────
// 让系统截屏/录屏时画面模糊（微信基础库 2.10.4+）
if (typeof wx.setVisualEffectOnCapture === 'function') {
  wx.setVisualEffectOnCapture({ visualEffect: 'hidden' });
}
// 检测到用户截屏：换图并弹提示
if (typeof wx.onUserCaptureScreen === 'function') {
  wx.onUserCaptureScreen(() => {
    // 换图：给当前关卡重新随机一张不同的图
    if (data.levelOrder && data.levelOrder.length > 0) {
      const imgCount = data.urlList.length - 1;
      const curImg = data.levelOrder[data.level] || 1;
      let newImg;
      let tries = 0;
      do {
        newImg = 1 + Math.floor(Math.random() * imgCount);
        tries++;
      } while (newImg === curImg && tries < 20);
      data.levelOrder[data.level] = newImg;
    }
    wx.showToast({ title: '检测到截屏，已更换图片', icon: 'none', duration: 2000 });
  });
}

// ─────────────────────────────────────────────────────────────
//  右上角转发：用当前关卡图；未开始游戏则随机一张
// ─────────────────────────────────────────────────────────────
wx.onShareAppMessage(() => {
  const list = data.urlList;
  // 关卡图从 index 1 开始，0 是背景图
  const imgCount = list.length - 1;
  let imgIdx;
  if (data.levelOrder && data.levelOrder.length > data.level && data.level >= 0) {
    // 有关卡顺序，取当前关对应的图
    imgIdx = data.levelOrder[data.level];
  } else {
    // 还没开始游戏，随机一张
    imgIdx = 1 + Math.floor(Math.random() * imgCount);
  }
  return {
    title: '太难了~救救救~',
    imageUrl: baseUrl + (list[imgIdx] || list[1]),
  };
});

wx.onShow(() => {
  if (data.page === 0) {
    // 每次进入首页重新生成随机关卡顺序
    buildLevelOrder();
    wx.getStorage({
      key: 'findPieceData',
      success(res) {
        const savedLevel = res.data && res.data.level ? res.data.level : 0;
        // 全量加载所有图片，确保任意关卡都能正常显示
        start(data.urlList, savedLevel);
      },
      fail() {
        start(data.urlList, 0);
      },
    });
  }
});