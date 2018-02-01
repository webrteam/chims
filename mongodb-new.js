/**
 * Created by likaituan on 03/03/2017.
 */

let mongodbClient = require("mongodb").MongoClient;
let connectStr;
let dbCache;

exports.config = (config) => {
	let auth = config.username && config.password && `${config.username}:${config.password}@` || '';
	let host = config.host || 'localhost';
	let port = config.port || 27017;
	let dbName = config.database || 'test';
	connectStr = `mongodb://${auth}${host}:${port}/${dbName}`;
	console.log(`Mongodb Is Running At ${host}:${port} by ${dbName}`);

};

let tableAction = function (tbName) {
	this.tbName = tbName;
};

tableAction.prototype = {
	async conn () {
		console.log({connectStr});
		let db = await mongodbClient.connect(connectStr);
		if (!db) {
			throw `warning: your mongodb server without started, please input 'mongod' to run on command line`;
		}
		return db;
	},
	async addItem (data) {
		let db = await this.conn();
		let tb = db.collection(this.tbName);
		await tb.insertOne(data);
		db.close();
	},
	async getList (query) {
		let db = await this.conn();
		let tb = db.collection(this.tbName);
		let list = await tb.find(query).toArray();
		db.close();
		return list;
	}
};


exports.tb = function (tbName) {
	if (!connectStr) {
		throw 'please config before!';
	}
	return {
		action (actionKey) {
			let instance = new tableAction(tbName);
			return instance[actionKey].bind(instance);
		}
	}
};

