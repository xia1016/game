import { drawButton, renderImg,fillText } from "./utils";
import data from "./data";
export const init = (ctx,images, width, height, randomAbscissa, randomOrdinate) => {
  
  // 数据重置
  data.numX = 0;
  data.numY = -1;
  data.answer = [];
  var initSize, newSize, imgWidth = parseInt(height/3 )
  switch (data.count) {
    case 0:
      initSize =  imgWidth;
      newSize =  imgWidth/2;
      break;
    case 1:
      initSize = imgWidth*2/3;
      newSize = imgWidth*2/3/2
      break;
    case 2:
      initSize = imgWidth*2/4;
      newSize = imgWidth*2/4/2;
      break;
    default:
      initSize = imgWidth*2/5;
      newSize = imgWidth*2/5/2;
      break;
  }
  // 清除
  ctx.clearRect(width / 2 - (( imgWidth)/2), height / 7,   imgWidth,   imgWidth);
  ctx.clearRect(width / 2 - (( imgWidth)/2), height / 2,   imgWidth,   imgWidth);
  // 画大图
  renderImg(
    ctx,
    0.3,
    0,
    0,
    imgWidth*2,
    imgWidth*2,
    width / 2 - (( imgWidth)/2),
    height / 7,
    imgWidth,
    imgWidth,
    images[data.count+1]
  );
  // 画小图
  randomAbscissa.forEach((item, index) => {
    renderImg(
      ctx,
      1,
      item.x,
      item.y,
      initSize,
      initSize,
      randomOrdinate[index].x / 2 + width / 2 - ( imgWidth /2),
      randomOrdinate[index].y / 2 + height / 2,
      newSize,
      newSize,
      images[data.count+1]
    );
  });
  drawButton(
    ctx,
    { x: width / 10 , y: width / 10  },
    width / 5,
    width / 10,
    4,
    "transparent",
    "transparent",
    `第${data.count + 1}关`,
    "#333",
    width / 10
  );
  drawButton(
    ctx,
    { x: width / 2 - width / 10 - width / 3.5, y: height / 1.1 - width / 10 },
    width / 5,
    width / 10,
    4,
    "transparent",
    "rgb(236, 222, 153)",
    "撤回",
    "#333",
    width / 20
  );
  drawButton(
    ctx,
    { x: width / 2 - width / 10, y: height / 1.1 - width / 10 },
    width / 5,
    width / 10,
    4,
    "transparent",
    "rgb(236, 222, 153)",
    "重玩",
    "#333",
    width / 20
  );
  drawButton(
    ctx,
    { x: width / 2 - width / 10 + width / 3.5 , y: height / 1.1 - width / 10 },
    width / 5,
    width / 10,
    4,
    "transparent",
    "rgb(236, 222, 153)",
    "分享",
    "#333",
    width / 20
  );
};
