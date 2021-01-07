/* eslint-disable no-unused-vars */
/* eslint-disable no-param-reassign */
const jwt = require('jsonwebtoken');
const cognito = require('./cognito');

const { APP_SECRET } = process.env;

module.exports = class JWT {
  static async verifyCognito(token) {
    const pem = await cognito.getPublicKey();
    return new Promise((resolve, reject) => {
      jwt.verify(token, pem, { algorithms: ['RS256'] }, (err, decoded) => {
        if (err) return reject(err);
        return resolve(decoded);
      });
    });
  }

  static async verify(token) {
    const verificationResult = jwt.verify(token, APP_SECRET);
    const { data } = verificationResult;
    return data;
  }

  static async sign(payload) {
    return jwt.sign({ data: payload }, APP_SECRET);
  }
};
