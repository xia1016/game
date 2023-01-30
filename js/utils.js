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
  url
) => {
  var img = wx.createImage();
  img.src = url;
  img.onload = function () {
    ctx.globalAlpha = opacity;
    ctx.drawImage(img, sx, sy, sw, sh, horizontal, vertical, width, height);
  };
};

// 打乱数组顺序
export const randomArr = (oldArr) => {
  let arr = JSON.parse(JSON.stringify(oldArr));
  return arr.sort(() => Math.random() - 0.5)
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
export function autoShare() {
 wx.shareAppMessage({
  title:'你的好友正在邀请你～',
  imageUrl:'https://7869-xia-7gu6sjctd0e9f7b4-1314673606.tcb.qcloud.la/img/img-1.jpg'
})
}

export function login() {
  // 获取 openid
  wx.cloud.callFunction({
    name: 'login',
    success: res => {
      window.openid = res.result.openid
      console.log(res);
      // this.prefetchHighScore()
    },
    fail: err => {
      console.error('get openid failed with error', err)
    }
  })
}