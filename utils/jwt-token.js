const jwt = require("jsonwebtoken");

const config = {
  SESSION: {
    jwtSecret: 'Mobifone3-m-Inovation-2020-02-15',
    expiresIn: '120d'
  }
}

const jwtToken = (data = {}) => {
    try {
        return jwt.sign(data, config.SESSION.jwtSecret, {expiresIn:config.SESSION.expiresIn});
    } catch {
        return null;
    }
}

const pareJwtToken = (token) => {
    try {
        return jwt.verify(token, config.SESSION.jwtSecret);
    } catch {
        return null;
    }
}

module.exports = {
  jwtToken,
  pareJwtToken
}