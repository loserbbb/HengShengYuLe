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
    },

    // use this for initialization
    onLoad: function () {
        if(!cc.vv){
            return;
        }
        
        var gameChild = this.node.getChildByName("game");
        var myself = gameChild.getChildByName("myself");
        var pengangroot = myself.getChildByName("penggangs");
        var realwidth = cc.director.getVisibleSize().width;
        var scale = realwidth / 1280;
        pengangroot.scaleX *= scale;
        pengangroot.scaleY *= scale;
        
        var self = this;
        this.node.on('peng_notify',function(data){
            //刷新所有的牌
            console.log("jdsalhaslhsaldjsakljdskl"+data.detail.pengedindex);
            var data = data.detail;
            self.onPengGangChanged(data);
        });
        
        this.node.on('gang_notify',function(data){
            //刷新所有的牌
            //console.log(data.detail);
            var data = data.detail;
            self.onPengGangChanged(data.seatData);

        });
        
        this.node.on('game_begin',function(data){
            self.onGameBein();
        });
        
        var seats = cc.vv.gameNetMgr.seats;
        for(var i in seats){
            this.onPengGangChanged(seats[i]);
        }
    },
    
    onGameBein:function(){
        this.hideSide("myself");
        this.hideSide("right");
        this.hideSide("up");
        this.hideSide("left");
    },
    
    hideSide:function(side){
        var gameChild = this.node.getChildByName("game");
        var myself = gameChild.getChildByName(side);
        var pengangroot = myself.getChildByName("penggangs");
        if(pengangroot){
            for(var i = 0; i < pengangroot.childrenCount; ++i){
                pengangroot.children[i].active = false;
            }            
        }
    },
    
    onPengGangChanged:function(seatData){
        
        if(seatData.wangangs == null &&seatData.angangs == null && seatData.diangangs == null  && seatData.pengs == null){
            return;
        }
       
        var localIndex = cc.vv.gameNetMgr.getLocalIndex(seatData.seatindex);
        var side = cc.vv.mahjongmgr.getSide(localIndex);
        var pre = cc.vv.mahjongmgr.getFoldPre(localIndex);
       
        console.log("onPengGangChanged" + localIndex);
            
        var gameChild = this.node.getChildByName("game");
        var myself = gameChild.getChildByName(side);
        var pengangroot = myself.getChildByName("penggangs");
        
        for(var i = 0; i < pengangroot.childrenCount; ++i){
            pengangroot.children[i].active = false;
        }
        //初始化杠牌
        var index = 0;
        
        var gangs = seatData.angangs
        var angangedindexs = seatData.angangedindex;
        for(var i = 0; i < gangs.length; ++i){
            var mjid = gangs[i];
           // this.initPengAndGangs(pengangroot,side,pre,index,mjid,"angang");
           var pengedindex = angangedindexs[i];
            var localpengedindex = cc.vv.gameNetMgr.getLocalIndex(pengedindex);
           this.initPengAndGangs(pengangroot,side,pre,index,localpengedindex,mjid,"angang");
            index++;    
        } 
        var gangs = seatData.diangangs
        var diangangedindexs = seatData.diangangedindex;
        for(var i = 0; i < gangs.length; ++i){
            var mjid = gangs[i];
            var pengedindex = diangangedindexs[i];
            var localpengedindex = cc.vv.gameNetMgr.getLocalIndex(pengedindex);
            this.initPengAndGangs(pengangroot,side,pre,index,localpengedindex,mjid,"diangang");
            index++;    
        }
        
        var gangs = seatData.wangangs;
        var diangangedindexs = seatData.wangangedindex;
        for(var i = 0; i < gangs.length; ++i){
            var mjid = gangs[i];
            var pengedindex = diangangedindexs[i];
            var localpengedindex = cc.vv.gameNetMgr.getLocalIndex(pengedindex);
            this.initPengAndGangs(pengangroot,side,pre,index,localpengedindex,mjid,"wangang");
            index++;    
        }
        
        //初始化碰牌
        var pengs = seatData.pengs;
        var pengedindexs = seatData.pengedindex;
        //var localpengedindex = seatData.localpengedindex;
        if(pengs){
            for(var i = 0; i < pengs.length; ++i){
                var mjid = pengs[i];
                var pengedindex = pengedindexs[i];
                var localpengedindex = cc.vv.gameNetMgr.getLocalIndex(pengedindex);
                this.initPengAndGangs(pengangroot,side,pre,index,localpengedindex,mjid,"peng");
                index++;    
            }    
        }        
    },
    
    initPengAndGangs:function(pengangroot,side,pre,index,localpengedindex,mjid,flag){
        console.log("pengangroot:"+pengangroot);
        console.log("side:"+side);
        console.log("pre:"+pre);
        console.log("index:"+index);
        console.log("mjid:"+mjid);
        console.log("flag:"+flag);
        console.log("localpengedindex"+localpengedindex);
        var pgroot = null;
        if(pengangroot.childrenCount <= index){
            if(side == "left" || side == "right"){
                pgroot = cc.instantiate(cc.vv.mahjongmgr.pengPrefabLeft);
            }
            else{
                pgroot = cc.instantiate(cc.vv.mahjongmgr.pengPrefabSelf);
            }
            
            pengangroot.addChild(pgroot);    
        }
        else{
            pgroot = pengangroot.children[index];
            pgroot.active = true;
        }
        
        if(side == "left"){
            pgroot.y = -(index * 25 * 3);   
                             
        }
        else if(side == "right"){
            pgroot.y = (index * 25 * 3);
            pgroot.setLocalZOrder(-index);

        }
        else if(side == "myself"){
            pgroot.x = index * 55 * 3 + index * 10;                    
        }
        else{
            pgroot.x = -(index * 55*3);
        }
        console.log(side);

        var sprites = pgroot.getComponentsInChildren(cc.Sprite);
        console.log(localpengedindex);
       
        for(var s = 0; s < sprites.length; ++s){
            var sprite = sprites[s];
            if(sprite.node.name=="jiantou"){
                if(localpengedindex==0||localpengedindex==1){
                    sprite.node.rotation = -localpengedindex*90;
                }
                else{
                    sprite.node.rotation = -localpengedindex*90+360;
                }
             
               
                return;
            }
            if(sprite.node.name == "gang"){
                var isGang = flag != "peng";
                sprite.node.active = isGang;
                sprite.node.scaleX = 1.0;
                sprite.node.scaleY = 1.0;
                if(flag == "angang"){
                    sprite.spriteFrame = cc.vv.mahjongmgr.getEmptySpriteFrame(side);
                    if(side == "myself" || side == "up"){
                        sprite.node.scaleX = 1.4;
                        sprite.node.scaleY = 1.4;                        
                    }
                }   
                else{
                    sprite.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID(pre,mjid);    
                }
            }
            else{ 
                sprite.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID(pre,mjid);
            }
        }
    },

    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },
});
