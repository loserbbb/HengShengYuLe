var Net = require("Net")
var Global = require("Global")
cc.Class({
    extends: cc.Component,

    properties: {
        lblName: cc.Label,
        lblMoney: cc.Label,
        lblGems: cc.Label,
        lblID: cc.Label,
        lblNotice: cc.Label,
        joinGameWin: cc.Node,
        createRoomWin: cc.Node,
        settingsWin: cc.Node,
        myroomWin: cc.Node,
        payWin: cc.Node,
        helpWin: cc.Node,
        xiaoxiWin: cc.Node,
        zhuanzengWin: cc.Node,
        fankuiWin: cc.Node,
        heimingdanWin: cc.Node,
        btnJoinGame: cc.Node,
        btnReturnGame: cc.Node,
        sprHeadImg: cc.Sprite,
        roominfo: cc.Prefab,

        heimingdan: cc.Node,
       // club_Win:cc.Node,
        second: 0,
        // foo: {
        //    default: null,
        //    url: cc.Texture2D,  // optional, default is typeof default
        //    serializable: true, // optional, default is true
        //    visible: true,      // optional, default is true
        //    displayName: 'Foo', // optional
        //    readonly: false,    // optional, default is false
        // },
        // ...
    },

    initNetHandlers: function () {
        var self = this;
    },



    // use this for initialization
    onLoad: function () {
        if (!cc.sys.isNative && cc.sys.isMobile) {
            var cvs = this.node.getComponent(cc.Canvas);
            cvs.fitHeight = true;
            cvs.fitWidth = true;
        }
        if (!cc.vv) {
            cc.director.loadScene("loading");
            return;
        }
        this.initLabels();

        if (cc.vv.gameNetMgr.roomId == null) {
            this.btnJoinGame.active = true;
            this.btnReturnGame.active = false;
        }
        else {
            this.btnJoinGame.active = false;
            this.btnReturnGame.active = true;
        }

        //var params = cc.vv.args;
        var roomId = cc.vv.userMgr.oldRoomId
        if (roomId != null) {
            cc.vv.userMgr.oldRoomId = null;
            cc.vv.userMgr.enterRoom(roomId);
        }

        var imgLoader = this.sprHeadImg.node.getComponent("ImageLoader");
        imgLoader.setUserID(cc.vv.userMgr.userId);
        cc.vv.utils.addClickEvent(this.sprHeadImg.node, this.node, "Hall", "onBtnClicked");


        this.addComponent("UserInfoShow");

        this.initButtonHandler("Canvas/right_bottom/btn_shezhi");
        this.initButtonHandler("Canvas/right_bottom/btn_help");
        this.initButtonHandler("Canvas/right_bottom/btn_xiaoxi");
        this.initButtonHandler("Canvas/right_bottom/btn_myroom")
        this.helpWin.addComponent("OnBack");
        this.xiaoxiWin.addComponent("OnBack");
        this.myroomWin.addComponent("OnBack");
        this.myroomWin.getChildByName("players").addComponent("OnBack");
        this.payWin.addComponent("OnBack");

        if (!cc.vv.userMgr.notice) {
            cc.vv.userMgr.notice = {
                version: null,
                msg: "恒盛游戏,值得信赖",
            }
        }

        if (!cc.vv.userMgr.gemstip) {
            cc.vv.userMgr.gemstip = {
                version: null,
                msg: "恒盛游戏,值得信赖",
            }
        }

        this.lblNotice.string = cc.vv.userMgr.notice.msg;

        this.refreshInfo();
        this.refreshNotice();
        this.refreshGemsTip();

        cc.vv.audioMgr.playBGM("bgMain.mp3");

        cc.vv.utils.addEscEvent(this.node);

        



    },

    refreshInfo: function () {
        var self = this;
        var onGet = function (ret) {
            if (ret.errcode !== 0) {
                console.log(ret.errmsg);
            }
            else {
                if (ret.gems != null) {
                    this.lblGems.string = ret.gems;
                }
            }
        };

        var data = {
            account: cc.vv.userMgr.account,
            sign: cc.vv.userMgr.sign,
        };
        cc.vv.http.sendRequest("/get_user_status", data, onGet.bind(this));
    },

    refreshGemsTip: function () {
        var self = this;
        var onGet = function (ret) {
            if (ret.errcode !== 0) {
                console.log(ret.errmsg);
            }
            else {
                cc.vv.userMgr.gemstip.version = ret.version;
                cc.vv.userMgr.gemstip.msg = ret.msg.replace("<newline>", "\n");
            }
        };

        var data = {
            account: cc.vv.userMgr.account,
            sign: cc.vv.userMgr.sign,
            type: "fkgm",
            version: cc.vv.userMgr.gemstip.version
        };
        cc.vv.http.sendRequest("/get_message", data, onGet.bind(this));
    },

    refreshNotice: function () {
        var self = this;
        var onGet = function (ret) {
            if (ret.errcode !== 0) {
                console.log(ret.errmsg);
            }
            else {
                cc.vv.userMgr.notice.version = ret.version;
                cc.vv.userMgr.notice.msg = ret.msg;
                this.lblNotice.string = ret.msg;
            }
        };

        var data = {
            account: cc.vv.userMgr.account,
            sign: cc.vv.userMgr.sign,
            type: "notice",
            version: cc.vv.userMgr.notice.version
        };
        cc.vv.http.sendRequest("/get_message", data, onGet.bind(this));
    },
    addGemsByShare: function () {
        var onGet = function (ret) {
            if (ret.errcode !== 0) {
                console.log(ret.errmsg);
            }
            else {
                this.refreshInfo();
            }
        };

        var data = {
            userid: cc.vv.userMgr.userId,
            gems: 1,
        };
        cc.vv.http.sendRequest("/add_user_gems_days", data, onGet.bind(this));

    },
    onShare: function () {
        cc.vv.anysdkMgr.share("恒盛游戏", "恒盛游戏，包含了单金麻将、双金麻将、八叶麻将、推筒子等多种运城流行棋牌玩法。");
        this.addGemsByShare();
    },

    initButtonHandler: function (btnPath) {
        var btn = cc.find(btnPath);
        cc.vv.utils.addClickEvent(btn, this.node, "Hall", "onBtnClicked");
    },



    initLabels: function () {
        this.lblName.string = cc.vv.userMgr.userName;
        this.lblMoney.string = cc.vv.userMgr.coins;
        this.lblGems.string = cc.vv.userMgr.gems;
        this.lblID.string = "ID:" + cc.vv.userMgr.userId;
    },
    onBtnHeimingdanClicked: function () {
        this.heimingdanWin.active = true;
    },

    showPlayers: function (event) {
        var target = event.target;
        var players = this.myroomWin.getChildByName("players");
        players.active = true;
        players.getChildByName("player1").getComponent(cc.Label).string = target.roomId.toString();
    },

    onBtnClicked: function (event) {
        if (event.target.name == "btn_shezhi") {
            this.settingsWin.active = true;
        }
        else if (event.target.name == "btn_help") {
            this.helpWin.active = true;
        }
        else if (event.target.name == "btn_xiaoxi") {
            this.xiaoxiWin.active = true;           
        }
      

        else if (event.target.name == 'btn_myroom') {
            this.myroomWin.active = true;
            var data = {
                account: cc.vv.userMgr.account,
                sign: cc.vv.userMgr.sign,
                userId: cc.vv.userMgr.userId,
            };
            var self = this;
            cc.vv.http.sendRequest("/get_user_rooms_info", data, function (ret) {
                if (ret.errcode !== 0) {
                    console.log(ret.errmsg);
                }
                else {
                    data = ret.data;
                    var content = self.myroomWin.getChildByName("scrollview").getChildByName("view").getChildByName("content");
                    var len = data.length;
                    content.height = len * 100;
                    content.removeAllChildren();
                    for (var i = 0; i < len; i++) {
                        data[i].base_info = JSON.parse(data[i].base_info);
                        var item = cc.instantiate(self.roominfo);
                        var roomId = data[i].id;
                        var type;
                        var num = 0;
                        var state = "准备中";
                        if (data[i].user_id0) {
                            num++;
                        }
                        if (data[i].user_id1) {
                            num++;
                        }
                        if (data[i].user_id2) {
                            num++;
                        }
                        if (data[i].user_id3) {
                            num++;
                        }
                        if (num == 4) {
                            state = "游戏中";
                        }
                        if (data[i].base_info.type == 'sjmj') {
                            type = "双金麻将";
                        } else {
                            if (data[i].base_info.type == 'djmj') {
                                type = "单金麻将";
                            } else {
                                if (data[i].base_info.type == 'bymj') {
                                    type = "八叶麻将";
                                }else{
                                    if(data[i].base_info.type == 'kdd')
                                        type = "扣点点";
                                }
                            }
                        }
                        if (data[i].base_info.paytype == 0) {
                            type += "(" + data[i].base_info.maxGames + "局,房主支付)";

                        } else {
                            type += "(" + data[i].base_info.maxGames + "局,AA支付)";
                        }
                        item.getChildByName("roomId").getComponent(cc.Label).string = roomId;
                        item.getChildByName("roomType").getComponent(cc.Label).string = type;
                        item.getChildByName("roomSeats").getComponent(cc.Label).string = num.toString();
                        item.getChildByName("roomSeats").roomId = roomId;
                        item.getChildByName("gameState").getComponent(cc.Label).string = state;
                        item.getChildByName("roomSeats").on(cc.Node.EventType.TOUCH_END, function (event) {
                            var target = event.target;
                            var players = self.myroomWin.getChildByName("players");
                            players.active = true;
                            // players.getChildByName("player1").getComponent(cc.Label).string = target.roomId.toString();
                            players.getChildByName("player0").active = false;
                            players.getChildByName("player1").active = false;
                            players.getChildByName("player2").active = false;
                            players.getChildByName("player3").active = false;
                            players.getChildByName("btn_kick0").active = false;
                            players.getChildByName("btn_kick1").active = false;
                            players.getChildByName("btn_kick2").active = false;
                            players.getChildByName("btn_kick3").active = false;
                            var data = {
                                account: cc.vv.userMgr.account,
                                sign: cc.vv.userMgr.sign,
                                roomId: target.roomId,
                            };
                            cc.vv.http.sendRequest("/get_room_players", data, function (ret) {
                                if (ret.errcode !== 0) {
                                    console.log(ret.errmsg);
                                } else {
                                    var data = ret.data;
                                    for (var i = 0; i < data.length; i++) {
                                        var playerlabel = "player" + i;
                                        var kickbtn = "btn_kick" + i;
                                        players.getChildByName(playerlabel).getComponent(cc.Label).string = data[i].userName;
                                        players.getChildByName(kickbtn).userId = data[i].userId.toString();
                                        players.getChildByName(playerlabel).active = true;
                                        players.getChildByName(kickbtn).active = true;
                                    }
                                }
                            });
                        }.bind(this));
                        item.setPositionY(i * (-100));
                        item.parent = content;
                    }
                    console.log(content);
                }
            });
        }
        else if (event.target.name == "head") {
            cc.vv.userinfoShow.show(cc.vv.userMgr.userName, cc.vv.userMgr.userId, this.sprHeadImg, cc.vv.userMgr.sex, cc.vv.userMgr.ip);
        }
    },

    onJoinGameClicked: function () {
        
        if(cc.sys.os==cc.sys.ANDROID)
            cc.vv.anysdkMgr.getLocation();
    
     
        this.joinGameWin.active = true;
    },

    onReturnGameClicked: function () {
        cc.vv.wc.show('正在返回游戏房间');
        cc.director.loadScene("mjgame");
    },
    onBtnFankuiClicked: function () {

        this.fankuiWin.active = true;
    },
    onBtnZhuanzengClicked: function () {
        this.zhuanzengWin.active = true;
    },

    onBtnAddGemsClicked: function () {
        this.payWin.active = true;
        this.refreshInfo();
    },

    onCreateRoomClicked: function () {
        if (cc.vv.gameNetMgr.roomId != null) {
            cc.vv.alert.show("提示", "房间已经创建!\n必须解散当前房间才能创建新的房间");
            return;
        }
        console.log("onCreateRoomClicked");
    // if(cc.sys.os==cc.sys.ANDROID)
            cc.vv.anysdkMgr.getLocation();
 
        this.createRoomWin.active = true;
    },
    // onBtnClubCLickeed:function(){
    //     this.club_Win.active=true;
    //     //cc.vv.alert.show("提示","俱乐部功能暂未开通!")
    //    },
    onPay5click: function () {
        this.onPayClick(5);

    },
    onPay10click: function () {
        this.onPayClick(10);

    },
    onPay50click: function () {

        this.onPayClick(50);
    },
    onPay100click: function () {
        this.onPayClick(100);

    },
    onPayClick: function (money) {

        //http://123.56.30.112/hengsheng/pay/demo/scanPayDemo.php?id=100358&money=1
        cc.sys.openURL('http://123.56.30.112/hengsheng/pay/demo/scanPayDemo.php?id=' + cc.vv.userMgr.userId + '&money=' + money);
        console.log('http://123.56.30.112/hengsheng/pay/pay.php?id=' + cc.vv.userMgr.userId + '&money=' + money);
    },


    // called every frame, uncomment this function to activate update callback
    update: function (dt) {


        
        // this.second++;
        // if (this.second%500 >= 500){
        //     console.log("===================second is"+this.second);
        // }
        
        // if (this.second >= 500) {
        //     if (cc.vv.userMgr.latitude == 0) {

        //         this.second = 0;
        //         cc.vv.anysdkMgr.getLocation();
        //         console.log("!!!!!!!!!request!!!!!!!!!")

        //     }
            
        // }


        var x = this.lblNotice.node.x;
        x -= dt * 100;
        if (x + this.lblNotice.node.width < -1000) {
            x = 500;
        }
        this.lblNotice.node.x = x;

        if (cc.vv && cc.vv.userMgr.roomData != null) {
            cc.vv.userMgr.enterRoom(cc.vv.userMgr.roomData);
            cc.vv.userMgr.roomData = null;
        }
    },
});
