"use strict"

/**
 * change pass 2020-02-15
 * 
 * version 1.5
 * 17/05/2019
 * cuong.dq
 * 
 * Chỉnh sửa chuỗi bảo mật mới, phục vụ bảo mật
 * 
 * 1.4
 * chuyen doi cac query => req.token (next=> cho phien tiep)
 * sign token => ky tao ra token de gui di cho user
 * verify this token => true => req.user (next=>cho phien tiep)
 * convert token => infor of token
 * 
 */

const jwt = require('jsonwebtoken');
const jwtConfig = require('../cfg/jwt-secret');
const url = require('url');

/**
 * input: token
 * output: user_info
 * @param {*} token 
 */
var getInfoFromToken = (token) => {
  let userInfo;
  try {
    userInfo = jwt.decode(token);
  } catch (e) { }
  return userInfo;
}

/**
 * input:  GET/POST
 * return: req.token
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
var getToken = (req, res, next) => {
  let token = req.headers['x-access-token'] || req.headers['authorization'];
  if (!token) token = url.parse(req.url, true, false).query.token;
  if (!token) token = req.json_data ? req.json_data.token : ''; //lay them tu json_data post
  req.token = req.token ? req.token : token; // uu tien token truyen trong json gan truoc do
  if (req.token) {
    req.token = req.token.startsWith('Bearer ') ? req.token.slice(7) : req.token;
    next();
  } else {
    res.writeHead(403, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(JSON.stringify({ code: 403, message: 'token-handler: getToken: Auth token is not supplied or you are unauthorized!' }));
  }
}

var getTokenNext = (req, res, next) => {
  let token = req.headers['x-access-token'] || req.headers['authorization'];
  if (!token) token = url.parse(req.url, true, false).query.token;
  if (!token) token = req.json_data ? req.json_data.token : ''; //lay them tu json_data post
  req.token = req.token ? req.token : token; // uu tien token truyen trong json gan truoc do
  if (req.token) {
    req.token = req.token.startsWith('Bearer ') ? req.token.slice(7) : req.token;
    next();
  } else {
    next();
  }
}

/**
 * 
 * @param {*} req 
 */


/**
 * req = {user:{username...}} | {json_data:{}} | proxy {user:{},origin} 
 * @param {*} req     biến vào request chứa thông tin tham số xử lý
 * @param {*} expires Thời gian hiệu lực
 * @param {*} isProxy   Tạo token xác thực bất kỳ đâu (cấp cho origin) - authentication server # resource server
 * 
 * return token ==> chuyen giao cho client web
 */
var tokenSign = (req, expires, isProxy) => {

  let GMTOffsetTimezone = new Date().getTimezoneOffset();

  let GMT_time = new Date().getTime() + GMTOffsetTimezone * 60 * 1000;
  //let secret = jwtConfig.secret + req.clientIp + req.headers["user-agent"] + GMT_time;
  let secret = jwtConfig.secret + req.clientIp + req.clientDevice + GMT_time;

  if (req.user && req.user.username) {
    if (req.origin && isProxy) {
      secret = jwtConfig.secret + GMT_time;
      //console.log('-->Sign level 2 in '+(expires?expires:'24h')+' for', req.user.username, req.origin);
      return jwt.sign({
        username: req.user.username,
        origin: req.origin, //chung thuc cap cho website nay truy van
        req_device: req.clientDevice,//req.headers["user-agent"], //cap cho user device
        req_ip: req.clientIp, //cap cho user ip nay thoi, neu doi ip se khong xac thuc duoc
        nickname: req.user.nickname ? req.user.nickname : undefined,
        image: req.user.image ? req.user.image : undefined,
        role: req.user.role ? req.user.role : undefined,
        level: 2, //cap do xac thuc
        local_time: GMT_time
      },
        secret,
        {
          expiresIn: expires ? expires : '24h' // expires in 1 day
        });
    } else {
      //console.log('-->Sign level 1 in 24h for ', req.user.username);
      return jwt.sign({
        username: req.user.username,
        nickname: req.user.nickname ? req.user.nickname : undefined,
        image: req.user.image ? req.user.image : undefined,
        role: req.user.role ? req.user.role : undefined,
        level: 1, //cap do xac thuc
        local_time: GMT_time
      },
        secret,
        {
          expiresIn: expires ? expires : '24h' // expires in 24 hours
        });
    }
  } else if (req.json_data && req.json_data.phone && req.json_data.key) {
    secret += req.json_data.key;
    //console.log('-->Sign level 3 in 1h for phone number: ', req.json_data.phone);
    return jwt.sign({
      username: req.json_data.phone,
      req_device: req.clientDevice,//req.headers["user-agent"],
      level: 3, //cap do xac thuc
      local_time: GMT_time
    },
      secret
      , {
        expiresIn: '1h' // expires in 1 hours
      }
    );
  } else {
    //console.log('-->Sign level 4 in 1h for device ', req.headers["user-agent"]);
    return jwt.sign({
      req_device: req.clientDevice, //req.headers["user-agent"],
      level: 4, //cap do xac thuc
      local_time: GMT_time
    },
      secret
      , {
        expiresIn: '1h' // expires in 1 hours
      }
    );
  }
}

/**
 * input: req = {token:'...'}
 * return true or false
 * @param req 
 */

/**
 * verify token signed with level
 * 
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
var tokenVerify = (req, res, next) => {

  if (req.token) {
    let token = req.token;
    let userInfo = getInfoFromToken(token);

    let GMT_time = userInfo ? userInfo.local_time : '';
    let otpKey = req.keyOTP ? req.keyOTP : '';
    let level = userInfo ? userInfo.level : 4;

    //var secret =  jwtConfig.secret + req.clientIp + req.headers["user-agent"] + GMT_time;
    var secret = jwtConfig.secret + req.clientIp + req.clientDevice + GMT_time;

    if (level === 1) {
      secret = jwtConfig.secret + req.clientIp + req.clientDevice + GMT_time;
      //secret =  jwtConfig.secret + req.clientIp + req.headers["user-agent"] + GMT_time;
    } else if (level === 2) {
      secret = (jwtConfig.secret + GMT_time);
    } else if (level === 3) {
      secret += otpKey;
    } else if (level === 4) {
      secret = (jwtConfig.secret + GMT_time);
    }

    //console.log('-->Verify token level ' + (level?level:4));

    jwt.verify(token
      , secret
      , (err, decoded) => {
        if (err) {

          //console.log('-->Token Error', token, err );

          res.writeHead(403, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ message: 'token INVALID!', error: err }));

        } else {

          req.user = decoded;
          next();

        };
      })

  } else {
    res.writeHead(403, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ message: 'no token in req.token!' }));
  }
};

var tokenVerifyNext = (req, res, next) => {

  if (req.token) {
    let token = req.token;
    let userInfo = getInfoFromToken(token);
    let GMT_time = userInfo ? userInfo.local_time : '';
    let otpKey = req.keyOTP ? req.keyOTP : '';
    let level = userInfo ? userInfo.level : 4;

    //var secret =  jwtConfig.secret + req.clientIp + req.headers["user-agent"] + GMT_time;
    var secret = jwtConfig.secret + req.clientIp + req.clientDevice + GMT_time;

    if (level === 1) {
      secret = jwtConfig.secret + req.clientIp + req.clientDevice + GMT_time;
      //secret =  jwtConfig.secret + req.clientIp + req.headers["user-agent"] + GMT_time;
    } else if (level === 2) {
      secret = (jwtConfig.secret + GMT_time);
    } else if (level === 3) {
      secret += otpKey;
    } else if (level === 4) {
      secret = (jwtConfig.secret + GMT_time);
    }
    jwt.verify(token
      , secret
      , (err, decoded) => {
        if (err) {
          next()
        } else {
          req.user = decoded;
          next();
        };
      })
  } else {
    next()
  }
};


module.exports = {
  getToken,
  getTokenNext, //tra ve req.token next() neu khong co
  tokenSign, //ky thong tin thanh token
  tokenVerify,
  tokenVerifyNext, //tra ve next() voi moi truong hop, buoc tiep kiem tra req.user
  getInfoFromToken
};