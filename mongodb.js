/**
 * Created by likaituan on 03/03/2017.
 */

var mongodb = require("mongodb").MongoClient;
var config = {};
var connectStr;
var DB;

exports.config = (config) => {
	var auth = config.username && config.password && `${config.username}:${config.password}@` || '';
	var host = config.host || 'localhost';
	var port = config.port || 27017;
	var dbName = config.database || 'test';
	connectStr = `mongodb://${auth}${host}:${port}/${dbName}`;
	console.log(`MongoDB Is Running At ${host}:${port} by ${dbName}`);

};

// 连接
exports.connect = function () {
    return mongodb.connect(connectStr).then(
        db => {
            DB = db;
            return Promise.resolve(db);
        },
        err => {
            console.log(err);
            // console.log(err.message);
            //console.log(`warning: your mongodb server was not installed or not started, please input 'mongod' to run in command line`);
            return Promise.reject(err);
        }
    );
};

// 断开连接
Promise.prototype.close = function(){
    return this.then(
        data => {
            DB && DB.close();
            return Promise.resolve(data);
        },
        err => {
            DB && DB.close();
            return Promise.reject(err);
        }
    );
};
