﻿//var HALL_IP = "192.168.1.157";
var HALL_IP = "192.168.1.115";
//var HALL_IP = "192.168.1.112";
var HALL_IP = "192.168.1.200";
//var HALL_IP = "101.200.52.241";
//var HALL_IP = "192.168.13.80";
var HALL_CLIENT_PORT = 9001;
var HALL_ROOM_PORT = 9002;

var ACCOUNT_PRI_KEY = "^&*#$%()@";
var ROOM_PRI_KEY = "~!@#$(*&^%$&";

var LOCAL_IP = 'localhost';

exports.mysql = function(){
	return {
		//HOST:'127.0.0.1',
		HOST:'101.200.52.241',
		USER:'root',
		PSWD:'qipaiyouxi1234.',
		DB:'nodejs',
		PORT:3306,
	}
}

//账号服配置
exports.account_server = function(){
	return {
		CLIENT_PORT:9000,
		HALL_IP:HALL_IP,
		HALL_CLIENT_PORT:HALL_CLIENT_PORT,
		ACCOUNT_PRI_KEY:ACCOUNT_PRI_KEY,
		
		//
		DEALDER_API_IP:LOCAL_IP,
		DEALDER_API_PORT:12581,
		VERSION:'20161227',
		//APP_WEB:'http://123.56.30.112/hengsheng/qipaiyouxi.html',
	    APP_WEB:'http://123.56.30.112/hengsheng/base.apk',
	};
};

//大厅服配置
exports.hall_server = function(){
	return {
		HALL_IP:HALL_IP,
		CLEINT_PORT:HALL_CLIENT_PORT,
		FOR_ROOM_IP:LOCAL_IP,
		ROOM_PORT:HALL_ROOM_PORT,
		ACCOUNT_PRI_KEY:ACCOUNT_PRI_KEY,
		ROOM_PRI_KEY:ROOM_PRI_KEY
	};
};

//游戏服配置
exports.game_server = function(){
	return {
		SERVER_ID:"001",
		
		//暴露给大厅服的HTTP端口号
		HTTP_PORT:9003,
		//HTTP TICK的间隔时间，用于向大厅服汇报情况
		HTTP_TICK_TIME:5000,
		//大厅服IP
		HALL_IP:LOCAL_IP,
		FOR_HALL_IP:LOCAL_IP,
		//大厅服端口
		HALL_PORT:HALL_ROOM_PORT,
		//与大厅服协商好的通信加密KEY
		ROOM_PRI_KEY:ROOM_PRI_KEY,
		
		//暴露给客户端的接口
		CLIENT_IP:HALL_IP,
		CLIENT_PORT:10000,
	};
};
