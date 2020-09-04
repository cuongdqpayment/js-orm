const cfg = require('./constants')

const getUserFromEmail = (email) => {
    var nameMatch = email.match(/^([^@]*)@/);
    return nameMatch ? nameMatch[1] : undefined;
}

module.exports = {
    isMobileNumber: (str) => cfg.VN_MOBILE_NUMBER_REG.test(str)
    , isEmail: (str) => str && str.indexOf("@") > 0 ? true : false //cfg.EMAIL_REG.test(str)
    , isEmailMobifone: (str) => str && str.toLowerCase().indexOf("@mobifone.vn") > 0 ? true : false // cfg.EMAIL_MOBIFONE_REG.test(str)
    , isWebLink: (str) => cfg.WEB_LINK_REG.test(str)
    , getUserFromEmail
}