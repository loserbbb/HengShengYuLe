


var crypto = require('../utils/crypto');
var express = require('express');
var db = require('../utils/db');
var http = require('../utils/http');
var room_service = require("./room_service");

var app = express();
var config = null;

function check_account(req, res) {
	var account = req.query.account;
	var sign = req.query.sign;
	if (account == null || sign == null) {
		http.send(res, 1, "unknown error");
		return false;
	}
	/*
	var serverSign = crypto.md5(account + req.ip + config.ACCOUNT_PRI_KEY);
	if(serverSign != sign){
		http.send(res,2,"login failed.");
		return false;
	}
	*/
	return true;
}

//设置跨域访问
app.all('*', function (req, res, next) {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "X-Requested-With");
	res.header("Access-Control-Allow-Methods", "PUT,POST,GET,DELETE,OPTIONS");
	res.header("X-Powered-By", ' 3.2.1');
	res.header("Content-Type", "application/json;charset=utf-8");
	next();
});

app.get('/login', function (req, res) {
	if (!check_account(req, res)) {
		return;
	}

	var ip = req.ip;
	if (ip.indexOf("::ffff:") != -1) {
		ip = ip.substr(7);
	}

	var account = req.query.account;
	db.get_user_data(account, function (data) {
		if (data == null) {
			http.send(res, 0, "ok");
			return;
		}

		var ret = {
			account: data.account,
			userid: data.userid,
			name: data.name,
			lv: data.lv,
			exp: data.exp,
			coins: data.coins,
			gems: data.gems,
			ip: ip,
			sex: data.sex,
		};

		db.get_room_id_of_user(data.userid, function (roomId) {
			//如果用户处于房间中，则需要对其房间进行检查。 如果房间还在，则通知用户进入
			if (roomId != null) {
				//检查房间是否存在于数据库中
				db.is_room_exist(roomId, function (retval) {
					if (retval) {
						ret.roomid = roomId;
					}
					else {
						//如果房间不在了，表示信息不同步，清除掉用户记录
						db.set_room_id_of_user(data.userid, null);
					}
					http.send(res, 0, "ok", ret);
				});
			}
			else {
				http.send(res, 0, "ok", ret);
			}
		});
	});
});


app.get('/set_location', function (req, res) {
	console.log("++++++++++++++++++++++++++++++++++++");
	if (!check_account(req, res)) {
		return;
	}
	var account = req.query.account;
	var location = req.query.location;
	if (typeof (location) != "string") {
		return;
	}
	location = location.split(',');
	if (location.length != 2) {
		return;
	}
	var x, y;
	x = parseFloat(location[0]);
	y = parseFloat(location[1]);
	location = {
		x: x,
		y: y,
	}
	if(location.x == 0 && location.y == 0){
		http.send(res, 404, "failed");
		return;
	}
	location = JSON.stringify(location);
	console.log(location);
	db.set_user_location(account, location, function (data) {
		if (data) {
			http.send(res, 0, "ok");
		} else {
			http.send(res, 1, "failed");
		}
	});

});

app.get('/create_user', function (req, res) {
	if (!check_account(req, res)) {
		return;
	}
	var account = req.query.account;
	var name = req.query.name;
	var coins = 1000;
	var gems = 21;
	console.log(name);

	db.is_user_exist(account, function (ret) {
		if (!ret) {
			db.create_user(account, name, coins, gems, 0, null, function (ret) {
				if (ret == null) {
					http.send(res, 2, "system error.");
				}
				else {
					http.send(res, 0, "ok");
				}
			});
		}
		else {
			http.send(res, 1, "account have already exist.");
		}
	});
});

app.get('/create_private_room', function (req, res) {
	//验证参数合法性
	var data = req.query;
	//验证玩家身份
	 if (!check_account(req, res)) {
		return;
	}
     console.log(data);
	var account = data.account;

	data.account = null;
	data.sign = null;
	var conf = data.conf;
	console.log("conf is"+conf)

	
	db.get_user_data(account, function (data) {
		if (data == null) {
			http.send(res, 1, "system error");
			return;
		}
		var userId = data.userid;
		var name = data.name;
		//验证玩家状态
		db.get_room_id_of_user(userId, function (roomId) {
			if (roomId != null) {
				http.send(res, -1, "user is playing in room now.");
				return;
			}
			//创建房间
			room_service.createRoom(account, userId, conf, function (err, roomId) {
				if (err == 0 && roomId != null) {
					room_service.enterRoom(userId, name, roomId, function (errcode, enterInfo) {
						if (enterInfo) {
							var ret = {
								roomid: roomId,
								ip: enterInfo.ip,
								port: enterInfo.port,
								token: enterInfo.token,
								time: Date.now()
							};
							ret.sign = crypto.md5(ret.roomid + ret.token + ret.time + config.ROOM_PRI_KEY);
							http.send(res, 0, "ok", ret);
						}
						else {
							http.send(res, errcode, "room doesn't exist.");
						}
					});
				}
				else {
					http.send(res, err, "create failed.");
				}
			});
		});
	});
});

app.get('/enter_private_room', function (req, res) {
	var data = req.query;
	var roomId = data.roomid;
	if (roomId == null) {
		http.send(res, -1, "parameters don't match api requirements.");
		return;
	}
	if (!check_account(req, res)) {
		return;
	}

	var account = data.account;

	db.get_user_data(account, function (data) {
		if (data == null) {
			http.send(res, -1, "system error");
			return;
		}
		var userId = data.userid;
		var name = data.name;

		//验证玩家状态
		//todo
		//进入房间
		db.get_room_blacklist(roomId, function (data) {
			if (data) {
				if (data == "") {
					data = "[]";
				}
				var blacklist = JSON.parse(data);
				if (blacklist != null && blacklist.indexOf(userId) >= 0) {
					http.send(res, 999, "in blacklist");
					return;
				}
			}

			room_service.enterRoom(userId, name, roomId, function (errcode, enterInfo) {
				if (enterInfo) {
					var ret = {
						roomid: roomId,
						ip: enterInfo.ip,
						port: enterInfo.port,
						token: enterInfo.token,
						time: Date.now()
					};
					ret.sign = crypto.md5(roomId + ret.token + ret.time + config.ROOM_PRI_KEY);
					http.send(res, 0, "ok", ret);
				}
				else {
					http.send(res, errcode, "enter room failed.");
				}
			});


		});

	});
});

app.get('/get_history_list', function (req, res) {
	var data = req.query;
	if (!check_account(req, res)) {
		return;
	}
	var account = data.account;
	db.get_user_data(account, function (data) {
		if (data == null) {
			http.send(res, -1, "system error");
			return;
		}
		var userId = data.userid;
		db.get_user_history(userId, function (history) {
			http.send(res, 0, "ok", { history: history });
		});
	});
});

app.get('/fankui', function (req, res) {
	var data = req.query;
	if (!check_account(req, res)) {
		return;
	}
	var userid = data.userid;
	var feedback = data.fankui;
	db.add_feedback(userid, feedback, function (data) {
		if (data) {
			http.send(res, 0, "ok");
		} else {
			http.send(res, 1, "err");
		}
	});
});

app.get('/get_blacklist', function (req, res) {
	var data = req.query;
	if (!check_account(req, res)) {
		return;
	}
	var userid = data.userid;
	db.get_user_blacklist(userid, function (data) {
		if (data) {
			if (data == "") {
				data = "[]";
			}
			var blacklist = JSON.parse(data);
			if (blacklist == null) {
				http.send(res, 1, "err");
				return;
			}
			http.send(res, 0, "ok", { blacklist: blacklist });
		} else {
			http.send(res, 1, "err");
		}
	});
});

app.get('/add_to_blacklist', function (req, res) {
	var data = req.query;
	if (!check_account(req, res)) {
		return;
	}
	var userid = data.userid;
	var black_userid = parseInt(data.black_userid);
	db.get_user_blacklist(userid, function (data) {
		if (data) {
			if (data == "") {
				data = "[]";
			}
			var blacklist = JSON.parse(data);
			if (blacklist == null) {
				http.send(res, 1, "err");
				return;
			}
			if (blacklist.indexOf(black_userid) < 0) {
				blacklist.push(black_userid);
			}
			data = JSON.stringify(blacklist);
			db.set_user_blacklist(userid, data, function (data) {
				if (data) {
					http.send(res, 0, "ok");
				} else {
					http.send(res, 1, "err");
				}
			});

		} else {
			http.send(res, 1, "err");
		}
	});
});

app.get('/get_distance_of_others', function(req, res){
	var data = req.query;
	if(!check_account(req, res)){
		return;
	}
	var roomid = data.roomId;
	db.get_room_players(roomid,function(data){
		if(data!=null && data != false){
			var usersInRoom = [];
			usersInRoom.push(data.user_id0);
			usersInRoom.push(data.user_id1);
			usersInRoom.push(data.user_id2);
			usersInRoom.push(data.user_id3);
			db.get_users_location(usersInRoom,function(data){
				if(data!=null && data != false){
					var distances = [];
					for(var i = 0;i < usersInRoom.length;i++){
						distances.push(new Array(usersInRoom.length));
						data[i].location = JSON.parse(data[i].location);
					}
					for(var i = 0;i < usersInRoom.length;i++){
						for(var j = 0;j < usersInRoom.length;j++){
							distances[i][j] = crypto.calculateDistance(data[i].location,data[j].location);
						}
					}
					// distances = JSON.stringify(distances);
					http.send(res,0,"ok",{data:distances});
				}else{
					http.send(res,1,"data is null");
				}
			});
		}else{
			http.send(res,1,"data1 is null");
		}
	});
});

app.get('/del_from_blacklist', function (req, res) {
	var data = req.query;
	if (!check_account(req, res)) {
		return;
	}
	var userid = data.userid;
	var black_userid = parseInt(data.black_userid);
	db.get_user_blacklist(userid, function (data) {
		if (data) {
			if (data == "") {
				data = "[]";
			}
			var blacklist = JSON.parse(data);
			if (blacklist == null) {
				http.send(res, 1, "err")
				return;
			}
			if (blacklist.indexOf(black_userid) >= 0) {
				blacklist.splice(blacklist.indexOf(black_userid), 1);
			} else {
				http.send(res, 2, "not exit");
				return;
			}
			data = JSON.stringify(blacklist);
			db.set_user_blacklist(userid, data, function (data) {
				if (data) {
					http.send(res, 0, "ok");
				} else {
					http.send(res, 1, "err");
				}
			});

		} else {
			http.send(res, 1, "err");
		}
	});
});

app.get('/get_games_of_room', function (req, res) {
	var data = req.query;
	var uuid = data.uuid;
	if (uuid == null) {
		http.send(res, -1, "parameters don't match api requirements.");
		return;
	}
	if (!check_account(req, res)) {
		return;
	}
	db.get_games_of_room(uuid, function (data) {
		console.log(data);
		http.send(res, 0, "ok", { data: data });
	});
});

app.get('/get_detail_of_game', function (req, res) {
	var data = req.query;
	var uuid = data.uuid;
	var index = data.index;
	if (uuid == null || index == null) {
		http.send(res, -1, "parameters don't match api requirements.");
		return;
	}
	if (!check_account(req, res)) {
		return;
	}
	db.get_detail_of_game(uuid, index, function (data) {
		http.send(res, 0, "ok", { data: data });
	});
});

app.get('/get_user_status', function (req, res) {
	if (!check_account(req, res)) {
		return;
	}
	var account = req.query.account;
	db.get_gems(account, function (data) {
		if (data != null) {
			http.send(res, 0, "ok", { gems: data.gems });
		}
		else {
			http.send(res, 1, "get gems failed.");
		}
	});
});

app.get('/add_user_gems_days', function (req, res) {
	var userid = req.query.userid;
	var gems = req.query.gems;
	if (userid == null || gems == null) {
		http.send(res, 1, "parameter is invaliad");
		return;
	}
	var now = new Date();
	db.get_user_last(userid, function (data) {
		data = data.last;
		if (data == null) {
			var s = now.toJSON();
			db.set_user_last(userid, s, function (data) {
				if (data) {
					db.add_user_gems(userid, gems, function (suc) {
						if (suc) {
							http.send(res, 0, "ok");
						}
						else {
							http.send(res, 1, "failed");
						}
					});
				} else {
					http.send(res, 10, "failed");
				}
			});
		} else {
			var last = new Date(Date.parse(data));
			var day = last.getDate()
			var month = last.getMonth();
			if (now.getDate() == day && now.getMonth() == month) {
				http.send(res, 2, "have received");
			} else {
				db.set_user_last(userid, now, function (data) {
					if (data) {
						db.add_user_gems(userid, gems, function (suc) {
							if (suc) {
								http.send(res, 0, "ok");
							}
							else {
								http.send(res, 1, "failed");
							}
						});
					} else {
						http.send(res, 11, "failed");
					}
				});
			}
		}
	});
});

app.get('/give_away_gems', function (req, res) {
	if (!check_account(req, res)) {
		return;
	}
	var userid = req.query.userid;
	var cost = req.query.gems;
	var receiver = req.query.receiver;
	if (userid == null || cost == null || receiver == null) {
		http.send(res, 3, "parameter is invailad");
		return;
	}
	db.get_gems_by_userId(userid, function (data) {
		if (data != null) {
			if (data.gems >= cost) {
				db.add_user_gems(receiver, cost, function (data) {
					if (data) {
						db.cost_gems(userid, cost, function (data) {
							if (data) {
								http.send(res, 0, "give away succeed");
							} else {
								http.send(res, 4, "err");
							}
						});
					} else {
						http.send(res, 5, "receiver is not exit");
					}
				});

			} else {
				http.send(res, 1, "gems not enough");
			}
		} else {
			http.send(res, 3, "userid is invailad");
		}
	});
});

app.get('/get_room_players', function (req, res) {
	if (!check_account(req, res)) {
		return;
	}
	var roomId = req.query.roomId;
	db.get_room_players(roomId, function (data) {
		if (data != null) {
			var players = [];
			if (data.user_id0 > 0) {
				players.push({ userId: data.user_id0, userName: data.user_name0 });
			}
			if (data.user_id1 > 0) {
				players.push({ userId: data.user_id1, userName: data.user_name1 });
			}
			if (data.user_id2 > 0) {
				players.push({ userId: data.user_id2, userName: data.user_name2 });
			}
			if (data.user_id3 > 0) {
				players.push({ userId: data.user_id3, userName: data.user_name3 });
			}
			http.send(res, 0, "ok", { data: players });
		} else {
			http.send(res, 1, "get room players failed");
		}
	});
});

app.get('/get_user_rooms_info', function (req, res) {
	if (!check_account(req, res)) {
		return;
	}
	var userId = req.query.userId;
	db.get_user_rooms_info(userId, function (data) {
		if (data != null) {
			http.send(res, 0, "ok", { data: data });
		} else {
			http.send(res, 1, "get user club rooms info failed.");
		}
	});
});

app.get('/get_message', function (req, res) {
	if (!check_account(req, res)) {
		return;
	}
	var type = req.query.type;

	if (type == null) {
		http.send(res, -1, "parameters don't match api requirements.");
		return;
	}

	var version = req.query.version;
	db.get_message(type, version, function (data) {
		if (data != null) {
			http.send(res, 0, "ok", { msg: data.msg, version: data.version });
		}
		else {
			http.send(res, 1, "get message failed.");
		}
	});
});

app.get('/is_server_online', function (req, res) {
	if (!check_account(req, res)) {
		return;
	}
	var ip = req.query.ip;
	var port = req.query.port;
	room_service.isServerOnline(ip, port, function (isonline) {
		var ret = {
			isonline: isonline
		};
		http.send(res, 0, "ok", ret);
	});
});



app.get('/get_user_club_info', function (req, res) {
	if (!check_account(req, res)) {
		return;
	}
	var userId = req.query.userId;
	db.get_user_club_info(userId, function (data) {
		if (data != null) {
			http.send(res, 0, "ok", { data: data });
		} else if (data == false) {
			http.send(res, 1, "get user club info failed.");
			console.log("1,failed");
		}
		else {
			http.send(res, 2, "data is null.");
			console.log("2,null");
		}
	});


});
app.get('/get_club_rooms_info', function (req, res) {
	if (!check_account(req, res)) {
		return;
	}

	var clubId = req.query.clubId;
	db.get_club_rooms_info(clubId, function (data) {
		if (data != null) {
			http.send(res, 0, "ok", { data: data });
		} else if(data==null){
			http.send(res, 2, "roominfo is null.");

		}
		else {
			http.send(res, 1, "get user room info by clubid failed.");
		}
	});
});
app.get('/enter_club', function (req, res) {
	if (!check_account(req, res)) {
		return;
	}

	var clubId = req.query.clubId;
	var userId = req.query.userId;
	db.is_club_exist(clubId, function (data) {
		if (data == false) {
			http.send(res, 3, "club is not exist. ");
			return;
		}
		db.is_club_joined(userId, clubId, function (data) {
			if (data == true) {
				http.send(res, 2, "user has joined club. ");
				return;
			}
			db.enter_club(userId, clubId, function (data) {

				if (data != false) {
					http.send(res, 0, "ok");
				} else {
					http.send(res, 1, "get enter club failed.");
				}
			});

		});

	});

});

app.get('/create_club', function (req, res) {
	if (!check_account(req, res)) {
		return;
	}

	//var id=null;
	var userId = req.query.userId;
	var clubName = req.query.clubName;

	db.create_club(clubName, userId, function (data) {
		if (data != null) {
			http.send(res, 0, "ok");
		} else {
			http.send(res, 1, "create club failed.");
		}

	});
});


app.get('/quit_club', function (req, res) {
	if (!check_account(req, res)) {
		return;
	}

	var clubId = req.query.clubId;
	var userId = req.query.userId;

	db.is_club_exist(clubId, function (data) {
		if (data == false) {
			http.send(res, 3, "club is not exist. ");
			return;
		}
		db.is_club_joined(userId, clubId, function (data) {
			if (data == false) {
				http.send(res, 2, "user has  not joined club. ");
				return;
			}
			db.quit_club(userId, clubId, function (data) {
				if (data != false) {
					http.send(res, 0, "ok");
				} else {
					http.send(res, 1, "quit  club failed.");
				}
			});
		});
		
	});
});

app.get('/get_member_info', function (req, res) {
	if (!check_account(req, res)) {
		return;
	}

	var clubId = req.query.clubId;
	db.get_member_info(clubId, function (data) {
		if (data != null) {
			http.send(res, 0, "ok", { data: data });
		} else if(data==null){
			http.send(res, 2, " member info is null.");

		} 
		else {
			http.send(res, 1, "get member info by club failed.");
		}
	});
});


app.get('/delete_club', function (req, res) {
	if (!check_account(req, res)) {
		return;
	}

	var clubId = req.query.clubId;

	db.is_club_exist(clubId, function (data) {
		if (data == false) {
			http.send(res, 3, "club is not exist. ");
			return;
		}
		db.delete_club(clubId, function (data) {
			if (data == true) {
				http.send(res, 0, "ok", { data: data });
			} else {
				http.send(res, 1, "delete club failed.");
			}
		});
	});
});

app.get('/creat_requestlist',function(req,res){
	if(!check_account(req,res)){
		return;
	}
	
	var clubId= req.query.clubId;
	var userId=req.query.userId;
	db.is_club_exist(clubId,function(data){
		if(data==false){
			http.send(res,3,"club is not exist. ");
			return;
		}
		db.is_club_joined(userId, clubId, function (data) {
			if (data == true) {
				http.send(res, 2, "user has joined club. ");
				return;
			}
			db.is_club_sent(userId,clubId,function(data){
				if(data == true){
				   http.send(res,4,"user has sent request. ");
				   return;
				}
			 	db.creat_requestlist(userId,clubId,function(data){
		
		              	if(data != false){
			         	 http.send(res,0,"ok");
		            	}else{
			           	 http.send(res,1,"send request enter club failed.");
		               	  }
	          	});
			});
	    });

	});


});
app.get('/get_requestlist',function(req,res){
	if(!check_account(req,res)){
		return;
	}
	
	var clubId= req.query.clubId;
	db.get_requestlist(clubId,function(data){
		if(data != null){
			http.send(res,0,"ok",{data:data});
		}else{
			http.send(res,1,"get club request list failed.");
		}
	});
});
app.get('/delete_requestlist',function(req,res){
	if(!check_account(req,res)){
		return;
	}
	
	var clubId= req.query.clubId;
	var userId=req.query.userId;

	

		    
    db.delete_requestlist(userId,clubId,function(data){
		if(data != false){
			 http.send(res,0,"ok");
		}else{
			 http.send(res,1,"delete requestlist failed.");
		     }
	    });

});



exports.start = function ($config) {
	config = $config;
	app.listen(config.CLEINT_PORT);
	console.log("client service is listening on port " + config.CLEINT_PORT);
};