import {
  renderImg,
  getEventPosition,
  randomArr,
  autoShare,
  creatAudio,
} from "./utils";
import { init } from "./init";
import data from "./data";
export default function Main(ctx, images, needUpdate) {
  data.page = 1;
  var width = wx.getSystemInfoSync().windowWidth;
  var height = wx.getSystemInfoSync().windowHeight;

  ctx.clearRect(0, 0, width, height);
  const audio3 = wx.createInnerAudioContext({});
  creatAudio(
    audio3,
    "https://7869-xia-7gu6sjctd0e9f7b4-1314673606.tcb.qcloud.la/audio/audio2.mp3",
    true,
    true
  );
  console.log("yes");
  var levelX,
    levelY,
    clearSize,
    initSize,
    newSize,
    randomAbscissa,
    randomOrdinate,
    differenceX,
    differenceY,
    imgWidth = parseInt(height / 3);
  const randomIf = () => {
    data.smallImgList = [];
    switch (data.count) {
      case 0:
        levelX = data.firstX;
        levelY = data.firstY;
        clearSize = imgWidth / 2;
        initSize = imgWidth;
        newSize = imgWidth / 2;
        differenceX = 0;
        differenceY = imgWidth / 2;
        break;
      case 1:
        levelX = data.secondX;
        levelY = data.secondY;
        clearSize = imgWidth / 3;
        initSize = imgWidth / 1.5;
        newSize = imgWidth / 3;
        differenceX = imgWidth / 6;
        differenceY = imgWidth / 3;
        break;
      case 2:
        levelX = data.thirdX;
        levelY = data.thirdY;
        clearSize = imgWidth / 4;
        initSize = imgWidth / 2;
        newSize = imgWidth / 4;
        differenceX = imgWidth / 4;
        differenceY = imgWidth / 4;
        break;
      default:
        levelX = data.abscissa;
        levelY = data.ordinate;
        clearSize = imgWidth / 5;
        initSize = imgWidth / 2.5;
        newSize = imgWidth / 5;
        differenceX = imgWidth / 3;
        differenceY = imgWidth / 5;
        break;
    }
    // 整合为一个数组
    levelX.forEach((item1) => {
      levelY.forEach((item2) => {
        data.smallImgList.push({ x: item2, y: item1 });
      });
    });
    randomAbscissa = randomArr(data.smallImgList);
    randomOrdinate = randomArr(data.smallImgList);
  };
  randomIf();

  // 画背景图
  renderImg(ctx, 1, 0, 0, 500, 960, 0, 0, width, height, images[0]);

  // 初始化关卡

  init(ctx, images, width, height, randomAbscissa, randomOrdinate);
  // 是否有图片
  if (data.urlList.length === 0) {
    wx.showModal({
      title: "不好意思",
      content:
        "当你看到这个弹窗时说明我应该是没预算买服务导致图片挂了╮(๑•́ ₃•̀๑)╭",
      confirmText: "重玩",
      cancelText: "分享",
      success(res) {
        if (res.confirm) {
          init(ctx, images, width, height, randomAbscissa, randomOrdinate);
        } else if (res.cancel) {
          autoShare(data.urlList[data.count + 1]);
        }
      },
    });
  }
  // 点击画布
  wx.onTouchStart(function (e) {
    let p = getEventPosition(e.touches[0]);
    console.log(123);
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
        item.x / 2 + (width / 2 - imgWidth / 2) <= p.x &&
        item.x / 2 + width / 2 - differenceX >= p.x &&
        item.y / 2 + height / 2 <= p.y &&
        item.y / 2 + height / 2 + differenceY >= p.y
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
        if (data.count === 0) {
          if (data.numX === 2) return;
          data.numY === 1 && data.numX++;
          data.numY === 1 ? (data.numY = 0) : data.numY++;
        } else if (data.count === 1) {
          if (data.numX === 3) return;
          data.numY === 2 && data.numX++;
          data.numY === 2 ? (data.numY = 0) : data.numY++;
        } else if (data.count === 2) {
          if (data.numX === 4) return;
          data.numY === 3 && data.numX++;
          data.numY === 3 ? (data.numY = 0) : data.numY++;
        } else {
          if (data.numX === 5) return;
          data.numY === 4 && data.numX++;
          data.numY === 4 ? (data.numY = 0) : data.numY++;
        }
        // 清除
        ctx.clearRect(
          item.x / 2 + (width / 2 - imgWidth / 2),
          item.y / 2 + height / 2,
          clearSize,
          clearSize
        );
        // 在大图上重绘小图
        renderImg(
          ctx,
          1,
          randomAbscissa[index].x,
          randomAbscissa[index].y,
          initSize,
          initSize,
          levelX[data.numY] / 2 + (width / 2 - imgWidth / 2),
          levelX[data.numX] / 2 + height / 7,
          newSize,
          newSize,
          images[data.count + 1]
        );
      }
    });
    // 是否过关
    if (data.answer.length === data.smallImgList.length) {
      const isSuccess =
        JSON.stringify(data.answer) === JSON.stringify(data.smallImgList)
          ? true
          : false;

      wx.showModal({
        title: isSuccess ? "恭喜过关" : "失败",
        content: isSuccess
          ? "哎呀我去，厉害呀！大神带带我～╭(⊙o⊙)╮"
          : "再整一下子，你肯定行！干巴爹！ (๑•̀ㅂ•́)و✧",
        confirmText: isSuccess ? "下一关" : "重玩",
        cancelText: "分享",
        success(res) {
          if (res.confirm) {
            if (isSuccess) {
              data.count++;
              renderImg(ctx, 1, 0, 0, 500, 960, 0, 0, width, height, images[0]);
              if (data.count >= data.urlList.length - 1) {
                data.count = 0;

                wx.showModal({
                  title: "不好意思",
                  content: "暂时没有下一关了呢～",
                  confirmText: "重玩",
                  cancelText: "分享",
                  success(res) {
                    if (res.confirm) {
                      renderImg(
                        ctx,
                        1,
                        0,
                        0,
                        500,
                        960,
                        0,
                        0,
                        width,
                        height,
                        images[0]
                      );
                      randomIf();
                      init(
                        ctx,
                        images,
                        width,
                        height,
                        randomAbscissa,
                        randomOrdinate
                      );
                    } else if (res.cancel) {
                      autoShare(data.urlList[data.count + 1]);
                    }
                  },
                });
              } else {
                randomIf();
                init(
                  ctx,
                  images,
                  width,
                  height,
                  randomAbscissa,
                  randomOrdinate
                );
              }
            } else {
              randomIf();
              init(ctx, images, width, height, randomAbscissa, randomOrdinate);
            }
          } else if (res.cancel) {
            autoShare(data.urlList[data.count + 1]);
            isSuccess && data.count++;
            renderImg(ctx, 1, 0, 0, 500, 960, 0, 0, width, height, images[0]);
          }
        },
      });
    }
  }, false);
  // 后台返回时
  wx.onShow(() => {
    if (data.page === 1) {
      audio3.play();
      requestAnimationFrame(() => {
        randomIf();
        init(ctx, images, width, height, randomAbscissa, randomOrdinate);
      });
    }
  });
  // 进入后台时
  wx.onHide(() => {
    if (data.page === 1) {
      // 没成功是因为不是openid没权限。。。。服了
      console.log(data.count);
      needUpdate.update({
        count: data.count, // 将该条数据的 key 指定设置为某个值，
        success: function (res) {
          console.log("更新成功：", res);
        },
        faile: function (e) {
          console.error("更新失败：", e);
        },
        complete: function () {
          console.log("进行过一次更新数据的操作");
        },
      });
    }
  });
}
