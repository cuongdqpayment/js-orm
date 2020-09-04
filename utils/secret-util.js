"use strict"

/**
 * ver 5.0 bỏ RSA không dùng node-rsa vì không dùng được trên client
 * Sử dụng gói rsa-service.js cùng với jsencrypt.js cho đồng nhất giữa client và server
 * 
 * version 4.0
 * Ngày 23/09/2019
 * Sử dụng mã hóa SHA256 cùng client
 * let CryptoJS  = require("crypto-js"); 
 * 
 * 
 * version 2.0
 * Ngày 10/09/2019
 * 
 * + Thêm hàm băm sha256
 * Dùng để băm mật khẩu lưu vào csdl hoặc bộ nhớ
 * Dùng để kiểm tra mật khẩu đúng không
 * 
 * + Thêm hàm mã hóa dữ liệu bằng mật khẩu riêng
 * Nhập đúng mật khẩu sẽ giải mã được dữ liệu
 * Nếu không đúng mật khẩu thì dữ liệu không được giải mã
 * 
 * 
 * version 1.0
 * cuongdq
 * create 01/05/2019
 * 
 * Các thuật toán mã hóa, giải mã, ký và chứng thực
 * 
 */

//import CryptoJS from "crypto-js"; //cho web ES6
let CryptoJS = require("crypto-js");

//import SimpleCrypto from "simple-crypto-js"; //cho web ES6
const SimpleCrypto = require("simple-crypto-js").default; //cho nodejs ES5

/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
class SecretHandler {
    /**
     *  
     * Mã hóa dữ liệu bằng thuật toán cryto
     * Với mật khẩu mã hóa người dùng tự đặt,
     * 
     * 
     * @param {*} textData 
     * @param {*} password 
     */
    encryptTextCypto(textData, password) {
        let simpleCrypto = new SimpleCrypto(password);
        return simpleCrypto.encrypt(textData);
    }

    /**
     * 
     * giải mã dữ liệu bằng crypto
     * 
     * @param {*} strEncrypted 
     * @param {*} password 
     */
    decryptTextCrypto(strEncrypted, password) {
        try {
            let simpleCrypto = new SimpleCrypto(password);
            return simpleCrypto.decrypt(strEncrypted);
        } catch (e) { }
        //trường hợp giải mã bị lỗi thì trả về một số random nhé
        return "can-not-decryptTextCrypto"; // trả về chuỗi false là không giải mã được
    }

    /**
     * Mã hóa một chiều sha256
     * Cho chuỗi bất kỳ, kể cả unicode
     * 
     * Sử dụng để băm chuỗi mật khẩu lưu vào cơ sở dữ liệu
     * 
     * @param {*} unicodeData 
     */
    sha256(unicodeData) {
        var words = CryptoJS.SHA256(unicodeData);
        var base64 = CryptoJS.enc.Base64.stringify(words);
        return base64;
    }


    /**
     * Hàm chuyển đổi utf8 --> Hex
     * @param str 
     */
    Utf8toHex(utf8) {
        var words = CryptoJS.enc.Utf8.parse(utf8);
        var hex = CryptoJS.enc.Hex.stringify(words);
        return hex;
    }


    /**
     * Chuyển đổi hex --> utf8
     * @param hex 
     */
    HextoUtf8(hex) {
        var words = CryptoJS.enc.Hex.parse(hex);
        var utf8 = CryptoJS.enc.Utf8.stringify(words);
        return utf8;
    }


    /**
     * Hàm chuyển đổi utf8 --> base64
     * @param str 
     */
    Utf8toBase64(utf8) {
        var words = CryptoJS.enc.Utf8.parse(utf8);
        var base64 = CryptoJS.enc.Base64.stringify(words);
        return base64;
    }

    /**
     * Chuyển đổi base64 --> utf8
     * @param base64 
     */
    Base64toUtf8(base64) {
        var words = CryptoJS.enc.Base64.parse(base64);
        var utf8 = CryptoJS.enc.Utf8.stringify(words);
        return utf8;
    }

}

module.exports = new SecretHandler()



