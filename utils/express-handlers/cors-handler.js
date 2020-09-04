
"use strict"

/**
 * ver 3.0 khai báo cors và debug động bằng cách thêm vào sau:
 * trả về req. ~ paramS, ipClient, pathName, clientIp, clientDevice, method, origin, url
 */

const url = require('url');
const arrObj = require('../array-object');

class CorsHandler {

  constructor(domainCors, isDebug) {
    this.Access_Control_Allow_Origin_List = domainCors || ['localhost'];
    this.isDebug = isDebug;
  }

  /**
  * Hàm gọi chính trong class
  * @param {*} originStr 
  */
  validateOrigin(originStr) {
    for (let value of this.Access_Control_Allow_Origin_List) {
      if (originStr && originStr.indexOf(value) >= 0) return true;
    }
    return false;
  };

  /**
   * Hàm trả về req. cho các tham số sau
   * paramS, ipClient, pathName, clientIp, clientDevice, method, origin, url
   */
  expressCors() {

    return (req, res, next) => {

      req.pathName = decodeURIComponent(url.parse(req.url, true, false).pathname);
      req.paramS = url.parse(req.url, true, false).query;

      if (this.isDebug) {
        console.log(arrObj.getTimestamp(), '*** req.pathName', req.pathName);
        console.log(arrObj.getTimestamp(), '*** req.paramS', req.paramS);
      }

      let ip;
      if (req.headers["client_ip"]) {
        ip = req.headers["client_ip"];
      } else if (req.headers["x-real-ip"]) {
        ip = req.headers["x-real-ip"];
      } else if (req.headers["x-forwarded-for"]) {
        ip = req.headers["x-forwarded-for"];
      } else if (req.headers["remote_add"]) {
        ip = req.headers["remote_add"];
      } else {
        ip = req.ip;
      }
      req.clientIp = ip;
      req.clientDevice = req.headers["user-agent"];

      let origin = req.headers && req.headers.origin ? req.headers.origin : req.headers && req.headers.referer ? req.headers.referer : '';
      let Access_Control_Request_Headers = req.header && req.headers['access-control-request-headers'] ? req.headers['access-control-request-headers'] : '';
      let Access_Control_Request_Method = req.header && req.headers['access-control-request-method'] ? req.headers['access-control-request-method'] : '';
      let Access_Control_Request_Credentials = req.header && req.headers['access-control-request-credentials'] ? req.headers['access-control-request-credentials'] : '';

      //console.log('Method', Access_Control_Request_Method);
      console.log(arrObj.getTimestamp(), req.method, origin, req.url, req.clientIp, req.clientDevice);
      // console.log('Duong dan goc', req.originalUrl);

      if (this.validateOrigin(origin)) { //
        req.origin = origin;
        //console.log('Access-Control-Allow-Origin: ', req.origin);
        res.header("Access-Control-Allow-Origin", origin);
      } else {
        // if (origin) console.log('Access-Control-Reject-Origin: ' + origin);
      }

      if (Access_Control_Request_Headers) {
        //console.log('Access-Control-Allow-Headers: ' + Access_Control_Request_Headers);
        res.header("Access-Control-Allow-Headers", Access_Control_Request_Headers);
        //res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization"); //cho phep headers
      }

      if (Access_Control_Request_Method) {
        // console.log('Access-Control-Allow-Methods: ' + Access_Control_Request_Method);
        res.header("Access-Control-Allow-Methods", Access_Control_Request_Method);
        //res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, DELETE");
      }

      if (Access_Control_Request_Credentials) {
        //console.log('Access-Control-Allow-Credentials: ' + Access_Control_Request_Credentials);
        res.header("Access-Control-Allow-Credentials", true);
      }

      //cho phep dieu khien tuoi tho cua preflight
      res.header("Access-Control-Max-Age", 600); //24h = 86400, 10' = 600
      next();
    };
  }

}

module.exports = CorsHandler;
