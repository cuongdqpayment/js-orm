/**
 * Các hằng số về regex mẫu
 */
const NUMBER_REG = /^[0-9]*$/
const VN_MOBILE_NUMBER_REG = /^[0]{1}[3456789]{1}[0-9]{8}$/
const EMAIL_REG = /(([a-zA-Z0-9\-\_\.])+@[a-zA-Z\_]+?(\.[a-zA-Z]{2,6})+)/gim
const WEB_LINK_REG = /((https?|ftp):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gim
const EMAIL_MOBIFONE_REG = /([a-zA-Z0-9\-\_\.])+@mobifone.vn/gim

module.exports = {
    NUMBER_REG,
    VN_MOBILE_NUMBER_REG,
    WEB_LINK_REG,
    EMAIL_REG,
    EMAIL_MOBIFONE_REG
}