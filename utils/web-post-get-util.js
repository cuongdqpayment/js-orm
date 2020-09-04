
"use strict"

const request = require("request");

module.exports = {
    post: (url, data, token) => new Promise((rs, rj) => {
        // err Error: write EPROTO 3188:error:1425F102:SSL routines:ssl_choose_client_version:unsupported protocol:c:\ws\deps\openssl\openssl\ssl\statem\statem_lib.c:1929
        // node --tls-min-v1.0 ...
        request.post({
            headers: { 'content-type': 'application/json' },
            url: url,
            body: JSON.stringify({
                token: token
                , devices: data
            })
        }, function (error, response, body) {
            if (error) {
                rj(error);
            } else {
                let msg;
                try {
                    msg = JSON.parse(JSON.parse(body));
                } catch (e) {
                    msg = body;
                }
                rs(msg)
            }
        });
    })
    ,
    get: (url) => new Promise((rs, rj) => {
        // err Error: write EPROTO 3188:error:1425F102:SSL routines:ssl_choose_client_version:unsupported protocol:c:\ws\deps\openssl\openssl\ssl\statem\statem_lib.c:1929
        // node --tls-min-v1.0 ...
        request.get({
            headers: { 'content-type': 'application/json' },
            url: url
        }, function (error, response, body) {
            if (error) {
                rj(error);
            } else {
                let msg;
                try {
                    msg = JSON.parse(JSON.parse(body));
                } catch (e) {
                    msg = body;
                }
                rs(msg)
            }
        });
    })
}