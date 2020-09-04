"use strict"

const NodeRSA = require('node-rsa');
const CryptoJS = require('crypto-js');

class RsaHandler {

    generatorKeyPair() {
        const key = new NodeRSA({ b: 512 }, { signingScheme: 'pkcs1-sha256' });
        const publicKey = key.exportKey("public").replace('-----BEGIN PUBLIC KEY-----\n', '').replace('-----END PUBLIC KEY-----', '').replace(/[\n\r]/g, '');
        const privateKey = key.exportKey("private").replace('-----BEGIN RSA PRIVATE KEY-----\n', '').replace('-----END RSA PRIVATE KEY-----', '').replace(/[\n\r]/g, '');
        return { id: publicKey, key: privateKey }
    }

    importKey(keySave, keyType) {
        const rsaKey = new NodeRSA(null, { signingScheme: 'pkcs1-sha256' });
        try {
            if (keyType === 'private') {
                rsaKey.importKey('-----BEGIN RSA PRIVATE KEY-----\n' + keySave.key + '\n-----END RSA PRIVATE KEY-----');
            } else {
                rsaKey.importKey('-----BEGIN PUBLIC KEY-----\n' + keySave.id + '\n-----END PUBLIC KEY-----');
            }
            return rsaKey;
        } catch (e) {
            return null;
        }
    }

    signObject(obj, privateKey) {
        let data = typeof obj === "object" ? JSON.stringify(obj) : obj;
        let rsaKey = this.importKey({ key: privateKey }, 'private')
        if (rsaKey && data) {
            return rsaKey.sign(data, 'base64', 'utf8');
        }
        return null;
    }

    verifyObject(obj, signature, publicKey) {
        let data = typeof obj === "object" ? JSON.stringify(obj) : obj;
        let rsaKey = this.importKey({ id: publicKey }, 'public')
        if (rsaKey && data) {
            return rsaKey.verify(data, signature, 'utf8', 'base64');
        }
        return false;
    }


    encryptObject(obj, privateKey, publicKey) {
        let rsaKey = this.importKey({ id: publicKey, key: privateKey }, (privateKey ? 'private' : 'public'))
        if (rsaKey) {
            if (privateKey) {
                return rsaKey.encryptPrivate(JSON.stringify(obj), 'base64', 'utf8');
            } else {
                return rsaKey.encrypt(JSON.stringify(obj), 'base64', 'utf8');
            }
        }
        return null;
    }

    decryptObject(obj, privateKey, publicKey) {
        let rsaKey = this.importKey({ id: publicKey, key: privateKey }, (privateKey ? 'private' : 'public'))
        if (rsaKey) {
            if (privateKey) {
                return rsaKey.decrypt(JSON.stringify(obj), 'base64', 'utf8');
            } else {
                return rsaKey.decryptPublic(JSON.stringify(obj), 'base64', 'utf8');
            }
        }
        return null;
    }
}

module.exports = new RsaHandler()



