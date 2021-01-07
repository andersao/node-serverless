/* eslint-disable no-console */
/* eslint-disable no-param-reassign */
const _ = require('lodash');
const crypto = require('crypto');
const logger = require('./logger');

function md5(text) {
  if (_.isNil(text)) return undefined;
  return crypto.createHash('md5').update(text).digest('hex');
}

module.exports = {
  time: logger.time,
  md5,
};
