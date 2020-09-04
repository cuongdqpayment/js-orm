"use strict"
/**
 * Thủ tục gửi lệnh POST, GET
 * sử dụng 
 * $ node --tls-min-v1.0 ./server.js 
 * để kết nối với máy chủ https có ssl v1.0 tránh lỗi
 * Error: write EPROTO 3188:error:1425F102:SSL routines:ssl_choose_client_version:unsupported protocol:c:\ws\deps\openssl\openssl\ssl\statem\statem_lib.c:1929
 */

const request = require("request");

// require('https').globalAgent.options.ca = require('ssl-root-cas/latest').create();

// lệnh post - giả lập lệnh curl 
const POST = (objData, urlServer) => {
    return new Promise(async (rs, rj) => {
        try {
            // gửi lên là json, kết quả nhận được ở body cũng là json
            request.post(urlServer, { json: objData }, (err, res, jsonData) => {
                // console.log("Mã statusCode trả về == 200 thì mới thành công!",res.statusCode);
                if (err || res.statusCode !== 200) {
                    rj(err || jsonData)
                } else {
                    rs(jsonData)
                }
            })
        } catch (e) {
            console.log(`Lỗi truy vấn đến ${urlServer}`, e)
            rj(e)
        }
    })
}

// lệnh get - giả lập curl hoặc web
const GET = (objData, urlServer) => {
    return new Promise(async (rs, rj) => {
        try {
            // gửi lên là json, kết quả nhận được ở body cũng là json
            request.get(urlServer, { strictSSL: false }, (err, res, jsonData) => {
                // console.log("Mã statusCode trả về == 200 thì mới thành công!",res.statusCode);
                if (err || res.statusCode !== 200) {
                    rj(err || jsonData)
                } else {
                    rs(jsonData)
                }
            })
        } catch (e) {
            console.log(`Lỗi truy vấn đến ${urlServer}`, e)
            rj(e)
        }
    })
}

module.exports = {
    POST,
    GET
}