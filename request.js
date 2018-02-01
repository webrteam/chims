
let httpMaps = {
    http: require("http"),
    https: require("https")
};
let { parse } = require('url');

const OPTIONS = {
    dataType: 'json'
};

let Request = function (options) {
    let HTTP = httpMaps.http;
    if (options.url) {
        let {host, path, protocol} = parse(options.url);
        HTTP = httpMaps[protocol.replace(':','')];
        Object.assign(options, {host, path});
        delete options.url;
    }
    options.dataType = options.dataType || OPTIONS.dataType;

    return new Promise(resolve => {
        console.log({options});

        var req = HTTP.request(options, function (res) {
            var chunks = [];

            res.on("data", function (chunk) {
                chunks.push(chunk);
            });

            res.on("end", function () {
                console.log(res.headers);
                let body = Buffer.concat(chunks);
                let text = body.toString(), json;
                if (options.dataType === 'json') {
                    json = JSON.parse(text);
                }
                // json ? console.log(JSON.stringify(json,null,4)) : console.log({text});
                resolve(json || text);
            });
        });

        req.on('error', err => {
            console.log({err});
        });

        req.end();
    });
};

Request.get = function (url, data = {}, options = {}) {
    options.method = "GET";
    options.url = url;
    options.data = data;
    return Request(options);
};

Request.post = function (url, data = {}, options = {}) {
    options.method = "POST";
    options.url = url;
    options.data = data;
    return Request(options);
};

module.exports = Request;