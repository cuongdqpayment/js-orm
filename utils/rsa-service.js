/**
 * dịch vụ cung cấp chứng thực, ký, mã hóa và giải mã, cấp khóa RSA
 * 
 * ver 3.1 fix getKeyPair
 * 
 * ver 3.0 ngày 27/06/2020 signToken, verifyToken, getKeyPair
 * 
 * Hàm xử lý tạo RSA, mã hóa, giải mã, ký và chứng thực chữ ký
 * đồng nhất hàm giữa client và server nodejs và angular-ionic-javascript
 */
// you can try this, it works
// global.navigator = {appName: 'nodejs'}; // fake the navigator object
// global.window = {}; // fake the window object

// các hàm cơ bản
const arrObj = require('./array-object')
// hàm mã hóa crypto
const CryptoJS = require('crypto-js');
// hàm mã hóa rsa
const JSEncrypt = require('./jsencrypt').default
// các hàm mã hóa kênh truyền
const secUtil = require('./secret-util')

const keyPair = { id: undefined, key: undefined, created_time: undefined }

const generatorKeyPair = () => {
    return new Promise(rs => {
        let encrypt = new JSEncrypt({
            default_key_size: 512
            , default_public_exponent: '010001'
        });
        encrypt.getKey(() => {
            keyPair.id = encrypt.getPublicKey().replace('-----BEGIN PUBLIC KEY-----\n', '').replace('-----END PUBLIC KEY-----', '').replace(/[\n\r]/g, '');
            keyPair.key = encrypt.getPrivateKey().replace('-----BEGIN RSA PRIVATE KEY-----\n', '').replace('-----END RSA PRIVATE KEY-----', '').replace(/[\n\r]/g, '');
            keyPair.created_time = arrObj.getTimestamp();
            rs(keyPair)
        })
    })
}

const importKey = (keySave, keyType) => {
    const rsaKey = new JSEncrypt();
    try {
        if (keyType === 'private') {
            rsaKey.setKey('-----BEGIN RSA PRIVATE KEY-----\n' + keySave.key + '\n-----END RSA PRIVATE KEY-----');
        } else {
            rsaKey.setKey('-----BEGIN PUBLIC KEY-----\n' + keySave.id + '\n-----END PUBLIC KEY-----');
        }
        return rsaKey;
    } catch (e) {
        return null;
    }
}

// Trả thông tin khóa public_key
const getPublicKey = (id) => {
    return '-----BEGIN PUBLIC KEY-----\n' + id + '\n-----END PUBLIC KEY-----'
}

// Trả thông tin mã private_key
const getPrivateKey = (key) => {
    return '-----BEGIN RSA PRIVATE KEY-----\n' + key + '\n-----END RSA PRIVATE KEY-----'
}

const signObject = (obj, privateKey) => {
    let data = typeof obj === "object" ? JSON.stringify(obj) : obj;
    let rsaKey = importKey({ key: privateKey || keyPair.key }, 'private')
    if (rsaKey && data) {
        // rsaK
        // console.log("RSA KEY", privateKey, rsaKey, data);
        return rsaKey.sign(data, CryptoJS.SHA256);
    }
    return null;
}

const verifyObject = (obj, signature, publicKey) => {
    let data = typeof obj === "object" ? JSON.stringify(obj) : obj;
    let rsaKey = importKey({ id: publicKey || keyPair.id }, 'public')
    if (rsaKey && data) {
        return rsaKey.verify(data, signature, CryptoJS.SHA256);
    }
    return false;
}


const encryptObject = (obj, publicKey) => {
    let data = typeof obj === "object" ? JSON.stringify(obj) : obj;
    let rsaKey = importKey({ id: publicKey || keyPair.id }, 'public')
    if (rsaKey && data) {
        return rsaKey.encrypt(data);
    }
    return null;
}

const decryptObject = (obj, privateKey) => {
    let data = typeof obj === "object" ? JSON.stringify(obj) : obj;
    let rsaKey = importKey({ key: privateKey || keyPair.key }, 'private')
    if (rsaKey && data) {
        return rsaKey.decrypt(data);
    }
    return null;
}


// ký tạo token (như jwt)
const signToken = (obj, privateKey, expiresIn) => {
    // xử lý hàm expiresIn từ d,h,m=>ms
    let expChar = expiresIn && expiresIn.length ? expiresIn.substr(expiresIn.length - 1) : undefined;
    let exp = expiresIn && expiresIn.length ? expiresIn.match(/\d+/g).map(Number).shift() : !isNaN(expiresIn) ? expiresIn : undefined;

    let data = {
        ...obj
        , iat: Date.now()
    }
    if (exp) {
        if (expChar === "d")
            exp *= 24 * 60 * 60 * 1000
        if (expChar === "h")
            exp *= 60 * 60 * 1000
        if (expChar === "m")
            exp *= 60 * 1000
        if (expChar === "s")
            exp *= 1000
        data.exp = (Date.now() + exp)
    }
    let signature = signObject(data, privateKey)
    // đổi chữ ký sang base64 để có thể truyền ở trên query ? được nhé
    return secUtil.Utf8toBase64(JSON.stringify(data)) + "." + secUtil.Utf8toBase64(signature)
}

// chứng thực trả về data nếu chứng thực thành công
// nếu lỗi thì trả về mã lỗi
const verifyToken = (token, publicKey) => {
    let verified, data;
    try {
        let base64Data = token.split(".").shift()
        let signatureBase64 = token.split(".").pop()
        let signature = secUtil.Base64toUtf8(signatureBase64)
        data = JSON.parse(secUtil.Base64toUtf8(base64Data))
        verified = verifyObject(data, signature, publicKey)
    } catch{ }
    if (verified) {
        // kiểm tra thời gian hiệu lực
        if (!data.exp || data.exp > Date.now())
            return data
        else
            throw "Token Expired"
    }
    throw "Invalid token"
}


// trả về cặp khóa
const getKeyPair = () => {
    return keyPair;
}

// khởi tạo một cặp key default khi khởi động
generatorKeyPair()
    .then(data => {
        // console.log(`KeyPair created on ${keyPair.created_time} with id = ${keyPair.id}`);
        return keyPair;
    })

module.exports = {
    getKeyPair,
    generatorKeyPair,
    getPublicKey,
    getPrivateKey,
    signObject,
    verifyObject,
    encryptObject,
    decryptObject,
    signToken,
    verifyToken
}
