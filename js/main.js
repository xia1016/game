import { renderImg, getEventPosition, randomArr } from "./utils";
import { init } from "./init";
import data from "./data";
export default function Main() {
  console.log(1111);
  var canvas = wx.createCanvas();
  var ctx = canvas.getContext("2d");
  var width = wx.getSystemInfoSync().windowWidth;
  var height = wx.getSystemInfoSync().windowHeight;
  var randomAbscissa = randomArr(data.abscissa);
  var randomOrdinate = randomArr(data.ordinate);

  // 初始化关卡
  init(ctx, width, height, randomAbscissa, randomOrdinate);
  // 按钮
  ctx.font = "40px 宋体";
  ctx.strokeStyle = "white";
  ctx.strokeText("重玩", width / 2 - 40, height - 100);
  // 点击画布
  wx.onTouchStart(function (e) {
    let p = getEventPosition(e.touches[0]);
    //点击重玩
    if (
      width / 2 - 40 <= p.x &&
      width / 2 + 40 >= p.x &&
      height - 130 <= p.y &&
      height - 90 >= p.y
    ) {
      init(ctx, width, height, randomAbscissa, randomOrdinate);
    }
    data.abscissa.forEach((item1, index1) => {
      data.ordinate.forEach((item2, index2) => {
        //判断点击了哪个图片
        if (
          randomAbscissa[index2] / 2 + (width / 2 - 125) <= p.x &&
          randomAbscissa[index2] / 2 + (width / 2 - 125) + 50 >= p.x &&
          randomOrdinate[index1] / 2 + height / 2 <= p.y &&
          randomOrdinate[index1] / 2 + height / 2 + 50 >= p.y
        ) {
          for (let i = 0; i < data.answerX.length; i++) {
            if (data.answerX[i] === item1 && data.answerY[i] === item2) return;
          }

          data.answerX.push(item1);
          data.answerY.push(item2);
          // console.log(data.answerX);
          // console.log(data.rightKeyX);
          // console.log(JSON.stringify(data.answerX));
          // console.log(JSON.stringify(data.rightKeyX));
          if (data.numX === 5) return;
          data.numY === 4 && data.numX++;
          data.numY === 4 ? (data.numY = 0) : data.numY++;

          // 清除
          ctx.clearRect(
            randomAbscissa[index2] / 2 + (width / 2 - 125),
            randomOrdinate[index1] / 2 + height / 2,
            51,
            51
          );
          // 重绘
          renderImg(
            ctx,
            1,
            item1,
            item2,
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
    });
    // 过关条件
    if (data.answerX.length === data.rightKeyX.length) {
      const isSuccess =
        JSON.stringify(data.answerX) === JSON.stringify(data.rightKeyX)
          ? true
          : false;

      wx.showModal({
        title: isSuccess ? "恭喜过关" : "失败",
        content: isSuccess ? "可以啊细狗～" : "行不行呀细狗～",
        confirmText: isSuccess ? "下一关" : "重玩",
        cancelText: "分享",
        success(res) {
          if (res.confirm) {
            if (isSuccess) {
              data.count++;
              if (count === 4) {
                data.count = 0
                wx.showModal({
                  title: "不好意思",
                  content: "暂时没有下一关了呢～",
                  confirmText: "重玩",
                  cancelText: "分享",
                  success(res) {
                    if (res.confirm) {
                      init(ctx, width, height, randomAbscissa, randomOrdinate);
                    } else if (res.cancel) {
                      console.log("用户点击取消");
                    }
                  },
                });
              } else {
                init(ctx, width, height, randomAbscissa, randomOrdinate);
              }
            } else {
              init(ctx, width, height, randomAbscissa, randomOrdinate);
            }
          } else if (res.cancel) {
            console.log("用户点击取消");
          }
        },
      });
    }
  }, false);
}
