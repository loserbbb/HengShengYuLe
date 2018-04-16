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
        Eidt_ID:cc.Node,
        Eidt_Count:cc.Node,
        zhuanzengWin:cc.Node,
        lblGems:cc.Node,
    
    },

    // use this for initialization
    onLoad: function () {

    },
    
    refreshInfo: function () {
        var self = this;
        var onGet = function (ret) {
            if (ret.errcode !== 0) {
                console.log(ret.errmsg);
            }
            else {
                if (ret.gems != null) {
                    self.lblGems.getComponent(cc.Label).string = ret.gems;
                    console.log(self.lblGems.getComponent(cc.Label).string);
                }
            }
        };

        var data = {
            account: cc.vv.userMgr.account,
            sign: cc.vv.userMgr.sign,
        };
        cc.vv.http.sendRequest("/get_user_status", data, onGet.bind(this));
    },
    onBtnOkClick: function(){
        var self = this;
        console.log("数量:"+this.Eidt_Count.getComponent(cc.EditBox).string);
        console.log("ID:"+this.Eidt_ID.getComponent(cc.EditBox).string);
        if(!this.Eidt_ID.getComponent(cc.EditBox).string)
        {
            cc.vv.alert.show("提示","请输入您要转增玩家的ID!")
            return;
        }
        if(!this.Eidt_Count.getComponent(cc.EditBox).string)
        {
            cc.vv.alert.show("提示","请输入您要转增的房卡数!")
            return;
        }
     
        var onGet = function (ret) {
            if (ret.errcode == 0) {
                this.zhuanzengWin.active = false;
                this.Eidt_ID.getComponent(cc.EditBox).string = "";
                this.Eidt_Count.getComponent(cc.EditBox).string = "";
                cc.vv.alert.show("提示", "赠送成功");
                this.refreshInfo();
                 

            }
            else if(ret.errcode == 1){
                cc.vv.alert.show("提示", "您的房卡不足!"); 
            }else if(ret.errcode == 3){
                cc.vv.alert.show("提示", "UserID is invailad"); 
            }else if(ret.errcode == 5){
                cc.vv.alert.show("提示", "您输入的ID不存在!"); 
            }
        };

        var data = {
            account:cc.vv.userMgr.account,
            sign:cc.vv.userMgr.sign,
            userid:cc.vv.userMgr.userId,
            gems:parseInt(this.Eidt_Count.getComponent(cc.EditBox).string),
            receiver:parseInt(this.Eidt_ID.getComponent(cc.EditBox).string),
        }
        console.log(data);
        cc.vv.http.sendRequest("/give_away_gems", data, onGet.bind(this));
        //console.log("ID = "+this.Eidt_ID.getComponent(cc.EditBox).string);

       

    },
    onBtnCloseClick: function(){
  
        this.Eidt_ID.getComponent(cc.EditBox).string = "";
        this.Eidt_Count.getComponent(cc.EditBox).string = "";
        this.zhuanzengWin.active = false;
    },

    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },
});
