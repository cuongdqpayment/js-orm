"use strict"

const request = require('request');
const nodemailer = require('nodemailer');

/**
 * Gui tin nhan den so dien thoai di dong
 * @param {*} phone 903500888
 * @param {*} sms 
 */
const sendSms = (phone, sms, cfg) => {
    return new Promise((resolve, reject) => {
        // err Error: write EPROTO 3188:error:1425F102:SSL routines:ssl_choose_client_version:unsupported protocol:c:\ws\deps\openssl\openssl\ssl\statem\statem_lib.c:1929
        // node --tls-min-v1.0 ...
        request.post({
            headers: { 'content-type': 'application/json' },
            url: cfg ? cfg.link : 'https://demo.send.sms/',
            body: JSON.stringify({
                phone: phone
                , sms: sms
                , token: cfg ? cfg.token : ''
            })
        }, function (error, response, body) {
            if (error) {
                //   console.log(new Date().toUTCString(), 'Error send sms: ', error);
                reject(error);
            } else {
                // console.log(new Date().toUTCString(), 'KQ gui sms: ', body);
                let msg;
                try {
                    msg = JSON.parse(JSON.parse(body));
                } catch (e) {
                    msg = body;
                }
                if (msg && msg.status === 1) {
                    resolve(msg.message);
                } else {
                    reject(msg && msg.message ? msg.message : msg);
                }
            }
        });
    })
}


/**
 * 
 * @param {*} receiver // 'cuongdq3500888@gmail.com'
 * @param {*} subject  // 'test'
 * @param {*} content  // 'your active link or otp'
 * @param {*} config    // ' config mail server
 * @param {*} from      // ' from mail to send
 * {
            host: 'email.mobifone.vn',
            secureConnection: false, // TLS requires secureConnection to be false
            port: 587, // port for secure SMTP
            tls: {
                ciphers: 'SSLv3'
            },
            requireTLS: true,
            auth: {
                user: 'cuong.dq@mobifone.vn',
                pass: 'abc@123'
            }
        }
 */
const sendEmail = (receiver, subject, content, config, from) => {

    return new Promise((resolve, reject) => {

        // cấu hình mail server kiểu của gmail default
        let configServer = config || {
            host: 'smtp.gmail.com',
            port: 465,
            secure: true, // use SSL
            auth: {
                user: 'auth.service.888@gmail.com',
                pass: 'Short35x8$NoReply'
            }
        };

        // 
        let mailOptions = {
            from: from ? from : (configServer.auth && configServer.auth.user ? configServer.auth.user : 'no_reply@gmail.com'),
            to: receiver,
            subject: subject,
            html: content
            // text: content
        };

        let transporter = nodemailer.createTransport(configServer);

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                // console.log('error', error.message);
                reject(error.message)
            } else {
                // console.log('success', info);
                resolve(info.response);
            }
        });
    });

}

module.exports = {
    sendSms: sendSms,
    sendEmail: sendEmail
}