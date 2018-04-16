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
        _leixingxuanze: null,
        _gamelist: null,
        _currentGame: null,
        clubid:cc.Label,
        // _difens: [0.5,1,2,3,4,5,10,20,30,40],
        // _jinfen: [1,2,3,4,5,10,20],
    },

    // use this for initialization
    onLoad: function () {
       
        this._gamelist = this.node.getChildByName('game_list');

        this._leixingxuanze = [];
        var t = this.node.getChildByName("leixingxuanze");
        for (var i = 0; i < t.childrenCount; ++i) {
            var n = t.children[i].getComponent("RadioButton");
            if (n != null) {
                this._leixingxuanze.push(n);
            }
        }
    },

    onBtnBack: function () {
        this.node.active = false;
       
    },

    onBtnAddFen: function(event){
        var fens = null;
        if(event.target.name == "btn_add_difen"){
            fens = [0.5,1,2,3,4,5,10,20,30,40];
        }else{
            if(event.target.name == "btn_add_jinfen"){
                fens = [1,2,3,4,5,10,20];
            }
        }
        var len = fens.length;
        var fen = event.target.parent.getChildByName("fen");
        if(fen.index == null){
            fen.index = 0;
        }
        if(fen.index < len - 1){
            fen.index ++;
        }
        var t = fens[fen.index];
        fen.getComponent(cc.Label).string = t.toString();

    },

    onBtnDeFen: function(event){
        var fens = null;
        if(event.target.name == "btn_de_difen"){
            fens = [0.5,1,2,3,4,5,10,20,30,40];
        }else{
            if(event.target.name == "btn_de_jinfen"){
                fens = [1,2,3,4,5,10,20];
            }
        }
        var len = fens.length;
        var fen = event.target.parent.getChildByName("fen");
        if(fen.index == null){
            fen.index = 0;
        }
        if(fen.index > 0){
            fen.index --;
        }
        var t = fens[fen.index];
        fen.getComponent(cc.Label).string = t.toString();

    },

    onBtnOK: function () {
        var usedTypes = ['sjmj','djmj','bymj','kdd'];
        var type = this.getType();
        if (usedTypes.indexOf(type) == -1) {
            return;
        }
       this.node.active = false;
        this.createRoom();
    },

    getType: function () {
        var type = 0;
        for (var i = 0; i < this._leixingxuanze.length; ++i) {
            if (this._leixingxuanze[i].checked) {
                type = i;
                break;
            }
        }
        if (type == 0) {
            return 'sjmj';
        }else{
            if(type == 1){
                return 'djmj';
            }else{
                if(type == 2){
                    return 'bymj';
                }else {
                    if(type== 3)
                    return 'kdd';
                }
            }
        }
       
        return 'sjmj';
    },

    getSelectedOfRadioGroup(groupRoot) {
        console.log(groupRoot);
        var t = this._currentGame.getChildByName(groupRoot);

        var arr = [];
        for (var i = 0; i < t.children.length; ++i) {
            var n = t.children[i].getComponent("RadioButton");
            if (n != null) {
                arr.push(n);
            }
        }
        var selected = 0;
        for (var i = 0; i < arr.length; ++i) {
            if (arr[i].checked) {
                selected = i;
                break;
            }
        }
        return selected;
    },

    createRoom: function () {
        if(this.clubid.string.equals("")){
            var self = this;
        console.log(self.clubid.string);
        var onCreate = function (ret) {
            if (ret.errcode !== 0) {
                cc.vv.wc.hide();
                //console.log(ret.errmsg);
                if (ret.errcode == 2222) {
                    cc.vv.alert.show("提示", "钻石不足，创建房间失败!");
                }
                else {
                    if(ret.errcode == 4){
                        cc.vv.alert.show("提示", "您的房间达到上限!");
                    }else{
                        cc.vv.alert.show("提示", "创建房间失败,错误码:" + ret.errcode);
                    }
                }
            }
            else {
                cc.vv.gameNetMgr.connectGameServer(ret);
            }
        };

        var type = this.getType();
        var conf = null;
        if(type == 'sjmj'){
            conf = this.constructSJMJConf();
        }else{
            if(type == 'djmj'){
                conf = this.constructSJMJConf();
            }else{
                if(type == 'bymj'){
                    conf = this.constructBYMJConf();
                }else{
                    if(type == 'kdd'){
                        conf = this.constructKDDConf();
                    }
                }
            }
        }
        conf.type = type;

        var data = {
            account: cc.vv.userMgr.account,
            sign: cc.vv.userMgr.sign,
            //clubId:self.clubid.string,
            conf: JSON.stringify(conf)
            
        };
        console.log(data);
        cc.vv.wc.show("正在创建房间");
        cc.vv.http.sendRequest("/create_private_room", data, onCreate);
        }
        else{
            cc.vv.alert.show("提示","俱乐部创房规则定制成功");
        }
        
    },
    constructKDDConf: function(){
        var xuanzejushu = this.getSelectedOfRadioGroup('xuanzejushu');
        var paytype = this.getSelectedOfRadioGroup('paytype');
        var fenghaozi = this.getSelectedOfRadioGroup('wanfa');
        var difen = this._currentGame.getChildByName("difen").getChildByName("fen").getComponent(cc.Label).string;
        difen = parseFloat(difen);
        var cheat = this.getSelectedOfRadioGroup('cheat');
        var conf = {
            xuanzejushu: xuanzejushu,
            paytype: paytype,
            difen: difen,
            cheat:cheat,
            fenghaozi:fenghaozi,
            clubId:this.clubid.string,
        }
        return conf;
    },
    constructBYMJConf: function(){
        var wanfaxuanze = this.getSelectedOfRadioGroup('wanfaxuanze');
        var xuanzejushu = this.getSelectedOfRadioGroup('xuanzejushu');
        var paytype = this.getSelectedOfRadioGroup('paytype');
        var difen = this._currentGame.getChildByName("difen").getChildByName("fen").getComponent(cc.Label).string;
        var cheat = this.getSelectedOfRadioGroup('cheat');
        var daifeng = this.getSelectedOfRadioGroup('daifeng');
        
        var conf = {
            wanfaxuanze: wanfaxuanze,
            xuanzejushu: xuanzejushu,
            paytype: paytype,
            difen: difen,
            cheat:cheat,
            daifeng:daifeng,
            clubId:this.clubid.string,
        }
        return conf;
    },

    constructSJMJConf: function(){
        ///
        var wanfaxuanze = this.getSelectedOfRadioGroup('wanfaxuanze');
        var jinfengding = this.getSelectedOfRadioGroup('jinfengding');
        var xuanzejushu = this.getSelectedOfRadioGroup('xuanzejushu');
        var paytype = this.getSelectedOfRadioGroup('paytype');
        var iplimit = this.getSelectedOfRadioGroup('iplimit');
        var difen = this._currentGame.getChildByName("difen").getChildByName("fen").getComponent(cc.Label).string;
        var jinfen = this._currentGame.getChildByName("jinfen").getChildByName("fen").getComponent(cc.Label).string;
        var cheat = this.getSelectedOfRadioGroup('cheat');
        console.log(cheat);
        difen = parseFloat(difen);
        jinfen = parseInt(jinfen);
        var conf = {
            wanfaxuanze:wanfaxuanze,
            jinfengding:jinfengding,
            xuanzejushu:xuanzejushu,
            paytype:paytype,
            iplimit:iplimit,
            difen:difen,
            jinfen:jinfen,
            cheat:cheat,
            clubId:this.clubid.string,
        };
        
        return conf;
    },

    constructSCMJConf: function () {

        var wanfaxuanze = this._currentGame.getChildByName('wanfaxuanze');
        var huansanzhang = wanfaxuanze.children[0].getComponent('CheckBox').checked;
        var jiangdui = wanfaxuanze.children[1].getComponent('CheckBox').checked;
        var menqing = wanfaxuanze.children[2].getComponent('CheckBox').checked;
        var tiandihu = wanfaxuanze.children[3].getComponent('CheckBox').checked;

        var cheat = this.getSelectedOfRadioGroup('cheat');
        var difen = this.getSelectedOfRadioGroup('difenxuanze');
        var zimo = this.getSelectedOfRadioGroup('zimojiacheng');
        var zuidafanshu = this.getSelectedOfRadioGroup('zuidafanshu');
        var jushuxuanze = this.getSelectedOfRadioGroup('xuanzejushu');
        var dianganghua = this.getSelectedOfRadioGroup('dianganghua');
        
        var conf = {
            difen:difen,
            zimo:zimo,
            jiangdui:jiangdui,
            huansanzhang:huansanzhang,
            zuidafanshu:zuidafanshu,
            jushuxuanze:jushuxuanze,
            dianganghua:dianganghua,
            menqing:menqing,
            tiandihu:tiandihu,  
            clubId:this.clubid.string, 
        };
        return conf;
    },


    // called every frame, uncomment this function to activate update callback
    update: function (dt) {                               //切换游戏创建页

        var type = this.getType();                         //返回值 游戏简写 字符串
        if (this.lastType != type) {
            this.lastType = type;
            for (var i = 0; i < this._gamelist.childrenCount; ++i) {
                this._gamelist.children[i].active = false;
            }

            var game = this._gamelist.getChildByName(type);
            if (game) {
                game.active = true;
            }
            this._currentGame = game;
        }
    },
});