
import data from './data';
import {
  THEME,
  drawButton,
  drawPiece,
  drawPieceBorder,
  drawProgressBar,
  drawStar,
  fillRoundRect,
  strokeRoundRect,
  randomInt,
  easeOutElastic,
} from './utils';

// ─────────────────────────────────────────────────────────────
//  关卡初始化
// ─────────────────────────────────────────────────────────────
export function initLevel(images) {
  const cfg = data.getLevelConfig(data.level);
  data.pieceCols      = cfg.cols;
  data.pieceRows      = cfg.rows;
  data.candidateCount = cfg.candidates;
  data.totalQuestions = cfg.cols * cfg.rows;
  data.answeredCount  = 0;
  data.correctCount   = 0;
  data.wrongCount     = 0;
  data.combo          = 0;
  data.maxCombo       = 0;
  data.comboPopups    = [];
  data.stars          = 0;
  data.currentQuestion = null;

  data.placedPieces = [];
  data.wrongPieces  = [];
  for (let r = 0; r < cfg.rows; r++) {
    data.placedPieces.push(new Array(cfg.cols).fill(false));
    data.wrongPieces.push(new Array(cfg.cols).fill(null));
  }

  // 题目顺序：cfg.rotate=false 时按顺序（热身关），否则随机打乱
  const _allIdx = [];
  for (let i = 0; i < cfg.rows * cfg.cols; i++) _allIdx.push(i);
  if (cfg.rotate) {
    for (let i = _allIdx.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = _allIdx[i]; _allIdx[i] = _allIdx[j]; _allIdx[j] = tmp;
    }
  }
  data.questionOrder = _allIdx;

  // 打码格子：进关时固定，maskRatio=0 则不打码
  if (!cfg.maskRatio) {
    data.maskedCells = [];
  } else {
    // 有打码比例：先放2×2区块（格子够大时），再补随机单格到目标比例
    const maskedSet = new Set();
    const addCell = (r, c) => {
      if (r >= 0 && r < cfg.rows && c >= 0 && c < cfg.cols)
        maskedSet.add(`${r},${c}`);
    };

    // 格子至少4×4才放2×2区块
    if (cfg.rows >= 4 && cfg.cols >= 4) {
      const blockCount = 2;
      const blockAttempts = 20;
      let placed = 0;
      for (let attempt = 0; attempt < blockAttempts && placed < blockCount; attempt++) {
        const br = Math.floor(Math.random() * (cfg.rows - 1));
        const bc = Math.floor(Math.random() * (cfg.cols - 1));
        let tooClose = false;
        maskedSet.forEach(k => {
          const [er, ec] = k.split(',').map(Number);
          if (Math.abs(er - br) < 3 && Math.abs(ec - bc) < 3) tooClose = true;
        });
        if (!tooClose) {
          addCell(br,   bc);   addCell(br,   bc+1);
          addCell(br+1, bc);   addCell(br+1, bc+1);
          placed++;
        }
      }
    }

    // 补随机单格，达到 maskRatio 指定的比例
    const target = Math.floor(cfg.rows * cfg.cols * cfg.maskRatio);
    const allCells = [];
    for (let r = 0; r < cfg.rows; r++)
      for (let c = 0; c < cfg.cols; c++)
        if (!maskedSet.has(`${r},${c}`))
          allCells.push({ row: r, col: c });
    for (let i = allCells.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = allCells[i]; allCells[i] = allCells[j]; allCells[j] = tmp;
    }
    const extra = Math.max(0, target - maskedSet.size);
    allCells.slice(0, extra).forEach(({ row: r, col: c }) => maskedSet.add(`${r},${c}`));

    data.maskedCells = Array.from(maskedSet).map(k => {
      const [r, c] = k.split(',').map(Number);
      return { row: r, col: c };
    });
  }

  // 传入当前关卡图片，让布局保持正确宽高比
  // 通过 levelOrder 映射取得当前关卡对应的图片 index
  const _imgIdx = (data.levelOrder && data.levelOrder.length > data.level)
    ? data.levelOrder[data.level]
    : data.level + 1;
  const img = images ? images[_imgIdx] : null;
  _calcLayout(img);
}

// ─────────────────────────────────────────────────────────────
//  布局计算
// ─────────────────────────────────────────────────────────────
function _calcLayout(img) {
  const w   = data.screenW;
  const h   = data.screenH;
  const sT  = data.safeTop;    // 顶部安全区（刘海）
  const sB  = data.safeBottom; // 底部安全区（Home 条）

  // 顶栏高度 = 安全区 + 固定内容高度
  const topBarH = Math.max(56, sT + 44);
  const padding = 14;

  // 候选区高度（底部安全区内留白）
  const twoRow = data.candidateCount > 4;
  const candidateContentH = twoRow ? h * 0.38 : h * 0.28;
  const candidateH = candidateContentH + sB; // 底部多留安全区

  data.candidateAreaY    = h - candidateH;
  data.candidateAreaH    = candidateH;
  data.candidateTwoRow   = twoRow;
  data.candidateSafeB    = sB;   // 候选区内底部留白，供坐标计算用

  // 目标图可用区域
  const targetMaxW = w - padding * 2;
  const targetMaxH = h - topBarH - candidateH - padding;

  // 保持图片宽高比（若图片已加载）
  let targetW, targetH;
  if (img && img.width && img.height) {
    const imgRatio = img.width / img.height;
    // 先按宽撑满，再检查高度是否超出
    targetW = targetMaxW;
    targetH = targetW / imgRatio;
    if (targetH > targetMaxH) {
      targetH = targetMaxH;
      targetW = targetH * imgRatio;
    }
  } else {
    // 图片未加载时先用正方形占位
    const s = Math.min(targetMaxW, targetMaxH);
    targetW = s;
    targetH = s;
  }

  data.targetW = targetW;
  data.targetH = targetH;
  data.targetX = (w - targetW) / 2;
  data.targetY = topBarH + padding + (targetMaxH - targetH) / 2;

  // 每格碎片的真实宽高（保持图片宽高比）
  data.pieceW = targetW / data.pieceCols;
  data.pieceH = targetH / data.pieceRows;
}

// ─────────────────────────────────────────────────────────────
//  生成一道新题目
// ─────────────────────────────────────────────────────────────
export function generateQuestion(questionIndex) {
  const cfg  = data.getLevelConfig(data.level);
  const cols = data.pieceCols;
  const rows = data.pieceRows;

  // 按随机顺序取格子，避免玩家记住出题规律
  const order = data.questionOrder;
  const flatIdx = (order && order.length > questionIndex) ? order[questionIndex] : questionIndex;
  const targetRow = Math.floor(flatIdx / cols);
  const targetCol = flatIdx % cols;

  const allPieces = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (r === targetRow && c === targetCol) continue;
      allPieces.push({ row: r, col: c });
    }
  }

  // 判断正确答案是否是 masked 格
  const masked = data.maskedCells || [];
  const isMaskedSet = new Set(masked.map(m => `${m.row},${m.col}`));
  const targetIsMasked = isMaskedSet.has(`${targetRow},${targetCol}`);

  let distractors;
  if (targetIsMasked) {
    // 正确答案是锁格：干扰项也从其他锁格里选，凑不够再从非锁格补
    // 这样候选区全是"锁住的格子"，玩家无法通过目标图对比作弊
    const maskedOthers  = allPieces.filter(p => isMaskedSet.has(`${p.row},${p.col}`));
    const normalOthers  = allPieces.filter(p => !isMaskedSet.has(`${p.row},${p.col}`));
    // 相邻优先（在各自池子里）
    const maskedAdj  = maskedOthers.filter(p => Math.abs(p.row - targetRow) <= 1 && Math.abs(p.col - targetCol) <= 1);
    const maskedFar  = maskedOthers.filter(p => !(Math.abs(p.row - targetRow) <= 1 && Math.abs(p.col - targetCol) <= 1));
    const normalAdj  = normalOthers.filter(p => Math.abs(p.row - targetRow) <= 1 && Math.abs(p.col - targetCol) <= 1);
    const normalFar  = normalOthers.filter(p => !(Math.abs(p.row - targetRow) <= 1 && Math.abs(p.col - targetCol) <= 1));
    [maskedAdj, maskedFar, normalAdj, normalFar].forEach(_shuffle);
    distractors = [...maskedAdj, ...maskedFar, ...normalAdj, ...normalFar].slice(0, data.candidateCount - 1);
  } else {
    // 正确答案是普通格：干扰项排除所有锁格
    // 避免候选区出现锁格，让玩家通过"目标图上有锁"反推出正确答案
    const pool = allPieces.filter(p => !isMaskedSet.has(`${p.row},${p.col}`));
    const adjacent = pool.filter(p => Math.abs(p.row - targetRow) <= 1 && Math.abs(p.col - targetCol) <= 1);
    const others   = pool.filter(p => !(Math.abs(p.row - targetRow) <= 1 && Math.abs(p.col - targetCol) <= 1));
    _shuffle(adjacent);
    _shuffle(others);
    distractors = [...adjacent, ...others].slice(0, data.candidateCount - 1);
  }
  const candidateList = [
    { row: targetRow, col: targetCol, isCorrect: true },
    ...distractors.map(p => ({ row: p.row, col: p.col, isCorrect: false })),
  ];
  _shuffle(candidateList);

  // 计算候选碎片屏幕坐标（保持与目标图相同的宽高比）
  const w      = data.screenW;
  const count  = candidateList.length;
  const gapX   = 12;
  const gapY   = 10;
  const twoRow = data.candidateTwoRow;
  const sB     = data.candidateSafeB || 0; // 底部安全区留白

  // 候选区可用内容高度（去掉底部安全区）
  const contentH = data.candidateAreaH - sB;

  // 目标图的宽高比
  const pieceRatio = (data.pieceW && data.pieceH) ? (data.pieceW / data.pieceH) : 1;

  // 根据可用空间和宽高比，计算每个碎片的显示尺寸
  let perRow, cW, cH;
  if (twoRow) {
    perRow = Math.ceil(count / 2);
    // 先按宽度算
    const maxCW = (w - gapX * 2 - (perRow - 1) * gapX) / perRow;
    const maxCH = (contentH - gapY * 3) / 2;
    // 在 maxCW × maxCH 的格子里，保持 pieceRatio 的最大矩形
    if (maxCW / maxCH > pieceRatio) {
      cH = maxCH;
      cW = cH * pieceRatio;
    } else {
      cW = maxCW;
      cH = cW / pieceRatio;
    }
    // 上限：不超过屏幕宽的 22%
    if (cW > w * 0.22) { cW = w * 0.22; cH = cW / pieceRatio; }
  } else {
    perRow = count;
    const maxCW = (w - gapX * 2 - (count - 1) * gapX) / count;
    const maxCH = contentH * 0.72;
    if (maxCW / maxCH > pieceRatio) {
      cH = maxCH;
      cW = cH * pieceRatio;
    } else {
      cW = maxCW;
      cH = cW / pieceRatio;
    }
    if (cW > w * 0.28) { cW = w * 0.28; cH = cW / pieceRatio; }
  }

  candidateList.forEach((c, i) => {
    if (twoRow) {
      const rowIdx = Math.floor(i / perRow);
      const colIdx = i % perRow;
      const rowCount = rowIdx === 0 ? perRow : count - perRow;
      const rowTotalW = rowCount * cW + (rowCount - 1) * gapX;
      const rowStartX = (w - rowTotalW) / 2 + cW / 2;
      const totalRowsH = 2 * cH + gapY;
      const firstRowY  = data.candidateAreaY + (contentH - totalRowsH) / 2 + cH / 2;
      c.x = rowStartX + colIdx * (cW + gapX);
      c.y = firstRowY + rowIdx * (cH + gapY);
    } else {
      const totalW = count * cW + (count - 1) * gapX;
      const startX = (w - totalW) / 2 + cW / 2;
      c.x = startX + i * (cW + gapX);
      c.y = data.candidateAreaY + contentH / 2;
    }
    c.size  = Math.max(cW, cH); // 向后兼容（hitTest 用）
    c.pieceW = cW;
    c.pieceH = cH;
    c.state = 'idle';
    c.shakeTimer = 0;
    c.flyProgress = 0;
    c.flyStartX = c.x;
    c.flyStartY = c.y;
    // 旋转字段先全部初始化为静止，后面统一决定哪些旋转
    c.rotation = 0;
    c.rotSpeed = 0;
  });

  // 旋转：cfg.rotate=true 时，从可旋转干扰项（非正确、非 masked）里
  // 随机打乱后取恰好一半旋转，保证每次数量固定、位置随机
  if (cfg.rotate) {
    const rotatableIdx = candidateList
      .map((c, i) => ({ c, i }))
      .filter(({ c }) => !c.isCorrect && !isMaskedSet.has(`${c.row},${c.col}`))
      .map(({ i }) => i);

    // Fisher-Yates 打乱可旋转项的索引
    for (let i = rotatableIdx.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = rotatableIdx[i]; rotatableIdx[i] = rotatableIdx[j]; rotatableIdx[j] = tmp;
    }

    // 取前一半（向上取整）赋予旋转
    const half = Math.ceil(rotatableIdx.length / 2);
    rotatableIdx.slice(0, half).forEach(idx => {
      const c = candidateList[idx];
      c.rotation = Math.random() * Math.PI * 2;
      const speed = (0.4 + Math.random() * 0.4) * (Math.PI / 180);
      c.rotSpeed = Math.random() < 0.5 ? speed : -speed;
    });
  }

  data.currentQuestion = {
    targetRow,
    targetCol,
    candidates: candidateList,
    answered: false,
  };
}

// ─────────────────────────────────────────────────────────────
//  绘制整个游戏画面
// ─────────────────────────────────────────────────────────────
export function drawGame(ctx, images) {
  const w = data.screenW;
  const h = data.screenH;
  // 通过 levelOrder 映射取得当前关卡对应的图片
  const _imgIdx = (data.levelOrder && data.levelOrder.length > data.level)
    ? data.levelOrder[data.level]
    : data.level + 1;
  const img = images[_imgIdx];

  // ── 背景：奶油白渐变 ──────────────────────────────────
  const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
  bgGrad.addColorStop(0, '#FFF9F0');
  bgGrad.addColorStop(1, '#FFF0E0');
  ctx.save();
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();

  // 背景装饰光斑
  _drawBgGlow(ctx, w, h);

  // ── 目标图 ────────────────────────────────────────────
  _drawTargetImage(ctx, img);

  // ── 候选区 ────────────────────────────────────────────
  _drawCandidateArea(ctx, img);

  // ── 顶部信息栏 ────────────────────────────────────────
  _drawTopBar(ctx, w);
}

// ─────────────────────────────────────────────────────────────
//  背景装饰光斑（静态，每帧重绘但位置固定）
// ─────────────────────────────────────────────────────────────
function _drawBgGlow(ctx, w, h) {
  const glows = [
    { x: w * 0.15, y: h * 0.2,  r: w * 0.45, color: 'rgba(255,107,107,0.08)' },
    { x: w * 0.85, y: h * 0.55, r: w * 0.4,  color: 'rgba(78,205,196,0.07)'  },
    { x: w * 0.5,  y: h * 0.85, r: w * 0.35, color: 'rgba(255,179,0,0.07)'   },
  ];
  glows.forEach(g => {
    const grad = ctx.createRadialGradient(g.x, g.y, 0, g.x, g.y, g.r);
    grad.addColorStop(0, g.color);
    grad.addColorStop(1, 'transparent');
    ctx.save();
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  });
}

// ─────────────────────────────────────────────────────────────
//  目标图：完整图 + 已归位碎片 + 当前挖空呼吸光晕
// ─────────────────────────────────────────────────────────────
function _drawTargetImage(ctx, img) {
  if (!img || !img.width) return;
  const { targetX, targetY, targetW, targetH, pieceCols, pieceRows } = data;
  const cellW = targetW / pieceCols;
  const cellH = targetH / pieceRows;

  // 图片容器阴影
  ctx.save();
  ctx.shadowColor = 'rgba(255,107,107,0.35)';
  ctx.shadowBlur = 20;
  ctx.fillStyle = 'transparent';
  ctx.fillRect(targetX, targetY, targetW, targetH);
  ctx.restore();

  // 整张图半透明底（参考）
  ctx.save();
  ctx.globalAlpha = 0.22;
  ctx.drawImage(img, targetX, targetY, targetW, targetH);
  ctx.restore();

  // 已归位的碎片（实色）
  for (let r = 0; r < pieceRows; r++) {
    for (let c = 0; c < pieceCols; c++) {
      if (!data.placedPieces[r] || !data.placedPieces[r][c]) continue;
      const dx = targetX + c * cellW;
      const dy = targetY + r * cellH;
      const srcW = img.width / pieceCols;
      const srcH = img.height / pieceRows;
      ctx.drawImage(img, c * srcW, r * srcH, srcW, srcH, dx, dy, cellW, cellH);
    }
  }

  // 答错痕迹：把错选的碎片半透明渲染到目标格子，留下视觉记忆
  if (data.wrongPieces) {
    for (let r = 0; r < pieceRows; r++) {
      for (let c = 0; c < pieceCols; c++) {
        const wp = data.wrongPieces[r] && data.wrongPieces[r][c];
        if (!wp) continue;
        // 该格已被正确放置则不再显示错误痕迹
        if (data.placedPieces[r] && data.placedPieces[r][c]) continue;

        const dx = targetX + c * cellW;
        const dy = targetY + r * cellH;
        const srcW = img.width / pieceCols;
        const srcH = img.height / pieceRows;

        ctx.drawImage(img, wp.col * srcW, wp.row * srcH, srcW, srcH, dx, dy, cellW, cellH);
      }
    }
  }

  // 格子线（细腻）
  ctx.save();
  ctx.strokeStyle = 'rgba(255,107,107,0.18)';
  ctx.lineWidth = 0.8;
  for (let c = 0; c <= pieceCols; c++) {
    ctx.beginPath();
    ctx.moveTo(targetX + c * cellW, targetY);
    ctx.lineTo(targetX + c * cellW, targetY + targetH);
    ctx.stroke();
  }
  for (let r = 0; r <= pieceRows; r++) {
    ctx.beginPath();
    ctx.moveTo(targetX, targetY + r * cellH);
    ctx.lineTo(targetX + targetW, targetY + r * cellH);
    ctx.stroke();
  }
  ctx.restore();

  // 外边框（珊瑚橙发光）
  ctx.save();
  ctx.strokeStyle = 'rgba(255,107,107,0.55)';
  ctx.lineWidth = 2;
  ctx.shadowColor = 'rgba(255,107,107,0.35)';
  ctx.shadowBlur = 8;
  ctx.strokeRect(targetX, targetY, targetW, targetH);
  ctx.restore();

  // ── 打码蒙层（纯色遮挡，完全看不出底图）────────────────
  if (data.maskedCells && data.maskedCells.length > 0) {
    data.maskedCells.forEach(({ row: mr, col: mc }) => {
      // 该格已被玩家正确放置，解锁——不再绘制蒙层
      if (data.placedPieces[mr] && data.placedPieces[mr][mc]) return;

      const mx = targetX + mc * cellW;
      const my = targetY + mr * cellH;

      // 纯色实心填充，完全遮住底图
      ctx.save();
      ctx.fillStyle = '#C8B8A2';   // 与游戏背景色系一致的暖灰色
      ctx.fillRect(mx, my, cellW, cellH);
      ctx.restore();

      // 问号提示（告知玩家此格内容未知）
      const fontSize = Math.min(cellW, cellH) * 0.38;
      ctx.save();
      ctx.font = `bold ${fontSize}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.fillText('?', mx + cellW / 2, my + cellH / 2);
      ctx.restore();
    });
  }

  // 当前挖空格子：呼吸光晕 + 问号
  if (data.currentQuestion && !data.currentQuestion.answered) {
    const { targetRow, targetCol } = data.currentQuestion;
    const hx = targetX + targetCol * cellW;
    const hy = targetY + targetRow * cellH;
    const t = Date.now() / 600;
    const pulse = 0.5 + 0.5 * Math.sin(t);

    // 挖空遮罩（奶油白，与背景融合）
    ctx.save();
    ctx.fillStyle = '#FFF9F0';
    ctx.fillRect(hx + 1, hy + 1, cellW - 2, cellH - 2);
    ctx.restore();

    // 呼吸光晕（径向渐变，珊瑚橙）
    const glowR = Math.min(cellW, cellH) * 0.7;
    const glowX = hx + cellW / 2;
    const glowY = hy + cellH / 2;
    const glowGrad = ctx.createRadialGradient(glowX, glowY, 0, glowX, glowY, glowR);
    glowGrad.addColorStop(0, `rgba(255,107,107,${0.22 * pulse})`);
    glowGrad.addColorStop(1, 'transparent');
    ctx.save();
    ctx.fillStyle = glowGrad;
    ctx.fillRect(hx, hy, cellW, cellH);
    ctx.restore();

    // 虚线边框（珊瑚橙）
    ctx.save();
    ctx.strokeStyle = `rgba(255,107,107,${0.5 + 0.5 * pulse})`;
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 4]);
    ctx.strokeRect(hx + 2, hy + 2, cellW - 4, cellH - 4);
    ctx.setLineDash([]);
    ctx.restore();

    // 问号（深棕色，清晰可读）
    const fontSize = Math.min(cellW, cellH) * 0.42;
    ctx.save();
    ctx.font = `bold ${fontSize}px sans-serif`;
    ctx.fillStyle = `rgba(255,107,107,${0.7 + 0.3 * pulse})`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(255,107,107,0.5)';
    ctx.shadowBlur = 10;
    ctx.fillText('?', hx + cellW / 2, hy + cellH / 2);
    ctx.restore();
  }

  // 飞行中的碎片（归位动画）
  if (data.currentQuestion) {
    data.currentQuestion.candidates.forEach(c => {
      if (c.state !== 'flying') return;
      const t = _easeOutBack(c.flyProgress);
      const cx = c.flyStartX + (data.targetX + c.col * cellW + cellW / 2 - c.flyStartX) * t;
      const cy = c.flyStartY + (data.targetY + c.row * cellH + cellH / 2 - c.flyStartY) * t;
      const rot = (1 - t) * 0.25;
      const scale = 0.7 + t * 0.3;
      drawPiece(ctx, img, c.row, c.col, pieceCols, pieceRows, cx, cy, c.size * scale, rot, 1,
        (c.pieceW || cellW) * scale, (c.pieceH || cellH) * scale);
    });
  }
}

// ─────────────────────────────────────────────────────────────
//  候选区：磨砂玻璃背景 + 候选碎片
// ─────────────────────────────────────────────────────────────
function _drawCandidateArea(ctx, img) {
  if (!img || !img.width) return;
  const q = data.currentQuestion;
  if (!q) return;

  const w = data.screenW;
  const areaY = data.candidateAreaY;
  const areaH = data.candidateAreaH;

  // 候选区背景（白色卡片感）
  ctx.save();
  const areaGrad = ctx.createLinearGradient(0, areaY, 0, areaY + areaH);
  areaGrad.addColorStop(0, 'rgba(255,255,255,0.97)');
  areaGrad.addColorStop(1, 'rgba(255,245,235,0.99)');
  ctx.fillStyle = areaGrad;
  ctx.fillRect(0, areaY, w, areaH);
  ctx.restore();

  // 顶部分隔线（渐变，珊瑚橙→薄荷青）
  ctx.save();
  const sepGrad = ctx.createLinearGradient(0, 0, w, 0);
  sepGrad.addColorStop(0, 'transparent');
  sepGrad.addColorStop(0.3, 'rgba(255,107,107,0.45)');
  sepGrad.addColorStop(0.7, 'rgba(78,205,196,0.45)');
  sepGrad.addColorStop(1, 'transparent');
  ctx.strokeStyle = sepGrad;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, areaY);
  ctx.lineTo(w, areaY);
  ctx.stroke();
  ctx.restore();

  // 候选碎片
  q.candidates.forEach((c) => {
    if (c.state === 'flying' || c.state === 'placed') return;

    const isWrong  = c.state === 'wrong';
    const isReveal = c.state === 'reveal';

    // 抖动偏移
    let shakeX = 0;
    if (isWrong && c.shakeTimer > 0) {
      shakeX = Math.sin(c.shakeTimer * 0.6) * 6 * (c.shakeTimer / 400);
    }

    const drawX = c.x + shakeX;
    const drawY = c.y;

    // 碎片底座光晕
    if (isReveal) {
      ctx.save();
      const grad = ctx.createRadialGradient(drawX, drawY, 0, drawX, drawY, c.size * 0.75);
      grad.addColorStop(0, 'rgba(102,187,106,0.38)');
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(drawX, drawY, c.size * 0.75, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else if (isWrong) {
      ctx.save();
      const grad = ctx.createRadialGradient(drawX, drawY, 0, drawX, drawY, c.size * 0.7);
      grad.addColorStop(0, 'rgba(239,83,80,0.35)');
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(drawX, drawY, c.size * 0.7, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else {
      // idle 状态：淡橙底座
      ctx.save();
      const grad = ctx.createRadialGradient(drawX, drawY, 0, drawX, drawY, c.size * 0.6);
      grad.addColorStop(0, 'rgba(255,107,107,0.12)');
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(drawX, drawY, c.size * 0.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 碎片图像（旋转的干扰项传入当前角度）
    const rot = c.rotation || 0;
    drawPiece(ctx, img, c.row, c.col, data.pieceCols, data.pieceRows, drawX, drawY, c.size, rot, 1, c.pieceW, c.pieceH);

    // 边框
    let borderColor, borderW, glowColor;
    if (isReveal) {
      borderColor = THEME.correct;
      borderW = 2.5;
      glowColor = 'rgba(102,187,106,0.65)';
    } else if (isWrong) {
      borderColor = THEME.wrong;
      borderW = 2.5;
      glowColor = 'rgba(239,83,80,0.65)';
    } else {
      borderColor = 'rgba(255,107,107,0.35)';
      borderW = 1.5;
      glowColor = null;
    }

    ctx.save();
    if (glowColor) {
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = 10;
    }
    drawPieceBorder(ctx, drawX, drawY, c.size, rot, borderColor, borderW, c.pieceW, c.pieceH);
    ctx.restore();
  });
}

// ─────────────────────────────────────────────────────────────
//  顶部信息栏：进度 + 连击 + 关卡
// ─────────────────────────────────────────────────────────────
function _drawTopBar(ctx, w) {
  const barH = Math.max(56, data.safeTop + 44);

  // 背景（白色半透明）
  ctx.save();
  const barGrad = ctx.createLinearGradient(0, 0, 0, barH);
  barGrad.addColorStop(0, 'rgba(255,255,255,0.97)');
  barGrad.addColorStop(1, 'rgba(255,249,240,0.92)');
  ctx.fillStyle = barGrad;
  ctx.fillRect(0, 0, w, barH);
  ctx.restore();

  // 底部分隔线（珊瑚橙→薄荷青）
  ctx.save();
  const sepGrad = ctx.createLinearGradient(0, 0, w, 0);
  sepGrad.addColorStop(0, 'transparent');
  sepGrad.addColorStop(0.3, 'rgba(255,107,107,0.35)');
  sepGrad.addColorStop(0.7, 'rgba(78,205,196,0.35)');
  sepGrad.addColorStop(1, 'transparent');
  ctx.strokeStyle = sepGrad;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, barH);
  ctx.lineTo(w, barH);
  ctx.stroke();
  ctx.restore();

  // 左：三条杠菜单按钮（紧贴左边，远离右上角微信胶囊）
  const menuBtnX = 26;
  const menuBtnY = barH / 2;
  const lineW = 18, lineH = 2, lineGap = 5;
  ctx.save();
  ctx.fillStyle = THEME.textSub;
  ctx.globalAlpha = 0.7;
  for (let i = -1; i <= 1; i++) {
    ctx.fillRect(menuBtnX - lineW / 2, menuBtnY + i * lineGap - lineH / 2, lineW, lineH);
  }
  ctx.restore();

  // 左：关卡（三条杠右边）
  ctx.save();
  ctx.font = 'bold 15px sans-serif';
  ctx.fillStyle = THEME.accent;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = THEME.accent;
  ctx.shadowBlur = 8;
  ctx.fillText(`Lv.${data.level + 1}`, menuBtnX + lineW / 2 + 10, barH / 2);
  ctx.restore();

  // 中：进度条 + 数字
  const barX = w * 0.28;
  const barW = w * 0.44;
  const barPH = 7;
  const barPY = barH / 2 - barPH / 2 - 5;
  drawProgressBar(ctx, barX, barPY, barW, barPH,
    data.answeredCount / Math.max(data.totalQuestions, 1), THEME.accent);

  ctx.save();
  ctx.font = '11px sans-serif';
  ctx.fillStyle = THEME.textSub;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(`${data.answeredCount} / ${data.totalQuestions}`, barX + barW / 2, barPY + barPH + 4);
  ctx.restore();

  // 右：连击数（右侧留出胶囊宽度，约 100px）
  if (data.combo >= 2) {
    ctx.save();
    ctx.font = 'bold 14px sans-serif';
    ctx.fillStyle = THEME.gold;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = THEME.gold;
    ctx.shadowBlur = 10;
    ctx.fillText(`? ×${data.combo}`, w - 104, barH / 2);
    ctx.restore();
  }
}

// ─────────────────────────────────────────────────────────────
//  首页
// ─────────────────────────────────────────────────────────────
export function drawHomeScreen(ctx, images, w, h, btnPressAnim = 0) {
  // 背景渐变（奶油白→浅橙）
  const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
  bgGrad.addColorStop(0, '#FFF9F0');
  bgGrad.addColorStop(1, '#FFE8D0');
  ctx.save();
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();

  // 背景光斑（糖果色）
  const glows = [
    { x: w * 0.2,  y: h * 0.25, r: w * 0.5, color: 'rgba(255,107,107,0.10)' },
    { x: w * 0.8,  y: h * 0.6,  r: w * 0.4, color: 'rgba(78,205,196,0.09)'  },
  ];
  glows.forEach(g => {
    const grad = ctx.createRadialGradient(g.x, g.y, 0, g.x, g.y, g.r);
    grad.addColorStop(0, g.color);
    grad.addColorStop(1, 'transparent');
    ctx.save();
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  });

  // 背景图（极淡）
  if (images[0] && images[0].width) {
    ctx.save();
    ctx.globalAlpha = 0.06;
    ctx.drawImage(images[0], 0, 0, w, h);
    ctx.restore();
  }

  // 标题
  ctx.save();
  ctx.font = 'bold 52px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const titleGrad = ctx.createLinearGradient(w / 2 - 110, 0, w / 2 + 110, 0);
  titleGrad.addColorStop(0, '#FF6B6B');
  titleGrad.addColorStop(1, '#4ECDC4');
  ctx.fillStyle = titleGrad;
  ctx.shadowColor = 'rgba(255,107,107,0.45)';
  ctx.shadowBlur = 22;
  ctx.fillText('不一样的拼图', w / 2, h * 0.22);
  ctx.restore();

  // 副标题
  ctx.save();
  ctx.font = '16px sans-serif';
  ctx.fillStyle = THEME.textSub;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('找出图中缺失的那一块', w / 2, h * 0.32);
  ctx.restore();

  // 预览图（带圆角 + 发光边框）——用当前关卡对应的图片
  const _previewIdx = (data.levelOrder && data.levelOrder.length > data.level)
    ? data.levelOrder[data.level]
    : data.level + 1;
  const previewImg = images[_previewIdx];
  if (previewImg && previewImg.width) {
    const previewSize = w * 0.52;
    const px = (w - previewSize) / 2;
    const py = h * 0.38;
    const r = 16;

    // 发光阴影
    ctx.save();
    ctx.shadowColor = 'rgba(255,107,107,0.4)';
    ctx.shadowBlur = 24;
    ctx.fillStyle = 'transparent';
    ctx.fillRect(px, py, previewSize, previewSize);
    ctx.restore();

    // 圆角裁剪图片
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(px + r, py);
    ctx.lineTo(px + previewSize - r, py);
    ctx.arc(px + previewSize - r, py + r, r, -Math.PI / 2, 0);
    ctx.lineTo(px + previewSize, py + previewSize - r);
    ctx.arc(px + previewSize - r, py + previewSize - r, r, 0, Math.PI / 2);
    ctx.lineTo(px + r, py + previewSize);
    ctx.arc(px + r, py + previewSize - r, r, Math.PI / 2, Math.PI);
    ctx.lineTo(px, py + r);
    ctx.arc(px + r, py + r, r, Math.PI, Math.PI * 1.5);
    ctx.closePath();
    ctx.clip();
    ctx.globalAlpha = 0.88;
    ctx.drawImage(previewImg, px, py, previewSize, previewSize);
    ctx.restore();

    // 挖空示意（中间块）
    const blockSize = previewSize / 3;
    const bx = px + blockSize;
    const by = py + blockSize;
    ctx.save();
    ctx.fillStyle = '#FFF9F0';
    ctx.fillRect(bx, by, blockSize, blockSize);
    const t = Date.now() / 600;
    const pulse = 0.5 + 0.5 * Math.sin(t);
    ctx.strokeStyle = `rgba(255,107,107,${0.5 + 0.5 * pulse})`;
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 4]);
    ctx.strokeRect(bx + 2, by + 2, blockSize - 4, blockSize - 4);
    ctx.setLineDash([]);
    ctx.font = `bold ${blockSize * 0.38}px sans-serif`;
    ctx.fillStyle = `rgba(255,107,107,${0.7 + 0.3 * pulse})`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(255,107,107,0.6)';
    ctx.shadowBlur = 10;
    ctx.fillText('?', bx + blockSize / 2, by + blockSize / 2);
    ctx.restore();

    // 圆角边框
    ctx.save();
    ctx.strokeStyle = 'rgba(255,107,107,0.5)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(px + r, py);
    ctx.lineTo(px + previewSize - r, py);
    ctx.arc(px + previewSize - r, py + r, r, -Math.PI / 2, 0);
    ctx.lineTo(px + previewSize, py + previewSize - r);
    ctx.arc(px + previewSize - r, py + previewSize - r, r, 0, Math.PI / 2);
    ctx.lineTo(px + r, py + previewSize);
    ctx.arc(px + r, py + previewSize - r, r, Math.PI / 2, Math.PI);
    ctx.lineTo(px, py + r);
    ctx.arc(px + r, py + r, r, Math.PI, Math.PI * 1.5);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }

  // 开始按钮：固定在屏幕 78% 处，各尺寸手机视觉稳定
  const btnW = 180, btnH = 54;
  const btnBY = h * 0.78;
  const btnCX = w / 2;
  const btnCY = btnBY + btnH / 2;

  if (btnPressAnim > 0) {
    // ── 动画阶段 ──────────────────────────────────────────
    // 分三段：0~0.25 按下缩小，0.25~0.55 弹回放大，0.55~1.0 光晕扩散淡出
    const p = btnPressAnim;

    // 1. 涟漪扩散（从 0.2 开始，持续到 1.0）
    if (p > 0.2) {
      const rp = (p - 0.2) / 0.8;  // 0→1
      const maxR = w * 0.75;
      const rippleR = rp * maxR;
      const rippleAlpha = (1 - rp) * 0.45;
      ctx.save();
      ctx.beginPath();
      ctx.arc(btnCX, btnCY, rippleR, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255,107,107,${rippleAlpha})`;
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.restore();

      // 第二圈涟漪（稍慢）
      if (p > 0.35) {
        const rp2 = (p - 0.35) / 0.65;
        const rippleR2 = rp2 * maxR * 0.7;
        const rippleAlpha2 = (1 - rp2) * 0.3;
        ctx.save();
        ctx.beginPath();
        ctx.arc(btnCX, btnCY, rippleR2, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(78,205,196,${rippleAlpha2})`;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
      }
    }

    // 2. 光晕爆发（0.15~0.6）
    if (p > 0.15 && p < 0.6) {
      const gp = (p - 0.15) / 0.45;  // 0→1
      const glowR = (btnW * 0.6) + gp * btnW * 1.2;
      const glowAlpha = (1 - gp) * 0.6;
      const glowGrad = ctx.createRadialGradient(btnCX, btnCY, 0, btnCX, btnCY, glowR);
      glowGrad.addColorStop(0, `rgba(255,107,107,${glowAlpha})`);
      glowGrad.addColorStop(0.5, `rgba(255,107,107,${glowAlpha * 0.4})`);
      glowGrad.addColorStop(1, 'rgba(255,107,107,0)');
      ctx.save();
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(btnCX, btnCY, glowR, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 3. 按钮本体缩放（easeOutElastic 弹性）
    let scale;
    if (p < 0.25) {
      // 按下缩小
      scale = 1 - (p / 0.25) * 0.12;
    } else {
      // 弹回放大（easeOutElastic）
      const ep = (p - 0.25) / 0.75;
      scale = 0.88 + easeOutElastic(ep) * 0.12;
    }
    // 按钮透明度（后半段淡出）
    const btnAlpha = p < 0.6 ? 1 : 1 - (p - 0.6) / 0.4;

    ctx.save();
    ctx.globalAlpha = Math.max(0, btnAlpha);
    ctx.translate(btnCX, btnCY);
    ctx.scale(scale, scale);
    ctx.translate(-btnCX, -btnCY);
    drawButton(ctx, { x: w / 2 - btnW / 2, y: btnBY }, btnW, btnH, 28, 'primary', '开始游戏', '#fff', 22);
    ctx.restore();

    // 4. 粒子星光（0.1~0.5 阶段，8颗向外飞散）
    if (p > 0.1 && p < 0.55) {
      const sp = (p - 0.1) / 0.45;
      const starCount = 8;
      for (let i = 0; i < starCount; i++) {
        const angle = (i / starCount) * Math.PI * 2 + Math.PI / 8;
        const dist = sp * btnW * 0.9;
        const sx = btnCX + Math.cos(angle) * dist;
        const sy = btnCY + Math.sin(angle) * dist;
        const starAlpha = (1 - sp) * 0.9;
        const starR = (1 - sp) * 5 + 2;
        ctx.save();
        ctx.globalAlpha = starAlpha;
        ctx.fillStyle = i % 2 === 0 ? '#FF6B6B' : '#4ECDC4';
        ctx.shadowColor = i % 2 === 0 ? '#FF6B6B' : '#4ECDC4';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(sx, sy, starR, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

  } else {
    // ── 静止状态：正常绘制按钮（带呼吸光晕）──────────────
    const t = Date.now() / 1000;
    const breathe = 0.5 + 0.5 * Math.sin(t * 1.8);
    const glowR = btnW * 0.55 + breathe * 12;
    const glowGrad = ctx.createRadialGradient(btnCX, btnCY, 0, btnCX, btnCY, glowR);
    glowGrad.addColorStop(0, `rgba(255,107,107,${0.20 + breathe * 0.12})`);
    glowGrad.addColorStop(1, 'rgba(255,107,107,0)');
    ctx.save();
    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.arc(btnCX, btnCY, glowR, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    drawButton(ctx, { x: w / 2 - btnW / 2, y: btnBY }, btnW, btnH, 28, 'primary', '开始游戏', '#fff', 22);
  }
}

// ─────────────────────────────────────────────────────────────
//  结果页
// ─────────────────────────────────────────────────────────────
// 通用按钮按下动画绘制（涟漪 + 缩放）
// cx/cy: 按钮中心, btnW/btnH: 按钮尺寸, p: 动画进度 0→1
function _drawBtnPressEffect(ctx, cx, cy, btnW, btnH, p) {
  // 涟漪扩散
  if (p > 0.1) {
    const rp = (p - 0.1) / 0.9;
    const maxR = Math.max(btnW, btnH) * 1.4;
    const rippleR = rp * maxR;
    const rippleAlpha = (1 - rp) * 0.5;
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, rippleR, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(255,107,107,${rippleAlpha})`;
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.restore();
  }
  // 光晕爆发（0~0.5）
  if (p < 0.55) {
    const gp = p / 0.55;
    const glowR = btnW * 0.5 + gp * btnW * 0.8;
    const glowAlpha = (1 - gp) * 0.45;
    const glowGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowR);
    glowGrad.addColorStop(0, `rgba(255,107,107,${glowAlpha})`);
    glowGrad.addColorStop(1, 'rgba(255,107,107,0)');
    ctx.save();
    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, glowR, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  // 星光粒子（0.05~0.5，6颗）
  if (p > 0.05 && p < 0.5) {
    const sp = (p - 0.05) / 0.45;
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const dist = sp * btnW * 0.75;
      const sx = cx + Math.cos(angle) * dist;
      const sy = cy + Math.sin(angle) * dist;
      const sa = (1 - sp) * 0.85;
      const sr = (1 - sp) * 4 + 1.5;
      ctx.save();
      ctx.globalAlpha = sa;
      ctx.fillStyle = i % 2 === 0 ? '#FF6B6B' : '#4ECDC4';
      ctx.shadowColor = i % 2 === 0 ? '#FF6B6B' : '#4ECDC4';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(sx, sy, sr, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
}

export function drawResultScreen(ctx, w, h, stars, resultAnim, resultBtnAnim = null) {
  // 半透明遮罩（奶油白，不再是黑色）
  ctx.save();
  ctx.fillStyle = 'rgba(255,240,220,0.82)';
  ctx.fillRect(0, 0, w, h);
  ctx.restore();

  // 卡片背景（在安全区内垂直居中）
  const sB_r  = data.safeBottom || 0;
  const sT_r  = data.safeTop    || 0;
  const cardW = w * 0.82;
  const cardH = h * 0.52;
  const cardX = (w - cardW) / 2;
  // 可用高度内居中，顶部偏上一点留给标题感
  const safeH = h - sT_r - sB_r;
  const cardY = sT_r + (safeH - cardH) * 0.35;
  ctx.save();
  const cardGrad = ctx.createLinearGradient(cardX, cardY, cardX, cardY + cardH);
  cardGrad.addColorStop(0, '#FFFFFF');
  cardGrad.addColorStop(1, '#FFF5EC');
  ctx.fillStyle = cardGrad;
  ctx.shadowColor = 'rgba(255,107,107,0.25)';
  ctx.shadowBlur = 20;
  fillRoundRect(ctx, cardX, cardY, cardW, cardH, 24);
  ctx.shadowBlur = 0;
  ctx.strokeStyle = 'rgba(255,107,107,0.30)';
  ctx.lineWidth = 1.5;
  strokeRoundRect(ctx, cardX, cardY, cardW, cardH, 24);
  ctx.restore();

  // 标题 + 副标题（全对/失败两种状态）
  const titleY    = cardY + cardH * 0.16;
  const subtitleY = cardY + cardH * 0.30;

  // 随机庆祝/鼓励语
  const winTitles = ['太厉害啦！', '全部答对！', '完美通关！', '小天才！'];
  const winSubs   = ['一块都没放错，真棒 ?', '眼力超级好，继续加油！', '拼图小达人就是你！', '零失误，满分通过！'];
  const loseTitles = ['差一点点！', '再试一次吧！', '加油加油！', '别灰心哦！'];
  const loseSubs   = ['找到错误的那块了吗？', '仔细看看，你一定行的！', '再来一次，这次肯定过！', '失误了没关系，重新挑战！'];

  // 用关卡号做随机种子，保证同一关每次看到相同文案
  const seed = data.level % 4;
  const titleText    = stars >= 3 ? winTitles[seed]  : loseTitles[seed];
  const subtitleText = stars >= 3 ? winSubs[seed]    : loseSubs[seed];

  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // 主标题
  ctx.font = 'bold 34px sans-serif';
  if (stars >= 3) {
    ctx.fillStyle = THEME.gold;
    ctx.shadowColor = THEME.gold;
    ctx.shadowBlur = 22;
  } else {
    ctx.fillStyle = '#FF6B6B';
    ctx.shadowColor = 'rgba(255,107,107,0.5)';
    ctx.shadowBlur = 14;
  }
  ctx.fillText(titleText, w / 2, titleY);

  // 副标题
  ctx.font = '15px sans-serif';
  ctx.fillStyle = THEME.textSub;
  ctx.shadowBlur = 0;
  ctx.fillText(subtitleText, w / 2, subtitleY);
  ctx.restore();

  // 星星动画（3颗）
  const starY = cardY + cardH * 0.42;
  const starSpacing = cardW * 0.26;
  const starCX = w / 2;
  const starConfigs = [
    { cx: starCX - starSpacing, delay: 0,   r: 26 },
    { cx: starCX,               delay: 0.15, r: 32 },
    { cx: starCX + starSpacing, delay: 0.3,  r: 26 },
  ];
  starConfigs.forEach((sc, i) => {
    const filled = i < stars;
    const t = Math.max(0, Math.min(1, (resultAnim - sc.delay) / 0.35));
    const scale = filled ? easeOutElastic(t) : 1;
    ctx.save();
    ctx.translate(sc.cx, starY);
    ctx.scale(scale, scale);
    if (filled) {
      drawStar(ctx, 0, 0, sc.r, true, THEME.gold, THEME.gold);
    } else {
      drawStar(ctx, 0, 0, sc.r, false, 'rgba(93,64,55,0.18)');
    }
    ctx.restore();
  });

  // 统计信息（两行）
  const stats1Y = cardY + cardH * 0.66;
  const stats2Y = cardY + cardH * 0.78;
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  if (stars >= 3) {
    // 全对：显示关卡 + 总题数
    ctx.font = 'bold 15px sans-serif';
    ctx.fillStyle = THEME.gold;
    ctx.fillText(`第 ${data.level + 1} 关  ·  共 ${data.totalQuestions} 块全部归位 ?`, w / 2, stats1Y);
    ctx.font = '13px sans-serif';
    ctx.fillStyle = THEME.textSub;
    ctx.fillText('零失误完美通过，眼力一流！', w / 2, stats2Y);
  } else {
    // 失败：显示错误次数
    ctx.font = 'bold 15px sans-serif';
    ctx.fillStyle = '#FF6B6B';
    ctx.fillText(`答错了 ${data.wrongCount} 次`, w / 2, stats1Y);
    ctx.font = '13px sans-serif';
    ctx.fillStyle = THEME.textSub;
    ctx.fillText('全部答对才能过关，再来一次！', w / 2, stats2Y);
  }
  ctx.restore();

  // ── 水印（防截图变推广）────────────────────────────────
  // 卡片右下角：游戏名 + 微信搜索提示
  ctx.save();
  ctx.globalAlpha = 0.28;
  ctx.font = 'bold 11px sans-serif';
  ctx.fillStyle = '#FF6B6B';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'bottom';
  ctx.fillText('不一样的拼图', cardX + cardW - 14, cardY + cardH - 10);
  ctx.font = '10px sans-serif';
  ctx.fillStyle = '#5D4037';
  ctx.fillText('微信搜索「不一样的拼图」来挑战', cardX + cardW - 14, cardY + cardH - 24);
  ctx.restore();

  // ── 按钮区 ────────────────────────────────────────────
  // 过关(stars===3，全对)：左=再来一次(ghost)  右=下一关(primary)
  // 未过关(stars===0，有错)：左=分享(ghost)    右=再来一次(primary)
  const passed = stars >= 3;
  const btnW = 140, btnH = 50;
  const btnY = cardY + cardH + 24;
  const leftX  = w / 2 - btnW - 10;  // 左按钮 x
  const rightX = w / 2 + 10;          // 右按钮 x
  const leftCX  = leftX  + btnW / 2;
  const rightCX = rightX + btnW / 2;
  const btnCY   = btnY + btnH / 2;

  const leftAction  = passed ? 'retry' : 'share';
  const rightAction = passed ? 'next'  : 'retry';
  const leftLabel   = passed ? '再来一次' : '分享给朋友';
  const rightLabel  = passed ? '下一关 ?' : '再来一次';

  // 特效层
  if (resultBtnAnim && resultBtnAnim.action) {
    _drawBtnPressEffect(ctx, resultBtnAnim.cx, resultBtnAnim.cy, btnW, btnH, resultBtnAnim.progress);
  }

  // 左按钮（ghost）
  {
    const isPressed = resultBtnAnim && resultBtnAnim.action === leftAction;
    const p = isPressed ? resultBtnAnim.progress : 0;
    const scale = isPressed
      ? (p < 0.2 ? 1 - (p / 0.2) * 0.1 : 0.9 + easeOutElastic((p - 0.2) / 0.8) * 0.1)
      : 1;
    ctx.save();
    ctx.translate(leftCX, btnCY);
    ctx.scale(scale, scale);
    ctx.translate(-leftCX, -btnCY);
    drawButton(ctx, { x: leftX, y: btnY }, btnW, btnH, 25, 'ghost', leftLabel, THEME.textPri, 16);
    ctx.restore();
  }

  // 右按钮（primary）
  {
    const isPressed = resultBtnAnim && resultBtnAnim.action === rightAction;
    const p = isPressed ? resultBtnAnim.progress : 0;
    const scale = isPressed
      ? (p < 0.2 ? 1 - (p / 0.2) * 0.1 : 0.9 + easeOutElastic((p - 0.2) / 0.8) * 0.1)
      : 1;
    ctx.save();
    ctx.translate(rightCX, btnCY);
    ctx.scale(scale, scale);
    ctx.translate(-rightCX, -btnCY);
    drawButton(ctx, { x: rightX, y: btnY }, btnW, btnH, 25, 'primary', rightLabel, '#fff', 18);
    ctx.restore();
  }
}

// ─────────────────────────────────────────────────────────────
//  游戏内菜单浮层（三条杠点击后弹出）
// ─────────────────────────────────────────────────────────────
export function drawGameMenu(ctx, w, h) {
  // 半透明遮罩
  ctx.save();
  ctx.fillStyle = 'rgba(20,10,5,0.5)';
  ctx.fillRect(0, 0, w, h);
  ctx.restore();

  // 菜单卡片（高度动态计算：标题区 + 三按钮 + 上下内边距）
  const btnH   = 46;
  const gap    = 14;
  const padTop = 24;   // 标题上方留白
  const titleH = 28;   // 标题行高
  const padMid = 20;   // 标题与第一个按钮间距
  const padBot = 24;   // 最后按钮到卡片底部留白
  const cardW  = w * 0.78;
  const cardH  = padTop + titleH + padMid + btnH * 3 + gap * 2 + padBot;
  const cardX  = (w - cardW) / 2;
  const cardY  = (h - cardH) / 2;

  ctx.save();
  ctx.fillStyle = '#FFF9F0';
  ctx.shadowColor = 'rgba(255,107,107,0.3)';
  ctx.shadowBlur = 28;
  fillRoundRect(ctx, cardX, cardY, cardW, cardH, 22);
  ctx.shadowBlur = 0;
  ctx.strokeStyle = 'rgba(255,107,107,0.2)';
  ctx.lineWidth = 1.5;
  strokeRoundRect(ctx, cardX, cardY, cardW, cardH, 22);
  ctx.restore();

  // 标题
  ctx.save();
  ctx.font = 'bold 17px sans-serif';
  ctx.fillStyle = THEME.textPri;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('游戏暂停', w / 2, cardY + padTop + titleH / 2);
  ctx.restore();

  // 三个按钮：继续 / 重玩 / 回主页
  const btnW  = cardW * 0.82;
  const btnX  = (w - btnW) / 2;
  const btn1Y = cardY + padTop + titleH + padMid;
  const btn2Y = btn1Y + btnH + gap;
  const btn3Y = btn2Y + btnH + gap;

  drawButton(ctx, { x: btnX, y: btn1Y }, btnW, btnH, 22, 'primary', '继续游戏',  '#fff',        16);
  drawButton(ctx, { x: btnX, y: btn2Y }, btnW, btnH, 22, 'ghost',   '重玩本关',  THEME.textPri, 16);
  drawButton(ctx, { x: btnX, y: btn3Y }, btnW, btnH, 22, 'ghost',   '回到主页',  THEME.textSub, 16);
}

// 点击检测游戏菜单，返回 'resume' | 'retry' | 'home' | 'menuBtn' | null
export function hitTestGameMenu(px, py, w, h, isMenuOpen) {
  const barH = Math.max(56, (data.safeTop || 0) + 44);

  // 三条杠按钮（左侧，无论菜单是否打开都检测）
  if (px >= 0 && px <= 56 && py >= 0 && py <= barH) return 'menuBtn';

  if (!isMenuOpen) return null;

  const btnH   = 46;
  const gap    = 14;
  const padTop = 24;
  const titleH = 28;
  const padMid = 20;
  const padBot = 24;
  const cardW  = w * 0.78;
  const cardH  = padTop + titleH + padMid + btnH * 3 + gap * 2 + padBot;
  const btnW   = cardW * 0.82;
  const btnX   = (w - btnW) / 2;
  const cardY  = (h - cardH) / 2;
  const btn1Y  = cardY + padTop + titleH + padMid;
  const btn2Y  = btn1Y + btnH + gap;
  const btn3Y  = btn2Y + btnH + gap;

  if (px >= btnX && px <= btnX + btnW) {
    if (py >= btn1Y && py <= btn1Y + btnH) return 'resume';
    if (py >= btn2Y && py <= btn2Y + btnH) return 'retry';
    if (py >= btn3Y && py <= btn3Y + btnH) return 'home';
  }
  // 点遮罩区域也关闭菜单
  return 'resume';
}

// ─────────────────────────────────────────────────────────────
//  点击检测：候选碎片
// ─────────────────────────────────────────────────────────────
export function hitTestCandidate(px, py) {
  const q = data.currentQuestion;
  if (!q || q.answered) return -1;
  for (let i = 0; i < q.candidates.length; i++) {
    const c = q.candidates[i];
    if (c.state !== 'idle') continue;
    // 矩形碰撞检测（与实际绘制区域一致）
    const hw = (c.pieceW || c.size) / 2;
    const hh = (c.pieceH || c.size) / 2;
    if (px >= c.x - hw && px <= c.x + hw && py >= c.y - hh && py <= c.y + hh) return i;
  }
  return -1;
}

// ─────────────────────────────────────────────────────────────
//  点击检测：开始 / 结果页按钮
// ─────────────────────────────────────────────────────────────
export function hitTestStartBtn(px, py, w, h) {
  const btnW = 180, btnH = 54;
  const bx  = w / 2 - btnW / 2;
  const by  = h * 0.78; // 与 drawHomeScreen 保持一致
  return px >= bx && px <= bx + btnW && py >= by && py <= by + btnH;
}

export function hitTestResultBtn(px, py, w, h) {
  const btnW = 140, btnH = 50;
  const sB_r = data.safeBottom || 0;
  const sT_r = data.safeTop    || 0;
  const cardH = h * 0.52;
  const safeH = h - sT_r - sB_r;
  const cardY = sT_r + (safeH - cardH) * 0.35; // 与 drawResultScreen 完全一致
  const btnY  = cardY + cardH + 24;
  const leftX  = w / 2 - btnW - 10;
  const rightX = w / 2 + 10;

  // 与绘制逻辑保持一致：过关左=retry/右=next，未过关左=share/右=retry
  const passed      = data.stars >= 3;
  const leftAction  = passed ? 'retry' : 'share';
  const rightAction = passed ? 'next'  : 'retry';

  if (px >= leftX  && px <= leftX  + btnW && py >= btnY && py <= btnY + btnH)
    return { action: leftAction,  cx: leftX  + btnW / 2, cy: btnY + btnH / 2 };
  if (px >= rightX && px <= rightX + btnW && py >= btnY && py <= btnY + btnH)
    return { action: rightAction, cx: rightX + btnW / 2, cy: btnY + btnH / 2 };
  return null;
}

// ─────────────────────────────────────────────────────────────
//  工具
// ─────────────────────────────────────────────────────────────
function _shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = randomInt(0, i);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

function _easeOutBack(t) {
  const c1 = 1.70158, c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

