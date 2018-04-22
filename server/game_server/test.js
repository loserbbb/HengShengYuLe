var gamemgr = require("./gamemgr_kdd");
// 麻将类型 筒: 0-8, 条: 9-17, 万: 18-26, 风: 27-30, 箭: 31-33

// 7 5        peng 24 gang 26     holds   18,18,19,20,7,5,21,21
var seatData = {
    countMap:{},
    holds:[18,18,19,20,7,5,21,21],
    pengs:[24],
    diangangs:[7],
    angangs:[],
    wangangs:[],
    tinged:false,
}
var game = {
    jin:[7,5],
}

function initConutMap(seatData){
    for(var i = 0;i < seatData.holds.length;i++){
        if(seatData.countMap[seatData.holds[i]] == null){
            seatData.countMap[seatData.holds[i]] = 1; 
        }else{
            seatData.countMap[seatData.holds[i]]++;
        }
    }
}

initConutMap(seatData);
// gamemgr.checkCanTing(game,seatData);
// console.log(seatData);
// gamemgr.checkCanTingPai(game,seatData);
// console.log(seatData);

console.log(gamemgr.isQingYiSe(seatData,game.jin));