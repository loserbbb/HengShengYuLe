cc.Class({
    extends: cc.Component,

    properties: {
        // foo: {
        //    default: null,
        //    url: cc.Texture2D,  // optional, default is typeof default
        //    serializable: true, // optional, default is true
        //    visible: true,      // optional, default is true
        //    displayName: 'Foo', // optional
        //    readonly: false,    // optional, default is false
        // },
        // ...
        _gameresult:null,
        _seats:[],
    },

    // use this for initialization
    onLoad: function () {
        if(cc.vv == null){
            return;
        }
        
        this._gameresult = this.node.getChildByName("game_result");
        //this._gameresult.active = false;
        
        var seats = this._gameresult.getChildByName("seats");
        for(var i = 0; i < seats.children.length; ++i){
            this._seats.push(seats.children[i].getComponent("Seat"));   
        }
        
        var btnClose = cc.find("Canvas/game_result/btnClose");
        if(btnClose){
            cc.vv.utils.addClickEvent(btnClose,this.node,"GameResult","onBtnCloseClicked");
        }
        
        var btnShare = cc.find("Canvas/game_result/btnShare");
        if(btnShare){
            cc.vv.utils.addClickEvent(btnShare,this.node,"GameResult","onBtnShareClicked");
        }
        
        //初始化网络事件监听器
        var self = this;
        this.node.on('game_end',function(data){self.onGameEnd(data.detail);});
    },
    
    showResult:function(seat,info){
        //seat.node.getChildByName("zuijiapaoshou").active = isZuiJiaPaoShou;
        
        //seat.node.getChildByName("zimocishu").getComponent(cc.Label).string = info.numzimo;
       // seat.node.getChildByName("jiepaocishu").getComponent(cc.Label).string = info.numjiepao;
       // seat.node.getChildByName("dianpaocishu").getComponent(cc.Label).string = info.numdianpao;
    //    if(cc.vv.gameNetMgr.type == "sjmj" || cc.vv.gameNetMgr.type == "djmj"){
    //         seat.node.getChildByName("angangcishu").getComponent(cc.Label).string = info.numangang;
    //         seat.node.getChildByName("minggangcishu").getComponent(cc.Label).string = info.numminggang;
    //    }
        
       // seat.node.getChildByName("chajiaocishu").getComponent(cc.Label).string = info.numchadajiao;
    },
    
    onGameEnd:function(endinfo){
        var seats = cc.vv.gameNetMgr.seats;
        var maxscore = -1;
       // var maxdianpao = 0;
        // var dianpaogaoshou = -1;
        for(var i = 0; i < seats.length; ++i){
            var seat = seats[i];
            if(seat.score > maxscore){
                maxscore = seat.score;
            }
            // if(endinfo[i].numdianpao > maxdianpao){
            //     maxdianpao = endinfo[i].numdianpao;
            //     dianpaogaoshou = i;
            // }
        }
        
        for(var i = 0; i < seats.length; ++i){
            var seat = seats[i];
            var isBigwin = false;
            if(seat.score > 0){
                isBigwin = seat.score == maxscore;
            }
            this._seats[i].setInfo(seat.name,seat.score, isBigwin);
            this._seats[i].setID(seat.userid);
            //var isZuiJiaPaoShou = dianpaogaoshou == i;
            this.showResult(this._seats[i],endinfo[i]);
        }
    },
    
    onBtnCloseClicked:function(){
        cc.vv.wc.show('正在返回游戏大厅');
        cc.vv.gameNetMgr.jin = [];
        cc.director.loadScene("hall");
    },
    
    onBtnShareClicked:function(){
        var title = "<双金麻将>";
        if(cc.vv.gameNetMgr.conf.type == "djmj"){
            var title = "<单金麻将>";
        }
        if(cc.vv.gameNetMgr.conf.type == "bymj"){
            var title = "<八叶麻将>";
        }
        if(cc.vv.gameNetMgr.conf.type == "kdd"){
            var title = "<扣点点>";
        }
        cc.vv.anysdkMgr.share("恒盛娱乐" + title,"房号:" + cc.vv.gameNetMgr.roomId + " 玩法:" + cc.vv.gameNetMgr.getWanfa());
    }
});
