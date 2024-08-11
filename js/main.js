import {
  renderImg,
  getEventPosition,
  randomArr,
  autoShare,
  createAudio,
  drawButton,
  pauseAudio,
  resumeAudio
} from "./utils";
import { baseUrl } from './const'
import { init } from "./init";
import data from "./data";
export default function Main(ctx, images, count, goBackNum, seeHd) {
  const loadNextImg = () => {
    var image = wx.createImage();
    console.log('=== data.count: ', data.urlList.length,data.count)
    image.src = baseUrl + data.urlList[data.urlList.length - 1 === data.count ? 1 : data.count + 1]
    !(data.urlList.length - 1 === data.count) && images.push(image)
    for (let i = 0; i < images.length - 1; i++) {
      const element = images[i].src;
      console.log('src----------', element,);
    }
  } 

  let isSuccess = false;
  data.count = count;
  data.seeHd = seeHd;
  data.page = 1;
  var width = wx.getSystemInfoSync().windowWidth;
  var height = wx.getSystemInfoSync().windowHeight;
  console.log(width, height);
  ctx.clearRect(0, 0, width, height);
  const innerAudioContext = wx.createInnerAudioContext({});
  const audio3 = wx.createInnerAudioContext({});
  const audio4 = wx.createInnerAudioContext({});
  const audio5 = wx.createInnerAudioContext({});
  createAudio(
    audio3,
    baseUrl + data.bgMusic[Math.floor(Math.random() * data.bgMusic.length)],
    true,
    false,
    true
  );
  createAudio(
    audio4,
    "/audio/succ.mp3",
    false,
    false,
    false
  );
  createAudio(
    audio5,
    '/audio/fail.mp3',
    false,
    false,
    false
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
    randomNum,
    imgWidth = parseInt(height / 3.4);
  const randomIf = () => {

    randomNum = true;
    randomNum = Math.random() > 0.5;

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
    levelY.forEach((item1) => {
      levelX.forEach((item2) => {
        data.smallImgList.push({
          x: randomNum ? item1 : item2,
          y: randomNum ? item2 : item1,
        });
      });
    });
    randomAbscissa = randomArr(data.smallImgList);
    randomOrdinate = randomArr(data.smallImgList);
  };
  randomIf();
  loadNextImg()

  // 画背景图
  // renderImg(ctx, 1, 0, 0, 500, 960, 0, 0, width, height, images[0]);

  // 初始化关卡

  init(ctx, images, width, height, randomAbscissa, randomOrdinate, goBackNum);

  // 是否有图片
  if (data.urlList.length === 0) {
    wx.showModal({
      title: "不好意思",
      content: "当你看到这个弹窗时说明我应该是没预算买服务了╮(๑•́ ₃•̀๑)╭",
      confirmText: "重玩",
      cancelText: "分享",
      success(res) {
        if (res.confirm) {
          resumeAudio(audio3);
          init(
            ctx,
            images,
            width,
            height,
            randomAbscissa,
            randomOrdinate,
            goBackNum
          );
        } else if (res.cancel) {
          autoShare(baseUrl + data.urlList[data.count + 1]);
        }
      },
    });
  }
  // 点击画布
  wx.onTouchStart(function (e) {
    let p = getEventPosition(e.touches[0]);
    console.log("点了画布");
    // 下方重玩按钮
    if (
      width / 2 - width / 10 <= p.x &&
      p.x <= width / 5 + (width / 2 - width / 10) &&
      height / 1.1 - width / 10 <= p.y &&
      p.y <= width / 10 + (height / 1.1 - width / 10)
    ) {
      resumeAudio(audio3);
      randomIf();
      init(
        ctx,
        images,
        width,
        height,
        randomAbscissa,
        randomOrdinate,
        goBackNum
      );
    }
    // 下方分享按钮
    if (
      width / 2 - width / 10 + width / 3.5 <= p.x &&
      p.x <= width / 5 + (width / 2 - width / 10 + width / 3.5) &&
      height / 1.1 - width / 10 <= p.y &&
      p.y <= width / 10 + (height / 1.1 - width / 10)
    ) {
      autoShare(baseUrl + data.urlList[data.count + 1]);
    }

    // 下方撤回按钮
    if (
      width / 2 - width / 10 - width / 3.5 <= p.x &&
      p.x <= width / 5 + (width / 2 - width / 10 - width / 3.5) &&
      height / 1.1 - width / 10 <= p.y &&
      p.y <= width / 10 + (height / 1.1 - width / 10)
    ) {
      if (data.answerSeat.length > 0 && data.answer.length > 0) {
        if (goBackNum > 0) {
          goBackNum--;
          wx.setStorage({
            key: "gameData",
            data: {
              count: data.count,
              goBackNum: goBackNum,
              seeHd: data.seeHd,
            },
            success() {
              console.log("存上了");
            },
          });
          // 撤回次数
          drawButton(
            ctx,
            {
              x: width / 2 - width / 10 - width / 8,
              y: height / 1.1 - width / 9,
            },
            width / 18,
            width / 18,
            width / 18 / 2,
            "transparent",
            "#fff",
            goBackNum,
            "#333",
            width / 30
          );
          // 清除
          ctx.clearRect(
            levelX[randomNum ? data.numX : data.numY] / 2 +
            (width / 2 - imgWidth / 2),
            levelY[randomNum ? data.numY : data.numX] / 2 + height / 7,
            newSize,
            newSize
          );
          // 重绘上方原图
          renderImg(
            ctx,
            0.3,
            levelX[randomNum ? data.numX : data.numY],
            levelY[randomNum ? data.numY : data.numX],
            initSize,
            initSize,
            levelX[randomNum ? data.numX : data.numY] / 2 +
            (width / 2 - imgWidth / 2),
            levelY[randomNum ? data.numY : data.numX] / 2 + height / 7,
            clearSize,
            clearSize,
            images[data.count + 1]
          );

          if (data.numY === 0 && data.numX > 0) {
            data.numY = levelX.length - 1;
            data.numX--;
          } else {
            data.numY--;
          }

          // 下方重绘小图
          renderImg(
            ctx,
            1,
            data.answer[data.answer.length - 1].x,
            data.answer[data.answer.length - 1].y,
            initSize,
            initSize,
            data.answerSeat[data.answerSeat.length - 1].x,
            data.answerSeat[data.answerSeat.length - 1].y,
            clearSize,
            clearSize,
            images[data.count + 1]
          );
          data.answerSeat.pop();
          data.answer.pop();
        } else {
          if (data.seeHd > 0) {
            wx.showModal({
              title: "看广告",
              content: "每天能看三次广告，悠着点用",
              confirmText: "看完了",
              showCancel: false,
              success(res) {
                if (res.confirm) {
                  data.seeHd--;
                  goBackNum++;
                  wx.setStorage({
                    key: "gameData",
                    data: {
                      count: data.count,
                      goBackNum: goBackNum,
                      seeHd: data.seeHd,
                    },
                    success() {
                      console.log("存上了");
                    },
                  });
                  // 撤回次数
                  drawButton(
                    ctx,
                    {
                      x: width / 2 - width / 10 - width / 8,
                      y: height / 1.1 - width / 9,
                    },
                    width / 18,
                    width / 18,
                    width / 18 / 2,
                    "transparent",
                    "#fff",
                    goBackNum,
                    "#333",
                    width / 30
                  );
                }
              },
            });
          } else {
            wx.setStorage({
              key: "gameData",
              data: {
                count: data.count,
                goBackNum: goBackNum,
                seeHd: data.seeHd,
              },
              // data:0,
              success() {
                console.log("存上了");
              },
            });
            wx.showModal({
              title: "没机会了",
              content: "给你机会你也不中用啊",
              confirmText: "重玩",
              cancelText: "分享",
              success(res) {
                if (res.confirm) {
                  resumeAudio(audio3);
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
                    randomOrdinate,
                    goBackNum
                  );
                } else if (res.cancel) {
                  autoShare(baseUrl + data.urlList[data.count + 1]);
                  if (goBackNum === 0 && data.shareGoBackNum) {
                    data.shareGoBackNum = false;
                    goBackNum++;
                    wx.setStorage({
                      key: "gameData",
                      data: {
                        count: data.count,
                        goBackNum: goBackNum,
                        seeHd: data.seeHd,
                      },
                      // data:0,
                      success() {
                        console.log("存上了");
                      },
                    });
                  }
                }
              },
            });
          }
        }
      }
    }

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
        innerAudioContext.src = "/audio/click.mp3";
        innerAudioContext.play();
        data.answer.push(randomAbscissa[index]);
        data.answerSeat.push({
          x: item.x / 2 + (width / 2 - imgWidth / 2),
          y: item.y / 2 + height / 2,
        });
        // console.log(data.answerSeat);
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
          levelX[randomNum ? data.numX : data.numY] / 2 +
          (width / 2 - imgWidth / 2),
          levelY[randomNum ? data.numY : data.numX] / 2 + height / 7,
          newSize,
          newSize,
          images[data.count + 1]
        );
      }
    });
    // 是否全部点完
    if (data.answer.length === data.smallImgList.length) {
      console.log('是否全部点完', audio3);
      // audio3.pause();
      pauseAudio(audio3);
      // 是否通关
      isSuccess =
        JSON.stringify(data.answer) === JSON.stringify(data.smallImgList)
          ? true
          : false;
      if (isSuccess) {

        wx.setStorage({
          key: "gameData",
          data: {
            count: data.count + 1,
            goBackNum: data.goBackNum,
            seeHd: data.seeHd,
          },
          // data:0,
          success() {
            console.log("存上了", data.count + 1);
          },
        });
        audio4.play()
      } else {
        audio5.play()
      }
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
                  title: "再次恭喜你",
                  content: "已全部通关！！！",
                  confirmText: "重玩",
                  cancelText: "分享",
                  success(res) {
                    if (res.confirm) {
                      wx.setStorage({
                        key: "gameData",
                        data: {
                          count: 0,
                          goBackNum: 1,
                          seeHd: 3,
                        },
                        // data:0,
                        success() {
                          console.log("存上了");
                        },
                      });
                      resumeAudio(audio3);
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
                        randomOrdinate,
                        goBackNum
                      );
                    } else if (res.cancel) {
                      autoShare(baseUrl + data.urlList[data.count + 1]);
                    }
                  },
                });
              } else {
                loadNextImg()
                resumeAudio(audio3);
                randomIf();
                init(
                  ctx,
                  images,
                  width,
                  height,
                  randomAbscissa,
                  randomOrdinate,
                  goBackNum
                );
              }
            } else {
              resumeAudio(audio3);
              randomIf();
              init(
                ctx,
                images,
                width,
                height,
                randomAbscissa,
                randomOrdinate,
                goBackNum
              );
            }
          } else if (res.cancel) {
            autoShare(baseUrl + data.urlList[data.count + 1]);
            isSuccess && data.count++;
          }
        },
      });
    }
  }, false);
  
  // 后台返回时
  wx.onShow(() => {
    if (data.page === 1) {
      setTimeout(() => {
        resumeAudio(audio3);
        requestAnimationFrame(() => {
          randomIf();
          init(
            ctx,
            images,
            width,
            height,
            randomAbscissa,
            randomOrdinate,
            goBackNum
          );
        });
      }, 0);
    }
  });
  // 进入后台时
  wx.onHide(() => {
    if (data.page === 1) {
      // 没成功是因为不是openid没权限。。。。服了
      // wx.setStorage({
      //         key: 'count',
      //         data: data.count,
      //         // data: 0,
      //         success() {
      //           console.log('存上了',data.count);
      //        }
      //   })
      // needUpdate.update({
      //   count: data.count, // 将该条数据的 key 指定设置为某个值，
      //   success: function (res) {
      //     console.log("更新成功：", res);
      //   },
      //   faile: function (e) {
      //     console.error("更新失败：", e);
      //   },
      //   complete: function () {
      //     console.log("进行过一次更新数据的操作");
      //   },
      // });
    }
  });
  //  }, 0);
}
