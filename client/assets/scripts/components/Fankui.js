cc.Class({
    extends: cc.Component,

    properties: {
        // foo: {
        //    default: null,      // The default value will be used only when the component attaching
        //                           to a node for the first time
        //    url: cc.Texture2D,  // optional, default is typeof default
        //    serializable: true, // optional, default is true
        //    visible: true,      // optional, default is true
        //    displayName: 'Foo', // optional
        //    readonly: false,    // optional, default is false
        // },
        // ...
        Edit_Fankui:cc.Node,
        FankuiWin:cc.Node,
    },

    // use this for initialization
    onLoad: function () {

    },
    onBtnOkClick: function(){
        // this.Edit_Fankui.getComponent(cc.EditBox).string = "";
        // this.FankuiWin.active = false;
        // cc.vv.alert.show("提示", "提交成功,谢谢您的反馈!");
        // return;
        var self = this;
        var onGet = function (ret) {
            if (ret.errcode == 0) {
                this.Edit_Fankui.getComponent(cc.EditBox).string = "";
                this.FankuiWin.active = false;
                cc.vv.alert.show("提示", "提交成功,谢谢您的反馈!");
            }
            else if(ret.errcode == 1){
                cc.vv.alert.show("提示", "反馈失败!\n请检查网络"); 
            }else if(ret.errcode == 3){
                cc.vv.alert.show("提示", "UserID is invailad"); 
            }else if(ret.errcode == 5){
                cc.vv.alert.show("提示", "您输入的ID不存在!"); 
            }
        };

        var data = {
            account:cc.vv.userMgr.account,
            sign:cc.vv.userMgr.sign,
            userid:parseInt(cc.vv.userMgr.userId),
            fankui:this.Edit_Fankui.getComponent(cc.EditBox).string,
            
        }
        console.log(data);
        if(this.Edit_Fankui.getComponent(cc.EditBox).string){
            cc.vv.http.sendRequest("/fankui", data, onGet.bind(this));
        }
        else{
            cc.vv.alert.show("提示", "反馈内容不能为空!"); 

        }
    
        //console.log("ID = "+this.Eidt_ID.getComponent(cc.EditBox).string);

       

    },
    onBtnCloseClick: function(){
  
        this.Edit_Fankui.getComponent(cc.EditBox).string = "";
        this.FankuiWin.active = false;
    },

    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },
});
