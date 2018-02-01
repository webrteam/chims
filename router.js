/**
 * Created by likaituan on 28/09/2017.
 */

var fs = require('fs');
var redis = require('./redis');
var reqPlus = require('./req-plus');
var resPlus = require('./res-plus');
let Path = require('path');
let { getNow, showLog } = require('./utils');
let { getClientIp } = require('ifun/ip');

var showErr = (res, routePath, interfaceErr) => {
	console.log(`${routePath}:\n`, {interfaceErr});
	let err = interfaceErr;
	if (err.hasOwnProperty('code') && err.hasOwnProperty('message') && err.hasOwnProperty('success')) {
		return res.status(200).json(err);
	}
	res.status(500).end();
	console.log(`N-Status: ${res.statusCode}`);
};

let isPromise = function (x) {
	return typeof x === 'object' && x.promiseState !== undefined;
};

let setAlias = function (alias, routes) {
	Object.keys(alias).forEach(aliasUrl => {
		let originUrl = alias[aliasUrl];
		let item = routes.filter(x=>x.path===originUrl)[0];
		if (item) {
			let newItem = {
				path: aliasUrl,
				fun: item.fun,
				isAlias: true
			};
			routes.push(newItem);
		}
	});
};

let getRoutesByFile = (routePath, file) => {
	let methods = require(file);
	if (typeof(methods) == 'function') {
		return [{
			path: routePath,
			fun: methods
		}];
	}
	return Object.keys(methods).map(methodName => {
		return {
			path: `${routePath}/${methodName}`,
			fun: methods[methodName]
		};
	});
};

let getRoutes = (routePath, filePath, routes = []) => {
	fs.readdirSync(filePath).forEach(item => {
		var subRoutePath = `${routePath}/${item}`;
		var subFilePath = `${filePath}/${item}`;
		var isDirectory = fs.statSync(subFilePath).isDirectory();
		if (isDirectory) {
			return getRoutes(subRoutePath, subFilePath, routes);
		}
		subRoutePath = subRoutePath.replace('.js','').replace(/\./g, '/');
		let routeItems = getRoutesByFile(subRoutePath, subFilePath);
		routes = routes.concat(routeItems);
	});
	return routes;
};


exports.parse = (ops, app, OPS) => {
	ops = ops || {};
	if (typeof(ops) != 'object') {
		ops = {dir: ops};
	}
	let routePath = ops.prefix || '';
	let alias = ops.alias || {};
	let needLoginMaps = ops.needLogin && require(Path.resolve(ops.needLogin)) || {};
	let myResPlus = ops.resPlus && require(Path.resolve(ops.resPlus)) || {};

	let filePath = ops.dir || ops.file;
	if (!fs.existsSync(filePath)){
		throw `${filePath} is no exist!`;
	}
	let routes = ops.dir && getRoutes(routePath, ops.dir) || ops.file && getRoutesByFile(routePath, ops.file);
	setAlias(alias, routes);
	var arr_routes = [];
	routes.forEach(item => {
		var routePath = item.path;
		arr_routes.push(routePath);
		app.all(routePath, async (req, res) => {
			var method = req.method.toLowerCase();
			req.data = req._data = method == 'get' && req.params || method == 'post' && req.body;
			// console.log({url:req.url, headers:req.headers, data:req.data, query:req.query});
			Object.assign(req.data, req.query);
			if (ops.onTest) {
				return ops.onTest(req, res);
			}

			let token = req.headers.token || req.data.token;            // 为了兼容form提交
			req.session = OPS.redis && await redis.getToken(token) || {};
			let isToken = token && token === req.session.token;
			// console.log({params:req.data, token, isToken, session:req.session});
			let needLogin = needLoginMaps[routePath] === true || needLoginMaps[routePath] !== false && ops.needLoginDefault;
			if (!isToken && needLogin) {
				return res.status(403).end('no auth');
			}
			Object.keys(reqPlus).forEach(x => req[x] = reqPlus[x].bind(req));
			Object.keys(resPlus).forEach(x => res[x] = resPlus[x].bind(res));
			Object.keys(myResPlus).forEach(x => res[x] = myResPlus[x].bind(res));
			ops.onRequest && ops.onRequest(req, res);

			let headers = {
				ip: getClientIp(req)
			};
			console.log(`\n=================== ${getNow()} =======================`);
			console.log(`Method: ${method}`);
			console.log(`URL: ${req.url}`);
			console.log(`Params: ${JSON.stringify(req.data,null,4)}`);
			console.log(`Headers: ${JSON.stringify(headers,null,4)}`);


			let chkArgs = ops.validate && ops.validate[routePath] || {};
			for (let key in chkArgs) {
				let val = req.data[key] || '';
				let item = chkArgs[key];
				// console.log({item, key, val});
				if (val != '') {
					let len = val.length;
					// console.log({item});
					if (item.type == 'number' || item.type== 'enum_number') {
						val *= 1;
					}
					let chkLen = !item.len || item.len == len;
					let chkMinLen = !item.minLen || len >= item.minLen;
					let chkMaxLen = !item.maxLen || len <= item.maxLen;
					let chkArrLen = !item.lenList || item.lenList.includes(len);
					let chkFormat = !item.format || item.format.test(val);
					let chkEnum = !item.enumList || item.enumList.includes(val);
					// console.log({chkEnum , chkFormat ,chkLen , chkMinLen , chkMaxLen , chkArrLen});
					let isValid = chkEnum && chkFormat && chkLen && chkMinLen && chkMaxLen && chkArrLen;
					if (!isValid) {
						let json = {code:902, data:{key}, message:`data_format_is_wrong`};
						console.log(`Status: ${json.code}`);
						showLog(`Result: ${JSON.stringify(json, null, 4)}`);
						return res.printErr(json);
					}
				} else if (item.isRequest) {
					let json = {code:901, data:{key}, message:`data_is_incomplete`};
					console.log(`Status: ${json.code}`);
					showLog(`Result: ${JSON.stringify(json, null, 4)}`);
					return res.printErr(json);
				}
			}


			try {
				var asyncRet = await item.fun(req, res);
				if (isPromise(asyncRet)){
					asyncRet.catch(interfaceErr => {
						showErr(res, routePath, interfaceErr);
					});
				} else {
					console.log(`Status: ${res.statusCode}`);
					showLog(`Result: ${JSON.stringify(res.returnData, null, 4)}`);
					ops.onResponse && ops.onResponse(res, req);
				}
			} catch(interfaceErr) {
				showErr(res, routePath, interfaceErr);
			}
		});
	});
	return arr_routes;
};