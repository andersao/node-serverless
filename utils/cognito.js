const axios = require('axios');
const AWS = require('aws-sdk');
const jwkToPem = require('jwk-to-pem');

const cognitoIssuer = `https://cognito-idp.us-east-1.amazonaws.com/${process.env.COGNITO_USER_POOL_ID}`;

const cognitoIdentityProvider = new AWS.CognitoIdentityServiceProvider({
  region: 'us-east-1',
});

const cognitoUserPoolParams = {
  ClientId: process.env.COGNITO_CLIENT_ID,
  UserPoolId: process.env.COGNITO_USER_POOL_ID,
};

async function getPublicKey() {
  const url = `${cognitoIssuer}/.well-known/jwks.json`;
  const response = await axios.get(url);
  return jwkToPem(response.data.keys[1]);
}

async function authenticate(email, password) {
  const params = {
    ...cognitoUserPoolParams,
    AuthFlow: 'ADMIN_NO_SRP_AUTH',
    AuthParameters: {
      USERNAME: email,
      PASSWORD: password,
    },
  };

  const data = await cognitoIdentityProvider.adminInitiateAuth(params).promise();

  return data.ChallengeName !== 'NEW_PASSWORD_REQUIRED'
    ? {
      accessToken: data.AuthenticationResult.AccessToken,
      refreshToken: data.AuthenticationResult.RefreshToken,
      expiresIn: data.AuthenticationResult.ExpiresIn,
    }
    : data;
}

async function getUser(username) {
  const params = {
    UserPoolId: cognitoUserPoolParams.UserPoolId,
    Username: username,
  };

  return cognitoIdentityProvider.adminGetUser(params).promise();
}

async function updateUserAttributes(username, attrs) {
  const params = {
    UserPoolId: cognitoUserPoolParams.UserPoolId,
    Username: username,
    UserAttributes: Object.keys(attrs).reduce((arr, key) => {
      arr.push({
        Name: key,
        Value: String(attrs[key]).trim(),
      });
      return arr;
    }, []),
  };

  return cognitoIdentityProvider.adminUpdateUserAttributes(params).promise();
}

async function deleteUser(username) {
  const params = {
    UserPoolId: cognitoUserPoolParams.UserPoolId,
    Username: username,
  };

  return cognitoIdentityProvider.adminDeleteUser(params).promise();
}

async function createUser(payload) {
  const { email, senha } = payload;
  const attrs = Object.keys(payload);
  const userAttrs = attrs.reduce(
    (arr, key) => {
      arr.push({
        Name: key,
        Value: String(payload[key]).trim(),
      });

      return arr;
    },
    [{ Name: 'email_verified', Value: 'true' }],
  );

  const params = {
    UserPoolId: cognitoUserPoolParams.UserPoolId,
    Username: String(email).trim().toLowerCase(),
    UserAttributes: userAttrs,
    DesiredDeliveryMediums: ['EMAIL'],
    ...(senha ? { TemporaryPassword: senha } : {}),
  };

  try {
    return await cognitoIdentityProvider.adminCreateUser(params).promise();
  } catch (error) {
    switch (error.code) {
      case 'UsernameExistsException':
        throw {
          name: 'ConflictError',
          message: 'Usuário já existente',
        };
      default:
        throw {
          name: 'InternalServerError',
          message: error.name || 'Erro interno',
        };
    }
  }
}


module.exports = {
  createUser,
  getUser,
  updateUserAttributes,
  deleteUser,
  authenticate,
  getPublicKey,
};
