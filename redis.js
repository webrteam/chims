/**
 * Created by likaituan on 28/09/2017.
 */

var Redis = require('ioredis');
var nodeUuid = require("node-uuid");
var redis;

exports.prefix = '';
const ex = exports.expireTime = 60 * 60 * 24 * 7; //过期时间: 7 days

exports.start = function (config) {
	this.prefix = config.prefix || '';
	var cluster1 = config.clusters[0];
	redis = new Redis.Cluster(config.clusters);
	// redis错误处理
	redis.on('error', function(err) {
		console.log('ioRedis Error =' + err);
	});
	console.log(`Redis IsRunAt: ${cluster1.host}:${cluster1.port}(first)`);
};

// 获取(返回promise)
exports.get = function(key) {
	return redis.get(this.prefix + key).then(
		ret => {
			let json;
			try {
				json = ret && JSON.parse(ret);
			} catch (jsonErr) {
				console.log(`redis key [${key}] error:`);
				console.log({ret, jsonErr});
			}
			return Promise.resolve(json);
		},
		err => Promise.reject(err)
	);
};

// 设置
exports.set = function(key, data, expireTime) {
	data = JSON.stringify(data);
	return redis.set(this.prefix + key, data, 'EX', expireTime || ex);
};

// 删除
exports.del = function(key) {
	return redis.del(this.prefix + key);
};

// 生成UUID
exports.genUuid = function () {
	return nodeUuid.v4();
};


// 添加Token(data必须是个对象)
exports.addToken = function (data) {
	let token = exports.genUuid();
	data.token = token;
	exports.set(`token-${token}`, data);
	return token;
};

// 获取Token
exports.getToken = function (token) {
	return exports.get(`token-${token}`);
};

// 删除Token
exports.delToken = function (token) {
	return exports.del(`token-${token}`);
};