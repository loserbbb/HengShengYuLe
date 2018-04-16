
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
        club_Win:cc.Node,
        club_Createclub:cc.Node,
        cjeditbox:cc.EditBox,
        jreditbox:cc.EditBox,
        club_Jiaruclub:cc.Node,
        clubroom_Win:cc.Node,
        clubinfo:cc.Prefab,
        clubroominfo:cc.Prefab,
        cluberinfo:cc.Prefab,
        shenqinglistinfo:cc.Prefab,
        label5:cc.Label,
        label7:cc.Label,
        label9:cc.Label,
        label10:cc.Label,
        label11:cc.Label,
        label12:cc.Label,
        label13:cc.Label,
        cjclubroombtn:cc.Node,
        club_creatroom:cc.Node,
        glclub_Win:cc.Node,
        tiren_Win:cc.Node,
        shenqinglist_Win:cc.Node,
        
  

  
    },

    // use this for initialization
    onLoad: function () {
        
    },
    onBtnCloseCliked:function(){
        
        this.club_Win.active=false;  

        this.club_Createclub.active=false;
        this.cjeditbox.string='';  
        //隐藏加入俱乐部框
        this.club_Jiaruclub.active=false;
        //将editbox内容清空
        this.jreditbox.string=''; 
    },
    //创建俱乐部
    onBtnChuangjianCliked:function(){
        this.club_Createclub.active=true;    
    },
    //创建俱乐部中的确定和取消按钮
    
    
    onBtnokCliked:function(){    
        console.log(this.cjeditbox.getComponent(cc.EditBox).string);
        if(this.cjeditbox.getComponent(cc.EditBox).string==""){
            cc.vv.alert.show("提示","请输入俱乐部名称！");
            return;
        }

      
        var onGet = function(ret){  
                 
            if (ret.errcode !== 0) {
                console.log(ret.errmsg);
                
            }
            else {
            //创建俱乐部中的确定按钮
            //以及将editbox内容清空
            this.club_Createclub.active=false;
            this.cjeditbox.string='';
            cc.vv.alert.show("提示","创建成功！");
            this.onBtnClubCLickeed();              

            }
        };

       //给服务器发送请求
       //userid  创建俱乐部clubName
         var data = {
        account: cc.vv.userMgr.account,
        sign: cc.vv.userMgr.sign,
        userId:cc.vv.userMgr.userId,
        clubName:this.cjeditbox.string,
       };
       console.log(data);
     cc.vv.http.sendRequest("/create_club", data,onGet.bind(this));

    },
    //创建俱乐部中的取消按钮
    //以及将editbox内容清空
    onBtncancleCliked:function(){
        this.club_Createclub.active=false;
        this.cjeditbox.string='';
    },
    //加入俱乐部
    obBtnJiaruCliked:function(){
        this.club_Jiaruclub.active=true;
    },

    //加入俱乐部中的确定按钮 
    onBtnJrokCliked:function(){
        if(this.jreditbox.getComponent(cc.EditBox).string==""){
            cc.vv.alert.show("提示","请输入俱乐部名称！");
            return;
        }
        var onGet=function(ret){
         
            if(ret.errcode!==0){
                console.log(ret.errmsg);
                if(ret.errcode==3){
                    cc.vv.alert.show("提示","您要加入的俱乐部不存在");
                    this.jreditbox.string='';
                }
                if(ret.errcode==2){
                    cc.vv.alert.show("提示","您已加入该俱乐部");
                    this.jreditbox.string='';
                }
                if(ret.errcode==4){
                    cc.vv.alert.show("提示","您已发送请求，请勿再次发送");
                    this.jreditbox.string='';
                }
            }
            else{
                //隐藏加入俱乐部框
                this.club_Jiaruclub.active=false;
                //将editbox内容清空
                this.jreditbox.string='';
                cc.vv.alert.show("提示","申请发送成功");
                this.onBtnClubCLickeed();

            }
        };
        //给服务器发送请求
        //谁要加入什么俱乐部，，，userid以及clubid
        var data={
            account:cc.vv.userMgr.account,
            sign:cc.vv.userMgr.sign,
            userId:cc.vv.userMgr.userId,
            clubId:this.jreditbox.string,
        };
        console.log(data);
        cc.vv.http.sendRequest("/create_requestlist",data,onGet.bind(this));
    },
    //加入俱乐部中的确定按钮
    //将editbox内容清空
    onBtnJrcancleCliked:function(){
        this.club_Jiaruclub.active=false;
        this.jreditbox.string='';
    },

        // qingchu:function(){
        //     this.editbox.string='';
        // },
    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },
    
    onBtnClubCLickeed:function(){

        this.club_Win.active=true;
        //cc.vv.anysdkMgr.getLocation();
        //cc.vv.alert.show("提示","俱乐部功能暂未开通!")
        var data = {
            account: cc.vv.userMgr.account,
            sign: cc.vv.userMgr.sign,
            userId: cc.vv.userMgr.userId,
        };
        var self = this;
        console.log(data);
        cc.vv.http.sendRequest("/get_user_club_info", data, function (ret) {
            if (ret.errcode !== 0) {
                console.log(ret.errmsg);       
                if(ret.errcode==2){
                    var content = self.club_Win.getChildByName("scrollview").getChildByName("view").getChildByName("content");
                    content.removeAllChildren();
                }        
            }
         
            else {
                
                data = ret.data;
                console.log(data);
                var content = self.club_Win.getChildByName("scrollview").getChildByName("view").getChildByName("content");
                var len = data.length;
                content.height = len * 100;
                content.removeAllChildren();
                for (var i = 0; i < len; i++) {
                    //data[i].base_info = JSON.parse(data[i].base_info);
                    var item = cc.instantiate(self.clubinfo);
                    var clubId = data[i].club_id;
                    var clubName=data[i].club_name;
                    var clubNum =data[i].counter;
                    var club_creatorname=data[i].name;
                    var club_creatorid=data[i].club_creator;
                    console.log(clubId);
              
                item.getChildByName("clubId").getComponent(cc.Label).string = clubId;
                item.getChildByName("clubName").getComponent(cc.Label).string = clubName;
                item.getChildByName("clubNum").getComponent(cc.Label).string=clubNum;
                item.getChildByName("clubCreatorname").getComponent(cc.Label).string=club_creatorname;
                item.setPositionY(i * (-100));
                item.parent = content;
                item.club_creatorid=club_creatorid;
                item.clubid = clubId;
                item.name = club_creatorname;
                item.clubnum = clubNum;
                item.clubname=clubName

                //self.cjclubroombtn.clubid=clubId;
              //  console.log(self.cjclubroombtn.clubid );
                item.on(cc.Node.EventType.TOUCH_END,function(event){
                    self.clubroom_Win.active=true;         
                    self.label5.string=this.clubname;  
                    self.label7.string=this.name;
                    self.label9.string=this.clubnum;
                    self.label10.string=this.clubid;
                    self.label12.string=this.clubid;
                    self.label11.string=this.club_creatorid;
                    console.log(this.club_creatorid);
                    if(cc.vv.userMgr.userId==this.club_creatorid){                      
                    self.club_Win.getChildByName("clubRoomWin").getChildByName("glclubbtn").active=true;
                    //self.club_Win.getChildByName("clubRoomWin").getChildByName("quitclubbtn").active=false;
                    self.club_Win.getChildByName("clubRoomWin").getChildByName("Label8").active=false;
                    self.club_Win.getChildByName("clubRoomWin").getChildByName("Label9").active=false;  
                    self.club_Win.getChildByName("clubRoomWin").getChildByName("Label6").active=true;
                    self.club_Win.getChildByName("clubRoomWin").getChildByName("Label7").active=true;
                    
                    self.club_Win.getChildByName("clubRoomWin").getChildByName("quitclubbtn").active=false;
                    self.club_Win.getChildByName("clubRoomWin").getChildByName("jsclubbtn").active=true;
                    
                    }
                    else{
                        self.club_Win.getChildByName("clubRoomWin").getChildByName("quitclubbtn").active=true;
                        self.club_Win.getChildByName("clubRoomWin").getChildByName("glclubbtn").active=false;
                        
                        self.club_Win.getChildByName("clubRoomWin").getChildByName("Label8").active=true;
                        self.club_Win.getChildByName("clubRoomWin").getChildByName("Label9").active=true;   
                        self.club_Win.getChildByName("clubRoomWin").getChildByName("Label6").active=true;
                        self.club_Win.getChildByName("clubRoomWin").getChildByName("Label7").active=true;    
                        self.club_Win.getChildByName("clubRoomWin").getChildByName("jsclubbtn").active=false;            
                    
                    }
                //..............................
              var data={
                  account:cc.vv.userMgr.account,
                  sign:cc.vv.userMgr.sign,
                  clubId:this.clubid,
              };
              var own = self;
              console.log(data);
              cc.vv.http.sendRequest("/get_club_rooms_info", data, function (ret) {
                var content=own.clubroom_Win.getChildByName("scrollview").getChildByName("view").getChildByName("content");
                content.removeAllChildren();
                if(ret.errcode!==0){
                    console.log(ret.errmsg);
                }
                else{
                    data=ret.data;
                    console.log(data);
                   
                    var len=data.length;
                    content.height=len*100;
                    
                    for(i=0;i<len;i++){
                        var item=cc.instantiate(self.clubroominfo);
                        data[i].base_info = JSON.parse(data[i].base_info);
                        var clubroomId=data[i].id;
                        var type;
                        var num=0;
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

                        item.getChildByName("clubroomId").getComponent(cc.Label).string=clubroomId;
                        item.getChildByName("clubroomType").getComponent(cc.Label).string=type;
                        item.getChildByName("clubroomNum").getComponent(cc.Label).string=num;
                        item.getChildByName("clubroomState").getComponent(cc.Label).string=state;
                        item.getChildByName("btn").on(cc.Node.EventType.TOUCH_END,function(event){
                            cc.vv.userMgr.enterRoom(clubroomId,function(ret){                              
                                
                                    if(ret.errcode == 4){
                                       var str_content = "房间已满!";
                                       cc.vv.alert.show("提示",str_content)
                                    }
                                    if(ret.errcode == 998){
                                       var  str_content = "您与房间内某位玩家距离过近,不能进入!";
                                        cc.vv.alert.show("提示",str_content)
                                    }
                                    if(ret.errcode == 999){
                                        var str_content = "您处于该房间房主黑名单列表中!";
                                        cc.vv.alert.show("提示",str_content)
                                    }
                                  ;                               
                            }); 

                        });
                        item.setPositionY(i*(-120));
                        item.parent=content;
                    }
                    console.log(item);     
                }
                

              });

                //.........................

                });

                }    
                
            };
        });
    
    },

    onBtnclubRoomCloseCliked:function(){
        this.clubroom_Win.active=false;
        this.label10.string="";
    },
    onBtncjclubroombtn:function(){

        console.log(this.label10.string);
        this.club_creatroom.active=true;   
    },
    onBtnglclubcloseCliked:function(){
        this.glclub_Win.active=false;
        
    },
    onBtnglclubCliked:function(){
        this.glclub_Win.active=true;
    },
    //解散俱乐部
    onBtnjsclubCliked:function(){
        var data={
            account:cc.vv.userMgr.account,
            sign:cc.vv.userMgr.sign,
            clubId:this.label12.string,
        };
        console.log(data);
        cc.vv.http.sendRequest("/delete_club", data, function (ret) {
            if (ret.errcode !== 0) {
                console.log(ret.errmsg);
            }
            else {              
                cc.vv.alert.show("提示","解散俱乐部成功");
                this.onBtnclubRoomCloseCliked();
                this.onBtnClubCLickeed();
               

            }

        }.bind(this));
    },
    //退出俱乐部
    onBtnexitclubCliked:function(){
        var data={
            account:cc.vv.userMgr.account,
            sign:cc.vv.userMgr.sign,
            userId:cc.vv.userMgr.userId,
            clubId:this.label12.string,
        };
        console.log(data);
        cc.vv.http.sendRequest("/quit_club", data, function (ret) {
            if (ret.errcode !== 0) {
                console.log(ret.errmsg);
            }
            else {              
                cc.vv.alert.show("提示","退出俱乐部成功");
                this.onBtnclubRoomCloseCliked();
                this.onBtnClubCLickeed();
            }

        }.bind(this));
    },
    //踢人
    onbtntirencloseCliked:function(){
        this.tiren_Win.active=false;
    },
    onbtntirenCliked:function(){
        this.tiren_Win.active=true;
        var data = {
            account: cc.vv.userMgr.account,
            sign: cc.vv.userMgr.sign,
            clubId:this.label10.string,
        };
        var self = this;
        console.log(data);
        cc.vv.http.sendRequest("/get_member_info", data, function (ret) {
            var content=self.tiren_Win.getChildByName("scrollView").getChildByName("view").getChildByName("content");
            content.removeAllChildren();
            if (ret.errcode !== 0) {
                console.log(ret.errmsg);
            }
            else {
                
                data = ret.data;
                console.log(data);               
                    var len=data.length;
                    content.height=len*100;
                    
                for (var i = 0; i < len; i++) {
                    //data[i].base_info = JSON.parse(data[i].base_info);
                    var item = cc.instantiate(self.cluberinfo);
                    var clubplayer_id = data[i].userid;
                    var clubplayer_name=data[i].name;
                    console.log(clubplayer_id);
              
                item.getChildByName("id").getComponent(cc.Label).string = clubplayer_id;
                item.getChildByName("name").getComponent(cc.Label).string = clubplayer_name;
                item.getChildByName("btn_tianjia").on(cc.Node.EventType.TOUCH_END,function(event){
                    var club_creatorid=self.label11.string;
                    var clubId=self.label10.string;                    
                    var userId=clubplayer_id;//部员id
                    if(club_creatorid==userId){
                        cc.vv.alert.show("提示","您是创始人");
                        return;
                    }
                    var onGet = function(ret){
            
                        if(ret.errcode==0){
                            cc.vv.alert.show("提示","已踢出俱乐部");
                            self.onbtntirenCliked();                           
                            return;
                        }
                        if(ret.errcode==1){
                            cc.vv.alert.show("提示","请检查网络");
                        }

                    }
                    var data = {
                        sign : cc.vv.userMgr.sign,
                        account:cc.vv.userMgr.account,
                        userId,
                        clubId,
                    }
                    cc.vv.http.sendRequest("/quit_club",data,onGet.bind(this));
                   
           
                });
                item.setPositionY(i * (-120));
                item.parent = content;
                }
            }
        });
    },

    //申请列表
    onbtnshenqingcloseCliked:function(){
        this.shenqinglist_Win.active=false;
    },
    onbtnshengqingCliked:function(){
        this.shenqinglist_Win.active=true;
        this.shengqinglist();
    },

    shengqinglist(){
        var data = {
            account: cc.vv.userMgr.account,
            sign: cc.vv.userMgr.sign,
            clubId:this.label10.string,
        };
        var self = this;
        console.log(data);
        cc.vv.http.sendRequest("/get_requestlist", data, function (ret) {
            var content=self.shenqinglist_Win.getChildByName("scrollView").getChildByName("view").getChildByName("content");
            content.removeAllChildren();
            if (ret.errcode !== 0) {
                console.log(ret.errmsg);
            }
            else {
                
                data = ret.data;
                console.log(data);               
                    var len=data.length;
                    content.height=len*100;
                    
                for (var i = 0; i < len; i++) {
                    var item = cc.instantiate(self.shenqinglistinfo);
                    var clubplayer_id = data[i].userid;
                    var clubplayer_name=data[i].name;
                    console.log(clubplayer_id);
              
                item.getChildByName("id").getComponent(cc.Label).string = clubplayer_id;
                item.getChildByName("name").getComponent(cc.Label).string = clubplayer_name;
                item.getChildByName("btn_tongyi").on(cc.Node.EventType.TOUCH_END,function(event){
                    var club_creatorid=self.label11.string;
                    var clubId=self.label10.string;                    
                    var userId=clubplayer_id;//部员id
                    if(club_creatorid==userId){
                        cc.vv.alert.show("提示","您是创始人");
                        return;
                    }
                    var onGet = function(ret){
            
                        if(ret.errcode==0){
                            cc.vv.alert.show("提示","同意该用户加入俱乐部");
                            self.shengqinglist();                           
                            return;
                        }
                        if(ret.errcode==1){
                            cc.vv.alert.show("提示","请检查网络");
                        }

                    }
                    var data = {
                        sign : cc.vv.userMgr.sign,
                        account:cc.vv.userMgr.account,
                        userId,
                        clubId,
                    }
                              
                    cc.vv.http.sendRequest("/enter_club",data,onGet.bind(this));
                });
                item.getChildByName("btn_jujue").on(cc.Node.EventType.TOUCH_END,function(event){
                    var club_creatorid=self.label11.string;
                    var clubId=self.label10.string;                    
                    var userId=clubplayer_id;//部员id
                    if(club_creatorid==userId){
                        cc.vv.alert.show("提示","您是创始人");
                        return;
                    }
                    var onGet = function(ret){
            
                        if(ret.errcode==0){
                            cc.vv.alert.show("提示","已拒绝该用户加入俱乐部");
                            self.shengqinglist();                            
                            return;
                        }
                        if(ret.errcode==1){
                            cc.vv.alert.show("提示","请检查网络");
                        }

                    }
                    var data = {
                        sign : cc.vv.userMgr.sign,
                        account:cc.vv.userMgr.account,
                        userId,
                        clubId,
                    }
                    cc.vv.http.sendRequest("/delete_requestlist",data,onGet.bind(this));
                });
                item.setPositionY(i * (-120));
                item.parent = content;
                }
            }
        });

    },
    
  
});
