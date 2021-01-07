/* eslint-disable no-console */
/* eslint-disable consistent-return */
/* eslint-disable no-param-reassign */
const _ = require('lodash');

module.exports = async ({ request }) => {
  try {
    if (process.env.API_KEY) {
      const apiKey = _.result(request, 'headers.x-api-key');

      if (!apiKey) {
        throw {
          name: 'ForbiddenError',
          message: 'Token não informado',
        };
      }

      if (apiKey !== process.env.API_KEY) {
        throw {
          name: 'ForbiddenError',
          message: 'Token inválido',
        };
      }
    }

    return true;
  } catch (error) {
    switch (error.name) {
      case 'TokenExpiredError':
        throw {
          name: 'ForbiddenError',
          message: 'Token Expirado',
        };
      case 'JsonWebTokenError':
        throw {
          name: 'ForbiddenError',
          message: 'Token inválido',
        };
      default:
        throw error;
    }
  }
};
