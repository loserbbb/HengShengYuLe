var mysql = require("mysql");
var crypto = require('./crypto');

var pool = null;

function nop(a, b, c, d, e, f, g) {

}

function query(sql, callback) {
    pool.getConnection(function (err, conn) {
        if (err) {
            callback(err, null, null);
        } else {
            conn.query(sql, function (qerr, vals, fields) {
                //释放连接  
                conn.release();
                //事件驱动回调  
                callback(qerr, vals, fields);
            });
        }
    });
};

exports.init = function (config) {
    pool = mysql.createPool({
        host: config.HOST,
        user: config.USER,
        password: config.PSWD,
        database: config.DB,
        port: config.PORT,
    });
};

exports.is_account_exist = function (account, callback) {
    callback = callback == null ? nop : callback;
    if (account == null) {
        callback(false);
        return;
    }

    var sql = 'SELECT * FROM t_accounts WHERE account = "' + account + '"';
    console.log(sql);
    query(sql, function (err, rows, fields) {
        if (err) {
            callback(false);
            throw err;
        }
        else {
            if (rows.length > 0) {
                callback(true);
            }
            else {
                callback(false);
            }
        }
    });
};

exports.create_account = function (account, password, callback) {
    callback = callback == null ? nop : callback;
    if (account == null || password == null) {
        callback(false);
        return;
    }

    var psw = crypto.md5(password);
    var sql = 'INSERT INTO t_accounts(account,password) VALUES("' + account + '","' + psw + '")';
    console.log(sql);
    query(sql, function (err, rows, fields) {
        if (err) {
            if (err.code == 'ER_DUP_ENTRY') {
                callback(false);
                return;
            }
            callback(false);
            throw err;
        }
        else {
            callback(true);
        }
    });
};

exports.get_account_info = function (account, password, callback) {
    callback = callback == null ? nop : callback;
    if (account == null) {
        callback(null);
        return;
    }

    var sql = 'SELECT * FROM t_accounts WHERE account = "' + account + '"';
    console.log(sql);
    query(sql, function (err, rows, fields) {
        if (err) {
            callback(null);
            throw err;
        }

        if (rows.length == 0) {
            callback(null);
            return;
        }

        if (password != null) {
            var psw = crypto.md5(password);
            if (rows[0].password == psw) {
                callback(null);
                return;
            }
        }

        callback(rows[0]);
    });
};

exports.is_user_exist = function (account, callback) {
    callback = callback == null ? nop : callback;
    if (account == null) {
        callback(false);
        return;
    }

    var sql = 'SELECT userid FROM t_users WHERE account = "' + account + '"';
    console.log(sql);
    query(sql, function (err, rows, fields) {
        if (err) {
            throw err;
        }

        if (rows.length == 0) {
            callback(false);
            return;
        }

        callback(true);
    });
}


exports.get_user_data = function (account, callback) {
    callback = callback == null ? nop : callback;
    if (account == null) {
        callback(null);
        return;
    }

    var sql = 'SELECT userid,account,name,lv,exp,coins,gems,roomid FROM t_users WHERE account = "' + account + '"';
    console.log(sql);
    query(sql, function (err, rows, fields) {
        if (err) {
            callback(null);
            throw err;
        }

        if (rows.length == 0) {
            callback(null);
            return;
        }
        rows[0].name = crypto.fromBase64(rows[0].name);
        callback(rows[0]);
    });
};

exports.get_user_data_by_userid = function (userid, callback) {
    callback = callback == null ? nop : callback;
    if (userid == null) {
        callback(null);
        return;
    }

    var sql = 'SELECT userid,account,name,lv,exp,coins,gems,roomid FROM t_users WHERE userid = ' + userid;
    console.log(sql);
    query(sql, function (err, rows, fields) {
        if (err) {
            callback(null);
            throw err;
        }

        if (rows.length == 0) {
            callback(null);
            return;
        }
        rows[0].name = crypto.fromBase64(rows[0].name);
        callback(rows[0]);
    });
};

/**增加玩家房卡 */
exports.add_user_gems = function (userid, gems, callback) {
    callback = callback == null ? nop : callback;
    if (userid == null) {
        callback(false);
        return;
    }

    var sql = 'UPDATE t_users SET gems = gems+' + gems + ' WHERE userid = ' + userid;
    console.log(sql);
    query(sql, function (err, rows, fields) {
        if (err) {
            console.log(err);
            callback(false);
            return;
        }
        else {
            callback(rows.affectedRows > 0);
            return;
        }
    });
};

exports.get_gems = function (account, callback) {
    callback = callback == null ? nop : callback;
    if (account == null) {
        callback(null);
        return;
    }

    var sql = 'SELECT gems FROM t_users WHERE account = "' + account + '"';
    console.log(sql);
    query(sql, function (err, rows, fields) {
        if (err) {
            callback(null);
            throw err;
        }

        if (rows.length == 0) {
            callback(null);
            return;
        }

        callback(rows[0]);
    });
};

exports.get_gems_by_userId = function (userId, callback) {
    callback = callback == null ? nop : callback;
    if (userId == null) {
        callback(null);
        return;
    }

    var sql = 'SELECT gems FROM t_users WHERE userid = ' + userId;
    console.log(sql);
    query(sql, function (err, rows, fields) {
        if (err) {
            callback(null);
            throw err;
        }

        if (rows.length == 0) {
            callback(null);
            return;
        }

        callback(rows[0]);
    });
};


exports.get_user_history = function (userId, callback) {
    callback = callback == null ? nop : callback;
    if (userId == null) {
        callback(null);
        return;
    }

    var sql = 'SELECT history FROM t_users WHERE userid = "' + userId + '"';
    console.log(sql);
    query(sql, function (err, rows, fields) {
        if (err) {
            callback(null);
            throw err;
        }

        if (rows.length == 0) {
            callback(null);
            return;
        }
        var history = rows[0].history;
        if (history == null || history == "") {
            callback(null);
        }
        else {
            console.log(history.length);
            history = JSON.parse(history);
            callback(history);
        }
    });
};

exports.update_user_history = function (userId, history, callback) {
    callback = callback == null ? nop : callback;
    if (userId == null || history == null) {
        callback(false);
        return;
    }

    history = JSON.stringify(history);
    var sql = 'UPDATE t_users SET roomid = null, history = \'' + history + '\' WHERE userid = "' + userId + '"';
    console.log(sql);
    query(sql, function (err, rows, fields) {
        if (err) {
            callback(false);
            throw err;
        }

        if (rows.length == 0) {
            callback(false);
            return;
        }

        callback(true);
    });
};

exports.get_games_of_room = function (room_uuid, callback) {
    callback = callback == null ? nop : callback;
    if (room_uuid == null) {
        callback(null);
        return;
    }

    var sql = 'SELECT game_index,create_time,result FROM t_games_archive WHERE room_uuid = "' + room_uuid + '"';
    console.log(sql);
    query(sql, function (err, rows, fields) {
        if (err) {
            callback(null);
            throw err;
        }

        if (rows.length == 0) {
            callback(null);
            return;
        }

        callback(rows);
    });
};

exports.get_detail_of_game = function (room_uuid, index, callback) {
    callback = callback == null ? nop : callback;
    if (room_uuid == null || index == null) {
        callback(null);
        return;
    }
    var sql = 'SELECT base_info,action_records FROM t_games_archive WHERE room_uuid = "' + room_uuid + '" AND game_index = ' + index;
    console.log(sql);
    query(sql, function (err, rows, fields) {
        if (err) {
            callback(null);
            throw err;
        }

        if (rows.length == 0) {
            callback(null);
            return;
        }
        callback(rows[0]);
    });
}

exports.create_user = function (account, name, coins, gems, sex, headimg, callback) {
    callback = callback == null ? nop : callback;
    if (account == null || name == null || coins == null || gems == null) {
        callback(false);
        return;
    }
    if (headimg) {
        headimg = '"' + headimg + '"';
    }
    else {
        headimg = 'null';
    }
    name = crypto.toBase64(name);
    var sql = "INSERT INTO t_users(account,name,coins,gems,sex,headimg,blacklist,location) VALUES('{0}','{1}',{2},{3},{4},{5},'[]','{\"x\":0.0,\"y\":0.0}')";
    sql = sql.format(account, name, coins, gems, sex, headimg);
    console.log(sql);
    query(sql, function (err, rows, fields) {
        if (err) {
            throw err;
        }
        callback(true);
    });
};

exports.update_user_info = function (userid, name, headimg, sex, callback) {
    callback = callback == null ? nop : callback;
    if (userid == null) {
        callback(null);
        return;
    }

    if (headimg) {
        headimg = '"' + headimg + '"';
    }
    else {
        headimg = 'null';
    }
    name = crypto.toBase64(name);
    var sql = 'UPDATE t_users SET name="{0}",headimg={1},sex={2} WHERE account="{3}"';
    sql = sql.format(name, headimg, sex, userid);
    console.log(sql);
    query(sql, function (err, rows, fields) {
        if (err) {
            throw err;
        }
        callback(rows);
    });
};

exports.get_room_players = function (roomId, callback) {
    callback = callback == null ? nop : callback;
    if (roomId == null) {
        callback(null);
        return;
    }
    var sql = 'SELECT user_name0,user_name1,user_name2,user_name3,user_id0,user_id1,user_id2,user_id3 FROM t_rooms WHERE id={0}';
    sql = sql.format(roomId);
    console.log(sql);
    query(sql, function (err, rows, fields) {
        if (err) {
            throw err;
            callback(null);
        } else {
            if (rows.length > 0) {
                rows[0].user_name0 = crypto.fromBase64(rows[0].user_name0);
                rows[0].user_name1 = crypto.fromBase64(rows[0].user_name1);
                rows[0].user_name2 = crypto.fromBase64(rows[0].user_name2);
                rows[0].user_name3 = crypto.fromBase64(rows[0].user_name3);
                callback(rows[0]);
            } else {
                callback(null);
            }
        }
    });
};

exports.get_user_base_info = function (userid, callback) {
    callback = callback == null ? nop : callback;
    if (userid == null) {
        callback(null);
        return;
    }
    var sql = 'SELECT name,sex,headimg FROM t_users WHERE userid={0}';
    sql = sql.format(userid);
    console.log(sql);
    query(sql, function (err, rows, fields) {
        if (err) {
            throw err;
        }
        rows[0].name = crypto.fromBase64(rows[0].name);
        callback(rows[0]);
    });
};

exports.is_room_exist = function (roomId, callback) {
    callback = callback == null ? nop : callback;
    var sql = 'SELECT * FROM t_rooms WHERE id = "' + roomId + '"';
    query(sql, function (err, rows, fields) {
        if (err) {
            callback(false);
            throw err;
        }
        else {
            callback(rows.length > 0);
        }
    });
};

exports.cost_gems = function (userid, cost, callback) {
    callback = callback == null ? nop : callback;
    var sql = 'UPDATE t_users SET gems = gems -' + cost + ' WHERE userid = ' + userid;
    console.log(sql);
    query(sql, function (err, rows, fields) {
        if (err) {
            callback(false);
            throw err;
        }
        else {
            callback(rows.affectedRows > 0);
        }
    });
};

exports.set_room_id_of_user = function (userId, roomId, callback) {
    callback = callback == null ? nop : callback;
    if (roomId != null) {
        roomId = '"' + roomId + '"';
    }
    var sql = 'UPDATE t_users SET roomid = ' + roomId + ' WHERE userid = "' + userId + '"';
    console.log(sql);
    query(sql, function (err, rows, fields) {
        if (err) {
            console.log(err);
            callback(false);
            throw err;
        }
        else {
            callback(rows.length > 0);
        }
    });
};

exports.get_room_id_of_user = function (userId, callback) {
    callback = callback == null ? nop : callback;
    var sql = 'SELECT roomid FROM t_users WHERE userid = "' + userId + '"';
    query(sql, function (err, rows, fields) {
        if (err) {
            callback(null);
            throw err;
        }
        else {
            if (rows.length > 0) {
                callback(rows[0].roomid);
            }
            else {
                callback(null);
            }
        }
    });
};

exports.set_user_location = function (account, location, callback) {
    callback = callback == null ? nop : callback;
    var sql = "UPDATE t_users SET location='" + location + "' WHERE account='" + account + "'";
    console.log(sql);
    query(sql, function (err, rows, fields) {
        if (err) {
            console.log(err);
            callback(false);
            throw err;
        }
        else {
            callback(rows.length > 0);
        }
    });

};

exports.get_users_location = function (usersInRoom, callback) {
    callback = callback == null ? nop : callback;
    var userNum = usersInRoom.length;
    var users = usersInRoom[0] + '';
    for (var i = 1; i < usersInRoom.length; i++) {
        users += ',' + usersInRoom[i];
    }
    var sql = 'SELECT location FROM t_users WHERE userid IN (' + users + ') ORDER BY FIELD (userid,' + users + ')';

    query(sql, function (err, rows, fields) {
        if (err) {
            callback(null);
            throw err;
        }
        else {
            if (rows.length > 0) {
                callback(rows);
            }
            else {
                callback(null);
            }
        }
    });

};

exports.create_room = function (roomId, conf, ip, port, create_time, callback) {
    callback = callback == null ? nop : callback;
    var sql = "INSERT INTO t_rooms(uuid,id,base_info,ip,port,create_time,creator,creator_cost,club_id) \
                VALUES('{0}','{1}','{2}','{3}',{4},{5},{6},{7},'{8}')";
    var uuid = Date.now() + roomId;
    var baseInfo = JSON.stringify(conf);
    var creator_cost = conf.maxGames;
    if (conf.paytype == 1) {
        creator_cost = creator_cost / 4;
    }
    var clubId="NULL";
    if(conf.clubId!=null){
        clubId=conf.clubId;
    }
    else clubId="NULL";
    sql = sql.format(uuid, roomId, baseInfo, ip, port, create_time, conf.creator, creator_cost,clubId );
    console.log(sql);
    query(sql, function (err, row, fields) {
        if (err) {
            callback(null);
            throw err;
        }
        else {
            callback(uuid);
        }
    });
};

exports.get_room_uuid = function (roomId, callback) {
    callback = callback == null ? nop : callback;
    var sql = 'SELECT uuid FROM t_rooms WHERE id = "' + roomId + '"';
    query(sql, function (err, rows, fields) {
        if (err) {
            callback(null);
            throw err;
        }
        else {
            callback(rows[0].uuid);
        }
    });
};

exports.update_seat_info = function (roomId, seatIndex, userId, icon, name, callback) {
    callback = callback == null ? nop : callback;
    var sql = 'UPDATE t_rooms SET user_id{0} = {1},user_icon{0} = "{2}",user_name{0} = "{3}" WHERE id = "{4}"';
    name = crypto.toBase64(name);
    sql = sql.format(seatIndex, userId, icon, name, roomId);
    console.log(sql);
    query(sql, function (err, row, fields) {
        if (err) {
            callback(false);
            throw err;
        }
        else {
            callback(true);
        }
    });
}

exports.update_num_of_turns = function (roomId, numOfTurns, callback) {
    callback = callback == null ? nop : callback;
    var sql = 'UPDATE t_rooms SET num_of_turns = {0} WHERE id = "{1}"'
    sql = sql.format(numOfTurns, roomId);
    //console.log(sql);
    console.log(sql);
    query(sql, function (err, row, fields) {
        if (err) {
            callback(false);
            throw err;
        }
        else {
            callback(true);
        }
    });
};


exports.update_next_button = function (roomId, nextButton, callback) {
    callback = callback == null ? nop : callback;
    var sql = 'UPDATE t_rooms SET next_button = {0} WHERE id = "{1}"'
    sql = sql.format(nextButton, roomId);
    //console.log(sql);
    console.log(sql);
    query(sql, function (err, row, fields) {
        if (err) {
            callback(false);
            throw err;
        }
        else {
            callback(true);
        }
    });
};

exports.get_room_addr = function (roomId, callback) {
    callback = callback == null ? nop : callback;
    if (roomId == null) {
        callback(false, null, null);
        return;
    }

    var sql = 'SELECT ip,port FROM t_rooms WHERE id = "' + roomId + '"';
    console.log(sql);
    query(sql, function (err, rows, fields) {
        if (err) {
            callback(false, null, null);
            throw err;
        }
        if (rows.length > 0) {
            callback(true, rows[0].ip, rows[0].port);
        }
        else {
            callback(false, null, null);
        }
    });
};

exports.get_room_data = function (roomId, callback) {
    callback = callback == null ? nop : callback;
    if (roomId == null) {
        callback(null);
        return;
    }

    var sql = 'SELECT * FROM t_rooms WHERE id = "' + roomId + '"';
    console.log(sql);
    query(sql, function (err, rows, fields) {
        if (err) {
            callback(null);
            throw err;
        }
        if (rows.length > 0) {
            rows[0].user_name0 = crypto.fromBase64(rows[0].user_name0);
            rows[0].user_name1 = crypto.fromBase64(rows[0].user_name1);
            rows[0].user_name2 = crypto.fromBase64(rows[0].user_name2);
            rows[0].user_name3 = crypto.fromBase64(rows[0].user_name3);
            callback(rows[0]);
        }
        else {
            callback(null);
        }
    });
};

exports.delete_room = function (roomId, callback) {
    callback = callback == null ? nop : callback;
    if (roomId == null) {
        callback(false);
    }
    var sql = "DELETE FROM t_rooms WHERE id = '{0}'";
    sql = sql.format(roomId);
    console.log(sql);
    query(sql, function (err, rows, fields) {
        if (err) {
            callback(false);
            throw err;
        }
        else {
            callback(true);
        }
    });
};

exports.create_game = function (room_uuid, index, base_info, callback) {
    callback = callback == null ? nop : callback;
    var sql = "INSERT INTO t_games(room_uuid,game_index,base_info,create_time) VALUES('{0}',{1},'{2}',unix_timestamp(now()))";
    sql = sql.format(room_uuid, index, base_info);
    //console.log(sql);
    console.log(sql);
    query(sql, function (err, rows, fields) {
        if (err) {
            callback(null);
            throw err;
        }
        else {
            callback(rows.insertId);
        }
    });
};

exports.delete_games = function (room_uuid, callback) {
    callback = callback == null ? nop : callback;
    if (room_uuid == null) {
        callback(false);
    }
    var sql = "DELETE FROM t_games WHERE room_uuid = '{0}'";
    sql = sql.format(room_uuid);
    console.log(sql);
    query(sql, function (err, rows, fields) {
        if (err) {
            callback(false);
            throw err;
        }
        else {
            callback(true);
        }
    });
};

exports.archive_games = function (room_uuid, callback) {
    callback = callback == null ? nop : callback;
    if (room_uuid == null) {
        callback(false);
    }
    var sql = "INSERT INTO t_games_archive(SELECT * FROM t_games WHERE room_uuid = '{0}')";
    sql = sql.format(room_uuid);
    console.log(sql);
    query(sql, function (err, rows, fields) {
        if (err) {
            callback(false);
            throw err;
        }
        else {
            exports.delete_games(room_uuid, function (ret) {
                callback(ret);
            });
        }
    });
}

exports.update_game_action_records = function (room_uuid, index, actions, callback) {
    callback = callback == null ? nop : callback;
    var sql = "UPDATE t_games SET action_records = '" + actions + "' WHERE room_uuid = '" + room_uuid + "' AND game_index = " + index;
    //console.log(sql);
    console.log(sql);
    query(sql, function (err, rows, fields) {
        if (err) {
            callback(false);
            throw err;
        }
        else {
            callback(true);
        }
    });
};

exports.update_game_result = function (room_uuid, index, result, callback) {
    callback = callback == null ? nop : callback;
    if (room_uuid == null || result) {
        callback(false);
    }

    result = JSON.stringify(result);
    var sql = "UPDATE t_games SET result = '" + result + "' WHERE room_uuid = '" + room_uuid + "' AND game_index = " + index;
    //console.log(sql);
    console.log(sql);
    query(sql, function (err, rows, fields) {
        if (err) {
            callback(false);
            throw err;
        }
        else {
            callback(true);
        }
    });
};

exports.get_user_last = function (userid, callback) {
    callback = callback == null ? nop : callback;
    if (userid == null) {
        callback(false);
    }
    var sql = "SELECT last FROM t_users WHERE userid=" + userid;
    console.log(sql);
    query(sql, function (err, rows, fields) {
        if (err) {
            callback(false);
            throw err;
        } else {
            if (rows.length > 0) {
                callback(rows[0]);
            } else {
                callback(null);
            }
        }
    });
};

exports.add_feedback = function (userid, feedback, callback) {
    callback = callback == null ? nop : callback;
    if (userid == null || feedback == null) {
        callback(false);
    }
    var sql = 'INSERT INTO t_feed_back(userid,content) VALUES (' + userid + ',"' + feedback + '")';
    console.log(sql);
    query(sql, function (err, rows, fields) {
        if (err) {
            callback(false);
            throw err;
        }
        else {
            callback(true);
        }
    });
};

exports.get_room_blacklist = function (roomid, callback) {
    callback = callback == null ? nop : callback;
    if (roomid == null) {
        callback(false);
    }
    var sql = "SELECT blacklist FROM t_users,t_rooms WHERE t_rooms.id=" + roomid + " AND t_rooms.creator=t_users.userid";
    console.log(sql);
    query(sql, function (err, rows, fields) {
        if (err) {
            callback(false);
            throw err;
        } else {
            if (rows.length > 0) {
                callback(rows[0].blacklist);
            } else {
                callback(null);
            }
        }
    });
};

exports.get_user_blacklist = function (userid, callback) {
    callback = callback == null ? nop : callback;
    if (userid == null) {
        callback(false);
    }
    var sql = "SELECT blacklist FROM t_users WHERE userid=" + userid;
    console.log(sql);
    query(sql, function (err, rows, fields) {
        if (err) {
            callback(false);
            throw err;
        } else {
            if (rows.length > 0) {
                callback(rows[0].blacklist);
            } else {
                callback(null);
            }
        }
    });
};

exports.set_user_last = function (userid, last, callback) {
    callback = callback == null ? nop : callback;
    if (userid == null && last == null) {
        callback(false);
    }
    var sql = "UPDATE t_users SET last='" + last + "' WHERE userid=" + userid;
    console.log(sql);
    query(sql, function (err, rows, fields) {
        if (err) {
            callback(false);
            throw err;
        } else {
            callback(true);
        }
    });
};

exports.set_user_blacklist = function (userid, blacklist, callback) {
    callback = callback == null ? nop : callback;
    if (userid == null && blacklist == null) {
        callback(false);
    }
    var sql = "UPDATE t_users SET blacklist='" + blacklist + "' WHERE userid=" + userid;
    console.log(sql);
    query(sql, function (err, rows, fields) {
        if (err) {
            callback(false);
            throw err;
        } else {
            callback(true);
        }
    });
};

exports.get_message = function (type, version, callback) {
    callback = callback == null ? nop : callback;

    var sql = 'SELECT * FROM t_message WHERE type = "' + type + '"';

    if (version == "null") {
        version = null;
    }

    if (version) {
        version = '"' + version + '"';
        sql += ' AND version != ' + version;
    }

    console.log(sql);
    query(sql, function (err, rows, fields) {
        if (err) {
            callback(false);
            throw err;
        }
        else {
            if (rows.length > 0) {
                callback(rows[0]);
            }
            else {
                callback(null);
            }
        }
    });
};

exports.get_user_rooms_info = function (userId, callback) {
    callback = callback == null ? nop : callback;

    var sql = 'SELECT id,base_info,user_id0,user_id1,user_id2,user_id3,user_id3 FROM t_rooms WHERE creator = "' + userId + '"';

    console.log(sql);
    query(sql, function (err, rows, fields) {
        if (err) {
            callback(false);
            throw err;
        } else {
            if (rows.length > 0) {
                callback(rows);
            } else {
                callback(null);
            }
        }
    });
};

exports.get_user_rooms_cost = function (userId, callback) {
    callback = callback == null ? nop : callback;

    var sql = 'SELECT SUM(creator_cost) AS cost,COUNT(creator_cost) AS roomsNum From t_rooms WHERE creator = "' + userId + '"';

    console.log(sql);
    query(sql, function (err, rows, fields) {
        if (err) {
            callback(false);
            throw err;
        } else {
            if (rows.length > 0) {
                callback(rows[0]);
            } else {
                callback(null);
            }
        }
    });
};



exports.get_user_club_info = function (userId, callback) {
    callback = callback == null ? nop : callback;
    //name = crypto.fromBase64(name);
    var sql = 'SELECT t_club.club_id,club_creator,club_name,name,COUNT(user_id) as counter from t_relation,t_club,t_users where t_relation.club_id=t_club.club_id AND t_club.club_creator=t_users.userid GROUP BY club_id HAVING club_id in(select club_id  from t_relation where user_id=' + userId + ')  ';
    console.log(sql);
    query(sql, function (err, rows, fields) {
        if (err) {
            callback(false);
            throw err;
        } else {
            if (rows.length > 0) {
                for (var i = 0; i < rows.length; i++)
                    rows[i].name = crypto.fromBase64(rows[i].name);
                callback(rows);
            } else {
                callback(null);
            }
        }
    });

};


exports.get_club_rooms_info = function (clubId, callback) {
    callback = callback == null ? nop : callback;

    var sql = 'SELECT id,base_info,user_id0,user_id1,user_id2,user_id3,user_id3 FROM t_rooms WHERE club_id = ' + clubId + ' ';
    console.log(sql);
    query(sql, function (err, rows, fields) {
        if (err) {
            callback(false);
            throw err;
        } else {
            if (rows.length > 0) {
                callback(rows);
            } else {
                callback(null);
            }
        }
    });

};


exports.is_club_joined = function (userId, clubId, callback) {
    callback = callback == null ? nop : callback;
    var sql = 'SELECT user_id FROM t_relation WHERE (user_id=' + userId + ' AND  club_id=' + clubId + ' )  ';
    query(sql, function (err, rows, fields) {
        if (err) {
            callback(false);
            throw err;
        } else {
            if (rows.length > 0 && rows[0] != null) {
                callback(true);
            } else {
                callback(false);
            }
        }
    });

};
exports.is_club_exist = function (clubId, callback) {
    callback = callback == null ? nop : callback;
    var sql = 'SELECT club_id FROM t_club WHERE  club_id = ' + clubId + '  ';
    query(sql, function (err, rows, fields) {
        if (err) {
            callback(false);
            throw err;
        } else {
            if (rows.length > 0 && rows[0] != null) {
                callback(true);
            } else {
                callback(false);
            }
        }
    });

};
exports.enter_club = function (userId, clubId, callback) {
    callback = callback == null ? nop : callback;

    var sql = 'INSERT INTO  t_relation (user_id,club_id) VALUES( ' + userId + ' , ' + clubId + ' ) ';
    console.log(sql);
    query(sql, function (err, rows, fields) {
        if (err) {
            callback(false);
            throw err;
        } else {
            callback(true);
        }
    });
};

exports.create_club = function (clubName, userId, callback) {
    callback = callback == null ? nop : callback;
    var sql = 'INSERT  INTO  t_club  (club_name,club_creator) VALUES ("' + clubName + '" ,  ' + userId + '  ) ';

    query(sql, function (err, row, fields) {
        if (err) {
            callback(null);
            throw err;
        }
        else {
            callback(true);
        }
    });
};

exports.quit_club = function (userId, clubId, callback) {
    callback = callback == null ? nop : callback;

    var sql = 'DELETE  FROM  t_relation WHERE (user_id=' + userId + ' AND club_id= ' + clubId + ') ';
    console.log(sql);
    query(sql, function (err, rows, fields) {
        if (err) {
            callback(false);
            throw err;
        } else {
            callback(true);
        }
    });
};

exports.get_member_info = function (clubId, callback) {
    callback = callback == null ? nop : callback;
    //name = crypto.fromBase64(name);
    var sql = 'SELECT userid,name FROM t_users WHERE userid in ( SELECT user_id FROM t_relation  WHERE club_id= ' + clubId + ' )';
    console.log(sql);
    query(sql, function (err, rows, fields) {
        if (err) {
            callback(false);
            throw err;
        } else {
            if (rows.length > 0) {
                for (var i = 0; i < rows.length; i++)
                    rows[i].name = crypto.fromBase64(rows[i].name);
                callback(rows);
            } else {
                callback(null);
            }
        }
    });

};

exports.delete_club = function(clubId,callback){
    callback = callback == null ? nop : callback;

    var sql = 'DELETE  FROM  t_club WHERE ( club_id= ' + clubId + ' ) ';
    console.log(sql);
    query(sql, function (err, rows, fields) {
        if (err) {
            callback(false);
            throw err;
        } else {
            callback(true);
        }
    });
};


exports.creat_requestlist=function(userId,clubId,callback){
    callback = callback == null? nop:callback;
    
    var  sql = 'INSERT INTO  t_request (user_id,club_id) VALUES( ' + userId + ' , ' + clubId + ' ) ';
    console.log(sql);
    query(sql,function(err,rows,fields){
        if(err){
            callback(false);
            throw err;
        }else{
            callback(true);
        }
    });
};
exports.get_requestlist=function(clubId,callback){
    callback = callback == null? nop:callback;

    var sql='SELECT userid , `name`  FROM t_users WHERE userid in( SELECT user_id FROM t_request WHERE club_id= ' + clubId + ' )';
    console.log(sql);
    query(sql,function(err,rows,fields){
        if(err){
            callback(false);
            throw err;
        }else{
            if(rows.length > 0){
                for(var i=0;i<rows.length;i++)
                rows[i].name=crypto.fromBase64(rows[i].name);
                callback(rows);
            }else{
                callback(null);
            }
        }
    });

};
exports.delete_requestlist=function(userId,clubId,callback){
    callback = callback == null? nop:callback;
    
    var  sql = 'DELETE FROM  t_request WHERE (user_id='+userId+' AND club_id='+clubId+') ';
    console.log(sql);
    query(sql,function(err,rows,fields){
        if(err){
            callback(false);
            throw err;
        }else{
            callback(true);
        }
    });
};
exports.is_club_sent=function(userId,clubId,callback){
    callback = callback == null? nop:callback;
    var sql='SELECT user_id FROM t_request WHERE (user_id=' + userId + ' AND  club_id=' + clubId +  ' )  ';
    query(sql, function (err, rows, fields) {
        if (err) {
            callback(false);
            throw err;
        } else {
            if (rows.length > 0 && rows[0] != null) {
                callback(true);
            } else {
                callback(false);
            }
        }
    });

};
exports.query = query;
