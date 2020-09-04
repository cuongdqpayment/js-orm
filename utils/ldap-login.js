/**
 * Class Ldap kết nối ldap server, xác thực và trả về token
 * Khi dùng, 
 * - Khai báo cấu hình ldap ở file ./cfg/ldap-cfg.js 
 * 
 * - Nhúng class này vào nơi cần dùng: vd: ldapLogin = require("./utils/ldap-login") 
 * 
 * - gọi ldapLogin.login()
 * User test thử
 * var email = 'm-bill.c3@mobifone.vn'  hoặc nhập m-bill3 không có @mobifone.vn
 * var password = 'Abcxyz@12345'
 * 
 * - Kết quả trả về là: nếu login thành công sẽ trả về: user.username, nếu ko thì trả về undefined
 * 
 */

// sử dụng thành phần này để bind và unbind ldap
const ldap = require("ldapjs");

const { ldapServerUrl, domainNameEmail, connectTimeout } = require("../cfg/ldap-cfg");

// đây là hàm thực tế xác thực ldap mobifone
const loginLdapMobifone = (usernameOrEmail, password, ldapUrl, domainWithAtSign, connTimeout) =>
  new Promise((rs, rj) => {

    // gán cấu hình trước nếu có
    let url = ldapUrl || ldapServerUrl;
    let domain = domainWithAtSign || domainNameEmail;
    let timeout = connTimeout || connectTimeout || 5000;

    var client = ldap.createClient({
      url: url,
      reconnect: true,         // cho kết nối lại tránh lỗi tự dừng nếu ko ll được ldap
      connectTimeout: timeout, // khai bao trong 3 giây sẽ timeout phun ra lỗi ở bind
    });
    // thực hiện kiểm tra ldap trong 2 giây
    // thực hiện bind -- nếu thành công thì login thành công
    let email =
      usernameOrEmail.indexOf("@") > 0
        ? usernameOrEmail
        : (usernameOrEmail += domain);
    // nếu ko thành công thì login fail
    client.bind(email, password, function (err) {
      if (err) {
        console.log(
          `LDAP Bind to ${url} failed with error: ${
          err.lde_message || err || "Unknow"
          }`
        );
        // error for login or timeout connect to LDAP
        rj(new Error("Email or password invalid!"));
      } else {
        rs({
          username: usernameOrEmail,
        });
      }

      try {
        // trả lại phiên kết nối cổng ldap
        client.unbind((err) => {
          client.destroy(); // đóng connection lại
        });
      } catch { }
    });
  });

// Đây là hàm giả lập login email ldap thành công
const fakeLoginLdap = (email, password) =>
  new Promise((rs, rj) => {
    setTimeout(() => {
      if (email === "cuong.dq" && password == "1") {
        rs({
          username: email,
        });
      } else {
        rj(new Error("Email or password invalid!"));
      }
    }, 2000);
  });

// xuất bản hàm login bởi ldap, gồm có: 
/**
 * 
  username, pass   
  , ldapUrl: 'ldap://<host/ip>:<port>'
  , domainWithAtSign: '@<domain>'
  , connectTimeout: <millisecond>
 */
module.exports = {
  login: (username, password, ldapUrl, domainWithAtSign, connTimeout) => {
    // cắt lấy user không thôi, không cho nhập @ vào username
    return new Promise(async (rs) => {
      try {
        const nameMatch = username.match(/^([^@]*)@/);
        let shortName = nameMatch ? nameMatch[1] : username;
        // let user = await fakeLoginLdap(shortName, password)
        let user = await loginLdapMobifone(shortName, password, ldapUrl, domainWithAtSign, connTimeout);
        rs(user);
      } catch (e) {
        // console.log('Xác thực không đúng', e)
        rs();
      }
    })
  }
}
