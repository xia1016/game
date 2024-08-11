import { baseUrl } from './const'
import data from "./data";

/**
 *
 * @param {canvas} ctx
 * @param {透明度} opacity
 * @param {开始剪切图片的 x 坐标位置} sx
 * @param {开始剪切图片的 y 坐标位置} sy
 * @param {被剪切图像的宽度} sw
 * @param {被剪切图像的高度} sh
 * @param {X轴} horizontal
 * @param {Y轴} vertical
 * @param {图片宽} width
 * @param {图片高} height
 * @param {路径} url
 * @param {是否画字} isAchievement
 * @param {画什么字} data
 */
export const renderImg = (
  ctx,
  opacity,
  sx = 0,
  sy = 0,
  sw = width,
  sh = height,
  horizontal,
  vertical,
  width,
  height,
  img,
  isAchievement,
  data // 假设data是你想绘制的文本信息
) => {
  // 清除指定区域
  ctx.clearRect(horizontal, vertical, width, height);

  // 设置透明度
  ctx.globalAlpha = opacity;

  // 绘制图像
  ctx.drawImage(img, sx, sy, sw, sh, horizontal, vertical, width, height);

  // 如果需要绘制文本
  if (isAchievement) {
    ctx.fillStyle = "#333"; // 设置文本颜色
    ctx.font = "36px Arial"; // 设置文本样式
    ctx.fillText(data, horizontal, vertical + 36); // 绘制文本，这里假设文本从horizontal, vertical + 36的位置开始
  }
};

let onEndedCallback;
export function createAudio(innerAudioContext, src, autoplay, loop,isNeedNext) {
  innerAudioContext.src = src;
  innerAudioContext.autoplay = autoplay;
  innerAudioContext.loop = loop;

   // 定义 onEnded 事件处理函数
  onEndedCallback = () => {
    if (isNeedNext) {
      playNextSong();
    }
  };

  // 根据 isNeedNext 决定是否添加 onEnded 事件监听器
  if (isNeedNext) {
    innerAudioContext.onEnded(onEndedCallback);
  }
}

// 播放下一首音乐
export function playNextSong() {
  // 创建新的音频上下文并播放下一首
  const nextSongAudioContext = wx.createInnerAudioContext();
  createAudio(nextSongAudioContext,baseUrl + data.bgMusic[Math.floor(Math.random() * data.bgMusic.length)], true, false,true);
}

// 暂停
export function pauseAudio(innerAudioContext) {
  innerAudioContext.pause();
  // 暂停时不需要移除 onEnded 监听器，因为我们希望重新开始后还能触发
  innerAudioContext.offEnded(() => {});
}

// 重新开始
export function resumeAudio(innerAudioContext) {
  innerAudioContext.play(); // 如果没有设置 src，直接播放
   // 定义 onEnded 事件处理函数
   onEndedCallback = () => {
      playNextSong();
  };
  innerAudioContext.onEnded(onEndedCallback);
}

// 打乱数组元素顺序
export const randomArr = (oldArr) => {
  let arr = JSON.parse(JSON.stringify(oldArr));
  var finalyArr =
    arr.sort(() => Math.random() - 0.5) === oldArr
      ? randomArr(oldArr)
      : arr.sort(() => Math.random() - 0.5);
  return finalyArr;
};

// 处理点击坐标
export function getEventPosition(ev) {
  var x, y;
  if (ev.pageX || ev.pageX == 0) {
    x = ev.pageX;
    y = ev.pageY;
  } else if (ev.offsetX || ev.offsetX == 0) {
    x = ev.offsetX;
    y = ev.offsetY;
  }
  return { x: x, y: y };
}

// 分享
export function autoShare(url) {
  wx.shareAppMessage({
    title: "你的好友正在邀请你～",
    imageUrl: url,
  });
}

export function login() {
  // 获取 openid
  wx.cloud.callFunction({
    name: "login",
    success: (res) => {
      window.openid = res.result.openid;
      console.log(res);
    },
    fail: (err) => {
      console.error("get openid failed with error", err);
    },
  });
}

/**
 *
 * @param {canvas} ctx
 * @param {内容} data
 * @param {字体大小} fontSize
 * @param {字体颜色} fontColor
 * @param {X轴} x
 * @param {Y轴} y
 * @param {最大宽} maxWidth
 */
export function fillText(ctx, data, fontSize, fontColor, x, y, maxWidth) {
  ctx.font = fontSize;
  ctx.fillStyle = fontColor;
  ctx.fillText(`第${data}关`, x, y, maxWidth);
}

/**
 * &#64;description: 用于canvas绘制按钮
 * &#64;param {*} ctx canvas的2d对象上下文
 * &#64;param {*} startPoint 按钮的左上角坐标点
 * &#64;param {*} width 按钮的宽度
 * &#64;param {*} height 按钮的高度
 * &#64;param {*} radius 按钮的圆角
 * &#64;param {*} borderColor 边框颜色
 * &#64;param {*} backgroundColor 背景色
 * &#64;param {*} text 按钮文字
 * &#64;param {*} textColor 文字颜色
 * &#64;param {*} fontSize 文字大小
 * &#64;return {*}
 */
export function drawButton(
  ctx,
  startPoint,
  width,
  height,
  radius,
  borderColor,
  backgroundColor,
  text,
  textColor,
  fontSize
) {
  ctx.strokeStyle = borderColor;
  ctx.fillStyle = backgroundColor;
  ctx.beginPath();
  ctx.moveTo(startPoint.x, startPoint.y + radius);
  ctx.arcTo(
    startPoint.x,
    startPoint.y,
    startPoint.x + radius,
    startPoint.y,
    radius
  );
  ctx.lineTo(startPoint.x + width - radius, startPoint.y);
  ctx.arcTo(
    startPoint.x + width,
    startPoint.y,
    startPoint.x + width,
    startPoint.y + radius,
    radius
  );
  ctx.lineTo(startPoint.x + width, startPoint.y + height - radius);
  ctx.arcTo(
    startPoint.x + width,
    startPoint.y + height,
    startPoint.x + width - radius,
    startPoint.y + height,
    radius
  );
  ctx.lineTo(startPoint.x + radius, startPoint.y + height);
  ctx.arcTo(
    startPoint.x,
    startPoint.y + height,
    startPoint.x,
    startPoint.y + height - radius,
    radius
  );
  ctx.closePath();
  ctx.stroke();
  ctx.fill();
  ctx.fillStyle = textColor;
  ctx.font = `${fontSize}px sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, startPoint.x + width / 2, startPoint.y + height / 2);
}

