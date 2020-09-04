var QRCode = require('qrcode')

const toQRCodeURL = (str) => {
    return new Promise((resolve, reject) => {
        QRCode.toDataURL(str, (err, url) => {
            if (err) {
                reject(err)
            }
            resolve(url)
        })
    })
}

module.exports = {
    toQRCodeURL
}