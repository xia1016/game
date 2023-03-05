import Main from "./js/main";
import data from "./js/data";
import { renderImg, creatAudio } from "./js/utils";

var height = wx.getSystemInfoSync().windowHeight;
var width = wx.getSystemInfoSync().windowWidth;
var canvas = wx.createCanvas();
var ctx3 = canvas.getContext("2d");
var imgHomeBg = wx.createImage();

imgHomeBg.src =
  "https://7869-xia-7gu6sjctd0e9f7b4-1314673606.tcb.qcloud.la/img/home.jpeg";
imgHomeBg.onload = () => {
  ctx3.drawImage(imgHomeBg, 0, 0, 500, 960, 0, 0, width, height);
  // start(data.urlList);
};

wx.cloud.init();
// // let db = wx.cloud.database();
let db = wx.cloud.database();

let authorCollection = db.collection("playerdata");
//  console.log(authorCollection);
//  authorCollection.where({
//   _openid:'oNSqE5LPyl54oDSChwKuHL9kfaW8',
// }).get({
//   success:function(res){
//       console.log("成功查询到数据：",res.data[0])
//   },
//   faile:function(e){
//       console.error("查询数据失败：",e)
//   },
//   complete:function(){
//       console.log("有过一次查询数据的操作")
//   }
// })

var images = [],
  loadedImages = 0,
  numImages = 0;

function start(sources) {
  // ctx3.drawImage(imgHomeBg, 0, 0, 500, 960, 0, 0, width, height);
  for (let i = 0; i < sources.length; i++) {
    numImages++;
  }
  for (let j = 0; j < sources.length; j++) {
    var image = wx.createImage();

    //当一张图片加载完成时执行
    image.onload = function () {
      ++loadedImages;
      //重绘一个进度条
      ctx3.clearRect(
        width / 10,
        height - 200 - 5,
        width - width / 5,
        width / 30
      );
      ctx3.beginPath();
      ctx3.moveTo(width / 10, height - 200);
      ctx3.lineTo(
        (loadedImages / numImages) * (width - width / 10),
        height - 200
      );
      ctx3.lineWidth = width / 30;
      ctx3.strokeStyle = "green";
      ctx3.stroke();
      //当所有图片加载完成时，执行回调函数callback
      if (loadedImages === numImages) {
        // 通过 wx.getSetting 查询用户是否已授权头像昵称信息

        // 画背景图
        wx.getSetting({
          success(res) {
            if (res.authSetting["scope.userInfo"]) {
              // 已经授权，可以直接调用 getUserInfo 获取头像昵称
              wx.getUserInfo({
                success: function (res) {
                  console.log(res.userInfo);
                  new Main(ctx3, images,authorCollection);
                },
              });
            } else {
              ctx3.clearRect(0, 0, width, height);
              renderImg(
                ctx3,
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
              const innerAudioContext = wx.createInnerAudioContext({});
              creatAudio(
                innerAudioContext,
                "https://7869-xia-7gu6sjctd0e9f7b4-1314673606.tcb.qcloud.la/audio/audio1.mp3",
                true,
                true
              );
              // 否则，先通过 wx.createUserInfoButton 接口发起授权
              let button = wx.createUserInfoButton({
                type: "text",
                text: "开始游戏",
                style: {
                  left: width / 2 - 60,
                  top: height / 1.5,
                  width: 120,
                  height: 50,
                  lineHeight: 50,
                  backgroundColor: "rgb(236, 222, 153)",
                  color: "#000",
                  textAlign: "center",
                  fontSize: 20,
                  borderRadius: 4,
                },
              });
              button.onTap((res) => {
                // 用户同意授权后回调，通过回调可获取用户头像昵称信息
                console.log(res);
                if (res.userInfo) {
                  var count = 0;
                  authorCollection.add({
                    data: { ...res.userInfo, count },
                    success: function (result) {
                      // 存取成功则返回增加的那条数据的_id
                      // data.userId = result._id;
                      let needUpdate = authorCollection.doc(result._id);
                      innerAudioContext.pause();
                      button.destroy();
                      new Main(ctx3, images,needUpdate);
                      // console.log(data.userId);
                    },
                    fail: function (e) {
                      console.error("添加数据失败：", e);
                    },
                    complete: function () {
                      console.log("有一次添加数据的动作");
                    },
                  });
                }
               
                
              });
            }
          },
        });
      }
    };
    //把sources中的图片信息导入images数组
    image.src = sources[j];
    images.push(image);
  }
}
// 后台返回时
wx.onShow(() => {
  if (data.page === 0) {
    start(data.urlList);
  }
});
