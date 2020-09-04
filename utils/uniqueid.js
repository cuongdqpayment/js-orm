const shortid = require('shortid');
shortid.characters('0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ@$');

const createShortId = () => {
  return shortid.generate();
}

const isValidShortId = (id) => {
  return shortid.isValid(id);
}

module.exports = {
  createShortId,
  isValidShortId
}
