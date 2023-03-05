var height = wx.getSystemInfoSync().windowHeight;
var imgWidth =  parseInt(height/3 )
const data = {
  urlList: [
    "https://7869-xia-7gu6sjctd0e9f7b4-1314673606.tcb.qcloud.la/img/bg2.jpg",
    "https://7869-xia-7gu6sjctd0e9f7b4-1314673606.tcb.qcloud.la/img/img-8.jpg",
    "https://7869-xia-7gu6sjctd0e9f7b4-1314673606.tcb.qcloud.la/img/img-1.jpg",
    // "https://7869-xia-7gu6sjctd0e9f7b4-1314673606.tcb.qcloud.la/img/img-7.jpg",
    "https://7869-xia-7gu6sjctd0e9f7b4-1314673606.tcb.qcloud.la/img/img-6.jpg",
    // "https://7869-xia-7gu6sjctd0e9f7b4-1314673606.tcb.qcloud.la/img/img-5.jpg",
    // "https://7869-xia-7gu6sjctd0e9f7b4-1314673606.tcb.qcloud.la/img/img-16.jpg",
    // "https://7869-xia-7gu6sjctd0e9f7b4-1314673606.tcb.qcloud.la/img/img-15.jpg",
    // "https://7869-xia-7gu6sjctd0e9f7b4-1314673606.tcb.qcloud.la/img/img-2.jpg",
  ],
  replay:
    "https://7869-xia-7gu6sjctd0e9f7b4-1314673606.tcb.qcloud.la/img/replay.png",
  numX: 0,
  numY: -1,
  // 你的坐标答案
  answer: [],
  // 关卡
  count: 2,
  smallImgList: [],
  // 你的分数
  achievement: 0,
  userId:'',
  // firstX: [0, 250],
  // firstY: [0, 250],
  // secondX: [0, 167, 334],
  // secondY: [0, 167, 334],
  // thirdX: [0, 125, 250, 375],
  // thirdY: [0, 125, 250, 375],
  // abscissa: [0, 100, 200, 300, 400],
  // ordinate: [0, 100, 200, 300, 400],
  page:0,
  firstX: [0,  imgWidth],
  firstY: [0,  imgWidth],
  // secondY: [0, 167, 334],
  secondX: [0, imgWidth *2 / 3, imgWidth * 4 / 3],
  secondY: [0, imgWidth *2/ 3, imgWidth * 4 / 3],
  // thirdX: [0, 125, 250, 375],
  thirdX: [0, imgWidth / 2, imgWidth, imgWidth *2 - imgWidth / 2],
  thirdY: [0, imgWidth / 2, imgWidth, imgWidth *2 - imgWidth / 2],
  // abscissa: [0, 100, 200, 300, 400],
  abscissa: [0, imgWidth *2 / 5, imgWidth *2 / 5 *2, imgWidth *2 / 5*3, imgWidth *2 / 5*4],
  ordinate: [0, imgWidth *2 / 5, imgWidth *2 / 5 *2, imgWidth *2 / 5*3, imgWidth *2 / 5*4],
};

export default data;
