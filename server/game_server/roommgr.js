

var db = require('../utils/db');

// var roomsOfOwner = {};

var rooms = {};
var creatingRooms = {};

var userLocation = {};
var totalRooms = 0;

//var DI_FEN = [1,2,5];
//var MAX_FAN = [3,4,5];
var JU_SHU = [4, 8];
var JU_SHU_COST = [4, 8];
var KUN_JIN = [true, false];
var JIN_FENG_DING = [2, 3, 4];
var BAO_TING = [true, false];
var CHEAT = [true, false];
var FENG_HAO_ZI = [1,2,3];
var DAI_FENG = [true,false];

function generateRoomId() {
	var roomId = "";
	for (var i = 0; i < 6; ++i) {
		roomId += Math.floor(Math.random() * 10);
	}
	return roomId;
}

function calculateDistance(locationOfComer, locationOfPlayer) {
	// 37.957903,112.53809
	// lati	 long
	var radLat1 = locationOfComer.x * Math.PI / 180.0;
	var radLat2 = locationOfPlayer.x * Math.PI / 180.0;
	var a = radLat1 - radLat2;
	var b = locationOfComer.y * Math.PI / 180.0 - locationOfComer.y * Math.PI / 180.0;
	var s = 2 * Math.asin(Math.sqrt(Math.pow(Math.sin(a / 2), 2) + Math.cos(radLat1) * Math.cos(radLat2) * Math.pow(Math.sin(b / 2), 2)));
	s = s * 6378.137;
	console.log("距离" + s * 1000);
	return s * 1000;
}

function constructRoomFromDb(dbdata) {
	var roomInfo = {
		uuid: dbdata.uuid,
		id: dbdata.id,
		numOfGames: dbdata.num_of_turns,
		createTime: dbdata.create_time,
		nextButton: dbdata.next_button,
		seats: new Array(4),
		conf: JSON.parse(dbdata.base_info)
	};
	if (roomInfo.conf.type == "sjmj") {
		roomInfo.gameMgr = require("./gamemgr_sjmj");
	} else if (roomInfo.conf.type == 'djmj') {
		roomInfo.gameMgr = require("./gamemgr_sjmj");
	} else if (roomInfo.conf.type == 'bymj') {
		roomInfo.gameMgr = require("./gamemgr_bymj");
	} else if (roomInfo.conf.type == 'kdd') {
		roomInfo.gameMgr = require("./gamemgr_kdd");
	}



	var roomId = roomInfo.id;

	for (var i = 0; i < 4; ++i) {
		var s = roomInfo.seats[i] = {};
		s.userId = dbdata["user_id" + i];
		s.score = dbdata["user_score" + i];
		s.name = dbdata["user_name" + i];
		s.ready = false;
		s.seatIndex = i;
		s.numAnGang = 0;
		s.numMingGang = 0;
		if (s.userId > 0) {
			userLocation[s.userId] = {
				roomId: roomId,
				seatIndex: i
			};
		}
	}
	rooms[roomId] = roomInfo;
	totalRooms++;
	return roomInfo;
}

exports.createRoom = function (creator, roomConf, gems, ip, port, callback) {
	if (roomConf.type == null) {
		callback(133, null);
		return;
	}
	if (roomConf.type != 'sjmj'
		&& roomConf.type != 'djmj'
		&& roomConf.type != 'bymj'
		&& roomConf.type != 'kdd') {
		callback(18, null);
		return
	}
	if (roomConf.type == 'sjmj' || roomConf.type == 'djmj') {
		if (roomConf.jinfengding == null
			|| roomConf.wanfaxuanze == null
			|| roomConf.xuanzejushu == null
			|| roomConf.paytype == null
			|| roomConf.iplimit == null
			|| roomConf.difen == null
			|| roomConf.jinfen == null
			|| roomConf.cheat == null) {
			callback(13, null);
			return;
		}
		if (roomConf.wanfaxuanze < 0 || roomConf.wanfaxuanze > KUN_JIN.length) {
			callback(14, null);
			return;
		}
		if (roomConf.xuanzejushu < 0 || roomConf.xuanzejushu > JU_SHU.length) {
			callback(15, null);
			return;
		}
		if (roomConf.jinfengding < 0 || roomConf.jinfengding > JIN_FENG_DING.length) {
			callback(16, null);
			return;
		}
		if (roomConf.paytype < 0 || roomConf.paytype > 1) {
			callback(17, null);
			return;
		}
		if (roomConf.cheat < 0 || roomConf.cheat > 1) {
			callback(18, null);
		}
	}
	if (roomConf.type == 'bymj') {
		if (roomConf.wanfaxuanze == null
			|| roomConf.xuanzejushu == null
			|| roomConf.paytype == null
			|| roomConf.difen == null
			|| roomConf.cheat == null
			|| roomConf.daifeng == null) {
			callback(13, null);
			return;
		}
		if (roomConf.wanfaxuanze < 0 || roomConf.wanfaxuanze > BAO_TING.length) {
			callback(14, null);
			return;
		}
		if (roomConf.xuanzejushu < 0 || roomConf.xuanzejushu > JU_SHU.length) {
			callback(15, null);
			return;
		}
		if (roomConf.paytype < 0 || roomConf.paytype > 1) {
			callback(17, null);
			return;
		}
		if (roomConf.cheat < 0 || roomConf.cheat > 1) {
			callback(28, null);
		}
		if (roomConf.daifeng < 0 || roomConf.daifeng > 1) {
			callback(29, null);
		}
	}
	if (roomConf.type == 'kdd') {
		if (roomConf.xuanzejushu == null
			|| roomConf.paytype == null
			|| roomConf.difen == null
			|| roomConf.cheat == null
			|| roomConf.fenghaozi == null) {
			callback(13, null);
			return;
		}
		if (roomConf.xuanzejushu < 0 || roomConf.xuanzejushu > JU_SHU.length) {
			callback(15, null);
			return;
		}
		if (roomConf.paytype < 0 || roomConf.paytype > 1) {
			callback(17, null);
			return;
		}
		if (roomConf.cheat < 0 || roomConf.cheat > 1) {
			callback(18, null);
            return;
		}
		if (roomConf.fenghaozi < 0 || roomConf.fenghaozi > 2){
			callback(19, null);
			return;
		}
	}
	var cost = JU_SHU_COST[roomConf.xuanzejushu];
	var havecosted = 0;
	var roomsOfCreator = null;


	var fnCreate = function () {
		var roomId = generateRoomId();
		if (rooms[roomId] != null || creatingRooms[roomId] != null) {
			fnCreate();
		}
		else {
			creatingRooms[roomId] = true;
			db.is_room_exist(roomId, function (ret) {

				if (ret) {
					delete creatingRooms[roomId];
					fnCreate();
				}
				else {
					var createTime = Math.ceil(Date.now() / 1000);
					var roomInfo = {
						uuid: "",
						id: roomId,
						numOfGames: 0,
						createTime: createTime,
						nextButton: 0,
						seats: [],
					};
					if (roomConf.type == 'sjmj' || roomConf.type == 'djmj') {
						roomInfo.conf = {
							type: roomConf.type,
							baseScore: roomConf.difen,
							jinfen: roomConf.jinfen,
							kunjin: KUN_JIN[roomConf.wanfaxuanze],
							jinfengding: JIN_FENG_DING[roomConf.jinfengding],
							maxGames: JU_SHU[roomConf.xuanzejushu],
							creator: creator,
							paytype: roomConf.paytype,
							cheat: CHEAT[roomConf.cheat],
						};
					}
					if (roomConf.type == 'bymj') {
						roomInfo.conf = {
							type: roomConf.type,
							baseScore: roomConf.difen,
							isBaoTing: BAO_TING[roomConf.wanfaxuanze],
							maxGames: JU_SHU[roomConf.xuanzejushu],
							creator: creator,
							paytype: roomConf.paytype,
							cheat: CHEAT[roomConf.cheat],
							daifeng: DAI_FENG[roomConf.daifeng],
						};
					}
					if (roomConf.type == 'kdd') {
						roomInfo.conf = {
							type: roomConf.type,
							baseScore: roomConf.difen,
							isBaoTing: true,
							maxGames: JU_SHU[roomConf.xuanzejushu],
							creator: creator,
							paytype: roomConf.paytype,
							cheat: CHEAT[roomConf.cheat],
							fenghaozi: FENG_HAO_ZI[roomConf.fenghaozi],
						};
					}
					if (roomInfo.conf == null) {
						return;
					}

					roomInfo.conf.clubId=roomConf.clubId;
					console.log("club_id is"+roomInfo.conf.clubId);

					if (roomConf.type == 'sjmj') {
						roomInfo.gameMgr = require("./gamemgr_sjmj");
					} else {
						if (roomConf.type == 'djmj') {
							roomInfo.gameMgr = require("./gamemgr_sjmj");
						} else {
							if (roomConf.type == 'bymj') {
								roomInfo.gameMgr = require("./gamemgr_bymj");
							} else {
								if (roomConf.type == 'kdd') {
									roomInfo.gameMgr = require("./gamemgr_kdd");
								}
							}
						}
					}
					console.log(roomInfo.conf);

					for (var i = 0; i < 4; ++i) {
						roomInfo.seats.push({
							userId: 0,
							score: 0,
							name: "",
							ready: false,
							seatIndex: i,
							numAnGang: 0,
							numDaJin: 0,
							numMingGang: 0,
						});
					}

					//写入数据库
					var conf = roomInfo.conf;
					db.create_room(roomInfo.id, roomInfo.conf, ip, port, createTime, function (uuid) {
						delete creatingRooms[roomId];
						if (uuid != null) {
							roomInfo.uuid = uuid;
							console.log(uuid);
							rooms[roomId] = roomInfo;
							totalRooms++;
							callback(0, roomId);
						}
						else {
							callback(3, null);
						}
					});
				}
			});
		}
	}

	db.get_user_rooms_cost(creator, function (data) {
		var havecosted = data.cost;
		var roomsnum = data.roomsNum;
		if (havecosted != null) {
			gems -= havecosted;
		}
		if (roomConf.paytype == 0) {
			if (cost > gems) {
				callback(2222, null);
				return;
			}
		} else {
			if (cost / 4 > gems) {
				callback(2222, null);
				return;
			}
		}
		if (roomsnum != null && roomsnum > 6) {
			callback(4, null);
			return;
		}
		fnCreate()

	});
};

exports.destroy = function (roomId) {
	var roomInfo = rooms[roomId];
	if (roomInfo == null) {
		return;
	}

	for (var i = 0; i < 4; ++i) {
		var userId = roomInfo.seats[i].userId;
		if (userId > 0) {
			delete userLocation[userId];
			db.set_room_id_of_user(userId, null);
		}
	}
	// var creator = roomInfo.conf['creator'];


	// var roomsOfCreator = roomsOfOwner[creator];
	// roomsOfCreator.splice(roomsOfCreator.indexOf(roomId), 1);
	// if(roomsOfCreator.length == 0){
	// 	delete roomsOfOwner[creator];
	// }
	delete rooms[roomId];
	totalRooms--;
	db.delete_room(roomId);
}

exports.getTotalRooms = function () {
	return totalRooms;
}

exports.getRoom = function (roomId) {
	return rooms[roomId];
};

exports.isCreator = function (roomId, userId) {
	var roomInfo = rooms[roomId];
	if (roomInfo == null) {
		return false;
	}
	console.log(roomInfo.conf.creator + '			' + userId);
	return roomInfo.conf.creator == userId;
};



exports.enterRoom = function (roomId, userId, userName, callback, gems) {
	var fnTakeSeat = function (room) {
		if (exports.getUserRoom(userId) == roomId) {
			//已存在
			return 0;
		}
		if (room.conf.paytype == 1) {
			var cost = 1;
			if (room.conf.maxGames == 8) {
				cost = 2;
			}
			if (cost > gems) {
				return 3;
			}
		}

		for (var i = 0; i < 4; ++i) {
			var seat = room.seats[i];
			if (seat.userId <= 0) {
				seat.userId = userId;
				seat.name = userName;
				userLocation[userId] = {
					roomId: roomId,
					seatIndex: i
				};
				//console.log(userLocation[userId]);
				db.update_seat_info(roomId, i, seat.userId, "", seat.name);
				//正常
				return 0;
			}
		}
		//房间已满
		return 1;
	}
	var room = rooms[roomId];
	if (room) {
		////
		var usersInRoom = [];
		usersInRoom.push(userId);
		for (var i = 0; i < 4; ++i) {
			var seat = room.seats[i];
			if (seat.userId > 0 && seat.userId != userId) {
				usersInRoom.push(seat.userId);
			}
		}
		if (usersInRoom.length > 1 && room.conf.cheat) {
			db.get_users_location(usersInRoom, function (data) {
				if (data && data.length == usersInRoom.length) {
					var locationOfComer = JSON.parse(data[0].location);
					if(locationOfComer.x == 0 && locationOfComer.y == 0){
						callback(404);
						return;
					}
					for (var i = 1; i < data.length; i++) {
						var locationOfPlayer = JSON.parse(data[i].location);
						if (calculateDistance(locationOfComer, locationOfPlayer) < 500) {
							callback(998);
							return;
						}
					}
					var ret = fnTakeSeat(room);
					callback(ret);

				} else {
					callback(777);
				}
			});
		} else {
			var ret = fnTakeSeat(room);
			callback(ret);
		}
		///
	}
	else {
		db.get_room_data(roomId, function (dbdata) {
			if (dbdata == null) {
				//找不到房间
				callback(2);
			}
			else {
				//construct room.
				room = constructRoomFromDb(dbdata);
				//
				var usersInRoom = [];
				usersInRoom.push(userId);
				for (var i = 0; i < 4; ++i) {
					var seat = room.seats[i];
					if (seat.userId > 0 && seat.userId != userId) {
						usersInRoom.push(seat.userId);
					}
				}
				if (usersInRoom.length > 1 && room.conf.cheat) {
					db.get_users_location(usersInRoom, function (data) {
						if (data && data.length == usersInRoom.length) {
							var locationOfComer = JSON.parse(data[0].location);
							if(locationOfComer.x == 0 && locationOfComer.y == 0){
								callback(404);
								return;
							}
							for (var i = 1; i < data.length; i++) {
								var locationOfPlayer = JSON.parse(data[i].location);
								if (calculateDistance(locationOfComer, locationOfPlayer) < 500) {
									callback(999);
									return;
								}
							}
							var ret = fnTakeSeat(room);
							callback(ret);

						} else {
							callback(777);
						}
					});
				} else {
					var ret = fnTakeSeat(room);
					callback(ret);
				}
			}
		});
	}
};

exports.setReady = function (userId, value) {
	var roomId = exports.getUserRoom(userId);
	if (roomId == null) {
		return;
	}

	var room = exports.getRoom(roomId);
	if (room == null) {
		return;
	}

	var seatIndex = exports.getUserSeat(userId);
	if (seatIndex == null) {
		return;
	}

	var s = room.seats[seatIndex];
	s.ready = value;
}

exports.isReady = function (userId) {
	var roomId = exports.getUserRoom(userId);
	if (roomId == null) {
		return;
	}

	var room = exports.getRoom(roomId);
	if (room == null) {
		return;
	}

	var seatIndex = exports.getUserSeat(userId);
	if (seatIndex == null) {
		return;
	}

	var s = room.seats[seatIndex];
	return s.ready;
}


exports.getUserRoom = function (userId) {
	var location = userLocation[userId];
	if (location != null) {
		return location.roomId;
	}
	return null;
};

exports.getUserSeat = function (userId) {
	var location = userLocation[userId];
	//console.log(userLocation[userId]);
	if (location != null) {
		return location.seatIndex;
	}
	return null;
};

exports.getUserLocations = function () {
	return userLocation;
};

exports.exitRoom = function (userId) {
	var location = userLocation[userId];
	if (location == null)
		return;

	var roomId = location.roomId;
	var seatIndex = location.seatIndex;
	var room = rooms[roomId];
	delete userLocation[userId];
	if (room == null || seatIndex == null) {
		return;
	}

	var seat = room.seats[seatIndex];
	seat.userId = 0;
	seat.name = "";

	// var numOfPlayers = 0;
	// for(var i = 0; i < room.seats.length; ++i){
	// 	if(room.seats[i].userId > 0){
	// 		numOfPlayers++;
	// 	}
	// }


	db.update_seat_info(roomId, seatIndex, 0, "", "");
	db.set_room_id_of_user(userId, null);

	// if(numOfPlayers == 0){
	// 	exports.destroy(roomId);
	// }
};
