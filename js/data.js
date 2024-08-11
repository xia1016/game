var height = wx.getSystemInfoSync().windowHeight;
var imgWidth =  parseInt(height / 3.4 )
const data = {
  numX: 0,
  numY: -1,
  // 你的坐标答案和坐标
  answer: [],
  answerSeat: [],
  backNum: [],
  goBackNum: 1,
  shareGoBackNum:true,
  seeHd:3,
  // 关卡
  count: 0,
  // 倒计时
  initTime:10,
  smallImgList: [],
  // 你的分数
  achievement: 0,
  userId:'',
  page:0,
  firstX: [0,  imgWidth],
  firstY: [0,  imgWidth],
  secondX: [0, imgWidth *2 / 3, imgWidth * 4 / 3],
  secondY: [0, imgWidth *2/ 3, imgWidth * 4 / 3],
  thirdX: [0, imgWidth / 2, imgWidth, imgWidth *2 - imgWidth / 2],
  thirdY: [0, imgWidth / 2, imgWidth, imgWidth *2 - imgWidth / 2],
  abscissa: [0, imgWidth *2 / 5, imgWidth *2 / 5 *2, imgWidth *2 / 5*3, imgWidth *2 / 5*4],
  ordinate: [0, imgWidth *2 / 5, imgWidth *2 / 5 *2, imgWidth *2 / 5*3, imgWidth *2 / 5*4],

  urlList: [
    // 背景图暂时保持原位
    "img/bg.jpg",
    // 以下是素材
   "img-000/01.jpg",
    "img-000/02.jpg",
    "img-000/03.jpg",
    "img-000/04.jpg",
    "img-000/05.jpg",
    "img-000/06.jpg",
    "img-000/07.jpg",
    "img-000/08.jpg",
    "img-000/09.jpg",
    "img-000/10.jpg",
    "img-000/11.jpg",
    "img-000/12.jpg",
    "img-000/13.jpg",
    "img-000/14.jpg",
    "img-000/15.jpg",
    "img-000/16.jpg",
    "img-000/17.jpg",
    "img-000/18.jpg",
    "img-000/19.jpg",
    "img-000/20.jpg",
    "img-000/21.jpg",
    "img-000/22.jpg",
    "img-000/23.jpg",
  ],
  bgMusic: [
    "music/main-1.mp3",
    "music/main-2.mp3",
    "music/main-3.mp3",
    "music/main-4.mp3",
    "music/main-5.mp3",
  ]
};

export default data;
