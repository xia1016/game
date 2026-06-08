import data from './data';
import {
  playMusic, pauseMusic, resumeMusic,
  playBgm, stopBgm, pauseBgm, resumeBgm,
  createAudio, getEventPosition, autoShare,
  updateAndDrawParticles, spawnParticles,
  updateAndDrawComboPopups, spawnComboPopup,
  THEME,
} from './utils';
import {
  initLevel,
  generateQuestion,
  drawGame,
  drawHomeScreen,
  drawResultScreen,
  hitTestCandidate,
  hitTestStartBtn,
  hitTestResultBtn,
  drawGameMenu,
  hitTestGameMenu,
} from './init';
import { baseUrl } from './const';

const STATE = { HOME: 'home', PLAYING: 'playing', RESULT: 'result' };

// 飞行动画速度（每帧推进量）
const FLY_SPEED = 0.07;
// 答错后揭示正确答案的时长（ms）
const REVEAL_DURATION = 800;
// 答对后进入下一题的延迟（ms，等飞行动画）
const NEXT_QUESTION_DELAY = 550;
// 碎片抖动总时长（ms）
const SHAKE_DURATION = 400;

export default function Main(ctx, images, savedLevel) {
  const w = data.screenW;
  const h = data.screenH;

  data.level = savedLevel || 0;
  data.page  = 1;

  // ── 广告管理 ──────────────────────────────────────────
  // Banner 广告：首页底部 / 结算页卡片下方
  // adUnitId 替换为实际申请的广告单元 ID
  let bannerAd = null;
  const AD_UNIT_ID = 'adunit-xxxxxxxxxxxxxxxx'; // TODO: 替换为真实广告单元 ID
  const AD_H = 100; // Banner 广告高度（逻辑像素），与 data.adBannerH 保持一致

  function _createBannerAd() {
    if (typeof wx.createBannerAd !== 'function') return;
    try {
      bannerAd = wx.createBannerAd({
        adUnitId: AD_UNIT_ID,
        style: {
          left:   0,
          top:    h - AD_H - (data.safeBottom || 0),
          width:  w,
          height: AD_H,
        },
      });
      bannerAd.onResize(res => {
        // 广告实际高度可能与请求不同，同步更新
        data.adBannerH = res.height || AD_H;
        bannerAd.style.top  = h - data.adBannerH - (data.safeBottom || 0);
        bannerAd.style.left = (w - res.width) / 2;
      });
      bannerAd.onError(() => {
        data.adBannerH = 0; // 广告加载失败，不占位
      });
    } catch (e) {
      data.adBannerH = 0;
    }
  }

  function _showBannerAd() {
    if (bannerAd) bannerAd.show().catch(() => {});
  }

  function _hideBannerAd() {
    if (bannerAd) bannerAd.hide().catch(() => {});
  }

  // 不预设广告高度，等广告 onResize 回调后再更新
  // 这样按钮初始位置稳定，不会因广告加载失败而跳动
  // data.adBannerH 初始值为 0（见 data.js），广告成功后由 onResize 写入
  _createBannerAd();

  // ── 音效 ──────────────────────────────────────────────
  const sfxClick = wx.createInnerAudioContext();
  const sfxWin   = wx.createInnerAudioContext();
  createAudio(sfxClick, '/audio/click.mp3', false, false);
  createAudio(sfxWin,   '/audio/succ.mp3',  false, false);

  // ── 状态 ──────────────────────────────────────────────
  let gameState         = STATE.HOME;
  let particles         = [];
  let lastTick          = 0;
  let nextQuestionTimer = 0;
  let waitingNext       = false;
  let resultAnim        = 0;   // 结果页星星动画进度 0→1
  let btnPressAnim      = 0;   // 开始按钮按下动画进度 0→1（0=未触发）
  let btnPressDuration  = 480; // 动画总时长 ms
  // 结果页按钮动画：{ action, cx, cy, progress }，action=null 表示未触发
  let resultBtnAnim     = { action: null, cx: 0, cy: 0, progress: 0 };
  const RESULT_BTN_DUR  = 380; // 结果页按钮动画时长 ms
  // 游戏内菜单是否打开
  let showGameMenu      = false;

  // ── 主循环 ────────────────────────────────────────────
  function gameLoop(timestamp) {
    requestAnimationFrame(gameLoop);

    const dt = lastTick ? Math.min(timestamp - lastTick, 50) : 16;
    lastTick = timestamp;

    ctx.clearRect(0, 0, w, h);

    if (gameState === STATE.HOME) {
      // 推进按钮按下动画
      if (btnPressAnim > 0 && btnPressAnim < 1) {
        btnPressAnim = Math.min(1, btnPressAnim + dt / btnPressDuration);
        if (btnPressAnim >= 1) {
          // 动画播完，正式进入游戏
          _startGame();
          return;
        }
      }
      drawHomeScreen(ctx, images, w, h, btnPressAnim);
      return;
    }

    if (gameState === STATE.RESULT) {
      drawGame(ctx, images);
      updateAndDrawParticles(ctx, particles);
      resultAnim = Math.min(1, resultAnim + dt / 800);

      // 推进结果页按钮动画
      if (resultBtnAnim.action) {
        resultBtnAnim.progress = Math.min(1, resultBtnAnim.progress + dt / RESULT_BTN_DUR);
        if (resultBtnAnim.progress >= 1) {
          // 动画结束，执行对应操作
          const act = resultBtnAnim.action;
          resultBtnAnim = { action: null, cx: 0, cy: 0, progress: 0 };
          if (act === 'next') {
            data.level = (data.level + 1) % (data.urlList.length - 1);
            _startGame();
          } else if (act === 'retry') {
            _startGame(true); // 重玩换图
          } else if (act === 'share') {
            // 分享当前正在玩的关卡图
            const imgIdx = (data.levelOrder && data.levelOrder.length > data.level)
              ? data.levelOrder[data.level]
              : data.level + 1;
            autoShare(baseUrl + (data.urlList[imgIdx] || data.urlList[1]));
          }
          return;
        }
      }

      drawResultScreen(ctx, w, h, data.stars, resultAnim, resultBtnAnim);
      return;
    }

    // ── PLAYING ──────────────────────────────────────────

    // 1. 抖动计时器 + 旋转推进
    _tickShake(dt);
    _tickRotation();

    // 2. 飞行动画
    _updateFlying();

    // 3. 等待下一题
    if (waitingNext) {
      nextQuestionTimer -= dt;
      if (nextQuestionTimer <= 0) {
        waitingNext = false;
        _nextQuestion();
      }
    }

    // 4. 绘制
    drawGame(ctx, images);
    updateAndDrawParticles(ctx, particles);
    updateAndDrawComboPopups(ctx, data.comboPopups);
    if (showGameMenu) drawGameMenu(ctx, w, h);
  }

  // ── 抖动计时器推进 ────────────────────────────────────
  function _tickShake(dt) {
    const q = data.currentQuestion;
    if (!q) return;
    q.candidates.forEach(c => {
      if (c.shakeTimer > 0) c.shakeTimer = Math.max(0, c.shakeTimer - dt);
    });
  }

  // ── 旋转角度推进（干扰项缓慢旋转）────────────────────
  function _tickRotation() {
    const q = data.currentQuestion;
    if (!q) return;
    q.candidates.forEach(c => {
      if (c.rotSpeed && c.state === 'idle') {
        c.rotation = (c.rotation + c.rotSpeed) % (Math.PI * 2);
      }
    });
  }

  // ── 飞行动画推进 ──────────────────────────────────────
  function _updateFlying() {
    const q = data.currentQuestion;
    if (!q) return;

    q.candidates.forEach(c => {
      if (c.state !== 'flying') return;
      c.flyProgress += FLY_SPEED;
      if (c.flyProgress >= 1) {
        c.flyProgress = 1;
        c.state = 'placed';
        data.placedPieces[c.row][c.col] = true;

        // 彩色粒子爆炸
        const cellW = data.targetW / data.pieceCols;
        const cellH = data.targetH / data.pieceRows;
        const tx = data.targetX + c.col * cellW + cellW / 2;
        const ty = data.targetY + c.row * cellH + cellH / 2;
        const comboColors = [THEME.gold, THEME.accent, THEME.accentAlt, THEME.correct];
        const color = comboColors[Math.min(data.combo - 1, comboColors.length - 1)] || THEME.gold;
        spawnParticles(particles, tx, ty, color);
      }
    });
  }

  // ── 玩家点击候选碎片 ──────────────────────────────────
  function _onTapCandidate(idx) {
    const q = data.currentQuestion;
    if (!q || q.answered || waitingNext) return;

    sfxClick.play();
    const c = q.candidates[idx];

    if (c.isCorrect) {
      // ── 答对 ──────────────────────────────────────────
      c.state = 'flying';
      c.flyProgress = 0;
      c.flyStartX = c.x;
      c.flyStartY = c.y;
      q.answered = true;
      data.correctCount++;
      data.answeredCount++;

      // 连击
      data.combo++;
      if (data.combo > data.maxCombo) data.maxCombo = data.combo;

      // 连击爆字（在碎片位置弹出）
      spawnComboPopup(data.comboPopups, c.x, c.y - c.size * 0.7, data.combo);

      waitingNext = true;
      nextQuestionTimer = NEXT_QUESTION_DELAY;

    } else {
      // ── 答错 ──────────────────────────────────────────
      c.state = 'wrong';
      c.shakeTimer = SHAKE_DURATION;
      q.answered = true;
      data.answeredCount++;
      data.wrongCount++;
      data.combo = 0;  // 断连击

      // 记录错误痕迹：把错选的碎片坐标存到目标格子
      if (data.wrongPieces[q.targetRow]) {
        data.wrongPieces[q.targetRow][q.targetCol] = { row: c.row, col: c.col };
      }

      // 高亮正确答案
      q.candidates.forEach(cd => {
        if (cd.isCorrect) cd.state = 'reveal';
      });

      waitingNext = true;
      nextQuestionTimer = REVEAL_DURATION;
    }
  }

  // ── 进入下一题 ────────────────────────────────────────
  function _nextQuestion() {
    if (data.answeredCount >= data.totalQuestions) {
      _endGame();
      return;
    }
    generateQuestion(data.answeredCount);
  }

  // ── 结束游戏 ──────────────────────────────────────────
  function _endGame() {
    if (gameState !== STATE.PLAYING) return;

    data.stars = data.calcStars(data.wrongCount);
    gameState  = STATE.RESULT;
    resultAnim = 0;
    pauseMusic();
    sfxWin.play();
    _showBannerAd(); // 结算页重新显示广告

    // 存档（记录最高星级）
    wx.getStorage({
      key: 'findPieceData',
      success(res) {
        const saved = res.data || {};
        const key = `stars_${data.level}`;
        const bestStars = Math.max(saved[key] || 0, data.stars);
        saved[key] = bestStars;
        saved.level = Math.max(saved.level || 0, data.level + 1);
        wx.setStorage({ key: 'findPieceData', data: saved, success() {} });
      },
      fail() {
        const saved = { level: data.level + 1 };
        saved[`stars_${data.level}`] = data.stars;
        wx.setStorage({ key: 'findPieceData', data: saved, success() {} });
      },
    });

    // 3星时全屏粒子庆祝
    if (data.stars >= 3) {
      for (let i = 0; i < 6; i++) {
        setTimeout(() => {
          spawnParticles(particles, w * (0.2 + Math.random() * 0.6), h * 0.4, null);
        }, i * 120);
      }
    }
  }

  // ── 触摸事件 ──────────────────────────────────────────
  wx.onTouchStart(function (e) {
    const p = getEventPosition(e.touches[0]);

    if (gameState === STATE.HOME) {
      if (btnPressAnim === 0 && hitTestStartBtn(p.x, p.y, w, h)) {
        sfxClick.play();
        btnPressAnim = 0.001; // 触发动画（>0 即开始推进）
      }
      return;
    }

    if (gameState === STATE.RESULT) {
      if (resultBtnAnim.action) return; // 动画进行中，忽略重复点击
      const hit = hitTestResultBtn(p.x, p.y, w, h);
      if (hit) {
        sfxClick.play();
        resultBtnAnim = { action: hit.action, cx: hit.cx, cy: hit.cy, progress: 0.001 };
      }
      return;
    }

    if (gameState !== STATE.PLAYING) return;

    // 菜单按钮 / 菜单浮层点击
    const menuHit = hitTestGameMenu(p.x, p.y, w, h, showGameMenu);
    if (menuHit === 'menuBtn') {
      sfxClick.play();
      showGameMenu = !showGameMenu;
      return;
    }
    if (showGameMenu) {
      if (menuHit === 'resume') {
        sfxClick.play();
        showGameMenu = false;
      } else if (menuHit === 'retry') {
        sfxClick.play();
        showGameMenu = false;
        _startGame(true); // 重玩换图
      } else if (menuHit === 'home') {
        sfxClick.play();
        showGameMenu = false;
        gameState = STATE.HOME;
        stopBgm();
        pauseMusic();
        playBgm();
        _showBannerAd();
      }
      return;
    }

    const idx = hitTestCandidate(p.x, p.y);
    if (idx !== -1) _onTapCandidate(idx);
  }, false);

  // ── 后台切换 ──────────────────────────────────────────
  // ── 启动 ──────────────────────────────────────────────
  // reroll=true 时给当前关卡换一张不同的图，防止多次拍照拼接作弊
  function _startGame(reroll) {
    if (reroll && data.levelOrder && data.levelOrder.length > 1) {
      const imgCount = data.urlList.length - 1; // 关卡图数量
      const curImg = data.levelOrder[data.level];
      // 从全部图片里随机取一张不同的
      let newImg;
      let tries = 0;
      do {
        newImg = 1 + Math.floor(Math.random() * imgCount);
        tries++;
      } while (newImg === curImg && tries < 20);
      data.levelOrder[data.level] = newImg;
    }
    initLevel(images);
    generateQuestion(0);
    gameState = STATE.PLAYING;
    lastTick = 0;
    waitingNext = false;
    nextQuestionTimer = 0;
    particles = [];
    btnPressAnim = 0;
    _hideBannerAd(); // 游戏中隐藏广告，避免遮挡操作区
    stopBgm();        // 进入游戏，停止首页背景音乐
    playMusic();
  }

  // 首页显示广告 + 播放背景音乐
  _showBannerAd();
  playBgm();

  // 后台切换时暂停/恢复首页背景音乐
  wx.onShow(() => {
    if (data.page === 1 && gameState === STATE.PLAYING) resumeMusic();
    if (gameState === STATE.HOME) resumeBgm();
  });
  wx.onHide(() => {
    if (data.page === 1) pauseMusic();
    pauseBgm();
  });

  requestAnimationFrame(gameLoop);
}