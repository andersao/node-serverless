const moment = require('moment');

const PNM_DEBUG = process.env.PNM_DEBUG || false;

/* eslint-disable no-undef */
/* eslint-disable no-console */
module.exports = {
  debug: (message) => {
    if (PNM_DEBUG) console.debug(message);
  },
  time: async (name, action) => {
    if (PNM_DEBUG) {
      console.time(name);
      const result = await action();
      console.timeEnd(name);
      return result;
    }

    return action();
  },
  timestamp: (message) => {
    if (PNM_DEBUG) console.debug(`[${message}] ${moment().format('YYYY-MM-DD HH:mm:ss')}`);
  },
};
