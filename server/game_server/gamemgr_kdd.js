

var roomMgr = require("./roommgr");
var userMgr = require("./usermgr");
var mjutils = require('./mjutils1');
var db = require("../utils/db");
var crypto = require("../utils/crypto");
var games = {};
var gamesIdBase = 0;

var ACTION_CHUPAI = 1;
var ACTION_MOPAI = 2;
var ACTION_PENG = 3;
var ACTION_GANG = 4;
var ACTION_HU = 5;
var ACTION_ZIMO = 5;
var ACTION_TING = 6;

var gameSeatsOfUsers = {};




// 判断麻将类型 万: 0-8, 条: 9-17, 万: 18-26, 风: 27-30, 箭: 31-33
function getMJType(mahjongid) {
    if (mahjongid >= 0 && mahjongid < 9) return 0;
    else if (mahjongid >= 9 && mahjongid < 18) return 1;
    else if (mahjongid >= 18 && mahjongid < 27) return 2;
    else if (mahjongid >= 27 && mahjongid < 31) return 3;
    else if (mahjongid >= 31 && mahjongid < 34) return 4;
}

function getMJSize(mahjongid) {
    if (mahjongid < 27) {
        return mahjongid % 9 + 1;
    } else {
        return 10;
    }
}

function shuffle(game) {

    var mahjongs = game.mahjongs;


    //筒 (0 ~ 8 表示筒子
    var index = 0;
    for (var i = 0; i < 9; ++i) {
        for (var c = 0; c < 4; ++c) {
            mahjongs[index] = i;
            index++;
        }
    }

    //条 9 ~ 17表示条子
    for (var i = 9; i < 18; ++i) {
        for (var c = 0; c < 4; ++c) {
            mahjongs[index] = i;
            index++;
        }
    }

    //万
    //条 18 ~ 26表示万
    for (var i = 18; i < 27; ++i) {
        for (var c = 0; c < 4; ++c) {
            mahjongs[index] = i;
            index++;
        }
    }

    for (var i = 27; i < 31; ++i) {
        for (var c = 0; c < 4; ++c) {
            mahjongs[index] = i;
            index++;
        }
    }

    for (var i = 31; i < 34; ++i) {
        for (var c = 0; c < 4; ++c) {
            mahjongs[index] = i;
            index++;
        }
    }

    for (var i = 0; i < mahjongs.length; ++i) {
        var lastIndex = mahjongs.length - 1 - i;
        var index = Math.floor(Math.random() * lastIndex);
        var t = mahjongs[index];
        mahjongs[index] = mahjongs[lastIndex];
        mahjongs[lastIndex] = t;
    }

    if (game.conf.fenghaozi == 2) {
        game.jin.push(Math.floor(Math.random() * 7) + 27);
    }
    else if (game.conf.fenghaozi == 3) {
        var pai = Math.floor(Math.random() * 136);
        game.jin.push(mahjongs[pai]);

    }
}


function mopai(game, seatIndex) {
    if (game.currentIndex == game.mahjongs.length) {
        return -1;
    }
    var data = game.gameSeats[seatIndex];
    var mahjongs = data.holds;
    var pai = game.mahjongs[game.currentIndex];
    mahjongs.push(pai);

    //统计牌的数目 ，用于快速判定（空间换时间）
    var c = data.countMap[pai];
    if (c == null) {
        c = 0;
    }
    data.countMap[pai] = c + 1;
    game.currentIndex++;
    data.shengyu[pai]--;
    return pai;
}

function deal(game) {
    //强制清0
    game.currentIndex = 0;

    //每人13张 一共 13*4 ＝ 52张 庄家多一张 53张
    var seatIndex = game.button;
    for (var i = 0; i < 52; ++i) {
        var mahjongs = game.gameSeats[seatIndex].holds;
        if (mahjongs == null) {
            mahjongs = [];
            game.gameSeats[seatIndex].holds = mahjongs;
        }
        var pai = mopai(game, seatIndex);
        seatIndex++;
        seatIndex %= 4;
    }

    //庄家多摸最后一张
    mopai(game, game.button);
    //当前轮设置为庄家
    game.turn = game.button;
}

//检查是否可以碰
function checkCanPeng(game, seatData, targetPai) {
    // if(getMJType(targetPai) == seatData.que){
    //     return;
    // }

    // if (targetPai == game.jin[0] || targetPai == game.jin[1])
    //     return;
    var count = seatData.countMap[targetPai];
    if (count != null && count >= 2) {
        seatData.canPeng = true;
    }

    if (seatData.tinged) {
        seatData.canPeng = false;
    }
}

//检查是否可以点杠
function checkCanDianGang(game, seatData, targetPai) {
    //检查玩家手上的牌
    //如果没有牌了，则不能再杠
    if (game.mahjongs.length <= game.currentIndex) {
        return;
    }

    var count = seatData.countMap[targetPai];
    if (count != null && count >= 3) {
        seatData.canGang = true;
        seatData.gangPai.push(targetPai);
        return;
    }
    //如果听牌了，杠牌后是否可以继续听
    if (seatData.tinged && seatData.canGang) {
        var tingMap = seatData.tingMap;
        for (var i = 0; i < seatData.gangPai.length; i++) {
            var gp = seatData.gangPai[i];
            seatData.diangangs.push(gp);
            seatData.countMap[gp] -= 3;
            for (var j = 0; j < 3; j++) {
                seatData.holds.splice(seatData.holds.indexOf(gp), 1);
            }
            checkCanTingPai(game, seatData);
            for (var j = 0; j < 3; j++) {
                seatData.holds.push(gp);
            }
            seatData.countMap[gp] += 3;
            seatData.diangangs.pop();
            if (!(Object.keys(seatData.tingMap).length > 0)) {
                seatData.gangPai.splice(seatData.gangPai.indexOf(gp), 1);
            }
        }
        seatData.tingMap = tingMap;
        if (seatData.gangPai.length == 0) {
            seatData.canGang = false;
        }
    }
}

//检查是否可以暗杠
function checkCanAnGang(game, seatData) {
    //如果没有牌了，则不能再杠
    if (game.mahjongs.length <= game.currentIndex) {
        return;
    }

    for (var key in seatData.countMap) {
        var pai = parseInt(key);
        //if(getMJType(pai) != seatData.que){
        var c = seatData.countMap[key];
        if (c != null && c == 4) {
            seatData.canGang = true;
            seatData.gangPai.push(pai);
        }
        //}
    }

    if (seatData.tinged && seatData.canGang) {
        var tingMap = seatData.tingMap;
        for (var i = 0; i < seatData.gangPai.length; i++) {
            var gp = seatData.gangPai[i];
            seatData.angangs.push(gp);
            seatData.countMap[gp] -= 4;
            for (var j = 0; j < 4; j++) {
                seatData.holds.splice(seatData.holds.indexOf(gp), 1);
            }

            checkCanTingPai(game, seatData);
            for (var j = 0; j < 4; j++) {
                seatData.holds.push(gp);
            }
            seatData.countMap[gp] += 4;
            seatData.angangs.pop();
            if (!(Object.keys(seatData.tingMap).length > 0)) {
                seatData.gangPai.splice(seatData.gangPai.indexOf(gp), 1);
            }
        }
        seatData.tingMap = tingMap;
        if (seatData.gangPai.length == 0) {
            seatData.canGang = false;
        }
    }
}

//检查是否可以弯杠(自己摸起来的时候)
function checkCanWanGang(game, seatData) {
    //如果没有牌了，则不能再杠
    if (game.mahjongs.length <= game.currentIndex) {
        return;
    }

    //从碰过的牌中选
    for (var i = 0; i < seatData.pengs.length; ++i) {
        var pai = seatData.pengs[i];
        if (seatData.countMap[pai] == 1) {
            seatData.canGang = true;
            seatData.gangPai.push(pai);
        }
    }

    if (seatData.tinged && seatData.canGang) {
        var tingMap = seatData.tingMap;
        for (var i = 0; i < seatData.gangPai.length; i++) {
            var gp = seatData.gangPai[i];
            seatData.wangangs.push(gp);
            seatData.pengs.splice(seatData.pengs.indexOf(gp), 1);
            seatData.countMap[gp] -= 1;
            seatData.holds.splice(seatData.holds.indexOf(gp), 1);


            checkCanTingPai(game, seatData);
            seatData.pengs.push(gp);
            seatData.holds.push(gp);
            seatData.countMap[gp] += 1;
            seatData.wangangs.pop();
            if (!(Object.keys(seatData.tingMap).length > 0)) {
                seatData.gangPai.splice(seatData.gangPai.indexOf(gp), 1);
            }

        }
        seatData.tingMap = tingMap;
        if (seatData.gangPai.length == 0) {
            seatData.canGang = false;
        }
    }
}

function checkCanHu(game, seatData, targetPai) {
    if (getMJSize(targetPai) <= 2) {
        return;
    }
    game.haozi = false;
    if (seatData.guohu) {
        return;
    }
    if (seatData.tinged) {
        seatData.canHu = false;
        for (var k in seatData.tingMap) {
            if (targetPai == k) {
                seatData.canHu = true;
                break;
            }
        }
        if (isJin(game, targetPai) && Object.keys(seatData.tingMap).length > 0) {
            game.haozi = true;
            seatData.canHu = true;
        }
    }

}

function clearAllOptions(game, seatData) {
    var fnClear = function (sd) {
        sd.canPeng = false;
        sd.canGang = false;
        sd.canTing = false;
        sd.gangPai = [];
        sd.duoyu = [];
        sd.canHu = false;
        sd.lastFangGangSeat = -1;
    }
    if (seatData) {
        fnClear(seatData);
    }
    else {
        game.qiangGangContext = null;
        for (var i = 0; i < game.gameSeats.length; ++i) {
            fnClear(game.gameSeats[i]);
        }
    }
}



function isJin(game, pai) {
    for (var i = 0; i < game.jin.length; i++) {
        if (game.jin[i] == pai) {
            return true;
        }
    }
    return false;
}

//检查听牌
//检查那些牌可以胡
function checkCanTingPai(game, seatData) {

    seatData.tingMap = {};


    var old = [];
    for (var i = 0; i < game.jin.length; i++) {
        if (seatData.countMap[game.jin[i]] != null) {
            old.push(seatData.countMap[game.jin[i]]);
            seatData.countMap[game.jin[i]] = 0;
        }
    }
    seatData.jinCount = 0;
    for (var i = 0; i < old.length; i++) {
        seatData.jinCount += old[i];
    }

    if (seatData.holds.length == 13) {
        //有5对牌
        var hu = false;
        var danPai = [];
        var pairCount = 0;
        var haohua = false;
        for (var k in seatData.countMap) {
            var c = seatData.countMap[k];
            if (c == 2 || c == 3) {
                pairCount++;
            }
            else if (c == 4) {
                pairCount += 2;
                haohua = true;
            }

            if (c == 1 || c == 3) {
                //如果已经有单牌了，表示不止一张单牌，并没有下叫。直接闪

                danPai.push(k);
            }
        }
        /////////////////////////////
        if (danPai.length > seatData.jinCount) {
            pairCount += seatData.jinCount;
            if (pairCount == 6) {
                for (var k = 0; k < danPai.length; k++) {
                    if (haohua) {
                        seatData.tingMap[danPai[k]] = {
                            fan: 4,
                            pattern: "super7pairs"
                        };
                    } else {
                        seatData.tingMap[danPai[k]] = {
                            fan: 2,
                            pattern: "7pairs"
                        };
                    }

                }
                //把金牌给加上
                for (var i = 0; i < game.jin.length; i++) {
                    if (haohua) {
                        seatData.tingMap[game.jin[i]] = {
                            fan: 4,
                            pattern: "super7pairs"
                        }
                    } else {
                        seatData.tingMap[game.jin[i]] = {
                            fan: 2,
                            pattern: "7pairs"
                        }
                    }
                }
            }
        }
        if (danPai.length < seatData.jinCount) {
            pairCount += danPai.length;
            if (pairCount == 6) {
                for (var k = 0; k < 34; k++) {
                    if (haohua) {
                        seatData.tingMap[k] = {
                            fan: 4,
                            pattern: "super7pairs"
                        };
                    } else {
                        seatData.tingMap[k] = {
                            fan: 2,
                            pattern: "7pairs"
                        };
                    }
                }
            }
        }
    }


    mjutils.checkTingPai(seatData, 0, 34, game);
    for (var i = 0; i < old.length; i++) {
        seatData.countMap[game.jin[i]] = old[i];
    }


    var outOfSix = false;
    for (var k in seatData.tingMap) {
        k = parseInt(k);
        // if(isJin(game,k)){
        //     continue;
        // }
        if (getMJSize(k) >= 6) {
            outOfSix = true;
        }
    }
    if (!outOfSix) {
        seatData.tingMap = {};
        return;
    }
    //如果可以听，那么风耗子也可以当听口
    // for (var i = 0; i < game.jin.length; i++) {
    //     seatData.tingMap[i] = {
    //         pattern: "normal",
    //         fan: 0,
    //     };
    // }
}
//检查能不能听牌
function checkCanTing(game, seatData) {
    seatData.canTing = false;
    if (!seatData.tinged) {
        seatData.duoyu = [];
        var canTing = false;
        var holdslength = seatData.holds.length;
        var yu;
        //算法思路：此时手中应该有14张牌，找出打出某一张牌就可以听牌，依次遍历手中的牌，每次将轮到的牌从手中移除，判断可不可以听牌，如果可以将该张牌加入duoyu数组中，将牌恢复到手中
        for (var k in seatData.countMap) {
            if (seatData.countMap && seatData.countMap[k] > 0) {
                yu = parseInt(k);
                seatData.holds.splice(seatData.holds.indexOf(yu), 1);
                seatData.countMap[yu]--;
                checkCanTingPai(game, seatData);
                //如果tingMap中的key数量大于0则表示可以听牌
                if (Object.keys(seatData.tingMap).length > 0) {
                    seatData.duoyu.push(yu);
                    canTing = true;
                }
                seatData.holds.push(yu);
                seatData.countMap[yu]++;
            }
        }

        if (canTing) {
            seatData.canTing = true;
        }
    }
}


function getSeatIndex(userId) {
    var seatIndex = roomMgr.getUserSeat(userId);
    if (seatIndex == null) {
        return null;
    }
    return seatIndex;
}

function getGameByUserID(userId) {
    var roomId = roomMgr.getUserRoom(userId);
    if (roomId == null) {
        return null;
    }
    var game = games[roomId];
    return game;
}

function hasOperations(seatData) {
    if (seatData.canGang || seatData.canPeng || seatData.canHu || seatData.canTing) {
        return true;
    }
    return false;
}

function sendOperations(game, seatData, pai) {
    if (hasOperations(seatData)) {
        if (pai == -1) {
            pai = seatData.holds[seatData.holds.length - 1];
        }

        var data = {
            pai: pai,
            hu: seatData.canHu,
            peng: seatData.canPeng,
            gang: seatData.canGang,
            ting: seatData.canTing,
            gangpai: seatData.gangPai,
            duoyu: seatData.duoyu,
        };

        //如果可以有操作，则进行操作
        userMgr.sendMsg(seatData.userId, 'game_action_push', data);
        data.si = seatData.seatIndex;
    }
    else {
        userMgr.sendMsg(seatData.userId, 'game_action_push');
    }
}

function moveToNextUser(game, nextSeat) {
    game.fangpaoshumu = 0;
    //找到下一个没有和牌的玩家
    if (nextSeat == null) {
        while (true) {
            game.turn++;
            game.turn %= 4;
            var turnSeat = game.gameSeats[game.turn];
            if (turnSeat.hued == false) {
                return;
            }
        }
    }
    else {
        game.turn = nextSeat;
    }
}

function doUserMoPai(game) {
    ///////////////////////////////////////////////////////////////////////////////////////
    game.chuPai = -1;
    game.tinging = false;
    var turnSeat = game.gameSeats[game.turn];
    turnSeat.lastFangGangSeat = -1;
    //turnSeat.guoHuFan = -1;

    var pai = mopai(game, game.turn);



    //牌摸完了，结束
    if (pai == -1) {
        doGameOver(game, turnSeat.userId);
        return;
    }
    else {
        var numOfMJ = game.mahjongs.length - game.currentIndex;
        userMgr.broacastInRoom('mj_count_push', numOfMJ, turnSeat.userId, true);
    }

    recordGameAction(game, game.turn, ACTION_MOPAI, pai);

    //通知前端新摸的牌
    userMgr.sendMsg(turnSeat.userId, 'game_mopai_push', pai);
    //检查是否可以暗杠或者胡
    //检查胡，直杠，弯杠
    checkCanAnGang(game, turnSeat);
    checkCanWanGang(game, turnSeat, pai);

    //检查看是否可以和
    checkCanHu(game, turnSeat, pai);

    checkCanTing(game, turnSeat);
    //广播通知玩家出牌方
    turnSeat.canChuPai = true;
    userMgr.broacastInRoom('game_chupai_push', turnSeat.userId, turnSeat.userId, true);

    //通知玩家做对应操作
    sendOperations(game, turnSeat, game.chuPai);
    //听后自动出牌
    if (turnSeat.tinged) {
        if (!hasOperations(turnSeat)) {
            doChupai(turnSeat, pai);
        }
    }
}

function isSameType(type, arr, jin) {

    for (var i = 0; i < arr.length; ++i) {
        var t = getMJType(arr[i], jin);
        if (t == -1) {
            continue;
        }
        //修改
        var flag = false;
        for (var j = 0; j < jin.length; j++) {
            if (arr[i] == jin[j]) {
                flag = true;
            }
        }
        if (flag) {
            continue;
        }
        //
        if (type != -1 && type != t) {
            return false;
        }
        type = t;
    }
    return true;
}

function isQingYiSe(gameSeatData, jin) {
    var i;
    for (i = 0; i < gameSeatData.holds.length; i++) {
        var flag = true;
        for (var j = 0; j < jin.length; j++) {
            if (gameSeatData.holds[i] == jin[j]) {
                flag = false;
            }
        }
        if (flag) {
            break;
        }
    }
    var type = getMJType(gameSeatData.holds[i], jin);

    //检查手上的牌
    if (isSameType(type, gameSeatData.holds, jin) == false) {
        return false;
    }

    //检查杠下的牌
    if (isSameType(type, gameSeatData.angangs, jin) == false) {
        return false;
    }
    if (isSameType(type, gameSeatData.wangangs, jin) == false) {
        return false;
    }
    if (isSameType(type, gameSeatData.diangangs, jin) == false) {
        return false;
    }

    //检查碰牌
    if (isSameType(type, gameSeatData.pengs, jin) == false) {
        return false;
    }
    return true;
}




function computeFanScore(game, fan) {
    if (fan > game.conf.maxFan) {
        fan = game.conf.maxFan;
    }
    return (1 << fan) * game.conf.baseScore;
}



function findMaxFanTingPai(ts) {
    //找出最大番
    var cur = null;
    for (var k in ts.tingMap) {
        var tpai = ts.tingMap[k];
        if (cur == null || tpai.fan > cur.fan) {
            cur = tpai;
        }
    }
    return cur;
}

function calculateResult(game, roomInfo) {
    var gs = game.gameSeats;
    var hu_index = game.firstHupai;
    var dianpaoSeat;
    for (var i = 0; i < gs.length; i++) {
        gs[i].score = 0;
        gs[i].hufen = 0;
        gs[i].gangfen = 0;
        if (gs[i].dianpao) {
            dianpaoSeat = gs[i];
        }
    }

    var huSeat = gs[game.firstHupai];
    var dian = getMJSize(game.hupai);

    if (huSeat != null) {
        //计算胡分
        huSeat.hufen = dian;
        if (huSeat.iszimo) {
            huSeat.hufen *= 2;
        }

        huSeat.hufen *= 3;
        huSeat.hufen *= game.conf.baseScore;
        if (dianpaoSeat) {
            if (dianpaoSeat.tinged && game.chuPai >= 0 && (!game.tinging)) {
                for (var i = 0; i < gs.length; i++) {
                    if (i != hu_index) {
                        gs[i].hufen = - huSeat.hufen / 3;
                    }
                }
            } else {
                dianpaoSeat.hufen = - huSeat.hufen;
            }
        } else {
            for (var i = 0; i < gs.length; i++) {
                if (i != hu_index) {
                    gs[i].hufen = - huSeat.hufen / 3;
                }
            }
        }

        // if (isQingYiSe(huSeat, game.jin)) {
        //     for (var i = 0; i < game.gameSeats.length; i++) {
        //         game.gameSeats[i].hufen *= 2;
        //     }
        // }
    }
    
    //计算杠分
    for (var i = 0; i < 4; i++) {
        var gsactions = game.gameSeats[i].actions;
        for (var j = 0; j < gsactions.length; j++) {
            if (gsactions[j].type == "angang") {
                for (var s = 0; s < gsactions[j].targets.length; s++) {
                    game.gameSeats[gsactions[j].targets[s]].gangfen -= gsactions[j].score;
                }
                game.gameSeats[i].gangfen += gsactions[j].score * 3;
            }
            if (gsactions[j].type == "diangang" && gsactions[j].targets.length == 1) {
                dianganger = gsactions[j].targets[0];
                if (game.gameSeats[dianganger].tinged) {
                    for (var s = 0; s < game.gameSeats.length; s++) {
                        if (s != i) {
                            game.gameSeats[s].gangfen -= gsactions[j].score;
                        }
                    }
                    game.gameSeats[i].gangfen += gsactions[j].score * 3;
                } else {
                    console.log(gsactions[j].targets);
                    for (var s = 0; s < gsactions[j].targets.length; s++) {
                        game.gameSeats[gsactions[j].targets[s]].gangfen -= gsactions[j].score * 3;
                    }
                    game.gameSeats[i].gangfen += gsactions[j].score * 3;
                }
            }
            if (gsactions[j].type == "wangang") {
                for (var s = 0; s < gsactions[j].targets.length; s++) {
                    game.gameSeats[gsactions[j].targets[s]].gangfen -= gsactions[j].score;
                }
                game.gameSeats[i].gangfen += gsactions[j].score * 3;
            }
        }
    }
    //计算总分
    for (var i = 0; i < 4; i++) {
        game.gameSeats[i].score = game.gameSeats[i].hufen + game.gameSeats[i].gangfen;
    }

}

function doGameOver(game, userId, forceEnd) {
    console.log("do game over!");
    var roomId = roomMgr.getUserRoom(userId);
    console.log("roomid :" + roomId);
    if (roomId == null) {
        return;
    }

    var roomInfo = roomMgr.getRoom(roomId);
    console.log("roomInfo:" + roomInfo);
    if (roomInfo == null) {
        return;
    }

    var results = [];
    var dbresult = [0, 0, 0, 0];

    var fnNoticeResult = function (isEnd) {
        var endinfo = null;
        if (isEnd) {
            endinfo = [];
            //总结束的记分榜信息
            for (var i = 0; i < roomInfo.seats.length; ++i) {
                var rs = roomInfo.seats[i];
                endinfo.push({
                    // numzimo:rs.numZiMo,
                    // numjiepao:rs.numJiePao,
                    // numdianpao:rs.numDianPao,
                    // numangang: rs.numAnGang,
                    // numminggang: rs.numMingGang,
                    // numchadajiao:rs.numChaJiao, 
                });
            }
        }

        userMgr.broacastInRoom('game_over_push', { results: results, endinfo: endinfo }, userId, true);
        console.log("game_over_push");
        //如果局数已够，则进行整体结算，并关闭房间
        if (isEnd) {
            setTimeout(function () {
                if (roomInfo.numOfGames > 1) {
                    store_history(roomInfo);
                }

                userMgr.kickAllInRoom(roomId);
                roomMgr.destroy(roomId);
                db.archive_games(roomInfo.uuid);
            }, 1500);
        }
    }

    console.log("forceEnd :" + forceEnd);
    if (game != null) {
        if (!forceEnd) {
            console.log("========do calculate=======!")
            calculateResult(game, roomInfo);
        }

        for (var i = 0; i < roomInfo.seats.length; ++i) {
            var rs = roomInfo.seats[i];
            var sd = game.gameSeats[i];

            rs.ready = false;
            rs.score += sd.score;
            rs.numZiMo += sd.numZiMo;
            //rs.numJiePao += sd.numJiePao;
            //rs.numDianPao += sd.numDianPao;
            rs.numAnGang += sd.numAnGang;
            rs.numMingGang += sd.numMingGang;
            var userRT = {
                userId: sd.userId,
                pengs: sd.pengs,
                pengslist:sd.pengslist,
                actions: [],
                wangangs: sd.wangangs,
                wangangslist:sd.wangangslist,
                diangangs: sd.diangangs,
                diangangslist:sd.diangangslist,
                angangs: sd.angangs,
                angangslist:sd.angangslist,
                numofgen: sd.numofgen,
                holds: sd.holds,
                fan: sd.fan,
                score: sd.score,
                hufen: sd.hufen,
                gangfen: sd.gangfen,
                totalscore: rs.score,
                pattern: sd.pattern,
                zimo: sd.iszimo,



            };

            for (var k in sd.actions) {
                userRT.actions[k] = {
                    type: sd.actions[k].type,
                };
            }
            results.push(userRT);


            dbresult[i] = sd.score;
            delete gameSeatsOfUsers[sd.userId];
        }
        delete games[roomId];

        var old = roomInfo.nextButton;
        // if(game.yipaoduoxiang >= 0){
        //     roomInfo.nextButton = game.yipaoduoxiang;
        // }else 
        if (game.firstHupai == game.button) {
            roomInfo.nextButton = game.firstHupai;
        }
        else {
            roomInfo.nextButton = (game.button + 1) % 4;
        }

        if (old != roomInfo.nextButton) {
            db.update_next_button(roomId, roomInfo.nextButton);
        }
    }

    if (forceEnd || game == null) {
        fnNoticeResult(true);
    }
    else {
        //保存游戏
        store_game(game, function (ret) {

            db.update_game_result(roomInfo.uuid, game.gameIndex, dbresult);

            //记录打牌信息
            var str = JSON.stringify(game.actionList);
            db.update_game_action_records(roomInfo.uuid, game.gameIndex, str);

            //保存游戏局数
            db.update_num_of_turns(roomId, roomInfo.numOfGames);

            //如果是第一次，并且不是强制解散 则扣除房卡
            if (roomInfo.numOfGames == 1) {
                var cost = 4;
                if (roomInfo.conf.maxGames == 8) {
                    cost = 8;
                }
                if (roomInfo.conf.paytype == 0) {
                    db.cost_gems(roomInfo.conf.creator, cost);
                } else {
                    for (var i = 0; i < 4; i++) {
                        db.cost_gems(game.gameSeats[i].userId, cost / 4);
                    }
                }

            }

            var isEnd = (roomInfo.numOfGames >= roomInfo.conf.maxGames);
            fnNoticeResult(isEnd);
        });
    }
}

function recordUserAction(game, seatData, type, target) {
    var d = { type: type, targets: [] };
    if (target != null) {
        if (typeof (target) == 'number') {
            d.targets.push(target);
        }
        else {
            d.targets = target;
        }
    }
    else {
        for (var i = 0; i < game.gameSeats.length; ++i) {
            var s = game.gameSeats[i];
            if (i != seatData.seatIndex && s.hued == false) {
                d.targets.push(i);
            }
        }
    }

    seatData.actions.push(d);
    return d;
}

function recordGameAction(game, si, action, pai,index1) {
    game.actionList.push(si);
    game.actionList.push(action);
    if (pai != null) {
        game.actionList.push(pai);
    }
    if (index1 != null) {
        game.actionList.push(index1);
    }
}

exports.setReady = function (userId, callback) {
    var roomId = roomMgr.getUserRoom(userId);
    if (roomId == null) {
        return;
    }
    var roomInfo = roomMgr.getRoom(roomId);
    if (roomInfo == null) {
        return;
    }

    roomMgr.setReady(userId, true);

    var game = games[roomId];
    if (game == null) {
        if (roomInfo.seats.length == 4) {
            for (var i = 0; i < roomInfo.seats.length; ++i) {
                var s = roomInfo.seats[i];
                if (s.ready == false || userMgr.isOnline(s.userId) == false) {
                    return;
                }
            }
            //4个人到齐了，并且都准备好了，则开始新的一局
            exports.begin(roomId);
        }
    }
    else {
        var numOfMJ = game.mahjongs.length - game.currentIndex;
        var remainingGames = roomInfo.conf.maxGames - roomInfo.numOfGames;
        var isTing = [];
        var isQiHu = [];
        for (var i = 0; i < game.gameSeats.length; i++) {
            if (game.gameSeats[i].tinged) {
                isTing.push(i);
            }
            if (game.gameSeats[i].guohu) {
                isQiHu.push(i);
            }
        }
        var data = {
            state: game.state,
            numofmj: numOfMJ,
            button: game.button,
            turn: game.turn,
            chuPai: game.chuPai,
            isTing: isTing,
            isQiHu: isQiHu,
            jin: game.jin,
            //huanpaimethod:game.huanpaiMethod
        };

        data.seats = [];
        var seatData = null;
        for (var i = 0; i < 4; ++i) {
            var sd = game.gameSeats[i];

            var s = {
                userid: sd.userId,
                folds: sd.folds,
                angangs: sd.angangs,
                angangslist:sd.angangslist,
                diangangs: sd.diangangs,
                diangangslist:sd.diangangslist,
                wangangs: sd.wangangs,
                wangangslist:sd.wangangslist,
                pengs: sd.pengs,
                pengslist:sd.pengslist,
                //que:sd.que,
                hued: sd.hued,
                tinged: sd.tinged,
                //iszimo:sd.iszimo,
            };
            if (sd.userId == userId) {
                s.holds = sd.holds;
                //s.huanpais = sd.huanpais;
                seatData = sd;
            }
            // else {
            //     // s.huanpais = sd.huanpais ? [] : null;
            // }
            data.seats.push(s);
        }

        //同步整个信息给客户端
        userMgr.sendMsg(userId, 'game_sync_push', data);
        sendOperations(game, seatData, game.chuPai);
    }
}

function store_single_history(userId, history) {
    db.get_user_history(userId, function (data) {
        if (data == null) {
            data = [];
        }
        while (data.length >= 10) {
            data.shift();
        }
        data.push(history);
        db.update_user_history(userId, data);
    });
}

function store_history(roomInfo) {
    var seats = roomInfo.seats;
    var history = {
        uuid: roomInfo.uuid,
        id: roomInfo.id,
        time: roomInfo.createTime,
        seats: new Array(4)
    };

    for (var i = 0; i < seats.length; ++i) {
        var rs = seats[i];
        var hs = history.seats[i] = {};
        hs.userid = rs.userId;
        hs.name = crypto.toBase64(rs.name);
        hs.score = rs.score;
    }

    for (var i = 0; i < seats.length; ++i) {
        var s = seats[i];
        store_single_history(s.userId, history);
    }
}

function construct_game_base_info(game) {
    var baseInfo = {
        type: game.conf.type,
        button: game.button,
        index: game.gameIndex,
        mahjongs: game.mahjongs,
        jin: game.jin,
        game_seats: new Array(4)
    }

    for (var i = 0; i < 4; ++i) {
        baseInfo.game_seats[i] = game.gameSeats[i].holds;
    }
    game.baseInfoJson = JSON.stringify(baseInfo);
}

function store_game(game, callback) {
    db.create_game(game.roomInfo.uuid, game.gameIndex, game.baseInfoJson, callback);
}

//开始新的一局
exports.begin = function (roomId) {
    console.log("begin start==============" + roomId);
    var roomInfo = roomMgr.getRoom(roomId);
    if (roomInfo == null) {
        return;
    }
    var seats = roomInfo.seats;

    var game = {
        conf: roomInfo.conf,
        roomInfo: roomInfo,
        gameIndex: roomInfo.numOfGames,

        button: roomInfo.nextButton,
        mahjongs: new Array(136),
        currentIndex: 0,
        gameSeats: new Array(4),

        jin: [],

        //numOfQue:0,
        turn: 0,
        chuPai: -1,
        state: "idle",
        firstHupai: -1,
        //yipaoduoxiang:-1,
        //fangpaoshumu:-1,
        actionList: [],
        hupaiList: [],
        chupaiCnt: 0,
    };


    roomInfo.numOfGames++;

    for (var i = 0; i < 4; ++i) {

        var data = game.gameSeats[i] = {};

        data.game = game;

        data.seatIndex = i;

        data.userId = seats[i].userId;
        //持有的牌
        data.holds = [];
        //打出的牌
        data.folds = [];
        //暗杠的牌
        data.angangs = [];
        data.angangslist = [];
        //点杠的牌
        data.diangangs = [];
        data.diangangslist = [];
        //弯杠的牌
        data.wangangs = [];
        data.wangangslist = [];
        //碰了的牌
        data.pengs = [];
        data.pengslist = [];

        data.duoyu = [];
        //缺一门
        //data.que = -1;

        //换三张的牌
        //data.huanpais = null;

        //玩家手上的牌的数目，用于快速判定碰杠
        data.countMap = {};
        //玩家听牌，用于快速判定胡了的番数
        data.tingMap = {};
        data.shengyu = new Array(27);
        data.pattern = "";

        //是否可以杠
        data.canGang = false;
        //用于记录玩家可以杠的牌
        data.gangPai = [];

        //是否可以碰
        data.canPeng = false;
        //是否可以胡
        data.canHu = false;
        //是否可以出牌
        data.canChuPai = false;

        data.canTing = false;

        data.tinged = false;
        data.guohu = false;

        //如果guoHuFan >=0 表示处于过胡状态，
        //如果过胡状态，那么只能胡大于过胡番数的牌
        //data.guoHuFan = -1;

        //是否胡了
        data.hued = false;
        //是否是自摸
        data.iszimo = false;

        data.dianpao = false;

        //data.isGangHu = false;

        data.actions = [];

        //data.fan = 0;
        data.score = 0;
        data.lastFangGangSeat = -1;

        //统计信息
        //data.numZiMo = 0;
        //data.numJiePao = 0;
        //data.numDianPao = 0;
        data.numAnGang = 0;
        data.numMingGang = 0;
        //data.numChaJiao = 0;

        data.gangfen = 0;
        data.hufen = 0;

        gameSeatsOfUsers[data.userId] = data;
    }
    games[roomId] = game;
    for(var j=0;j<game.gameSeats.length;j++){
        for(var i=0;i<game.gameSeats[j].shengyu.length;i++){
            game.gameSeats[j].shengyu[i]=4;
        }
    }
    //洗牌
    shuffle(game);

    //发牌
    deal(game);



    var numOfMJ = game.mahjongs.length - game.currentIndex;
    //var huansanzhang = roomInfo.conf.hsz;

    for (var i = 0; i < seats.length; ++i) {
        //开局时，通知前端必要的数据
        var s = seats[i];
        //通知玩家手牌
        userMgr.sendMsg(s.userId, 'game_holds_push', game.gameSeats[i].holds);
        //通知还剩多少张牌
        userMgr.sendMsg(s.userId, 'mj_count_push', numOfMJ);
        //通知还剩多少局
        userMgr.sendMsg(s.userId, 'game_num_push', roomInfo.numOfGames);
        //通知游戏开始
        userMgr.sendMsg(s.userId, 'game_begin_push', game.button);

        // if(huansanzhang == true){
        //     game.state = "huanpai";
        //     //通知准备换牌
        //     userMgr.sendMsg(s.userId,'game_huanpai_push');
        // }
        // else{
        //     game.state = "dingque";
        //     //通知准备定缺
        //     userMgr.sendMsg(s.userId,'game_dingque_push');
        // }

    }
    construct_game_base_info(game);
    userMgr.broacastInRoom('game_getjin_push', game.jin, seats[0].userId, true);

    userMgr.broacastInRoom('game_ready_finish_push', null, seats[0].userId, true);
    userMgr.broacastInRoom('game_playing_push', null, seats[0].userId, true);


    //进行听牌检查
    for (var i = 0; i < game.gameSeats.length; ++i) {
        var duoyu = -1;
        var gs = game.gameSeats[i];
        if (gs.holds.length == 14) {
            duoyu = gs.holds.pop();
            gs.countMap[duoyu] -= 1;
        }
        checkCanTingPai(game, gs);
        if (duoyu >= 0) {
            gs.holds.push(duoyu);
            gs.countMap[duoyu]++;
        }
    }

    var turnSeat = game.gameSeats[game.turn];
    game.state = "playing";
    turnSeat.canChuPai = true;
    userMgr.broacastInRoom("game_chupai_push", turnSeat.userId, turnSeat.userId, true);
    checkCanAnGang(game, turnSeat);
    checkCanHu(game, turnSeat, turnSeat.holds[turnSeat.holds.length - 1]);
    checkCanTing(game, turnSeat);
    sendOperations(game, turnSeat, game.chuPai);
    console.log("begin end=================");
};


function doChupai(seatData, pai) {

    pai = Number.parseInt(pai);

    var game = seatData.game;
    var seatIndex = seatData.seatIndex;
    //如果不该他出，则忽略
    if (game.turn != seatData.seatIndex) {
        console.log("not your turn.");
        return;
    }

    if (seatData.canChuPai == false) {
        console.log('no need chupai.');
        return;
    }

    if (hasOperations(seatData)) {
        console.log('plz guo before you chupai.');
        return;
    }

    //从此人牌中扣除
    var index = seatData.holds.indexOf(pai);
    if (index == -1) {
        console.log("holds:" + seatData.holds);
        console.log("can't find mj." + pai);
        return;
    }


    seatData.canChuPai = false;
    game.chupaiCnt++;
    for(var t=0;t<game.gameSeats.length;t++){
        if(t==seatData.seatIndex)
        continue;
        else game.gameSeats[t].shengyu[pai]--;

    }
    //seatData.guoHuFan = -1;

    seatData.holds.splice(index, 1);
    seatData.countMap[pai]--;
    game.chuPai = pai;

    if (!game.tinging) {
        recordGameAction(game, seatData.seatIndex, ACTION_CHUPAI, pai);
    }


    checkCanTingPai(game, seatData);

    userMgr.broacastInRoom('game_chupai_notify_push', { userId: seatData.userId, pai: pai }, seatData.userId, true);

    //如果出的牌可以胡，则算过胡
    // if(seatData.tingMap[game.chuPai]){
    //     seatData.guoHuFan = seatData.tingMap[game.chuPai].fan;
    // }

    //检查是否有人要胡，要碰 要杠
    var hasActions = false;
    for (var i = 0; i < game.gameSeats.length; ++i) {

        if (game.turn == i) {
            continue;
        }
        var ddd = game.gameSeats[i];
        if (!isJin(game, pai)) {
            if (getMJSize(pai) >= 6) {
                checkCanHu(game, ddd, pai);
            }


        }
        checkCanPeng(game, ddd, pai);
        checkCanDianGang(game, ddd, pai);
        if (hasOperations(ddd)) {
            sendOperations(game, ddd, game.chuPai);
            hasActions = true;
        }
    }

    //如果没有人有操作，则向下一家发牌，并通知他出牌
    if (!hasActions) {
        setTimeout(function () {
            userMgr.broacastInRoom('guo_notify_push', { userId: seatData.userId, pai: game.chuPai }, seatData.userId, true);
            seatData.folds.push(game.chuPai);
            game.chuPai = -1;
            moveToNextUser(game);
            doUserMoPai(game);
        }, 100);
    }
};

exports.chuPai = function (userId, pai) {
    var seatData = gameSeatsOfUsers[userId];
    if (seatData == null) {
        console.log("can't find user game data.");
        return;
    }
    if (seatData.tinged) {
        return;
    }
    doChupai(seatData, pai);
};

exports.peng = function (userId) {
    var seatData = gameSeatsOfUsers[userId];
    if (seatData == null) {
        console.log("can't find user game data.");
        return;
    }

    var game = seatData.game;

    //如果是他出的牌，则忽略
    if (game.turn == seatData.seatIndex) {
        console.log("it's your turn.");
        return;
    }

    //如果没有碰的机会，则不能再碰
    if (seatData.canPeng == false) {
        console.log("seatData.peng == false");
        return;
    }

    /*//和的了，就不要再来了
    if(seatData.hued){
        console.log('you have already hued. no kidding plz.');
        return;
    }*/

    //如果有人可以胡牌，则需要等待
    var i = game.turn;
    var index1 = game.turn;
    while (true) {
        var i = (i + 1) % 4;
        if (i == game.turn) {
            break;
        }
        else {
            var ddd = game.gameSeats[i];
            if (ddd.canHu && i != seatData.seatIndex) {
                return;
            }
        }
    }

    clearAllOptions(game);

    //验证手上的牌的数目
    var pai = game.chuPai;
    var c = seatData.countMap[pai];
    if (c == null || c < 2) {
        console.log("pai:" + pai + ",count:" + c);
        console.log(seatData.holds);
        console.log("lack of mj.");
        return;
    }

    //进行碰牌处理
    //扣掉手上的牌
    //从此人牌中扣除
    for (var i = 0; i < 2; ++i) {
        var index = seatData.holds.indexOf(pai);
        if (index == -1) {
            console.log("can't find mj.");
            return;
        }
        seatData.holds.splice(index, 1);
        seatData.countMap[pai]--;
        for(var t=0;t<game.gameSeats.length;t++){
            if(t==seatData.seatIndex)
            continue;
            else game.gameSeats[t].shengyu[pai]--;
    
        }
    }
    seatData.pengs.push(pai);
    seatData.pengslist.push(index1);
    game.chuPai = -1;

    recordGameAction(game, seatData.seatIndex, ACTION_PENG, pai,index1);

    //广播通知其它玩家
    userMgr.broacastInRoom('peng_notify_push', { userid: seatData.userId, pai: pai,index1:index1 }, seatData.userId, true);

    //碰的玩家打牌
    moveToNextUser(game, seatData.seatIndex);

    //广播通知玩家出牌方
    seatData.canChuPai = true;
    userMgr.broacastInRoom('game_chupai_push', seatData.userId, seatData.userId, true);
    checkCanTing(game, seatData);
    if (seatData.canTing) {
        sendOperations(game, seatData, game.chuPai);
    }

};

exports.isPlaying = function (userId) {
    var seatData = gameSeatsOfUsers[userId];
    if (seatData == null) {
        return false;
    }

    var game = seatData.game;

    if (game.state == "idle") {
        return false;
    }
    return true;
}

function checkCanQiangGang(game, turnSeat, seatData, pai) {
    var hasActions = false;
    for (var i = 0; i < game.gameSeats.length; ++i) {
        //杠牌者不检查
        if (seatData.seatIndex == i) {
            continue;
        }
        var ddd = game.gameSeats[i];
        //已经和牌的不再检查
        if (ddd.hued) {
            continue;
        }

        checkCanHu(game, ddd, pai);
        if (ddd.canHu) {
            sendOperations(game, ddd, pai);
            hasActions = true;
        }
    }
    if (hasActions) {
        game.qiangGangContext = {
            turnSeat: turnSeat,
            seatData: seatData,
            pai: pai,
            isValid: true,
        }
    }
    else {
        game.qiangGangContext = null;
    }
    return game.qiangGangContext != null;
}

function doGang(game, turnSeat, seatData, gangtype, numOfCnt, pai) {
    var seatIndex = seatData.seatIndex;
    var gameTurn = turnSeat.seatIndex;
    var index1 = game.turn;

    if (gangtype == "wangang") {
        var idx = seatData.pengs.indexOf(pai);
        if (idx >= 0) {
            seatData.pengs.splice(idx, 1);
            seatData.pengslist.splice(idx,1);
        }
    }
    //进行碰牌处理
    //扣掉手上的牌
    //从此人牌中扣除
    for (var i = 0; i < numOfCnt; ++i) {
        var index = seatData.holds.indexOf(pai);
        if (index == -1) {
            console.log(seatData.holds);
            console.log("can't find mj.");
            return;
        }
        seatData.holds.splice(index, 1);
        seatData.countMap[pai]--;
        for(var t=0;t<game.gameSeats.length;t++){
            if(t==seatData.seatIndex)
            continue;
            else game.gameSeats[t].shengyu[pai]--;
    
        }
    }

    recordGameAction(game, seatData.seatIndex, ACTION_GANG, pai,index1);

    //记录下玩家的杠牌
    if (gangtype == "angang") {
        seatData.angangs.push(pai);
        seatData.angangslist.push(index1);
        var ac = recordUserAction(game, seatData, "angang");
        if (isJin(game, pai)) {
            ac.score = 40 * game.conf.baseScore;
        } else {
            ac.score = getMJSize(pai) * 2 * game.conf.baseScore;
        }
    }
    else if (gangtype == "diangang") {
        seatData.diangangs.push(pai);
        seatData.diangangslist.push(index1);
        var fs = turnSeat;
        var ac = recordUserAction(game, seatData, "diangang", fs.seatIndex);

        if (isJin(game, pai)) {
            ac.score = 20 * game.conf.baseScore;
        } else {
            ac.score = game.conf.baseScore * getMJSize(pai);
        }


        recordUserAction(game, fs, "fanggang", seatIndex);
    }
    else if (gangtype == "wangang") {
        seatData.wangangs.push(pai);
        seatData.wangangslist.push(index1);
        var ac = recordUserAction(game, seatData, "wangang");
        if (isJin(game, pai)) {
            ac.score = 20 * game.conf.baseScore;
        } else {
            ac.score = game.conf.baseScore * getMJSize(pai);
        }

    }

    checkCanTingPai(game, seatData);
    //通知其他玩家，有人杠了牌
    userMgr.broacastInRoom('gang_notify_push', { userid: seatData.userId, pai: pai, gangtype: gangtype,index1:index1 }, seatData.userId, true);

    //变成自己的轮子
    moveToNextUser(game, seatIndex);
    //再次摸牌
    doUserMoPai(game);

    //只能放在这里。因为过手就会清除杠牌标记
    seatData.lastFangGangSeat = gameTurn;
}

exports.ting = function (userId, pai) {
    var seatData = gameSeatsOfUsers[userId];
    if (seatData == null) {
        console.log("can't find user game data.");
        return;
    }
    var seatIndex = seatData.seatIndex;
    var game = seatData.game;

    if (seatData.canTing == false) {
        return;
    }

    if (seatData.duoyu.indexOf(pai) == -1) {
        console.log("the given pai can't be ganged.");
        return;
    }

    if (seatIndex != game.turn) {
        return;
    }

    if (seatData.tinged) {
        return;
    }

    if (seatData.canChuPai == false) {
        console.log('no need chupai.');
        return;
    }


    if (!game.conf.isBaoTing) {
        seatData.tinged = true;
        game.tinging = true;
        checkCanTingPai(game, seatData);
        userMgr.broacastInRoom('game_ting_notify_push', { userId: seatData.userId, pai: pai, isBaoTing: game.conf.isBaoTing }, seatData.userId, true);
        recordGameAction(game, seatData.seatIndex, ACTION_TING, pai);
        clearAllOptions(game);
        doChupai(seatData, pai);
    } else {

        //从此人牌中扣除
        var index = seatData.holds.indexOf(pai);
        if (index == -1) {
            console.log("holds:" + seatData.holds);
            console.log("can't find mj." + pai);
            return;
        }


        seatData.canChuPai = false;
        game.chupaiCnt++;

        seatData.holds.splice(index, 1);
        seatData.countMap[pai]--;
        seatData.tinged = true;
        game.chuPai = -2;
        checkCanTingPai(game, seatData);
        userMgr.broacastInRoom('game_ting_notify_push', { userId: seatData.userId, pai: pai, isBaoTing: game.conf.isBaoTing }, seatData.userId, true);
        recordGameAction(game, seatData.seatIndex, ACTION_TING, pai);
        clearAllOptions(game);
        setTimeout(function () {
            userMgr.broacastInRoom('guo_notify_push', { userId: seatData.userId, pai: game.chuPai }, seatData.userId, true);
            seatData.folds.push(game.chuPai);
            game.chuPai = -1;
            moveToNextUser(game);
            doUserMoPai(game);
        }, 500);
    }
}

exports.gang = function (userId, pai) {
    console.log("gang=============" + userId + "       " + pai);
    var seatData = gameSeatsOfUsers[userId];
    if (seatData == null) {
        console.log("can't find user game data.");
        return;
    }

    var seatIndex = seatData.seatIndex;
    var game = seatData.game;

    //如果没有杠的机会，则不能再杠
    if (seatData.canGang == false) {
        console.log("seatData.gang == false");
        return;
    }

    if (seatData.gangPai.indexOf(pai) == -1) {
        console.log("the given pai can't be ganged.");
        return;
    }

    //如果有人可以胡牌，则需要等待
    var i = game.turn;
    while (true) {
        var i = (i + 1) % 4;
        if (i == game.turn) {
            break;
        }
        else {
            var ddd = game.gameSeats[i];
            if (ddd.canHu && i != seatData.seatIndex) {
                return;
            }
        }
    }

    var numOfCnt = seatData.countMap[pai];

    var gangtype = "";
    // 弯杠 去掉碰牌
    if (numOfCnt == 1) {
        gangtype = "wangang";
    }
    else if (numOfCnt == 3) {
        gangtype = "diangang";
    }
    else if (numOfCnt == 4) {
        gangtype = "angang";
    }
    else {
        console.log("invalid pai count.");
        return;
    }

    game.chuPai = -1;
    clearAllOptions(game);
    seatData.canChuPai = false;

    userMgr.broacastInRoom('hangang_notify_push', seatIndex, seatData.userId, true);

    //如果是弯杠，则需要检查是否可以抢杠
    var turnSeat = game.gameSeats[game.turn];
    if (numOfCnt == 1) {
        var canQiangGang = checkCanQiangGang(game, turnSeat, seatData, pai);
        if (canQiangGang) {
            return;
        }
    }

    doGang(game, turnSeat, seatData, gangtype, numOfCnt, pai);

};

exports.hu = function (userId) {

    var seatData = gameSeatsOfUsers[userId];
    if (seatData == null) {
        console.log("can't find user game data.");
        return;
    }

    var seatIndex = seatData.seatIndex;
    var game = seatData.game;

    //截胡
    for (var i = (game.turn + 1) % game.gameSeats.length; i < game.turn + game.gameSeats.length; i++) {
        if (i == seatData.seatIndex) {
            break;
        } else {
            if (game.gameSeats[i % game.gameSeats.length].canHu) {
                return;
            }
        }
    }

    //如果他不能和牌，那和个啥啊
    if (seatData.canHu == false) {
        console.log("invalid request.");
        return;
    }
    if (!seatData.tinged) {
        return;
    }


    //标记为和牌
    seatData.hued = true;

    game.firstHupai = seatIndex;

    var hupai = game.chuPai;
    var isZimo = false;

    var turnSeat = game.gameSeats[game.turn];

    var notify = -1;

    if (game.qiangGangContext != null) {
        var gangSeat = game.qiangGangContext.seatData;
        gangSeat.dianpao = true;
        hupai = game.qiangGangContext.pai;
        notify = hupai;
        var ac = recordUserAction(game, seatData, "qiangganghu", gangSeat.seatIndex);
        ac.iszimo = false;
        recordGameAction(game, seatIndex, ACTION_HU, hupai);
        seatData.isQiangGangHu = true;
        game.qiangGangContext.isValid = false;


        var idx = gangSeat.holds.indexOf(hupai);
        if (idx != -1) {
            gangSeat.holds.splice(idx, 1);
            gangSeat.countMap[hupai]--;
            userMgr.sendMsg(gangSeat.userId, 'game_holds_push', gangSeat.holds);
        }
        //将牌添加到玩家的手牌列表，供前端显示
        seatData.holds.push(hupai);
        if (seatData.countMap[hupai]) {
            seatData.countMap[hupai]++;
        }
        else {
            seatData.countMap[hupai] = 1;
        }

        recordUserAction(game, gangSeat, "beiqianggang", seatIndex);
    }
    else if (game.chuPai == -1) {
        hupai = seatData.holds[seatData.holds.length - 1];
        notify = -1;

        var ac = recordUserAction(game, seatData, "zimo");
        ac.isZimo = true;

        seatData.iszimo = true;
        isZimo = true;
        recordGameAction(game, seatIndex, ACTION_ZIMO, hupai);
    }
    else {
        notify = game.chuPai;
        //将牌添加到玩家的手牌列表，供前端显示
        seatData.holds.push(game.chuPai);
        if (seatData.countMap[game.chuPai]) {
            seatData.countMap[game.chuPai]++;
        }
        else {
            seatData.countMap[game.chuPai] = 1;
        }
        turnSeat.dianpao = true;

        console.log(seatData.holds);

        var at = "hu";

    }
    game.hupai = hupai;




    clearAllOptions(game, seatData);

    //通知前端，有人和牌了
    userMgr.broacastInRoom('hu_push', { seatindex: seatIndex, iszimo: isZimo, hupai: notify }, seatData.userId, true);


    doGameOver(game, seatData.userId);
    //清空所有非胡牌操作


};

exports.guo = function (userId) {
    console.log("guo=================================" + userId);
    var seatData = gameSeatsOfUsers[userId];
    if (seatData == null) {
        console.log("can't find user game data.");
        return;
    }

    var seatIndex = seatData.seatIndex;
    var game = seatData.game;

    //如果玩家没有对应的操作，则也认为是非法消息
    if ((seatData.canGang || seatData.canPeng || seatData.canHu || seatData.canTing) == false) {
        console.log("no need guo.");
        return;
    }

    if (seatData.canHu) {
        // userMgr.sendMsg(seatData.userId,"guo_hu_notify_push");
        userMgr.broacastInRoom("guo_hu_notify_push", seatData.userId, seatData.userId, true);
        seatData.guohu = true;
    }

    //如果是玩家自己的轮子，不是接牌，则不需要额外操作
    var doNothing = game.chuPai == -1 && game.turn == seatIndex;

    userMgr.sendMsg(seatData.userId, "guo_result");
    //自摸过，需要自动出牌
    clearAllOptions(game, seatData);
    if (seatData.tinged && doNothing) {
        doChupai(seatData, seatData.holds[seatData.holds.length - 1]);
    }


    if (doNothing) {
        return;
    }

    //如果还有人可以操作，则等待
    for (var i = 0; i < game.gameSeats.length; ++i) {
        var ddd = game.gameSeats[i];
        if (hasOperations(ddd)) {
            return;
        }
    }

    //如果是已打出的牌，则需要通知。
    if (game.chuPai >= 0) {
        var uid = game.gameSeats[game.turn].userId;
        userMgr.broacastInRoom('guo_notify_push', { userId: uid, pai: game.chuPai }, seatData.userId, true);
        seatData.folds.push(game.chuPai);
        game.chuPai = -1;
    }

    var qiangGangContext = game.qiangGangContext;
    //清除所有的操作
    clearAllOptions(game);

    if (qiangGangContext != null && qiangGangContext.isValid) {
        doGang(game, qiangGangContext.turnSeat, qiangGangContext.seatData, "wangang", 1, qiangGangContext.pai);
    }
    else {
        //下家摸牌
        moveToNextUser(game);
        doUserMoPai(game);
    }
};

exports.hasBegan = function (roomId) {
    var game = games[roomId];
    if (game != null) {
        return true;
    }
    var roomInfo = roomMgr.getRoom(roomId);
    if (roomInfo != null) {
        return roomInfo.numOfGames > 0;
    }
    return false;
};


var dissolvingList = [];

exports.doDissolve = function (roomId) {
    var roomInfo = roomMgr.getRoom(roomId);
    if (roomInfo == null) {
        return null;
    }

    var game = games[roomId];
    doGameOver(game, roomInfo.seats[0].userId, true);
};

exports.dissolveRequest = function (roomId, userId) {
    var roomInfo = roomMgr.getRoom(roomId);
    if (roomInfo == null) {
        return null;
    }

    if (roomInfo.dr != null) {
        return null;
    }

    var seatIndex = roomMgr.getUserSeat(userId);
    if (seatIndex == null) {
        return null;
    }

    roomInfo.dr = {
        endTime: Date.now() + 180000,
        states: [false, false, false, false]
    };
    roomInfo.dr.states[seatIndex] = true;

    dissolvingList.push(roomId);

    return roomInfo;
};

exports.dissolveAgree = function (roomId, userId, agree) {
    var roomInfo = roomMgr.getRoom(roomId);
    if (roomInfo == null) {
        return null;
    }

    if (roomInfo.dr == null) {
        return null;
    }

    var seatIndex = roomMgr.getUserSeat(userId);
    if (seatIndex == null) {
        return null;
    }

    if (agree) {
        roomInfo.dr.states[seatIndex] = true;
    }
    else {
        roomInfo.dr = null;
        var idx = dissolvingList.indexOf(roomId);
        if (idx != -1) {
            dissolvingList.splice(idx, 1);
        }
    }
    return roomInfo;
};



function update() {
    for (var i = dissolvingList.length - 1; i >= 0; --i) {
        var roomId = dissolvingList[i];

        var roomInfo = roomMgr.getRoom(roomId);
        if (roomInfo != null && roomInfo.dr != null) {
            if (Date.now() > roomInfo.dr.endTime) {
                console.log("delete room and games");
                exports.doDissolve(roomId);
                dissolvingList.splice(i, 1);
            }
        }
        else {
            dissolvingList.splice(i, 1);
        }
    }
}

setInterval(update, 1000);

exports.checkCanTing = checkCanTing;
exports.checkCanTingPai = checkCanTingPai;
exports.isQingYiSe = isQingYiSe;
