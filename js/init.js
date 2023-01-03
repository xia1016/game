import { renderImg } from "./utils";
import data from "./data";
export const init = (ctx,width,height,randomAbscissa,randomOrdinate) => {
  // 数据重置
  data.numX = 0;
  data.numY = -1;
  data.abscissa = [ 0,100,200,300,400 ]
  data.ordinate = [ 0,100,200,300,400 ]
  data.answerX = [],
  data.answerY = [],
  data.rightKeyX = [],
  data.rightKeyY = [],
  // 清除
  ctx.clearRect(
    width / 2 - 125,
    height / 7 - 1,
    251,
    251,
  );
  ctx.clearRect(
    width / 2 - 125,
    height / 2 ,
    250,
    250,
  );
  // 画大图
  renderImg(
    ctx,
    0.3,
    0,
    0,
    500,
    500,
    width / 2 - 125,
    height / 7,
    250,
    250,
    data.urlList[data.count]
  );
  // 画小图
  data.abscissa.forEach((item1, index1) => {
    data.ordinate.forEach((item2, index2) => {
      data.rightKeyX.push(item2)
      data.rightKeyY.push(item1)
      renderImg(
        ctx,
        1,
        item1,
        item2,
        100,
        100,
        randomAbscissa[index2] / 2 + (width / 2 - 125),
        randomOrdinate[index1] / 2 + height / 2,
        50,
        50,
        data.urlList[data.count]
      );
    });
  });
};
