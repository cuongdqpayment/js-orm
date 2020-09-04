"use strict"
/**
 * truy vấn vị trí ip (cho biết ip ở vị trí nào - trên internet --> location)
 */

const request = require('request');

const getIpInfo = (ip) => {

    return new Promise(resolve => {
        request('https://ipinfo.io/' + ip + '/json',
            function (error, response, body) {
                try {
                    if (!error && body && response && response.statusCode == 200) {
                        // console.log(body);
                        resolve(JSON.parse(body))
                    } else {
                        resolve("server net work error")
                    }
                } catch (e) {
                    resolve("body Error")
                }
            })
    })
}

const ip2Number = (ip) => {
    return Number(ip.split(".").map(d => ("000" + d).substr(-3)).join(""))
}

module.exports = {
    getIpInfo,
    ip2Number
}