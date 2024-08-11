import Main from "./js/main";
import data from "./js/data";
import {  createAudio } from "./js/utils";
import { baseUrl } from "./js/const";

var height = wx.getSystemInfoSync().windowHeight;
var width = wx.getSystemInfoSync().windowWidth;
var canvas = wx.createCanvas();
var ctx3 = canvas.getContext("2d");
var flag = true;

var images = [],
  loadedImages = 0,
  numImages = 0;

function start(sources) {
  ctx3.fillStyle = "#6ebe78";
  ctx3.fillRect(0, 0, canvas.width, canvas.height);
  const audio1 = wx.createInnerAudioContext({});
  createAudio(
    audio1,
    baseUrl + "music/home.mp3",
    true,
    true,
    false
  );
  const polygons = [];
  const numPolygons = 10;

  // Generate random polygons
  for (let i = 0; i < numPolygons; i++) {
    const numSides = Math.floor(Math.random() * 6) + 1; // Random number of sides between 1 and 7
    const radius = Math.floor(Math.random() * 50) + 50; // Random radius between 50 and 100
    const x = Math.floor(Math.random() * (width - radius * 2)) + radius;
    const y = Math.floor(Math.random() * (height / 1.5 - radius * 2)) + radius;
    const color = `rgb(${Math.floor(Math.random() * 256)}, ${Math.floor(
      Math.random() * 256
    )}, ${Math.floor(Math.random() * 256)})`;
    const polygon = {
      x: x,
      y: y,
      radius: radius,
      numSides: numSides,
      color: color,
      angle: Math.random() * Math.PI, // Random starting angle
      speed: Math.random() * 2 + 1, // Random speed between 1 and 3
    };
    polygons.push(polygon);
  }

  function drawPolygon(polygon) {
    ctx3.beginPath();
    const angleStep = (Math.PI * 2) / polygon.numSides;
    const x = polygon.x + Math.cos(polygon.angle) * polygon.radius;
    const y = polygon.y + Math.sin(polygon.angle) * polygon.radius;
    ctx3.moveTo(x, y);
    for (let i = 1; i < polygon.numSides; i++) {
      const angle = polygon.angle + angleStep * i;
      const x = polygon.x + Math.cos(angle) * polygon.radius;
      const y = polygon.y + Math.sin(angle) * polygon.radius;
      ctx3.lineTo(x, y);
    }
    ctx3.closePath();
    ctx3.fillStyle = polygon.color;
    ctx3.fill();
  }

  function updatePolygon(polygon) {
    polygon.angle += polygon.speed * 0.0001; // Increase angle based on speed
    polygon.x += Math.cos(polygon.angle) * polygon.speed;
    polygon.y += Math.sin(polygon.angle) * polygon.speed;
    // Wrap around screen edges
    if (polygon.x < -polygon.radius) {
      polygon.x = width + polygon.radius;
    } else if (polygon.x > width + polygon.radius) {
      polygon.x = -polygon.radius;
    }
    if (polygon.y < -polygon.radius) {
      polygon.y = height / 1.5 + polygon.radius;
    } else if (polygon.y > height / 1.5 + polygon.radius) {
      polygon.y = -polygon.radius;
    }
  }
  const title = "不一样的拼图!";
  const titleFontSize = 50;
  const titleFont = `${titleFontSize}px Arial`;
  const titleWidth = ctx3.measureText(title).width;
  const titleX = (width - titleWidth) / 10;
  const titleY = height / 2;
  function render() {
    var animation;
    if (flag) {
      ctx3.fillStyle = "#6ebe78";
      ctx3.fillRect(0, 0, width, height / 1.1);

      for (let i = 0; i < polygons.length; i++) {
        drawPolygon(polygons[i]);
        updatePolygon(polygons[i]);
        ctx3.fillStyle = "white";
        ctx3.font = titleFont;
        ctx3.fillText(title, titleX, titleY);
      }
      animation = requestAnimationFrame(render);
    } else {
      cancelAnimationFrame(animation);
    }
  }

  render();
  console.log("sourcdessss", sources);
  for (let i = 0; i < sources.length; i++) {
    numImages++;
  }
  for (let j = 0; j < sources.length; j++) {
    var image = wx.createImage();

    //当一张图片加载完成时执行
    image.onload = function () {
      ++loadedImages;
      //重绘一个进度条
      ctx3.beginPath();
      ctx3.moveTo(0, height / 1.1);
      ctx3.lineTo((loadedImages / numImages) * width, height / 1.1);
      ctx3.lineWidth = width / 30;
      ctx3.strokeStyle = "green";
      ctx3.stroke();
      //当所有图片加载完成时，执行回调函数callback
      if (loadedImages === numImages) {
        flag = false;
        audio1.stop();
        wx.getStorage({
          key: "gameData",
          success(res) {
            console.log("拿到了", res.data);
            new Main(
              ctx3,
              images,
              res.data.count,
              res.data.goBackNum,
              res.data.seeHd
            );
           
          },
          fail() {
            new Main(ctx3, images, data.count, data.goBackNum, data.seeHd);
          },
        });
      }
    };
    //把sources中的图片信息导入images数组
    image.src = baseUrl + sources[j];
    images.push(image);
  }
}
// 后台返回时
wx.onShow(() => {
  if (data.page === 0) {
    wx.getStorage({
      key: "gameData",
      success(res) {
        console.log(res.data.count, "res.data.count-------");
        start(data.urlList.slice(0,data.urlList.length - 1 === res.data.count ? 20 + res.data.count : res.data.count + 20 + 2));
      },
      fail() {
        start(data.urlList.slice(0, 22));
        console.log(data.urlList.slice(0, 20),'data.urlList.slice(0, 20)');
      },
    });
    console.log('报错分界线--------');
  }
});
