import {
  renderImg,
  getEventPosition,
  randomArr,
  audioPlay,
  autoShare,
  fillText,
} from "./utils";
import { init } from "./init";
import data from "./data";
export default function Main() {
  var canvas = wx.createCanvas();
  var ctx = canvas.getContext("2d");
  var width = wx.getSystemInfoSync().windowWidth;
  var height = wx.getSystemInfoSync().windowHeight;

  // 用渐变填色
  // text: 规定在画布上输出的文本。
  // x: 开始绘制文本的 x 坐标位置（相对于画布）。
  // y: 开始绘制文本的 y 坐标位置（相对于画布）。
  // maxWidth: 可选。允许的最大文本宽度，以像素计。

  // 整合为一个数组
  data.abscissa.forEach((item1, index1) => {
    data.ordinate.forEach((item2, index2) => {
      data.smallImgList.push({ x: item2, y: item1 });
    });
  });
  var randomAbscissa = randomArr(data.smallImgList);
  var randomOrdinate = randomArr(data.smallImgList);
  // 画背景图
  renderImg(
    ctx,
    1,
    0,
    0,
    680,
    1209,
    0,
    0,
    width,
    height,
    data.bg,
    true,
    data.achievement,
    width / 5,
    height / 10
  );
  // 初始化关卡
  init(ctx, width, height, randomAbscissa, randomOrdinate);
  // 按钮
  // renderImg(
  //   ctx,
  //   1,
  //   0,
  //   0,
  //   640,
  //   613,
  //   width / 2 - 20,
  //   height - 130,
  //   50,
  //   50,
  //   data.replay
  // );
  // ctx.fillText(data.achievement,width/5 ,height/10,100);
  // 是否有图片
  if (data.urlList.length === 0) {
    console.log(data.urlList.length);
    wx.showModal({
      title: "不好意思",
      content: "我应该是没前买服务导致图片挂了╮(๑•́ ₃•̀๑)╭",
      confirmText: "重玩",
      cancelText: "分享",
      success(res) {
        if (res.confirm) {
          init(ctx, width, height, randomAbscissa, randomOrdinate);
        } else if (res.cancel) {
          autoShare();
        }
      },
    });
  }
  // 点击画布
  wx.onTouchStart(function (e) {
    let p = getEventPosition(e.touches[0]);

    //点击重玩
    // if (
    //   width / 2 - 15 <= p.x &&
    //   width / 2 + 20 >= p.x &&
    //   height - 130 <= p.y &&
    //   height - 90 >= p.y
    // ) {
    //   init(ctx, width, height, randomAbscissa, randomOrdinate);
    // }
    randomOrdinate.forEach((item, index) => {
      //判断点击了哪个图片
      if (
        item.x / 2 + (width / 2 - 125) <= p.x &&
        item.x / 2 + (width / 2 - 125) + 50 >= p.x &&
        item.y / 2 + height / 2 <= p.y &&
        item.y / 2 + height / 2 + 50 >= p.y
      ) {
        for (let i = 0; i < data.answer.length; i++) {
          if (
            data.answer[i].x === randomAbscissa[index].x &&
            data.answer[i].y === randomAbscissa[index].y
          )
            return;
        }
        const innerAudioContext = wx.createInnerAudioContext({});
        innerAudioContext.src = "/audio/click.mp3";
        innerAudioContext.play();
        data.answer.push(randomAbscissa[index]);
        if (data.numX === 5) return;
        data.numY === 4 && data.numX++;
        data.numY === 4 ? (data.numY = 0) : data.numY++;

        // 清除
        ctx.clearRect(
          item.x / 2 + (width / 2 - 125),
          item.y / 2 + height / 2,
          51,
          51
        );
        // 在大图上重绘小图
        renderImg(
          ctx,
          1,
          randomAbscissa[index].x,
          randomAbscissa[index].y,
          100,
          100,
          data.abscissa[data.numY] / 2 + (width / 2 - 125),
          data.ordinate[data.numX] / 2 + height / 7,
          50,
          50,
          data.urlList[data.count]
        );
      }
    });

    // 过关条件
    if (data.answer.length === data.smallImgList.length) {
      const isSuccess =
        JSON.stringify(data.answer) === JSON.stringify(data.smallImgList)
          ? true
          : false;

      wx.showModal({
        title: isSuccess ? "恭喜过关" : "失败",
        content: isSuccess ? "哎呀我去，厉害呀！大神带带我～╭(⊙o⊙)╮" : "再整一下子，你肯定行！干巴爹！ (๑•̀ㅂ•́)و✧",
        confirmText: isSuccess ? "下一关" : "重玩",
        cancelText: "分享",
        success(res) {
          if (res.confirm) {
            if (isSuccess) {
              data.count++;
              data.achievement += 25;
              ctx.clearRect(0, 0, width, 100);
              renderImg(
                ctx,
                1,
                0,
                0,
                width,
                100,
                0,
                0,
                width,
                100,
                data.bg,
                true,
                data.achievement,
                width / 5,
                height / 10
              );
              if (data.count >= data.urlList.length - 1) {
                data.count = 0;
                wx.showModal({
                  title: "不好意思",
                  content: "暂时没有下一关了呢～",
                  confirmText: "重玩",
                  cancelText: "分享",
                  success(res) {
                    if (res.confirm) {
                      init(ctx, width, height, randomAbscissa, randomOrdinate);
                    } else if (res.cancel) {
                      autoShare();
                    }
                  },
                });
              } else {
                init(ctx, width, height, randomAbscissa, randomOrdinate);
              }
            } else {
              data.achievement -= 25;
              ctx.clearRect(0, 0, width, 100);
              renderImg(
                ctx,
                1,
                0,
                0,
                width,
                100,
                0,
                0,
                width,
                100,
                data.bg,
                true,
                data.achievement,
                width / 5,
                height / 10
              );
              init(ctx, width, height, randomAbscissa, randomOrdinate);
            }
          } else if (res.cancel) {
            autoShare();
          }
        },
      });
    }
  }, false);
  // 后台返回时
  wx.onShow(() => {
    requestAnimationFrame(() => {
      init(ctx, width, height, randomAbscissa, randomOrdinate);
    });
  });
}
