// components/modals.js
Component({
    /**
     * 组件的属性列表
     */
    properties: {

    },

    /**
     * 组件的初始数据
     */
    data: {
        isSuccess:false,
        isFail:false
    },

    /**
     * 组件的方法列表
     */
    methods: {
        success(){
            this.setData({
                isSuccess:true
            })
        },
        fail(){
            this.setData({
                isFail:true
            })
        },
        reload() {
            this.triggerEvent('initImgList')
        }
    },
})
