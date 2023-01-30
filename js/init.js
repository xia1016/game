import { randomArr, renderImg } from "./utils";
import data from "./data";
export const init = (ctx,width,height,randomAbscissa,randomOrdinate) => {
  // 数据重置
  data.numX = 0;
  data.numY = -1;
  data.answer = []

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
  randomAbscissa.forEach((item,index)=>{
    renderImg(
      ctx,
      1,
      item.x,
      item.y,
      100,
      100,
      randomOrdinate[index].x / 2 + (width / 2 - 125),
      randomOrdinate[index].y / 2 + height / 2,
      50,
      50,
      data.urlList[data.count]
    );
  })
};
