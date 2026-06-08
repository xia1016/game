// ─────────────────────────────────────────────────────────────
//  主题色板
// ─────────────────────────────────────────────────────────────
export const THEME = {
  bg:        '#FFF9F0',   // 奶油白背景
  bgCard:    '#FFFFFF',   // 卡片底色（纯白）
  accent:    '#FF6B6B',   // 珊瑚橙主色
  accentAlt: '#4ECDC4',   // 薄荷青辅助
  gold:      '#FFB300',   // 金黄（星星/连击）
  correct:   '#66BB6A',   // 答对绿
  wrong:     '#EF5350',   // 答错红
  textPri:   '#5D4037',   // 深棕主文字
  textSub:   'rgba(93,64,55,0.55)',    // 次文字
  glow:      'rgba(255,107,107,0.30)', // 珊瑚光晕
};

// ─────────────────────────────────────────────────────────────
//  兼容微信小游戏的圆角矩形
// ─────────────────────────────────────────────────────────────
export function fillRoundRect(ctx, x, y, w, h, r) {
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

export function strokeRoundRect(ctx, x, y, w, h, r) {
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
  ctx.stroke();
}

// ─────────────────────────────────────────────────────────────
//  背景音乐（首页循环播放，进入游戏停止）
// ─────────────────────────────────────────────────────────────
let _bgm = null;

function _getBgm() {
  if (!_bgm) {
    _bgm = wx.createInnerAudioContext();
    _bgm.src    = '/audio/home-bgm.mp3';
    _bgm.loop   = true;
    _bgm.volume = 0.45;
  }
  return _bgm;
}

export function playBgm() {
  try { _getBgm().play(); } catch (e) {}
}

export function stopBgm() {
  try { if (_bgm) { _bgm.stop(); } } catch (e) {}
}

export function pauseBgm() {
  try { if (_bgm) { _bgm.pause(); } } catch (e) {}
}

export function resumeBgm() {
  try { if (_bgm) { _bgm.play(); } } catch (e) {}
}

// 兼容旧调用（游戏内背景音乐已关闭，保留空函数）
export function playMusic() {}
export function pauseMusic() {}
export function resumeMusic() {}

export function createAudio(ctx, src, autoplay, loop) {
  ctx.src = src;
  ctx.autoplay = autoplay;
  ctx.loop = loop;
}

// ─────────────────────────────────────────────────────────────
//  触摸坐标
// ─────────────────────────────────────────────────────────────
export function getEventPosition(ev) {
  if (ev.pageX !== undefined) return { x: ev.pageX, y: ev.pageY };
  if (ev.offsetX !== undefined) return { x: ev.offsetX, y: ev.offsetY };
  return { x: 0, y: 0 };
}

// ─────────────────────────────────────────────────────────────
//  分享
// ─────────────────────────────────────────────────────────────
export function autoShare(url) {
  wx.shareAppMessage({ title: '太难了~救救救~', imageUrl: url });
}

// ─────────────────────────────────────────────────────────────
//  圆角矩形按钮（渐变版）
// ─────────────────────────────────────────────────────────────
export function drawButton(ctx, startPoint, w, h, radius, style, text, textColor, fontSize) {
  ctx.save();

  if (style === 'primary') {
    // 珊瑚橙→薄荷青渐变主按钮
    const grad = ctx.createLinearGradient(startPoint.x, startPoint.y, startPoint.x + w, startPoint.y + h);
    grad.addColorStop(0, '#FF6B6B');
    grad.addColorStop(1, '#4ECDC4');
    ctx.fillStyle = grad;
    fillRoundRect(ctx, startPoint.x, startPoint.y, w, h, radius);
    // 内发光边框
    ctx.strokeStyle = 'rgba(255,255,255,0.45)';
    ctx.lineWidth = 1.5;
    strokeRoundRect(ctx, startPoint.x + 1, startPoint.y + 1, w - 2, h - 2, radius);
  } else if (style === 'ghost') {
    // 描边幽灵按钮
    ctx.fillStyle = 'rgba(255,107,107,0.08)';
    fillRoundRect(ctx, startPoint.x, startPoint.y, w, h, radius);
    ctx.strokeStyle = 'rgba(255,107,107,0.55)';
    ctx.lineWidth = 1.5;
    strokeRoundRect(ctx, startPoint.x, startPoint.y, w, h, radius);
  } else {
    // 自定义 style 当 fillStyle
    ctx.fillStyle = style;
    fillRoundRect(ctx, startPoint.x, startPoint.y, w, h, radius);
  }

  ctx.fillStyle = textColor || '#fff';
  ctx.font = `bold ${fontSize}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0,0,0,0.4)';
  ctx.shadowBlur = 4;
  ctx.fillText(text, startPoint.x + w / 2, startPoint.y + h / 2);
  ctx.restore();
}

// ─────────────────────────────────────────────────────────────
//  绘制一块碎片（裁剪自原图，支持旋转）
// ─────────────────────────────────────────────────────────────
// pieceW/pieceH 为碎片显示宽高（保持原图宽高比），size 为向后兼容的正方形尺寸
export function drawPiece(ctx, img, row, col, cols, rows, cx, cy, size, rotation, alpha, pieceW, pieceH) {
  if (!img || !img.width) return;
  const srcW = img.width / cols;
  const srcH = img.height / rows;
  const sx = col * srcW;
  const sy = row * srcH;
  // 优先使用 pieceW/pieceH，没有则退回正方形 size
  const dw = pieceW !== undefined ? pieceW : size;
  const dh = pieceH !== undefined ? pieceH : size;
  const hw = dw / 2;
  const hh = dh / 2;
  // 锯齿感用短边的 5%
  const jag = Math.min(dw, dh) * 0.05;

  ctx.save();
  ctx.globalAlpha = alpha !== undefined ? alpha : 1;
  ctx.translate(cx, cy);
  ctx.rotate(rotation || 0);
  ctx.beginPath();
  ctx.moveTo(-hw + jag, -hh);
  ctx.lineTo( hw - jag, -hh);
  ctx.lineTo( hw,       -hh + jag);
  ctx.lineTo( hw,        hh - jag);
  ctx.lineTo( hw - jag,  hh);
  ctx.lineTo(-hw + jag,  hh);
  ctx.lineTo(-hw,        hh - jag);
  ctx.lineTo(-hw,       -hh + jag);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(img, sx, sy, srcW, srcH, -hw, -hh, dw, dh);
  ctx.restore();
}

// ─────────────────────────────────────────────────────────────
//  绘制碎片边框（与 drawPiece 同形状）
// ─────────────────────────────────────────────────────────────
export function drawPieceBorder(ctx, cx, cy, size, rotation, color, lineWidth, pieceW, pieceH) {
  const dw = pieceW !== undefined ? pieceW : size;
  const dh = pieceH !== undefined ? pieceH : size;
  const hw = dw / 2;
  const hh = dh / 2;
  const jag = Math.min(dw, dh) * 0.05;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rotation || 0);
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth || 1.5;
  ctx.beginPath();
  ctx.moveTo(-hw + jag, -hh);
  ctx.lineTo( hw - jag, -hh);
  ctx.lineTo( hw,       -hh + jag);
  ctx.lineTo( hw,        hh - jag);
  ctx.lineTo( hw - jag,  hh);
  ctx.lineTo(-hw + jag,  hh);
  ctx.lineTo(-hw,        hh - jag);
  ctx.lineTo(-hw,       -hh + jag);
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
}

// ─────────────────────────────────────────────────────────────
//  绘制单颗星星（五角星）
//  cx/cy=中心, r=外径, filled=是否实心, color=颜色
// ─────────────────────────────────────────────────────────────
export function drawStar(ctx, cx, cy, r, filled, color, glowColor) {
  const inner = r * 0.42;
  const points = 5;
  ctx.save();
  if (glowColor) {
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = r * 1.2;
  }
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const angle = (i * Math.PI) / points - Math.PI / 2;
    const rad = i % 2 === 0 ? r : inner;
    const x = cx + Math.cos(angle) * rad;
    const y = cy + Math.sin(angle) * rad;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.closePath();
  if (filled) {
    ctx.fillStyle = color || THEME.gold;
    ctx.fill();
  } else {
    ctx.strokeStyle = color || 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
  ctx.restore();
}

// ─────────────────────────────────────────────────────────────
//  进度条
// ─────────────────────────────────────────────────────────────
export function drawProgressBar(ctx, x, y, w, h, progress, color) {
  ctx.save();
  // 背景槽（明显底色，白色背景上也能看清）
  ctx.fillStyle = 'rgba(93,64,55,0.13)';
  fillRoundRect(ctx, x, y, w, h, h / 2);
  if (progress > 0) {
    // 渐变填充
    const grad = ctx.createLinearGradient(x, y, x + w, y);
    grad.addColorStop(0, color || THEME.accent);
    grad.addColorStop(1, THEME.accentAlt);
    ctx.fillStyle = grad;
    fillRoundRect(ctx, x, y, w * Math.min(progress, 1), h, h / 2);
    // 高光
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    fillRoundRect(ctx, x, y, w * Math.min(progress, 1), h * 0.45, h / 2);
  }
  ctx.restore();
}

// ─────────────────────────────────────────────────────────────
//  连击爆字：生成
// ─────────────────────────────────────────────────────────────
export function spawnComboPopup(popups, cx, cy, combo) {
  const texts = ['', '', '连击！', '太棒了！', '超强！', '无敌！', '传说！'];
  const text = combo >= 2
    ? (combo < texts.length ? texts[combo] : '传说！') + ` ×${combo}`
    : null;
  if (!text) return;
  popups.push({
    x: cx,
    y: cy,
    text,
    alpha: 1,
    vy: -2.2,
    scale: 1.4,
  });
}

// ─────────────────────────────────────────────────────────────
//  连击爆字：更新 + 绘制
// ─────────────────────────────────────────────────────────────
export function updateAndDrawComboPopups(ctx, popups) {
  for (let i = popups.length - 1; i >= 0; i--) {
    const p = popups[i];
    p.y  += p.vy;
    p.vy *= 0.88;
    p.alpha -= 0.022;
    p.scale  = Math.max(1, p.scale - 0.025);
    if (p.alpha <= 0) { popups.splice(i, 1); continue; }

    ctx.save();
    ctx.globalAlpha = p.alpha;
    ctx.translate(p.x, p.y);
    ctx.scale(p.scale, p.scale);
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = THEME.gold;
    ctx.shadowBlur = 14;
    ctx.fillStyle = THEME.gold;
    ctx.fillText(p.text, 0, 0);
    ctx.restore();
  }
}

// ─────────────────────────────────────────────────────────────
//  粒子特效：生成（彩色）
// ─────────────────────────────────────────────────────────────
const PARTICLE_COLORS = ['#FFB300', '#FF6B6B', '#FF8A65', '#66BB6A', '#4ECDC4', '#FFE66D', '#F06292', '#29B6F6'];

export function spawnParticles(particles, cx, cy, color) {
  const count = 20;
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
    const speed = 2.5 + Math.random() * 5.5;
    const c = color || PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)];
    particles.push({
      x: cx, y: cy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 1.5,
      alpha: 1,
      color: c,
      r: 2.5 + Math.random() * 3.5,
      shape: Math.random() > 0.5 ? 'circle' : 'rect',
    });
  }
}

export function updateAndDrawParticles(ctx, particles) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx; p.y += p.vy;
    p.vy += 0.22;
    p.vx *= 0.97;
    p.alpha -= 0.028;
    if (p.alpha <= 0) { particles.splice(i, 1); continue; }
    ctx.save();
    ctx.globalAlpha = p.alpha;
    ctx.fillStyle = p.color;
    if (p.shape === 'rect') {
      ctx.translate(p.x, p.y);
      ctx.rotate(p.vx * 0.3);
      ctx.fillRect(-p.r, -p.r * 0.5, p.r * 2, p.r);
    } else {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

// ─────────────────────────────────────────────────────────────
//  随机工具
// ─────────────────────────────────────────────────────────────
export function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
export function randomFloat(min, max) {
  return Math.random() * (max - min) + min;
}

// ─────────────────────────────────────────────────────────────
//  缓动函数
// ─────────────────────────────────────────────────────────────
export function easeOutBack(t) {
  const c1 = 1.70158, c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

export function easeOutElastic(t) {
  if (t === 0 || t === 1) return t;
  return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * (2 * Math.PI) / 3) + 1;
}

export function easeOutQuart(t) {
  return 1 - Math.pow(1 - t, 4);
}