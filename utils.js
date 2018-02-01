/**
 * Created by likaituan on 03/11/2017.
 */

const MaxLen = 10000;

// 获取当前事件
exports.getNow = () => {
	return new Date().toISOString().replace('T',' ').replace(/\..+$/,'');
};

// 输出截取
exports.showLog = (message, maxLen = MaxLen) => {
	if (message.length > maxLen) {
		message = message.slice(0, maxLen) + ' ...';
	}
	console.log(message);
};