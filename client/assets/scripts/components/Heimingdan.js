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
        heimingdanWin:cc.Node,
        listWin:cc.Node,
        edit_ID:cc.Node,
        playerInfo:cc.Prefab,
    },

    // use this for initialization
    onLoad: function () {

    },
    OncloseClicked:function(){
        this.edit_ID.getComponent(cc.EditBox).string = "";
        this.heimingdanWin.active = false;
    },
    OnListWinCLoseClicked:function(){
        this.listWin.active = false;
    },
    onBtnChakanClicked:function(){
        var self = this;
        var onGet = function(ret){
            console.log(ret);
            if(ret.errcode==0){
                this.listWin.active = true;
                var content = self.listWin.getChildByName("scrollView").getChildByName("view").getChildByName("content");
                var blacklist = ret.blacklist;
                console.log("blacklist:"+blacklist);
                var len = blacklist.length;
                content.height = len * 100;
                content.removeAllChildren();
                for(var i = 0;i<len;i++){
                   // content.getChildByName("ID");
                    var item = cc.instantiate(self.playerInfo);
                    var ID = blacklist[i];
                    item.getChildByName("la_ID").getComponent(cc.Label).string = ID;
                    item.getChildByName("btn_getout").getout = ID;
                    item.getChildByName("btn_getout").on(cc.Node.EventType.TOUCH_END,function(event){

                        var target = event.target;

                       
                        var data={
                            sign : cc.vv.userMgr.sign,
                            account:cc.vv.userMgr.account,
                            userid:parseInt(cc.vv.userMgr.userId),
                            //black_userid:parseInt(ID),
                            black_userid:parseInt(target.getout),
                        }
                        console.log(data);
                        
                        console.log("the number is "+target.getout);
                       // console.log();
                       event.target.userid = 123;
                       console.log(event.target);
                        cc.vv.http.sendRequest("/del_from_blacklist",data,function(ret){
                            if(ret.errcode==0){
                                cc.vv.alert.show("提示","移出黑名单成功!");
                                var data = {
                                    sign : cc.vv.userMgr.sign,
                                    account:cc.vv.userMgr.account,
                                    userid:parseInt(cc.vv.userMgr.userId),
                                }
                               
                                cc.vv.http.sendRequest("/get_blacklist",data,onGet.bind(this));
                            }else{
                                cc.vv.alert.show("提示","移除失败!");
                            }
                        }.bind(this));

                    }.bind(this));
                    item.setPositionY(i*(-60)-30);
                    item.parent = content;
                }
            }else{
                cc.vv.alert.show("提示","数据请求失败!\n请检查网络!");
            }

        }
        var data = {
            sign : cc.vv.userMgr.sign,
            account:cc.vv.userMgr.account,
            userid:parseInt(cc.vv.userMgr.userId),
        }
       
        cc.vv.http.sendRequest("/get_blacklist",data,onGet.bind(this));

    },
    OnBtntianjiaClicked:function(){
        var self = this;
        var id = this.edit_ID.getComponent(cc.EditBox).string;
        var onGet = function(ret){

            if(ret.errcode==0){
                cc.vv.alert.show("提示","添加成功");
                this.edit_ID.getComponent(cc.EditBox).string = "";
                return;
            }
            if(ret.errcode==1){
                cc.vv.alert.show("提示","请检查网络");
            }
            if(ret.errcode==2){
                cc.vv.alert.show("提示","用户ID不存在!");
                return;
            }
        }
        var data = {
            sign : cc.vv.userMgr.sign,
            account:cc.vv.userMgr.account,
            userid:parseInt(cc.vv.userMgr.userId),
            black_userid:parseInt(id),
        }
        if(id.length==6){
            cc.vv.http.sendRequest("/add_to_blacklist",data,onGet.bind(this));
        }else{
            cc.vv.alert.show("提示","请正确输入用户ID\n(6位数字)");
        }

    },


    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },
});
