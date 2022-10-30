// index.js
// 获取应用实例
const app = getApp()

Page({
    data: {
        motto: 'Hello World',
        userInfo: {},
        hasUserInfo: false,
        canIUse: wx.canIUse('button.open-type.getUserInfo'),
        canIUseGetUserProfile: false,
        canIUseOpenData: wx.canIUse('open-data.type.userAvatarUrl') && wx.canIUse('open-data.type.userNickName'), // 如需尝试获取用户信息可改为false
        imgListItem1: [],
        imgListItem2: [],
        imgListItem3: [],
        imgListItem4: [],
        imgListItem5: [],
        imgListBig: [],
        fileList: 1, // 文件夹名
        className: '',
        boxClassName: '',
        success: {
            first1: ["00", "01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23", "24"],
            first2: ["00", "05", "10", "15", "20", "01", "06", "11", "16", "21", "02", "07", "12", "17", "22", "03", "08", "13", "18", "23", "04", "09", "14", "19", "24"],
        },
        showModal: false,

    },
        // 下方图片点击
    imgListBigClick: function (e) {
        const audio = wx.createInnerAudioContext()
        audio.src = '/pages/logs/audio/click.mp3'
        audio.play()
        this.rule1(e.target.dataset.url)
        this.data.imgListBig.splice(e.target.dataset.index, 1)

        this.setData({
            imgListBig: this.data.imgListBig,
        })
        let arr = this.data.imgListItem1.concat(this.data.imgListItem2.concat(this.data.imgListItem3.concat(this.data.imgListItem4.concat(this.data.imgListItem5))))
        let arr1 = arr.toString()
        console.log(arr1);

        console.log(this.data.success.first2?.toString());
        if (this.data.boxClassName === 'box_wrap' && arr1 === this.data.success.first1?.toString()) {
            this.setData({
                showModal: true,
            })
            this.selectComponent('.modal').success()
            return
        } else if (this.data.boxClassName === 'box' && arr1 === this.data.success.first2?.toString()) {
            this.setData({
                showModal: true,
            })
            this.selectComponent('.modal').success()
            return
        } else if (arr.length === this.data.success.first1.length) {
            this.setData({
                showModal: true,
            })
            this.selectComponent('.modal').fail()
        }
    },
    // 上方图片点击
    imgListClick: function (e) {
        const audio = wx.createInnerAudioContext()
        audio.src = '/pages/logs/audio/drop.mp3'
        audio.play()
        switch (e.target.dataset.flag) {
            case '1':
                this.data.imgListItem1.splice(e.target.dataset.index, 1)
                break
            case '2':
                this.data.imgListItem2.splice(e.target.dataset.index, 1)
                break
            case '3':
                this.data.imgListItem3.splice(e.target.dataset.index, 1)
                break
            case '4':
                this.data.imgListItem4.splice(e.target.dataset.index, 1)
                break
            case '5':
                this.data.imgListItem5.splice(e.target.dataset.index, 1)
                break
        }
        this.data.imgListBig.push(e.target.dataset.url)
        this.setData({
            imgListItem1: this.data.imgListItem1,
            imgListItem2: this.data.imgListItem2,
            imgListItem3: this.data.imgListItem3,
            imgListItem4: this.data.imgListItem4,
            imgListItem5: this.data.imgListItem5,
            imgListBig: this.data.imgListBig
        })
    },
    // 数组随机排列
    arrRandom: function (arr) {
        let t
        for (let i = 0; i < arr.length; i++) {
            let rand = ~~(Math.random() * arr.length);
            t = arr[rand];
            arr[rand] = arr[i];
            arr[i] = t;
        }
        return arr
    },
    // 答案
    answer: function () {
        let arr = []
        for (let i = 0; i < 25; i++) {
            arr.push(i.toString().padStart(2, '0'))
        }
        return arr
    },
    // 初始化list
    initImgList: function () {
        const num = Math.random() > 0.5 ? 0 : 1
        let nameList = ['box_item', 'block']
        let boxNameList = ['box', 'box_wrap']
        let name = nameList[num]
        let boxName = boxNameList[num]
        let arr = this.answer()
        let fileListRandom = [1, 2, 3, 4]
        this.arrRandom(arr)
        this.arrRandom(fileListRandom)
        console.log(~~(Math.random() * fileListRandom.length));
        this.setData({
            imgListItem1: [],
            imgListItem2: [],
            imgListItem3: [],
            imgListItem4: [],
            imgListItem5: [],
            fileList: fileListRandom[~~(Math.random() * fileListRandom.length)],
            imgListBig: arr,
            className: name,
            boxClassName: boxName,
            showModal: false
        })
    },
    // 插入顺序
    rule1: function (url) {
        if (this.data.imgListItem1.length >= 5) {
            if (this.data.imgListItem2.length >= 5) {
                if (this.data.imgListItem3.length >= 5) {
                    if (this.data.imgListItem4.length >= 5) {
                        const random3 = Math.random() > 0.1 ? 0 : 1
                        if (random3 === 1) {
                            this.data.imgListItem5.push(url)
                        } else {
                            this.data.imgListItem5.unshift(url)
                        }
                    } else {
                        const random2 = Math.random() > 0.5 ? 0 : 1
                        if (random2 === 0) {
                            this.data.imgListItem4.push(url)
                        } else {
                            this.data.imgListItem4.unshift(url)
                        }
                    }
                } else {
                    const random = Math.random() > 0.5 ? 0 : 1
                    if (random === 1) {
                        this.data.imgListItem3.push(url)
                    } else {
                        this.data.imgListItem3.unshift(url)
                    }
                }
            } else {
                this.data.imgListItem2.push(url)
            }
        } else {
            this.data.imgListItem1.push(url)
        }
        this.setData({
            imgListItem1: this.data.imgListItem1,
            imgListItem2: this.data.imgListItem2,
            imgListItem3: this.data.imgListItem3,
            imgListItem4: this.data.imgListItem4,
            imgListItem5: this.data.imgListItem5,
            imgListBig: this.data.imgListBig,
            showModal: false,
            isSuccess: false
        })
    },
    // 事件处理函数
    bindViewTap() {
        wx.navigateTo({
            url: '../logs/logs'
        })
    },
    onReady() {

    },
    onLoad() {
        this.initImgList()
        if (wx.getUserProfile) {
            this.setData({
                canIUseGetUserProfile: true
            })
        }
    },
    getUserProfile(e) {
        // 推荐使用wx.getUserProfile获取用户信息，开发者每次通过该接口获取用户个人信息均需用户确认，开发者妥善保管用户快速填写的头像昵称，避免重复弹窗
        wx.getUserProfile({
            desc: '展示用户信息', // 声明获取用户个人信息后的用途，后续会展示在弹窗中，请谨慎填写
            success: (res) => {
                console.log(res)
                this.setData({
                    userInfo: res.userInfo,
                    hasUserInfo: true
                })
            }
        })
    },
    getUserInfo(e) {
        // 不推荐使用getUserInfo获取用户信息，预计自2021年4月13日起，getUserInfo将不再弹出弹窗，并直接返回匿名的用户个人信息
        console.log(e)
        this.setData({
            userInfo: e.detail.userInfo,
            hasUserInfo: true
        })
    }
})