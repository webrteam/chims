let request = require('./request');

let Rest = function (host) {
	this.host = host;
};

Rest.config = function (mapList) {
	this.mapList = mapList;
};

Rest.prototype = {

};


Rest.prototype.getProxy = function(url, OPTIONS) {
	return request.get.bind(request, url, OPTIONS);
};

Rest.prototype.get = function(url, OPTIONS) {
	return request.get.bind(request, url, OPTIONS);
};

Rest.prototype.del = function(url, OPTIONS) {
	return request.get.bind(request, url, OPTIONS);
};

Rest.prototype.post = function(url, OPTIONS) {
	return request.get.bind(request, url, OPTIONS);
};

Rest.prototype.put = function(url, OPTIONS) {
	return request.get.bind(request, url, OPTIONS);
};

Rest.prototype.postJson = function(url, OPTIONS) {
	return request.get.bind(request, url, OPTIONS);
};

Rest.prototype.putJson = function(url, OPTIONS) {
	return request.get.bind(request, url, OPTIONS);
};

module.exports = Rest;